import chokidar from 'chokidar';
import path from 'path';
import { EventEmitter } from 'events';
import logger from './logger.js';

/**
 * Debounced file watcher for work efforts directories
 * Batches rapid file changes and emits single update events
 */
export class DebouncedWatcher extends EventEmitter {
  constructor(debounceMs = 500) {
    super();
    this.debounceMs = debounceMs;
    this.watchers = new Map(); // repo name -> chokidar watcher
    this.pendingUpdates = new Map(); // repo name -> timeout ID
    this.lastEmit = new Map(); // repo name -> timestamp (throttle)
    this.minEmitInterval = 2000; // Min 2 seconds between emits per repo
  }

  /**
   * Start watching a repository's _work_efforts folder
   */
  watch(repoName, repoPath) {
    const workEffortsPath = path.join(repoPath, '_work_efforts');

    if (this.watchers.has(repoName)) {
      logger.debug({ repo: repoName }, 'Already watching');
      return;
    }

    const watcher = chokidar.watch(workEffortsPath, {
      persistent: true,
      ignoreInitial: true,
      depth: 10, // Deep enough for JD nested structure
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50
      }
    });

    watcher.on('add', (filePath) => this.scheduleUpdate(repoName, 'add', filePath));
    watcher.on('change', (filePath) => this.scheduleUpdate(repoName, 'change', filePath));
    watcher.on('unlink', (filePath) => this.scheduleUpdate(repoName, 'unlink', filePath));
    watcher.on('addDir', (dirPath) => this.scheduleUpdate(repoName, 'addDir', dirPath));
    watcher.on('unlinkDir', (dirPath) => this.scheduleUpdate(repoName, 'unlinkDir', dirPath));

    watcher.on('error', (error) => {
      logger.error({ repo: repoName, err: error }, 'Watcher error');
      this.emit('error', { repo: repoName, error });
    });

    watcher.on('ready', () => {
      logger.info({ repo: repoName, path: workEffortsPath }, 'Watcher ready');
      this.emit('ready', { repo: repoName });
    });

    this.watchers.set(repoName, watcher);
  }

  /**
   * Schedule a debounced + throttled update for a repository
   */
  scheduleUpdate(repoName, event, filePath) {
    // Clear any pending update
    if (this.pendingUpdates.has(repoName)) {
      clearTimeout(this.pendingUpdates.get(repoName));
    }

    // Schedule new update with debounce
    const timeoutId = setTimeout(() => {
      this.pendingUpdates.delete(repoName);

      // Throttle: check if we emitted too recently
      const lastEmitTime = this.lastEmit.get(repoName) || 0;
      const now = Date.now();

      if (now - lastEmitTime < this.minEmitInterval) {
        // Too soon - schedule for later
        const delay = this.minEmitInterval - (now - lastEmitTime);
        setTimeout(() => {
          this.lastEmit.set(repoName, Date.now());
          this.emit('update', { repo: repoName, event, path: filePath });
        }, delay);
      } else {
        // OK to emit now
        this.lastEmit.set(repoName, now);
        this.emit('update', { repo: repoName, event, path: filePath });
      }
    }, this.debounceMs);

    this.pendingUpdates.set(repoName, timeoutId);
  }

  /**
   * Stop watching a repository
   */
  async unwatch(repoName) {
    const watcher = this.watchers.get(repoName);
    if (watcher) {
      await watcher.close();
      this.watchers.delete(repoName);

      // Clear pending update
      if (this.pendingUpdates.has(repoName)) {
        clearTimeout(this.pendingUpdates.get(repoName));
        this.pendingUpdates.delete(repoName);
      }

      logger.info({ repo: repoName }, 'Stopped watching');
    }
  }

  /**
   * Stop all watchers and clean up
   */
  async close() {
    // Clear all pending updates
    for (const [repoName, timeoutId] of this.pendingUpdates) {
      clearTimeout(timeoutId);
    }
    this.pendingUpdates.clear();

    // Close all watchers
    const closePromises = [];
    for (const [repoName, watcher] of this.watchers) {
      closePromises.push(watcher.close());
    }
    await Promise.all(closePromises);
    this.watchers.clear();

    logger.info('All watchers closed');
  }

  /**
   * Get list of watched repositories
   */
  getWatchedRepos() {
    return Array.from(this.watchers.keys());
  }
}

