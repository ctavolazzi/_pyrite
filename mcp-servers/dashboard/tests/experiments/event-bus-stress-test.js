/**
 * @fileoverview Event Bus Stress Test
 *
 * Tests event bus performance and behavior under various load conditions.
 * Generates metrics and visualizations.
 */

import { MockEventBus } from '../helpers/mock-event-bus.js';
import { createWorkEffortFixture, createTicketFixture } from '../helpers/fixtures.js';

/**
 * Run stress test with various event patterns
 */
async function runStressTest() {
  console.log('⚡ Event Bus Stress Test\n');
  console.log('=' .repeat(60) + '\n');

  const results = [];

  // Test 1: Rapid fire events
  console.log('Test 1: Rapid Fire Events (1000 events)...');
  const test1 = await testRapidFire(1000);
  results.push(test1);
  console.log(`  ✅ ${test1.eventCount} events in ${test1.duration}ms`);
  console.log(`     Avg: ${test1.avgTime}ms per event\n`);

  // Test 2: Wildcard subscriptions
  console.log('Test 2: Wildcard Subscriptions (100 subscribers)...');
  const test2 = await testWildcardSubscriptions(100);
  results.push(test2);
  console.log(`  ✅ ${test2.subscriberCount} subscribers, ${test2.eventCount} events`);
  console.log(`     Total handlers called: ${test2.totalHandlersCalled}\n`);

  // Test 3: Middleware chain
  console.log('Test 3: Middleware Chain (10 middleware functions)...');
  const test3 = await testMiddlewareChain(10);
  results.push(test3);
  console.log(`  ✅ ${test3.middlewareCount} middleware, ${test3.eventCount} events`);
  console.log(`     Avg middleware time: ${test3.avgMiddlewareTime}ms\n`);

  // Test 4: Realistic work effort scenario
  console.log('Test 4: Realistic Work Effort Scenario...');
  const test4 = await testRealisticScenario();
  results.push(test4);
  console.log(`  ✅ ${test4.workEffortCount} work efforts, ${test4.ticketCount} tickets`);
  console.log(`     ${test4.eventCount} events emitted in ${test4.duration}ms\n`);

  // Test 5: Event history tracking
  console.log('Test 5: Event History Tracking...');
  const test5 = await testEventHistory(5000);
  results.push(test5);
  console.log(`  ✅ ${test5.eventCount} events, history size: ${test5.historySize}`);
  console.log(`     Memory efficient: ${test5.memoryEfficient ? 'Yes' : 'No'}\n`);

  return results;
}

/**
 * Test rapid fire event emission
 */
function testRapidFire(count) {
  const eventBus = new MockEventBus();
  const start = performance.now();

  for (let i = 0; i < count; i++) {
    eventBus.emit(`test:event${i % 10}`, { id: i, data: `test${i}` });
  }

  const end = performance.now();
  const duration = end - start;

  return {
    name: 'Rapid Fire',
    eventCount: count,
    duration: Math.round(duration),
    avgTime: Math.round((duration / count) * 100) / 100,
    totalEvents: eventBus.getEventCount()
  };
}

/**
 * Test wildcard subscriptions
 */
function testWildcardSubscriptions(subscriberCount) {
  const eventBus = new MockEventBus();
  let totalHandlersCalled = 0;

  // Create subscribers
  for (let i = 0; i < subscriberCount; i++) {
    const pattern = i % 3 === 0 ? 'workeffort:*' :
                   i % 3 === 1 ? 'ticket:*' :
                   'system:*';

    eventBus.on(pattern, () => {
      totalHandlersCalled++;
    });
  }

  // Emit events
  const eventCount = 100;
  for (let i = 0; i < eventCount; i++) {
    const eventType = i % 3 === 0 ? 'workeffort:created' :
                     i % 3 === 1 ? 'ticket:updated' :
                     'system:connected';
    eventBus.emit(eventType, { id: i });
  }

  return {
    name: 'Wildcard Subscriptions',
    subscriberCount,
    eventCount,
    totalHandlersCalled,
    avgHandlersPerEvent: Math.round((totalHandlersCalled / eventCount) * 10) / 10
  };
}

/**
 * Test middleware chain
 */
function testMiddlewareChain(middlewareCount) {
  const eventBus = new MockEventBus();
  const middlewareTimes = [];

  // Add middleware
  for (let i = 0; i < middlewareCount; i++) {
    eventBus.use((event) => {
      const start = performance.now();
      // Simulate some work
      const result = event.data?.id % 2 === 0;
      const end = performance.now();
      middlewareTimes.push(end - start);
      return result; // Block even IDs
    });
  }

  // Emit events
  const eventCount = 100;
  for (let i = 0; i < eventCount; i++) {
    eventBus.emit('test:event', { id: i });
  }

  const avgMiddlewareTime = middlewareTimes.length > 0
    ? Math.round((middlewareTimes.reduce((a, b) => a + b, 0) / middlewareTimes.length) * 100) / 100
    : 0;

  return {
    name: 'Middleware Chain',
    middlewareCount,
    eventCount,
    avgMiddlewareTime,
    blockedEvents: eventCount - eventBus.getEventCount()
  };
}

/**
 * Test realistic work effort scenario
 */
function testRealisticScenario() {
  const eventBus = new MockEventBus();
  const start = performance.now();

  // Track events
  const eventCounts = {};
  eventBus.on('*', (event) => {
    eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
  });

  // Simulate 10 work efforts with tickets
  const workEffortCount = 10;
  let ticketCount = 0;

  for (let i = 0; i < workEffortCount; i++) {
    const we = createWorkEffortFixture(`WE-260102-test${i}`, `Work ${i}`, 'active');
    eventBus.emit('workeffort:created', { id: we.id, title: we.title, repo: '_pyrite' });

    // Add 3-5 tickets per work effort
    const ticketCountForWE = 3 + (i % 3);
    for (let j = 0; j < ticketCountForWE; j++) {
      const ticket = createTicketFixture(`TKT-test${i}-${String(j + 1).padStart(3, '0')}`,
                                        `Ticket ${j + 1}`, 'pending');
      ticketCount++;
      eventBus.emit('ticket:created', {
        id: ticket.id,
        title: ticket.title,
        workEffortId: we.id,
        repo: '_pyrite'
      });
    }

    // Some status changes
    if (i % 3 === 0) {
      eventBus.emit('workeffort:updated', { id: we.id, status: 'active', repo: '_pyrite' });
    }
  }

  const end = performance.now();
  const duration = end - start;

  return {
    name: 'Realistic Scenario',
    workEffortCount,
    ticketCount,
    eventCount: eventBus.getEventCount(),
    duration: Math.round(duration),
    eventBreakdown: eventCounts
  };
}

/**
 * Test event history tracking
 */
function testEventHistory(eventCount) {
  const eventBus = new MockEventBus();

  // Emit many events
  for (let i = 0; i < eventCount; i++) {
    eventBus.emit(`test:event${i % 100}`, { id: i });
  }

  const historySize = eventBus.getAllEvents().length;
  const memoryEfficient = historySize <= 100; // Should cap at 100 by default

  return {
    name: 'Event History',
    eventCount,
    historySize,
    memoryEfficient,
    eventsTracked: historySize
  };
}

/**
 * Generate report
 */
function generateReport(results) {
  let report = '# Event Bus Stress Test Report\n\n';
  report += `**Generated:** ${new Date().toISOString()}\n\n`;
  report += '## Test Results\n\n';

  for (const result of results) {
    report += `### ${result.name}\n\n`;
    report += `- **Event Count:** ${result.eventCount || 'N/A'}\n`;
    if (result.duration) report += `- **Duration:** ${result.duration}ms\n`;
    if (result.avgTime) report += `- **Avg Time:** ${result.avgTime}ms per event\n`;
    if (result.subscriberCount) report += `- **Subscribers:** ${result.subscriberCount}\n`;
    if (result.totalHandlersCalled) report += `- **Total Handlers Called:** ${result.totalHandlersCalled}\n`;
    if (result.middlewareCount) report += `- **Middleware:** ${result.middlewareCount}\n`;
    if (result.eventBreakdown) {
      report += `- **Event Breakdown:**\n`;
      for (const [type, count] of Object.entries(result.eventBreakdown)) {
        report += `  - \`${type}\`: ${count}\n`;
      }
    }
    report += '\n';
  }

  // Summary
  report += '## Summary\n\n';
  const totalEvents = results.reduce((sum, r) => sum + (r.eventCount || 0), 0);
  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);

  report += `- **Total Tests:** ${results.length}\n`;
  report += `- **Total Events Emitted:** ${totalEvents}\n`;
  report += `- **Total Duration:** ${totalDuration}ms\n`;
  report += `- **Average Events per Test:** ${Math.round(totalEvents / results.length)}\n\n`;

  return report;
}

/**
 * Main execution
 */
async function main() {
  const results = await runStressTest();

  const report = generateReport(results);

  // Save report
  const fs = await import('fs/promises');
  const path = await import('path');
  const { fileURLToPath } = await import('url');

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const outputDir = path.join(__dirname, 'experiment-results');
  await fs.mkdir(outputDir, { recursive: true });

  const reportPath = path.join(outputDir, `event-bus-stress-test-${Date.now()}.md`);
  await fs.writeFile(reportPath, report);

  console.log('📊 Stress test report generated:');
  console.log(`  📄 ${reportPath}\n`);

  console.log('🎉 Stress test complete!\n');
}

main().catch(console.error);

