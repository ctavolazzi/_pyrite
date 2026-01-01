// ============================================================================
// EventBus - Bulletproof Event Management System
// ============================================================================

/**
 * @fileoverview Mission Control Event System
 *
 * A lightweight, typed event system with:
 * - Middleware support for event interception
 * - Wildcard subscriptions (e.g., 'workeffort:*')
 * - Event history tracking
 * - Batched emissions for rapid events
 * - Metrics collection
 *
 * @author _pyrite
 * @version 0.6.2
 */

/**
 * Event Types Registry.
 * Each event type has metadata for handling behavior.
 * @type {Object.<string, {priority: string, duration?: number, animate?: string}>}
 */
const EVENT_TYPES = {
  // System events
  'system:connected': { priority: 'high', duration: 3000, animate: 'pulse' },
  'system:disconnected': { priority: 'critical', duration: 0, animate: 'shake' },
  'system:reconnecting': { priority: 'normal', duration: 5000, animate: 'pulse' },
  'system:error': { priority: 'critical', duration: 0, animate: 'shake' },

  // Work effort events
  'workeffort:created': { priority: 'high', duration: 8000, animate: 'slideIn' },
  'workeffort:updated': { priority: 'normal', duration: 5000, animate: 'highlight' },
  'workeffort:started': { priority: 'high', duration: 6000, animate: 'pulse' },
  'workeffort:completed': { priority: 'high', duration: 8000, animate: 'celebrate' },
  'workeffort:paused': { priority: 'normal', duration: 5000, animate: 'fadeIn' },
  'workeffort:deleted': { priority: 'normal', duration: 5000, animate: 'fadeOut' },

  // Ticket events
  'ticket:created': { priority: 'normal', duration: 5000, animate: 'slideIn' },
  'ticket:updated': { priority: 'low', duration: 4000, animate: 'highlight' },
  'ticket:completed': { priority: 'normal', duration: 5000, animate: 'pulse' },
  'ticket:blocked': { priority: 'high', duration: 8000, animate: 'shake' },

  // Repository events
  'repo:added': { priority: 'high', duration: 6000, animate: 'slideIn' },
  'repo:removed': { priority: 'normal', duration: 5000, animate: 'fadeOut' },
  'repo:synced': { priority: 'low', duration: 3000, animate: 'pulse' },

  // UI events (internal)
  'ui:toast': { priority: 'normal', duration: 5000 },
  'ui:modal:open': { priority: 'normal' },
  'ui:modal:close': { priority: 'normal' },
  'ui:navigate': { priority: 'normal' },
};

/**
 * Toast duration presets by notification type
 */
const TOAST_DURATIONS = {
  // Errors are persistent until dismissed (0 = no auto-dismiss)
  error: 0,
  critical: 0,

  // Warnings stay longer
  warning: 10000,

  // Success messages medium duration
  success: 6000,

  // Info is transient
  info: 5000,

  // System messages
  system: 8000,

  // Default fallback
  default: 5000,
};

/**
 * Animation CSS classes mapped to animation types
 */
const ANIMATIONS = {
  pulse: 'animate-pulse',
  shake: 'animate-shake',
  slideIn: 'animate-slide-in',
  fadeIn: 'animate-fade-in',
  fadeOut: 'animate-fade-out',
  highlight: 'animate-highlight',
  celebrate: 'animate-celebrate',
  bounce: 'animate-bounce',
};

/**
 * Central event management system.
 * Provides pub/sub pattern with wildcard support, middleware, and batching.
 *
 * @class
 * @example
 * const bus = new EventBus({ debug: true });
 * bus.on('workeffort:*', (event) => console.log(event));
 * bus.emit('workeffort:created', { id: 'WE-123' });
 */
class EventBus {
  /**
   * Create an EventBus instance.
   *
   * @param {Object} [options={}] - Configuration options
   * @param {number} [options.maxHistory=100] - Max events to keep in history
   * @param {boolean} [options.debug=false] - Enable debug logging
   * @param {number} [options.batchDelay=50] - Delay for batching rapid events
   */
  constructor(options = {}) {
    /** @type {Map<string, Set<Function>>} Event type -> listener functions */
    this.listeners = new Map();

    /** @type {Map<string, Set<Function>>} One-time listeners */
    this.onceListeners = new Map();

    /** @type {Array<Function>} Middleware functions */
    this.middleware = [];

    /** @type {Array<Object>} Event history */
    this.history = [];

    /** @type {number} Maximum history entries */
    this.maxHistory = options.maxHistory || 100;

    /** @type {boolean} Debug mode enabled */
    this.debug = options.debug || false;

    /** @type {boolean} Whether emissions are paused */
    this.paused = false;

    // Event queue for batching rapid events
    /** @type {Array<Object>} Queued events awaiting batch emission */
    this.queue = [];

    /** @type {number|null} Batch timeout ID */
    this.queueTimeout = null;

    /** @type {number} Batch delay in ms */
    this.batchDelay = options.batchDelay || 50;

    // Metrics
    this.metrics = {
      totalEmitted: 0,
      byType: new Map(),
      lastEmit: null,
    };
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name (supports wildcards: 'workeffort:*')
   * @param {Function} callback - Handler function
   * @param {Object} options - { priority: number, context: any }
   * @returns {Function} Unsubscribe function
   */
  on(event, callback, options = {}) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const listener = {
      callback,
      priority: options.priority || 0,
      context: options.context || null,
      id: this._generateId(),
    };

    this.listeners.get(event).push(listener);

    // Sort by priority (higher first)
    this.listeners.get(event).sort((a, b) => b.priority - a.priority);

    if (this.debug) {
      console.log(`[EventBus] Subscribed to "${event}"`, listener.id);
    }

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Subscribe to an event once
   */
  once(event, callback, options = {}) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      callback.apply(options.context || null, args);
    };
    return this.on(event, wrapper, options);
  }

  /**
   * Unsubscribe from an event
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;

    const listeners = this.listeners.get(event);
    const index = listeners.findIndex(l => l.callback === callback);

    if (index !== -1) {
      listeners.splice(index, 1);
      if (this.debug) {
        console.log(`[EventBus] Unsubscribed from "${event}"`);
      }
    }
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {any} data - Event payload
   * @param {Object} meta - Additional metadata
   */
  emit(event, data = {}, meta = {}) {
    if (this.paused) {
      this.queue.push({ event, data, meta, timestamp: Date.now() });
      return;
    }

    const eventData = {
      type: event,
      data,
      meta: {
        timestamp: Date.now(),
        ...EVENT_TYPES[event],
        ...meta,
      },
    };

    // Run through middleware
    let shouldContinue = true;
    for (const mw of this.middleware) {
      const result = mw(eventData);
      if (result === false) {
        shouldContinue = false;
        break;
      }
    }

    if (!shouldContinue) {
      if (this.debug) {
        console.log(`[EventBus] Event "${event}" blocked by middleware`);
      }
      return;
    }

    // Track metrics
    this.metrics.totalEmitted++;
    this.metrics.lastEmit = Date.now();
    this.metrics.byType.set(event, (this.metrics.byType.get(event) || 0) + 1);

    // Add to history
    this.history.push(eventData);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    if (this.debug) {
      console.log(`[EventBus] Emit "${event}"`, data);
    }

    // Call exact listeners
    this._callListeners(event, eventData);

    // Call wildcard listeners (e.g., 'workeffort:*' matches 'workeffort:created')
    const [namespace] = event.split(':');
    if (namespace) {
      this._callListeners(`${namespace}:*`, eventData);
    }

    // Call global listeners
    this._callListeners('*', eventData);
  }

  /**
   * Emit with batching for rapid events
   */
  emitBatched(event, data = {}, meta = {}) {
    this.queue.push({ event, data, meta, timestamp: Date.now() });

    if (this.queueTimeout) {
      clearTimeout(this.queueTimeout);
    }

    this.queueTimeout = setTimeout(() => {
      this._flushQueue();
    }, this.batchDelay);
  }

  _flushQueue() {
    const events = [...this.queue];
    this.queue = [];

    // Group by event type
    const grouped = new Map();
    for (const evt of events) {
      if (!grouped.has(evt.event)) {
        grouped.set(evt.event, []);
      }
      grouped.get(evt.event).push(evt);
    }

    // Emit grouped events
    for (const [event, items] of grouped) {
      if (items.length === 1) {
        this.emit(event, items[0].data, items[0].meta);
      } else {
        // Batch multiple same-type events
        this.emit(event, {
          batch: true,
          count: items.length,
          items: items.map(i => i.data),
        }, { batched: true });
      }
    }
  }

  _callListeners(event, eventData) {
    const listeners = this.listeners.get(event) || [];

    for (const listener of listeners) {
      try {
        listener.callback.call(listener.context, eventData);
      } catch (error) {
        console.error(`[EventBus] Error in listener for "${event}":`, error);
      }
    }
  }

  /**
   * Add middleware to intercept all events
   * @param {Function} fn - Middleware function. Return false to stop propagation.
   */
  use(fn) {
    this.middleware.push(fn);
    return () => {
      const index = this.middleware.indexOf(fn);
      if (index !== -1) this.middleware.splice(index, 1);
    };
  }

  /**
   * Pause event emission (queue events)
   */
  pause() {
    this.paused = true;
  }

  /**
   * Resume and flush queued events
   */
  resume() {
    this.paused = false;
    this._flushQueue();
  }

  /**
   * Get event history
   */
  getHistory(filter = null) {
    if (!filter) return [...this.history];
    return this.history.filter(e => e.type.includes(filter));
  }

  /**
   * Clear all listeners
   */
  clear() {
    this.listeners.clear();
    this.onceListeners.clear();
    this.middleware = [];
    this.history = [];
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      byType: Object.fromEntries(this.metrics.byType),
      listenerCount: Array.from(this.listeners.values()).reduce((sum, l) => sum + l.length, 0),
    };
  }

  _generateId() {
    return Math.random().toString(36).substring(2, 9);
  }
}

/**
 * Enhanced toast notification system.
 * Provides type-based durations, progress bars, pause on hover,
 * action buttons, and maximum visible limit.
 *
 * @class
 * @example
 * const manager = new ToastManager(container, eventBus, { maxVisible: 5 });
 * manager.show({ type: 'success', title: 'Done!', message: 'Task completed' });
 */
class ToastManager {
  /**
   * Create a ToastManager instance.
   *
   * @param {HTMLElement} container - DOM container for toast notifications
   * @param {EventBus} eventBus - Event bus for toast events
   * @param {Object} [options={}] - Configuration options
   * @param {number} [options.maxVisible=5] - Maximum visible toasts
   * @param {number} [options.defaultDuration] - Default toast duration in ms
   * @param {string} [options.position='bottom-right'] - Position on screen
   */
  constructor(container, eventBus, options = {}) {
    /** @type {HTMLElement} Toast container element */
    this.container = container;

    /** @type {EventBus} Event bus reference */
    this.eventBus = eventBus;

    /** @type {Map<string, Object>} Active toasts by ID */
    this.toasts = new Map();

    /** @type {number} Maximum visible toasts */
    this.maxVisible = options.maxVisible || 5;

    /** @type {number} Default duration in ms */
    this.defaultDuration = options.defaultDuration || TOAST_DURATIONS.default;

    /** @type {string} Toast position */
    this.position = options.position || 'bottom-right';

    /** @type {number} Toast ID counter */
    this.idCounter = 0;

    // Initialize container positioning
    this._setupContainer();
  }

  _setupContainer() {
    if (!this.container) return;

    // Ensure container has proper styling for stacking
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column-reverse';
    this.container.style.gap = 'var(--space-sm, 8px)';
    this.container.style.maxHeight = '80vh';
    this.container.style.overflowY = 'auto';
    this.container.style.overflowX = 'hidden';
  }

  /**
   * Show a toast notification
   * @param {Object} options
   * @param {string} options.type - 'info' | 'success' | 'warning' | 'error' | 'system'
   * @param {string} options.title - Toast title
   * @param {string} options.message - Toast body
   * @param {number} options.duration - Override duration (0 = persistent)
   * @param {boolean} options.dismissable - Can be manually dismissed (default: true)
   * @param {Array} options.actions - Action buttons [{label, action, primary}]
   * @param {Function} options.onClick - Callback when toast is clicked
   * @param {Object} options.data - Arbitrary data
   * @returns {string} Toast ID
   */
  show(options) {
    const id = `toast-${++this.idCounter}`;
    const type = options.type || 'info';
    const duration = options.duration !== undefined
      ? options.duration
      : TOAST_DURATIONS[type] || this.defaultDuration;

    // Check if we need to dismiss old toasts
    this._enforceMaxVisible();

    const toast = this._createToastElement(id, {
      ...options,
      type,
      duration,
    });

    // Store toast state
    this.toasts.set(id, {
      element: toast,
      options,
      createdAt: Date.now(),
      timer: null,
      remaining: duration,
      isPaused: false,
    });

    // Append to container (bottom of stack)
    this.container?.insertBefore(toast, this.container.firstChild);

    // Trigger enter animation
    requestAnimationFrame(() => {
      toast.classList.add('entering');
      setTimeout(() => toast.classList.remove('entering'), 300);
    });

    // Start auto-dismiss timer (if duration > 0)
    if (duration > 0) {
      this._startTimer(id);
    }

    // Emit event
    this.eventBus?.emit('ui:toast', { action: 'show', id, type, title: options.title });

    return id;
  }

  _createToastElement(id, options) {
    const { type, title, message, duration, dismissable = true, actions, onClick } = options;

    const toast = document.createElement('div');
    toast.id = id;
    toast.className = `toast toast-${type}`;
    toast.dataset.type = type;
    toast.dataset.persistent = duration === 0 ? 'true' : 'false';

    // Icon based on type
    const icons = {
      info: 'ℹ️',
      success: '✓',
      warning: '⚠',
      error: '✕',
      system: '⚙',
    };

    toast.innerHTML = `
      <div class="toast-glow"></div>
      <div class="toast-header">
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-indicator"></span>
        <span class="toast-title">${this._escapeHtml(title)}</span>
        ${dismissable ? '<button class="toast-close" aria-label="Dismiss">×</button>' : ''}
      </div>
      <div class="toast-body">
        <p class="toast-message">${this._escapeHtml(message)}</p>
        ${actions?.length ? `
          <div class="toast-actions">
            ${actions.map((action, i) => `
              <button class="toast-action ${action.primary ? 'primary' : ''}" data-action-index="${i}">
                ${this._escapeHtml(action.label)}
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
      ${duration > 0 ? `
        <div class="toast-progress">
          <div class="toast-progress-bar" style="width: 100%"></div>
        </div>
      ` : ''}
    `;

    // Bind events
    this._bindToastEvents(toast, id, options);

    return toast;
  }

  _bindToastEvents(toast, id, options) {
    const closeBtn = toast.querySelector('.toast-close');
    const actionBtns = toast.querySelectorAll('.toast-action');

    // Close button
    closeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.dismiss(id);
    });

    // Action buttons
    actionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.actionIndex, 10);
        options.actions?.[index]?.action?.();
        this.dismiss(id);
      });
    });

    // Click handler (if provided)
    if (options.onClick) {
      toast.style.cursor = 'pointer';
      toast.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
          options.onClick();
          this.dismiss(id);
        }
      });
    }

    // Pause timer on hover
    toast.addEventListener('mouseenter', () => this._pauseTimer(id));
    toast.addEventListener('mouseleave', () => this._resumeTimer(id));
  }

  _startTimer(id) {
    const toastState = this.toasts.get(id);
    if (!toastState || toastState.remaining <= 0) return;

    const progressBar = toastState.element.querySelector('.toast-progress-bar');
    const tick = 50; // Update every 50ms for smooth animation
    const totalDuration = toastState.remaining;

    toastState.startTime = Date.now();

    toastState.timer = setInterval(() => {
      if (toastState.isPaused) return;

      const elapsed = Date.now() - toastState.startTime;
      toastState.remaining = totalDuration - elapsed;

      if (progressBar) {
        const percent = Math.max(0, (toastState.remaining / totalDuration) * 100);
        progressBar.style.width = `${percent}%`;
      }

      if (toastState.remaining <= 0) {
        clearInterval(toastState.timer);
        this.dismiss(id);
      }
    }, tick);
  }

  _pauseTimer(id) {
    const toastState = this.toasts.get(id);
    if (!toastState || !toastState.timer) return;

    toastState.isPaused = true;
    toastState.element.classList.add('paused');
  }

  _resumeTimer(id) {
    const toastState = this.toasts.get(id);
    if (!toastState) return;

    toastState.isPaused = false;
    toastState.element.classList.remove('paused');
    toastState.startTime = Date.now();
  }

  _enforceMaxVisible() {
    const visible = Array.from(this.toasts.entries())
      .filter(([_, state]) => !state.element.classList.contains('exiting'));

    while (visible.length >= this.maxVisible) {
      // Dismiss oldest non-persistent toast
      const oldest = visible.find(([_, state]) =>
        state.element.dataset.persistent !== 'true'
      );

      if (oldest) {
        this.dismiss(oldest[0], { reason: 'max-visible' });
        visible.shift();
      } else {
        break; // All remaining are persistent
      }
    }
  }

  /**
   * Dismiss a toast
   * @param {string} id - Toast ID
   * @param {Object} options - { reason: string }
   */
  dismiss(id, options = {}) {
    const toastState = this.toasts.get(id);
    if (!toastState) return;

    // Clear timer
    if (toastState.timer) {
      clearInterval(toastState.timer);
    }

    const toast = toastState.element;
    toast.classList.add('exiting');

    // Remove after animation
    setTimeout(() => {
      toast.remove();
      this.toasts.delete(id);

      this.eventBus?.emit('ui:toast', {
        action: 'dismiss',
        id,
        reason: options.reason || 'manual'
      });
    }, 300);
  }

  /**
   * Dismiss all toasts
   */
  dismissAll() {
    for (const id of this.toasts.keys()) {
      this.dismiss(id, { reason: 'dismiss-all' });
    }
  }

  /**
   * Get active toast count
   */
  getCount() {
    return this.toasts.size;
  }

  _escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

/**
 * UI animation controller triggered by events.
 * Provides element-specific animations, celebration effects,
 * and selector-based batch animations.
 *
 * @class
 * @example
 * const controller = new AnimationController(eventBus);
 * controller.animate(element, 'pulse', { duration: 1000 });
 */
class AnimationController {
  /**
   * Create an AnimationController instance.
   *
   * @param {EventBus} eventBus - Event bus to listen for animation triggers
   */
  constructor(eventBus) {
    /** @type {EventBus} Event bus reference */
    this.eventBus = eventBus;

    /** @type {Map<HTMLElement, string>} Active animations by element */
    this.activeAnimations = new Map();

    /** @type {Array<Object>} Queued animations */
    this.animationQueue = [];

    // Subscribe to events
    this._setupListeners();
  }

  _setupListeners() {
    // Listen to all events with animations
    this.eventBus.on('*', (event) => {
      const animation = event.meta?.animate;
      if (animation && ANIMATIONS[animation]) {
        this._triggerGlobalAnimation(animation, event);
      }
    });
  }

  /**
   * Animate a specific element
   * @param {HTMLElement} element
   * @param {string} animation - Animation name from ANIMATIONS
   * @param {Object} options - { duration, delay, onComplete }
   */
  animate(element, animation, options = {}) {
    if (!element || !ANIMATIONS[animation]) return;

    const className = ANIMATIONS[animation];
    const duration = options.duration || 500;
    const delay = options.delay || 0;

    const id = `anim-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    setTimeout(() => {
      element.classList.add(className);

      this.activeAnimations.set(id, {
        element,
        animation,
        startTime: Date.now(),
      });

      setTimeout(() => {
        element.classList.remove(className);
        this.activeAnimations.delete(id);
        options.onComplete?.();
      }, duration);
    }, delay);

    return id;
  }

  /**
   * Animate elements matching a selector
   */
  animateSelector(selector, animation, options = {}) {
    const elements = document.querySelectorAll(selector);
    const stagger = options.stagger || 0;

    elements.forEach((el, i) => {
      this.animate(el, animation, {
        ...options,
        delay: (options.delay || 0) + (i * stagger),
      });
    });
  }

  /**
   * Trigger global animation effects
   */
  _triggerGlobalAnimation(animation, event) {
    // Find elements related to this event
    const { type, data } = event;

    // Work effort animations
    if (type.startsWith('workeffort:')) {
      const weId = data?.id || data?.weId;
      if (weId) {
        const selector = `[data-we-id="${weId}"]`;
        this.animateSelector(selector, animation, { stagger: 50 });
      }
    }

    // Ticket animations
    if (type.startsWith('ticket:')) {
      const ticketId = data?.id || data?.ticketId;
      if (ticketId) {
        const selector = `[data-ticket-id="${ticketId}"]`;
        this.animateSelector(selector, animation, { stagger: 30 });
      }
    }

    // Stats counter animation
    if (type.includes('created') || type.includes('completed')) {
      this.animateSelector('.stat-value', 'pulse', { stagger: 100 });
    }

    // Error shake
    if (type.includes('error') || type.includes('blocked')) {
      this.animate(document.querySelector('.app'), 'shake');
    }

    // Celebration for completed work efforts
    if (type === 'workeffort:completed') {
      this._celebrationEffect();
    }
  }

  _celebrationEffect() {
    // Quick confetti-like effect using DOM elements
    const container = document.querySelector('.main-content');
    if (!container) return;

    const colors = ['#ff9d3d', '#10b981', '#3b9eff', '#f472b6'];
    const particles = 20;

    for (let i = 0; i < particles; i++) {
      const particle = document.createElement('div');
      particle.className = 'celebration-particle';
      particle.style.cssText = `
        position: fixed;
        width: 10px;
        height: 10px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        left: ${50 + (Math.random() - 0.5) * 20}%;
        top: 50%;
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        animation: celebration-particle ${0.5 + Math.random() * 0.5}s ease-out forwards;
        animation-delay: ${Math.random() * 0.2}s;
        --tx: ${(Math.random() - 0.5) * 200}px;
        --ty: ${-100 - Math.random() * 200}px;
        --rotation: ${Math.random() * 360}deg;
      `;
      document.body.appendChild(particle);

      setTimeout(() => particle.remove(), 1500);
    }
  }

  /**
   * Stop all animations
   */
  stopAll() {
    for (const [id, { element, animation }] of this.activeAnimations) {
      element.classList.remove(ANIMATIONS[animation]);
    }
    this.activeAnimations.clear();
  }
}

// Export for use
window.EventBus = EventBus;
window.ToastManager = ToastManager;
window.AnimationController = AnimationController;
window.EVENT_TYPES = EVENT_TYPES;
window.TOAST_DURATIONS = TOAST_DURATIONS;
window.ANIMATIONS = ANIMATIONS;

// Create global instance
window.eventBus = new EventBus({ debug: false });

