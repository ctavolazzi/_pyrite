# Testing Guide - Mission Control Dashboard

This guide explains how to write and organize tests for the Mission Control dashboard, with a focus on data flow testing.

## Test Structure

```
tests/
├── data-flow/              # Data flow path tests
│   ├── parser-flow/        # Path 1: File → Parser → Objects
│   ├── watcher-flow/       # Path 2: File Change → Watcher → Events
│   ├── websocket-flow/     # Path 3: Server → WebSocket → Client
│   ├── client-flow/        # Path 4: Client State → EventBus → UI
│   └── integration-flow/  # Path 5: End-to-end flows
├── helpers/                # Shared test utilities
│   ├── mock-event-bus.js
│   ├── mission-control-harness.js
│   ├── fixtures.js
│   └── README.md
└── test-runner.js          # Test execution script
```

## Data Flow Paths

### Path 1: Parser Flow
**File System → Parsed Objects**

Tests how markdown files are parsed into structured objects.

```javascript
import { parseRepo } from '../../lib/parser.js';
import { createWorkEffortFixture } from '../helpers/fixtures.js';

test('parses work effort from markdown', async () => {
  const result = await parseRepo(testRepoPath);
  assert.strictEqual(result.workEfforts.length, 1);
});
```

**What to test:**
- Frontmatter parsing
- Body content extraction
- Format detection (MCP vs Johnny Decimal)
- Error handling for malformed files

### Path 2: Watcher Flow
**File Change → Watcher → Server State**

Tests how file system changes trigger updates.

```javascript
import { DebouncedWatcher } from '../../lib/watcher.js';

test('watcher detects file changes', async () => {
  const watcher = new DebouncedWatcher(repoPath);
  const events = [];

  watcher.on('update', () => events.push('update'));
  await fs.writeFile(testFile, content);

  await new Promise(resolve => setTimeout(resolve, 600));
  assert.strictEqual(events.length, 1);
});
```

**What to test:**
- Debouncing behavior
- Throttling behavior
- Multiple file changes
- Error recovery

### Path 3: WebSocket Flow
**Server State → WebSocket → Client Message**

Tests how server state is serialized and sent to clients.

```javascript
test('server broadcasts state updates', () => {
  const messages = [];
  mockWebSocket.on('message', (msg) => messages.push(JSON.parse(msg)));

  server.broadcast({ type: 'update', repo: '_pyrite', ... });

  assert.strictEqual(messages.length, 1);
  assert.strictEqual(messages[0].type, 'update');
});
```

**What to test:**
- Message serialization
- Broadcast to all clients
- Message format correctness
- Error handling

### Path 4: Client Flow
**WebSocket Message → Client State → EventBus**

Tests how client processes messages and emits events.

```javascript
import { MissionControlHarness } from '../helpers/mission-control-harness.js';
import { createTestScenario } from '../helpers/fixtures.js';

test('client detects new work effort', () => {
  const harness = new MissionControlHarness();
  const scenario = createTestScenario({ workEffortCount: 1 });

  harness.handleMessage(scenario.initMessage);
  harness.handleMessage(createUpdateMessageFixture('_pyrite', [newWE], stats));

  const events = harness.eventBus.getEventsByType('workeffort:created');
  assert.strictEqual(events.length, 1);
});
```

**What to test:**
- State updates
- Change detection
- Event emission
- Event payload correctness

### Path 5: Integration Flow
**End-to-End: File System → UI**

Tests complete data flow paths.

```javascript
test('complete flow: file change → UI update', async () => {
  // 1. Create file
  await createWorkEffortFile(repoPath, weId, title);

  // 2. Wait for watcher
  await waitForWatcher();

  // 3. Verify parser
  const parsed = await parseRepo(repoPath);

  // 4. Verify server state
  const serverState = getServerState('_pyrite');

  // 5. Verify client received message
  const clientMessage = await waitForWebSocketMessage();

  // 6. Verify client state
  const clientState = harness.getRepoState('_pyrite');

  // 7. Verify events emitted
  const events = harness.eventBus.getAllEvents();

  assert.ok(events.some(e => e.type === 'workeffort:created'));
});
```

**What to test:**
- Complete transformation chain
- Data consistency across layers
- Error propagation
- Performance characteristics

## Using Test Helpers

### MockEventBus

```javascript
import { MockEventBus } from '../helpers/mock-event-bus.js';

const eventBus = new MockEventBus();
eventBus.on('workeffort:*', handler);
eventBus.emit('workeffort:created', data);

const events = eventBus.getEventsByType('workeffort:created');
```

### MissionControlHarness

```javascript
import { MissionControlHarness } from '../helpers/mission-control-harness.js';

const harness = new MissionControlHarness();
harness.handleMessage({ type: 'init', repos: {...} });
harness.handleMessage({ type: 'update', repo: '_pyrite', ... });

const events = harness.eventBus.getAllEvents();
const state = harness.getRepoState('_pyrite');
```

### Fixtures

```javascript
import {
  createWorkEffortFixture,
  createTicketFixture,
  createTestScenario
} from '../helpers/fixtures.js';

// Individual fixtures
const we = createWorkEffortFixture('WE-123', 'Title', 'active');
const ticket = createTicketFixture('TKT-123-001', 'Ticket', 'pending');

// Complete scenario
const scenario = createTestScenario({
  workEffortCount: 3,
  ticketsPerWE: 2
});
```

## Test Organization Best Practices

### 1. Group by Data Flow Path

Each test file should focus on one data flow path:
- `parser-flow.test.js` - Only parser tests
- `watcher-flow.test.js` - Only watcher tests
- etc.

### 2. Use Descriptive Test Names

```javascript
// Good
test('detects new work effort when file is created', ...);
test('emits workeffort:created event with correct payload', ...);

// Bad
test('test 1', ...);
test('works', ...);
```

### 3. Test One Thing Per Test

```javascript
// Good - focused test
test('detects new work effort', () => {
  // Test only new work effort detection
});

// Bad - multiple concerns
test('detects changes and emits events and updates UI', () => {
  // Too many things
});
```

### 4. Use Fixtures for Test Data

```javascript
// Good - reusable fixtures
const we = createWorkEffortFixture('WE-123', 'Test', 'active');

// Bad - inline objects
const we = { id: 'WE-123', title: 'Test', status: 'active', ... };
```

### 5. Verify Event Emission

Always verify that events are emitted correctly:

```javascript
test('emits correct event', () => {
  const harness = new MissionControlHarness();
  // ... setup ...

  const events = harness.eventBus.getEventsByType('workeffort:created');
  assert.strictEqual(events.length, 1);
  assert.strictEqual(events[0].data.id, 'WE-123');
  assert.strictEqual(events[0].data.repo, '_pyrite');
});
```

## Running Tests

```bash
# Run all tests
node tests/test-runner.js

# Run specific test file
node tests/data-flow/client-flow.test.js

# Run with Node.js test runner
node --test tests/data-flow/client-flow.test.js
```

## Debugging Tests

### Enable Event Logging

```javascript
const eventBus = new MockEventBus();
eventBus.on('*', (event) => console.log('Event:', event.type, event.data));
```

### Inspect State

```javascript
const harness = new MissionControlHarness();
// ... operations ...
console.log('Repos:', JSON.stringify(harness.getAllRepos(), null, 2));
console.log('Events:', harness.eventBus.getAllEvents());
```

### Use Test Scenarios

```javascript
const scenario = createTestScenario({ workEffortCount: 5 });
console.log('Scenario:', JSON.stringify(scenario, null, 2));
```

## Related Documentation

- [DATA_FLOW_MAP.md](./data-flow/DATA_FLOW_MAP.md) - Complete data flow documentation
- [helpers/README.md](./helpers/README.md) - Test helpers reference
- [Event Bus Pattern](../../_docs/20-29_development/architecture_category/architecture.01_event_bus_pattern_implementation.md) - Event bus architecture

