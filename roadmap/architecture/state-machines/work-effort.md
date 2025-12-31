# Work Effort State Machine

**Formal definition of all valid states and transitions for Work Effort entities.**

## State Diagram

```
     ┌─────────┐
     │ PLANNED │ (initial state)
     └────┬────┘
          │ start()
          ↓
  ┌────────────────┐
  │  IN_PROGRESS   │ ←──────┐
  └───┬────────┬───┘        │
      │        │             │
      │ block()│ unblock()   │
      ↓        │             │
  ┌────────┐  │             │
  │BLOCKED │──┘             │
  └────────┘                │
      │ updateProgress(100) │
      └─────────────────────┘
      ↓
  ┌───────────┐
  │ COMPLETED │ (terminal state)
  └───────────┘
```

## States

### PLANNED (Initial State)
**Description**: Work effort has been created but not yet started
**Entry Condition**: Created via CreateWorkEffort use case
**Exit Condition**: User starts work

**Invariants**:
- progress === 0
- completedAt === null
- tickets.every(t => t.status === 'pending')

**Allowed Operations**:
- `start()` → IN_PROGRESS
- `delete()` → (entity removed)
- `updateTitle()`
- `updateDescription()`
- `addTicket()`

**Forbidden Operations**:
- `complete()` - cannot complete unstarted work
- `block()` - cannot block unstarted work
- `updateProgress()` - progress locked at 0

### IN_PROGRESS (Active State)
**Description**: Work is actively being performed
**Entry Condition**: `start()` called from PLANNED or `unblock()` called from BLOCKED
**Exit Condition**: Work is blocked or completed

**Invariants**:
- 0 <= progress <= 100
- completedAt === null
- At least one ticket may be in-progress

**Allowed Operations**:
- `updateProgress(n)` → IN_PROGRESS (0 < n < 100)
- `updateProgress(100)` → COMPLETED (auto-transition)
- `block(reason)` → BLOCKED
- `updateTicketStatus()`
- `addTicket()`

**Side Effects**:
- Emits `ProgressUpdated` event on progress change
- Auto-transitions to COMPLETED when progress reaches 100%

### BLOCKED (Suspended State)
**Description**: Work is temporarily blocked by external dependencies
**Entry Condition**: `block(reason)` called from IN_PROGRESS
**Exit Condition**: Blocker is resolved

**Invariants**:
- progress unchanged from when blocked
- blockReason !== null
- completedAt === null

**Allowed Operations**:
- `unblock()` → IN_PROGRESS
- `updateBlockReason()`

**Forbidden Operations**:
- `updateProgress()` - progress frozen while blocked
- `complete()` - cannot complete blocked work
- `updateTicketStatus()` - tickets frozen while blocked

### COMPLETED (Terminal State)
**Description**: All work is finished
**Entry Condition**: progress === 100 in IN_PROGRESS state
**Exit Condition**: None (terminal)

**Invariants**:
- progress === 100
- completedAt !== null
- tickets.every(t => t.status === 'completed')

**Allowed Operations**:
- `archive()` → (move to archive)
- Read operations only

**Forbidden Operations**:
- `updateProgress()` - cannot modify completed work
- `start()` - cannot restart
- `updateTicketStatus()` - tickets are immutable
- `addTicket()` - cannot add work to completed effort

## State Transition Table

| From State | Event | Guard Condition | To State | Side Effects |
|-----------|-------|-----------------|----------|--------------|
| PLANNED | start() | - | IN_PROGRESS | Emit WorkEffortStarted |
| IN_PROGRESS | updateProgress(n) | 0 < n < 100 | IN_PROGRESS | Emit ProgressUpdated |
| IN_PROGRESS | updateProgress(100) | - | COMPLETED | Set completedAt, Emit WorkEffortCompleted |
| IN_PROGRESS | block(reason) | - | BLOCKED | Set blockReason, Emit WorkEffortBlocked |
| BLOCKED | unblock() | - | IN_PROGRESS | Clear blockReason, Emit WorkEffortUnblocked |
| * | delete() | - | (removed) | Emit WorkEffortDeleted |

## Implementation

```javascript
/**
 * Work Effort State Machine Implementation
 */
class WorkEffort {
  constructor(data) {
    this.state = data.status || 'planned';
    this.progress = data.progress || 0;
    this.blockReason = data.blockReason || null;
    this.completedAt = data.completedAt || null;

    // Validate initial state
    this.assertInvariants();
  }

  /**
   * Start work effort (PLANNED → IN_PROGRESS)
   * @throws {Error} if not in PLANNED state
   */
  start() {
    this.assertState('planned', 'Cannot start work effort');

    this.state = 'in-progress';
    this.addEvent('WorkEffortStarted', {
      workEffortId: this.id,
      timestamp: Date.now()
    });

    this.assertInvariants();
  }

  /**
   * Update progress (IN_PROGRESS → IN_PROGRESS or COMPLETED)
   * @param {number} newProgress - Progress percentage (0-100)
   * @throws {Error} if not in IN_PROGRESS state
   */
  updateProgress(newProgress) {
    this.assertState('in-progress', 'Cannot update progress');

    if (newProgress < 0 || newProgress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }

    const oldProgress = this.progress;
    this.progress = newProgress;

    this.addEvent('ProgressUpdated', {
      workEffortId: this.id,
      oldProgress,
      newProgress,
      timestamp: Date.now()
    });

    // Auto-transition to COMPLETED
    if (newProgress === 100) {
      this.complete();
    }

    this.assertInvariants();
  }

  /**
   * Block work effort (IN_PROGRESS → BLOCKED)
   * @param {string} reason - Reason for blocking
   * @throws {Error} if not in IN_PROGRESS state
   */
  block(reason) {
    this.assertState('in-progress', 'Cannot block work effort');

    if (!reason || reason.trim().length === 0) {
      throw new Error('Block reason is required');
    }

    this.state = 'blocked';
    this.blockReason = reason;

    this.addEvent('WorkEffortBlocked', {
      workEffortId: this.id,
      reason,
      timestamp: Date.now()
    });

    this.assertInvariants();
  }

  /**
   * Unblock work effort (BLOCKED → IN_PROGRESS)
   * @throws {Error} if not in BLOCKED state
   */
  unblock() {
    this.assertState('blocked', 'Cannot unblock work effort');

    this.state = 'in-progress';
    const previousReason = this.blockReason;
    this.blockReason = null;

    this.addEvent('WorkEffortUnblocked', {
      workEffortId: this.id,
      previousReason,
      timestamp: Date.now()
    });

    this.assertInvariants();
  }

  /**
   * Complete work effort (auto-called when progress reaches 100)
   * @private
   */
  complete() {
    if (this.state === 'completed') {
      return; // Idempotent
    }

    if (this.progress !== 100) {
      throw new Error('Cannot complete: progress must be 100%');
    }

    this.state = 'completed';
    this.completedAt = new Date();

    this.addEvent('WorkEffortCompleted', {
      workEffortId: this.id,
      duration: this.completedAt - this.created,
      timestamp: Date.now()
    });

    this.assertInvariants();
  }

  /**
   * Assert current state matches expected
   * @private
   */
  assertState(expected, message) {
    if (this.state !== expected) {
      throw new Error(
        `${message}: expected state '${expected}', actual state '${this.state}'`
      );
    }
  }

  /**
   * Assert all state invariants hold
   * @private
   */
  assertInvariants() {
    switch (this.state) {
      case 'planned':
        if (this.progress !== 0) {
          throw new Error('Invariant violation: PLANNED state must have progress = 0');
        }
        if (this.completedAt !== null) {
          throw new Error('Invariant violation: PLANNED state must have completedAt = null');
        }
        break;

      case 'in-progress':
        if (this.progress < 0 || this.progress > 100) {
          throw new Error('Invariant violation: IN_PROGRESS progress must be 0-100');
        }
        if (this.completedAt !== null) {
          throw new Error('Invariant violation: IN_PROGRESS must have completedAt = null');
        }
        if (this.blockReason !== null) {
          throw new Error('Invariant violation: IN_PROGRESS must have blockReason = null');
        }
        break;

      case 'blocked':
        if (this.blockReason === null) {
          throw new Error('Invariant violation: BLOCKED state must have blockReason');
        }
        if (this.completedAt !== null) {
          throw new Error('Invariant violation: BLOCKED state must have completedAt = null');
        }
        break;

      case 'completed':
        if (this.progress !== 100) {
          throw new Error('Invariant violation: COMPLETED state must have progress = 100');
        }
        if (this.completedAt === null) {
          throw new Error('Invariant violation: COMPLETED state must have completedAt');
        }
        break;

      default:
        throw new Error(`Unknown state: ${this.state}`);
    }
  }

  /**
   * Add domain event
   * @private
   */
  addEvent(type, data) {
    if (!this.events) {
      this.events = [];
    }
    this.events.push({ type, ...data });
  }
}

module.exports = { WorkEffort };
```

## Testing State Transitions

```javascript
describe('WorkEffort State Machine', () => {
  describe('PLANNED → IN_PROGRESS', () => {
    it('transitions on start()', () => {
      const we = new WorkEffort({
        id: 'WE-251231-a1b2',
        title: 'Test',
        status: 'planned',
        created: new Date()
      });

      we.start();

      expect(we.state).toBe('in-progress');
      expect(we.events).toContainEqual(
        expect.objectContaining({ type: 'WorkEffortStarted' })
      );
    });

    it('rejects start() from IN_PROGRESS', () => {
      const we = new WorkEffort({
        id: 'WE-251231-a1b2',
        title: 'Test',
        status: 'in-progress',
        created: new Date()
      });

      expect(() => we.start()).toThrow('Cannot start work effort');
    });
  });

  describe('IN_PROGRESS → COMPLETED', () => {
    it('auto-transitions when progress reaches 100', () => {
      const we = new WorkEffort({
        id: 'WE-251231-a1b2',
        title: 'Test',
        status: 'in-progress',
        created: new Date()
      });

      we.updateProgress(100);

      expect(we.state).toBe('completed');
      expect(we.completedAt).toBeInstanceOf(Date);
      expect(we.events).toContainEqual(
        expect.objectContaining({ type: 'WorkEffortCompleted' })
      );
    });
  });

  describe('IN_PROGRESS ⇄ BLOCKED', () => {
    it('transitions to BLOCKED with reason', () => {
      const we = new WorkEffort({
        id: 'WE-251231-a1b2',
        title: 'Test',
        status: 'in-progress',
        created: new Date()
      });

      we.block('Waiting for API approval');

      expect(we.state).toBe('blocked');
      expect(we.blockReason).toBe('Waiting for API approval');
    });

    it('transitions back to IN_PROGRESS on unblock()', () => {
      const we = new WorkEffort({
        id: 'WE-251231-a1b2',
        title: 'Test',
        status: 'blocked',
        blockReason: 'Testing',
        created: new Date()
      });

      we.unblock();

      expect(we.state).toBe('in-progress');
      expect(we.blockReason).toBeNull();
    });
  });

  describe('Invariants', () => {
    it('enforces COMPLETED progress = 100', () => {
      expect(() => {
        new WorkEffort({
          id: 'WE-251231-a1b2',
          title: 'Test',
          status: 'completed',
          progress: 50, // Invalid!
          created: new Date()
        });
      }).toThrow('Invariant violation');
    });

    it('enforces BLOCKED has blockReason', () => {
      expect(() => {
        new WorkEffort({
          id: 'WE-251231-a1b2',
          title: 'Test',
          status: 'blocked',
          blockReason: null, // Invalid!
          created: new Date()
        });
      }).toThrow('Invariant violation');
    });
  });
});
```

## Event Sourcing Alternative

For systems requiring full audit trails, implement Event Sourcing:

```javascript
/**
 * Event-Sourced Work Effort
 * State is derived from event stream
 */
class EventSourcedWorkEffort {
  constructor(id, events = []) {
    this.id = id;
    this.version = 0;
    this.uncommittedEvents = [];

    // Rebuild state from events
    this.state = this.replayEvents(events);
  }

  /**
   * Replay events to rebuild state
   * @private
   */
  replayEvents(events) {
    const state = {
      status: 'planned',
      progress: 0,
      blockReason: null,
      completedAt: null
    };

    for (const event of events) {
      this.applyEvent(state, event);
      this.version++;
    }

    return state;
  }

  /**
   * Apply single event to state
   * @private
   */
  applyEvent(state, event) {
    switch (event.type) {
      case 'WorkEffortStarted':
        state.status = 'in-progress';
        break;

      case 'ProgressUpdated':
        state.progress = event.newProgress;
        break;

      case 'WorkEffortBlocked':
        state.status = 'blocked';
        state.blockReason = event.reason;
        break;

      case 'WorkEffortUnblocked':
        state.status = 'in-progress';
        state.blockReason = null;
        break;

      case 'WorkEffortCompleted':
        state.status = 'completed';
        state.completedAt = new Date(event.timestamp);
        break;
    }
  }

  /**
   * Start work effort
   * Adds event to uncommitted events
   */
  start() {
    if (this.state.status !== 'planned') {
      throw new Error('Cannot start work effort');
    }

    const event = {
      type: 'WorkEffortStarted',
      workEffortId: this.id,
      timestamp: Date.now(),
      version: this.version + 1
    };

    this.applyEvent(this.state, event);
    this.uncommittedEvents.push(event);
    this.version++;
  }

  /**
   * Get uncommitted events for persistence
   */
  getUncommittedEvents() {
    return this.uncommittedEvents;
  }

  /**
   * Mark events as committed
   */
  markEventsCommitted() {
    this.uncommittedEvents = [];
  }
}
```

---

**Key Takeaways:**
1. States are explicit and well-defined
2. Transitions are validated and guarded
3. Invariants are enforced at construction and after every operation
4. Domain events capture what happened
5. Terminal states prevent invalid operations
