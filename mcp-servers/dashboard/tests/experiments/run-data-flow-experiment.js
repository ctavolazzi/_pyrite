/**
 * @fileoverview Data Flow Experiment Runner
 *
 * Runs experiments to trace data flow through the system and generate
 * visual reports of how data transforms at each step.
 */

import { parseRepo, getRepoStats } from '../../lib/parser.js';
import { MissionControlHarness } from '../helpers/mission-control-harness.js';
import { createTestScenario, createUpdateMessageFixture } from '../helpers/fixtures.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoPath = path.resolve(__dirname, '../../../..');

/**
 * Trace data through a complete flow
 */
async function traceDataFlow() {
  console.log('🔬 Data Flow Experiment\n');
  console.log('=' .repeat(60) + '\n');

  const trace = {
    timestamp: new Date().toISOString(),
    steps: []
  };

  // Step 1: File System → Parser
  console.log('Step 1: Parsing repository...');
  const parseResult = await parseRepo(repoPath);

  trace.steps.push({
    step: 1,
    name: 'File System → Parser',
    input: { type: 'file_system', path: repoPath },
    output: {
      type: 'parse_result',
      workEffortCount: parseResult.workEfforts.length,
      error: parseResult.error || null
    },
    dataSample: parseResult.workEfforts.slice(0, 2).map(we => ({
      id: we.id,
      title: we.title,
      status: we.status,
      ticketCount: we.tickets?.length || 0
    }))
  });

  console.log(`  ✅ Parsed ${parseResult.workEfforts.length} work efforts\n`);

  // Step 2: Parser → Stats
  console.log('Step 2: Calculating statistics...');
  const stats = getRepoStats(parseResult.workEfforts);

  trace.steps.push({
    step: 2,
    name: 'Parser → Stats',
    input: {
      type: 'work_efforts',
      count: parseResult.workEfforts.length
    },
    output: {
      type: 'repo_stats',
      stats: stats
    }
  });

  console.log(`  ✅ Stats: ${stats.totalWorkEfforts} WEs, ${stats.totalTickets} tickets\n`);

  // Step 3: Stats → Server State
  console.log('Step 3: Creating server state...');
  const serverState = {
    workEfforts: parseResult.workEfforts,
    stats: stats,
    lastUpdated: new Date().toISOString()
  };

  trace.steps.push({
    step: 3,
    name: 'Stats → Server State',
    input: {
      type: 'work_efforts_and_stats',
      workEffortCount: parseResult.workEfforts.length
    },
    output: {
      type: 'server_state',
      repoName: '_pyrite',
      workEffortCount: serverState.workEfforts.length,
      stats: serverState.stats
    }
  });

  console.log(`  ✅ Server state created\n`);

  // Step 4: Server State → WebSocket Message
  console.log('Step 4: Creating WebSocket message...');
  const wsMessage = {
    type: 'init',
    repos: {
      '_pyrite': serverState
    }
  };

  trace.steps.push({
    step: 4,
    name: 'Server State → WebSocket Message',
    input: {
      type: 'server_state',
      workEffortCount: serverState.workEfforts.length
    },
    output: {
      type: 'websocket_message',
      messageType: 'init',
      repoCount: Object.keys(wsMessage.repos).length,
      serializedSize: JSON.stringify(wsMessage).length
    }
  });

  console.log(`  ✅ WebSocket message created (${JSON.stringify(wsMessage).length} bytes)\n`);

  // Step 5: WebSocket → Client State
  console.log('Step 5: Processing client state...');
  const harness = new MissionControlHarness();
  harness.handleMessage(wsMessage);

  const clientState = harness.getRepoState('_pyrite');

  trace.steps.push({
    step: 5,
    name: 'WebSocket → Client State',
    input: {
      type: 'websocket_message',
      messageType: 'init'
    },
    output: {
      type: 'client_state',
      repoName: '_pyrite',
      workEffortCount: clientState?.workEfforts?.length || 0,
      stats: clientState?.stats
    }
  });

  console.log(`  ✅ Client state updated\n`);

  // Step 6: Client State → Events
  console.log('Step 6: Analyzing events...');
  const events = harness.eventBus.getAllEvents();

  trace.steps.push({
    step: 6,
    name: 'Client State → Events',
    input: {
      type: 'client_state',
      workEffortCount: clientState?.workEfforts?.length || 0
    },
    output: {
      type: 'events',
      eventCount: events.length,
      eventTypes: [...new Set(events.map(e => e.type))]
    }
  });

  console.log(`  ✅ ${events.length} events emitted: ${[...new Set(events.map(e => e.type))].join(', ')}\n`);

  // Step 7: Simulate an update
  console.log('Step 7: Simulating update flow...');
  const newWE = parseResult.workEfforts[0]; // Use first real WE
  const updatedStats = getRepoStats([newWE]);

  const updateMessage = createUpdateMessageFixture('_pyrite', [newWE], updatedStats);
  harness.handleMessage(updateMessage);

  const updateEvents = harness.eventBus.getAllEvents().slice(events.length);

  trace.steps.push({
    step: 7,
    name: 'Update Flow',
    input: {
      type: 'update_message',
      workEffortCount: 1
    },
    output: {
      type: 'update_events',
      eventCount: updateEvents.length,
      eventTypes: updateEvents.map(e => e.type)
    }
  });

  console.log(`  ✅ Update processed, ${updateEvents.length} new events\n`);

  return trace;
}

/**
 * Generate visual report
 */
function generateReport(trace) {
  let report = '# Data Flow Experiment Report\n\n';
  report += `**Generated:** ${new Date(trace.timestamp).toLocaleString()}\n\n`;
  report += '## Data Flow Trace\n\n';

  for (const step of trace.steps) {
    report += `### Step ${step.step}: ${step.name}\n\n`;
    report += `**Input:**\n\`\`\`json\n${JSON.stringify(step.input, null, 2)}\n\`\`\`\n\n`;
    report += `**Output:**\n\`\`\`json\n${JSON.stringify(step.output, null, 2)}\n\`\`\`\n\n`;

    if (step.dataSample) {
      report += `**Data Sample:**\n\`\`\`json\n${JSON.stringify(step.dataSample, null, 2)}\n\`\`\`\n\n`;
    }

    report += '---\n\n';
  }

  // Summary
  report += '## Summary\n\n';
  report += `- **Total Steps:** ${trace.steps.length}\n`;
  report += `- **Work Efforts Processed:** ${trace.steps[0].output.workEffortCount}\n`;
  report += `- **Events Emitted:** ${trace.steps[5].output.eventCount}\n`;
  report += `- **Event Types:** ${trace.steps[5].output.eventTypes.join(', ')}\n\n`;

  return report;
}

/**
 * Main execution
 */
async function main() {
  const trace = await traceDataFlow();

  const report = generateReport(trace);

  // Save report
  const outputDir = path.join(__dirname, 'experiment-results');
  await fs.mkdir(outputDir, { recursive: true });

  const reportPath = path.join(outputDir, `data-flow-trace-${Date.now()}.md`);
  await fs.writeFile(reportPath, report);

  const jsonPath = path.join(outputDir, `data-flow-trace-${Date.now()}.json`);
  await fs.writeFile(jsonPath, JSON.stringify(trace, null, 2));

  console.log('📊 Report generated:');
  console.log(`  📄 ${reportPath}`);
  console.log(`  📄 ${jsonPath}\n`);

  console.log('🎉 Experiment complete!\n');
}

main().catch(console.error);

