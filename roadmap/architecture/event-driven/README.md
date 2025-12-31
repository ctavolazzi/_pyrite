# Event-Driven Design (EDD)

**Complete event-driven architecture for Pyrite - from domain events to async processing.**

## Event-Driven Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Domain Layer                              │
│  ┌──────────────┐                                           │
│  │   Entity     │ ──► Domain Events (what happened)         │
│  └──────────────┘                                           │
└────────────┬────────────────────────────────────────────────┘
             │ publishes
             ↓
┌─────────────────────────────────────────────────────────────┐
│                   Event Bus (In-Memory)                      │
│  • Synchronous dispatch                                     │
│  • Pattern matching                                         │
│  • Middleware pipeline                                      │
└────────┬───────────────────────────────┬────────────────────┘
         │ broadcasts                    │
         ↓                               ↓
┌──────────────────┐           ┌──────────────────┐
│  Event Handlers  │           │  Event Handlers  │
│  (Sync)          │           │  (Async)         │
│  • UI Updates    │           │  • Send Email    │
│  • Cache Invalidation │      │  • Webhooks      │
│  • State Changes │           │  • Analytics     │
└──────────────────┘           └────────┬─────────┘
                                        │ enqueues
                                        ↓
                             ┌──────────────────────┐
                             │   Event Queue        │
                             │   (Persistent)       │
                             │   • Redis/RabbitMQ   │
                             │   • Retry logic      │
                             │   • Dead letter      │
                             └──────────────────────┘
```

## Event Types Taxonomy

### 1. Domain Events (What Happened)
**Immutable records of business events**

```javascript
/**
 * Domain Event - Past tense, immutable
 * Represents something that happened in the domain
 */
class DomainEvent {
  constructor(type, data) {
    this.type = type;               // Event type
    this.timestamp = Date.now();    // When it happened
    this.aggregateId = data.id;     // Which entity
    this.aggregateType = data.type; // Entity type
    this.version = data.version;    // For event sourcing
    this.data = Object.freeze(data);// Immutable payload
  }
}

// Example domain events
const WorkEffortStarted = (workEffort) => new DomainEvent('WorkEffortStarted', {
  id: workEffort.id,
  type: 'WorkEffort',
  version: workEffort.version,
  title: workEffort.title,
  startedAt: Date.now()
});

const ProgressUpdated = (workEffort, oldProgress, newProgress) => new DomainEvent('ProgressUpdated', {
  id: workEffort.id,
  type: 'WorkEffort',
  version: workEffort.version,
  oldProgress,
  newProgress,
  delta: newProgress - oldProgress
});

const WorkEffortCompleted = (workEffort) => new DomainEvent('WorkEffortCompleted', {
  id: workEffort.id,
  type: 'WorkEffort',
  version: workEffort.version,
  title: workEffort.title,
  completedAt: Date.now(),
  duration: Date.now() - workEffort.created.getTime()
});
```

### 2. Integration Events (External Communication)
**Events sent to external systems**

```javascript
/**
 * Integration Event - For cross-system communication
 * Stable schema, versioned, backwards compatible
 */
class IntegrationEvent {
  constructor(type, payload, metadata = {}) {
    this.eventId = generateUUID();
    this.eventType = type;
    this.eventVersion = '1.0';
    this.timestamp = new Date().toISOString();
    this.source = 'pyrite.work-efforts';
    this.payload = payload;
    this.metadata = {
      correlationId: metadata.correlationId || generateUUID(),
      causationId: metadata.causationId,
      userId: metadata.userId
    };
  }
}

// Example integration events
const WorkEffortCompletedEvent = (workEffort) => new IntegrationEvent(
  'work-effort.completed.v1',
  {
    workEffortId: workEffort.id,
    title: workEffort.title,
    completedAt: workEffort.completedAt.toISOString(),
    ticketCount: workEffort.tickets.length
  }
);
```

### 3. System Events (Infrastructure)
**Technical events (file changes, network, etc.)**

```javascript
/**
 * System Event - Infrastructure/technical events
 */
const FileChanged = (path, stats) => ({
  type: 'FileChanged',
  path,
  size: stats.size,
  modified: stats.mtimeMs,
  timestamp: Date.now()
});

const CacheInvalidated = (key, reason) => ({
  type: 'CacheInvalidated',
  key,
  reason,
  timestamp: Date.now()
});

const WebSocketConnected = (clientId, metadata) => ({
  type: 'WebSocketConnected',
  clientId,
  metadata,
  timestamp: Date.now()
});
```

## Event Bus Implementation

### Core Event Bus

```javascript
/**
 * Event Bus - Central message broker
 * Supports:
 * - Pattern matching (wildcards)
 * - Middleware pipeline
 * - Error isolation
 * - Async/sync handlers
 */
class EventBus {
  constructor() {
    this.handlers = new Map();      // event type → handlers[]
    this.middleware = [];            // middleware pipeline
    this.eventLog = [];              // event history (debug)
    this.metrics = {
      published: 0,
      delivered: 0,
      errors: 0
    };
  }

  /**
   * Subscribe to events
   * Supports wildcards: 'WorkEffort:*', '*:Updated'
   */
  on(pattern, handler, options = {}) {
    const {
      priority = 0,     // Higher priority = earlier execution
      async = false,    // Async handler (non-blocking)
      retries = 0       // Retry count on failure
    } = options;

    const subscription = {
      pattern,
      handler,
      priority,
      async,
      retries,
      id: generateUUID()
    };

    if (!this.handlers.has(pattern)) {
      this.handlers.set(pattern, []);
    }

    this.handlers.get(pattern).push(subscription);

    // Sort by priority (descending)
    this.handlers.get(pattern).sort((a, b) => b.priority - a.priority);

    // Return unsubscribe function
    return () => this.off(pattern, subscription.id);
  }

  /**
   * Unsubscribe from events
   */
  off(pattern, subscriptionId) {
    const handlers = this.handlers.get(pattern);
    if (!handlers) return;

    const index = handlers.findIndex(h => h.id === subscriptionId);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * Publish event to subscribers
   */
  async publish(event) {
    this.metrics.published++;

    // Log event
    this.eventLog.push({
      event,
      timestamp: Date.now()
    });

    // Keep only last 1000 events
    if (this.eventLog.length > 1000) {
      this.eventLog.shift();
    }

    // Run through middleware
    let processedEvent = event;
    for (const mw of this.middleware) {
      processedEvent = await mw(processedEvent);
      if (!processedEvent) return; // Middleware cancelled event
    }

    // Find matching handlers
    const handlers = this.findHandlers(event.type);

    // Execute handlers
    const results = await Promise.allSettled(
      handlers.map(h => this.executeHandler(h, processedEvent))
    );

    // Count successes/failures
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        this.metrics.delivered++;
      } else {
        this.metrics.errors++;
        console.error('Event handler error:', result.reason);
      }
    });

    return results;
  }

  /**
   * Execute single handler with retry logic
   * @private
   */
  async executeHandler(subscription, event) {
    const { handler, async: isAsync, retries } = subscription;

    const execute = async () => {
      if (isAsync) {
        // Non-blocking async execution
        setImmediate(() => handler(event));
      } else {
        // Blocking execution
        await handler(event);
      }
    };

    // Retry logic
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        await execute();
        return; // Success
      } catch (error) {
        lastError = error;
        if (attempt < retries) {
          // Exponential backoff
          await sleep(Math.pow(2, attempt) * 100);
        }
      }
    }

    throw lastError; // All retries failed
  }

  /**
   * Find handlers matching event type
   * Supports wildcards
   * @private
   */
  findHandlers(eventType) {
    const handlers = [];

    for (const [pattern, subs] of this.handlers.entries()) {
      if (this.matchPattern(pattern, eventType)) {
        handlers.push(...subs);
      }
    }

    // Sort by priority
    return handlers.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Match pattern with wildcards
   * @private
   */
  matchPattern(pattern, eventType) {
    if (pattern === '*') return true;
    if (pattern === eventType) return true;

    const patternParts = pattern.split(':');
    const typeParts = eventType.split(':');

    if (patternParts.length !== typeParts.length) {
      return false;
    }

    return patternParts.every((part, i) =>
      part === '*' || part === typeParts[i]
    );
  }

  /**
   * Add middleware
   */
  use(middleware) {
    this.middleware.push(middleware);
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      errorRate: this.metrics.published > 0
        ? this.metrics.errors / this.metrics.published
        : 0
    };
  }

  /**
   * Get recent events (for debugging)
   */
  getEventLog(limit = 100) {
    return this.eventLog.slice(-limit);
  }
}

// Helper function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### Event Middleware

```javascript
/**
 * Logging middleware
 */
const loggingMiddleware = (logger) => async (event) => {
  logger.info('Event published', {
    type: event.type,
    aggregateId: event.aggregateId,
    timestamp: event.timestamp
  });
  return event;
};

/**
 * Validation middleware
 */
const validationMiddleware = (schema) => async (event) => {
  const result = schema.validate(event);
  if (!result.valid) {
    throw new Error(`Invalid event: ${result.errors.join(', ')}`);
  }
  return event;
};

/**
 * Enrichment middleware
 */
const enrichmentMiddleware = async (event) => {
  // Add metadata
  return {
    ...event,
    metadata: {
      ...event.metadata,
      hostname: os.hostname(),
      processId: process.pid,
      memoryUsage: process.memoryUsage().heapUsed
    }
  };
};

/**
 * Filtering middleware
 */
const filteringMiddleware = (predicate) => async (event) => {
  if (!predicate(event)) {
    return null; // Cancel event
  }
  return event;
};

// Usage
const eventBus = new EventBus();
eventBus.use(loggingMiddleware(logger));
eventBus.use(validationMiddleware(eventSchema));
eventBus.use(enrichmentMiddleware);
```

## Event Handlers

### Handler Types

```javascript
/**
 * 1. Projector - Updates read models
 */
class WorkEffortProjector {
  constructor(readModelDb) {
    this.db = readModelDb;
  }

  async onWorkEffortStarted(event) {
    await this.db.update('work_efforts', event.aggregateId, {
      status: 'in-progress',
      startedAt: event.timestamp
    });
  }

  async onProgressUpdated(event) {
    await this.db.update('work_efforts', event.aggregateId, {
      progress: event.data.newProgress,
      updatedAt: event.timestamp
    });
  }
}

/**
 * 2. Reactor - Triggers side effects
 */
class NotificationReactor {
  constructor(notificationService) {
    this.notifications = notificationService;
  }

  async onWorkEffortCompleted(event) {
    await this.notifications.send({
      to: event.data.assignee,
      subject: `Work effort completed: ${event.data.title}`,
      body: `${event.data.title} has been completed!`
    });
  }
}

/**
 * 3. Saga - Coordinates long-running processes
 */
class GitHubIntegrationSaga {
  constructor(githubService, eventBus) {
    this.github = githubService;
    this.eventBus = eventBus;
  }

  async onWorkEffortStarted(event) {
    // Create GitHub issue
    const issue = await this.github.createIssue({
      title: event.data.title,
      body: event.data.description
    });

    // Emit integration event
    this.eventBus.publish({
      type: 'GitHubIssueCreated',
      workEffortId: event.aggregateId,
      issueNumber: issue.number
    });
  }

  async onWorkEffortCompleted(event) {
    // Close GitHub issue
    const issueNumber = await this.getIssueNumber(event.aggregateId);
    await this.github.closeIssue(issueNumber);
  }
}

/**
 * 4. Process Manager - Stateful coordination
 */
class DeploymentProcessManager {
  constructor() {
    this.processes = new Map(); // processId → state
  }

  async onWorkEffortCompleted(event) {
    const processId = event.aggregateId;

    // Create process state
    this.processes.set(processId, {
      status: 'started',
      steps: ['test', 'build', 'deploy']
    });

    // Trigger first step
    this.eventBus.publish({
      type: 'RunTests',
      workEffortId: processId
    });
  }

  async onTestsPassed(event) {
    const process = this.processes.get(event.workEffortId);
    process.status = 'testing-complete';

    // Trigger build
    this.eventBus.publish({
      type: 'RunBuild',
      workEffortId: event.workEffortId
    });
  }

  async onBuildComplete(event) {
    const process = this.processes.get(event.workEffortId);
    process.status = 'build-complete';

    // Trigger deploy
    this.eventBus.publish({
      type: 'RunDeploy',
      workEffortId: event.workEffortId
    });
  }
}
```

### Handler Registration

```javascript
/**
 * Register all handlers with event bus
 */
function registerHandlers(eventBus, services) {
  const { db, notifications, github } = services;

  // Projectors (update read models)
  const projector = new WorkEffortProjector(db);
  eventBus.on('WorkEffortStarted', (e) => projector.onWorkEffortStarted(e));
  eventBus.on('ProgressUpdated', (e) => projector.onProgressUpdated(e));

  // Reactors (side effects)
  const reactor = new NotificationReactor(notifications);
  eventBus.on('WorkEffortCompleted', (e) => reactor.onWorkEffortCompleted(e), {
    async: true // Non-blocking
  });

  // Sagas (integration)
  const saga = new GitHubIntegrationSaga(github, eventBus);
  eventBus.on('WorkEffortStarted', (e) => saga.onWorkEffortStarted(e), {
    async: true,
    retries: 3 // Retry on failure
  });

  // Process managers (stateful)
  const processManager = new DeploymentProcessManager();
  eventBus.on('WorkEffortCompleted', (e) => processManager.onWorkEffortCompleted(e));
  eventBus.on('TestsPassed', (e) => processManager.onTestsPassed(e));
  eventBus.on('BuildComplete', (e) => processManager.onBuildComplete(e));

  // Wildcard handlers
  eventBus.on('WorkEffort:*', (event) => {
    console.log('Work effort event:', event.type);
  });

  // Cache invalidation on any update
  eventBus.on('*:Updated', (event) => {
    cache.invalidate(`${event.aggregateType}:${event.aggregateId}`);
  });
}
```

## Event Sourcing

### Event Store

```javascript
/**
 * Event Store - Append-only event log
 */
class EventStore {
  constructor(db) {
    this.db = db;
  }

  /**
   * Append events to stream
   */
  async append(streamId, events, expectedVersion = -1) {
    const currentVersion = await this.getVersion(streamId);

    // Optimistic concurrency check
    if (expectedVersion !== -1 && currentVersion !== expectedVersion) {
      throw new Error('Concurrency conflict');
    }

    // Insert events
    for (const event of events) {
      await this.db.insert('events', {
        stream_id: streamId,
        event_type: event.type,
        event_data: JSON.stringify(event.data),
        version: currentVersion + 1,
        timestamp: event.timestamp
      });
    }
  }

  /**
   * Read events from stream
   */
  async read(streamId, fromVersion = 0) {
    const rows = await this.db.query(`
      SELECT event_type, event_data, version, timestamp
      FROM events
      WHERE stream_id = ? AND version >= ?
      ORDER BY version ASC
    `, [streamId, fromVersion]);

    return rows.map(row => ({
      type: row.event_type,
      data: JSON.parse(row.event_data),
      version: row.version,
      timestamp: row.timestamp
    }));
  }

  /**
   * Get current version of stream
   */
  async getVersion(streamId) {
    const row = await this.db.query(`
      SELECT MAX(version) as version
      FROM events
      WHERE stream_id = ?
    `, [streamId]);

    return row[0]?.version || 0;
  }

  /**
   * Get all events (for projections)
   */
  async readAll(fromPosition = 0) {
    const rows = await this.db.query(`
      SELECT stream_id, event_type, event_data, version, timestamp, position
      FROM events
      WHERE position >= ?
      ORDER BY position ASC
    `, [fromPosition]);

    return rows.map(row => ({
      streamId: row.stream_id,
      type: row.event_type,
      data: JSON.parse(row.event_data),
      version: row.version,
      timestamp: row.timestamp,
      position: row.position
    }));
  }
}
```

### Rebuilding State from Events

```javascript
/**
 * Rebuild entity state from event stream
 */
async function rebuildWorkEffort(eventStore, workEffortId) {
  const events = await eventStore.read(workEffortId);

  // Initial state
  let state = {
    id: workEffortId,
    status: 'planned',
    progress: 0
  };

  // Apply each event
  for (const event of events) {
    state = applyEvent(state, event);
  }

  return new WorkEffort(state);
}

function applyEvent(state, event) {
  switch (event.type) {
    case 'WorkEffortCreated':
      return {
        ...state,
        title: event.data.title,
        description: event.data.description,
        created: new Date(event.data.created)
      };

    case 'WorkEffortStarted':
      return {
        ...state,
        status: 'in-progress',
        startedAt: new Date(event.timestamp)
      };

    case 'ProgressUpdated':
      return {
        ...state,
        progress: event.data.newProgress
      };

    case 'WorkEffortCompleted':
      return {
        ...state,
        status: 'completed',
        progress: 100,
        completedAt: new Date(event.timestamp)
      };

    default:
      return state;
  }
}
```

## Event Patterns

### 1. Command-Event Separation

```javascript
/**
 * Commands (imperative) vs Events (past tense)
 */

// Command: Intent to do something (can be rejected)
class UpdateProgressCommand {
  constructor(workEffortId, newProgress) {
    this.workEffortId = workEffortId;
    this.newProgress = newProgress;
  }
}

// Command Handler
async function handleUpdateProgress(command) {
  const workEffort = await repository.findById(command.workEffortId);

  if (!workEffort) {
    throw new Error('Work effort not found');
  }

  // Business logic (can fail)
  workEffort.updateProgress(command.newProgress);

  // Save
  await repository.save(workEffort);

  // Publish events (what actually happened)
  for (const event of workEffort.getUncommittedEvents()) {
    await eventBus.publish(event);
  }
}

// Event: Fact (already happened, cannot be rejected)
class ProgressUpdatedEvent {
  constructor(workEffortId, oldProgress, newProgress) {
    this.type = 'ProgressUpdated';
    this.workEffortId = workEffortId;
    this.oldProgress = oldProgress;
    this.newProgress = newProgress;
    this.timestamp = Date.now();
  }
}
```

### 2. Event Upcasting (Schema Evolution)

```javascript
/**
 * Handle event schema changes over time
 */
class EventUpcaster {
  constructor() {
    this.upcasters = new Map();

    // Register upcasters
    this.upcasters.set('ProgressUpdated.v1', this.upcastProgressUpdatedV1);
    this.upcasters.set('ProgressUpdated.v2', this.upcastProgressUpdatedV2);
  }

  upcast(event) {
    const version = event.version || 'v1';
    const key = `${event.type}.${version}`;
    const upcaster = this.upcasters.get(key);

    if (upcaster) {
      return upcaster(event);
    }

    return event; // No upcasting needed
  }

  // v1 → v2: Add 'delta' field
  upcastProgressUpdatedV1(event) {
    return {
      ...event,
      version: 'v2',
      data: {
        ...event.data,
        delta: event.data.newProgress - event.data.oldProgress
      }
    };
  }

  // v2 → v3: Add 'percentage' formatting
  upcastProgressUpdatedV2(event) {
    return {
      ...event,
      version: 'v3',
      data: {
        ...event.data,
        formatted: `${event.data.newProgress}%`
      }
    };
  }
}
```

### 3. Eventual Consistency

```javascript
/**
 * Handle eventual consistency with compensating actions
 */
class EventualConsistencyHandler {
  constructor(eventBus) {
    this.eventBus = eventBus;

    // Listen for failures
    eventBus.on('GitHubIssueCreationFailed', (e) => this.compensate(e));
  }

  async compensate(event) {
    console.warn('Compensating for failed GitHub issue creation:', event);

    // Mark work effort as needing manual sync
    this.eventBus.publish({
      type: 'WorkEffortNeedsManualSync',
      workEffortId: event.workEffortId,
      reason: 'GitHub issue creation failed',
      timestamp: Date.now()
    });
  }
}
```

## Testing Events

```javascript
describe('Event-Driven System', () => {
  let eventBus;
  let events;

  beforeEach(() => {
    eventBus = new EventBus();
    events = [];

    // Capture all events
    eventBus.on('*', (event) => {
      events.push(event);
    });
  });

  it('publishes events when work effort is updated', async () => {
    const workEffort = new WorkEffort({ /* ... */ });
    workEffort.updateProgress(50);

    // Publish uncommitted events
    for (const event of workEffort.getUncommittedEvents()) {
      await eventBus.publish(event);
    }

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('ProgressUpdated');
    expect(events[0].data.newProgress).toBe(50);
  });

  it('executes handlers in priority order', async () => {
    const order = [];

    eventBus.on('Test', () => order.push('low'), { priority: 1 });
    eventBus.on('Test', () => order.push('high'), { priority: 10 });
    eventBus.on('Test', () => order.push('medium'), { priority: 5 });

    await eventBus.publish({ type: 'Test' });

    expect(order).toEqual(['high', 'medium', 'low']);
  });

  it('isolates errors in handlers', async () => {
    const successful = jest.fn();

    eventBus.on('Test', () => {
      throw new Error('Handler failed');
    });
    eventBus.on('Test', successful);

    await eventBus.publish({ type: 'Test' });

    // Second handler still executed despite first failing
    expect(successful).toHaveBeenCalled();
  });
});
```

---

**Next**: [Constants & Configuration](../constants/README.md)
