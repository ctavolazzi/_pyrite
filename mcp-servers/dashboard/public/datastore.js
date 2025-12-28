/**
 * MISSION CONTROL DATA STORE
 * ==========================
 * Single source of truth for all dashboard data.
 * Simple, secure, traceable.
 *
 * Architecture:
 * - All data flows through this store
 * - Components subscribe to changes
 * - WebSocket updates hydrate the store
 * - No direct DOM manipulation here
 */

class DataStore {
  constructor() {
    // Core state - the trunk
    this.state = {
      repos: {},           // repo name -> { workEfforts, stats, error, lastUpdated }
      selectedRepo: null,
      selectedWorkEffort: null,
      selectedTicket: null,
      connectionStatus: 'disconnected',
      lastSync: null
    };

    // Subscribers - components that react to changes
    this.subscribers = new Map(); // key -> Set of callbacks

    // History for debugging and activity tracking
    this.history = [];
    this.maxHistory = 100;
  }

  // ============================================================================
  // Core Operations - Keep it simple
  // ============================================================================

  get(path) {
    return this._getByPath(this.state, path);
  }

  set(path, value) {
    const oldValue = this.get(path);
    this._setByPath(this.state, path, value);

    // Record history
    this._recordHistory('set', path, oldValue, value);

    // Notify subscribers
    this._notify(path, value, oldValue);

    return value;
  }

  update(path, updater) {
    const current = this.get(path);
    const newValue = typeof updater === 'function' ? updater(current) : updater;
    return this.set(path, newValue);
  }

  // ============================================================================
  // Subscription System - React to changes
  // ============================================================================

  subscribe(path, callback) {
    if (!this.subscribers.has(path)) {
      this.subscribers.set(path, new Set());
    }
    this.subscribers.get(path).add(callback);

    // Return unsubscribe function
    return () => this.subscribers.get(path)?.delete(callback);
  }

  subscribeAll(callback) {
    return this.subscribe('*', callback);
  }

  _notify(path, newValue, oldValue) {
    // Notify exact path subscribers
    this.subscribers.get(path)?.forEach(cb => cb(newValue, oldValue, path));

    // Notify wildcard subscribers
    this.subscribers.get('*')?.forEach(cb => cb(newValue, oldValue, path));

    // Notify parent path subscribers (e.g., 'repos' when 'repos.myrepo' changes)
    const parts = path.split('.');
    for (let i = 1; i < parts.length; i++) {
      const parentPath = parts.slice(0, i).join('.');
      this.subscribers.get(parentPath)?.forEach(cb => cb(this.get(parentPath), null, parentPath));
    }
  }

  // ============================================================================
  // Data Hydration - From WebSocket
  // ============================================================================

  hydrateRepos(repos) {
    Object.entries(repos).forEach(([name, data]) => {
      this.set(`repos.${name}`, {
        ...data,
        lastUpdated: new Date().toISOString()
      });
    });
    this.set('lastSync', new Date().toISOString());
  }

  hydrateRepo(name, data) {
    this.set(`repos.${name}`, {
      ...data,
      lastUpdated: new Date().toISOString()
    });
    this.set('lastSync', new Date().toISOString());
  }

  setConnectionStatus(status) {
    this.set('connectionStatus', status);
  }

  // ============================================================================
  // Computed Data - Derived from core state
  // ============================================================================

  getRepoNames() {
    return Object.keys(this.state.repos);
  }

  getRepo(name) {
    return this.state.repos[name] || null;
  }

  getAllWorkEfforts() {
    const all = [];
    Object.entries(this.state.repos).forEach(([repoName, repo]) => {
      (repo.workEfforts || []).forEach(we => {
        all.push({ ...we, repoName });
      });
    });
    return all;
  }

  getWorkEffort(repoName, weId) {
    const repo = this.getRepo(repoName);
    return repo?.workEfforts?.find(we => we.id === weId) || null;
  }

  getTicket(repoName, weId, ticketId) {
    const we = this.getWorkEffort(repoName, weId);
    return we?.tickets?.find(t => t.id === ticketId) || null;
  }

  // ============================================================================
  // Statistics - The graphs love these
  // ============================================================================

  getGlobalStats() {
    const repos = Object.values(this.state.repos);
    const allWEs = this.getAllWorkEfforts();
    const allTickets = allWEs.flatMap(we => we.tickets || []);

    return {
      repoCount: repos.length,
      workEffortCount: allWEs.length,
      ticketCount: allTickets.length,
      activeCount: allWEs.filter(we => we.status === 'active').length,
      completedCount: allWEs.filter(we => we.status === 'completed').length,
      ticketsByStatus: this._countByStatus(allTickets),
      workEffortsByStatus: this._countByStatus(allWEs),
      recentActivity: this._getRecentActivity(allWEs)
    };
  }

  getWorkEffortStats(repoName, weId) {
    const we = this.getWorkEffort(repoName, weId);
    if (!we) return null;

    const tickets = we.tickets || [];
    const completed = tickets.filter(t => t.status === 'completed').length;
    const total = tickets.length;

    return {
      ticketCount: total,
      completedCount: completed,
      pendingCount: tickets.filter(t => t.status === 'pending').length,
      inProgressCount: tickets.filter(t => t.status === 'in_progress').length,
      blockedCount: tickets.filter(t => t.status === 'blocked').length,
      progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
      ticketsByStatus: this._countByStatus(tickets),
      velocity: this._calculateVelocity(tickets),
      estimatedCompletion: this._estimateCompletion(we, tickets),
      timeline: this._buildTimeline(we, tickets)
    };
  }

  _countByStatus(items) {
    return items.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});
  }

  _calculateVelocity(tickets) {
    // Simple velocity: completed tickets per day
    const completed = tickets.filter(t => t.status === 'completed' && t.completedAt);
    if (completed.length < 2) return null;

    const dates = completed.map(t => new Date(t.completedAt)).sort((a, b) => a - b);
    const daySpan = (dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24);

    return daySpan > 0 ? (completed.length / daySpan).toFixed(2) : null;
  }

  _estimateCompletion(we, tickets) {
    const remaining = tickets.filter(t => t.status !== 'completed').length;
    const velocity = this._calculateVelocity(tickets);

    if (!velocity || velocity <= 0 || remaining === 0) return null;

    const daysRemaining = Math.ceil(remaining / velocity);
    const estimated = new Date();
    estimated.setDate(estimated.getDate() + daysRemaining);

    return estimated.toISOString();
  }

  _buildTimeline(we, tickets) {
    const events = [];

    if (we.created) {
      events.push({ type: 'created', date: we.created, label: 'Work effort created' });
    }

    tickets.forEach(ticket => {
      if (ticket.created) {
        events.push({ type: 'ticket_added', date: ticket.created, label: `Ticket: ${ticket.title}` });
      }
    });

    return events.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  _getRecentActivity(workEfforts) {
    const activities = [];

    workEfforts.forEach(we => {
      if (we.created) {
        activities.push({ type: 'we_created', date: we.created, we });
      }
      (we.tickets || []).forEach(ticket => {
        if (ticket.created) {
          activities.push({ type: 'ticket_created', date: ticket.created, we, ticket });
        }
      });
    });

    return activities
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 20);
  }

  // ============================================================================
  // History & Debugging
  // ============================================================================

  _recordHistory(action, path, oldValue, newValue) {
    this.history.push({
      action,
      path,
      oldValue,
      newValue,
      timestamp: Date.now()
    });

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  getHistory() {
    return [...this.history];
  }

  // ============================================================================
  // Path Utilities
  // ============================================================================

  _getByPath(obj, path) {
    if (!path) return obj;
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
  }

  _setByPath(obj, path, value) {
    const parts = path.split('.');
    const last = parts.pop();
    const target = parts.reduce((acc, key) => {
      if (acc[key] === undefined) acc[key] = {};
      return acc[key];
    }, obj);
    target[last] = value;
  }

  // ============================================================================
  // Serialization
  // ============================================================================

  toJSON() {
    return JSON.stringify(this.state, null, 2);
  }

  fromJSON(json) {
    try {
      this.state = JSON.parse(json);
      this._notify('*', this.state, null);
    } catch (e) {
      console.error('Failed to parse state JSON:', e);
    }
  }
}

// Export singleton
window.DataStore = DataStore;
window.dataStore = new DataStore();

