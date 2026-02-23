/**
 * @fileoverview Example Usage of Test Helpers
 *
 * This file demonstrates how to use the shared test helpers.
 * It's not meant to be run as part of the test suite - it's documentation by example.
 *
 * To use these patterns in your tests:
 * 1. Import the helpers you need
 * 2. Use them to set up test scenarios
 * 3. Verify behavior using the helper methods
 */

import { test } from 'node:test';
import assert from 'node:assert';

// Import all helpers from the index
import {
  MockEventBus,
  MissionControlHarness,
  createWorkEffortFixture,
  createTicketFixture,
  createTestScenario,
  createInitMessageFixture,
  createUpdateMessageFixture
} from './index.js';

// Example 1: Using MockEventBus
test('Example: MockEventBus with wildcard subscriptions', () => {
  const eventBus = new MockEventBus();
  const workEffortEvents = [];
  const allEvents = [];

  // Subscribe to all workeffort events
  eventBus.on('workeffort:*', (event) => {
    workEffortEvents.push(event);
  });

  // Subscribe to all events
  eventBus.on('*', (event) => {
    allEvents.push(event);
  });

  // Emit some events
  eventBus.emit('workeffort:created', { id: 'WE-123', title: 'New Work' });
  eventBus.emit('workeffort:updated', { id: 'WE-123', status: 'active' });
  eventBus.emit('system:connected', { repoCount: 1 });

  // Verify events were captured
  assert.strictEqual(workEffortEvents.length, 2);
  assert.strictEqual(allEvents.length, 3);
  assert.strictEqual(eventBus.getEventsByType('workeffort:created').length, 1);
});

// Example 2: Using MissionControlHarness
test('Example: MissionControlHarness state management', () => {
  const harness = new MissionControlHarness();

  // Initialize with repos
  harness.handleMessage({
    type: 'init',
    repos: {
      '_pyrite': {
        workEfforts: [],
        stats: { totalWorkEfforts: 0 },
        lastUpdated: new Date().toISOString()
      }
    }
  });

  // Verify initialization
  const repos = harness.getAllRepos();
  assert.strictEqual(Object.keys(repos).length, 1);
  assert.ok(repos['_pyrite']);

  // Verify system:connected event was emitted
  const connectedEvents = harness.eventBus.getEventsByType('system:connected');
  assert.strictEqual(connectedEvents.length, 1);
});

// Example 3: Using fixture generators
test('Example: Creating test fixtures', () => {
  // Create individual fixtures
  const we = createWorkEffortFixture('WE-260102-test', 'Test Work', 'active', {
    tickets: [
      createTicketFixture('TKT-test-001', 'Ticket 1', 'pending', { workEffortId: 'WE-260102-test' }),
      createTicketFixture('TKT-test-002', 'Ticket 2', 'completed', { workEffortId: 'WE-260102-test' })
    ]
  });

  assert.strictEqual(we.id, 'WE-260102-test');
  assert.strictEqual(we.title, 'Test Work');
  assert.strictEqual(we.status, 'active');
  assert.strictEqual(we.tickets.length, 2);
});

// Example 4: Using test scenarios
test('Example: Complete test scenario', () => {
  const scenario = createTestScenario({
    workEffortCount: 3,
    ticketsPerWE: 2,
    repoName: '_pyrite'
  });

  // Verify scenario structure
  assert.strictEqual(scenario.workEfforts.length, 3);
  assert.strictEqual(scenario.stats.totalWorkEfforts, 3);
  assert.strictEqual(scenario.stats.totalTickets, 6); // 3 WEs × 2 tickets

  // Use scenario with harness
  const harness = new MissionControlHarness();
  harness.handleMessage(scenario.initMessage);

  const repos = harness.getAllRepos();
  assert.strictEqual(repos['_pyrite'].workEfforts.length, 3);
});

// Example 5: Testing change detection
test('Example: Detecting new work effort', () => {
  const harness = new MissionControlHarness();

  // Initial state - empty
  harness.handleMessage(createInitMessageFixture({
    '_pyrite': {
      workEfforts: [],
      stats: { totalWorkEfforts: 0 },
      lastUpdated: new Date().toISOString()
    }
  }));

  // Add a new work effort
  const newWE = createWorkEffortFixture('WE-123', 'New Work', 'active');
  harness.handleMessage(createUpdateMessageFixture(
    '_pyrite',
    [newWE],
    { totalWorkEfforts: 1, activeWorkEfforts: 1, totalTickets: 0, completedTickets: 0 }
  ));

  // Verify workeffort:created event was emitted
  const createdEvents = harness.eventBus.getEventsByType('workeffort:created');
  assert.strictEqual(createdEvents.length, 1);
  assert.strictEqual(createdEvents[0].data.id, 'WE-123');
});

// Example 6: Testing status changes
test('Example: Detecting status changes', () => {
  const harness = new MissionControlHarness();

  // Initial state - active work effort
  const we1 = createWorkEffortFixture('WE-123', 'Test Work', 'active');
  harness.handleMessage(createInitMessageFixture({
    '_pyrite': {
      workEfforts: [we1],
      stats: { totalWorkEfforts: 1, activeWorkEfforts: 1 },
      lastUpdated: new Date().toISOString()
    }
  }));

  // Update to completed
  const we1Completed = createWorkEffortFixture('WE-123', 'Test Work', 'completed');
  harness.handleMessage(createUpdateMessageFixture(
    '_pyrite',
    [we1Completed],
    { totalWorkEfforts: 1, activeWorkEfforts: 0 }
  ));

  // Verify workeffort:completed event was emitted
  const completedEvents = harness.eventBus.getEventsByType('workeffort:completed');
  assert.strictEqual(completedEvents.length, 1);
  assert.strictEqual(completedEvents[0].data.prevStatus, 'active');
  assert.strictEqual(completedEvents[0].data.newStatus, 'completed');
});

// Example 7: Testing ticket creation
test('Example: Detecting new tickets', () => {
  const harness = new MissionControlHarness();

  // Initial state - work effort without tickets
  const we1 = createWorkEffortFixture('WE-123', 'Test Work', 'active');
  harness.handleMessage(createInitMessageFixture({
    '_pyrite': {
      workEfforts: [we1],
      stats: { totalWorkEfforts: 1 },
      lastUpdated: new Date().toISOString()
    }
  }));

  // Add a ticket
  const we1WithTicket = createWorkEffortFixture('WE-123', 'Test Work', 'active', {
    tickets: [
      createTicketFixture('TKT-123-001', 'New Ticket', 'pending', { workEffortId: 'WE-123' })
    ]
  });
  harness.handleMessage(createUpdateMessageFixture(
    '_pyrite',
    [we1WithTicket],
    { totalWorkEfforts: 1, totalTickets: 1 }
  ));

  // Verify ticket:created event was emitted
  const ticketEvents = harness.eventBus.getEventsByType('ticket:created');
  assert.strictEqual(ticketEvents.length, 1);
  assert.strictEqual(ticketEvents[0].data.id, 'TKT-123-001');
});

