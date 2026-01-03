---
created: '2026-01-03T04:53:44Z'
id: architecture.01
links:
- '[[00.00_index]]'
- '[[architecture_category_index]]'
related_work_efforts: []
title: Event Bus Pattern Implementation
updated: '2026-01-03T04:53:44Z'
---

# Event Bus Pattern Implementation

**Last Updated:** 2026-01-02  
**Status:** Active Pattern  
**Location:** `mcp-servers/dashboard/public/events.js`

## Overview

The application employs a **pub/sub event bus pattern** (Event Bus → Event → Subscribers) for decoupled communication between components. This pattern enables loose coupling, making the system more maintainable and extensible.

## Pattern Architecture

```
┌─────────────┐
│  Publishers │  (Components that emit events)
└──────┬──────┘
       │ emit()
       ▼
┌─────────────┐
│  Event Bus  │  (Central message broker)
└──────┬──────┘
       │ dispatch
       ▼
┌─────────────┐
│ Subscribers │  (Components that react to events)
└─────────────┘
```

## Implementation Details

### 1. EventBus Class

**Location:** `mcp-servers/dashboard/public/events.js`

The `EventBus` class provides:
- **Wildcard subscriptions** (`'workeffort:*'`, `'ticket:*'`)
- **Middleware pipeline** for event interception
- **Event history tracking** (last 100 events by default)
- **Batched emissions** for rapid events
- **Metrics collection** (total emitted, by type, listener count)

**Key Methods:**
- `on(event, callback, options)` - Subscribe to events
- `emit(event, data, meta)` - Publish events
- `off(event, callback)` - Unsubscribe
- `use(fn)` - Add middleware
- `pause()` / `resume()` - Control emission flow

### 2. Event Types

Events follow a namespace pattern: `namespace:action`

**System Events:**
- `system:connected` - WebSocket connection established
- `system:disconnected` - WebSocket connection lost
- `system:reconnecting` - Reconnection attempt
- `system:error` - System-level error

**Work Effort Events:**
- `workeffort:created` - New work effort detected
- `workeffort:updated` - Work effort modified
- `workeffort:started` - Work effort status changed to active
- `workeffort:completed` - Work effort finished
- `workeffort:paused` - Work effort paused
- `workeffort:deleted` - Work effort removed

**Ticket Events:**
- `ticket:created` - New ticket detected
- `ticket:updated` - Ticket modified
- `ticket:completed` - Ticket finished
- `ticket:blocked` - Ticket blocked

**Repository Events:**
- `repo:added` - Repository added to monitoring
- `repo:removed` - Repository removed
- `repo:synced` - Repository synchronized

**UI Events:**
- `ui:toast` - Toast notification shown/dismissed
- `ui:modal:open` - Modal opened
- `ui:modal:close` - Modal closed
- `ui:navigate` - Navigation occurred

### 3. Subscribers

**Main Application (`app.js`):**
```javascript
this.eventBus.on('workeffort:*', (event) => this.handleWorkEffortEvent(event));
this.eventBus.on('ticket:*', (event) => this.handleTicketEvent(event));
this.eventBus.on('repo:*', (event) => this.handleRepoEvent(event));
this.eventBus.on('system:*', (event) => this.handleSystemEvent(event));
```

**ToastManager:**
- Subscribes to events via `AnimationController`
- Shows notifications based on event type and priority
- Manages toast lifecycle (show, dismiss, auto-dismiss)

**AnimationController:**
- Subscribes to all events (`'*'`)
- Triggers UI animations based on event metadata
- Provides element-specific and selector-based animations

### 4. Event Flow Example

**Work Effort Created Flow:**
```
1. File System Change
   └─> chokidar watcher detects change
   
2. Parser
   └─> parseWorkEffort() extracts data
   
3. WebSocket Message
   └─> Server sends update to client
   
4. Client.handleMessage()
   └─> detectAndEmitChanges() compares state
   
5. EventBus.emit('workeffort:created', data)
   └─> Event published to bus
   
6. Subscribers Notified
   ├─> ToastManager.show() - Shows notification
   ├─> AnimationController.animate() - Triggers animation
   └─> App.handleWorkEffortEvent() - Updates UI state
```

## Usage Examples

### Subscribing to Events

```javascript
// Exact match
eventBus.on('workeffort:created', (event) => {
  console.log('New work effort:', event.data);
});

// Wildcard subscription
eventBus.on('workeffort:*', (event) => {
  console.log('Work effort event:', event.type);
});

// Global subscription
eventBus.on('*', (event) => {
  console.log('Any event:', event.type);
});
```

### Emitting Events

```javascript
// Simple emit
eventBus.emit('workeffort:created', {
  id: 'WE-260102-abc1',
  title: 'New Feature',
  repo: 'my-repo'
});

// With metadata
eventBus.emit('workeffort:completed', data, {
  priority: 'high',
  source: 'user-action'
});
```

### Middleware

```javascript
// Logging middleware
eventBus.use((event) => {
  console.log(`[Event] ${event.type}`, event.data);
  return true; // Continue propagation
});

// Filtering middleware
eventBus.use((event) => {
  if (event.type.includes('debug')) {
    return false; // Block event
  }
  return true;
});
```

## Benefits

1. **Decoupling:** Components don't need direct references to each other
2. **Extensibility:** Easy to add new subscribers without modifying publishers
3. **Testability:** Can mock EventBus for isolated testing
4. **Observability:** Event history and metrics provide debugging insights
5. **Flexibility:** Wildcard subscriptions enable broad or narrow listening

## Related Components

- **EventBus:** `mcp-servers/dashboard/public/events.js`
- **ToastManager:** Same file, manages notifications
- **AnimationController:** Same file, manages UI animations
- **App Integration:** `mcp-servers/dashboard/public/app.js`

## Testing

Event bus pattern is tested in:
- `mcp-servers/dashboard-v3/tests/data-flow/client-flow.test.js`
- `mcp-servers/dashboard-v3/tests/data-flow/integration-flow.test.js`

Tests use `MockEventBus` to verify event emission and subscription behavior.

## Notes

- Global instance: `window.eventBus` (created automatically)
- Debug mode: Add `?debug=events` to URL to enable logging middleware
- Event history: Limited to last 100 events (configurable)
- Batched emissions: Use `emitBatched()` for rapid-fire events

## Future Considerations

- Event persistence for offline replay
- Event replay from history
- Event filtering by data content
- Performance monitoring for high-frequency events