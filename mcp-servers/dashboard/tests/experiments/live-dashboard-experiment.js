/**
 * @fileoverview Live Dashboard Experiment
 *
 * Simulates a live dashboard with real-time updates, showing all the tools
 * working together in a dynamic, animated display.
 */

import { parseRepo, getRepoStats } from '../../lib/parser.js';
import { MissionControlHarness } from '../helpers/mission-control-harness.js';
import { createWorkEffortFixture, createTicketFixture, createUpdateMessageFixture } from '../helpers/fixtures.js';
import { MockEventBus } from '../helpers/mock-event-bus.js';

const repoPath = process.cwd();

/**
 * Clear screen and move cursor
 */
function clearScreen() {
  process.stdout.write('\x1b[2J\x1b[H');
}

/**
 * Print header
 */
function printHeader(title) {
  const width = 60;
  const padding = Math.floor((width - title.length) / 2);
  console.log('═'.repeat(width));
  console.log(' '.repeat(padding) + title);
  console.log('═'.repeat(width));
  console.log();
}

/**
 * Print stats with animation
 */
function printStats(stats, frame = 0) {
  const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'][frame % 10];

  console.log(`${spinner} Repository Statistics`);
  console.log(`   Work Efforts: ${stats.totalWorkEfforts} total, ${stats.activeWorkEfforts} active`);
  console.log(`   Tickets: ${stats.totalTickets} total, ${stats.completedTickets} completed`);
  console.log();
}

/**
 * Print event stream
 */
function printEventStream(events, maxLines = 5) {
  console.log('📡 Event Stream:');
  const recent = events.slice(-maxLines);
  for (const event of recent) {
    const time = new Date(event.timestamp).toLocaleTimeString();
    const icon = event.type.includes('created') ? '✨' :
                 event.type.includes('updated') ? '🔄' :
                 event.type.includes('completed') ? '✅' :
                 event.type.includes('error') ? '❌' : '📢';
    console.log(`   ${icon} [${time}] ${event.type} - ${event.data?.id || 'N/A'}`);
  }
  if (events.length > maxLines) {
    console.log(`   ... and ${events.length - maxLines} more events`);
  }
  console.log();
}

/**
 * Print work effort list
 */
function printWorkEfforts(workEfforts, maxItems = 5) {
  console.log('📋 Recent Work Efforts:');
  const recent = workEfforts.slice(0, maxItems);
  for (const we of recent) {
    const statusIcon = we.status === 'active' ? '🟢' :
                      we.status === 'completed' ? '✅' :
                      we.status === 'paused' ? '⏸️' : '⚪';
    const ticketCount = we.tickets?.length || 0;
    console.log(`   ${statusIcon} ${we.id} - ${we.title} (${ticketCount} tickets)`);
  }
  if (workEfforts.length > maxItems) {
    console.log(`   ... and ${workEfforts.length - maxItems} more`);
  }
  console.log();
}

/**
 * Simulate live updates
 */
async function simulateLiveUpdates(harness, initialWorkEfforts) {
  const updates = [
    {
      delay: 2000,
      action: () => {
        const newWE = createWorkEffortFixture('WE-260102-new1', 'New Work Effort', 'active', {
          tickets: [
            createTicketFixture('TKT-new1-001', 'First Ticket', 'pending', { workEffortId: 'WE-260102-new1' })
          ]
        });
        return createUpdateMessageFixture('_pyrite', [...initialWorkEfforts, newWE],
          getRepoStats([...initialWorkEfforts, newWE]));
      }
    },
    {
      delay: 4000,
      action: () => {
        // Update status of first work effort
        const updated = initialWorkEfforts[0];
        if (updated) {
          const updatedWE = { ...updated, status: 'completed' };
          const updatedList = [updatedWE, ...initialWorkEfforts.slice(1)];
          return createUpdateMessageFixture('_pyrite', updatedList, getRepoStats(updatedList));
        }
        return null;
      }
    },
    {
      delay: 6000,
      action: () => {
        // Add ticket to first work effort
        const firstWE = initialWorkEfforts[0];
        if (firstWE) {
          const newTicket = createTicketFixture('TKT-test-999', 'New Ticket', 'in_progress',
            { workEffortId: firstWE.id });
          const updatedWE = {
            ...firstWE,
            tickets: [...(firstWE.tickets || []), newTicket]
          };
          const updatedList = [updatedWE, ...initialWorkEfforts.slice(1)];
          return createUpdateMessageFixture('_pyrite', updatedList, getRepoStats(updatedList));
        }
        return null;
      }
    }
  ];

  for (const update of updates) {
    await new Promise(resolve => setTimeout(resolve, update.delay));
    const message = update.action();
    if (message) {
      harness.handleMessage(message);
    }
  }
}

/**
 * Main dashboard loop
 */
async function runLiveDashboard() {
  clearScreen();
  printHeader('🎮 Live Dashboard Experiment');

  console.log('🔍 Loading repository data...\n');

  // Step 1: Parse repository
  const parseResult = await parseRepo(repoPath);
  const stats = getRepoStats(parseResult.workEfforts);
  const workEfforts = parseResult.workEfforts.slice(0, 10); // Use first 10 for demo

  console.log(`✅ Loaded ${parseResult.workEfforts.length} work efforts\n`);

  // Step 2: Initialize harness
  const harness = new MissionControlHarness();
  harness.handleMessage({
    type: 'init',
    repos: {
      '_pyrite': {
        workEfforts: workEfforts,
        stats: stats,
        lastUpdated: new Date().toISOString()
      }
    }
  });

  // Step 3: Start live updates in background
  const updatePromise = simulateLiveUpdates(harness, workEfforts);

  // Step 4: Display loop
  let frame = 0;
  const displayInterval = setInterval(() => {
    clearScreen();
    printHeader('🎮 Live Dashboard Experiment');

    const currentState = harness.getRepoState('_pyrite');
    const currentStats = currentState?.stats || stats;
    const currentWorkEfforts = currentState?.workEfforts || workEfforts;
    const events = harness.eventBus.getAllEvents();

    printStats(currentStats, frame);
    printEventStream(events, 8);
    printWorkEfforts(currentWorkEfforts, 8);

    // Performance metrics
    console.log('⚡ Performance:');
    console.log(`   Events Processed: ${events.length}`);
    console.log(`   State Updates: ${currentState ? 'Active' : 'Inactive'}`);
    console.log(`   Frame: ${frame}`);
    console.log();

    console.log('Press Ctrl+C to stop');

    frame++;
  }, 500);

  // Wait for updates to complete
  await updatePromise;

  // Keep displaying for a bit more
  await new Promise(resolve => setTimeout(resolve, 2000));

  clearInterval(displayInterval);
  clearScreen();

  // Final summary
  printHeader('📊 Experiment Complete');

  const finalState = harness.getRepoState('_pyrite');
  const finalStats = finalState?.stats || stats;
  const finalEvents = harness.eventBus.getAllEvents();

  console.log('Final Statistics:');
  console.log(`   Work Efforts: ${finalStats.totalWorkEfforts}`);
  console.log(`   Tickets: ${finalStats.totalTickets}`);
  console.log(`   Events Emitted: ${finalEvents.length}`);
  console.log();

  console.log('Event Breakdown:');
  const eventCounts = {};
  for (const event of finalEvents) {
    eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
  }
  for (const [type, count] of Object.entries(eventCounts)) {
    console.log(`   ${type}: ${count}`);
  }
  console.log();

  console.log('✨ All tools working together successfully!');
  console.log();
}

/**
 * Main execution
 */
async function main() {
  try {
    await runLiveDashboard();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Experiment stopped by user\n');
  process.exit(0);
});

main();

