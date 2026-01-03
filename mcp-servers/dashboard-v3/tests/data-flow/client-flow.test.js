/**
 * @fileoverview Client Data Flow Tests
 *
 * Tests HOW data flows from WebSocket messages → client state → EventBus → UI.
 * Documents state transformations and event propagation.
 *
 * Data Flow Path:
 *   WebSocket Message (JSON)
 *     ↓
 *   handleMessage() parses message
 *     ↓
 *   this.repos state updated
 *     ↓
 *   detectAndEmitChanges() compares old/new state
 *     ↓
 *   EventBus.emit() publishes events
 *     ↓
 *   Subscribers (ToastManager, AnimationController) notified
 *     ↓
 *   UI updates triggered
 */

import { test } from 'node:test';
import assert from 'node:assert';

/**
 * Mock EventBus for testing
 * Tracks all emitted events for verification
 */
class MockEventBus {
  constructor() {
    this.events = [];
    this.subscribers = new Map();
  }

  on(pattern, handler) {
    if (!this.subscribers.has(pattern)) {
      this.subscribers.set(pattern, []);
    }
    this.subscribers.get(pattern).push(handler);
  }

  emit(type, data) {
    this.events.push({ type, data, timestamp: Date.now() });
    
    // Trigger wildcard subscribers
    for (const [pattern, handlers] of this.subscribers) {
      if (this.matchesPattern(pattern, type)) {
        handlers.forEach(handler => handler({ type, data }));
      }
    }
  }

  matchesPattern(pattern, type) {
    if (pattern === type) return true;
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return type.startsWith(prefix);
    }
    return false;
  }

  clear() {
    this.events = [];
  }

  getEventsByType(type) {
    return this.events.filter(e => e.type === type);
  }
}

/**
 * Minimal MissionControl test harness
 * Extracts only the state management logic for testing
 */
class MissionControlHarness {
  constructor() {
    this.repos = {};
    this.eventBus = new MockEventBus();
  }

  /**
   * Handle WebSocket message and update state
   * Extracted from MissionControl.handleMessage()
   */
  handleMessage(message) {
    switch (message.type) {
      case 'init':
        this.repos = message.repos;
        this.eventBus.emit('system:connected', { repoCount: Object.keys(message.repos).length });
        break;

      case 'update':
        const prevState = this.repos[message.repo];
        this.repos[message.repo] = {
          workEfforts: message.workEfforts,
          stats: message.stats,
          error: message.error,
          lastUpdated: new Date().toISOString()
        };
        this.detectAndEmitChanges(message.repo, prevState, this.repos[message.repo]);
        break;

      case 'repo_change':
        if (message.action === 'added' && message.repos) {
          for (const repo of message.repos) {
            this.eventBus.emit('repo:added', { name: repo.name, path: repo.path });
          }
        }
        if (message.action === 'removed') {
          delete this.repos[message.repo];
          this.eventBus.emit('repo:removed', { name: message.repo });
        }
        break;

      case 'error':
        this.eventBus.emit('system:error', { repo: message.repo, message: message.message });
        break;
    }
  }

  /**
   * Detect changes and emit appropriate events
   * Extracted from MissionControl.detectAndEmitChanges()
   */
  detectAndEmitChanges(repoName, prevState, newState) {
    // Detect new work efforts
    const prevWEs = new Set((prevState?.workEfforts || []).map(we => we.id));
    const newWEs = (newState?.workEfforts || []).filter(we => !prevWEs.has(we.id));

    for (const we of newWEs) {
      this.eventBus.emit('workeffort:created', {
        id: we.id,
        title: we.title,
        status: we.status,
        repo: repoName,
        we: we,
      });
    }

    // Detect status changes
    const prevWEMap = new Map((prevState?.workEfforts || []).map(we => [we.id, we]));
    for (const we of newState?.workEfforts || []) {
      const prev = prevWEMap.get(we.id);
      if (prev && prev.status !== we.status) {
        // Determine specific event type
        const eventType = we.status === 'completed' ? 'workeffort:completed'
          : we.status === 'active' || we.status === 'in_progress' ? 'workeffort:started'
          : we.status === 'paused' ? 'workeffort:paused'
          : 'workeffort:updated';

        this.eventBus.emit(eventType, {
          id: we.id,
          title: we.title,
          oldStatus: prev.status,
          newStatus: we.status,
          repo: repoName,
          we: we,
        });
      }

      // Detect new tickets
      if (we.tickets) {
        const prevTicketIds = new Set((prev?.tickets || []).map(t => t.id));
        const newTickets = we.tickets.filter(t => !prevTicketIds.has(t.id));

        for (const ticket of newTickets) {
          this.eventBus.emit('ticket:created', {
            id: ticket.id,
            title: ticket.title,
            status: ticket.status,
            weId: we.id,
            weTitle: we.title,
            repo: repoName,
          });
        }

        // Detect ticket status changes
        const prevTicketMap = new Map((prev?.tickets || []).map(t => [t.id, t]));
        for (const ticket of we.tickets) {
          const prevTicket = prevTicketMap.get(ticket.id);
          if (prevTicket && prevTicket.status !== ticket.status) {
            const ticketEventType = ticket.status === 'completed' ? 'ticket:completed'
              : ticket.status === 'blocked' ? 'ticket:blocked'
              : 'ticket:updated';

            this.eventBus.emit(ticketEventType, {
              id: ticket.id,
              title: ticket.title,
              oldStatus: prevTicket.status,
              newStatus: ticket.status,
              weId: we.id,
              weTitle: we.title,
              repo: repoName,
            });
          }
        }
      }
    }
  }
}

test('Client Flow: WebSocket Init Message → State Update', async (t) => {
  const harness = new MissionControlHarness();

  // Document: Initial state is empty
  assert.strictEqual(Object.keys(harness.repos).length, 0, 'Initial state is empty');

  // Step 1: Receive init message
  const initMessage = {
    type: 'init',
    repos: {
      '_pyrite': {
        workEfforts: [
          {
            id: 'WE-260102-test1',
            format: 'mcp',
            title: 'Test Work Effort',
            status: 'active',
            tickets: []
          }
        ],
        stats: {
          total: 1,
          byFormat: { mcp: 1, jd: 0 },
          byStatus: { active: 1 },
          totalTickets: 0
        },
        error: null,
        lastUpdated: '2026-01-02T00:00:00Z'
      }
    }
  };

  // Step 2: Handle message
  harness.handleMessage(initMessage);

  // Document: State updated from message
  assert.strictEqual(Object.keys(harness.repos).length, 1, 'Repository added to state');
  assert.ok(harness.repos['_pyrite'], 'Repository state present');
  assert.strictEqual(harness.repos['_pyrite'].workEfforts.length, 1, 'Work efforts populated');
  assert.strictEqual(harness.repos['_pyrite'].workEfforts[0].id, 'WE-260102-test1', 'Work effort ID preserved');

  // Document: System event emitted
  const systemEvents = harness.eventBus.getEventsByType('system:connected');
  assert.strictEqual(systemEvents.length, 1, 'System connected event emitted');
  assert.strictEqual(systemEvents[0].data.repoCount, 1, 'Repo count in event data');
});

test('Client Flow: WebSocket Update Message → State Update', async (t) => {
  const harness = new MissionControlHarness();

  // Setup: Initial state
  harness.repos['_pyrite'] = {
    workEfforts: [
      {
        id: 'WE-260102-existing',
        title: 'Existing Work Effort',
        status: 'active',
        tickets: []
      }
    ],
    stats: { total: 1, byStatus: { active: 1 } },
    error: null
  };

  // Step 1: Receive update message
  const updateMessage = {
    type: 'update',
    repo: '_pyrite',
    workEfforts: [
      {
        id: 'WE-260102-existing',
        title: 'Existing Work Effort',
        status: 'paused', // Status changed
        tickets: []
      },
      {
        id: 'WE-260102-new',
        title: 'New Work Effort',
        status: 'active',
        tickets: []
      }
    ],
    stats: {
      total: 2,
      byStatus: { active: 1, paused: 1 }
    },
    error: null
  };

  // Step 2: Handle message
  harness.handleMessage(updateMessage);

  // Document: State updated
  assert.strictEqual(harness.repos['_pyrite'].workEfforts.length, 2, 'Work efforts updated');
  assert.ok(harness.repos['_pyrite'].lastUpdated, 'Last updated timestamp set');

  // Document: Change detection triggered
  const createdEvents = harness.eventBus.getEventsByType('workeffort:created');
  assert.strictEqual(createdEvents.length, 1, 'New work effort detected');
  assert.strictEqual(createdEvents[0].data.id, 'WE-260102-new', 'New work effort ID in event');

  const pausedEvents = harness.eventBus.getEventsByType('workeffort:paused');
  assert.strictEqual(pausedEvents.length, 1, 'Status change detected');
  assert.strictEqual(pausedEvents[0].data.oldStatus, 'active', 'Old status preserved');
  assert.strictEqual(pausedEvents[0].data.newStatus, 'paused', 'New status in event');
});

test('Client Flow: Repo Change Message → State Update', async (t) => {
  const harness = new MissionControlHarness();

  // Setup: Initial state with one repo
  harness.repos['_pyrite'] = {
    workEfforts: [],
    stats: { total: 0 },
    error: null
  };

  // Test: Add repository
  const addMessage = {
    type: 'repo_change',
    action: 'added',
    repos: [
      { name: 'new-repo', path: '/path/to/new-repo' }
    ]
  };

  harness.handleMessage(addMessage);

  // Document: Repo added event emitted
  const addedEvents = harness.eventBus.getEventsByType('repo:added');
  assert.strictEqual(addedEvents.length, 1, 'Repo added event emitted');
  assert.strictEqual(addedEvents[0].data.name, 'new-repo', 'Repo name in event');

  // Test: Remove repository
  const removeMessage = {
    type: 'repo_change',
    action: 'removed',
    repo: '_pyrite'
  };

  harness.handleMessage(removeMessage);

  // Document: Repo removed from state
  assert.strictEqual(harness.repos['_pyrite'], undefined, 'Repo removed from state');

  // Document: Repo removed event emitted
  const removedEvents = harness.eventBus.getEventsByType('repo:removed');
  assert.strictEqual(removedEvents.length, 1, 'Repo removed event emitted');
  assert.strictEqual(removedEvents[0].data.name, '_pyrite', 'Repo name in event');
});

test('Client Flow: Error Message → Event Emission', async (t) => {
  const harness = new MissionControlHarness();

  // Step 1: Receive error message
  const errorMessage = {
    type: 'error',
    repo: '_pyrite',
    message: 'Failed to parse repository'
  };

  // Step 2: Handle message
  harness.handleMessage(errorMessage);

  // Document: Error event emitted
  const errorEvents = harness.eventBus.getEventsByType('system:error');
  assert.strictEqual(errorEvents.length, 1, 'Error event emitted');
  assert.strictEqual(errorEvents[0].data.repo, '_pyrite', 'Repo name in error');
  assert.strictEqual(errorEvents[0].data.message, 'Failed to parse repository', 'Error message preserved');
});

test('Client Flow: New Work Effort → Created Event', async (t) => {
  const harness = new MissionControlHarness();

  // Setup: Initial state
  const prevState = {
    workEfforts: [
      { id: 'WE-260102-existing', title: 'Existing', status: 'active', tickets: [] }
    ],
    stats: { total: 1 }
  };

  const newState = {
    workEfforts: [
      { id: 'WE-260102-existing', title: 'Existing', status: 'active', tickets: [] },
      { id: 'WE-260102-new', title: 'New Work Effort', status: 'active', tickets: [] }
    ],
    stats: { total: 2 }
  };

  // Step: Detect changes
  harness.detectAndEmitChanges('_pyrite', prevState, newState);

  // Document: Created event emitted
  const createdEvents = harness.eventBus.getEventsByType('workeffort:created');
  assert.strictEqual(createdEvents.length, 1, 'Created event emitted');
  assert.strictEqual(createdEvents[0].data.id, 'WE-260102-new', 'New work effort ID');
  assert.strictEqual(createdEvents[0].data.title, 'New Work Effort', 'Title in event');
  assert.strictEqual(createdEvents[0].data.repo, '_pyrite', 'Repo name in event');
  assert.ok(createdEvents[0].data.we, 'Full work effort object in event');
});

test('Client Flow: Status Change → Specific Event Type', async (t) => {
  const harness = new MissionControlHarness();

  // Test: Active → Completed
  const prevState = {
    workEfforts: [
      { id: 'WE-260102-test', title: 'Test', status: 'active', tickets: [] }
    ]
  };

  const newState = {
    workEfforts: [
      { id: 'WE-260102-test', title: 'Test', status: 'completed', tickets: [] }
    ]
  };

  harness.detectAndEmitChanges('_pyrite', prevState, newState);

  // Document: Completed event emitted (not generic updated)
  const completedEvents = harness.eventBus.getEventsByType('workeffort:completed');
  assert.strictEqual(completedEvents.length, 1, 'Completed event emitted');
  assert.strictEqual(completedEvents[0].data.oldStatus, 'active', 'Old status preserved');
  assert.strictEqual(completedEvents[0].data.newStatus, 'completed', 'New status in event');

  // Test: Paused → Active (started)
  harness.eventBus.clear();
  const prevState2 = {
    workEfforts: [
      { id: 'WE-260102-test2', title: 'Test 2', status: 'paused', tickets: [] }
    ]
  };

  const newState2 = {
    workEfforts: [
      { id: 'WE-260102-test2', title: 'Test 2', status: 'active', tickets: [] }
    ]
  };

  harness.detectAndEmitChanges('_pyrite', prevState2, newState2);

  // Document: Started event emitted
  const startedEvents = harness.eventBus.getEventsByType('workeffort:started');
  assert.strictEqual(startedEvents.length, 1, 'Started event emitted');
});

test('Client Flow: New Ticket → Created Event', async (t) => {
  const harness = new MissionControlHarness();

  // Setup: Work effort with existing ticket
  const prevState = {
    workEfforts: [
      {
        id: 'WE-260102-test',
        title: 'Test WE',
        status: 'active',
        tickets: [
          { id: 'TKT-test-001', title: 'Existing Ticket', status: 'pending' }
        ]
      }
    ]
  };

  const newState = {
    workEfforts: [
      {
        id: 'WE-260102-test',
        title: 'Test WE',
        status: 'active',
        tickets: [
          { id: 'TKT-test-001', title: 'Existing Ticket', status: 'pending' },
          { id: 'TKT-test-002', title: 'New Ticket', status: 'pending' }
        ]
      }
    ]
  };

  // Step: Detect changes
  harness.detectAndEmitChanges('_pyrite', prevState, newState);

  // Document: Ticket created event emitted
  const ticketEvents = harness.eventBus.getEventsByType('ticket:created');
  assert.strictEqual(ticketEvents.length, 1, 'Ticket created event emitted');
  assert.strictEqual(ticketEvents[0].data.id, 'TKT-test-002', 'New ticket ID');
  assert.strictEqual(ticketEvents[0].data.weId, 'WE-260102-test', 'Parent WE ID in event');
  assert.strictEqual(ticketEvents[0].data.repo, '_pyrite', 'Repo name in event');
});

test('Client Flow: Ticket Status Change → Updated Event', async (t) => {
  const harness = new MissionControlHarness();

  // Setup: Ticket status change
  const prevState = {
    workEfforts: [
      {
        id: 'WE-260102-test',
        title: 'Test WE',
        status: 'active',
        tickets: [
          { id: 'TKT-test-001', title: 'Ticket', status: 'pending' }
        ]
      }
    ]
  };

  const newState = {
    workEfforts: [
      {
        id: 'WE-260102-test',
        title: 'Test WE',
        status: 'active',
        tickets: [
          { id: 'TKT-test-001', title: 'Ticket', status: 'completed' }
        ]
      }
    ]
  };

  // Step: Detect changes
  harness.detectAndEmitChanges('_pyrite', prevState, newState);

  // Document: Ticket completed event emitted
  const completedEvents = harness.eventBus.getEventsByType('ticket:completed');
  assert.strictEqual(completedEvents.length, 1, 'Ticket completed event emitted');
  assert.strictEqual(completedEvents[0].data.oldStatus, 'pending', 'Old status preserved');
  assert.strictEqual(completedEvents[0].data.newStatus, 'completed', 'New status in event');
  assert.strictEqual(completedEvents[0].data.weId, 'WE-260102-test', 'Parent WE ID in event');
});

test('Client Flow: EventBus Wildcard Subscriptions', async (t) => {
  const harness = new MissionControlHarness();

  // Setup: Subscribe to all work effort events
  const receivedEvents = [];
  harness.eventBus.on('workeffort:*', (event) => {
    receivedEvents.push(event);
  });

  // Step: Trigger various work effort events
  const prevState = {
    workEfforts: [
      { id: 'WE-260102-test', title: 'Test', status: 'active', tickets: [] }
    ]
  };

  const newState = {
    workEfforts: [
      { id: 'WE-260102-test', title: 'Test', status: 'completed', tickets: [] },
      { id: 'WE-260102-new', title: 'New', status: 'active', tickets: [] }
    ]
  };

  harness.detectAndEmitChanges('_pyrite', prevState, newState);

  // Document: Wildcard subscription receives all matching events
  assert.ok(receivedEvents.length >= 2, 'Wildcard subscription received events');
  const eventTypes = receivedEvents.map(e => e.type);
  assert.ok(eventTypes.includes('workeffort:completed'), 'Completed event received');
  assert.ok(eventTypes.includes('workeffort:created'), 'Created event received');
});

test('Client Flow: Edge Case - Null Previous State', async (t) => {
  const harness = new MissionControlHarness();

  // Setup: No previous state (initial load)
  const prevState = null;

  const newState = {
    workEfforts: [
      { id: 'WE-260102-first', title: 'First WE', status: 'active', tickets: [] }
    ],
    stats: { total: 1 }
  };

  // Step: Detect changes with null prevState
  harness.detectAndEmitChanges('_pyrite', prevState, newState);

  // Document: All items treated as new
  const createdEvents = harness.eventBus.getEventsByType('workeffort:created');
  assert.strictEqual(createdEvents.length, 1, 'Work effort treated as new');
  assert.strictEqual(createdEvents[0].data.id, 'WE-260102-first', 'First WE ID in event');
});

test('Client Flow: Edge Case - Empty Arrays (No Changes)', async (t) => {
  const harness = new MissionControlHarness();

  // Setup: Same state (no changes)
  const prevState = {
    workEfforts: [
      { id: 'WE-260102-test', title: 'Test', status: 'active', tickets: [] }
    ]
  };

  const newState = {
    workEfforts: [
      { id: 'WE-260102-test', title: 'Test', status: 'active', tickets: [] }
    ]
  };

  // Step: Detect changes
  harness.detectAndEmitChanges('_pyrite', prevState, newState);

  // Document: No events emitted (no changes detected)
  const allEvents = harness.eventBus.events;
  assert.strictEqual(allEvents.length, 0, 'No events emitted when no changes');
});

test('Client Flow: Edge Case - Invalid Message Format', async (t) => {
  const harness = new MissionControlHarness();

  // Setup: Invalid message (no type)
  const invalidMessage = {
    repo: '_pyrite',
    workEfforts: []
  };

  // Step: Handle invalid message
  harness.handleMessage(invalidMessage);

  // Document: State unchanged (switch default case)
  assert.strictEqual(Object.keys(harness.repos).length, 0, 'State unchanged');
  assert.strictEqual(harness.eventBus.events.length, 0, 'No events emitted');
});

test('Client Flow: Multiple Tickets in Work Effort', async (t) => {
  const harness = new MissionControlHarness();

  // Setup: Work effort with multiple tickets
  const prevState = {
    workEfforts: [
      {
        id: 'WE-260102-test',
        title: 'Test WE',
        status: 'active',
        tickets: [
          { id: 'TKT-test-001', title: 'Ticket 1', status: 'pending' }
        ]
      }
    ]
  };

  const newState = {
    workEfforts: [
      {
        id: 'WE-260102-test',
        title: 'Test WE',
        status: 'active',
        tickets: [
          { id: 'TKT-test-001', title: 'Ticket 1', status: 'in_progress' },
          { id: 'TKT-test-002', title: 'Ticket 2', status: 'pending' },
          { id: 'TKT-test-003', title: 'Ticket 3', status: 'pending' }
        ]
      }
    ]
  };

  // Step: Detect changes
  harness.detectAndEmitChanges('_pyrite', prevState, newState);

  // Document: Multiple ticket events emitted
  const ticketCreatedEvents = harness.eventBus.getEventsByType('ticket:created');
  assert.strictEqual(ticketCreatedEvents.length, 2, 'Two new tickets detected');

  const ticketUpdatedEvents = harness.eventBus.getEventsByType('ticket:updated');
  assert.strictEqual(ticketUpdatedEvents.length, 1, 'One ticket status change detected');
  assert.strictEqual(ticketUpdatedEvents[0].data.oldStatus, 'pending', 'Old status preserved');
  assert.strictEqual(ticketUpdatedEvents[0].data.newStatus, 'in_progress', 'New status in event');
});

