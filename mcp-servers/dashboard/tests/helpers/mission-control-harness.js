/**
 * @fileoverview MissionControl Test Harness
 *
 * Minimal MissionControl implementation for testing state management logic.
 * Extracts only the state management and event emission logic, without UI rendering.
 *
 * @example
 * ```javascript
 * import { MissionControlHarness } from './helpers/mission-control-harness.js';
 *
 * const harness = new MissionControlHarness();
 *
 * harness.handleMessage({
 *   type: 'init',
 *   repos: { '_pyrite': { workEfforts: [], stats: {} } }
 * });
 *
 * const events = harness.eventBus.getEventsByType('system:connected');
 * assert.strictEqual(events.length, 1);
 * ```
 */

import { MockEventBus } from './mock-event-bus.js';

/**
 * Test harness for MissionControl state management
 *
 * Provides:
 * - State management (repos object)
 * - WebSocket message handling
 * - Change detection and event emission
 * - EventBus integration
 */
export class MissionControlHarness {
  constructor() {
    /** @type {Object<string, any>} */
    this.repos = {};

    /** @type {MockEventBus} */
    this.eventBus = new MockEventBus();
  }

  /**
   * Handle WebSocket message and update state
   * Extracted from MissionControl.handleMessage()
   *
   * @param {Object} message - WebSocket message
   * @param {string} message.type - Message type ('init', 'update', 'repo_change', 'error')
   * @param {string} [message.repo] - Repository name
   * @param {Object} [message.repos] - Repository data
   * @param {Array} [message.workEfforts] - Work efforts array
   * @param {Object} [message.stats] - Repository statistics
   * @param {string} [message.error] - Error message
   * @param {string} [message.action] - Action type ('added', 'removed')
   */
  handleMessage(message) {
    switch (message.type) {
      case 'init':
        this.repos = message.repos;
        this.eventBus.emit('system:connected', {
          repoCount: Object.keys(message.repos).length
        });
        break;

      case 'update':
        const prevState = this.repos[message.repo];
        this.repos[message.repo] = {
          workEfforts: message.workEfforts,
          stats: message.stats,
          error: message.error,
          lastUpdated: new Date().toISOString()
        };
        this.detectAndEmitChanges(message.repo, prevState, this.repos[message.repo]);
        break;

      case 'repo_change':
        if (message.action === 'added' && message.repos) {
          for (const repo of message.repos) {
            this.eventBus.emit('repo:added', { name: repo.name, path: repo.path });
          }
        }
        if (message.action === 'removed') {
          delete this.repos[message.repo];
          this.eventBus.emit('repo:removed', { name: message.repo });
        }
        break;

      case 'error':
        this.eventBus.emit('system:error', {
          repo: message.repo,
          message: message.message
        });
        break;
    }
  }

  /**
   * Detect changes and emit appropriate events
   * Extracted from MissionControl.detectAndEmitChanges()
   *
   * @param {string} repoName - Repository name
   * @param {Object|null} prevState - Previous state
   * @param {Object} newState - New state
   */
  detectAndEmitChanges(repoName, prevState, newState) {
    // Detect new work efforts
    const prevWEs = new Set((prevState?.workEfforts || []).map(we => we.id));
    const newWEs = (newState?.workEfforts || []).filter(we => !prevWEs.has(we.id));

    for (const we of newWEs) {
      this.eventBus.emit('workeffort:created', {
        id: we.id,
        title: we.title,
        status: we.status,
        repo: repoName,
        we: we,
      });
    }

    // Detect status changes
    const prevWEMap = new Map((prevState?.workEfforts || []).map(we => [we.id, we]));
    for (const we of newState?.workEfforts || []) {
      const prev = prevWEMap.get(we.id);
      if (prev && prev.status !== we.status) {
        // Determine specific event type
        const eventType = we.status === 'completed' ? 'workeffort:completed'
          : we.status === 'active' || we.status === 'in_progress' ? 'workeffort:started'
          : we.status === 'paused' ? 'workeffort:paused'
          : 'workeffort:updated';

        this.eventBus.emit(eventType, {
          id: we.id,
          title: we.title,
          prevStatus: prev.status,
          newStatus: we.status,
          repo: repoName,
          we: we,
        });
      }
    }

    // Detect new tickets
    const prevTickets = new Set();
    (prevState?.workEfforts || []).forEach(we => {
      (we.tickets || []).forEach(t => prevTickets.add(t.id));
    });

    for (const we of newState?.workEfforts || []) {
      for (const ticket of we.tickets || []) {
        if (!prevTickets.has(ticket.id)) {
          this.eventBus.emit('ticket:created', {
            id: ticket.id,
            title: ticket.title,
            status: ticket.status,
            workEffortId: we.id,
            repo: repoName,
            ticket: ticket,
          });
        } else {
          // Check for ticket status changes
          const prevWE = prevWEMap.get(we.id);
          if (prevWE) {
            const prevTicket = (prevWE.tickets || []).find(t => t.id === ticket.id);
            if (prevTicket && prevTicket.status !== ticket.status) {
              const ticketEventType = ticket.status === 'completed' ? 'ticket:completed'
                : ticket.status === 'blocked' ? 'ticket:blocked'
                : 'ticket:updated';

              this.eventBus.emit(ticketEventType, {
                id: ticket.id,
                title: ticket.title,
                prevStatus: prevTicket.status,
                newStatus: ticket.status,
                workEffortId: we.id,
                repo: repoName,
                ticket: ticket,
              });
            }
          }
        }
      }
    }
  }

  /**
   * Reset harness state
   */
  reset() {
    this.repos = {};
    this.eventBus.clear();
  }

  /**
   * Get current state for a repository
   * @param {string} repoName - Repository name
   * @returns {Object|undefined}
   */
  getRepoState(repoName) {
    return this.repos[repoName];
  }

  /**
   * Get all repositories
   * @returns {Object}
   */
  getAllRepos() {
    return { ...this.repos };
  }
}

