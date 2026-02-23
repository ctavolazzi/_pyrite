/**
 * Counter System - Core Service
 *
 * Provides centralized sequential numbering for work efforts, tickets, and checkpoints.
 * Maintains persistent state with integrity checking and audit trails.
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { EventEmitter } from 'events';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATE_FILE = path.join(__dirname, 'state.json');

class CounterSystem extends EventEmitter {
  constructor() {
    super();
    this.state = null;
    this.locked = false;
  }

  /**
   * Initialize the counter system
   */
  async initialize() {
    try {
      await this.loadState();
      console.log('[CounterSystem] Initialized successfully');
      this.emit('initialized', this.state);
    } catch (error) {
      console.error('[CounterSystem] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Load state from disk or create new state
   */
  async loadState() {
    try {
      const data = await fs.readFile(STATE_FILE, 'utf8');
      this.state = JSON.parse(data);

      // Verify integrity
      const isValid = await this.verifyIntegrity();
      if (!isValid) {
        console.warn('[CounterSystem] State integrity check failed, creating backup');
        await this.backupState();
        throw new Error('State integrity check failed');
      }

      console.log('[CounterSystem] State loaded successfully');
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('[CounterSystem] No existing state, creating new state');
        await this.createInitialState();
      } else {
        throw error;
      }
    }
  }

  /**
   * Create initial state structure
   */
  async createInitialState() {
    this.state = {
      version: '1.0.0',
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      counters: {
        workEfforts: {
          global: 0,
          byRepo: {}
        },
        tickets: {
          global: 0,
          byWorkEffort: {},
          byRepo: {}
        },
        checkpoints: {
          global: 0
        }
      },
      integrity: {
        checksum: '',
        lastValidation: new Date().toISOString(),
        validationStatus: 'valid'
      },
      audit: []
    };

    this.state.integrity.checksum = this.calculateChecksum();
    await this.saveState();
  }

  /**
   * Get the next number for a counter
   * @param {string} type - Counter type: 'workEffort', 'ticket', or 'checkpoint'
   * @param {object} context - Additional context (repo, parentWE, etc.)
   */
  async getNext(type, context = {}) {
    while (this.locked) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    this.locked = true;

    try {
      let counter;
      const timestamp = new Date().toISOString();

      switch (type) {
        case 'workEffort':
          this.state.counters.workEfforts.global++;
          counter = this.state.counters.workEfforts.global;

          // Track by repo
          if (context.repo) {
            if (!this.state.counters.workEfforts.byRepo[context.repo]) {
              this.state.counters.workEfforts.byRepo[context.repo] = 0;
            }
            this.state.counters.workEfforts.byRepo[context.repo]++;
          }

          this.addAuditEntry({
            timestamp,
            action: 'increment',
            counter: 'workEfforts.global',
            value: counter,
            context
          });
          break;

        case 'ticket':
          this.state.counters.tickets.global++;
          counter = this.state.counters.tickets.global;

          // Track by work effort
          if (context.parentWE) {
            if (!this.state.counters.tickets.byWorkEffort[context.parentWE]) {
              this.state.counters.tickets.byWorkEffort[context.parentWE] = 0;
            }
            this.state.counters.tickets.byWorkEffort[context.parentWE]++;
          }

          // Track by repo
          if (context.repo) {
            if (!this.state.counters.tickets.byRepo[context.repo]) {
              this.state.counters.tickets.byRepo[context.repo] = 0;
            }
            this.state.counters.tickets.byRepo[context.repo]++;
          }

          this.addAuditEntry({
            timestamp,
            action: 'increment',
            counter: 'tickets.global',
            value: counter,
            context
          });
          break;

        case 'checkpoint':
          this.state.counters.checkpoints.global++;
          counter = this.state.counters.checkpoints.global;

          this.addAuditEntry({
            timestamp,
            action: 'increment',
            counter: 'checkpoints.global',
            value: counter,
            context
          });
          break;

        default:
          throw new Error(`Unknown counter type: ${type}`);
      }

      this.state.lastUpdated = timestamp;
      this.state.integrity.checksum = this.calculateChecksum();
      await this.saveState();

      this.emit('counterIncremented', { type, counter, context });

      return counter;
    } finally {
      this.locked = false;
    }
  }

  /**
   * Get current counter values
   */
  getCurrentCounters() {
    return {
      ...this.state.counters,
      lastUpdated: this.state.lastUpdated
    };
  }

  /**
   * Set a counter to a specific value (for migration/repair)
   */
  async setCounter(path, value, reason = 'manual adjustment') {
    while (this.locked) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    this.locked = true;

    try {
      const timestamp = new Date().toISOString();

      // Parse path like 'workEfforts.global' or 'tickets.byWorkEffort.WE-123'
      const parts = path.split('.');
      let target = this.state.counters;

      for (let i = 0; i < parts.length - 1; i++) {
        if (!target[parts[i]]) {
          target[parts[i]] = {};
        }
        target = target[parts[i]];
      }

      const oldValue = target[parts[parts.length - 1]];
      target[parts[parts.length - 1]] = value;

      this.addAuditEntry({
        timestamp,
        action: 'set',
        counter: path,
        oldValue,
        newValue: value,
        reason
      });

      this.state.lastUpdated = timestamp;
      this.state.integrity.checksum = this.calculateChecksum();
      await this.saveState();

      this.emit('counterSet', { path, oldValue, newValue: value });

      return value;
    } finally {
      this.locked = false;
    }
  }

  /**
   * Add an audit log entry
   */
  addAuditEntry(entry) {
    this.state.audit.push(entry);

    // Keep only last 1000 audit entries
    if (this.state.audit.length > 1000) {
      this.state.audit = this.state.audit.slice(-1000);
    }
  }

  /**
   * Calculate checksum of counter data (excluding integrity and audit)
   */
  calculateChecksum() {
    const data = {
      version: this.state.version,
      counters: this.state.counters
    };
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  /**
   * Verify state integrity
   */
  async verifyIntegrity() {
    if (!this.state.integrity.checksum) {
      return true; // New state
    }

    const currentChecksum = this.calculateChecksum();
    const isValid = currentChecksum === this.state.integrity.checksum;

    this.state.integrity.lastValidation = new Date().toISOString();
    this.state.integrity.validationStatus = isValid ? 'valid' : 'invalid';

    if (!isValid) {
      console.error('[CounterSystem] Integrity check failed!');
      console.error('Expected:', this.state.integrity.checksum);
      console.error('Got:', currentChecksum);
    }

    return isValid;
  }

  /**
   * Save state to disk
   */
  async saveState() {
    const data = JSON.stringify(this.state, null, 2);
    await fs.writeFile(STATE_FILE, data, 'utf8');
  }

  /**
   * Backup current state
   */
  async backupState() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(__dirname, `state.backup.${timestamp}.json`);
    const data = JSON.stringify(this.state, null, 2);
    await fs.writeFile(backupFile, data, 'utf8');
    console.log(`[CounterSystem] State backed up to ${backupFile}`);
  }

  /**
   * Get audit log
   */
  getAuditLog(limit = 100) {
    return this.state.audit.slice(-limit).reverse();
  }

  /**
   * Get system statistics
   */
  getStatistics() {
    return {
      version: this.state.version,
      created: this.state.created,
      lastUpdated: this.state.lastUpdated,
      totalWorkEfforts: this.state.counters.workEfforts.global,
      totalTickets: this.state.counters.tickets.global,
      totalCheckpoints: this.state.counters.checkpoints.global,
      repositories: Object.keys(this.state.counters.workEfforts.byRepo).length,
      auditEntries: this.state.audit.length,
      integrity: this.state.integrity
    };
  }
}

// Singleton instance
let instance = null;

/**
 * Get or create the counter system instance
 */
export async function getCounterSystem() {
  if (!instance) {
    instance = new CounterSystem();
    await instance.initialize();
  }
  return instance;
}

export { CounterSystem };
