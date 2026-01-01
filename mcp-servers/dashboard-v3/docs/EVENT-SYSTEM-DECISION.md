# Event System Architecture Decision

**Date:** 2024-12-27
**Status:** Decided
**Decision:** Use Custom EventBus (keep current implementation)

## Context

The Mission Control Dashboard needs a robust event management system for:
1. Toast notifications with type-based durations
2. UI animations triggered by events
3. Real-time updates from WebSocket
4. Smart notification routing (toast vs. notification center)
5. Event history and debugging

## Options Evaluated

### 1. Custom EventBus (Current Implementation)

**Source:** `public/events.js`

| Aspect | Assessment |
|--------|------------|
| Size | ~8KB unminified, 0 dependencies |
| TypeScript | No (but easily added) |
| Features | Wildcards, middleware, batching, history, metrics |
| Learning Curve | None (we built it) |
| Maintainability | Full control |
| Performance | Good (simple Map-based) |

**Pros:**
- Zero dependencies
- Tailored to our exact needs
- Includes ToastManager and AnimationController
- Full control over behavior
- No version conflicts

**Cons:**
- We maintain it
- Less battle-tested than popular libraries

---

### 2. mitt

**NPM:** `mitt` by developit
**Size:** ~200 bytes

| Aspect | Assessment |
|--------|------------|
| Size | 200 bytes (tiny!) |
| TypeScript | Yes (built-in) |
| Features | Basic on/off/emit |
| Learning Curve | Minimal |
| Maintainability | Well-maintained |
| Performance | Excellent |

**Pros:**
- Incredibly tiny
- TypeScript support
- Well-tested, popular
- Simple API

**Cons:**
- No wildcards (we need `workeffort:*`)
- No middleware
- No batching
- No event history
- Would require wrapping for our features

---

### 3. EventEmitter3

**NPM:** `eventemitter3`
**Size:** ~2KB

| Aspect | Assessment |
|--------|------------|
| Size | 2KB |
| TypeScript | Yes (DefinitelyTyped) |
| Features | Standard EventEmitter API |
| Learning Curve | Low (Node.js style) |
| Maintainability | Well-maintained |
| Performance | Fastest in benchmarks |

**Pros:**
- Node.js compatible API
- Very fast
- Mature and stable
- Good documentation

**Cons:**
- No wildcards built-in
- No middleware
- Would require wrapping

---

### 4. nanoevents

**NPM:** `nanoevents`
**Size:** ~500 bytes

| Aspect | Assessment |
|--------|------------|
| Size | 500 bytes |
| TypeScript | Yes (built-in) |
| Features | Basic + unsubscribe function return |
| Learning Curve | Minimal |
| Maintainability | Well-maintained |
| Performance | Excellent |

**Pros:**
- Modern API (returns unsubscribe)
- TypeScript-first
- Very small

**Cons:**
- No wildcards
- No middleware
- No batching

---

### 5. RxJS

**NPM:** `rxjs`
**Size:** ~200KB (tree-shakeable to ~20KB)

| Aspect | Assessment |
|--------|------------|
| Size | Large (but tree-shakeable) |
| TypeScript | Yes (built-in) |
| Features | Complete reactive programming |
| Learning Curve | High |
| Maintainability | Very well-maintained |
| Performance | Good |

**Pros:**
- Extremely powerful
- Great for complex async flows
- Operators for debounce, throttle, etc.
- Excellent documentation

**Cons:**
- Massive overkill for our needs
- Steep learning curve
- Would increase bundle size significantly

---

## Decision Matrix

| Criteria (Weight) | Custom | mitt | EventEmitter3 | nanoevents | RxJS |
|------------------|--------|------|---------------|------------|------|
| **Size** (15%) | 3 | 5 | 4 | 5 | 1 |
| **Features Needed** (30%) | 5 | 2 | 2 | 2 | 5 |
| **Maintenance** (15%) | 3 | 4 | 5 | 4 | 5 |
| **Performance** (10%) | 4 | 5 | 5 | 5 | 3 |
| **No Dependencies** (20%) | 5 | 1 | 1 | 1 | 1 |
| **TypeScript** (10%) | 2 | 5 | 4 | 5 | 5 |
| **Weighted Score** | **4.05** | 2.85 | 2.75 | 2.85 | 3.00 |

*Scores: 1 (poor) to 5 (excellent)*

---

## Recommendation

**Keep the custom EventBus implementation** for the following reasons:

1. **Feature Match:** Our custom solution includes exactly what we need:
   - Wildcard event matching (`workeffort:*`)
   - Middleware support
   - Event batching for rapid updates
   - Event history for debugging
   - Integrated ToastManager
   - AnimationController hooks

2. **Zero Dependencies:** Critical for a dashboard that needs to be fast and reliable.

3. **Full Control:** We can modify behavior without waiting for library updates.

4. **Good Enough Performance:** For a dashboard with <100 events/second, our simple Map-based implementation is more than sufficient.

---

## Future Considerations

If we later need:
- **TypeScript:** Add types to our EventBus
- **Testing:** Add unit tests for EventBus
- **Performance Issues:** Consider adopting mitt + wrapper

---

## Files Affected

- `public/events.js` - EventBus, ToastManager, AnimationController
- `public/app.js` - Integration with MissionControl class
- `public/styles.css` - Animation CSS classes

---

## Implementation Notes

### Event Types Defined

```javascript
// System events
'system:connected'    // WebSocket connected
'system:disconnected' // WebSocket lost
'system:error'        // System error

// Work effort events
'workeffort:created'   // New WE added
'workeffort:started'   // Status → active
'workeffort:completed' // Status → completed
'workeffort:paused'    // Status → paused

// Ticket events
'ticket:created'   // New ticket
'ticket:completed' // Ticket done
'ticket:blocked'   // Ticket blocked

// Repository events
'repo:added'   // Repo added to watch
'repo:removed' // Repo removed
```

### Toast Durations by Type

```javascript
const TOAST_DURATIONS = {
  error: 0,      // Persistent (must dismiss)
  critical: 0,   // Persistent
  warning: 10000, // 10 seconds
  success: 6000,  // 6 seconds
  info: 5000,     // 5 seconds
  system: 8000,   // 8 seconds
};
```

