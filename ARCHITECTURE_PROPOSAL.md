# Seed Architecture Pattern: A Blueprint for AI-Friendly Codebases

**Status:** Proposed for v0.8.0
**Created:** 2026-01-01
**Author:** Claude Code AI

---

## Problem Statement

Current codebase has a **3,038-line monolithic class** that handles everything:

- WebSocket communication
- State management
- UI rendering
- Event handling
- Activity tracking
- Notifications
- Demo system
- Search and filtering
- Charts and visualization

**Why This Is Bad:**
1. **Hard for humans** to understand and modify
2. **Impossible for AI agents** to safely extend
3. **Circular dependencies** everywhere
4. **No clear boundaries** for testing
5. **Tight coupling** prevents isolated changes

**Goal:** Transform monolith into modular "seed" architecture that both humans and AI can understand and extend.

---

## The Seed Metaphor

A seed grows into a plant with clear, natural boundaries:

```
        🌱 Seed Architecture

        ☀️ Leaves (UI)
        |   - Dashboard view
        |   - Detail view
        |   - Sidebar
        |
        | Stem (Transport)
        |   - WebSocket
        |   - HTTP API
        |
    ┌───┴───┐ Roots (Data)
    │ State │   - Repositories
    └───┬───┘   - Work efforts
        |       - Tickets
        |
        ⚙️ Kernel (Core)
           - Config
           - Constants
           - Utils
```

**Key Principle:** Each layer depends only on layers below it.
- Leaves depend on Stem
- Stem depends on Roots
- Roots depend on Kernel
- Kernel has NO dependencies

**Result:** Clear, acyclic dependency graph that AI agents can reason about.

---

## Architecture Layers

### Layer 1: Kernel (Core Logic)

**Purpose:** Immutable, pure functions and constants
**Dependencies:** None (foundation)
**Files:** `lib/seed/kernel/`

```javascript
// lib/seed/kernel/config.js
export const CONFIG = {
  WS_RECONNECT_BASE_DELAY: 1000,
  WS_RECONNECT_MAX_DELAY: 30000,
  IDLE_THRESHOLD: 30000,
  DEMO_STEP_PAUSE: 2000
};

// lib/seed/kernel/constants.js
export const STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  COMPLETED: 'completed',
  PAUSED: 'paused',
  BLOCKED: 'blocked'
};

export const EVENTS = {
  WE_UPDATED: 'work-effort:updated',
  WE_CREATED: 'work-effort:created',
  TICKET_UPDATED: 'ticket:updated',
  CONNECTION_STATE: 'connection:state-changed'
};

// lib/seed/kernel/utils.js
export const formatDuration = (ms) => {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
};

export const humanizeDate = (date) => {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};
```

**AI Benefit:** Pure functions are easy to understand and test. No side effects.

---

### Layer 2: Roots (Data Layer)

**Purpose:** State management, data access
**Dependencies:** Kernel only
**Files:** `lib/seed/roots/`

```javascript
// lib/seed/roots/RepositoryManager.js
export class RepositoryManager {
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
  }

  getRepo(name) {
    return this.repos[name];
  }

  getAllRepos() {
    return Object.values(this.repos);
  }

  updateWorkEffort(repoName, workEffort) {
    const repo = this.repos[repoName];
    if (!repo) return;

    const idx = repo.workEfforts.findIndex(we => we.id === workEffort.id);
    if (idx === -1) {
      repo.workEfforts.push(workEffort);
    } else {
      repo.workEfforts[idx] = workEffort;
    }
    repo.lastUpdate = Date.now();
  }
}

// lib/seed/roots/StateManager.js
export class StateManager {
  constructor() {
    this.state = {
      currentFilter: 'all',
      searchQuery: '',
      selectedItem: null,
      activityState: 'active',
      isWindowFocused: true
    };
    this.listeners = [];
  }

  setState(updates) {
    this.state = { ...this.state, ...updates };
    this.notify();
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

  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }
}
```

**AI Benefit:** Single source of truth. AI agents know exactly where to read/write state.

---

### Layer 3: Stem (Transport Layer)

**Purpose:** External communication (WebSocket, HTTP)
**Dependencies:** Kernel, Roots
**Files:** `lib/seed/stem/`

```javascript
// lib/seed/stem/WebSocketTransport.js
import { CONFIG, EVENTS } from '../kernel/config.js';

export class WebSocketTransport {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.ws = null;
    this.reconnectAttempts = 0;
  }

  connect() {
    const wsUrl = `ws://${window.location.host}/ws`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('[WebSocket] Connected');
      this.reconnectAttempts = 0;
      this.eventBus.emit(EVENTS.CONNECTION_STATE, { connected: true });
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onclose = () => {
      console.log('[WebSocket] Disconnected');
      this.eventBus.emit(EVENTS.CONNECTION_STATE, { connected: false });
      this.scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
    };
  }

  handleMessage(message) {
    // Dispatch to event bus based on message type
    switch (message.type) {
      case 'work-effort:updated':
        this.eventBus.emit(EVENTS.WE_UPDATED, message.data);
        break;
      case 'work-effort:created':
        this.eventBus.emit(EVENTS.WE_CREATED, message.data);
        break;
      case 'ticket:updated':
        this.eventBus.emit(EVENTS.TICKET_UPDATED, message.data);
        break;
      default:
        console.warn('[WebSocket] Unknown message type:', message.type);
    }
  }

  scheduleReconnect() {
    const delay = Math.min(
      CONFIG.WS_RECONNECT_BASE_DELAY * Math.pow(2, this.reconnectAttempts),
      CONFIG.WS_RECONNECT_MAX_DELAY
    );
    this.reconnectAttempts++;
    setTimeout(() => this.connect(), delay);
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] Cannot send, not connected');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// lib/seed/stem/APIClient.js
export class APIClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  async get(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    if (!response.ok) throw new Error(`GET ${endpoint} failed: ${response.status}`);
    return response.json();
  }

  async post(endpoint, body) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`POST ${endpoint} failed: ${response.status}`);
    return response.json();
  }

  async put(endpoint, body) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`PUT ${endpoint} failed: ${response.status}`);
    return response.json();
  }

  async delete(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error(`DELETE ${endpoint} failed: ${response.status}`);
    return response.json();
  }
}
```

**AI Benefit:** Transport is isolated. AI can modify WebSocket logic without affecting UI.

---

### Layer 4: Leaves (UI Layer)

**Purpose:** Rendering, user interaction
**Dependencies:** Kernel, Roots, Stem
**Files:** `lib/seed/leaves/`

```javascript
// lib/seed/leaves/DashboardView.js
import { formatDuration, humanizeDate } from '../kernel/utils.js';

export class DashboardView {
  constructor(repoManager, stateManager) {
    this.repoManager = repoManager;
    this.stateManager = stateManager;
    this.elements = {};
  }

  bindElements() {
    this.elements.statsSection = document.querySelector('.stats-section');
    this.elements.queueSection = document.querySelector('.queue-section');
    this.elements.heroBanner = document.querySelector('.hero-banner');
  }

  render() {
    this.renderStats();
    this.renderQueue();
  }

  renderStats() {
    const allRepos = this.repoManager.getAllRepos();
    const allWorkEfforts = allRepos.flatMap(repo => repo.workEfforts);

    const stats = {
      total: allWorkEfforts.length,
      active: allWorkEfforts.filter(we => we.status === 'active').length,
      pending: allWorkEfforts.filter(we => we.status === 'pending').length,
      completed: allWorkEfforts.filter(we => we.status === 'completed').length
    };

    // Update DOM with stats
    const statsHTML = `
      <div class="stat-card">
        <div class="stat-value">${stats.total}</div>
        <div class="stat-label">Total Work Efforts</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.active}</div>
        <div class="stat-label">Active</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.pending}</div>
        <div class="stat-label">Pending</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.completed}</div>
        <div class="stat-label">Completed</div>
      </div>
    `;

    this.elements.statsSection.innerHTML = statsHTML;
  }

  renderQueue() {
    const { currentFilter } = this.stateManager.getState();
    const allRepos = this.repoManager.getAllRepos();
    const allWorkEfforts = allRepos.flatMap(repo => repo.workEfforts);

    const filtered = currentFilter === 'all'
      ? allWorkEfforts
      : allWorkEfforts.filter(we => we.status === currentFilter);

    const queueHTML = filtered.map(we => `
      <div class="queue-item" data-id="${we.id}">
        <div class="queue-item-title">${we.title}</div>
        <div class="queue-item-status">${we.status}</div>
        <div class="queue-item-time">${formatDuration(Date.now() - new Date(we.created))}</div>
      </div>
    `).join('');

    this.elements.queueSection.innerHTML = queueHTML;
  }
}

// lib/seed/leaves/DetailView.js
export class DetailView {
  constructor(repoManager, stateManager, apiClient) {
    this.repoManager = repoManager;
    this.stateManager = stateManager;
    this.apiClient = apiClient;
    this.elements = {};
  }

  bindElements() {
    this.elements.detailView = document.querySelector('.detail-view');
    this.elements.detailTitle = document.querySelector('.detail-title');
    this.elements.detailStatus = document.querySelector('.detail-status');
    this.elements.ticketList = document.querySelector('.ticket-list');
  }

  async render(workEffortId) {
    const we = this.findWorkEffort(workEffortId);
    if (!we) {
      console.warn('Work effort not found:', workEffortId);
      return;
    }

    this.elements.detailTitle.textContent = we.title;
    this.elements.detailStatus.textContent = we.status;
    this.renderTickets(we.tickets || []);
  }

  renderTickets(tickets) {
    const ticketsHTML = tickets.map(ticket => `
      <div class="ticket-card" data-id="${ticket.id}">
        <div class="ticket-title">${ticket.title}</div>
        <div class="ticket-status">${ticket.status}</div>
      </div>
    `).join('');

    this.elements.ticketList.innerHTML = ticketsHTML;
  }

  async updateStatus(workEffortId, newStatus) {
    try {
      await this.apiClient.put(`/api/work-efforts/${workEffortId}/status`, { status: newStatus });
      // State will update via WebSocket message
    } catch (error) {
      console.error('Failed to update status:', error);
      throw error;
    }
  }

  findWorkEffort(id) {
    const allRepos = this.repoManager.getAllRepos();
    for (const repo of allRepos) {
      const we = repo.workEfforts.find(we => we.id === id);
      if (we) return we;
    }
    return null;
  }
}

// lib/seed/leaves/Sidebar.js
export class Sidebar {
  constructor(repoManager, stateManager) {
    this.repoManager = repoManager;
    this.stateManager = stateManager;
    this.elements = {};
  }

  bindElements() {
    this.elements.sidebar = document.querySelector('.sidebar');
    this.elements.treeNav = document.querySelector('.tree-nav');
    this.elements.searchInput = document.querySelector('.search-input');
  }

  render() {
    const repos = this.repoManager.getAllRepos();
    const treeHTML = repos.map(repo => `
      <div class="tree-item repo" data-repo="${repo.name}">
        <div class="tree-item-label">${repo.name}</div>
        <div class="tree-children">
          ${this.renderWorkEfforts(repo.workEfforts)}
        </div>
      </div>
    `).join('');

    this.elements.treeNav.innerHTML = treeHTML;
  }

  renderWorkEfforts(workEfforts) {
    return workEfforts.map(we => `
      <div class="tree-item work-effort" data-id="${we.id}">
        <div class="tree-item-label">${we.title}</div>
        <div class="tree-item-status">${we.status}</div>
      </div>
    `).join('');
  }

  bindEvents() {
    // Search
    this.elements.searchInput.addEventListener('input', (e) => {
      this.stateManager.setState({ searchQuery: e.target.value });
    });

    // Tree clicks (event delegation)
    this.elements.treeNav.addEventListener('click', (e) => {
      const workEffortEl = e.target.closest('[data-id]');
      if (workEffortEl) {
        const id = workEffortEl.dataset.id;
        this.stateManager.setState({ selectedItem: id });
      }
    });
  }
}
```

**AI Benefit:** UI components are focused and testable. AI can modify one view without breaking others.

---

## Dependency Injection Container

**Purpose:** Wire everything together
**File:** `lib/seed/container.js`

```javascript
// lib/seed/container.js
import { RepositoryManager } from './roots/RepositoryManager.js';
import { StateManager } from './roots/StateManager.js';
import { WebSocketTransport } from './stem/WebSocketTransport.js';
import { APIClient } from './stem/APIClient.js';
import { DashboardView } from './leaves/DashboardView.js';
import { DetailView } from './leaves/DetailView.js';
import { Sidebar } from './leaves/Sidebar.js';

export class Container {
  constructor() {
    this.services = {};
    this.build();
  }

  build() {
    // Roots
    this.services.repoManager = new RepositoryManager();
    this.services.stateManager = new StateManager();

    // Stem
    this.services.eventBus = window.eventBus || new EventBus();
    this.services.wsTransport = new WebSocketTransport(this.services.eventBus);
    this.services.apiClient = new APIClient();

    // Leaves
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

  get(name) {
    return this.services[name];
  }
}
```

**AI Benefit:** Single place to see all dependencies. AI knows what depends on what.

---

## Bootstrap (New app.js)

**Purpose:** Initialize and start the application
**File:** `public/app.js` (now <300 lines!)

```javascript
// public/app.js
import { Container } from './lib/seed/container.js';
import { EVENTS } from './lib/seed/kernel/constants.js';

class MissionControl {
  constructor() {
    this.container = new Container();

    // Get services
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
    // Bind UI elements
    this.dashboardView.bindElements();
    this.detailView.bindElements();
    this.sidebar.bindElements();

    // Bind events
    this.sidebar.bindEvents();
    this.bindStateChanges();
    this.bindWebSocketEvents();

    // Connect
    this.wsTransport.connect();

    // Initial render
    this.render();
  }

  bindStateChanges() {
    this.stateManager.subscribe((state) => {
      if (state.selectedItem) {
        this.showDetailView(state.selectedItem);
      } else {
        this.showDashboardView();
      }
    });
  }

  bindWebSocketEvents() {
    this.eventBus.on(EVENTS.WE_UPDATED, (workEffort) => {
      this.repoManager.updateWorkEffort(workEffort.repo, workEffort);
      this.render();
    });

    this.eventBus.on(EVENTS.WE_CREATED, (workEffort) => {
      this.repoManager.updateWorkEffort(workEffort.repo, workEffort);
      this.render();
    });

    this.eventBus.on(EVENTS.CONNECTION_STATE, ({ connected }) => {
      console.log('[App] Connection state:', connected);
      // Update UI connection indicator
    });
  }

  render() {
    this.sidebar.render();
    const { selectedItem } = this.stateManager.getState();
    if (selectedItem) {
      this.detailView.render(selectedItem);
    } else {
      this.dashboardView.render();
    }
  }

  showDashboardView() {
    document.querySelector('.dashboard-view').classList.add('active');
    document.querySelector('.detail-view').classList.remove('active');
    this.dashboardView.render();
  }

  showDetailView(id) {
    document.querySelector('.dashboard-view').classList.remove('active');
    document.querySelector('.detail-view').classList.add('active');
    this.detailView.render(id);
  }
}

// Start the app
window.addEventListener('DOMContentLoaded', () => {
  window.missionControl = new MissionControl();
});
```

**Result:** app.js is now just orchestration. No business logic!

---

## File Structure

```
mcp-servers/dashboard-v3/
├── public/
│   ├── app.js                    # Bootstrap (~250 lines)
│   ├── index.html
│   ├── lib/
│   │   └── seed/
│   │       ├── kernel/           # Layer 1: Core
│   │       │   ├── config.js
│   │       │   ├── constants.js
│   │       │   └── utils.js
│   │       ├── roots/            # Layer 2: Data
│   │       │   ├── RepositoryManager.js
│   │       │   └── StateManager.js
│   │       ├── stem/             # Layer 3: Transport
│   │       │   ├── WebSocketTransport.js
│   │       │   └── APIClient.js
│   │       ├── leaves/           # Layer 4: UI
│   │       │   ├── DashboardView.js
│   │       │   ├── DetailView.js
│   │       │   ├── Sidebar.js
│   │       │   ├── NotificationPanel.js
│   │       │   └── ActivityTracker.js
│   │       └── container.js      # DI container
│   └── styles/
│       ├── main.css              # Imports only
│       ├── tokens.css
│       ├── reset.css
│       ├── typography.css
│       ├── layout.css
│       └── components/
│           ├── nav.css
│           ├── sidebar.css
│           ├── cards.css
│           └── ...
└── server.js
```

---

## Benefits for AI Agents

### 1. Clear Module Boundaries

AI agents can:
- Ask "Where is WebSocket logic?" → `lib/seed/stem/WebSocketTransport.js`
- Ask "How is state managed?" → `lib/seed/roots/StateManager.js`
- Ask "Where is the dashboard rendered?" → `lib/seed/leaves/DashboardView.js`

### 2. Safe Modification Points

AI knows:
- Adding a UI feature? → Modify/add to `leaves/`
- Changing WebSocket behavior? → Modify `stem/WebSocketTransport.js`
- Adding a utility? → Add to `kernel/utils.js`

### 3. No Circular Dependencies

```
✅ DashboardView → StateManager → (no deps)
✅ WebSocketTransport → EventBus → (no deps)
✅ DetailView → APIClient → (no deps)

❌ IMPOSSIBLE: StateManager → DashboardView (layer violation!)
```

AI can't accidentally create circular dependencies.

### 4. Testable Units

Each module can be tested in isolation:

```javascript
// test/roots/StateManager.test.js
import { StateManager } from '../../lib/seed/roots/StateManager.js';

describe('StateManager', () => {
  it('should notify listeners on state change', () => {
    const sm = new StateManager();
    let called = false;
    sm.subscribe(() => { called = true; });
    sm.setState({ foo: 'bar' });
    expect(called).toBe(true);
  });
});
```

AI can generate tests automatically based on module structure.

### 5. Self-Documenting

File paths convey purpose:
- `kernel/` = pure logic, no side effects
- `roots/` = state and data
- `stem/` = I/O and transport
- `leaves/` = UI and user interaction

AI doesn't need to read code to understand architecture.

---

## Migration Path

### Step 1: Extract Kernel (4h)

1. Create `lib/seed/kernel/` directory
2. Move constants from app.js to `constants.js`
3. Move config from constructor to `config.js`
4. Move pure utilities to `utils.js`
5. Update imports in app.js

### Step 2: Create Roots (6h)

1. Create `lib/seed/roots/` directory
2. Extract `this.repos` → `RepositoryManager`
3. Extract state variables → `StateManager`
4. Wire up in app.js
5. Test state management works

### Step 3: Create Stem (6h)

1. Create `lib/seed/stem/` directory
2. Extract WebSocket logic → `WebSocketTransport`
3. Create `APIClient` for HTTP calls
4. Wire up in app.js
5. Test communication works

### Step 4: Create Leaves (8h)

1. Create `lib/seed/leaves/` directory
2. Extract dashboard rendering → `DashboardView`
3. Extract detail rendering → `DetailView`
4. Extract sidebar → `Sidebar`
5. Extract notification panel → `NotificationPanel`
6. Extract activity tracker → `ActivityTracker`
7. Wire up in app.js
8. Test UI works

### Step 5: Add DI Container (4h)

1. Create `lib/seed/container.js`
2. Move service initialization from app.js
3. Update app.js to use container
4. Test dependency injection works

### Step 6: Add Tests (4h)

1. Set up test framework (Jest/Vitest)
2. Write tests for kernel utilities
3. Write tests for roots (StateManager, RepositoryManager)
4. Write tests for stem (mock WebSocket, test API)
5. Write tests for leaves (JSDOM, test rendering)
6. Aim for 80%+ coverage

---

## Example: Adding a New Feature (AI Workflow)

**Task:** Add a "favorite work effort" feature

**AI Agent Process:**

1. **Read architecture** → "This is a seed architecture"
2. **Identify layers:**
   - Kernel: Add `FAVORITES` constant
   - Roots: Add favorites to StateManager
   - Stem: Add `POST /api/favorites` to APIClient
   - Leaves: Add star icon to DashboardView, wire click handler

3. **Make changes:**

```javascript
// kernel/constants.js
export const EVENTS = {
  // ...existing
  FAVORITE_ADDED: 'favorite:added',
  FAVORITE_REMOVED: 'favorite:removed'
};

// roots/StateManager.js
this.state = {
  // ...existing
  favorites: [] // Add this
};

// stem/APIClient.js
async addFavorite(workEffortId) {
  return this.post('/api/favorites', { id: workEffortId });
}

// leaves/DashboardView.js
renderQueue() {
  const { favorites } = this.stateManager.getState();
  // ... render with star icon based on favorites array
}
```

1. **Test changes** → Run existing tests, add new tests
2. **Ship** → AI knows nothing broke because dependencies are clear

**Total time:** 30 minutes instead of 3 hours debugging spaghetti code

---

## Comparison: Before vs After

### Before (Monolith)

```javascript
class MissionControl {
  // 3,038 lines of everything
  constructor() { /* 50 properties */ }
  connect() { /* WebSocket */ }
  handleMessage() { /* 200 lines */ }
  renderDashboard() { /* 150 lines */ }
  renderDetail() { /* 200 lines */ }
  updateStatus() { /* API call */ }
  runDemo() { /* 220 lines */ }
  // ... 40+ more methods
}
```

**AI Agent:** "I don't know where to start or what's safe to change."

### After (Seed)

```javascript
// app.js (250 lines)
class MissionControl {
  constructor() {
    this.container = new Container();
    this.init();
  }
  // Just orchestration
}

// lib/seed/roots/StateManager.js (120 lines)
// lib/seed/stem/WebSocketTransport.js (150 lines)
// lib/seed/leaves/DashboardView.js (180 lines)
// ... 8 focused modules
```

**AI Agent:** "I know exactly where everything is and what's safe to change."

---

## Success Criteria

✅ app.js reduced from 3,038 to <300 lines
✅ 8+ focused modules created
✅ Clear dependency graph (acyclic)
✅ Test coverage >80%
✅ No circular dependencies
✅ Each module <200 lines
✅ AI agents can understand and modify safely

---

## Appendix: Code Example

Full working example in `lib/seed-architecture-example.js`

---

*Document Version: 1.0*
*Last Updated: 2026-01-01*
*Author: Claude Code AI*
