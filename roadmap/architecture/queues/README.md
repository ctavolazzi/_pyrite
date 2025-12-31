# Event Loops, Queues & Async Processing

**How Pyrite handles asynchronous work, background jobs, and concurrent operations.**

## Concurrency Model

```
┌────────────────────────────────────────────────────────────┐
│             Node.js Event Loop (Single Thread)              │
├────────────────────────────────────────────────────────────┤
│  Phase 1: Timers (setTimeout, setInterval)                 │
│  Phase 2: Pending Callbacks (I/O callbacks)                │
│  Phase 3: Idle, Prepare                                    │
│  Phase 4: Poll (new I/O events)                            │
│  Phase 5: Check (setImmediate)                             │
│  Phase 6: Close Callbacks                                  │
└────────────────────────────────────────────────────────────┘
         ↓                    ↓                    ↓
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Microtask    │   │ Worker       │   │ Job Queue    │
│ Queue        │   │ Threads      │   │ (External)   │
│ (Promises)   │   │ (CPU work)   │   │ (Redis/Bull) │
└──────────────┘   └──────────────┘   └──────────────┘
```

## Async Patterns

### 1. Promises (Primary Pattern)

```javascript
/**
 * Promise-based async operations
 * Use for I/O-bound operations
 */

// Basic promise
async function loadWorkEffort(id) {
  const content = await fs.readFile(`${id}.md`, 'utf-8');
  const parsed = await parseMarkdown(content);
  return createWorkEffort(parsed);
}

// Promise.all for parallel execution
async function loadMultipleWorkEfforts(ids) {
  const promises = ids.map(id => loadWorkEffort(id));
  return await Promise.all(promises);
}

// Promise.allSettled for fault tolerance
async function loadAllWorkEfforts(ids) {
  const results = await Promise.allSettled(
    ids.map(id => loadWorkEffort(id))
  );

  const successful = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);

  const failed = results
    .filter(r => r.status === 'rejected')
    .map(r => ({ id: r.reason.id, error: r.reason }));

  return { successful, failed };
}

// Promise.race for timeout
async function loadWithTimeout(id, timeoutMs = 5000) {
  return await Promise.race([
    loadWorkEffort(id),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    )
  ]);
}
```

### 2. Async Iterators

```javascript
/**
 * Async iterators for streaming data
 * Use for large datasets that don't fit in memory
 */

async function* streamWorkEfforts(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const workEffort = await loadWorkEffort(entry.name);
      yield workEffort;
    }
  }
}

// Usage
for await (const workEffort of streamWorkEfforts('_work_efforts')) {
  console.log(workEffort.title);
  // Process one at a time, memory-efficient
}
```

### 3. Event Emitters

```javascript
/**
 * Event-driven async communication
 * Use for pub/sub patterns
 */
const EventEmitter = require('events');

class WorkEffortWatcher extends EventEmitter {
  constructor(directory) {
    super();
    this.directory = directory;
    this.watcher = null;
  }

  start() {
    this.watcher = chokidar.watch(this.directory, {
      ignoreInitial: true
    });

    this.watcher.on('change', async (path) => {
      const workEffort = await this.loadWorkEffort(path);
      this.emit('change', workEffort);
    });

    this.watcher.on('add', async (path) => {
      const workEffort = await this.loadWorkEffort(path);
      this.emit('add', workEffort);
    });

    this.watcher.on('unlink', (path) => {
      this.emit('delete', path);
    });
  }

  stop() {
    this.watcher?.close();
  }
}

// Usage
const watcher = new WorkEffortWatcher('_work_efforts');
watcher.on('change', (workEffort) => {
  console.log('Changed:', workEffort.title);
});
watcher.start();
```

## Job Queue Implementation

### In-Memory Queue (Simple)

```javascript
/**
 * Simple in-memory job queue
 * Use for development and light workloads
 */
class JobQueue {
  constructor(options = {}) {
    this.queue = [];
    this.running = false;
    this.concurrency = options.concurrency || 1;
    this.activeJobs = 0;
    this.handlers = new Map();
    this.retryPolicy = {
      maxAttempts: options.maxRetries || 3,
      backoff: options.backoff || 'exponential'
    };
  }

  /**
   * Register job handler
   */
  process(jobType, handler) {
    this.handlers.set(jobType, handler);
  }

  /**
   * Add job to queue
   */
  async add(jobType, data, options = {}) {
    const job = {
      id: generateUUID(),
      type: jobType,
      data,
      priority: options.priority || 0,
      attempts: 0,
      maxAttempts: options.maxAttempts || this.retryPolicy.maxAttempts,
      createdAt: Date.now(),
      status: 'pending'
    };

    this.queue.push(job);

    // Sort by priority (descending)
    this.queue.sort((a, b) => b.priority - a.priority);

    // Start processing if not running
    if (!this.running) {
      this.start();
    }

    return job.id;
  }

  /**
   * Start processing jobs
   */
  start() {
    this.running = true;
    this.processNext();
  }

  /**
   * Stop processing jobs
   */
  stop() {
    this.running = false;
  }

  /**
   * Process next job
   * @private
   */
  async processNext() {
    while (this.running && this.activeJobs < this.concurrency) {
      const job = this.queue.shift();

      if (!job) {
        // Queue empty
        this.running = false;
        break;
      }

      this.activeJobs++;
      this.executeJob(job).finally(() => {
        this.activeJobs--;
        if (this.running) {
          setImmediate(() => this.processNext());
        }
      });
    }
  }

  /**
   * Execute single job
   * @private
   */
  async executeJob(job) {
    const handler = this.handlers.get(job.type);

    if (!handler) {
      console.error(`No handler for job type: ${job.type}`);
      return;
    }

    job.status = 'active';
    job.attempts++;
    job.startedAt = Date.now();

    try {
      const result = await handler(job.data);

      job.status = 'completed';
      job.completedAt = Date.now();
      job.result = result;

      console.log(`Job ${job.id} completed`);
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);

      if (job.attempts < job.maxAttempts) {
        // Retry
        const delay = this.calculateBackoff(job.attempts);
        console.log(`Retrying job ${job.id} in ${delay}ms`);

        setTimeout(() => {
          job.status = 'pending';
          this.queue.unshift(job); // Add back to front
        }, delay);
      } else {
        // Failed permanently
        job.status = 'failed';
        job.error = error.message;
        job.failedAt = Date.now();

        console.error(`Job ${job.id} failed permanently after ${job.attempts} attempts`);
      }
    }
  }

  /**
   * Calculate backoff delay
   * @private
   */
  calculateBackoff(attempt) {
    if (this.retryPolicy.backoff === 'exponential') {
      return Math.pow(2, attempt) * 1000; // 2s, 4s, 8s, ...
    } else {
      return 1000; // Fixed 1 second
    }
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      pending: this.queue.filter(j => j.status === 'pending').length,
      active: this.activeJobs,
      total: this.queue.length,
      concurrency: this.concurrency
    };
  }
}

// Usage
const queue = new JobQueue({ concurrency: 5 });

// Register handlers
queue.process('send-email', async (data) => {
  await emailService.send(data.to, data.subject, data.body);
});

queue.process('generate-report', async (data) => {
  const report = await reportGenerator.generate(data.workEffortId);
  await fs.writeFile(data.outputPath, report);
});

// Add jobs
await queue.add('send-email', {
  to: 'user@example.com',
  subject: 'Work Effort Completed',
  body: 'Your work effort has been completed!'
});

await queue.add('generate-report', {
  workEffortId: 'WE-251231-a1b2',
  outputPath: 'reports/WE-251231-a1b2.pdf'
}, { priority: 10 });
```

### Redis-Backed Queue (Production)

```javascript
/**
 * Production job queue using Bull (Redis-backed)
 */
const Queue = require('bull');

/**
 * Create job queue
 */
function createJobQueue(name, redis) {
  const queue = new Queue(name, {
    redis: {
      host: redis.host,
      port: redis.port,
      password: redis.password
    },
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: 100,  // Keep last 100 completed
      removeOnFail: 1000      // Keep last 1000 failed
    }
  });

  // Monitor events
  queue.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed:`, result);
  });

  queue.on('failed', (job, error) => {
    console.error(`Job ${job.id} failed:`, error);
  });

  queue.on('stalled', (job) => {
    console.warn(`Job ${job.id} stalled`);
  });

  return queue;
}

// Create queues
const emailQueue = createJobQueue('emails', redisConfig);
const reportQueue = createJobQueue('reports', redisConfig);

// Process jobs
emailQueue.process(async (job) => {
  const { to, subject, body } = job.data;
  await emailService.send(to, subject, body);
  return { sent: true, timestamp: Date.now() };
});

reportQueue.process(5, async (job) => {  // 5 concurrent workers
  const { workEffortId, format } = job.data;

  // Update progress
  job.progress(10);

  const data = await fetchWorkEffortData(workEffortId);
  job.progress(50);

  const report = await generateReport(data, format);
  job.progress(90);

  await uploadReport(report);
  job.progress(100);

  return { reportId: report.id };
});

// Add jobs
const emailJob = await emailQueue.add({
  to: 'user@example.com',
  subject: 'Report Ready',
  body: 'Your report is ready for download'
}, {
  priority: 5,
  delay: 5000  // Send after 5 seconds
});

const reportJob = await reportQueue.add({
  workEffortId: 'WE-251231-a1b2',
  format: 'pdf'
}, {
  priority: 10,
  timeout: 60000  // 1 minute timeout
});

// Monitor progress
reportJob.on('progress', (progress) => {
  console.log(`Report generation: ${progress}%`);
});
```

### Scheduled Jobs (Cron)

```javascript
/**
 * Scheduled jobs using node-cron
 */
const cron = require('node-cron');

/**
 * Daily cleanup job
 * Runs at 2:00 AM every day
 */
cron.schedule('0 2 * * *', async () => {
  console.log('Running daily cleanup...');

  // Clean up old logs
  await cleanupLogs();

  // Archive completed work efforts older than 90 days
  await archiveOldWorkEfforts(90);

  // Vacuum database
  await vacuumDatabase();

  console.log('Daily cleanup complete');
});

/**
 * Hourly backup
 * Runs at minute 0 of every hour
 */
cron.schedule('0 * * * *', async () => {
  console.log('Running hourly backup...');

  await backupDatabase();

  console.log('Backup complete');
});

/**
 * Every 15 minutes: Sync external services
 */
cron.schedule('*/15 * * * *', async () => {
  await syncGitHubIssues();
  await syncSlackMessages();
});
```

## Worker Threads (CPU-Intensive Tasks)

```javascript
/**
 * Use worker threads for CPU-intensive operations
 * Offloads work from main event loop
 */
const { Worker } = require('worker_threads');

/**
 * Parse work efforts in parallel using worker threads
 */
class ParallelParser {
  constructor(numWorkers = os.cpus().length) {
    this.numWorkers = numWorkers;
    this.workers = [];
    this.taskQueue = [];
    this.initializeWorkers();
  }

  initializeWorkers() {
    for (let i = 0; i < this.numWorkers; i++) {
      const worker = new Worker('./parser-worker.js');

      worker.on('message', (result) => {
        this.handleWorkerResult(i, result);
      });

      worker.on('error', (error) => {
        console.error(`Worker ${i} error:`, error);
      });

      this.workers.push({
        worker,
        busy: false
      });
    }
  }

  async parse(filePaths) {
    return new Promise((resolve, reject) => {
      const results = [];
      let completed = 0;

      filePaths.forEach((path, index) => {
        this.enqueueTask({
          path,
          index,
          callback: (result) => {
            results[index] = result;
            completed++;

            if (completed === filePaths.length) {
              resolve(results);
            }
          },
          errorCallback: reject
        });
      });
    });
  }

  enqueueTask(task) {
    const availableWorker = this.workers.find(w => !w.busy);

    if (availableWorker) {
      this.executeTask(availableWorker, task);
    } else {
      this.taskQueue.push(task);
    }
  }

  executeTask(workerInfo, task) {
    workerInfo.busy = true;
    workerInfo.currentTask = task;

    workerInfo.worker.postMessage({
      path: task.path
    });
  }

  handleWorkerResult(workerIndex, result) {
    const workerInfo = this.workers[workerIndex];
    const task = workerInfo.currentTask;

    workerInfo.busy = false;
    workerInfo.currentTask = null;

    if (result.error) {
      task.errorCallback(new Error(result.error));
    } else {
      task.callback(result.data);
    }

    // Process next task in queue
    if (this.taskQueue.length > 0) {
      const nextTask = this.taskQueue.shift();
      this.executeTask(workerInfo, nextTask);
    }
  }

  destroy() {
    this.workers.forEach(({ worker }) => worker.terminate());
  }
}

// Worker file: parser-worker.js
const { parentPort } = require('worker_threads');
const fs = require('fs/promises');
const matter = require('gray-matter');

parentPort.on('message', async ({ path }) => {
  try {
    const content = await fs.readFile(path, 'utf-8');
    const { data } = matter(content);

    parentPort.postMessage({
      data: {
        id: data.id,
        title: data.title,
        status: data.status
      }
    });
  } catch (error) {
    parentPort.postMessage({
      error: error.message
    });
  }
});
```

## Debouncing & Throttling

```javascript
/**
 * Debounce - Delay execution until quiet period
 * Use for: File system watchers, search inputs
 */
function debounce(fn, delayMs) {
  let timeoutId = null;

  return function debounced(...args) {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delayMs);
  };
}

// Usage
const debouncedParse = debounce(parseWorkEfforts, 300);

watcher.on('change', (path) => {
  debouncedParse(path);  // Only parses after 300ms of no changes
});

/**
 * Throttle - Limit execution rate
 * Use for: Scroll handlers, resize events, API rate limiting
 */
function throttle(fn, intervalMs) {
  let lastCall = 0;
  let timeoutId = null;

  return function throttled(...args) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= intervalMs) {
      lastCall = now;
      fn.apply(this, args);
    } else {
      // Schedule for next interval
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        fn.apply(this, args);
      }, intervalMs - timeSinceLastCall);
    }
  };
}

// Usage
const throttledSync = throttle(syncToDatabase, 2000);

watcher.on('change', (path) => {
  throttledSync(path);  // Max once every 2 seconds
});

/**
 * Adaptive debounce - Adjusts delay based on frequency
 */
class AdaptiveDebounce {
  constructor(fn, initialDelay = 300, maxDelay = 5000) {
    this.fn = fn;
    this.initialDelay = initialDelay;
    this.maxDelay = maxDelay;
    this.currentDelay = initialDelay;
    this.changeCount = 0;
    this.timeoutId = null;
  }

  trigger(...args) {
    clearTimeout(this.timeoutId);
    this.changeCount++;

    // Increase delay with more changes (exponential backoff)
    if (this.changeCount > 5) {
      this.currentDelay = Math.min(
        this.currentDelay * 1.5,
        this.maxDelay
      );
    }

    this.timeoutId = setTimeout(() => {
      this.fn(...args);
      this.reset();
    }, this.currentDelay);
  }

  reset() {
    this.changeCount = 0;
    this.currentDelay = this.initialDelay;
  }
}
```

## Backpressure Handling

```javascript
/**
 * Handle backpressure in streams
 */
const { Writable } = require('stream');

class BackpressureAwareWriter extends Writable {
  constructor(options) {
    super({ objectMode: true, highWaterMark: 10, ...options });
    this.processing = 0;
    this.maxConcurrent = options.maxConcurrent || 5;
  }

  async _write(chunk, encoding, callback) {
    // Wait if too many concurrent operations
    while (this.processing >= this.maxConcurrent) {
      await sleep(100);
    }

    this.processing++;

    try {
      await this.processChunk(chunk);
      callback();
    } catch (error) {
      callback(error);
    } finally {
      this.processing--;
    }
  }

  async processChunk(chunk) {
    // Process the chunk (e.g., write to database)
    await this.writeToDatabase(chunk);
  }
}

// Usage
const writer = new BackpressureAwareWriter({ maxConcurrent: 5 });

// Pipe work efforts through writer
streamWorkEfforts('_work_efforts')
  .pipe(writer)
  .on('finish', () => {
    console.log('All work efforts processed');
  });
```

---

**Next**: [Error Handling](../errors/README.md)
