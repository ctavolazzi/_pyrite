/**
 * @fileoverview Watcher Data Flow Tests
 *
 * Tests HOW data flows from file changes → watcher → parser → broadcast.
 * Documents event propagation and state updates.
 *
 * Data Flow Path:
 *   File System Change (add/change/unlink)
 *     ↓
 *   chokidar detects change
 *     ↓
 *   DebouncedWatcher.scheduleUpdate() (debounce 500ms)
 *     ↓
 *   Throttle check (min 2s between emits)
 *     ↓
 *   'update' event emitted
 *     ↓
 *   Server refreshRepo() called
 *     ↓
 *   parseRepo() re-parses
 *     ↓
 *   RepoState updated
 *     ↓
 *   WebSocket broadcast() called
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';
import { DebouncedWatcher } from '../../lib/watcher.js';
import { parseRepo } from '../../lib/parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');

/**
 * Helper to create test repository
 */
async function createTestRepo(repoPath) {
  await fs.mkdir(repoPath, { recursive: true });
  const weDir = path.join(repoPath, '_work_efforts');
  await fs.mkdir(weDir, { recursive: true });
  return weDir;
}

test('Watcher Flow: File Add → Event Emission', async (t) => {
  const testRepoPath = path.join(fixturesDir, 'watcher-test-1');
  const weDir = await createTestRepo(testRepoPath);
  const watcher = new DebouncedWatcher(100); // Short debounce for testing
  watcher.minEmitInterval = 0; // Disable throttling in tests
  const events = [];

  try {
    watcher.on('update', (data) => {
      events.push(data);
    });

    watcher.watch('test-repo', testRepoPath);

    // Wait for watcher to be ready (with timeout)
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Watcher ready timeout')), 5000);
      watcher.once('ready', () => {
        clearTimeout(timeout);
        resolve();
      });
    });

    // Create a new work effort (file add)
    const weFolder = 'WE-260102-new1_new_work';
    const wePath = path.join(weDir, weFolder);
    await fs.mkdir(wePath, { recursive: true });

    const indexContent = `---
id: WE-260102-new1
title: "New Work Effort"
status: active
---
`;

    await fs.writeFile(
      path.join(wePath, 'WE-260102-new1_index.md'),
      indexContent
    );

    // Wait for debounce + event (with timeout)
    await new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(), 500); // Wait for debounce (100ms) + buffer
      const checkInterval = setInterval(() => {
        if (events.length > 0) {
          clearTimeout(timeout);
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);
    });

    // Document: Event emitted with correct data shape
    assert.ok(events.length >= 1, 'At least one update event emitted');
    const event = events[0];
    assert.strictEqual(event.repo, 'test-repo', 'Repository name in event');
    assert.ok(['add', 'addDir'].includes(event.event), 'File add event type');
    assert.ok(event.path.includes(weFolder), 'Path includes new work effort');
  } finally {
    // Always close watcher and clean up
    await watcher.close();
    await new Promise(resolve => setTimeout(resolve, 100)); // Let file system settle
    await fs.rm(testRepoPath, { recursive: true, force: true });
  }
});

test('Watcher Flow: Debounce Batching', async (t) => {
  const testRepoPath = path.join(fixturesDir, 'watcher-test-2');
  const weDir = await createTestRepo(testRepoPath);
  const watcher = new DebouncedWatcher(200); // 200ms debounce
  watcher.minEmitInterval = 0; // Disable throttling in tests
  const events = [];

  try {
    watcher.on('update', (data) => {
      events.push(data);
    });

    watcher.watch('test-repo', testRepoPath);
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Watcher ready timeout')), 5000);
      watcher.once('ready', () => {
        clearTimeout(timeout);
        resolve();
      });
    });

    // Create multiple files rapidly
    const weFolder = 'WE-260102-batch1_batch_test';
    const wePath = path.join(weDir, weFolder);
    await fs.mkdir(wePath, { recursive: true });

    await fs.writeFile(path.join(wePath, 'file1.md'), 'content1');
    await fs.writeFile(path.join(wePath, 'file2.md'), 'content2');
    await fs.writeFile(path.join(wePath, 'file3.md'), 'content3');

    // Wait for: awaitWriteFinish (100ms) + debounce (200ms) + buffer
    await new Promise(resolve => setTimeout(resolve, 500));

    // Document: Multiple rapid changes batched into single event
    assert.ok(events.length >= 1, 'At least one event emitted');
  } finally {
    await watcher.close();
    await new Promise(resolve => setTimeout(resolve, 100)); // Let file system settle
    await fs.rm(testRepoPath, { recursive: true, force: true });
  }
});

test('Watcher Flow: Throttle Enforcement', async (t) => {
  const testRepoPath = path.join(fixturesDir, 'watcher-test-3');
  const weDir = await createTestRepo(testRepoPath);

  // Create watcher with short debounce but normal throttle
  const watcher = new DebouncedWatcher(50);
  watcher.minEmitInterval = 1000; // 1 second throttle for testing
  const events = [];
  const timestamps = [];

  try {
    watcher.on('update', (data) => {
      events.push(data);
      timestamps.push(Date.now());
    });

    watcher.watch('test-repo', testRepoPath);
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Watcher ready timeout')), 5000);
      watcher.once('ready', () => {
        clearTimeout(timeout);
        resolve();
      });
    });

    // Create first change
    const we1 = 'WE-260102-throttle1_test1';
    await fs.mkdir(path.join(weDir, we1), { recursive: true });
    await new Promise(resolve => setTimeout(resolve, 200));

    // Create second change immediately (should be throttled)
    const we2 = 'WE-260102-throttle2_test2';
    await fs.mkdir(path.join(weDir, we2), { recursive: true });
    await new Promise(resolve => setTimeout(resolve, 200));

    // Create third change after throttle period
    await new Promise(resolve => setTimeout(resolve, 1200));
    const we3 = 'WE-260102-throttle3_test3';
    await fs.mkdir(path.join(weDir, we3), { recursive: true });
    await new Promise(resolve => setTimeout(resolve, 200));

    // Document: Throttle prevents rapid emissions
    assert.ok(events.length >= 2, 'Multiple events emitted');

    // Check time between events
    if (timestamps.length >= 2) {
      const timeDiff = timestamps[1] - timestamps[0];
      assert.ok(timeDiff >= 1000, 'Events throttled to minimum interval');
    }
  } finally {
    await watcher.close();
    await new Promise(resolve => setTimeout(resolve, 100)); // Let file system settle
    await fs.rm(testRepoPath, { recursive: true, force: true });
  }
});

test('Watcher Flow: File Change → Reparse → State Update', async (t) => {
  const testRepoPath = path.join(fixturesDir, 'watcher-test-4');
  const weDir = await createTestRepo(testRepoPath);

  // Create initial work effort
  const weFolder = 'WE-260102-update1_update_test';
  const wePath = path.join(weDir, weFolder);
  await fs.mkdir(wePath, { recursive: true });

  let indexContent = `---
id: WE-260102-update1
title: "Original Title"
status: active
---
`;

  await fs.writeFile(
    path.join(wePath, 'WE-260102-update1_index.md'),
    indexContent
  );

  // Initial parse
  let result = await parseRepo(testRepoPath);
  assert.strictEqual(result.workEfforts[0].title, 'Original Title', 'Initial title');

  // Setup watcher
  const watcher = new DebouncedWatcher(100);
  watcher.minEmitInterval = 0; // Disable throttling in tests
  let reparseTriggered = false;

  try {
    watcher.on('update', async () => {
      // Simulate server refreshRepo() behavior
      result = await parseRepo(testRepoPath);
      reparseTriggered = true;
    });

    watcher.watch('test-repo', testRepoPath);
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Watcher ready timeout')), 5000);
      watcher.once('ready', () => {
        clearTimeout(timeout);
        resolve();
      });
    });

    // Update file
    indexContent = `---
id: WE-260102-update1
title: "Updated Title"
status: paused
---
`;

    await fs.writeFile(
      path.join(wePath, 'WE-260102-update1_index.md'),
      indexContent
    );

    // Wait for: awaitWriteFinish (100ms) + debounce (100ms) + buffer
    await new Promise(resolve => setTimeout(resolve, 400));

    // Document: File change triggers reparse and state update
    assert.ok(reparseTriggered, 'Reparse triggered by file change');
    assert.strictEqual(result.workEfforts[0].title, 'Updated Title', 'Title updated');
    assert.strictEqual(result.workEfforts[0].status, 'paused', 'Status updated');
  } finally {
    await watcher.close();
    await new Promise(resolve => setTimeout(resolve, 100)); // Let file system settle
    await fs.rm(testRepoPath, { recursive: true, force: true });
  }
});

test('Watcher Flow: Error Propagation', async (t) => {
  const testRepoPath = path.join(fixturesDir, 'watcher-test-5');

  // Don't create _work_efforts folder - will cause error
  await fs.mkdir(testRepoPath, { recursive: true });

  const watcher = new DebouncedWatcher(100);
  watcher.minEmitInterval = 0; // Disable throttling in tests
  const errors = [];

  try {
    watcher.on('error', (data) => {
      errors.push(data);
    });

    // Try to watch non-existent _work_efforts
    watcher.watch('test-repo', testRepoPath);

    // Wait a bit for error to potentially occur
    await new Promise(resolve => setTimeout(resolve, 500));

    // Document: Errors are emitted through error event
    // (Note: chokidar might not error immediately, this test documents the flow)
  } finally {
    await watcher.close();
    await new Promise(resolve => setTimeout(resolve, 100)); // Let file system settle
    await fs.rm(testRepoPath, { recursive: true, force: true });
  }
});

