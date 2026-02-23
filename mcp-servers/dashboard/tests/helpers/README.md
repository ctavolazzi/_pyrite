# Test Helpers

Shared utilities and helpers for the Mission Control dashboard test suite.

## Overview

This directory contains reusable test utilities that can be imported across all test files to reduce duplication and improve maintainability.

## Available Helpers

### `mock-event-bus.js`

**MockEventBus** - Event bus mock for testing event emission and subscription.

```javascript
import { MockEventBus } from './helpers/mock-event-bus.js';

const eventBus = new MockEventBus();
eventBus.on('workeffort:*', (event) => console.log(event));
eventBus.emit('workeffort:created', { id: 'WE-123' });

const events = eventBus.getEventsByType('workeffort:created');
```

**Features:**
- Wildcard subscription support (`'workeffort:*'`)
- Middleware pipeline
- Event history tracking
- Pattern matching

### `mission-control-harness.js`

**MissionControlHarness** - Test harness for MissionControl state management.

```javascript
import { MissionControlHarness } from './helpers/mission-control-harness.js';

const harness = new MissionControlHarness();
harness.handleMessage({
  type: 'init',
  repos: { '_pyrite': { workEfforts: [], stats: {} } }
});

const events = harness.eventBus.getEventsByType('system:connected');
```

**Features:**
- State management (repos object)
- WebSocket message handling
- Change detection and event emission
- EventBus integration

### `fixtures.js`

**Fixture Generators** - Functions to create test data structures.

```javascript
import {
  createWorkEffortFixture,
  createTicketFixture,
  createTestScenario
} from './helpers/fixtures.js';

// Create individual fixtures
const we = createWorkEffortFixture('WE-260102-test', 'Test Work', 'active');
const ticket = createTicketFixture('TKT-test-001', 'Test Ticket', 'pending');

// Create complete test scenario
const scenario = createTestScenario({
  workEffortCount: 3,
  ticketsPerWE: 2
});
```

**Available Functions:**
- `createWorkEffortFixture(id, title, status, options)` - Work effort object
- `createTicketFixture(id, title, status, options)` - Ticket object
- `createRepoStatsFixture(options)` - Repository statistics
- `createRepoStateFixture(repoName, workEfforts, options)` - Repository state
- `createWebSocketMessageFixture(type, payload)` - WebSocket message
- `createInitMessageFixture(repos)` - Init message
- `createUpdateMessageFixture(repo, workEfforts, stats)` - Update message
- `createTestScenario(options)` - Complete test scenario

## Usage Examples

### Testing Event Emission

```javascript
import { MockEventBus } from './helpers/mock-event-bus.js';
import assert from 'node:assert';

test('emits workeffort:created event', () => {
  const eventBus = new MockEventBus();
  const events = [];

  eventBus.on('workeffort:created', (event) => events.push(event));
  eventBus.emit('workeffort:created', { id: 'WE-123' });

  assert.strictEqual(events.length, 1);
  assert.strictEqual(events[0].data.id, 'WE-123');
});
```

### Testing State Management

```javascript
import { MissionControlHarness } from './helpers/mission-control-harness.js';
import { createTestScenario } from './helpers/fixtures.js';
import assert from 'node:assert';

test('handles init message', () => {
  const harness = new MissionControlHarness();
  const scenario = createTestScenario({ workEffortCount: 2 });

  harness.handleMessage(scenario.initMessage);

  const repos = harness.getAllRepos();
  assert.strictEqual(Object.keys(repos).length, 1);
  assert.strictEqual(repos['_pyrite'].workEfforts.length, 2);
});
```

### Testing Change Detection

```javascript
import { MissionControlHarness } from './helpers/mission-control-harness.js';
import { createWorkEffortFixture } from './helpers/fixtures.js';
import assert from 'node:assert';

test('detects new work effort', () => {
  const harness = new MissionControlHarness();

  // Initial state
  harness.handleMessage({
    type: 'init',
    repos: { '_pyrite': { workEfforts: [], stats: {} } }
  });

  // Update with new work effort
  const newWE = createWorkEffortFixture('WE-123', 'New Work', 'active');
  harness.handleMessage({
    type: 'update',
    repo: '_pyrite',
    workEfforts: [newWE],
    stats: { totalWorkEfforts: 1 }
  });

  const events = harness.eventBus.getEventsByType('workeffort:created');
  assert.strictEqual(events.length, 1);
});
```

## Migration Guide

If you have existing tests using inline MockEventBus or MissionControlHarness:

1. **Import the shared version:**
   ```javascript
   // Before
   class MockEventBus { ... }

   // After
   import { MockEventBus } from './helpers/mock-event-bus.js';
   ```

2. **Update fixture creation:**
   ```javascript
   // Before
   const we = { id: 'WE-123', title: 'Test', status: 'active' };

   // After
   import { createWorkEffortFixture } from './helpers/fixtures.js';
   const we = createWorkEffortFixture('WE-123', 'Test', 'active');
   ```

3. **Use test scenarios for complex setups:**
   ```javascript
   // Before
   const repos = { /* manually constructed */ };

   // After
   import { createTestScenario } from './helpers/fixtures.js';
   const scenario = createTestScenario({ workEffortCount: 3 });
   ```

## Contributing

When adding new helpers:

1. Add JSDoc comments with `@fileoverview` and `@example`
2. Export all public functions/classes
3. Update this README with usage examples
4. Add tests for the helper itself if it's complex

