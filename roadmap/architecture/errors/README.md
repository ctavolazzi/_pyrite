# Error Handling Strategies

**Comprehensive error taxonomy and handling patterns for Pyrite.**

## Error Hierarchy

```
Error (Base)
├── DomainError (Business logic violations)
│   ├── ValidationError
│   ├── StateTransitionError
│   ├── InvariantViolationError
│   └── BusinessRuleViolationError
├── ApplicationError (Use case failures)
│   ├── NotFoundError
│   ├── ConflictError
│   └── UnauthorizedError
├── InfrastructureError (Technical failures)
│   ├── DatabaseError
│   ├── FileSystemError
│   ├── NetworkError
│   └── ExternalServiceError
└── PresentationError (API/UI errors)
    ├── BadRequestError
    ├── RateLimitError
    └── SerializationError
```

## Custom Error Classes

**File**: `src/domain/errors.js`
```javascript
/**
 * Base Domain Error
 */
class DomainError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    this.timestamp = Date.now();

    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

/**
 * Validation Error
 */
class ValidationError extends DomainError {
  constructor(field, message, details = {}) {
    super(message, 'VALIDATION_FAILED', { field, ...details });
    this.field = field;
  }
}

/**
 * State Transition Error
 */
class StateTransitionError extends DomainError {
  constructor(from, to, reason) {
    super(
      `Invalid state transition from '${from}' to '${to}': ${reason}`,
      'INVALID_TRANSITION',
      { from, to, reason }
    );
    this.from = from;
    this.to = to;
  }
}

/**
 * Invariant Violation Error
 */
class InvariantViolationError extends DomainError {
  constructor(invariant, actualValue) {
    super(
      `Invariant violation: ${invariant}`,
      'INVARIANT_VIOLATION',
      { invariant, actualValue }
    );
  }
}

/**
 * Application Errors
 */
class NotFoundError extends Error {
  constructor(entityType, id) {
    super(`${entityType} not found: ${id}`);
    this.name = 'NotFoundError';
    this.entityType = entityType;
    this.id = id;
    this.code = 'NOT_FOUND';
    this.statusCode = 404;
  }
}

class ConflictError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ConflictError';
    this.details = details;
    this.code = 'CONFLICT';
    this.statusCode = 409;
  }
}

/**
 * Infrastructure Errors
 */
class DatabaseError extends Error {
  constructor(operation, cause) {
    super(`Database error during ${operation}: ${cause.message}`);
    this.name = 'DatabaseError';
    this.operation = operation;
    this.cause = cause;
    this.code = 'DATABASE_ERROR';
    this.statusCode = 500;
  }
}

module.exports = {
  DomainError,
  ValidationError,
  StateTransitionError,
  InvariantViolationError,
  NotFoundError,
  ConflictError,
  DatabaseError
};
```

## Error Handling Patterns

### 1. Result Type (Functional Error Handling)

```javascript
/**
 * Result type - Explicit success/failure
 * No exceptions thrown
 */

class Result {
  static ok(value) {
    return { ok: true, value };
  }

  static err(error) {
    return { ok: false, error };
  }

  static fromPromise(promise) {
    return promise
      .then(value => Result.ok(value))
      .catch(error => Result.err(error));
  }
}

// Usage in domain
class WorkEffort {
  updateProgress(newProgress) {
    // Validate
    if (newProgress < 0 || newProgress > 100) {
      return Result.err(
        new ValidationError('progress', 'Progress must be 0-100')
      );
    }

    if (this.status === 'completed') {
      return Result.err(
        new StateTransitionError(this.status, 'updating', 'Cannot modify completed work effort')
      );
    }

    // Apply change
    this.progress = newProgress;

    return Result.ok(this);
  }
}

// Usage in application layer
async function updateWorkEffortProgress(id, progress) {
  const workEffort = await repository.findById(id);

  if (!workEffort) {
    return Result.err(new NotFoundError('WorkEffort', id));
  }

  const result = workEffort.updateProgress(progress);

  if (!result.ok) {
    return result; // Propagate error
  }

  await repository.save(result.value);

  return Result.ok(result.value);
}

// Usage in API layer
router.patch('/work-efforts/:id', async (req, res) => {
  const result = await updateWorkEffortProgress(
    req.params.id,
    req.body.progress
  );

  if (!result.ok) {
    return res.status(result.error.statusCode || 400).json({
      error: result.error.toJSON ? result.error.toJSON() : {
        message: result.error.message
      }
    });
  }

  res.json({ data: result.value });
});
```

### 2. Try-Catch with Centralized Error Handler

```javascript
/**
 * Centralized error handling middleware
 */
function errorHandler(err, req, res, next) {
  // Log error
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(statusCode).json({
    error: {
      message: err.message,
      code: err.code || 'INTERNAL_ERROR',
      ...(isDevelopment && { stack: err.stack }),
      ...(err.details && { details: err.details })
    }
  });
}

// Apply to Express app
app.use(errorHandler);

// Async error wrapper
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Usage in routes
router.get('/work-efforts/:id', asyncHandler(async (req, res) => {
  const workEffort = await repository.findById(req.params.id);

  if (!workEffort) {
    throw new NotFoundError('WorkEffort', req.params.id);
  }

  res.json({ data: workEffort });
}));
```

### 3. Circuit Breaker Pattern

```javascript
/**
 * Circuit Breaker - Fail fast when external service is down
 */
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.cooldownPeriod = options.cooldownPeriod || 60000; // 1 minute
    this.requestTimeout = options.requestTimeout || 5000;

    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failures = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.cooldownPeriod) {
        // Try half-open
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), this.requestTimeout)
        )
      ]);

      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;

      if (this.successCount >= 3) {
        // Recovered, close circuit
        this.state = 'CLOSED';
        this.failures = 0;
      }
    } else {
      this.failures = 0;
    }
  }

  onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
}

// Usage
const githubBreaker = new CircuitBreaker({
  failureThreshold: 5,
  cooldownPeriod: 60000
});

async function createGitHubIssue(workEffort) {
  try {
    return await githubBreaker.execute(async () => {
      return await github.issues.create({
        title: workEffort.title,
        body: workEffort.description
      });
    });
  } catch (error) {
    if (error.message === 'Circuit breaker is OPEN') {
      logger.warn('GitHub service unavailable, circuit breaker OPEN');
      // Fallback: queue for later
      await queue.add('create-github-issue', workEffort);
    } else {
      throw error;
    }
  }
}
```

### 4. Retry Logic with Exponential Backoff

```javascript
/**
 * Retry with exponential backoff
 */
async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    factor = 2,
    shouldRetry = () => true
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      const delay = Math.min(
        initialDelay * Math.pow(factor, attempt),
        maxDelay
      );

      logger.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms`, {
        error: error.message
      });

      await sleep(delay);
    }
  }

  throw lastError;
}

// Usage
const workEffort = await retryWithBackoff(
  () => repository.findById(id),
  {
    maxRetries: 3,
    initialDelay: 1000,
    shouldRetry: (error) => {
      // Only retry on network errors, not validation errors
      return error.code === 'NETWORK_ERROR';
    }
  }
);
```

### 5. Graceful Degradation

```javascript
/**
 * Graceful degradation - Provide fallback when service fails
 */
async function getWorkEffortWithAnalytics(id) {
  const workEffort = await repository.findById(id);

  if (!workEffort) {
    throw new NotFoundError('WorkEffort', id);
  }

  // Try to enrich with analytics
  let analytics = null;
  try {
    analytics = await analyticsService.getMetrics(id);
  } catch (error) {
    logger.warn('Analytics service unavailable, returning basic data', {
      workEffortId: id,
      error: error.message
    });
    // Continue without analytics (graceful degradation)
  }

  return {
    ...workEffort,
    analytics: analytics || {
      velocity: null,
      predictedCompletion: null,
      available: false
    }
  };
}
```

## Error Recovery Strategies

### 1. Compensating Transactions

```javascript
/**
 * Saga pattern - Compensate on failure
 */
class CreateWorkEffortSaga {
  async execute(data) {
    const steps = [];

    try {
      // Step 1: Create work effort
      const workEffort = await repository.save(new WorkEffort(data));
      steps.push({ action: 'save', entity: workEffort });

      // Step 2: Create GitHub issue
      const issue = await github.issues.create({
        title: workEffort.title
      });
      steps.push({ action: 'github', issueNumber: issue.number });

      // Step 3: Send notification
      await notifications.send({
        to: data.assignee,
        subject: 'New work effort assigned'
      });
      steps.push({ action: 'notification' });

      return { ok: true, workEffort };
    } catch (error) {
      // Compensate in reverse order
      logger.error('Saga failed, compensating...', { error: error.message });

      for (let i = steps.length - 1; i >= 0; i--) {
        try {
          await this.compensate(steps[i]);
        } catch (compError) {
          logger.error('Compensation failed', {
            step: steps[i],
            error: compError.message
          });
        }
      }

      return { ok: false, error };
    }
  }

  async compensate(step) {
    switch (step.action) {
      case 'save':
        await repository.delete(step.entity.id);
        break;
      case 'github':
        await github.issues.close(step.issueNumber);
        break;
      case 'notification':
        // Can't unsend, log for manual review
        logger.warn('Cannot unsend notification', { step });
        break;
    }
  }
}
```

### 2. Dead Letter Queue

```javascript
/**
 * Dead letter queue - Store failed jobs for manual review
 */
class DeadLetterQueue {
  constructor(db) {
    this.db = db;
  }

  async add(job, error) {
    await this.db.insert('dead_letter_queue', {
      job_id: job.id,
      job_type: job.type,
      job_data: JSON.stringify(job.data),
      error_message: error.message,
      error_stack: error.stack,
      failed_at: Date.now(),
      attempts: job.attempts
    });

    logger.error('Job moved to dead letter queue', {
      jobId: job.id,
      jobType: job.type,
      error: error.message
    });
  }

  async list(limit = 100) {
    return await this.db.query(
      'SELECT * FROM dead_letter_queue ORDER BY failed_at DESC LIMIT ?',
      [limit]
    );
  }

  async retry(jobId) {
    const row = await this.db.query(
      'SELECT * FROM dead_letter_queue WHERE job_id = ?',
      [jobId]
    );

    if (!row[0]) {
      throw new NotFoundError('DeadLetterJob', jobId);
    }

    // Re-queue job
    await queue.add(row[0].job_type, JSON.parse(row[0].job_data));

    // Remove from dead letter queue
    await this.db.query('DELETE FROM dead_letter_queue WHERE job_id = ?', [jobId]);
  }
}
```

---

**All error handling follows these principles:**
1. **Fail Fast** - Detect errors early at boundaries
2. **Be Explicit** - Use Result types or custom error classes
3. **Log Everything** - Structured error logging
4. **Recover Gracefully** - Fallbacks and compensating transactions
5. **Don't Leak Details** - Hide stack traces in production
6. **Monitor Failures** - Dead letter queues and alerts

**Next**: Check the [Architecture Summary](../ARCHITECTURE_INDEX.md) for complete navigation.
