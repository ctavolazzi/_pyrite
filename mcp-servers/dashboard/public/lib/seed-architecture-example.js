/**
 * SEED ARCHITECTURE - Proof of Concept
 *
 * This demonstrates how components could be restructured using the
 * "Seed Strategy" pattern where:
 *
 *   1. CAPABILITIES - Pure functions that transform data (the "Hands")
 *   2. STATE        - Reactive store that holds data (the "Memory")
 *   3. RENDERERS    - Pure functions that return HTML (the "Body")
 *   4. CONTROLLER   - Wires everything together (the "Spine")
 *
 * Benefits:
 *   - Testable: Each layer can be tested without DOM
 *   - AI-Ready: Capabilities can be called by AI agents
 *   - Reusable: Same renderer can show different data
 *   - Composable: Mix and match layers freely
 */

// ============================================================================
// LAYER 1: CAPABILITIES (Pure Logic - No DOM, No State)
// ============================================================================

const TicketCapabilities = {
  /**
   * Group tickets by status.
   * @param {Array} tickets
   * @returns {Object} { in_progress: [], pending: [], completed: [], blocked: [] }
   */
  groupByStatus(tickets) {
    return tickets.reduce((groups, ticket) => {
      const status = ticket.status || 'pending';
      (groups[status] = groups[status] || []).push(ticket);
      return groups;
    }, { in_progress: [], pending: [], completed: [], blocked: [] });
  },

  /**
   * Filter tickets by status.
   * @param {Array} tickets
   * @param {string} filter - 'all' | 'active' | 'pending' | 'completed'
   * @returns {Array}
   */
  filterByStatus(tickets, filter) {
    if (filter === 'all') return tickets;
    if (filter === 'active') {
      return tickets.filter(t => t.status === 'in_progress' || t.status === 'active');
    }
    return tickets.filter(t => t.status === filter);
  },

  /**
   * Sort tickets by priority order.
   * @param {Array} tickets
   * @returns {Array}
   */
  sortByPriority(tickets) {
    const order = { in_progress: 0, pending: 1, blocked: 2, completed: 3 };
    return [...tickets].sort((a, b) =>
      (order[a.status] ?? 99) - (order[b.status] ?? 99)
    );
  },

  /**
   * Calculate stats from tickets.
   * @param {Array} tickets
   * @returns {Object}
   */
  calculateStats(tickets) {
    const groups = this.groupByStatus(tickets);
    const total = tickets.length;
    const completed = groups.completed.length;
    return {
      total,
      completed,
      inProgress: groups.in_progress.length,
      pending: groups.pending.length,
      blocked: groups.blocked.length,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  },

  /**
   * Find ticket by ID.
   * @param {Array} tickets
   * @param {string} id
   * @returns {Object|null}
   */
  findById(tickets, id) {
    return tickets.find(t => t.id === id) || null;
  }
};

// ============================================================================
// LAYER 2: STATE (Reactive Store)
// ============================================================================

/**
 * Simple reactive store.
 * @param {Object} initialState
 * @returns {Object} { get, set, subscribe }
 */
function createStore(initialState = {}) {
  let state = { ...initialState };
  const subscribers = new Set();

  return {
    get() {
      return state;
    },

    set(updates) {
      state = { ...state, ...updates };
      subscribers.forEach(fn => fn(state));
    },

    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    }
  };
}

// Queue-specific store
const queueStore = createStore({
  tickets: [],
  filter: 'all',
  selectedId: null,
  loading: false
});

// ============================================================================
// LAYER 3: RENDERERS (Pure View - No DOM Refs, No State)
// ============================================================================

const QueueRenderer = {
  /**
   * Render the entire queue.
   * @param {Object} data - { tickets, filter, selectedId, stats }
   * @returns {string} HTML
   */
  render(data) {
    const { tickets, filter, selectedId, stats } = data;

    if (tickets.length === 0) {
      return this.emptyState();
    }

    const groups = TicketCapabilities.groupByStatus(tickets);

    return `
      <div class="queue-stats">
        ${stats.completed}/${stats.total} complete (${stats.progress}%)
      </div>
      ${this.renderGroup('in_progress', 'In Progress', '▶', groups.in_progress, selectedId)}
      ${this.renderGroup('pending', 'Up Next', '○', groups.pending, selectedId)}
      ${this.renderGroup('completed', 'Done', '✓', groups.completed, selectedId)}
      ${groups.blocked.length ? this.renderGroup('blocked', 'Blocked', '⚠', groups.blocked, selectedId) : ''}
    `;
  },

  /**
   * Render a group of tickets.
   */
  renderGroup(status, title, icon, tickets, selectedId) {
    if (tickets.length === 0) return '';

    return `
      <div class="queue-group ${status}">
        <div class="queue-group-header">
          <span class="queue-group-icon">${icon}</span>
          <span>${title}</span>
          <span class="queue-group-count">(${tickets.length})</span>
        </div>
        <div class="queue-group-items">
          ${tickets.map(t => this.renderTicket(t, selectedId)).join('')}
        </div>
      </div>
    `;
  },

  /**
   * Render a single ticket.
   */
  renderTicket(ticket, selectedId) {
    const isSelected = ticket.id === selectedId;
    return `
      <div class="queue-item ${ticket.status} ${isSelected ? 'selected' : ''}"
           data-ticket-id="${ticket.id}">
        <span class="queue-item-status">${this.statusIcon(ticket.status)}</span>
        <div class="queue-item-content">
          <div class="queue-item-id">${escapeHtml(ticket.id)}</div>
          <div class="queue-item-title">${escapeHtml(ticket.title)}</div>
        </div>
      </div>
    `;
  },

  statusIcon(status) {
    return { in_progress: '▶', pending: '○', completed: '✓', blocked: '⚠' }[status] || '•';
  },

  emptyState() {
    return `
      <div class="queue-empty">
        <div class="empty-icon">◇</div>
        <p>No tickets in queue</p>
      </div>
    `;
  }
};

// Utility
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

// ============================================================================
// LAYER 4: CONTROLLER (Wire Everything Together)
// ============================================================================

/**
 * Create a queue controller instance.
 * @param {HTMLElement} container - Where to mount
 * @param {Object} store - The state store
 * @param {Object} renderer - The renderer to use
 * @returns {Object} Controller API
 */
function createQueueController(container, store, renderer) {
  let unsubscribe = null;

  // Re-render when state changes
  function handleStateChange(state) {
    const stats = TicketCapabilities.calculateStats(state.tickets);
    const filtered = TicketCapabilities.filterByStatus(state.tickets, state.filter);
    const sorted = TicketCapabilities.sortByPriority(filtered);

    container.innerHTML = renderer.render({
      tickets: sorted,
      filter: state.filter,
      selectedId: state.selectedId,
      stats
    });
  }

  // Event delegation for clicks
  function handleClick(e) {
    const item = e.target.closest('[data-ticket-id]');
    if (item) {
      const ticketId = item.dataset.ticketId;
      store.set({ selectedId: ticketId });

      // Dispatch custom event for parent components
      container.dispatchEvent(new CustomEvent('ticket-select', {
        detail: { ticketId },
        bubbles: true
      }));
    }
  }

  return {
    /**
     * Mount the controller.
     */
    mount() {
      unsubscribe = store.subscribe(handleStateChange);
      container.addEventListener('click', handleClick);
      handleStateChange(store.get()); // Initial render
      return this;
    },

    /**
     * Unmount the controller.
     */
    unmount() {
      if (unsubscribe) unsubscribe();
      container.removeEventListener('click', handleClick);
      container.innerHTML = '';
    },

    /**
     * Set tickets (external API).
     */
    setTickets(tickets) {
      store.set({ tickets });
    },

    /**
     * Set filter.
     */
    setFilter(filter) {
      store.set({ filter });
    },

    /**
     * Get current stats.
     */
    getStats() {
      return TicketCapabilities.calculateStats(store.get().tickets);
    }
  };
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/*
// In your app initialization:

const container = document.getElementById('queueContent');
const queue = createQueueController(container, queueStore, QueueRenderer);
queue.mount();

// Load data
queue.setTickets([
  { id: 'TKT-001', title: 'Fix the bug', status: 'in_progress' },
  { id: 'TKT-002', title: 'Add feature', status: 'pending' },
]);

// Listen for events
container.addEventListener('ticket-select', (e) => {
  console.log('Selected:', e.detail.ticketId);
});

// Cleanup when done
queue.unmount();
*/

// ============================================================================
// WHY THIS IS BETTER
// ============================================================================

/*
1. TESTABLE WITHOUT DOM
   - TicketCapabilities.groupByStatus([...]) ← pure function, test directly
   - QueueRenderer.render({...}) ← pure function, test HTML output
   - Store is just an object with get/set

2. AI-AGENT READY
   - An AI agent could call TicketCapabilities directly
   - Same capabilities work whether triggered by human click or AI command
   - The "Brain" (AI) and "Hands" (capabilities) are decoupled

3. REUSABLE / COMPOSABLE
   - Same QueueRenderer can be used with different stores
   - Same store can feed multiple renderers
   - Controller is just a thin wire-up layer

4. NO SINGLETONS
   - Can create multiple queue instances
   - Each has its own store, container, lifecycle

5. CLEAR DATA FLOW
   - Actions → Store → Renderer → DOM
   - Events bubble up from DOM
   - No hidden state, no DOM queries scattered around
*/

export { TicketCapabilities, createStore, QueueRenderer, createQueueController };

