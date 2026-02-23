#!/usr/bin/env node
/**
 * @fileoverview Mission Control Dashboard Server
 *
 * Express + WebSocket server for real-time work effort monitoring.
 * Supports multi-repository watching with dual format parsing
 * (Johnny Decimal + MCP v0.3.0).
 *
 * @author _pyrite
 * @version 0.6.2
 */

import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import chokidar from 'chokidar';
import chalk from 'chalk';
import { parseRepo, getRepoStats } from './lib/parser.js';
import { DebouncedWatcher } from './lib/watcher.js';
import logger from './lib/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================================
// Configuration
// ============================================================================

/**
 * @typedef {Object} RepoConfig
 * @property {string} name - Display name for the repository
 * @property {string} path - Absolute path to repository root
 */

/**
 * @typedef {Object} Config
 * @property {number} port - Server port (default: 3847)
 * @property {RepoConfig[]} repos - Array of repository configurations
 * @property {number} debounceMs - File watcher debounce in milliseconds
 */

/**
 * Load configuration from config.json.
 * Returns default config if file doesn't exist or is invalid.
 *
 * @returns {Promise<Config>} Server configuration
 */
async function loadConfig() {
  const configPath = path.join(__dirname, 'config.json');
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    logger.warn({ err: error }, 'Failed to load config.json, using defaults');
    return {
      port: 3847,
      repos: [],
      debounceMs: 300
    };
  }
}

/**
 * Save configuration to config.json.
 *
 * @param {Config} config - Configuration to save
 * @returns {Promise<void>}
 */
async function saveConfig(config) {
  const configPath = path.join(__dirname, 'config.json');
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
}

// ============================================================================
// State
// ============================================================================

/**
 * @typedef {Object} RepoState
 * @property {Array} workEfforts - Parsed work efforts
 * @property {Object} stats - Summary statistics
 * @property {string|null} error - Error message if parsing failed
 * @property {string} lastUpdated - ISO timestamp of last update
 */

/** @type {Config} */
let config = await loadConfig();

/** @type {Map<string, RepoState>} Repository name -> state mapping */
const repoState = new Map();

/** @type {DebouncedWatcher} File system watcher instance */
const watcher = new DebouncedWatcher(config.debounceMs);

/** @type {Set<WebSocket>} Connected WebSocket clients */
const clients = new Set();

// ============================================================================
// Express App
// ============================================================================

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    repos: watcher.getWatchedRepos(),
    clients: clients.size
  });
});

// List all repos with current state
app.get('/api/repos', (req, res) => {
  const repos = {};
  for (const [name, state] of repoState) {
    repos[name] = state;
  }
  res.json({ repos });
});

// Get single repo state
app.get('/api/repos/:name', (req, res) => {
  const state = repoState.get(req.params.name);
  if (!state) {
    return res.status(404).json({ error: 'Repo not found' });
  }
  res.json(state);
});

// Add new repo
app.post('/api/repos', async (req, res) => {
  const { name, path: repoPath } = req.body;

  if (!name || !repoPath) {
    return res.status(400).json({ error: 'name and path are required' });
  }

  // Check if path exists
  try {
    await fs.access(repoPath);
  } catch {
    return res.status(400).json({ error: 'Path does not exist' });
  }

  // Add to config
  if (!config.repos.find(r => r.name === name)) {
    config.repos.push({ name, path: repoPath });
    await saveConfig(config);
  }

  // Start watching and parse
  await initRepo(name, repoPath);

  res.json({ success: true, state: repoState.get(name) });
});

// Remove repo
app.delete('/api/repos/:name', async (req, res) => {
  const { name } = req.params;

  await watcher.unwatch(name);
  repoState.delete(name);

  config.repos = config.repos.filter(r => r.name !== name);
  await saveConfig(config);

  broadcast({ type: 'repo_change', action: 'removed', repo: name });

  res.json({ success: true });
});

// Update work effort status
app.patch('/api/repos/:name/work-efforts/:weId/status', async (req, res) => {
  const { name, weId } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }

  const validStatuses = ['active', 'paused', 'completed', 'pending', 'in_progress', 'blocked'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const repoConfig = config.repos.find(r => r.name === name);
  if (!repoConfig) {
    return res.status(404).json({ error: 'Repository not found' });
  }

  try {
    // Find the work effort file and update it
    const workEffortsDir = path.join(repoConfig.path, '_work_efforts');
    const entries = await fs.readdir(workEffortsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.includes(weId.split('_')[0])) {
        // Found the work effort directory
        const indexPath = path.join(workEffortsDir, entry.name, `${weId.split('_')[0]}_index.md`);

        try {
          let content = await fs.readFile(indexPath, 'utf-8');

          // Update status in frontmatter
          content = content.replace(
            /^status:\s*\w+/m,
            `status: ${status}`
          );

          await fs.writeFile(indexPath, content);

          res.json({ success: true, status });
          return;
        } catch (err) {
          // Try alternative file patterns
          const files = await fs.readdir(path.join(workEffortsDir, entry.name));
          const indexFile = files.find(f => f.endsWith('_index.md') || f === 'index.md');

          if (indexFile) {
            const indexPath = path.join(workEffortsDir, entry.name, indexFile);
            let content = await fs.readFile(indexPath, 'utf-8');

            content = content.replace(
              /^status:\s*\w+/m,
              `status: ${status}`
            );

            await fs.writeFile(indexPath, content);

            res.json({ success: true, status });
            return;
          }
        }
      }
    }

    res.status(404).json({ error: 'Work effort not found' });
  } catch (error) {
    logger.error({ err: error }, 'Error updating status');
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// ============================================================================
// Directory Browser API
// ============================================================================

const DEFAULT_CODE_PATH = '/Users/ctavolazzi/Code';

// Browse directories
app.get('/api/browse', async (req, res) => {
  const dirPath = req.query.path || DEFAULT_CODE_PATH;

  try {
    // Security: only allow browsing under Code folder
    const normalizedPath = path.normalize(dirPath);
    if (!normalizedPath.startsWith(DEFAULT_CODE_PATH) && normalizedPath !== '/Users/ctavolazzi') {
      return res.status(403).json({ error: 'Access denied: Can only browse Code folder' });
    }

    const entries = await fs.readdir(normalizedPath, { withFileTypes: true });
    const items = [];

    for (const entry of entries) {
      // Skip hidden files and node_modules
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

      if (entry.isDirectory()) {
        const fullPath = path.join(normalizedPath, entry.name);

        // Check if already added
        const isAdded = config.repos.some(r => r.path === fullPath);

        // Check for _work_efforts folder (both naming conventions)
        let hasWorkEfforts = false;
        let workEffortCount = 0;
        let workEffortsPath = null;

        // Try both naming conventions
        for (const weDirName of ['_work_efforts', '_work_efforts_']) {
          try {
            const weDir = path.join(fullPath, weDirName);
            const weStat = await fs.stat(weDir);
            if (weStat.isDirectory()) {
              hasWorkEfforts = true;
              workEffortsPath = weDir;
              const weEntries = await fs.readdir(weDir);
              workEffortCount = weEntries.filter(e =>
                e.startsWith('WE-') || e.match(/^\d{2}-\d{2}_/)
              ).length;
              break;
            }
          } catch (e) {
            // Try next naming convention
          }
        }

        items.push({
          name: entry.name,
          path: fullPath,
          isDirectory: true,
          hasWorkEfforts,
          workEffortCount,
          isAdded
        });
      }
    }

    // Sort: folders with work_efforts first, then alphabetically
    items.sort((a, b) => {
      if (a.hasWorkEfforts && !b.hasWorkEfforts) return -1;
      if (!a.hasWorkEfforts && b.hasWorkEfforts) return 1;
      return a.name.localeCompare(b.name);
    });

    res.json({
      path: normalizedPath,
      parent: path.dirname(normalizedPath),
      canGoUp: normalizedPath !== '/Users/ctavolazzi',
      items
    });
  } catch (error) {
    logger.error({ err: error }, 'Browse error');
    res.status(500).json({ error: 'Failed to browse directory' });
  }
});

// Bulk add repos
app.post('/api/repos/bulk', async (req, res) => {
  const { paths } = req.body;

  if (!paths || !Array.isArray(paths)) {
    return res.status(400).json({ error: 'paths array is required' });
  }

  const added = [];
  const errors = [];

  for (const repoPath of paths) {
    // Check if already added
    if (config.repos.some(r => r.path === repoPath)) {
      errors.push({ path: repoPath, error: 'Already added' });
      continue;
    }

    // Verify _work_efforts exists (check both naming conventions)
    let weFound = false;
    for (const weDirName of ['_work_efforts', '_work_efforts_']) {
      try {
        const weDir = path.join(repoPath, weDirName);
        await fs.stat(weDir);
        weFound = true;
        break;
      } catch (e) {
        // Try next
      }
    }

    if (!weFound) {
      errors.push({ path: repoPath, error: 'No _work_efforts folder found' });
      continue;
    }

    try {
      const repoName = path.basename(repoPath);
      const repoConfig = { name: repoName, path: repoPath };

      config.repos.push(repoConfig);
      const parsed = await parseRepo(repoConfig);
      repoState.set(repoName, parsed);
      await watcher.watch(repoName, repoPath);

      added.push({ name: repoName, path: repoPath });
    } catch (error) {
      errors.push({ path: repoPath, error: error.message });
    }
  }

  if (added.length > 0) {
    await saveConfig(config);
    broadcast({ type: 'repo_change', action: 'bulk_added', repos: added });
  }

  res.json({ added, errors });
});

// ============================================================================
// Demo API
// ============================================================================

/**
 * Generate a random 4-character alphanumeric ID.
 * Used for work effort and ticket IDs in MCP v0.3.0 format.
 *
 * @returns {string} 4-character ID (a-z, 0-9)
 */
function generateId() {
  return Math.random().toString(36).substring(2, 6);
}

// Create a demo work effort
app.post('/api/demo/work-effort', async (req, res) => {
  const { title, objective } = req.body;
  const repoPath = config.repos[0]?.path; // Use first repo

  if (!repoPath) {
    return res.status(400).json({ error: 'No repository configured' });
  }

  const weId = generateId();
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const slug = (title || 'demo').toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30);
  const weFolderId = `WE-${date}-${weId}`;
  const weFolderName = `${weFolderId}_${slug}`;

  const weDir = path.join(repoPath, '_work_efforts', weFolderName);
  const ticketsDir = path.join(weDir, 'tickets');

  try {
    // Create directories
    await fs.mkdir(weDir, { recursive: true });
    await fs.mkdir(ticketsDir, { recursive: true });

    // Create index.md
    const indexContent = `---
id: ${weFolderId}
title: "${title || 'Demo Work Effort'}"
status: active
created: ${new Date().toISOString()}
objective: "${objective || 'Demonstrate the Mission Control system'}"
---

# ${title || 'Demo Work Effort'}

${objective || 'This is a demo work effort created to demonstrate the Mission Control dashboard.'}

## Progress

- Created via Live Demo feature
`;

    await fs.writeFile(path.join(weDir, `${weFolderId}_index.md`), indexContent);

    res.json({
      success: true,
      workEffort: {
        id: weFolderId,
        folder: weFolderName,
        path: weDir,
        ticketsDir
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error creating demo work effort');
    res.status(500).json({ error: error.message });
  }
});

// Create a demo ticket
app.post('/api/demo/ticket', async (req, res) => {
  const { workEffortPath, title, description } = req.body;

  if (!workEffortPath) {
    return res.status(400).json({ error: 'workEffortPath is required' });
  }

  // Extract WE ID from path
  const weFolderName = path.basename(workEffortPath);
  const weId = weFolderName.split('_')[0].split('-').slice(-1)[0]; // Get the 4-char ID

  const ticketsDir = path.join(workEffortPath, 'tickets');

  try {
    // Count existing tickets
    let ticketNum = 1;
    try {
      const files = await fs.readdir(ticketsDir);
      ticketNum = files.filter(f => f.startsWith('TKT-')).length + 1;
    } catch (e) {
      // Directory might not exist
    }

    const ticketId = `TKT-${weId}-${String(ticketNum).padStart(3, '0')}`;
    const slug = (title || 'demo-ticket').toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30);
    const ticketFileName = `${ticketId}_${slug}.md`;

    const ticketContent = `---
id: ${ticketId}
title: "${title || 'Demo Ticket'}"
status: pending
created: ${new Date().toISOString()}
---

# ${title || 'Demo Ticket'}

${description || 'This is a demo ticket created to demonstrate the Mission Control dashboard.'}

## Acceptance Criteria

- [ ] Demo completed successfully
`;

    await fs.writeFile(path.join(ticketsDir, ticketFileName), ticketContent);

    res.json({
      success: true,
      ticket: {
        id: ticketId,
        fileName: ticketFileName,
        path: path.join(ticketsDir, ticketFileName)
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error creating demo ticket');
    res.status(500).json({ error: error.message });
  }
});

// Update demo ticket status
app.patch('/api/demo/ticket/:ticketPath', async (req, res) => {
  const ticketPath = decodeURIComponent(req.params.ticketPath);
  const { status } = req.body;

  try {
    let content = await fs.readFile(ticketPath, 'utf-8');
    content = content.replace(/status: \w+/, `status: ${status}`);
    await fs.writeFile(ticketPath, content);

    res.json({ success: true, status });
  } catch (error) {
    logger.error({ err: error }, 'Error updating ticket');
    res.status(500).json({ error: error.message });
  }
});

// Update demo work effort status
app.patch('/api/demo/work-effort/:wePath', async (req, res) => {
  const wePath = decodeURIComponent(req.params.wePath);
  const { status } = req.body;

  try {
    // Find the index file
    const files = await fs.readdir(wePath);
    const indexFile = files.find(f => f.endsWith('_index.md'));

    if (!indexFile) {
      return res.status(404).json({ error: 'Index file not found' });
    }

    const indexPath = path.join(wePath, indexFile);
    let content = await fs.readFile(indexPath, 'utf-8');
    content = content.replace(/status: \w+/, `status: ${status}`);
    await fs.writeFile(indexPath, content);

    res.json({ success: true, status });
  } catch (error) {
    logger.error({ err: error }, 'Error updating work effort');
    res.status(500).json({ error: error.message });
  }
});

// Clean up demo work efforts
app.delete('/api/demo/cleanup', async (req, res) => {
  const repoPath = config.repos[0]?.path;

  if (!repoPath) {
    return res.status(400).json({ error: 'No repository configured' });
  }

  const weDir = path.join(repoPath, '_work_efforts');

  try {
    const entries = await fs.readdir(weDir, { withFileTypes: true });
    let cleaned = 0;

    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.includes('_demo')) {
        const fullPath = path.join(weDir, entry.name);
        await fs.rm(fullPath, { recursive: true, force: true });
        cleaned++;
      }
    }

    res.json({ success: true, cleaned });
  } catch (error) {
    logger.error({ err: error }, 'Error cleaning up demos');
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Counter System API
// ============================================================================

// Get counter system statistics
app.get('/api/counter/stats', async (req, res) => {
  try {
    const { getCounterSystem } = await import('./lib/counter-system/index.js');
    const counter = await getCounterSystem();
    const stats = counter.getStatistics();
    res.json(stats);
  } catch (error) {
    logger.error({ err: error }, 'Error fetching counter stats');
    res.status(500).json({ error: error.message });
  }
});

// Get audit log
app.get('/api/counter/audit', async (req, res) => {
  try {
    const { getCounterSystem } = await import('./lib/counter-system/index.js');
    const counter = await getCounterSystem();
    const limit = parseInt(req.query.limit) || 100;
    const audit = counter.getAuditLog(limit);
    res.json(audit);
  } catch (error) {
    logger.error({ err: error }, 'Error fetching audit log');
    res.status(500).json({ error: error.message });
  }
});

// Run validation
app.get('/api/counter/validate', async (req, res) => {
  try {
    const { getCounterSystem } = await import('./lib/counter-system/index.js');
    const CounterValidator = (await import('./lib/counter-system/validator.js')).default;

    const counter = await getCounterSystem();
    const repoPath = config.repos[0]?.path;

    if (!repoPath) {
      return res.status(400).json({ error: 'No repository configured' });
    }

    const workEffortsPath = path.join(repoPath, '_work_efforts');
    const validator = new CounterValidator(counter, workEffortsPath);

    const results = await validator.validate();
    res.json(results);
  } catch (error) {
    logger.error({ err: error }, 'Error validating counters');
    res.status(500).json({ error: error.message });
  }
});

// Auto-repair counters
app.post('/api/counter/repair', async (req, res) => {
  try {
    const { getCounterSystem } = await import('./lib/counter-system/index.js');
    const CounterValidator = (await import('./lib/counter-system/validator.js')).default;

    const counter = await getCounterSystem();
    const repoPath = config.repos[0]?.path;

    if (!repoPath) {
      return res.status(400).json({ error: 'No repository configured' });
    }

    const workEffortsPath = path.join(repoPath, '_work_efforts');
    const validator = new CounterValidator(counter, workEffortsPath);

    const validationResults = req.body;
    const repairs = await validator.autoRepair(validationResults);

    res.json(repairs);
  } catch (error) {
    logger.error({ err: error }, 'Error repairing counters');
    res.status(500).json({ error: error.message });
  }
});

// Preview migration
app.get('/api/counter/migrate/preview', async (req, res) => {
  try {
    const { getCounterSystem } = await import('./lib/counter-system/index.js');
    const CounterMigrator = (await import('./lib/counter-system/migrator.js')).default;

    const counter = await getCounterSystem();
    const repoPath = config.repos[0]?.path;

    if (!repoPath) {
      return res.status(400).json({ error: 'No repository configured' });
    }

    const workEffortsPath = path.join(repoPath, '_work_efforts');
    const migrator = new CounterMigrator(counter, workEffortsPath);

    const preview = await migrator.previewMigration();
    res.json(preview);
  } catch (error) {
    logger.error({ err: error }, 'Error previewing migration');
    res.status(500).json({ error: error.message });
  }
});

// Run migration
app.post('/api/counter/migrate', async (req, res) => {
  try {
    const { getCounterSystem } = await import('./lib/counter-system/index.js');
    const CounterMigrator = (await import('./lib/counter-system/migrator.js')).default;

    const counter = await getCounterSystem();
    const repoPath = config.repos[0]?.path;

    if (!repoPath) {
      return res.status(400).json({ error: 'No repository configured' });
    }

    const workEffortsPath = path.join(repoPath, '_work_efforts');
    const migrator = new CounterMigrator(counter, workEffortsPath);

    const results = await migrator.migrate();
    res.json(results);
  } catch (error) {
    logger.error({ err: error }, 'Error running migration');
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// WebSocket Server
// ============================================================================

/**
 * HTTP server instance for Express and WebSocket.
 * @type {import('http').Server}
 */
const server = createServer(app);

/**
 * WebSocket server for real-time updates.
 * Broadcasts repository changes to all connected clients.
 * @type {WebSocketServer}
 */
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  logger.info({ clients: clients.size + 1 }, 'Client connected');
  clients.add(ws);

  // Send initial state
  const repos = {};
  for (const [name, state] of repoState) {
    repos[name] = state;
  }
  ws.send(JSON.stringify({ type: 'init', repos }));

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);

      if (message.type === 'refresh') {
        // Client requests refresh of a specific repo
        const repoConfig = config.repos.find(r => r.name === message.repo);
        if (repoConfig) {
          await refreshRepo(message.repo, repoConfig.path);
        }
      }
    } catch (error) {
      logger.error({ err: error }, 'WebSocket message error');
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    logger.info({ clients: clients.size }, 'Client disconnected');
  });

  ws.on('error', (error) => {
    clients.delete(ws);
    logger.error({ err: error }, 'WebSocket error');
  });
});

/**
 * Broadcast a message to all connected WebSocket clients.
 *
 * @param {Object} message - Message object to broadcast
 * @param {string} message.type - Message type (init, update, repo_change, error, hot_reload)
 */
function broadcast(message) {
  const data = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(data);
    }
  }
}

// ============================================================================
// Repository Management
// ============================================================================

/**
 * Initialize a repository for monitoring.
 * Parses initial state and starts file watching.
 *
 * @param {string} name - Display name for the repository
 * @param {string} repoPath - Absolute path to repository root
 * @returns {Promise<void>}
 */
async function initRepo(name, repoPath) {
  logger.info({ repo: name, path: repoPath }, 'Initializing repository');

  // Parse initial state
  const result = await parseRepo(repoPath);
  const stats = getRepoStats(result.workEfforts);

  repoState.set(name, {
    workEfforts: result.workEfforts,
    stats,
    error: result.error || null,
    lastUpdated: new Date().toISOString()
  });

  // Start watching
  watcher.watch(name, repoPath);
}

/**
 * Refresh repository state and broadcast updates.
 * Called when file changes are detected.
 *
 * @param {string} name - Repository display name
 * @param {string} repoPath - Absolute path to repository root
 * @returns {Promise<void>}
 */
async function refreshRepo(name, repoPath) {
  logger.debug({ repo: name }, 'Refreshing repository');

  const result = await parseRepo(repoPath);
  const stats = getRepoStats(result.workEfforts);

  repoState.set(name, {
    workEfforts: result.workEfforts,
    stats,
    error: result.error || null,
    lastUpdated: new Date().toISOString()
  });

  broadcast({
    type: 'update',
    repo: name,
    workEfforts: result.workEfforts,
    stats,
    error: result.error || null
  });
}

// ============================================================================
// Watcher Events
// ============================================================================

watcher.on('update', async ({ repo }) => {
  const repoConfig = config.repos.find(r => r.name === repo);
  if (repoConfig) {
    await refreshRepo(repo, repoConfig.path);
  }
});

watcher.on('error', ({ repo, error }) => {
  logger.error({ repo, err: error }, 'Watcher error');
  broadcast({ type: 'error', repo, message: error.message });
});

// ============================================================================
// Startup
// ============================================================================

/**
 * Start the Mission Control server.
 * Initializes all configured repositories, sets up hot reload in dev mode,
 * and finds an available port.
 *
 * @returns {Promise<void>}
 */
async function start() {
  // Initialize all configured repos
  for (const repo of config.repos) {
    await initRepo(repo.name, repo.path);
  }

  // === Hot Reload for Development ===
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    const publicWatcher = chokidar.watch(path.join(__dirname, 'public'), {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 }
    });

    let reloadDebounce = null;
    publicWatcher.on('all', (event, filePath) => {
      if (reloadDebounce) clearTimeout(reloadDebounce);
      reloadDebounce = setTimeout(() => {
        const fileName = path.basename(filePath);
        logger.debug({ event, file: fileName }, 'Hot reload triggered');
        broadcast({ type: 'hot_reload', file: fileName });
      }, 500); // 500ms debounce to batch rapid saves
    });

    logger.info('Hot reload enabled for development');
  }

  // Try to find an available port
  let port = config.port;
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        server.once('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            logger.warn({ port, nextPort: port + 1 }, 'Port in use, trying next');
            port++;
            reject(err);
          } else {
            reject(err);
          }
        });

        server.listen(port, () => {
          resolve();
        });
      });
      break;
    } catch (err) {
      if (attempt === maxAttempts - 1) {
        logger.fatal({ attempts: maxAttempts }, 'Could not find available port');
        process.exit(1);
      }
    }
  }

  // Startup banner with colors
  const c = chalk;
  const dim = c.dim;
  const accent = c.hex('#ff9d3d'); // Fogsift amber
  const url = c.cyan.underline;

  console.log(`
${dim('╔══════════════════════════════════════════════════════════════╗')}
${dim('║')}        ${accent.bold('◈ MISSION CONTROL')}                              ${dim('║')}
${dim('╠══════════════════════════════════════════════════════════════╣')}
${dim('║')}  ${c.white('Dashboard:')} ${url(`http://localhost:${port}`).padEnd(53)}${dim('║')}
${dim('║')}  ${c.white('API:')}       ${url(`http://localhost:${port}/api/repos`).padEnd(53)}${dim('║')}
${dim('║')}  ${c.white('Health:')}    ${url(`http://localhost:${port}/api/health`).padEnd(53)}${dim('║')}
${dim('╠══════════════════════════════════════════════════════════════╣')}
${dim('║')}  ${c.white(`Watching ${c.bold(config.repos.length)} repo(s):`)}                                       ${dim('║')}
${config.repos.map(r => `${dim('║')}    ${accent('•')} ${c.white(r.name.padEnd(54))}${dim('║')}`).join('\n')}
${dim('╚══════════════════════════════════════════════════════════════╝')}
  `);

  logger.info({ port, repos: config.repos.length }, 'Server started');
}

// ============================================================================
// Graceful Shutdown
// ============================================================================

/**
 * Gracefully shutdown the server.
 * Closes all WebSocket connections, file watchers, and HTTP server.
 * Forces exit after 5 second timeout.
 *
 * @param {string} signal - Signal that triggered shutdown (SIGINT, SIGTERM)
 * @returns {Promise<void>}
 */
async function shutdown(signal) {
  logger.info({ signal }, 'Shutting down gracefully');

  // Close WebSocket connections
  for (const client of clients) {
    client.close(1000, 'Server shutting down');
  }
  clients.clear();

  // Close file watchers
  await watcher.close();

  // Close HTTP server
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });

  // Force exit after 5 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 5000);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Start the server
start().catch((error) => {
  logger.fatal({ err: error }, 'Failed to start server');
  process.exit(1);
});

