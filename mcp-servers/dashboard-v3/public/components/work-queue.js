/**
 * @fileoverview Work Queue Component
 *
 * Displays tickets grouped by status for the Command Center.
 * Groups: In Progress, Up Next (pending), Done (completed), Blocked
 *
 * @author _pyrite
 * @version 0.6.3
 */

/**
 * Work Queue Manager
 * Handles rendering and managing the ticket queue display.
 */
class WorkQueue {
  constructor() {
    /** @type {HTMLElement|null} */
    this.container = null;

    /** @type {HTMLElement|null} */
    this.countEl = null;

    /** @type {HTMLElement|null} */
    this.emptyState = null;

    /** @type {Array} */
    this.tickets = [];

    /** @type {string|null} */
    this.activeTicketId = null;

    /** @type {boolean} */
    this.initialized = false;

    /** @type {Function|null} */
    this.onTicketClick = null;
  }

  /**
   * Initialize the work queue.
   */
  init() {
    this.container = document.getElementById('queueContent');
    this.countEl = document.getElementById('queueCount');
    this.emptyState = document.getElementById('queueEmpty');

    if (!this.container) {
      console.warn('WorkQueue: Container not found');
      return;
    }

    this.initialized = true;
    console.log('WorkQueue initialized');
  }

  /**
   * Set tickets and render.
   * @param {Array} tickets - Array of ticket objects
   */
  setTickets(tickets) {
    this.tickets = tickets || [];
    this.render();
  }

  /**
   * Group tickets by status.
   * @returns {Object} Grouped tickets
   */
  groupTickets() {
    const groups = {
      in_progress: [],
      pending: [],
      completed: [],
      blocked: []
    };

    for (const ticket of this.tickets) {
      const status = ticket.status || 'pending';
      if (groups[status]) {
        groups[status].push(ticket);
      } else {
        groups.pending.push(ticket);
      }
    }

    return groups;
  }

  /**
   * Render the queue.
   */
  render() {
    if (!this.initialized) return;

    // Clear existing content
    this.container.innerHTML = '';

    if (this.tickets.length === 0) {
      this.showEmptyState();
      this.updateCount();
      return;
    }

    this.hideEmptyState();
    const groups = this.groupTickets();

    // Render groups in order
    this.renderGroup('in_progress', 'In Progress', '▶', groups.in_progress);
    this.renderGroup('pending', 'Up Next', '○', groups.pending);
    this.renderGroup('completed', 'Done', '✓', groups.completed);

    if (groups.blocked.length > 0) {
      this.renderGroup('blocked', 'Blocked', '⚠', groups.blocked);
    }

    this.updateCount();
  }

  /**
   * Render a single group.
   * @param {string} status - Status key
   * @param {string} title - Display title
   * @param {string} icon - Icon character
   * @param {Array} tickets - Tickets in this group
   */
  renderGroup(status, title, icon, tickets) {
    if (tickets.length === 0) return;

    const groupEl = document.createElement('div');
    groupEl.className = `queue-group ${status}`;

    groupEl.innerHTML = `
      <div class="queue-group-header">
        <span class="queue-group-icon">${icon}</span>
        <span>${title}</span>
        <span class="queue-group-count">(${tickets.length})</span>
      </div>
      <div class="queue-group-items"></div>
    `;

    const itemsContainer = groupEl.querySelector('.queue-group-items');

    for (const ticket of tickets) {
      const itemEl = this.renderTicketItem(ticket, status);
      itemsContainer.appendChild(itemEl);
    }

    this.container.appendChild(groupEl);
  }

  /**
   * Render a single ticket item.
   * @param {Object} ticket - Ticket object
   * @param {string} status - Status key
   * @returns {HTMLElement} Ticket element
   */
  renderTicketItem(ticket, status) {
    const el = document.createElement('div');
    el.className = `queue-item ${status}`;
    el.dataset.ticketId = ticket.id;

    if (ticket.id === this.activeTicketId) {
      el.classList.add('active');
    }

    const statusIcon = this.getStatusIcon(status);
    const title = ticket.title || ticket.id;
    const id = ticket.id || 'Unknown';

    el.innerHTML = `
      <span class="queue-item-status">${statusIcon}</span>
      <div class="queue-item-content">
        <div class="queue-item-id">${this.escapeHtml(id)}</div>
        <div class="queue-item-title">${this.escapeHtml(title)}</div>
      </div>
    `;

    el.addEventListener('click', () => {
      this.setActiveTicket(ticket.id);
      if (this.onTicketClick) {
        this.onTicketClick(ticket);
      }
    });

    return el;
  }

  /**
   * Get status icon.
   * @param {string} status - Status key
   * @returns {string} Icon character
   */
  getStatusIcon(status) {
    const icons = {
      in_progress: '▶',
      pending: '○',
      completed: '✓',
      blocked: '⚠'
    };
    return icons[status] || '•';
  }

  /**
   * Set active ticket.
   * @param {string} ticketId - Ticket ID
   */
  setActiveTicket(ticketId) {
    this.activeTicketId = ticketId;

    // Update UI
    const items = this.container.querySelectorAll('.queue-item');
    items.forEach(item => {
      item.classList.toggle('active', item.dataset.ticketId === ticketId);
    });
  }

  /**
   * Update ticket status.
   * @param {string} ticketId - Ticket ID
   * @param {string} newStatus - New status
   */
  updateTicketStatus(ticketId, newStatus) {
    const ticket = this.tickets.find(t => t.id === ticketId);
    if (ticket) {
      ticket.status = newStatus;
      this.render();
    }
  }

  /**
   * Add a ticket.
   * @param {Object} ticket - Ticket object
   */
  addTicket(ticket) {
    this.tickets.push(ticket);
    this.render();
  }

  /**
   * Remove a ticket.
   * @param {string} ticketId - Ticket ID
   */
  removeTicket(ticketId) {
    this.tickets = this.tickets.filter(t => t.id !== ticketId);
    if (this.activeTicketId === ticketId) {
      this.activeTicketId = null;
    }
    this.render();
  }

  /**
   * Update count display.
   */
  updateCount() {
    if (this.countEl) {
      const count = this.tickets.length;
      this.countEl.textContent = `${count} ticket${count !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Escape HTML.
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Show empty state.
   */
  showEmptyState() {
    if (this.emptyState) {
      this.emptyState.style.display = '';
    }
  }

  /**
   * Hide empty state.
   */
  hideEmptyState() {
    if (this.emptyState) {
      this.emptyState.style.display = 'none';
    }
  }

  /**
   * Get tickets by status.
   * @param {string} status - Status to filter by
   * @returns {Array} Filtered tickets
   */
  getByStatus(status) {
    return this.tickets.filter(t => t.status === status);
  }

  /**
   * Get next pending ticket.
   * @returns {Object|null} Next ticket or null
   */
  getNextPending() {
    return this.tickets.find(t => t.status === 'pending') || null;
  }

  /**
   * Get statistics.
   * @returns {Object} Stats object
   */
  getStats() {
    const groups = this.groupTickets();
    return {
      total: this.tickets.length,
      inProgress: groups.in_progress.length,
      pending: groups.pending.length,
      completed: groups.completed.length,
      blocked: groups.blocked.length,
      progress: this.tickets.length > 0
        ? Math.round((groups.completed.length / this.tickets.length) * 100)
        : 0
    };
  }

  /**
   * Load demo tickets for testing.
   */
  loadDemo() {
    this.setTickets([
      { id: 'TKT-tbsw-001', title: 'Design command center layout structure', status: 'completed' },
      { id: 'TKT-tbsw-002', title: 'Create live activity feed component', status: 'in_progress' },
      { id: 'TKT-tbsw-003', title: 'Build chat/command input interface', status: 'in_progress' },
      { id: 'TKT-tbsw-004', title: 'Implement work queue panel', status: 'pending' },
      { id: 'TKT-tbsw-005', title: 'Add WebSocket real-time updates', status: 'pending' },
      { id: 'TKT-tbsw-006', title: 'Remove/simplify redundant metrics', status: 'pending' },
      { id: 'TKT-tbsw-007', title: 'Mobile responsive command center', status: 'pending' }
    ]);
  }
}

// Export singleton instance
window.workQueue = new WorkQueue();

