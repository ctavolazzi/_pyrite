/**
 * @fileoverview Parser Data Flow Tests
 *
 * Tests HOW data flows from file system → parser → server state.
 * Documents data transformations at each step.
 *
 * Data Flow Path:
 *   File System (markdown files)
 *     ↓
 *   parseRepo() reads files
 *     ↓
 *   gray-matter parses frontmatter
 *     ↓
 *   parseMCPWorkEffort() / parseJohnnyDecimalFile() transforms
 *     ↓
 *   WorkEffort objects created
 *     ↓
 *   getRepoStats() aggregates
 *     ↓
 *   RepoState object
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseRepo, getRepoStats } from '../../lib/parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');

/**
 * Create a temporary work effort structure for testing
 */
async function createTestWorkEffort(basePath, weId, title, status = 'active') {
  const weFolder = `WE-${weId}_test_effort`;
  const wePath = path.join(basePath, '_work_efforts', weFolder);
  const ticketsPath = path.join(wePath, 'tickets');

  await fs.mkdir(ticketsPath, { recursive: true });

  const indexContent = `---
id: WE-${weId}
title: "${title}"
status: ${status}
created: 2026-01-02T00:00:00Z
---

# ${title}

Test work effort content.
`;

  await fs.writeFile(
    path.join(wePath, `WE-${weId}_index.md`),
    indexContent
  );

  return { wePath, weFolder, weId: `WE-${weId}` };
}

/**
 * Create a test ticket
 */
async function createTestTicket(wePath, ticketNum, title, status = 'pending') {
  const weId = path.basename(wePath).split('_')[0].split('-').slice(-1)[0];
  const ticketId = `TKT-${weId}-${String(ticketNum).padStart(3, '0')}`;
  const ticketFile = `${ticketId}_${title.toLowerCase().replace(/\s+/g, '_')}.md`;

  const ticketContent = `---
id: ${ticketId}
title: "${title}"
status: ${status}
created: 2026-01-02T00:00:00Z
---

# ${title}

Test ticket content.
`;

  await fs.writeFile(
    path.join(wePath, 'tickets', ticketFile),
    ticketContent
  );

  return { ticketId, ticketFile };
}

test('Parser Flow: File System → WorkEffort Object', async (t) => {
  const testRepoPath = path.join(fixturesDir, 'test-repo-1');

  // Setup: Create test work effort
  await fs.mkdir(testRepoPath, { recursive: true });
  const { weId, wePath } = await createTestWorkEffort(
    testRepoPath,
    '260102-abc1',
    'Test Work Effort'
  );

  // Step 1: Parse repository
  const result = await parseRepo(testRepoPath);

  // Assert: Data transformation from file to object
  assert.strictEqual(result.workEfforts.length, 1, 'Should parse one work effort');

  const we = result.workEfforts[0];

  // Document: File system data → WorkEffort object shape
  assert.strictEqual(we.id, weId, 'ID extracted from directory name');
  assert.strictEqual(we.format, 'mcp', 'Format detected as MCP');
  assert.strictEqual(we.title, 'Test Work Effort', 'Title from frontmatter');
  assert.strictEqual(we.status, 'active', 'Status from frontmatter');
  assert.ok(we.path, 'Path preserved');
  assert.ok(we.created, 'Created timestamp preserved');
  assert.ok(Array.isArray(we.tickets), 'Tickets array initialized');

  // Cleanup
  await fs.rm(testRepoPath, { recursive: true, force: true });
});

test('Parser Flow: Frontmatter → WorkEffort Properties', async (t) => {
  const testRepoPath = path.join(fixturesDir, 'test-repo-2');

  await fs.mkdir(testRepoPath, { recursive: true });

  // Create work effort with specific frontmatter
  const weFolder = 'WE-260102-xyz9_test';
  const wePath = path.join(testRepoPath, '_work_efforts', weFolder);
  await fs.mkdir(wePath, { recursive: true });

  const indexContent = `---
id: WE-260102-xyz9
title: "Complex Work Effort"
status: paused
created: 2026-01-02T12:34:56Z
branch: feature/test-branch
repository: test-repo
objective: "Test data flow"
---

# Complex Work Effort

Body content here.
`;

  await fs.writeFile(
    path.join(wePath, 'WE-260102-xyz9_index.md'),
    indexContent
  );

  const result = await parseRepo(testRepoPath);
  const we = result.workEfforts[0];

  // Document: All frontmatter fields mapped to WorkEffort
  assert.strictEqual(we.id, 'WE-260102-xyz9', 'ID from frontmatter');
  assert.strictEqual(we.title, 'Complex Work Effort', 'Title preserved');
  assert.strictEqual(we.status, 'paused', 'Status preserved');
  // Note: gray-matter parses ISO dates to Date objects
  assert.ok(we.created, 'Created timestamp preserved');
  if (we.created instanceof Date) {
    assert.strictEqual(we.created.toISOString(), '2026-01-02T12:34:56.000Z', 'Created timestamp as Date object');
  } else {
    assert.ok(we.created.includes('2026-01-02T12:34:56'), 'Created timestamp format correct');
  }
  assert.strictEqual(we.branch, 'feature/test-branch', 'Branch from frontmatter');
  assert.strictEqual(we.repository, 'test-repo', 'Repository from frontmatter');

  await fs.rm(testRepoPath, { recursive: true, force: true });
});

test('Parser Flow: Tickets → WorkEffort.tickets Array', async (t) => {
  const testRepoPath = path.join(fixturesDir, 'test-repo-3');

  await fs.mkdir(testRepoPath, { recursive: true });
  const { wePath } = await createTestWorkEffort(
    testRepoPath,
    '260102-def2',
    'Work Effort with Tickets'
  );

  // Create multiple tickets
  await createTestTicket(wePath, 1, 'First Ticket', 'pending');
  await createTestTicket(wePath, 2, 'Second Ticket', 'in_progress');
  await createTestTicket(wePath, 3, 'Third Ticket', 'completed');

  const result = await parseRepo(testRepoPath);
  const we = result.workEfforts[0];

  // Document: Tickets parsed and attached to WorkEffort
  assert.strictEqual(we.tickets.length, 3, 'All tickets parsed');

  // Document: Ticket object shape
  const ticket1 = we.tickets[0];
  assert.ok(ticket1.id.startsWith('TKT-'), 'Ticket ID format');
  assert.strictEqual(ticket1.title, 'First Ticket', 'Ticket title from frontmatter');
  assert.strictEqual(ticket1.status, 'pending', 'Ticket status from frontmatter');
  assert.ok(ticket1.path, 'Ticket path preserved');
  assert.strictEqual(ticket1.parent, we.id, 'Parent WE ID linked');

  // Document: Ticket status distribution
  const statuses = we.tickets.map(t => t.status);
  assert.ok(statuses.includes('pending'), 'Pending ticket found');
  assert.ok(statuses.includes('in_progress'), 'In progress ticket found');
  assert.ok(statuses.includes('completed'), 'Completed ticket found');

  await fs.rm(testRepoPath, { recursive: true, force: true });
});

test('Parser Flow: WorkEfforts → RepoStats Aggregation', async (t) => {
  const testRepoPath = path.join(fixturesDir, 'test-repo-4');

  await fs.mkdir(testRepoPath, { recursive: true });

  // Create multiple work efforts with different statuses
  await createTestWorkEffort(testRepoPath, '260102-aaa1', 'Active WE', 'active');
  await createTestWorkEffort(testRepoPath, '260102-bbb2', 'Paused WE', 'paused');
  await createTestWorkEffort(testRepoPath, '260102-ccc3', 'Completed WE', 'completed');

  // Add tickets to one work effort
  const { wePath } = await createTestWorkEffort(
    testRepoPath,
    '260102-ddd4',
    'WE with Tickets',
    'active'
  );
  await createTestTicket(wePath, 1, 'Ticket 1', 'pending');
  await createTestTicket(wePath, 2, 'Ticket 2', 'completed');

  const result = await parseRepo(testRepoPath);
  const stats = getRepoStats(result.workEfforts);

  // Document: Aggregation from WorkEfforts → Stats
  assert.strictEqual(stats.total, 4, 'Total work efforts counted');
  assert.strictEqual(stats.byFormat.mcp, 4, 'All MCP format');
  assert.strictEqual(stats.byStatus.active, 2, 'Two active work efforts');
  assert.strictEqual(stats.byStatus.paused, 1, 'One paused work effort');
  assert.strictEqual(stats.byStatus.completed, 1, 'One completed work effort');
  assert.strictEqual(stats.totalTickets, 2, 'Total tickets counted');
  assert.strictEqual(stats.ticketsByStatus.pending, 1, 'One pending ticket');
  assert.strictEqual(stats.ticketsByStatus.completed, 1, 'One completed ticket');

  await fs.rm(testRepoPath, { recursive: true, force: true });
});

test('Parser Flow: Error Handling → ParseResult.error', async (t) => {
  const testRepoPath = path.join(fixturesDir, 'test-repo-5');

  // Create repo without _work_efforts folder
  await fs.mkdir(testRepoPath, { recursive: true });

  const result = await parseRepo(testRepoPath);

  // Document: Error state in result
  assert.strictEqual(result.workEfforts.length, 0, 'No work efforts when folder missing');
  assert.ok(result.error, 'Error message present');
  assert.strictEqual(result.error, 'No _work_efforts folder found', 'Specific error message');

  await fs.rm(testRepoPath, { recursive: true, force: true });
});

test('Parser Flow: Johnny Decimal Format Detection', async (t) => {
  const testRepoPath = path.join(fixturesDir, 'test-repo-6');

  await fs.mkdir(testRepoPath, { recursive: true });

  // Create Johnny Decimal structure
  const jdPath = path.join(testRepoPath, '_work_efforts', '10-19_development');
  const subcatPath = path.join(jdPath, '10_active');
  await fs.mkdir(subcatPath, { recursive: true });

  const jdFile = `---
title: "JD Work Effort"
status: active
created: 2026-01-02T00:00:00Z
---

# JD Work Effort

Content here.
`;

  await fs.writeFile(
    path.join(subcatPath, '10.01_test_work.md'),
    jdFile
  );

  const result = await parseRepo(testRepoPath);

  // Document: JD format detection and parsing
  assert.strictEqual(result.workEfforts.length, 1, 'JD work effort parsed');
  const we = result.workEfforts[0];
  assert.strictEqual(we.format, 'jd', 'Format detected as Johnny Decimal');
  assert.strictEqual(we.id, '10.01', 'ID extracted from filename');
  assert.strictEqual(we.category, '10-19_development', 'Category from parent folder');

  await fs.rm(testRepoPath, { recursive: true, force: true });
});

