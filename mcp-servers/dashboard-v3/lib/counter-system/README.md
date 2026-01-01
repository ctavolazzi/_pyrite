# Counter System

A comprehensive sequential numbering system for work efforts, tickets, and checkpoints.

## Overview

The Counter System provides centralized, persistent counter management with:

- **Sequential numbering** for all entities
- **State persistence** with integrity checking
- **Validation** against filesystem
- **Auto-repair** capabilities
- **Audit trail** for all counter operations
- **Migration tools** for existing data

## Architecture

```
counter-system/
├── index.js          # Core CounterService
├── validator.js      # Validation & integrity checking
├── migrator.js       # Migration utilities
├── state.json        # Persistent counter state
└── README.md         # Documentation
```

## Components

### CounterService (`index.js`)

Main service for counter operations.

**Key Methods:**

- `initialize()` - Initialize the system
- `getNext(type, context)` - Get next sequential number
- `getCurrentCounters()` - Get all current counter values
- `setCounter(path, value, reason)` - Manually set a counter
- `verifyIntegrity()` - Verify state integrity
- `getAuditLog(limit)` - Get audit history
- `getStatistics()` - Get system statistics

**Counter Types:**

- `workEffort` - Work effort counters
- `ticket` - Ticket counters
- `checkpoint` - Checkpoint counters

**Context Parameters:**

- `repo` - Repository name
- `parentWE` - Parent work effort ID

**Example Usage:**

```javascript
const { getCounterSystem } = require('./counter-system');

// Initialize
const counter = await getCounterSystem();

// Get next work effort number
const weNum = await counter.getNext('workEffort', { repo: '_pyrite' });
console.log(weNum); // 1, 2, 3...

// Get next ticket number
const ticketNum = await counter.getNext('ticket', {
  parentWE: 'WE-251231-abcd',
  repo: '_pyrite'
});
console.log(ticketNum); // 1, 2, 3...

// Get current state
const counters = counter.getCurrentCounters();
console.log(counters.workEfforts.global); // 42
console.log(counters.tickets.byWorkEffort['WE-251231-abcd']); // 5
```

### CounterValidator (`validator.js`)

Validates counter state against filesystem.

**Key Methods:**

- `validate()` - Run full validation
- `validateWorkEffortsCount()` - Validate WE count
- `validateTicketsCount()` - Validate ticket count
- `validatePerWorkEffortCounts()` - Validate per-WE counts
- `validateStateIntegrity()` - Validate checksum
- `validateIDFormats()` - Validate ID formats
- `autoRepair(results)` - Auto-repair discrepancies

**Example Usage:**

```javascript
const CounterValidator = require('./counter-system/validator');

const validator = new CounterValidator(
  counterSystem,
  '/path/to/_work_efforts'
);

// Run validation
const results = await validator.validate();
console.log(results.status); // 'valid' or 'invalid'
console.log(results.discrepancies);

// Auto-repair
if (results.status === 'invalid') {
  const repairs = await validator.autoRepair(results);
  console.log(`Repaired ${repairs.successCount} issues`);
}
```

### CounterMigrator (`migrator.js`)

Migrates existing data to counter system.

**Key Methods:**

- `scanAndInitialize()` - Scan filesystem
- `initializeFromScan(results)` - Initialize counters
- `migrate()` - Full migration
- `generateReport()` - Generate migration report
- `previewMigration()` - Preview changes

**Example Usage:**

```javascript
const CounterMigrator = require('./counter-system/migrator');

const migrator = new CounterMigrator(
  counterSystem,
  '/path/to/_work_efforts'
);

// Preview migration
const preview = await migrator.previewMigration();
console.log(preview.changes);

// Run migration
if (preview.needsMigration) {
  const results = await migrator.migrate();
  console.log('Migration complete');
}
```

## State Structure

The counter state is stored in `state.json`:

```json
{
  "version": "1.0.0",
  "created": "2025-12-31T00:00:00.000Z",
  "lastUpdated": "2025-12-31T12:00:00.000Z",
  "counters": {
    "workEfforts": {
      "global": 42,
      "byRepo": {
        "_pyrite": 42,
        "other-repo": 0
      }
    },
    "tickets": {
      "global": 156,
      "byWorkEffort": {
        "WE-251231-0001": 12,
        "WE-251231-0002": 8
      },
      "byRepo": {
        "_pyrite": 156
      }
    },
    "checkpoints": {
      "global": 34
    }
  },
  "integrity": {
    "checksum": "sha256-hash",
    "lastValidation": "2025-12-31T12:00:00.000Z",
    "validationStatus": "valid"
  },
  "audit": [
    {
      "timestamp": "2025-12-31T12:00:00.000Z",
      "action": "increment",
      "counter": "workEfforts.global",
      "value": 42,
      "context": { "repo": "_pyrite" }
    }
  ]
}
```

## Integrity & Validation

### Checksum

The system calculates a SHA-256 checksum of the counter data (excluding audit log) to detect corruption.

### Validation Checks

1. **Work Efforts Count** - Verifies global count matches filesystem
2. **Tickets Count** - Verifies total ticket count
3. **Per-WE Counts** - Verifies ticket count per work effort
4. **State Integrity** - Verifies checksum
5. **ID Formats** - Verifies naming conventions

### Auto-Repair

The validator can automatically repair:

- Counter mismatches (updates to match filesystem)
- Checksum errors (recalculates)
- Per-work-effort discrepancies

Issues requiring manual intervention:

- Invalid ID formats
- Corrupted state files

## Audit Trail

All counter operations are logged in the audit trail:

```json
{
  "timestamp": "2025-12-31T12:00:00.000Z",
  "action": "increment",
  "counter": "workEfforts.global",
  "value": 42,
  "context": { "repo": "_pyrite" }
}
```

The audit log keeps the last 1000 entries.

## Migration

### Initial Setup

1. Run scan to count existing items:

```javascript
const results = await migrator.scanAndInitialize();
```

2. Initialize counters from scan:

```javascript
await migrator.initializeFromScan(results);
```

### Ongoing Validation

Run validation periodically:

```javascript
const results = await validator.validate();

if (results.status === 'invalid') {
  await validator.autoRepair(results);
}
```

## Events

The CounterSystem emits events:

- `initialized` - System initialized
- `counterIncremented` - Counter incremented
- `counterSet` - Counter manually set

**Example:**

```javascript
counter.on('counterIncremented', ({ type, counter, context }) => {
  console.log(`${type} counter incremented to ${counter}`);
});
```

## Thread Safety

The counter system uses a simple lock mechanism to prevent race conditions when incrementing counters. Only one operation can modify state at a time.

## Error Handling

All methods throw errors on failure. Wrap in try-catch:

```javascript
try {
  const num = await counter.getNext('workEffort', { repo: '_pyrite' });
} catch (error) {
  console.error('Failed to get next number:', error);
}
```

## Performance

- State file is loaded once on initialization
- Saved to disk on every counter update
- Validation scans filesystem (can be slow for large repos)
- Run validation on a schedule, not on every operation

## Future Enhancements

- [ ] Support for sequential numbering in folder names
- [ ] Automatic ID migration/renaming
- [ ] Multi-repository coordination
- [ ] Database backend (SQLite)
- [ ] WebSocket events for real-time updates
- [ ] RESTful API endpoints
