# Data Flow Map - Mission Control Dashboard

This document maps all data transformation points in the Mission Control dashboard system. Each section documents HOW data changes as it flows through the system.

## Data Flow Paths

### Path 1: Initial Load
**File System → UI**

```
File System (Markdown Files)
  ↓ [fs.readFile, fs.readdir]
Raw File Content (strings)
  ↓ [gray-matter.parse]
Frontmatter + Body (objects)
  ↓ [parseMCPWorkEffort / parseJohnnyDecimalFile]
WorkEffort Objects
  ↓ [getRepoStats]
RepoStats Object
  ↓ [Map.set]
Server RepoState (in-memory)
  ↓ [JSON.stringify]
WebSocket Message (JSON string)
  ↓ [WebSocket.send]
Client Receives Message
  ↓ [JSON.parse]
Client Parsed Message
  ↓ [handleMessage]
Client.repos State
  ↓ [render* methods]
DOM Updates
```

**Transformation Points:**
1. **File → Content**: `fs.readFile()` reads markdown files
2. **Content → Parsed**: `gray-matter()` extracts frontmatter
3. **Parsed → WorkEffort**: `parseMCPWorkEffort()` creates structured objects
4. **WorkEfforts → Stats**: `getRepoStats()` aggregates statistics
5. **State → JSON**: `JSON.stringify()` serializes for WebSocket
6. **JSON → State**: `JSON.parse()` deserializes on client
7. **State → UI**: `render*()` methods update DOM

### Path 2: File Change Detection
**File Change → UI Update**

```
File System Change (add/change/unlink)
  ↓ [chokidar.watch]
chokidar Event
  ↓ [DebouncedWatcher.scheduleUpdate]
Debounced Update (500ms delay)
  ↓ [Throttle Check]
Throttled Event (min 2s interval)
  ↓ [watcher.emit('update')]
Server refreshRepo() Triggered
  ↓ [parseRepo()]
New WorkEffort Objects
  ↓ [getRepoStats()]
Updated RepoStats
  ↓ [repoState.set()]
Updated Server State
  ↓ [broadcast()]
WebSocket Message
  ↓ [Client.handleMessage()]
Client State Update
  ↓ [detectAndEmitChanges()]
EventBus Events
  ↓ [EventBus.emit()]
Subscribers Notified
  ↓ [ToastManager / AnimationController]
UI Updates
```

**Transformation Points:**
1. **Change → Event**: chokidar detects file system changes
2. **Event → Debounced**: `scheduleUpdate()` batches rapid changes
3. **Debounced → Throttled**: Minimum interval enforced
4. **Throttled → Parse**: `parseRepo()` re-reads directory
5. **Parse → State**: `repoState.set()` updates in-memory state
6. **State → Broadcast**: `broadcast()` sends to all clients
7. **Message → Events**: `detectAndEmitChanges()` emits EventBus events
8. **Events → UI**: Subscribers update UI components

### Path 3: Client Action
**User Click → File Write**

```
User Click (DOM Event)
  ↓ [Event Handler]
Client Action Method
  ↓ [fetch() or WebSocket.send]
HTTP Request / WebSocket Message
  ↓ [Express Route Handler]
Server Action Handler
  ↓ [fs.writeFile()]
File System Write
  ↓ [chokidar detects change]
File Change Event
  ↓ [Watcher → Parser → State → Broadcast]
(Follows Path 2)
```

**Transformation Points:**
1. **Click → Action**: Event handler calls client method
2. **Action → Request**: HTTP POST/PATCH or WebSocket message
3. **Request → Handler**: Express route processes request
4. **Handler → File**: `fs.writeFile()` writes to disk
5. **File → Change**: chokidar detects write
6. **Change → Update**: Follows Path 2 to update UI

### Path 4: Event Propagation
**WebSocket Message → UI Components**

```
WebSocket Message Received
  ↓ [handleMessage()]
Message Parsed
  ↓ [detectAndEmitChanges()]
Change Detection Logic
  ↓ [EventBus.emit('workeffort:created')]
Event Emitted
  ↓ [EventBus Middleware]
Middleware Processing
  ↓ [Subscribers Receive]
Event Listeners Called
  ↓ [ToastManager.show()]
Toast Notification
  ↓ [AnimationController.animate()]
UI Animation
  ↓ [DOM Update]
Visual Change
```

**Transformation Points:**
1. **Message → Changes**: `detectAndEmitChanges()` compares old/new state
2. **Changes → Events**: Specific event types emitted (`workeffort:created`, etc.)
3. **Events → Middleware**: Middleware can intercept/modify events
4. **Events → Subscribers**: Wildcard subscriptions (`workeffort:*`) receive events
5. **Subscribers → Actions**: ToastManager, AnimationController react
6. **Actions → DOM**: UI components update

## Data Structures

### WorkEffort Object Shape
```javascript
{
  id: string,              // "WE-260102-abc1"
  format: 'mcp' | 'jd',     // Format type
  title: string,            // From frontmatter
  status: string,           // active/paused/completed
  path: string,             // Absolute file path
  created: string | null,   // ISO timestamp
  tickets: Ticket[],       // MCP format only
  branch: string | null,    // MCP format only
  repository: string | null // MCP format only
}
```

### Ticket Object Shape
```javascript
{
  id: string,               // "TKT-abc1-001"
  title: string,            // From frontmatter
  status: string,           // pending/in_progress/completed/blocked
  path: string,             // Absolute file path
  parent: string            // Parent WE ID
}
```

### RepoStats Object Shape
```javascript
{
  total: number,                    // Total work efforts
  byFormat: { mcp: number, jd: number },
  byStatus: { [status]: number },   // Count by status
  totalTickets: number,
  ticketsByStatus: { [status]: number }
}
```

### RepoState Object Shape
```javascript
{
  workEfforts: WorkEffort[],
  stats: RepoStats,
  error: string | null,
  lastUpdated: string  // ISO timestamp
}
```

### WebSocket Message Types

**Init Message:**
```javascript
{
  type: 'init',
  repos: {
    [repoName]: RepoState
  }
}
```

**Update Message:**
```javascript
{
  type: 'update',
  repo: string,
  workEfforts: WorkEffort[],
  stats: RepoStats,
  error: string | null
}
```

**Repo Change Message:**
```javascript
{
  type: 'repo_change',
  action: 'added' | 'removed' | 'bulk_added',
  repo: string,
  repos?: Array<{name: string, path: string}>  // For bulk_added
}
```

**Error Message:**
```javascript
{
  type: 'error',
  repo: string,
  message: string
}
```

## Key Transformation Functions

### Parser Layer
- `parseRepo()`: Main entry point, detects format, delegates parsing
- `parseMCPWorkEffort()`: Parses MCP format work effort
- `parseMCPTickets()`: Parses tickets within MCP work effort
- `parseJohnnyDecimalCategory()`: Parses JD category structure
- `getRepoStats()`: Aggregates statistics from work efforts

### Watcher Layer
- `DebouncedWatcher.scheduleUpdate()`: Batches rapid changes
- `DebouncedWatcher.emit('update')`: Emits throttled update events

### Server Layer
- `initRepo()`: Initializes repository, parses, starts watching
- `refreshRepo()`: Re-parses and updates state
- `broadcast()`: Sends WebSocket message to all clients

### Client Layer
- `handleMessage()`: Processes incoming WebSocket messages
- `detectAndEmitChanges()`: Compares old/new state, emits events
- `render*()`: Updates DOM based on state

### Event Layer
- `EventBus.emit()`: Publishes events to subscribers
- `EventBus.on()`: Subscribes to events (supports wildcards)
- `ToastManager.show()`: Displays toast notifications
- `AnimationController.animate()`: Triggers UI animations

## Performance Considerations

1. **Debouncing**: 500ms delay batches rapid file changes
2. **Throttling**: Minimum 2 seconds between updates per repo
3. **Lazy Parsing**: Only parses when files change
4. **In-Memory State**: RepoState kept in memory, not re-read on every request
5. **Selective Updates**: Only changed repos broadcast updates

## Error Handling

Errors can occur at multiple points:
1. **Parser Errors**: Invalid file format, missing files → `ParseResult.error`
2. **Watcher Errors**: File system issues → `watcher.emit('error')`
3. **Server Errors**: Parsing failures → `RepoState.error`
4. **WebSocket Errors**: Connection issues → `ws.emit('error')`
5. **Client Errors**: Invalid messages → Logged, not propagated

Each error is captured and included in the data flow, allowing UI to display error states.

