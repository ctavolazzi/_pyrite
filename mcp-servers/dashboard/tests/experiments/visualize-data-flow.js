/**
 * @fileoverview Data Flow Visualizer
 *
 * Generates ASCII art diagrams and visual representations of data flow
 * through the Mission Control system.
 */

import { parseRepo, getRepoStats } from '../../lib/parser.js';
import { MissionControlHarness } from '../helpers/mission-control-harness.js';
import { createUpdateMessageFixture } from '../helpers/fixtures.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoPath = path.resolve(__dirname, '../../../..');

/**
 * Generate ASCII flow diagram
 */
function generateFlowDiagram(steps) {
  let diagram = '\n';
  diagram += '┌─────────────────────────────────────────────────────────┐\n';
  diagram += '│           Mission Control Data Flow Diagram              │\n';
  diagram += '└─────────────────────────────────────────────────────────┘\n\n';

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const isLast = i === steps.length - 1;

    // Step box
    diagram += `┌─ Step ${step.number}: ${step.name} ─${'─'.repeat(40 - step.name.length)}┐\n`;
    diagram += `│ ${step.description.padEnd(55)} │\n`;
    diagram += `│                                                         │\n`;
    diagram += `│ Input:  ${step.input.padEnd(49)} │\n`;
    diagram += `│ Output: ${step.output.padEnd(49)} │\n`;

    if (step.metrics) {
      diagram += `│                                                         │\n`;
      for (const [key, value] of Object.entries(step.metrics)) {
        diagram += `│ ${key}: ${String(value).padEnd(51)} │\n`;
      }
    }

    diagram += `└${'─'.repeat(57)}┘\n`;

    if (!isLast) {
      diagram += '    │\n';
      diagram += '    ▼\n';
    }
  }

  diagram += '\n';
  return diagram;
}

/**
 * Generate statistics visualization
 */
function generateStatsVisualization(stats) {
  let viz = '\n';
  viz += '┌─────────────────────────────────────────────────────────┐\n';
  viz += '│              Repository Statistics                       │\n';
  viz += '└─────────────────────────────────────────────────────────┘\n\n';

  // Work efforts bar
  const weBarLength = 50;
  const weFilled = Math.round((stats.activeWorkEfforts / stats.totalWorkEfforts) * weBarLength);
  const weBar = '█'.repeat(weFilled) + '░'.repeat(weBarLength - weFilled);

  viz += `Work Efforts: ${stats.totalWorkEfforts} total, ${stats.activeWorkEfforts} active\n`;
  viz += `[${weBar}] ${Math.round((stats.activeWorkEfforts / stats.totalWorkEfforts) * 100)}%\n\n`;

  // Tickets bar
  const ticketBarLength = 50;
  const ticketFilled = Math.round((stats.completedTickets / stats.totalTickets) * ticketBarLength);
  const ticketBar = '█'.repeat(ticketFilled) + '░'.repeat(ticketBarLength - ticketFilled);

  viz += `Tickets: ${stats.totalTickets} total, ${stats.completedTickets} completed\n`;
  viz += `[${ticketBar}] ${Math.round((stats.completedTickets / stats.totalTickets) * 100)}%\n\n`;

  return viz;
}

/**
 * Generate event flow diagram
 */
function generateEventFlowDiagram(events) {
  let diagram = '\n';
  diagram += '┌─────────────────────────────────────────────────────────┐\n';
  diagram += '│              Event Flow Visualization                    │\n';
  diagram += '└─────────────────────────────────────────────────────────┘\n\n';

  // Group events by type
  const eventGroups = {};
  for (const event of events) {
    const type = event.type.split(':')[0];
    if (!eventGroups[type]) {
      eventGroups[type] = [];
    }
    eventGroups[type].push(event);
  }

  for (const [group, groupEvents] of Object.entries(eventGroups)) {
    diagram += `${group.toUpperCase()} Events (${groupEvents.length}):\n`;
    diagram += '  ' + '─'.repeat(55) + '\n';

    for (const event of groupEvents.slice(0, 5)) { // Show first 5
      const action = event.type.split(':')[1] || 'event';
      diagram += `  • ${action.padEnd(20)} → ${JSON.stringify(event.data?.id || 'N/A').padEnd(30)}\n`;
    }

    if (groupEvents.length > 5) {
      diagram += `  ... and ${groupEvents.length - 5} more\n`;
    }

    diagram += '\n';
  }

  return diagram;
}

/**
 * Generate timeline visualization
 */
function generateTimeline(steps) {
  let timeline = '\n';
  timeline += '┌─────────────────────────────────────────────────────────┐\n';
  timeline += '│              Processing Timeline                        │\n';
  timeline += '└─────────────────────────────────────────────────────────┘\n\n';

  const maxTime = Math.max(...steps.map(s => s.duration || 0));
  const scale = 50 / maxTime;

  for (const step of steps) {
    const barLength = Math.round((step.duration || 0) * scale);
    const bar = '█'.repeat(barLength) + '░'.repeat(50 - barLength);
    const percentage = maxTime > 0 ? Math.round((step.duration / maxTime) * 100) : 0;

    timeline += `${step.name.padEnd(25)} [${bar}] ${percentage}%\n`;
  }

  timeline += '\n';
  return timeline;
}

/**
 * Main execution
 */
async function main() {
  console.log('🎨 Data Flow Visualizer\n');
  console.log('=' .repeat(60) + '\n');

  // Parse repository
  console.log('📊 Parsing repository...');
  const parseResult = await parseRepo(repoPath);
  const stats = getRepoStats(parseResult.workEfforts);
  console.log(`  ✅ Parsed ${parseResult.workEfforts.length} work efforts\n`);

  // Create flow steps
  const steps = [
    {
      number: 1,
      name: 'File System',
      description: 'Read markdown files from _work_efforts directory',
      input: 'File system (markdown files)',
      output: `${parseResult.workEfforts.length} work effort files`,
      duration: 50,
      metrics: { files: parseResult.workEfforts.length }
    },
    {
      number: 2,
      name: 'Parser',
      description: 'Parse frontmatter and extract structured data',
      input: 'Raw markdown content',
      output: 'Structured work effort objects',
      duration: 30,
      metrics: {
        workEfforts: parseResult.workEfforts.length,
        tickets: stats.totalTickets
      }
    },
    {
      number: 3,
      name: 'Statistics',
      description: 'Calculate repository statistics',
      input: 'Work effort objects',
      output: 'Repository stats object',
      duration: 5,
      metrics: stats
    },
    {
      number: 4,
      name: 'Server State',
      description: 'Create in-memory server state',
      input: 'Parsed work efforts + stats',
      output: 'Server state object',
      duration: 2,
      metrics: { size: '~67KB serialized' }
    },
    {
      number: 5,
      name: 'WebSocket',
      description: 'Serialize and send to clients',
      input: 'Server state',
      output: 'WebSocket message (JSON)',
      duration: 10,
      metrics: { messageSize: '~67KB' }
    },
    {
      number: 6,
      name: 'Client State',
      description: 'Deserialize and update client state',
      input: 'WebSocket message',
      output: 'Client state object',
      duration: 5,
      metrics: { repos: 1 }
    },
    {
      number: 7,
      name: 'Event Bus',
      description: 'Emit events for UI updates',
      input: 'State changes',
      output: 'Event bus events',
      duration: 3,
      metrics: { events: 1 }
    },
    {
      number: 8,
      name: 'UI Update',
      description: 'Render updates to DOM',
      input: 'Event bus events',
      output: 'DOM updates',
      duration: 20,
      metrics: { components: 'Multiple' }
    }
  ];

  // Generate visualizations
  console.log('🎨 Generating visualizations...\n');

  const flowDiagram = generateFlowDiagram(steps);
  const statsViz = generateStatsVisualization(stats);

  // Simulate events
  const harness = new MissionControlHarness();
  harness.handleMessage({
    type: 'init',
    repos: {
      '_pyrite': {
        workEfforts: parseResult.workEfforts.slice(0, 5), // Sample
        stats: stats,
        lastUpdated: new Date().toISOString()
      }
    }
  });

  const events = harness.eventBus.getAllEvents();
  const eventFlow = generateEventFlowDiagram(events);
  const timeline = generateTimeline(steps);

  // Combine all visualizations
  let output = '';
  output += flowDiagram;
  output += statsViz;
  output += eventFlow;
  output += timeline;

  // Save to file
  const outputDir = path.join(__dirname, 'experiment-results');
  await fs.mkdir(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, `data-flow-visualization-${Date.now()}.txt`);
  await fs.writeFile(outputPath, output);

  // Also create markdown version
  const mdPath = path.join(outputDir, `data-flow-visualization-${Date.now()}.md`);
  let mdOutput = '# Data Flow Visualization\n\n';
  mdOutput += '```\n';
  mdOutput += output;
  mdOutput += '```\n';
  await fs.writeFile(mdPath, mdOutput);

  // Print to console
  console.log(output);

  console.log('📊 Visualizations saved:');
  console.log(`  📄 ${outputPath}`);
  console.log(`  📄 ${mdPath}\n`);

  console.log('🎉 Visualization complete!\n');
}

main().catch(console.error);

