#!/usr/bin/env node
import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import chokidar from 'chokidar';
import { parseRepo, getRepoStats } from './lib/parser.js';
import { DebouncedWatcher } from './lib/watcher.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================================
// Configuration
// ============================================================================

async function loadConfig() {
  const configPath = path.join(__dirname, 'config.json');
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to load config.json:', error.message);
    return {
      port: 3847,
      repos: [],
      debounceMs: 300
    };
  }
}

async function saveConfig(config) {
  const configPath = path.join(__dirname, 'config.json');
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
}

// ============================================================================
// State
// ============================================================================

let config = await loadConfig();
const repoState = new Map(); // repo name -> { workEfforts, stats, error }
const watcher = new DebouncedWatcher(config.debounceMs);
const clients = new Set(); // WebSocket clients

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
    console.error('Error updating status:', error);
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
    console.error('Browse error:', error);
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
// WebSocket Server
// ============================================================================

const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');
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
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

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

async function initRepo(name, repoPath) {
  console.log(`Initializing repo: ${name} at ${repoPath}`);

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

async function refreshRepo(name, repoPath) {
  console.log(`Refreshing repo: ${name}`);

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
  console.error(`Watcher error for ${repo}:`, error);
  broadcast({ type: 'error', repo, message: error.message });
});

// ============================================================================
// Startup
// ============================================================================

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
        console.log(`🔥 [Hot Reload] ${event}: ${fileName}`);
        broadcast({ type: 'hot_reload', file: fileName });
      }, 500); // 500ms debounce to batch rapid saves
    });

    console.log('🔥 Hot reload enabled for development');
  }

  // Try to find an available port
  let port = config.port;
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        server.once('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} in use, trying ${port + 1}...`);
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
        console.error(`Could not find available port after ${maxAttempts} attempts`);
        process.exit(1);
      }
    }
  }

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    MISSION CONTROL                           ║
║══════════════════════════════════════════════════════════════║
║  Dashboard: http://localhost:${port}                           ║
║  API:       http://localhost:${port}/api/repos                 ║
║  Health:    http://localhost:${port}/api/health                ║
╠══════════════════════════════════════════════════════════════╣
║  Watching ${config.repos.length} repo(s):                                         ║
${config.repos.map(r => `║    • ${r.name.padEnd(54)}║`).join('\n')}
╚══════════════════════════════════════════════════════════════╝
  `);
}

// ============================================================================
// Graceful Shutdown
// ============================================================================

async function shutdown(signal) {
  console.log(`\nReceived ${signal}, shutting down gracefully...`);

  // Close WebSocket connections
  for (const client of clients) {
    client.close(1000, 'Server shutting down');
  }
  clients.clear();

  // Close file watchers
  await watcher.close();

  // Close HTTP server
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force exit after 5 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 5000);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Start the server
start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

