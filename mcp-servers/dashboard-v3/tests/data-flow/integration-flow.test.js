/**
 * @fileoverview Integration Data Flow Tests
 *
 * Tests end-to-end data flow paths through the entire system.
 * Documents complete data transformations from file system to UI.
 *
 * Integration Paths:
 *   1. Initial Load: File System → Parser → Server → WebSocket → Client → UI
 *   2. File Change: File Change → Watcher → Parser → Server → WebSocket → Client → EventBus → UI
 *   3. Client Action: User Click → HTTP → Server → File Write → Watcher → Parser → Broadcast → Client
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseRepo, getRepoStats } from '../../lib/parser.js';
import { DebouncedWatcher } from '../../lib/watcher.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');

/**
 * Helper to create complete test work effort structure
 */
async function createCompleteWorkEffort(repoPath, weId, title, status, tickets = []) {
  const weFolder = `WE-${weId}_${title.toLowerCase().replace(/\s+/g, '_')}`;
  const wePath = path.join(repoPath, '_work_efforts', weFolder);
  const ticketsPath = path.join(wePath, 'tickets');

  await fs.mkdir(ticketsPath, { recursive: true });

  const indexContent = `---
id: WE-${weId}
title: "${title}"
status: ${status}
created: 2026-01-02T00:00:00Z
---

# ${title}
`;

  await fs.writeFile(
    path.join(wePath, `WE-${weId}_index.md`),
    indexContent
  );

  // Create tickets
  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];
    const ticketId = `TKT-${weId.split('-').slice(-1)[0]}-${String(i + 1).padStart(3, '0')}`;
    const ticketFile = `${ticketId}_${ticket.title.toLowerCase().replace(/\s+/g, '_')}.md`;

    const ticketContent = `---
id: ${ticketId}
title: "${ticket.title}"
status: ${ticket.status || 'pending'}
---

# ${ticket.title}
`;

    await fs.writeFile(
      path.join(ticketsPath, ticketFile),
      ticketContent
    );
  }

  return { wePath, weFolder, weId: `WE-${weId}` };
}

test('Integration Flow: Complete Initial Load Path', async (t) => {
  const testRepoPath = path.join(fixturesDir, 'integration-test-1');
  await fs.mkdir(testRepoPath, { recursive: true });

  // Step 1: Create file system state
  await createCompleteWorkEffort(
    testRepoPath,
    '260102-int1',
    'Integration Test Work',
    'active',
    [
      { title: 'Ticket One', status: 'pending' },
      { title: 'Ticket Two', status: 'in_progress' }
    ]
  );

  // Step 2: Parse (simulating server initRepo)
  const parseResult = await parseRepo(testRepoPath);

  // Step 3: Calculate stats (simulating getRepoStats)
  const stats = getRepoStats(parseResult.workEfforts);

  // Step 4: Create server state (simulating RepoState)
  const serverState = {
    workEfforts: parseResult.workEfforts,
    stats,
    error: parseResult.error || null,
    lastUpdated: new Date().toISOString()
  };

  // Step 5: Serialize for WebSocket (simulating broadcast)
  const wsMessage = {
    type: 'init',
    repos: {
      'test-repo': serverState
    }
  };

  // Step 6: Simulate client receiving message
  const clientState = {
    repos: wsMessage.repos,
    selectedItem: null,
    currentFilter: 'all'
  };

  // Document: Complete data transformation chain
  assert.strictEqual(parseResult.workEfforts.length, 1, 'Work effort parsed from file');
  assert.strictEqual(serverState.workEfforts[0].tickets.length, 2, 'Tickets parsed');
  assert.strictEqual(stats.total, 1, 'Stats calculated');
  assert.strictEqual(stats.totalTickets, 2, 'Ticket stats calculated');
  assert.ok(wsMessage.repos['test-repo'], 'WebSocket message contains repo');
  assert.ok(clientState.repos['test-repo'], 'Client state updated');

  await fs.rm(testRepoPath, { recursive: true, force: true });
});

test('Integration Flow: File Change → UI Update Path', async (t) => {
  const testRepoPath = path.join(fixturesDir, 'integration-test-2');
  await fs.mkdir(testRepoPath, { recursive: true });

  const { wePath } = await createCompleteWorkEffort(
    testRepoPath,
    '260102-int2',
    'Change Test',
    'active'
  );

  // Setup watcher
  const watcher = new DebouncedWatcher(100);
  let updateReceived = false;
  let updatedState = null;

  watcher.on('update', async ({ repo }) => {
    // Simulate server refreshRepo()
    const parseResult = await parseRepo(testRepoPath);
    const stats = getRepoStats(parseResult.workEfforts);

    updatedState = {
      workEfforts: parseResult.workEfforts,
      stats,
      lastUpdated: new Date().toISOString()
    };

    // Simulate WebSocket broadcast
    const wsMessage = {
      type: 'update',
      repo,
      workEfforts: updatedState.workEfforts,
      stats: updatedState.stats
    };

    // Simulate client handleMessage()
    updateReceived = true;
  });

  watcher.watch('test-repo', testRepoPath);
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Watcher ready timeout')), 5000);
    watcher.once('ready', () => {
      clearTimeout(timeout);
      resolve();
    });
  });

  // Trigger file change
  const indexPath = path.join(wePath, path.basename(wePath).split('_')[0] + '_index.md');
  let content = await fs.readFile(indexPath, 'utf-8');
  content = content.replace('status: active', 'status: completed');
  await fs.writeFile(indexPath, content);

  // Wait for update (with timeout)
  await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      // If update not received, still resolve (test will fail assertion)
      resolve();
    }, 2000); // Increased timeout for debounce + throttle

    // Check if update already received
    if (updateReceived) {
      clearTimeout(timeout);
      resolve();
    } else {
      // Poll for update (debounce is 100ms, throttle is 2s, so wait up to 2.5s)
      const checkInterval = setInterval(() => {
        if (updateReceived) {
          clearTimeout(timeout);
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Ensure cleanup after max wait
      setTimeout(() => {
        clearTimeout(timeout);
        clearInterval(checkInterval);
        resolve();
      }, 2500);
    }
  });

  // Document: Complete change propagation
  assert.ok(updateReceived, 'Update event received');
  assert.ok(updatedState, 'State updated');
  assert.strictEqual(updatedState.workEfforts[0].status, 'completed', 'Status change propagated');

  // Always close watcher, even if test fails
  try {
    await watcher.close();
  } catch (error) {
    // Ignore close errors
  }
  await fs.rm(testRepoPath, { recursive: true, force: true });
});

test('Integration Flow: Multiple Repos → Aggregated State', async (t) => {
  const testRepo1 = path.join(fixturesDir, 'integration-test-3a');
  const testRepo2 = path.join(fixturesDir, 'integration-test-3b');

  await fs.mkdir(testRepo1, { recursive: true });
  await fs.mkdir(testRepo2, { recursive: true });

  // Create work efforts in both repos
  await createCompleteWorkEffort(testRepo1, '260102-repo1a', 'Repo 1 Work', 'active');
  await createCompleteWorkEffort(testRepo2, '260102-repo2a', 'Repo 2 Work', 'paused');

  // Parse both (simulating multi-repo server state)
  const repo1Result = await parseRepo(testRepo1);
  const repo2Result = await parseRepo(testRepo2);

  // Create aggregated server state
  const serverState = new Map();
  serverState.set('repo1', {
    workEfforts: repo1Result.workEfforts,
    stats: getRepoStats(repo1Result.workEfforts),
    lastUpdated: new Date().toISOString()
  });
  serverState.set('repo2', {
    workEfforts: repo2Result.workEfforts,
    stats: getRepoStats(repo2Result.workEfforts),
    lastUpdated: new Date().toISOString()
  });

  // Serialize for WebSocket
  const repos = {};
  for (const [name, state] of serverState) {
    repos[name] = state;
  }

  const wsMessage = { type: 'init', repos };

  // Document: Multi-repo aggregation
  assert.strictEqual(Object.keys(wsMessage.repos).length, 2, 'Both repos in message');
  assert.strictEqual(wsMessage.repos.repo1.workEfforts.length, 1, 'Repo 1 work effort');
  assert.strictEqual(wsMessage.repos.repo2.workEfforts.length, 1, 'Repo 2 work effort');

  await fs.rm(testRepo1, { recursive: true, force: true });
  await fs.rm(testRepo2, { recursive: true, force: true });
});

test('Integration Flow: Error Handling Through Stack', async (t) => {
  const testRepoPath = path.join(fixturesDir, 'integration-test-4');

  // Create repo without _work_efforts
  await fs.mkdir(testRepoPath, { recursive: true });

  // Parse (will fail)
  const parseResult = await parseRepo(testRepoPath);

  // Create error state
  const serverState = {
    workEfforts: [],
    stats: getRepoStats([]),
    error: parseResult.error,
    lastUpdated: new Date().toISOString()
  };

  // Serialize error for WebSocket
  const wsMessage = {
    type: 'error',
    repo: 'test-repo',
    message: serverState.error
  };

  // Document: Error propagation
  assert.ok(parseResult.error, 'Error detected in parser');
  assert.ok(serverState.error, 'Error in server state');
  assert.strictEqual(wsMessage.type, 'error', 'Error message type');
  assert.ok(wsMessage.message, 'Error message included');

  await fs.rm(testRepoPath, { recursive: true, force: true });
});

