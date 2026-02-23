---
name: Core Architecture - Indexed from Start
overview: Simplified architecture that always uses sidecar index and FIFO queue from the start. No adaptive modes - just build it right from day one.
todos: []
---

# Core Architecture Implementation Plan (Simplified)

## Context

You're right - if we need the queue for concurrency and the index for performance anyway, why add the complexity of adaptive modes? Let's just build it indexed from the start.

**Key Insight:**
- Queue is needed for concurrent writes (always)
- Index is needed for instant lookups (from day 1)
- SQLite overhead is minimal (~1MB database, ~0.005s lookups)
- Simpler codebase = easier to maintain

## Architecture (Single Mode)

### Always-On Features

- **Storage**: File system + Sidecar SQLite index
- **Lookups**: O(1) index queries (~0.005s)
- **Writes**: FIFO queue (prevents git lock contention)
- **Git**: Queued git operations (sequential processing)
- **Performance**: Instant lookups, safe concurrent writes

## Implementation Phases

### Phase 1: Command Pattern Foundation (Job & JobQueue)

**Files to Create:**
- `core/QueueSystem.js` - Job and JobQueue classes
- `test-queue.js` - Validation script

**Job Class:**
- Properties: `id`, `type`, `payload`, `status`, `logs`, `createdAt`
- Method: `log(message)` for audit trail
- Status transitions: `pending` → `processing` → `completed`/`failed`

**JobQueue Class:**
- Properties: `queue[]`, `isProcessing` flag
- Methods:
  - `add(type, payload)` - Enqueue job, trigger processing
  - `processNext()` - Sequential processing loop (with lock)
  - `executeJob(job)` - Worker (will be replaced with real operations)
  - `getPending()` - Helper to inspect queue

**Key Features:**
- Sequential processing (only one job at a time)
- Error isolation (try/catch/finally)
- Auto-continuation (recursive `processNext()`)
- Mock implementation initially (setTimeout simulation)

### Phase 2: Sidecar Index

**Files to Create:**
- `core/SidecarIndex.js` - SQLite index operations
- `core/index-schema.sql` - Database schema

**SQLite Schema:**
```sql
CREATE TABLE work_efforts_index (
  id TEXT PRIMARY KEY,              -- WE-YYMMDD-xxxx
  file_path TEXT NOT NULL,         -- Absolute path to index.md
  etag TEXT NOT NULL,              -- File hash for validation
  last_modified INTEGER NOT NULL,  -- Unix timestamp
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_work_efforts_updated ON work_efforts_index(updated_at DESC);
```

**SidecarIndex Class:**
- `initialize()` - Create database, run migrations
- `get(id)` - O(1) lookup by ID → returns file_path, etag
- `set(id, file_path, etag)` - Insert/update index entry
- `delete(id)` - Remove index entry
- `validate(id, file_path)` - Check etag matches file hash
- `rebuild()` - Scan file system, rebuild entire index

### Phase 3: Write Queue Processor (Real Operations)

**Files to Modify:**
- `core/QueueSystem.js` - Replace mock `executeJob` with real operations

**Job Types:**
- `CREATE_WORK_EFFORT` - Create directory, files, git branch, index entry
- `UPDATE_WORK_EFFORT` - Update file, git commit, index entry
- `DELETE_WORK_EFFORT` - Delete directory, git branch, index entry
- `CREATE_TICKET` - Create ticket file, git commit, index entry
- `UPDATE_TICKET` - Update ticket file, git commit, index entry

**Transaction Flow:**
1. Acquire git lock (`.git/index.lock`)
2. Execute file operations (atomic writes)
3. Update sidecar index
4. Execute git operations (checkout, commit, merge)
5. Release git lock
6. Emit EventBus event
7. Return result

**Error Handling:**
- If any step fails, rollback previous steps
- Mark job as `failed` with error message
- Queue continues processing next job

### Phase 4: Path Generator & ID Collision Detection

**Files to Create:**
- `core/PathGenerator.js` - Generate canonical paths
- `core/IDGenerator.js` - Generate IDs with collision detection

**PathGenerator:**
- `getWorkEffortPath(we_id, title)` → `_work_efforts/WE-YYMMDD-xxxx_{slug}/`
- `getIndexFilePath(we_path)` → `WE-YYMMDD-xxxx_index.md`
- `getTicketsDir(we_path)` → `tickets/`
- `getTicketPath(we_path, ticket_id, title)` → `tickets/TKT-xxxx-NNN_{slug}.md`

**IDGenerator:**
- `generateWorkEffortId()` - Date + random suffix
- `checkCollision(id)` - Query sidecar index
- `generateUniqueId()` - Generate with collision retry (max 10 attempts)

### Phase 5: Integration & Testing

**Files to Create:**
- `tests/queue-system.test.js` - Unit tests for Job/JobQueue
- `tests/sidecar-index.test.js` - Unit tests for index operations
- `tests/integration.test.js` - End-to-end tests

**Test Coverage:**
- Queue sequential processing
- Queue error recovery
- Index O(1) lookups
- Index etag validation
- ID collision detection
- Path generation
- Transaction rollback
- Git lock contention prevention

## File Structure

```
_pyrite/
├── core/
│   ├── QueueSystem.js          # Job & JobQueue classes
│   ├── SidecarIndex.js         # SQLite index operations
│   ├── PathGenerator.js        # Path generation utilities
│   ├── IDGenerator.js          # ID generation with collision detection
│   └── index-schema.sql        # SQLite schema
├── .pyrite/
│   └── pyrite_index.db        # SQLite database (created on init)
├── tests/
│   ├── queue-system.test.js
│   ├── sidecar-index.test.js
│   └── integration.test.js
└── test-queue.js               # Validation script (Phase 1)
```

## Success Criteria

**Phase 1 Complete:**
- ✅ Job and JobQueue classes implemented
- ✅ Test script validates sequential processing
- ✅ Test script validates error recovery
- ✅ No external dependencies (pure Node.js)

**Phase 2 Complete:**
- ✅ SQLite index created and initialized
- ✅ O(1) lookup operations working
- ✅ ETag validation working
- ✅ Index rebuild functionality

**Phase 3 Complete:**
- ✅ Real file operations integrated
- ✅ Git operations integrated
- ✅ Transaction rollback working
- ✅ EventBus integration

**Phase 4 Complete:**
- ✅ Path generation working
- ✅ ID collision detection working
- ✅ All utilities tested

**Phase 5 Complete:**
- ✅ Unit tests passing
- ✅ Integration tests passing
- ✅ Performance validated (O(1) lookups)

## Why This Is Better

**Simplicity:**
- No mode detection logic
- No migration code
- No threshold configuration
- One code path to maintain

**Performance:**
- Instant lookups from day 1
- Safe concurrent writes from day 1
- No performance degradation as scale grows

**Overhead:**
- SQLite database: ~1MB (negligible)
- Index initialization: One-time cost on first use
- Queue: Always needed for concurrency anyway

**Maintainability:**
- Less code = fewer bugs
- Easier to understand
- Easier to test
- Easier to extend

## Risk Mitigation

**Git Lock Contention:**
- ✅ FIFO queue ensures sequential git operations
- ✅ Single worker pattern prevents concurrent commits

**Index Desync:**
- ✅ Queue as transaction boundary
- ✅ Index rebuild on startup if corruption detected
- ✅ ETag validation on read

**ID Collision:**
- ✅ Check index before create
- ✅ Retry with new suffix (max 10 attempts)

**Performance:**
- ✅ Sidecar index enables O(1) lookups from start
- ✅ No performance degradation at scale

**Queue Overflow:**
- ✅ Bounded queue (max 1000 items)
- ✅ Backpressure (reject when full)

## Dependencies

- `better-sqlite3` or `sqlite3` - SQLite database
- `gray-matter` - YAML frontmatter parsing (already in use)
- `fs/promises` - File system operations
- `child_process` - Git command execution

## Out of Scope (Future Phases)

- API layer implementation
- Authentication/authorization
- Multi-repository coordination
- Performance benchmarking
- Search/filtering logic
- Binary asset storage

