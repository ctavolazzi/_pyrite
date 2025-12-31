# Phase 2: Performance & Scale

**Version Target**: v0.6.0 - v0.7.0
**Duration**: 4-6 weeks
**Status**: Planning
**Priority**: P0 (Critical)
**Depends On**: Phase 1 (Testing & Type Safety)

## Objectives

Optimize performance and enable scaling to handle:
- 1000+ work efforts
- Multiple concurrent users
- Real-time updates without lag
- Sub-50ms API response times
- Efficient file system operations

## Stage Breakdown

### Stage 1: Caching Layer (Weeks 1-2) → v0.6.0-alpha.1

**Goal**: Implement multi-tier caching to reduce file I/O by 90%+

#### Architecture: Three-Tier Cache

```
┌─────────────────┐
│   L1: Memory    │ ← Hot data (LRU, 100MB limit)
├─────────────────┤
│   L2: Disk      │ ← Parsed results (1GB limit)
├─────────────────┤
│ L3: File System │ ← Source of truth
└─────────────────┘
```

#### Data Structures

**File**: `mcp-servers/dashboard/lib/cache/index.js`
```javascript
/**
 * @typedef {Object} CacheEntry
 * @property {*} value - Cached value
 * @property {number} timestamp - Cache timestamp
 * @property {number} hits - Access count
 * @property {number} size - Memory size in bytes
 * @property {string} [etag] - File ETag for validation
 */

/**
 * @typedef {Object} CacheStats
 * @property {number} hits - Cache hits
 * @property {number} misses - Cache misses
 * @property {number} evictions - Items evicted
 * @property {number} size - Current cache size
 * @property {number} maxSize - Maximum cache size
 * @property {number} hitRate - Hit rate percentage
 */
```

#### L1: In-Memory LRU Cache

**File**: `mcp-servers/dashboard/lib/cache/lru-cache.js`
```javascript
/**
 * Least Recently Used (LRU) Cache Implementation
 * Time Complexity: O(1) for get/set/delete
 * Space Complexity: O(n) where n is maxSize
 */
class LRUCache {
  /**
   * @param {Object} options
   * @param {number} options.maxSize - Max size in bytes (default: 100MB)
   * @param {number} options.maxAge - Max age in ms (default: 5 minutes)
   * @param {Function} options.onEvict - Callback on eviction
   */
  constructor(options = {}) {
    this.maxSize = options.maxSize || 100 * 1024 * 1024; // 100MB
    this.maxAge = options.maxAge || 5 * 60 * 1000; // 5 minutes
    this.onEvict = options.onEvict || (() => {});

    // Doubly linked list for LRU ordering
    this.head = null;
    this.tail = null;

    // HashMap for O(1) access
    this.cache = new Map();

    // Stats tracking
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      currentSize: 0
    };
  }

  /**
   * Get value from cache
   * @param {string} key
   * @returns {*|null} Cached value or null
   */
  get(key) {
    const node = this.cache.get(key);

    if (!node) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() - node.timestamp > this.maxAge) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }

    // Move to head (most recently used)
    this.moveToHead(node);
    this.stats.hits++;
    node.hits++;

    return node.value;
  }

  /**
   * Set value in cache
   * @param {string} key
   * @param {*} value
   * @param {Object} [metadata={}]
   */
  set(key, value, metadata = {}) {
    const size = this.calculateSize(value);

    // If single item exceeds maxSize, don't cache
    if (size > this.maxSize) {
      return;
    }

    // Remove existing entry if present
    if (this.cache.has(key)) {
      this.delete(key);
    }

    // Evict until we have space
    while (this.stats.currentSize + size > this.maxSize && this.tail) {
      this.evictLRU();
    }

    // Create new node
    const node = {
      key,
      value,
      timestamp: Date.now(),
      hits: 0,
      size,
      ...metadata,
      prev: null,
      next: null
    };

    // Add to head (most recently used)
    this.addToHead(node);
    this.cache.set(key, node);
    this.stats.currentSize += size;
  }

  /**
   * Delete key from cache
   * @param {string} key
   * @returns {boolean} True if deleted
   */
  delete(key) {
    const node = this.cache.get(key);
    if (!node) return false;

    this.removeNode(node);
    this.cache.delete(key);
    this.stats.currentSize -= node.size;

    return true;
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
    this.head = null;
    this.tail = null;
    this.stats.currentSize = 0;
  }

  /**
   * Get cache statistics
   * @returns {CacheStats}
   */
  getStats() {
    return {
      ...this.stats,
      maxSize: this.maxSize,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) * 100 || 0
    };
  }

  // Private methods

  addToHead(node) {
    node.next = this.head;
    node.prev = null;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  removeNode(node) {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  moveToHead(node) {
    this.removeNode(node);
    this.addToHead(node);
  }

  evictLRU() {
    if (!this.tail) return;

    const evicted = this.tail;
    this.delete(evicted.key);
    this.stats.evictions++;
    this.onEvict(evicted.key, evicted.value);
  }

  /**
   * Calculate approximate size of value in bytes
   * @param {*} value
   * @returns {number} Size in bytes
   */
  calculateSize(value) {
    const json = JSON.stringify(value);
    return new Blob([json]).size;
  }
}

module.exports = { LRUCache };
```

#### L2: Disk Cache with SQLite

**File**: `mcp-servers/dashboard/lib/cache/disk-cache.js`
```javascript
const Database = require('better-sqlite3');
const { createHash } = require('crypto');

/**
 * Persistent disk-based cache using SQLite
 * Stores parsed work efforts for fast cold starts
 */
class DiskCache {
  /**
   * @param {Object} options
   * @param {string} options.dbPath - Path to SQLite database
   * @param {number} options.maxAge - Max age in ms (default: 1 hour)
   */
  constructor(options = {}) {
    this.dbPath = options.dbPath || '.cache/pyrite.db';
    this.maxAge = options.maxAge || 60 * 60 * 1000; // 1 hour

    this.db = new Database(this.dbPath);
    this.initialize();
  }

  initialize() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        etag TEXT,
        size INTEGER
      );

      CREATE INDEX IF NOT EXISTS idx_timestamp ON cache(timestamp);
      CREATE INDEX IF NOT EXISTS idx_etag ON cache(etag);
    `);

    // Prepared statements for performance
    this.stmts = {
      get: this.db.prepare('SELECT value, timestamp, etag FROM cache WHERE key = ?'),
      set: this.db.prepare(`
        INSERT OR REPLACE INTO cache (key, value, timestamp, etag, size)
        VALUES (?, ?, ?, ?, ?)
      `),
      delete: this.db.prepare('DELETE FROM cache WHERE key = ?'),
      cleanup: this.db.prepare('DELETE FROM cache WHERE timestamp < ?')
    };
  }

  /**
   * Get value from disk cache
   * @param {string} key
   * @returns {Object|null} Cached entry or null
   */
  get(key) {
    const row = this.stmts.get.get(key);

    if (!row) return null;

    // Check if expired
    if (Date.now() - row.timestamp > this.maxAge) {
      this.delete(key);
      return null;
    }

    return {
      value: JSON.parse(row.value),
      timestamp: row.timestamp,
      etag: row.etag
    };
  }

  /**
   * Set value in disk cache
   * @param {string} key
   * @param {*} value
   * @param {Object} [metadata={}]
   */
  set(key, value, metadata = {}) {
    const json = JSON.stringify(value);
    const etag = this.generateETag(json);

    this.stmts.set.run(
      key,
      json,
      Date.now(),
      metadata.etag || etag,
      json.length
    );
  }

  /**
   * Delete key from cache
   * @param {string} key
   */
  delete(key) {
    this.stmts.delete.run(key);
  }

  /**
   * Clean up expired entries
   * @returns {number} Number of entries deleted
   */
  cleanup() {
    const result = this.stmts.cleanup.run(Date.now() - this.maxAge);
    return result.changes;
  }

  /**
   * Generate ETag for cache validation
   * @param {string} content
   * @returns {string} MD5 hash
   */
  generateETag(content) {
    return createHash('md5').update(content).digest('hex');
  }

  /**
   * Close database connection
   */
  close() {
    this.db.close();
  }
}

module.exports = { DiskCache };
```

#### Cache Coordinator

**File**: `mcp-servers/dashboard/lib/cache/cache-coordinator.js`
```javascript
const { LRUCache } = require('./lru-cache');
const { DiskCache } = require('./disk-cache');

/**
 * Coordinates multi-tier caching strategy
 */
class CacheCoordinator {
  constructor(options = {}) {
    this.l1 = new LRUCache({
      maxSize: options.l1MaxSize || 100 * 1024 * 1024, // 100MB
      maxAge: options.l1MaxAge || 5 * 60 * 1000, // 5 minutes
      onEvict: (key, value) => {
        // Write to L2 on eviction from L1
        this.l2.set(key, value);
      }
    });

    this.l2 = new DiskCache({
      dbPath: options.diskCachePath || '.cache/pyrite.db',
      maxAge: options.l2MaxAge || 60 * 60 * 1000 // 1 hour
    });
  }

  /**
   * Get value with cache hierarchy
   * @param {string} key
   * @param {Function} loader - Function to load value if not cached
   * @returns {Promise<*>}
   */
  async get(key, loader) {
    // Try L1 (memory)
    let value = this.l1.get(key);
    if (value !== null) {
      return value;
    }

    // Try L2 (disk)
    const diskEntry = this.l2.get(key);
    if (diskEntry) {
      // Promote to L1
      this.l1.set(key, diskEntry.value, { etag: diskEntry.etag });
      return diskEntry.value;
    }

    // L3 (file system) - call loader
    value = await loader();

    // Store in both caches
    this.l1.set(key, value);
    this.l2.set(key, value);

    return value;
  }

  /**
   * Invalidate cache entry
   * @param {string} key
   */
  invalidate(key) {
    this.l1.delete(key);
    this.l2.delete(key);
  }

  /**
   * Invalidate cache entries matching pattern
   * @param {RegExp|string} pattern
   */
  invalidatePattern(pattern) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    // Invalidate L1
    for (const key of this.l1.cache.keys()) {
      if (regex.test(key)) {
        this.l1.delete(key);
      }
    }

    // Invalidate L2 (requires full scan - expensive)
    // Consider maintaining a key index for pattern matching
  }

  /**
   * Get combined cache statistics
   * @returns {Object}
   */
  getStats() {
    return {
      l1: this.l1.getStats(),
      l2: {
        // Add L2 stats
      }
    };
  }
}

module.exports = { CacheCoordinator };
```

#### Cache Integration with Parser

**File**: `mcp-servers/dashboard/lib/parser.js` (updated)
```javascript
const { CacheCoordinator } = require('./cache/cache-coordinator');
const { stat } = require('fs/promises');
const { createHash } = require('crypto');

// Initialize cache
const cache = new CacheCoordinator();

/**
 * Parse work efforts with caching
 * @param {string} workEffortsPath
 * @param {Object} options
 * @returns {Promise<WorkEffort[]>}
 */
async function parseWorkEfforts(workEffortsPath, options = {}) {
  // Generate cache key from path + options
  const cacheKey = generateCacheKey(workEffortsPath, options);

  // Check if directory has been modified
  const dirStat = await stat(workEffortsPath);
  const etag = `${dirStat.mtimeMs}`;

  return await cache.get(cacheKey, async () => {
    // Actual parsing logic (only runs on cache miss)
    return await parseWorkEffortsUncached(workEffortsPath, options);
  });
}

/**
 * Generate cache key from path and options
 * @param {string} path
 * @param {Object} options
 * @returns {string}
 */
function generateCacheKey(path, options) {
  const hash = createHash('md5')
    .update(path)
    .update(JSON.stringify(options))
    .digest('hex');

  return `work-efforts:${hash}`;
}
```

---

### Stage 2: Database Integration (Weeks 3-4) → v0.6.0-alpha.2

**Goal**: Add structured database storage for queryability and performance

#### Database Schema Design

**File**: `mcp-servers/dashboard/lib/db/schema.sql`
```sql
-- Work Efforts Table
CREATE TABLE work_efforts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK(status IN ('planned', 'in-progress', 'completed', 'blocked')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK(progress BETWEEN 0 AND 100),
  branch TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  completed_at INTEGER,

  -- Metadata
  metadata JSON,

  -- File system tracking
  file_path TEXT NOT NULL UNIQUE,
  file_hash TEXT NOT NULL,
  last_synced_at INTEGER NOT NULL
);

-- Tickets Table
CREATE TABLE tickets (
  id TEXT PRIMARY KEY,
  work_effort_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK(status IN ('pending', 'in-progress', 'completed')),
  sequence_number INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  completed_at INTEGER,

  -- File system tracking
  file_path TEXT NOT NULL UNIQUE,
  file_hash TEXT NOT NULL,

  FOREIGN KEY (work_effort_id) REFERENCES work_efforts(id) ON DELETE CASCADE
);

-- Tags Table (many-to-many)
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE work_effort_tags (
  work_effort_id TEXT NOT NULL,
  tag_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,

  PRIMARY KEY (work_effort_id, tag_id),
  FOREIGN KEY (work_effort_id) REFERENCES work_efforts(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_work_efforts_status ON work_efforts(status);
CREATE INDEX idx_work_efforts_created ON work_efforts(created_at DESC);
CREATE INDEX idx_work_efforts_updated ON work_efforts(updated_at DESC);
CREATE INDEX idx_tickets_work_effort ON tickets(work_effort_id);
CREATE INDEX idx_tickets_status ON tickets(status);

-- Full-text search
CREATE VIRTUAL TABLE work_efforts_fts USING fts5(
  id UNINDEXED,
  title,
  description,
  content='work_efforts',
  content_rowid='rowid'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER work_efforts_fts_insert AFTER INSERT ON work_efforts BEGIN
  INSERT INTO work_efforts_fts(rowid, id, title, description)
  VALUES (new.rowid, new.id, new.title, new.description);
END;

CREATE TRIGGER work_efforts_fts_update AFTER UPDATE ON work_efforts BEGIN
  UPDATE work_efforts_fts
  SET title = new.title, description = new.description
  WHERE rowid = new.rowid;
END;

CREATE TRIGGER work_efforts_fts_delete AFTER DELETE ON work_efforts BEGIN
  DELETE FROM work_efforts_fts WHERE rowid = old.rowid;
END;
```

#### Database Access Layer

**File**: `mcp-servers/dashboard/lib/db/repository.js`
```javascript
const Database = require('better-sqlite3');

/**
 * Work Effort Repository
 * Handles all database operations for work efforts
 */
class WorkEffortRepository {
  constructor(dbPath) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL'); // Write-Ahead Logging for performance
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = -64000'); // 64MB cache

    this.initializeStatements();
  }

  initializeStatements() {
    // Prepared statements for common queries
    this.stmts = {
      // Find operations
      findById: this.db.prepare(`
        SELECT * FROM work_efforts WHERE id = ?
      `),

      findAll: this.db.prepare(`
        SELECT * FROM work_efforts
        ORDER BY updated_at DESC
        LIMIT ? OFFSET ?
      `),

      findByStatus: this.db.prepare(`
        SELECT * FROM work_efforts
        WHERE status = ?
        ORDER BY updated_at DESC
      `),

      // Search
      search: this.db.prepare(`
        SELECT we.* FROM work_efforts we
        JOIN work_efforts_fts fts ON we.rowid = fts.rowid
        WHERE work_efforts_fts MATCH ?
        ORDER BY rank
      `),

      // Insert/Update
      insert: this.db.prepare(`
        INSERT INTO work_efforts (
          id, title, description, status, progress, branch,
          created_at, updated_at, file_path, file_hash, last_synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),

      update: this.db.prepare(`
        UPDATE work_efforts
        SET status = ?, progress = ?, updated_at = ?, last_synced_at = ?
        WHERE id = ?
      `),

      // Aggregations
      countByStatus: this.db.prepare(`
        SELECT status, COUNT(*) as count
        FROM work_efforts
        GROUP BY status
      `),

      getProgressStats: this.db.prepare(`
        SELECT
          AVG(progress) as avg_progress,
          MIN(progress) as min_progress,
          MAX(progress) as max_progress
        FROM work_efforts
        WHERE status = 'in-progress'
      `)
    };
  }

  /**
   * Find work effort by ID
   * @param {string} id
   * @returns {Object|null}
   */
  findById(id) {
    return this.stmts.findById.get(id);
  }

  /**
   * Find all work efforts with pagination
   * @param {Object} options
   * @param {number} options.limit
   * @param {number} options.offset
   * @returns {Object[]}
   */
  findAll({ limit = 50, offset = 0 } = {}) {
    return this.stmts.findAll.all(limit, offset);
  }

  /**
   * Search work efforts using full-text search
   * @param {string} query - FTS5 query
   * @returns {Object[]}
   */
  search(query) {
    return this.stmts.search.all(query);
  }

  /**
   * Upsert work effort from file system
   * @param {Object} workEffort
   */
  upsert(workEffort) {
    const existing = this.findById(workEffort.id);

    if (existing) {
      return this.stmts.update.run(
        workEffort.status,
        workEffort.progress,
        Date.now(),
        Date.now(),
        workEffort.id
      );
    } else {
      return this.stmts.insert.run(
        workEffort.id,
        workEffort.title,
        workEffort.description || null,
        workEffort.status,
        workEffort.progress,
        workEffort.branch || null,
        new Date(workEffort.created).getTime(),
        Date.now(),
        workEffort.filePath,
        workEffort.fileHash,
        Date.now()
      );
    }
  }

  /**
   * Sync file system to database
   * @param {WorkEffort[]} workEfforts
   */
  sync(workEfforts) {
    const transaction = this.db.transaction((wes) => {
      for (const we of wes) {
        this.upsert(we);
      }
    });

    transaction(workEfforts);
  }

  /**
   * Get statistics
   * @returns {Object}
   */
  getStats() {
    return {
      byStatus: this.stmts.countByStatus.all(),
      progress: this.stmts.getProgressStats.get()
    };
  }
}

module.exports = { WorkEffortRepository };
```

---

### Stage 3: Performance Optimization (Weeks 5-6) → v0.6.0

**Goal**: Achieve <50ms response times for all operations

#### Parser Optimization: Parallel Processing

**File**: `mcp-servers/dashboard/lib/parser-optimized.js`
```javascript
const { Worker } = require('worker_threads');
const { cpus } = require('os');

/**
 * Parse work efforts in parallel using worker threads
 * Expected speedup: 2-8x depending on CPU cores
 */
class ParallelParser {
  constructor(options = {}) {
    this.numWorkers = options.numWorkers || cpus().length;
    this.workers = [];
    this.taskQueue = [];
    this.initializeWorkers();
  }

  initializeWorkers() {
    for (let i = 0; i < this.numWorkers; i++) {
      const worker = new Worker('./parser-worker.js');
      this.workers.push({
        worker,
        busy: false
      });

      worker.on('message', (result) => {
        this.handleWorkerResult(i, result);
      });
    }
  }

  /**
   * Parse work efforts in parallel
   * @param {string[]} filePaths - Array of file paths to parse
   * @returns {Promise<WorkEffort[]>}
   */
  async parseAll(filePaths) {
    // Split files across workers
    const chunkSize = Math.ceil(filePaths.length / this.numWorkers);
    const chunks = [];

    for (let i = 0; i < filePaths.length; i += chunkSize) {
      chunks.push(filePaths.slice(i, i + chunkSize));
    }

    // Process chunks in parallel
    const promises = chunks.map((chunk, idx) => {
      return this.processChunk(chunk, idx % this.numWorkers);
    });

    const results = await Promise.all(promises);

    // Flatten and sort
    return results.flat().sort((a, b) => b.updated - a.updated);
  }

  /**
   * Process chunk in specific worker
   * @private
   */
  processChunk(chunk, workerIdx) {
    return new Promise((resolve, reject) => {
      const { worker } = this.workers[workerIdx];

      const handler = (result) => {
        if (result.error) {
          reject(new Error(result.error));
        } else {
          resolve(result.workEfforts);
        }
      };

      worker.once('message', handler);
      worker.postMessage({ chunk });
    });
  }

  /**
   * Cleanup workers
   */
  async destroy() {
    await Promise.all(
      this.workers.map(({ worker }) => worker.terminate())
    );
  }
}

module.exports = { ParallelParser };
```

**File**: `mcp-servers/dashboard/lib/parser-worker.js`
```javascript
const { parentPort } = require('worker_threads');
const { parseWorkEffort } = require('./parser-core');

// Worker thread listens for chunks to process
parentPort.on('message', async ({ chunk }) => {
  try {
    const workEfforts = await Promise.all(
      chunk.map(filePath => parseWorkEffort(filePath))
    );

    parentPort.postMessage({ workEfforts });
  } catch (error) {
    parentPort.postMessage({ error: error.message });
  }
});
```

#### Debounce Algorithm for File Watcher

**Algorithm**: Adaptive Debounce with Exponential Backoff

```javascript
/**
 * Adaptive debounce that adjusts delay based on change frequency
 *
 * Algorithm:
 * 1. Initial delay: 300ms
 * 2. If changes continue, increase delay exponentially (300ms → 600ms → 1200ms)
 * 3. Max delay: 5 seconds
 * 4. After quiet period, reset to initial delay
 *
 * Benefits:
 * - Fast response for single changes (300ms)
 * - Batches rapid changes efficiently
 * - Prevents thrashing during bulk operations
 */
class AdaptiveDebounce {
  constructor(fn, initialDelay = 300) {
    this.fn = fn;
    this.initialDelay = initialDelay;
    this.currentDelay = initialDelay;
    this.maxDelay = 5000;
    this.timer = null;
    this.changeCount = 0;
  }

  trigger(...args) {
    clearTimeout(this.timer);
    this.changeCount++;

    // Increase delay exponentially based on change frequency
    if (this.changeCount > 3) {
      this.currentDelay = Math.min(
        this.currentDelay * 1.5,
        this.maxDelay
      );
    }

    this.timer = setTimeout(() => {
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

---

### Stage 4: Monitoring & Observability (Weeks 7-8) → v0.7.0

**Goal**: Real-time performance monitoring and alerting

#### Metrics Collection

**File**: `mcp-servers/dashboard/lib/metrics/collector.js`
```javascript
/**
 * Time-series metrics collector
 * Stores metrics in circular buffer for memory efficiency
 */
class MetricsCollector {
  constructor(options = {}) {
    this.maxDataPoints = options.maxDataPoints || 1000;
    this.metrics = new Map();
  }

  /**
   * Record metric value
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   * @param {Object} [tags={}] - Metric tags
   */
  record(name, value, tags = {}) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, new CircularBuffer(this.maxDataPoints));
    }

    const buffer = this.metrics.get(name);
    buffer.push({
      timestamp: Date.now(),
      value,
      tags
    });
  }

  /**
   * Get metric statistics
   * @param {string} name
   * @param {Object} options
   * @returns {Object} Stats (min, max, avg, p50, p95, p99)
   */
  getStats(name, options = {}) {
    const buffer = this.metrics.get(name);
    if (!buffer) return null;

    const values = buffer.toArray()
      .filter(dp => {
        if (options.since) {
          return dp.timestamp >= options.since;
        }
        return true;
      })
      .map(dp => dp.value)
      .sort((a, b) => a - b);

    if (values.length === 0) return null;

    return {
      count: values.length,
      min: values[0],
      max: values[values.length - 1],
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      p50: percentile(values, 50),
      p95: percentile(values, 95),
      p99: percentile(values, 99)
    };
  }
}

/**
 * Calculate percentile
 * @param {number[]} sortedValues
 * @param {number} p - Percentile (0-100)
 * @returns {number}
 */
function percentile(sortedValues, p) {
  const index = (p / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

/**
 * Circular buffer for memory-efficient time-series storage
 */
class CircularBuffer {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.buffer = new Array(maxSize);
    this.index = 0;
    this.size = 0;
  }

  push(item) {
    this.buffer[this.index] = item;
    this.index = (this.index + 1) % this.maxSize;
    this.size = Math.min(this.size + 1, this.maxSize);
  }

  toArray() {
    if (this.size < this.maxSize) {
      return this.buffer.slice(0, this.size);
    }

    // Reconstruct in chronological order
    return [
      ...this.buffer.slice(this.index),
      ...this.buffer.slice(0, this.index)
    ];
  }
}

module.exports = { MetricsCollector };
```

## Success Metrics

- [ ] <50ms p95 response time for all API endpoints
- [ ] 90%+ cache hit rate for work effort queries
- [ ] Support 1000+ work efforts without degradation
- [ ] 2-10x faster parsing with parallel workers
- [ ] Database sync completes in <1 second
- [ ] Memory usage stays under 200MB
- [ ] Zero cache invalidation bugs

## Next Steps

Proceed to [Phase 3: Intelligence & Analytics](../phase-3-intelligence/README.md).
