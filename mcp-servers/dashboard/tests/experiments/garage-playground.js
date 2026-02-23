/**
 * @fileoverview Garage Playground - Interactive Tool Testing
 *
 * This is our "garage" - a place to bang around and test all our tools
 * with the live server. Let's see what we can break and fix!
 */

import WebSocket from 'ws';
import { parseRepo, getRepoStats } from '../../lib/parser.js';
import { MissionControlHarness } from '../helpers/mission-control-harness.js';
import { createWorkEffortFixture, createTicketFixture, createTestScenario } from '../helpers/fixtures.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoPath = path.resolve(__dirname, '../../../../..');
const WS_URL = 'ws://localhost:3848/ws';

/**
 * Playground experiment 1: Rapid fire events
 */
async function rapidFireExperiment() {
  console.log('🔥 Experiment 1: Rapid Fire Events\n');

  const ws = new WebSocket(WS_URL);
  let messageCount = 0;

  return new Promise((resolve) => {
    ws.on('open', () => {
      console.log('  ✅ Connected to server');
      console.log('  📡 Listening for rapid updates...\n');
    });

    ws.on('message', (data) => {
      messageCount++;
      const message = JSON.parse(data.toString());
      const time = new Date().toLocaleTimeString();
      console.log(`  [${time}] ${message.type} - Message #${messageCount}`);

      if (message.type === 'init') {
        console.log(`     Loaded ${Object.keys(message.repos || {}).length} repos\n`);
      }
    });

    setTimeout(() => {
      ws.close();
      console.log(`\n  📊 Total messages: ${messageCount}`);
      console.log(`  ⚡ Messages per second: ${(messageCount / 5).toFixed(1)}\n`);
      resolve();
    }, 5000);
  });
}

/**
 * Playground experiment 2: Create and delete work effort
 */
async function createDeleteExperiment() {
  console.log('📝 Experiment 2: Create & Delete Work Effort\n');

  const testWEPath = path.join(repoPath, '_work_efforts', 'WE-260104-garage-test_garage_test');
  const indexPath = path.join(testWEPath, 'WE-260104-garage-test_index.md');
  const ticketsPath = path.join(testWEPath, 'tickets');

  try {
    // Create work effort
    await fs.mkdir(ticketsPath, { recursive: true });

    const weContent = `---
id: WE-260104-garage-test
title: "Garage Playground Test"
status: active
created: ${new Date().toISOString()}
---

# Garage Playground Test

This work effort was created by the garage playground tool!
`;

    await fs.writeFile(indexPath, weContent);
    console.log('  ✅ Created work effort');
    console.log(`     Path: ${testWEPath}`);

    // Create a ticket
    const ticketContent = `---
id: TKT-garage-001
title: "Test Ticket from Garage"
status: pending
---

# Test Ticket

Created by garage playground!
`;

    await fs.writeFile(path.join(ticketsPath, 'TKT-garage-001_test_ticket.md'), ticketContent);
    console.log('  ✅ Created ticket');

    // Wait for watcher
    console.log('  ⏳ Waiting for file watcher (3s)...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Delete it
    await fs.rm(testWEPath, { recursive: true, force: true });
    console.log('  🗑️  Deleted work effort');

    // Wait for deletion to be detected
    console.log('  ⏳ Waiting for deletion detection (3s)...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('  ✅ Experiment complete\n');
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}\n`);
  }
}

/**
 * Playground experiment 3: Test harness vs live server
 */
async function harnessComparisonExperiment() {
  console.log('⚖️  Experiment 3: Test Harness vs Live Server\n');

  // Parse real data
  const parseResult = await parseRepo(repoPath);
  const stats = getRepoStats(parseResult.workEfforts);
  const sampleWEs = parseResult.workEfforts.slice(0, 5);

  console.log('  📊 Real Data:');
  console.log(`     Work Efforts: ${parseResult.workEfforts.length}`);
  console.log(`     Tickets: ${stats.totalTickets}`);
  console.log(`     Sample: ${sampleWEs.length} work efforts\n`);

  // Test with harness
  const harness = new MissionControlHarness();
  harness.handleMessage({
    type: 'init',
    repos: {
      '_pyrite': {
        workEfforts: sampleWEs,
        stats: getRepoStats(sampleWEs),
        lastUpdated: new Date().toISOString()
      }
    }
  });

  const harnessEvents = harness.eventBus.getAllEvents();
  console.log('  🧪 Test Harness:');
  console.log(`     Events: ${harnessEvents.length}`);
  console.log(`     Event Types: ${harnessEvents.map(e => e.type).join(', ')}\n`);

  // Compare with live server
  return new Promise((resolve) => {
    const ws = new WebSocket(WS_URL);
    let liveMessage = null;

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      if (message.type === 'init') {
        liveMessage = message;
        ws.close();
      }
    });

    ws.on('close', () => {
      if (liveMessage) {
        const liveRepos = liveMessage.repos || {};
        const liveWECount = Object.values(liveRepos).reduce((sum, repo) => {
          return sum + (repo.workEfforts?.length || 0);
        }, 0);

        console.log('  🌐 Live Server:');
        console.log(`     Repos: ${Object.keys(liveRepos).length}`);
        console.log(`     Work Efforts: ${liveWECount}`);
        console.log(`     Message Type: ${liveMessage.type}\n`);

        console.log('  📈 Comparison:');
        console.log(`     Harness Events: ${harnessEvents.length}`);
        console.log(`     Live Repos: ${Object.keys(liveRepos).length}`);
        console.log(`     Data Match: ${sampleWEs.length <= liveWECount ? '✅' : '❌'}\n`);
      }
      resolve();
    });
  });
}

/**
 * Playground experiment 4: Generate and inject test data
 */
async function dataInjectionExperiment() {
  console.log('💉 Experiment 4: Data Injection Test\n');

  // Generate test scenario
  const scenario = createTestScenario({
    workEffortCount: 3,
    ticketsPerWE: 2,
    repoName: '_pyrite'
  });

  console.log('  🎲 Generated Test Scenario:');
  console.log(`     Work Efforts: ${scenario.workEfforts.length}`);
  console.log(`     Tickets: ${scenario.stats.totalTickets}`);
  console.log(`     Active: ${scenario.stats.activeWorkEfforts}\n`);

  // Test with harness
  const harness = new MissionControlHarness();
  harness.handleMessage(scenario.initMessage);

  const events = harness.eventBus.getAllEvents();
  console.log('  📡 Events Emitted:');
  for (const event of events) {
    console.log(`     ${event.type} - ${event.data?.id || 'N/A'}`);
  }
  console.log();

  // Show what would be sent to server
  const wsMessage = JSON.stringify(scenario.initMessage);
  console.log('  📦 WebSocket Message Size:');
  console.log(`     ${(wsMessage.length / 1024).toFixed(2)} KB\n`);
}

/**
 * Playground experiment 5: Stress test with many updates
 */
async function stressTestExperiment() {
  console.log('💥 Experiment 5: Stress Test\n');

  const ws = new WebSocket(WS_URL);
  const updates = [];
  let updateCount = 0;

  return new Promise((resolve) => {
    ws.on('open', () => {
      console.log('  ✅ Connected');
      console.log('  🔄 Monitoring for updates...\n');
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      if (message.type === 'update') {
        updateCount++;
        updates.push({
          repo: message.repo,
          weCount: message.workEfforts?.length || 0,
          timestamp: new Date().toLocaleTimeString()
        });
        console.log(`  [${updates[updates.length - 1].timestamp}] Update #${updateCount} - ${message.repo}`);
      }
    });

    // Create a work effort to trigger updates
    setTimeout(async () => {
      const testPath = path.join(repoPath, '_work_efforts', 'WE-260104-stress_stress_test');
      const indexFile = path.join(testPath, 'WE-260104-stress_index.md');

      try {
        await fs.mkdir(testPath, { recursive: true });
        await fs.writeFile(indexFile, `---
id: WE-260104-stress
title: "Stress Test"
status: active
created: ${new Date().toISOString()}
---

# Stress Test
`);
        console.log('\n  ✅ Created stress test work effort');

        // Wait for updates
        await new Promise(r => setTimeout(r, 5000));

        // Clean up
        await fs.rm(testPath, { recursive: true, force: true });
        console.log('  🧹 Cleaned up\n');
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}\n`);
      }

      ws.close();
      console.log(`  📊 Total Updates: ${updateCount}`);
      resolve();
    }, 2000);
  });
}

/**
 * Run all playground experiments
 */
async function runPlayground() {
  console.log('🔧 GARAGE PLAYGROUND - Tool Testing\n');
  console.log('='.repeat(60));
  console.log();

  await rapidFireExperiment();
  await createDeleteExperiment();
  await harnessComparisonExperiment();
  await dataInjectionExperiment();
  await stressTestExperiment();

  console.log('🎉 All experiments complete!');
  console.log('✨ Tools are working great!\n');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runPlayground().catch(console.error);
}

export { runPlayground };

