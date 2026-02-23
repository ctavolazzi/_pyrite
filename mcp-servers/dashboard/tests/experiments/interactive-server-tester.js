/**
 * @fileoverview Interactive Server Tester
 *
 * Connects to the live dashboard server and tests various operations:
 * - WebSocket connections
 * - Real-time updates
 * - API endpoints
 * - Event streaming
 */

import WebSocket from 'ws';
import http from 'http';

const SERVER_URL = 'http://localhost:3848';
const WS_URL = 'ws://localhost:3848/ws';

/**
 * Test HTTP endpoints
 */
async function testHTTPEndpoints() {
  console.log('🌐 Testing HTTP Endpoints...\n');

  const endpoints = [
    { path: '/', name: 'Dashboard' },
    { path: '/api/repos', name: 'Repos API' },
    { path: '/api/stats', name: 'Stats API' }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${SERVER_URL}${endpoint.path}`);
      const status = response.status;
      const contentType = response.headers.get('content-type') || 'unknown';

      console.log(`  ${status === 200 ? '✅' : '❌'} ${endpoint.name} (${endpoint.path})`);
      console.log(`     Status: ${status}, Content-Type: ${contentType}`);
    } catch (error) {
      console.log(`  ❌ ${endpoint.name} - Error: ${error.message}`);
    }
  }

  console.log();
}

/**
 * Test WebSocket connection
 */
function testWebSocket() {
  return new Promise((resolve, reject) => {
    console.log('🔌 Testing WebSocket Connection...\n');

    const ws = new WebSocket(WS_URL);
    const messages = [];
    let connected = false;

    ws.on('open', () => {
      connected = true;
      console.log('  ✅ WebSocket connected');
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        messages.push(message);

        console.log(`  📨 Received message: ${message.type}`);
        if (message.type === 'init') {
          console.log(`     Repos: ${Object.keys(message.repos || {}).length}`);
          if (message.repos) {
            for (const [repoName, repoData] of Object.entries(message.repos)) {
              const weCount = repoData.workEfforts?.length || 0;
              const ticketCount = repoData.stats?.totalTickets || 0;
              console.log(`     ${repoName}: ${weCount} work efforts, ${ticketCount} tickets`);
            }
          }
        }
      } catch (error) {
        console.log(`  ⚠️  Non-JSON message: ${data.toString().substring(0, 50)}...`);
      }
    });

    ws.on('error', (error) => {
      console.log(`  ❌ WebSocket error: ${error.message}`);
      reject(error);
    });

    ws.on('close', () => {
      console.log('  🔌 WebSocket closed');
      resolve({ connected, messages });
    });

    // Close after 3 seconds
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    }, 3000);
  });
}

/**
 * Monitor WebSocket for updates
 */
function monitorWebSocket(duration = 10000) {
  return new Promise((resolve) => {
    console.log(`👀 Monitoring WebSocket for ${duration/1000}s...\n`);

    const ws = new WebSocket(WS_URL);
    const updates = [];
    let messageCount = 0;

    ws.on('open', () => {
      console.log('  ✅ Connected, waiting for updates...\n');
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        messageCount++;
        const timestamp = new Date().toLocaleTimeString();

        console.log(`  [${timestamp}] ${message.type}`);

        if (message.type === 'update') {
          updates.push({
            repo: message.repo,
            workEffortCount: message.workEfforts?.length || 0,
            timestamp
          });
          console.log(`     Repo: ${message.repo}, Work Efforts: ${message.workEfforts?.length || 0}`);
        }

        if (message.type === 'init') {
          console.log(`     Initialized with ${Object.keys(message.repos || {}).length} repos`);
        }
      } catch (error) {
        // Ignore parse errors
      }
    });

    ws.on('error', (error) => {
      console.log(`  ❌ Error: ${error.message}`);
    });

    setTimeout(() => {
      ws.close();
      console.log(`\n  📊 Summary: ${messageCount} messages received, ${updates.length} updates`);
      resolve({ messageCount, updates });
    }, duration);
  });
}

/**
 * Test file watcher by creating a test work effort
 */
async function testFileWatcher() {
  console.log('📝 Testing File Watcher...\n');

  const fs = await import('fs/promises');
  const path = await import('path');
  const { fileURLToPath } = await import('url');

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const repoPath = path.resolve(__dirname, '../../../../..');
  const testWEPath = path.join(repoPath, '_work_efforts', 'WE-260104-test-watcher_test_watcher');
  const indexPath = path.join(testWEPath, 'WE-260104-test-watcher_index.md');

  try {
    // Create test work effort
    await fs.mkdir(testWEPath, { recursive: true });

    const content = `---
id: WE-260104-test-watcher
title: "Test Watcher Work Effort"
status: active
created: ${new Date().toISOString()}
---

# Test Watcher Work Effort

This is a test work effort created by the interactive server tester.
`;

    await fs.writeFile(indexPath, content);
    console.log('  ✅ Created test work effort');
    console.log(`     Path: ${testWEPath}`);

    // Wait a bit for watcher to detect
    console.log('  ⏳ Waiting for file watcher to detect change...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Clean up
    await fs.rm(testWEPath, { recursive: true, force: true });
    console.log('  🧹 Cleaned up test work effort');

  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
  }

  console.log();
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Interactive Server Tester\n');
  console.log('='.repeat(60) + '\n');

  // Test 1: HTTP endpoints
  await testHTTPEndpoints();

  // Test 2: WebSocket connection
  try {
    await testWebSocket();
    console.log();
  } catch (error) {
    console.log(`  ❌ WebSocket test failed: ${error.message}\n`);
  }

  // Test 3: Monitor for updates
  await monitorWebSocket(5000);
  console.log();

  // Test 4: File watcher
  await testFileWatcher();

  console.log('✨ All tests complete!\n');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { testHTTPEndpoints, testWebSocket, monitorWebSocket, testFileWatcher };

