// ============================================================================
// Seed Architecture Pattern - Working Example
// ============================================================================
// This file demonstrates the seed architecture pattern in a single,
// runnable example. In production, each section would be its own file.

// ============================================================================
// LAYER 1: KERNEL (Pure logic, no dependencies)
// ============================================================================

const CONFIG = {
  WS_RECONNECT_BASE_DELAY: 1000,
  WS_RECONNECT_MAX_DELAY: 30000,
  IDLE_THRESHOLD: 30000
};

const STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  COMPLETED: 'completed',
  PAUSED: 'paused',
  BLOCKED: 'blocked'
};

const EVENTS = {
  WE_UPDATED: 'work-effort:updated',
  WE_CREATED: 'work-effort:created',
  TICKET_UPDATED: 'ticket:updated',
  CONNECTION_STATE: 'connection:state-changed'
};

const Utils = {
  formatDuration(ms) {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  },

  humanizeDate(date) {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  },

  timeAgo(date) {
    const ms = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  }
};

// ============================================================================
// LAYER 2: ROOTS (Data layer, depends only on kernel)
// ============================================================================

class RepositoryManager {
  constructor() {
    this.repos = {}; // { name: RepoState }
  }

  addRepo(name, path) {
    this.repos[name] = {
      name,
      path,
      workEfforts: [],
      tickets: [],
      lastUpdate: Date.now()
    };
    console.log(`[RepositoryManager] Added repo: ${name}`);
  }

  getRepo(name) {
    return this.repos[name];
  }

  getAllRepos() {
    return Object.values(this.repos);
  }

  updateWorkEffort(repoName, workEffort) {
    const repo = this.repos[repoName];
    if (!repo) {
      console.warn(`[RepositoryManager] Repo not found: ${repoName}`);
      return;
    }

    const idx = repo.workEfforts.findIndex(we => we.id === workEffort.id);
    if (idx === -1) {
      repo.workEfforts.push(workEffort);
      console.log(`[RepositoryManager] Added work effort: ${workEffort.id}`);
    } else {
      repo.workEfforts[idx] = workEffort;
      console.log(`[RepositoryManager] Updated work effort: ${workEffort.id}`);
    }
    repo.lastUpdate = Date.now();
  }

  getWorkEffort(id) {
    for (const repo of Object.values(this.repos)) {
      const we = repo.workEfforts.find(we => we.id === id);
      if (we) return we;
    }
    return null;
  }

  getAllWorkEfforts() {
    return Object.values(this.repos).flatMap(repo => repo.workEfforts);
  }

  getStats() {
    const allWEs = this.getAllWorkEfforts();
    return {
      total: allWEs.length,
      active: allWEs.filter(we => we.status === STATUS.ACTIVE).length,
      pending: allWEs.filter(we => we.status === STATUS.PENDING).length,
      completed: allWEs.filter(we => we.status === STATUS.COMPLETED).length,
      paused: allWEs.filter(we => we.status === STATUS.PAUSED).length,
      blocked: allWEs.filter(we => we.status === STATUS.BLOCKED).length
    };
  }
}

class StateManager {
  constructor() {
    this.state = {
      currentFilter: 'all',
      searchQuery: '',
      selectedItem: null,
      activityState: 'active',
      isWindowFocused: true,
      isConnected: false
    };
    this.listeners = [];
  }

  setState(updates) {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...updates };
    console.log('[StateManager] State updated:', updates);
    this.notify(oldState);
  }

  getState() {
    return this.state;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify(oldState) {
    this.listeners.forEach(listener => listener(this.state, oldState));
  }
}

// ============================================================================
// LAYER 3: STEM (Transport layer, depends on kernel + roots)
// ============================================================================

class MockWebSocketTransport {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.connected = false;
    this.reconnectAttempts = 0;
  }

  connect() {
    console.log('[WebSocket] Connecting...');
    // Simulate connection
    setTimeout(() => {
      this.connected = true;
      console.log('[WebSocket] Connected');
      this.eventBus.emit(EVENTS.CONNECTION_STATE, { connected: true });

      // Simulate some updates
      this.simulateUpdates();
    }, 500);
  }

  simulateUpdates() {
    // Simulate work effort updates every 5 seconds
    setInterval(() => {
      if (this.connected) {
        this.eventBus.emit(EVENTS.WE_UPDATED, {
          repo: '_pyrite',
          id: 'WE-260101-demo',
          title: 'Demo Work Effort',
          status: STATUS.ACTIVE,
          created: new Date(Date.now() - 7200000).toISOString(), // 2h ago
          updated: new Date().toISOString(),
          tickets: []
        });
      }
    }, 5000);
  }

  send(message) {
    if (this.connected) {
      console.log('[WebSocket] Sending:', message);
    } else {
      console.warn('[WebSocket] Cannot send, not connected');
    }
  }

  disconnect() {
    this.connected = false;
    console.log('[WebSocket] Disconnected');
    this.eventBus.emit(EVENTS.CONNECTION_STATE, { connected: false });
  }
}

class MockAPIClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  async get(endpoint) {
    console.log(`[API] GET ${endpoint}`);
    await this.delay(100);
    return { success: true, data: {} };
  }

  async post(endpoint, body) {
    console.log(`[API] POST ${endpoint}`, body);
    await this.delay(100);
    return { success: true, data: body };
  }

  async put(endpoint, body) {
    console.log(`[API] PUT ${endpoint}`, body);
    await this.delay(100);
    return { success: true, data: body };
  }

  async delete(endpoint) {
    console.log(`[API] DELETE ${endpoint}`);
    await this.delay(100);
    return { success: true };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// LAYER 4: LEAVES (UI layer, depends on kernel + roots + stem)
// ============================================================================

class DashboardView {
  constructor(repoManager, stateManager) {
    this.repoManager = repoManager;
    this.stateManager = stateManager;
  }

  render() {
    console.log('\n========================================');
    console.log('📊 DASHBOARD VIEW');
    console.log('========================================');

    this.renderStats();
    this.renderQueue();

    console.log('========================================\n');
  }

  renderStats() {
    const stats = this.repoManager.getStats();

    console.log('\n📈 Statistics:');
    console.log(`   Total: ${stats.total}`);
    console.log(`   Active: ${stats.active}`);
    console.log(`   Pending: ${stats.pending}`);
    console.log(`   Completed: ${stats.completed}`);
    console.log(`   Paused: ${stats.paused}`);
    console.log(`   Blocked: ${stats.blocked}`);
  }

  renderQueue() {
    const { currentFilter } = this.stateManager.getState();
    const allWEs = this.repoManager.getAllWorkEfforts();

    const filtered = currentFilter === 'all'
      ? allWEs
      : allWEs.filter(we => we.status === currentFilter);

    console.log(`\n📋 Work Queue (filter: ${currentFilter}):`);

    if (filtered.length === 0) {
      console.log('   (empty)');
    } else {
      filtered.forEach(we => {
        const time = Utils.timeAgo(we.updated);
        console.log(`   [${we.status}] ${we.id}: ${we.title} (${time})`);
      });
    }
  }
}

class DetailView {
  constructor(repoManager, stateManager, apiClient) {
    this.repoManager = repoManager;
    this.stateManager = stateManager;
    this.apiClient = apiClient;
  }

  async render(workEffortId) {
    const we = this.repoManager.getWorkEffort(workEffortId);

    if (!we) {
      console.log(`\n❌ Work effort not found: ${workEffortId}`);
      return;
    }

    console.log('\n========================================');
    console.log('📄 DETAIL VIEW');
    console.log('========================================');
    console.log(`\nID: ${we.id}`);
    console.log(`Title: ${we.title}`);
    console.log(`Status: ${we.status}`);
    console.log(`Created: ${Utils.humanizeDate(we.created)}`);
    console.log(`Updated: ${Utils.humanizeDate(we.updated)}`);
    console.log(`Duration: ${Utils.formatDuration(Date.now() - new Date(we.created).getTime())}`);

    console.log('\n📝 Tickets:');
    if (!we.tickets || we.tickets.length === 0) {
      console.log('   (none)');
    } else {
      we.tickets.forEach(ticket => {
        console.log(`   [${ticket.status}] ${ticket.id}: ${ticket.title}`);
      });
    }

    console.log('========================================\n');
  }

  async updateStatus(workEffortId, newStatus) {
    console.log(`\n🔄 Updating ${workEffortId} status to: ${newStatus}`);
    try {
      await this.apiClient.put(`/api/work-efforts/${workEffortId}/status`, {
        status: newStatus
      });
      console.log('✅ Status updated successfully');
    } catch (error) {
      console.error('❌ Failed to update status:', error);
    }
  }
}

class Sidebar {
  constructor(repoManager, stateManager) {
    this.repoManager = repoManager;
    this.stateManager = stateManager;
  }

  render() {
    const repos = this.repoManager.getAllRepos();

    console.log('\n📂 Repository Tree:');
    repos.forEach(repo => {
      console.log(`\n   📁 ${repo.name} (${repo.path})`);
      repo.workEfforts.forEach(we => {
        console.log(`      ├─ [${we.status}] ${we.id}`);
      });
    });
  }
}

// ============================================================================
// DEPENDENCY INJECTION CONTAINER
// ============================================================================

class Container {
  constructor() {
    this.services = {};
    this.build();
  }

  build() {
    // Layer 2: Roots
    this.services.repoManager = new RepositoryManager();
    this.services.stateManager = new StateManager();

    // Layer 3: Stem (using mock event bus)
    this.services.eventBus = this.createEventBus();
    this.services.wsTransport = new MockWebSocketTransport(this.services.eventBus);
    this.services.apiClient = new MockAPIClient();

    // Layer 4: Leaves
    this.services.dashboardView = new DashboardView(
      this.services.repoManager,
      this.services.stateManager
    );
    this.services.detailView = new DetailView(
      this.services.repoManager,
      this.services.stateManager,
      this.services.apiClient
    );
    this.services.sidebar = new Sidebar(
      this.services.repoManager,
      this.services.stateManager
    );
  }

  createEventBus() {
    // Simple event bus implementation
    const listeners = {};
    return {
      on(event, callback) {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(callback);
      },
      emit(event, data) {
        if (!listeners[event]) return;
        listeners[event].forEach(cb => cb(data));
      }
    };
  }

  get(name) {
    if (!this.services[name]) {
      throw new Error(`Service not found: ${name}`);
    }
    return this.services[name];
  }
}

// ============================================================================
// APPLICATION BOOTSTRAP
// ============================================================================

class MissionControl {
  constructor() {
    console.log('🌱 Mission Control - Seed Architecture Demo');
    console.log('============================================\n');

    this.container = new Container();

    // Get services from container
    this.repoManager = this.container.get('repoManager');
    this.stateManager = this.container.get('stateManager');
    this.wsTransport = this.container.get('wsTransport');
    this.eventBus = this.container.get('eventBus');
    this.dashboardView = this.container.get('dashboardView');
    this.detailView = this.container.get('detailView');
    this.sidebar = this.container.get('sidebar');

    this.init();
  }

  init() {
    console.log('⚙️  Initializing...\n');

    // Set up event listeners
    this.bindStateChanges();
    this.bindWebSocketEvents();

    // Add sample data
    this.seedData();

    // Connect to WebSocket
    this.wsTransport.connect();

    // Initial render
    setTimeout(() => {
      this.render();
      this.demo();
    }, 1000);
  }

  seedData() {
    console.log('📦 Seeding sample data...\n');

    // Add a repository
    this.repoManager.addRepo('_pyrite', '/home/user/_pyrite');

    // Add some work efforts
    this.repoManager.updateWorkEffort('_pyrite', {
      id: 'WE-260101-abc1',
      title: 'Seed Architecture Implementation',
      status: STATUS.ACTIVE,
      created: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      updated: new Date().toISOString(),
      tickets: [
        { id: 'TKT-abc1-001', title: 'Extract kernel', status: STATUS.COMPLETED },
        { id: 'TKT-abc1-002', title: 'Create roots', status: STATUS.ACTIVE },
        { id: 'TKT-abc1-003', title: 'Create stem', status: STATUS.PENDING }
      ]
    });

    this.repoManager.updateWorkEffort('_pyrite', {
      id: 'WE-260101-xyz2',
      title: 'CSS Migration',
      status: STATUS.PENDING,
      created: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      updated: new Date().toISOString(),
      tickets: []
    });

    this.repoManager.updateWorkEffort('_pyrite', {
      id: 'WE-251227-old1',
      title: 'Completed Feature',
      status: STATUS.COMPLETED,
      created: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
      updated: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      tickets: []
    });
  }

  bindStateChanges() {
    this.stateManager.subscribe((state, oldState) => {
      if (state.selectedItem !== oldState.selectedItem) {
        this.render();
      }
      if (state.currentFilter !== oldState.currentFilter) {
        this.dashboardView.render();
      }
      if (state.isConnected !== oldState.isConnected) {
        console.log(`\n🔌 Connection state: ${state.isConnected ? 'CONNECTED' : 'DISCONNECTED'}\n`);
      }
    });
  }

  bindWebSocketEvents() {
    this.eventBus.on(EVENTS.WE_UPDATED, (workEffort) => {
      console.log(`\n📡 WebSocket: Work effort updated: ${workEffort.id}`);
      this.repoManager.updateWorkEffort(workEffort.repo, workEffort);
      this.render();
    });

    this.eventBus.on(EVENTS.WE_CREATED, (workEffort) => {
      console.log(`\n📡 WebSocket: Work effort created: ${workEffort.id}`);
      this.repoManager.updateWorkEffort(workEffort.repo, workEffort);
      this.render();
    });

    this.eventBus.on(EVENTS.CONNECTION_STATE, ({ connected }) => {
      this.stateManager.setState({ isConnected: connected });
    });
  }

  render() {
    const { selectedItem } = this.stateManager.getState();

    if (selectedItem) {
      this.detailView.render(selectedItem);
    } else {
      this.sidebar.render();
      this.dashboardView.render();
    }
  }

  async demo() {
    console.log('\n🎬 Running interactive demo...\n');

    await this.delay(2000);
    console.log('▶️  Changing filter to "active"...');
    this.stateManager.setState({ currentFilter: STATUS.ACTIVE });

    await this.delay(2000);
    console.log('▶️  Selecting work effort for detail view...');
    this.stateManager.setState({ selectedItem: 'WE-260101-abc1' });

    await this.delay(2000);
    console.log('▶️  Updating work effort status...');
    await this.detailView.updateStatus('WE-260101-abc1', STATUS.COMPLETED);

    await this.delay(2000);
    console.log('▶️  Returning to dashboard...');
    this.stateManager.setState({ selectedItem: null, currentFilter: 'all' });

    await this.delay(2000);
    console.log('\n✅ Demo complete!\n');
    console.log('This example demonstrates:');
    console.log('  ✓ Clear layer separation (kernel → roots → stem → leaves)');
    console.log('  ✓ Dependency injection container');
    console.log('  ✓ State management with subscriptions');
    console.log('  ✓ Event-based communication');
    console.log('  ✓ UI rendering based on state');
    console.log('  ✓ API interactions');
    console.log('\n🌱 Seed architecture makes code maintainable and AI-friendly!\n');

    // Clean up
    setTimeout(() => {
      this.wsTransport.disconnect();
      console.log('👋 Goodbye!\n');
    }, 2000);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// RUN THE EXAMPLE
// ============================================================================

// Check if running in Node.js
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  const app = new MissionControl();
} else {
  // Browser environment
  console.log('Run this example with: node lib/seed-architecture-example.js');
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CONFIG,
    STATUS,
    EVENTS,
    Utils,
    RepositoryManager,
    StateManager,
    MockWebSocketTransport,
    MockAPIClient,
    DashboardView,
    DetailView,
    Sidebar,
    Container,
    MissionControl
  };
}
