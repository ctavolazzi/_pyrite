# Data Flow Testing Suite

This test suite documents **HOW data flows** through the Mission Control dashboard system. These tests focus on data transformations, state propagation, and event flows rather than functional correctness.

## Test Structure

```
tests/data-flow/
├── README.md                    # This file
├── parser-flow.test.js          # File system → Parser → Server State
├── watcher-flow.test.js         # File changes → Watcher → Parser → Broadcast
├── websocket-flow.test.js       # Server State → WebSocket → Client
├── client-flow.test.js          # Client Actions → EventBus → UI Updates
├── integration-flow.test.js      # End-to-end data flow paths
└── fixtures/                    # Test data fixtures
    ├── work-efforts/
    └── tickets/
```

## Data Flow Paths

### Path 1: Initial Load
```
File System → parseRepo() → RepoState → WebSocket.init → Client.repos
```

### Path 2: File Change Detection
```
File Change → chokidar → DebouncedWatcher → parseRepo() → RepoState → WebSocket.update → Client.handleMessage() → EventBus → UI
```

### Path 3: Client Action
```
User Click → Client Action → WebSocket/HTTP → Server → File Write → Watcher → parseRepo() → Broadcast → Client Update
```

### Path 4: Event Propagation
```
WebSocket Message → handleMessage() → detectAndEmitChanges() → EventBus.emit() → Subscribers → ToastManager/AnimationController
```

## Running Tests

```bash
# Run all data flow tests
npm test -- tests/data-flow

# Run specific test file
npm test -- tests/data-flow/parser-flow.test.js

# Run with verbose output
npm test -- tests/data-flow --verbose
```

## Test Philosophy

These tests are **documentation through code**. Each test:
1. Sets up a specific data state
2. Triggers a data flow path
3. Asserts on data transformations at each step
4. Documents the expected shape and content of data

The goal is to understand:
- What data enters the system
- How it's transformed at each layer
- What data exits the system
- Where state is stored and updated

