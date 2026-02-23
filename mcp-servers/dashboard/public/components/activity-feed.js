/**
 * @fileoverview Activity Feed Component
 *
 * Terminal-style streaming activity display for the Command Center.
 * Shows real-time events, status changes, and AI activity.
 *
 * @author _pyrite
 * @version 0.6.3
 */

/**
 * Activity Feed Manager
 * Handles rendering and managing the live activity feed.
 */
class ActivityFeed {
  constructor() {
    /** @type {HTMLElement|null} */
    this.container = null;

    /** @type {HTMLElement|null} */
    this.emptyState = null;

    /** @type {Array<{type: string, message: string, timestamp: Date, icon: string}>} */
    this.entries = [];

    /** @type {boolean} */
    this.autoScroll = true;

    /** @type {number} */
    this.maxEntries = 500;

    /** @type {boolean} */
    this.initialized = false;
  }

  /**
   * Initialize the activity feed.
   */
  init() {
    this.container = document.getElementById('feedContent');
    this.emptyState = document.getElementById('feedEmpty');

    if (!this.container) {
      console.warn('ActivityFeed: Container not found');
      return;
    }

    // Bind control buttons
    const pauseBtn = document.getElementById('feedPauseBtn');
    const clearBtn = document.getElementById('feedClearBtn');

    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => this.toggleAutoScroll());
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clear());
    }

    // Pause auto-scroll on hover
    this.container.addEventListener('mouseenter', () => {
      if (this.autoScroll) {
        this._tempPaused = true;
      }
    });

    this.container.addEventListener('mouseleave', () => {
      this._tempPaused = false;
      if (this.autoScroll) {
        this.scrollToBottom();
      }
    });

    this.initialized = true;
    console.log('ActivityFeed initialized');
  }

  /**
   * Add an entry to the feed.
   * @param {string} type - Entry type: info, success, warning, error, action, system
   * @param {string} message - The message to display
   * @param {string} [icon] - Optional custom icon
   */
  add(type, message, icon) {
    if (!this.initialized) return;

    const entry = {
      type,
      message,
      timestamp: new Date(),
      icon: icon || this.getDefaultIcon(type)
    };

    this.entries.push(entry);

    // Trim old entries
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
      // Remove first DOM entry
      const firstEntry = this.container.querySelector('.feed-entry');
      if (firstEntry) {
        firstEntry.remove();
      }
    }

    this.renderEntry(entry);
    this.hideEmptyState();

    if (this.autoScroll && !this._tempPaused) {
      this.scrollToBottom();
    }
  }

  /**
   * Get default icon for entry type.
   * @param {string} type - Entry type
   * @returns {string} Icon character
   */
  getDefaultIcon(type) {
    const icons = {
      info: 'ℹ',
      success: '✓',
      warning: '⚠',
      error: '✕',
      action: '▶',
      system: '◇',
      command: '›',
      thinking: '◌'
    };
    return icons[type] || '•';
  }

  /**
   * Render a single entry to the DOM.
   * @param {Object} entry - Entry object
   */
  renderEntry(entry) {
    const el = document.createElement('div');
    el.className = `feed-entry ${entry.type}`;

    const time = entry.timestamp.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    el.innerHTML = `
      <span class="feed-timestamp">${time}</span>
      <span class="feed-icon">${entry.icon}</span>
      <span class="feed-message">${this.escapeHtml(entry.message)}</span>
    `;

    this.container.appendChild(el);
  }

  /**
   * Escape HTML to prevent XSS.
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Add a highlighted/important entry.
   * @param {string} message - The message
   */
  addHighlight(message) {
    if (!this.initialized) return;

    const entry = {
      type: 'highlight',
      message,
      timestamp: new Date(),
      icon: '★'
    };

    this.entries.push(entry);

    const el = document.createElement('div');
    el.className = 'feed-entry highlight';

    const time = entry.timestamp.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    el.innerHTML = `
      <span class="feed-timestamp">${time}</span>
      <span class="feed-icon">${entry.icon}</span>
      <span class="feed-message">${this.escapeHtml(message)}</span>
    `;

    this.container.appendChild(el);
    this.hideEmptyState();

    if (this.autoScroll && !this._tempPaused) {
      this.scrollToBottom();
    }
  }

  /**
   * Add typing indicator.
   * @returns {HTMLElement} The indicator element (for removal)
   */
  addTypingIndicator() {
    if (!this.initialized) return null;

    const el = document.createElement('div');
    el.className = 'feed-entry typing';
    el.innerHTML = `
      <span class="feed-timestamp"></span>
      <span class="feed-icon">◌</span>
      <span class="typing-indicator">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </span>
    `;

    this.container.appendChild(el);
    this.hideEmptyState();

    if (this.autoScroll && !this._tempPaused) {
      this.scrollToBottom();
    }

    return el;
  }

  /**
   * Remove typing indicator.
   * @param {HTMLElement} indicator - The indicator element
   */
  removeTypingIndicator(indicator) {
    if (indicator && indicator.parentNode) {
      indicator.remove();
    }
  }

  /**
   * Scroll to bottom of feed.
   */
  scrollToBottom() {
    if (this.container) {
      this.container.scrollTop = this.container.scrollHeight;
    }
  }

  /**
   * Toggle auto-scroll.
   */
  toggleAutoScroll() {
    this.autoScroll = !this.autoScroll;

    const btn = document.getElementById('feedPauseBtn');
    if (btn) {
      btn.classList.toggle('active', !this.autoScroll);
      btn.title = this.autoScroll ? 'Pause auto-scroll' : 'Resume auto-scroll';
    }

    if (this.autoScroll) {
      this.scrollToBottom();
    }
  }

  /**
   * Clear all entries.
   */
  clear() {
    this.entries = [];
    if (this.container) {
      // Remove all feed entries but keep empty state
      const entries = this.container.querySelectorAll('.feed-entry');
      entries.forEach(el => el.remove());
    }
    this.showEmptyState();
    this.add('system', 'Feed cleared');
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
   * Show empty state.
   */
  showEmptyState() {
    if (this.emptyState) {
      this.emptyState.style.display = '';
    }
  }

  /**
   * Get entry count.
   * @returns {number} Number of entries
   */
  getCount() {
    return this.entries.length;
  }

  /**
   * Run demo activity for testing.
   */
  runDemo() {
    const demoMessages = [
      { type: 'system', message: 'Command Center initialized' },
      { type: 'info', message: 'Connected to Mission Control server' },
      { type: 'action', message: 'Loading work effort WE-251231-tbsw...' },
      { type: 'success', message: 'Work effort loaded successfully' },
      { type: 'info', message: 'Found 7 tickets in queue' },
      { type: 'action', message: 'Starting ticket TKT-tbsw-001: Design command center layout' },
      { type: 'info', message: 'Reading index.html structure...' },
      { type: 'info', message: 'Analyzing current CSS components...' },
      { type: 'success', message: 'Layout analysis complete' },
      { type: 'action', message: 'Creating command-center.css...' },
      { type: 'success', message: 'CSS component created (234 lines)' },
      { type: 'action', message: 'Updating main.css imports...' },
      { type: 'success', message: 'Import added successfully' },
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < demoMessages.length) {
        const { type, message } = demoMessages[index];
        this.add(type, message);
        index++;
      } else {
        clearInterval(interval);
        this.addHighlight('Demo complete! All tasks executed successfully.');
      }
    }, 800);

    return interval;
  }
}

// Export singleton instance
window.activityFeed = new ActivityFeed();

