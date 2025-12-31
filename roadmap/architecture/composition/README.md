# Composition Patterns

**How atomic primitives combine into complete systems.**

## Core Composition Principle

**Small pieces, loosely joined** - Every complex operation is built by composing simple, single-purpose functions.

```javascript
// ❌ Monolithic function (hard to test, reuse, understand)
async function createAndSaveWorkEffort(title, description) {
  const id = `WE-${Date.now()}-${Math.random()}`;
  const we = { id, title, description, status: 'planned' };
  await fs.writeFile(`${id}.json`, JSON.stringify(we));
  return we;
}

// ✅ Composed from primitives (testable, reusable, clear)
const createWorkEffort = pipe(
  generateId,           // () → string
  buildWorkEffort,      // (id, data) → WorkEffort
  validate,             // WorkEffort → Result<WorkEffort, Error>
  toMarkdown,           // WorkEffort → string
  saveToFile            // string → Promise<void>
);
```

## Fundamental Patterns

### 1. Pipeline Pattern (Data Transformation)

**Use When**: Transforming data through multiple stages

```javascript
/**
 * Pipeline: Sequential transformations
 * f: A → B
 * g: B → C
 * h: C → D
 * pipeline = f ∘ g ∘ h: A → D
 */

const processWorkEffort = pipe(
  parseMarkdown,        // string → { data, content }
  extractFrontmatter,   // { data, content } → Object
  validateData,         // Object → Result<Object, Error[]>
  createEntity,         // Object → WorkEffort
  enrichWithTickets     // WorkEffort → WorkEffortWithTickets
);

// Usage
const result = await processWorkEffort(fileContent);
```

**Implementation:**
```javascript
function pipe(...fns) {
  return (initialValue) => {
    return fns.reduce((value, fn) => {
      // Handle async functions
      if (value instanceof Promise) {
        return value.then(fn);
      }
      return fn(value);
    }, initialValue);
  };
}
```

### 2. Repository Pattern (Data Access Abstraction)

**Use When**: Abstracting data storage implementation

```javascript
/**
 * Repository: Interface for data access
 * Hides persistence details from domain layer
 */

// Interface (contract)
interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(query?: Query): Promise<T[]>;
  save(entity: T): Promise<void>;
  delete(id: string): Promise<void>;
}

// Implementation 1: File-based
class FileWorkEffortRepository {
  async findById(id) {
    const content = await readFile(`${id}.md`);
    return parseWorkEffort(content);
  }

  async save(workEffort) {
    const content = toMarkdown(workEffort);
    await writeFile(`${workEffort.id}.md`, content);
  }
}

// Implementation 2: Database
class DatabaseWorkEffortRepository {
  async findById(id) {
    const row = await this.db.query('SELECT * FROM work_efforts WHERE id = ?', [id]);
    return rowToWorkEffort(row);
  }

  async save(workEffort) {
    await this.db.query(
      'INSERT INTO work_efforts VALUES (?, ?, ?)',
      [workEffort.id, workEffort.title, workEffort.status]
    );
  }
}

// Domain code doesn't care which implementation
class CreateWorkEffort {
  constructor(repository) { // Dependency injection
    this.repository = repository; // Could be file or database
  }

  async execute(data) {
    const workEffort = new WorkEffort(data);
    await this.repository.save(workEffort); // Same interface
    return workEffort;
  }
}
```

### 3. Decorator Pattern (Adding Behavior)

**Use When**: Adding cross-cutting concerns without modifying core logic

```javascript
/**
 * Decorator: Wraps function with additional behavior
 * Original: f: A → B
 * Decorated: f': A → B (with logging, caching, etc.)
 */

// Core function
async function findWorkEffort(id) {
  return await repository.findById(id);
}

// Decorator: Add caching
function withCache(fn, cache) {
  return async function(...args) {
    const key = JSON.stringify(args);
    const cached = cache.get(key);

    if (cached) {
      return cached;
    }

    const result = await fn(...args);
    cache.set(key, result);
    return result;
  };
}

// Decorator: Add logging
function withLogging(fn, logger) {
  return async function(...args) {
    logger.info(`Calling ${fn.name} with args:`, args);
    const start = Date.now();

    try {
      const result = await fn(...args);
      logger.info(`${fn.name} completed in ${Date.now() - start}ms`);
      return result;
    } catch (error) {
      logger.error(`${fn.name} failed:`, error);
      throw error;
    }
  };
}

// Decorator: Add error handling
function withErrorHandling(fn) {
  return async function(...args) {
    try {
      return { ok: true, value: await fn(...args) };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  };
}

// Compose decorators
const findWorkEffortEnhanced = pipe(
  findWorkEffort,
  (fn) => withCache(fn, cache),
  (fn) => withLogging(fn, logger),
  (fn) => withErrorHandling(fn)
);
```

### 4. Observer Pattern (Event-Driven)

**Use When**: Notifying multiple components of changes

```javascript
/**
 * Observer: Publish-subscribe event system
 * Publishers emit events, subscribers react
 */

class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Subscribe to event
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    this.listeners.get(event).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Emit event to all subscribers
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event) || [];

    for (const callback of callbacks) {
      // Async, non-blocking
      setImmediate(() => {
        try {
          callback(data);
        } catch (error) {
          console.error('Event handler error:', error);
        }
      });
    }
  }
}

// Usage
const eventBus = new EventBus();

// Subscriber 1: Update UI
eventBus.on('WorkEffortUpdated', (workEffort) => {
  renderWorkEffort(workEffort);
});

// Subscriber 2: Update cache
eventBus.on('WorkEffortUpdated', (workEffort) => {
  cache.invalidate(`we:${workEffort.id}`);
});

// Subscriber 3: Send notification
eventBus.on('WorkEffortCompleted', (workEffort) => {
  sendNotification(`${workEffort.title} completed!`);
});

// Publisher
class WorkEffortService {
  async updateProgress(id, progress) {
    const workEffort = await repository.findById(id);
    workEffort.updateProgress(progress);
    await repository.save(workEffort);

    // Emit event
    eventBus.emit('WorkEffortUpdated', workEffort);

    if (workEffort.status === 'completed') {
      eventBus.emit('WorkEffortCompleted', workEffort);
    }
  }
}
```

### 5. Strategy Pattern (Pluggable Algorithms)

**Use When**: Multiple algorithms for same operation

```javascript
/**
 * Strategy: Interchangeable algorithms
 * Interface: A → B
 * Strategies: Multiple implementations of A → B
 */

// Parser strategy interface
interface Parser {
  canParse(path: string): boolean;
  parse(content: string): WorkEffort;
}

// Strategy 1: MCP v0.3.0 format
class MCPParser {
  canParse(path) {
    return /WE-\d{6}-[a-z0-9]{4}_/.test(path);
  }

  parse(content) {
    const { data, content: description } = matter(content);
    return new WorkEffort({
      id: data.id,
      title: data.title,
      status: data.status,
      created: new Date(data.created),
      description
    });
  }
}

// Strategy 2: Johnny Decimal format
class JohnnyDecimalParser {
  canParse(path) {
    return /\d{2}\.\d{2}_/.test(path);
  }

  parse(content) {
    // Different parsing logic
    // ...
  }
}

// Strategy selector
class ParserStrategy {
  constructor() {
    this.parsers = [
      new MCPParser(),
      new JohnnyDecimalParser()
    ];
  }

  parse(path, content) {
    const parser = this.parsers.find(p => p.canParse(path));

    if (!parser) {
      throw new Error(`No parser found for ${path}`);
    }

    return parser.parse(content);
  }
}
```

### 6. Adapter Pattern (Interface Translation)

**Use When**: Integrating external systems with different interfaces

```javascript
/**
 * Adapter: Translates one interface to another
 * External API: different interface
 * Our system: expected interface
 * Adapter: external → internal
 */

// Our expected interface
interface GitService {
  createIssue(workEffort: WorkEffort): Promise<Issue>;
  createPR(workEffort: WorkEffort): Promise<PullRequest>;
}

// GitHub adapter
class GitHubAdapter {
  constructor(octokit) {
    this.octokit = octokit;
  }

  async createIssue(workEffort) {
    // Translate our domain model to GitHub API
    const githubIssue = await this.octokit.issues.create({
      owner: 'user',
      repo: 'repo',
      title: workEffort.title,
      body: workEffort.description,
      labels: [workEffort.status]
    });

    // Translate GitHub response to our domain model
    return {
      id: String(githubIssue.data.number),
      url: githubIssue.data.html_url,
      externalId: githubIssue.data.id
    };
  }
}

// GitLab adapter (same interface, different implementation)
class GitLabAdapter {
  constructor(gitlab) {
    this.gitlab = gitlab;
  }

  async createIssue(workEffort) {
    const gitlabIssue = await this.gitlab.Issues.create(projectId, {
      title: workEffort.title,
      description: workEffort.description
    });

    return {
      id: String(gitlabIssue.iid),
      url: gitlabIssue.web_url,
      externalId: gitlabIssue.id
    };
  }
}

// Usage (dependency injection)
const gitService = new GitHubAdapter(octokit);
// or
const gitService = new GitLabAdapter(gitlab);

// Application code doesn't care which adapter
await gitService.createIssue(workEffort);
```

### 7. Factory Pattern (Object Creation)

**Use When**: Complex object creation logic

```javascript
/**
 * Factory: Encapsulates object creation
 * Centralizes creation logic
 * Returns interface, not concrete type
 */

class WorkEffortFactory {
  /**
   * Create work effort from user input
   */
  static createFromInput(data) {
    const id = this.generateId();

    return new WorkEffort({
      id,
      title: data.title,
      description: data.description || '',
      status: 'planned',
      progress: 0,
      created: new Date()
    });
  }

  /**
   * Create work effort from file
   */
  static createFromFile(content) {
    const { data, content: description } = matter(content);

    return new WorkEffort({
      id: data.id,
      title: data.title,
      description: description.trim(),
      status: data.status,
      progress: data.progress || 0,
      created: new Date(data.created)
    });
  }

  /**
   * Create work effort from GitHub issue
   */
  static createFromGitHubIssue(issue) {
    const id = this.generateId();

    return new WorkEffort({
      id,
      title: issue.title,
      description: issue.body,
      status: issue.state === 'open' ? 'in-progress' : 'completed',
      progress: issue.state === 'closed' ? 100 : 0,
      created: new Date(issue.created_at)
    });
  }

  /**
   * Generate unique ID
   * @private
   */
  static generateId() {
    const date = new Date();
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    const random = Math.random().toString(36).substring(2, 6);

    return `WE-${yy}${mm}${dd}-${random}`;
  }
}

// Usage
const we1 = WorkEffortFactory.createFromInput({ title: 'New Feature' });
const we2 = WorkEffortFactory.createFromFile(fileContent);
const we3 = WorkEffortFactory.createFromGitHubIssue(issue);
```

## Composition Example: Complete Flow

**Goal**: Load, validate, enrich, cache, and return work efforts

```javascript
/**
 * Composed operation using multiple patterns
 */

// 1. Repository pattern (data access)
const repository = new FileWorkEffortRepository('_work_efforts');

// 2. Strategy pattern (parsing)
const parserStrategy = new ParserStrategy([
  new MCPParser(),
  new JohnnyDecimalParser()
]);

// 3. Decorator pattern (add caching)
const cache = new LRUCache({ maxSize: 100 });
const cachedRepository = withCache(repository, cache);

// 4. Decorator pattern (add logging)
const logger = createLogger('WorkEffortService');
const loggedRepository = withLogging(cachedRepository, logger);

// 5. Pipeline pattern (transformation)
const enrichWorkEffort = pipe(
  loadWorkEffort,       // Load from repository
  validateWorkEffort,   // Validate domain rules
  loadTickets,          // Enrich with tickets
  calculateMetrics,     // Add computed fields
  toDTO                 // Convert to data transfer object
);

// 6. Observer pattern (events)
const eventBus = new EventBus();

eventBus.on('WorkEffortLoaded', (we) => {
  logger.info('Work effort loaded:', we.id);
});

// Complete composed service
class WorkEffortService {
  constructor(repository, parserStrategy, eventBus) {
    this.repository = repository;
    this.parserStrategy = parserStrategy;
    this.eventBus = eventBus;
  }

  async getWorkEffort(id) {
    // Use repository (cached + logged)
    const workEffort = await this.repository.findById(id);

    if (!workEffort) {
      return { ok: false, error: 'Not found' };
    }

    // Enrich through pipeline
    const enriched = await enrichWorkEffort(workEffort);

    // Emit event
    this.eventBus.emit('WorkEffortLoaded', enriched);

    return { ok: true, value: enriched };
  }
}

// Wire everything together (dependency injection)
const service = new WorkEffortService(
  loggedRepository,
  parserStrategy,
  eventBus
);

// Usage
const result = await service.getWorkEffort('WE-251231-a1b2');
```

## Key Principles

1. **Single Responsibility**: Each function/class does one thing
2. **Open/Closed**: Open for extension (decorators, strategies), closed for modification
3. **Dependency Inversion**: Depend on interfaces, not implementations
4. **Composition over Inheritance**: Build by composing small pieces
5. **Interface Segregation**: Small, focused interfaces
6. **Explicit over Implicit**: All dependencies injected, not hidden

---

**Next**: Review the complete architecture documentation and start implementation.
