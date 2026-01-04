#!/usr/bin/env node
/**
 * 🔑 THE KEYMASTER
 *
 * "I am the Keymaster... are you the Gatekeeper?"
 *
 * Manages all locks, assignments, and access control for work efforts.
 * The single source of truth for "who can do what, when."
 *
 * No agent shall pass... without proper authorization.
 *
 * @module lib/keymaster
 * @version 1.0.0
 */

import fs from 'fs/promises';
import matter from 'gray-matter';
import lockfile from 'proper-lockfile';
import { EventEmitter } from 'events';

/**
 * Lock timeout constants (in milliseconds)
 */
const TIMEOUTS = {
  WRITE_LOCK: 10_000,      // 10 seconds - file system lock for atomic writes
  ASSIGNMENT: 7_200_000,   // 2 hours - AI agent work session
  STALE_LOCK: 30_000,      // 30 seconds - stale lock cleanup
};

/**
 * 🔑 The Keymaster - Guardian of the Locks
 *
 * Controls access to work efforts across multiple AI agents.
 * Prevents collisions, tracks ownership, enforces timeouts.
 *
 * @example
 * const keymaster = new Keymaster({ auditLog: './audit.log' });
 *
 * // AI agent requests to work on a WE
 * const access = await keymaster.requestAccess('WE-260104-auth', 'claude-code');
 * if (access.granted) {
 *   await keymaster.withLock('WE-260104-auth', 'claude-code', async () => {
 *     // Do work...
 *   });
 *   await keymaster.releaseAccess('WE-260104-auth', 'claude-code');
 * }
 */
export class Keymaster extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      workEffortsDir: config.workEffortsDir || '_work_efforts',
      auditLog: config.auditLog || '_work_efforts/.audit/keymaster.jsonl',
      enableStaleCleanup: config.enableStaleCleanup !== false,
      timeouts: { ...TIMEOUTS, ...config.timeouts }
    };

    // Track active locks in memory (for debugging/monitoring)
    this.activeLocks = new Map();

    console.log('🔑 The Keymaster is online...');
  }

  /**
   * Request access to work on a work effort
   *
   * Checks if WE is available or already assigned to this agent.
   * Updates frontmatter with assignment.
   *
   * @param {string} weId - Work effort ID
   * @param {string} agentId - Agent requesting access (e.g., 'claude-code')
   * @param {object} options - Request options
   * @returns {Promise<{granted: boolean, reason?: string, expiresAt?: Date}>}
   */
  async requestAccess(weId, agentId, options = {}) {
    const indexPath = await this._findIndexPath(weId);
    if (!indexPath) {
      return { granted: false, reason: 'Work effort not found' };
    }

    // Use file lock for the check-and-set operation
    const release = await lockfile.lock(indexPath, {
      stale: this.config.timeouts.WRITE_LOCK,
      retries: { retries: 3, minTimeout: 100, maxTimeout: 1000 }
    });

    try {
      // Read current state
      const content = await fs.readFile(indexPath, 'utf-8');
      const { data: frontmatter, content: body } = matter(content);

      // Check if already assigned
      if (frontmatter.assigned_to) {
        const expiresAt = frontmatter.assignment_expires
          ? new Date(frontmatter.assignment_expires)
          : null;

        // Check if assignment is stale
        if (expiresAt && expiresAt < new Date()) {
          // Stale assignment - can reassign
          this._logAudit('access.stale_assignment_claimed', {
            weId,
            previous_agent: frontmatter.assigned_to,
            new_agent: agentId,
            expired_at: expiresAt
          });
        } else if (frontmatter.assigned_to !== agentId) {
          // Active assignment to different agent
          return {
            granted: false,
            reason: `Already assigned to ${frontmatter.assigned_to}`,
            expiresAt
          };
        } else {
          // Already assigned to this agent
          return {
            granted: true,
            reason: 'Already assigned to you',
            expiresAt
          };
        }
      }

      // Grant access - update frontmatter
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.config.timeouts.ASSIGNMENT);

      frontmatter.assigned_to = agentId;
      frontmatter.assigned_at = now.toISOString();
      frontmatter.assignment_expires = expiresAt.toISOString();
      frontmatter.last_modified_by = agentId;
      frontmatter.last_updated = now.toISOString();

      // Write updated frontmatter
      await fs.writeFile(indexPath, matter.stringify(body, frontmatter));

      this._logAudit('access.granted', {
        weId,
        agentId,
        assigned_at: now.toISOString(),
        expires_at: expiresAt.toISOString()
      });

      this.emit('access:granted', { weId, agentId, expiresAt });

      return {
        granted: true,
        expiresAt
      };

    } finally {
      await release();
    }
  }

  /**
   * Release access to a work effort
   *
   * Clears assignment fields from frontmatter.
   *
   * @param {string} weId - Work effort ID
   * @param {string} agentId - Agent releasing access
   * @returns {Promise<boolean>}
   */
  async releaseAccess(weId, agentId) {
    const indexPath = await this._findIndexPath(weId);
    if (!indexPath) return false;

    const release = await lockfile.lock(indexPath, {
      stale: this.config.timeouts.WRITE_LOCK
    });

    try {
      const content = await fs.readFile(indexPath, 'utf-8');
      const { data: frontmatter, content: body } = matter(content);

      // Verify this agent owns the assignment
      if (frontmatter.assigned_to !== agentId) {
        this._logAudit('access.release_denied', {
          weId,
          agentId,
          current_owner: frontmatter.assigned_to,
          reason: 'Not the current owner'
        });
        return false;
      }

      // Clear assignment
      frontmatter.assigned_to = null;
      frontmatter.assigned_at = null;
      frontmatter.assignment_expires = null;
      frontmatter.last_modified_by = agentId;
      frontmatter.last_updated = new Date().toISOString();

      await fs.writeFile(indexPath, matter.stringify(body, frontmatter));

      this._logAudit('access.released', { weId, agentId });
      this.emit('access:released', { weId, agentId });

      return true;

    } finally {
      await release();
    }
  }

  /**
   * Execute a function with exclusive write lock
   *
   * Acquires file-level lock, executes function, releases lock.
   * Ensures atomic read-modify-write operations.
   *
   * @param {string} weId - Work effort ID
   * @param {string} agentId - Agent performing operation
   * @param {Function} fn - Async function to execute with lock
   * @returns {Promise<any>} - Result of fn
   *
   * @example
   * await keymaster.withLock('WE-123', 'claude-code', async () => {
   *   // Modify work effort safely
   *   await updateTicket('TKT-123-001', { status: 'completed' });
   * });
   */
  async withLock(weId, agentId, fn) {
    const indexPath = await this._findIndexPath(weId);
    if (!indexPath) {
      throw new Error(`Work effort ${weId} not found`);
    }

    // Acquire file lock
    const release = await lockfile.lock(indexPath, {
      stale: this.config.timeouts.WRITE_LOCK,
      onCompromised: () => {
        this._logAudit('lock.compromised', { weId, agentId });
        this.emit('lock:compromised', { weId, agentId });
      }
    });

    const lockId = `${weId}:${agentId}:${Date.now()}`;
    this.activeLocks.set(lockId, {
      weId,
      agentId,
      acquired: new Date(),
      path: indexPath
    });

    this._logAudit('lock.acquired', { weId, agentId, lockId });
    this.emit('lock:acquired', { weId, agentId, lockId });

    try {
      // Execute function with lock held
      const result = await fn();
      return result;

    } finally {
      // Always release lock
      await release();
      this.activeLocks.delete(lockId);

      this._logAudit('lock.released', { weId, agentId, lockId });
      this.emit('lock:released', { weId, agentId, lockId });
    }
  }

  /**
   * Check if work effort is locked by any agent
   *
   * @param {string} weId - Work effort ID
   * @returns {Promise<{locked: boolean, by?: string, until?: Date}>}
   */
  async checkLock(weId) {
    const indexPath = await this._findIndexPath(weId);
    if (!indexPath) {
      return { locked: false, reason: 'Work effort not found' };
    }

    const content = await fs.readFile(indexPath, 'utf-8');
    const { data: frontmatter } = matter(content);

    if (frontmatter.assigned_to) {
      const expiresAt = frontmatter.assignment_expires
        ? new Date(frontmatter.assignment_expires)
        : null;

      // Check if stale
      if (expiresAt && expiresAt < new Date()) {
        return { locked: false, reason: 'Assignment expired' };
      }

      return {
        locked: true,
        by: frontmatter.assigned_to,
        until: expiresAt
      };
    }

    return { locked: false };
  }

  /**
   * Force release a stale lock (admin operation)
   *
   * ⚠️ Use with caution - can cause conflicts if agent is still working
   *
   * @param {string} weId - Work effort ID
   * @param {string} reason - Reason for force release
   * @returns {Promise<boolean>}
   */
  async forceRelease(weId, reason = 'Manual override') {
    const indexPath = await this._findIndexPath(weId);
    if (!indexPath) return false;

    const release = await lockfile.lock(indexPath);

    try {
      const content = await fs.readFile(indexPath, 'utf-8');
      const { data: frontmatter, content: body } = matter(content);

      const previousOwner = frontmatter.assigned_to;

      frontmatter.assigned_to = null;
      frontmatter.assigned_at = null;
      frontmatter.assignment_expires = null;

      await fs.writeFile(indexPath, matter.stringify(body, frontmatter));

      this._logAudit('access.force_released', {
        weId,
        previous_owner: previousOwner,
        reason
      });

      this.emit('access:force_released', { weId, previousOwner, reason });

      return true;

    } finally {
      await release();
    }
  }

  /**
   * Get status of all active locks
   *
   * @returns {Array<{weId, agentId, acquired, path}>}
   */
  getActiveLocks() {
    return Array.from(this.activeLocks.values());
  }

  // Private helper methods

  async _findIndexPath(weId) {
    const { workEffortsDir } = this.config;
    const fs = await import('fs/promises');
    const path = await import('path');

    try {
      const entries = await fs.default.readdir(workEffortsDir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (!entry.name.startsWith(weId)) continue;

        const dirPath = path.default.join(workEffortsDir, entry.name);
        const files = await fs.default.readdir(dirPath);
        const indexFile = files.find(f => f.endsWith('_index.md'));

        if (indexFile) {
          return path.default.join(dirPath, indexFile);
        }
      }

      return null;

    } catch (error) {
      console.error(`Keymaster: Error finding index path for ${weId}:`, error);
      return null;
    }
  }

  async _logAudit(action, data) {
    const entry = {
      timestamp: new Date().toISOString(),
      subsystem: 'keymaster',
      action,
      ...data
    };

    // Ensure audit log directory exists
    const logDir = this.config.auditLog.substring(0, this.config.auditLog.lastIndexOf('/'));
    await fs.mkdir(logDir, { recursive: true });

    // Append to audit log
    await fs.appendFile(
      this.config.auditLog,
      JSON.stringify(entry) + '\n'
    );
  }
}

/**
 * 🐰 Follow the White Rabbit...
 *
 * Trace audit trails to see where work efforts have been,
 * who touched them, and what happened.
 *
 * "I'll show you how deep the rabbit hole goes."
 */
export class WhiteRabbit {
  constructor(auditLogPath = '_work_efforts/.audit/keymaster.jsonl') {
    this.auditLogPath = auditLogPath;
  }

  /**
   * Follow the trail for a specific work effort
   *
   * @param {string} weId - Work effort to trace
   * @returns {Promise<Array>} - Audit trail entries
   */
  async follow(weId) {
    try {
      const content = await fs.readFile(this.auditLogPath, 'utf-8');
      const lines = content.trim().split('\n');

      const trail = lines
        .map(line => JSON.parse(line))
        .filter(entry => entry.weId === weId)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      return trail;

    } catch (error) {
      if (error.code === 'ENOENT') {
        return []; // No audit log yet
      }
      throw error;
    }
  }

  /**
   * Follow all trails for an agent
   *
   * @param {string} agentId - Agent to trace
   * @returns {Promise<Array>}
   */
  async followAgent(agentId) {
    try {
      const content = await fs.readFile(this.auditLogPath, 'utf-8');
      const lines = content.trim().split('\n');

      const trail = lines
        .map(line => JSON.parse(line))
        .filter(entry => entry.agentId === agentId)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      return trail;

    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Show the trail (pretty print)
   */
  show(trail) {
    console.log('\n🐰 Following the white rabbit...\n');

    for (const entry of trail) {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      const action = entry.action.padEnd(30);
      console.log(`  [${time}] ${action} ${JSON.stringify(entry, null, 2)}`);
    }

    console.log(`\n  Total entries: ${trail.length}\n`);
  }
}

export default Keymaster;
