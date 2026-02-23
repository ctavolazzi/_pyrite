/**
 * @fileoverview Mock EventBus for Testing
 *
 * Reusable EventBus mock that tracks events and supports wildcard subscriptions.
 * Use this in tests to verify event emission and subscription behavior.
 *
 * @example
 * ```javascript
 * import { MockEventBus } from './helpers/mock-event-bus.js';
 *
 * const eventBus = new MockEventBus();
 * const events = [];
 *
 * eventBus.on('workeffort:*', (event) => events.push(event));
 * eventBus.emit('workeffort:created', { id: 'WE-123' });
 *
 * assert.strictEqual(events.length, 1);
 * assert.strictEqual(events[0].type, 'workeffort:created');
 * ```
 */

/**
 * Mock EventBus implementation for testing
 *
 * Features:
 * - Wildcard subscription support (`'workeffort:*'`)
 * - Middleware pipeline
 * - Event history tracking
 * - Pattern matching
 */
export class MockEventBus {
  constructor() {
    /** @type {Array<{type: string, data: any, timestamp: number}>} */
    this.events = [];

    /** @type {Map<string, Array<Function>>} */
    this.subscribers = new Map();

    /** @type {Array<Function>} */
    this.middleware = [];
  }

  /**
   * Subscribe to events matching a pattern
   * @param {string} pattern - Event pattern (supports wildcards: 'workeffort:*')
   * @param {Function} handler - Callback function
   */
  on(pattern, handler) {
    if (!this.subscribers.has(pattern)) {
      this.subscribers.set(pattern, []);
    }
    this.subscribers.get(pattern).push(handler);
  }

  /**
   * Emit an event
   * @param {string} type - Event type
   * @param {any} data - Event data
   */
  emit(type, data) {
    const eventData = { type, data, timestamp: Date.now() };

    // Run through middleware first
    let shouldContinue = true;
    for (const mw of this.middleware) {
      const result = mw(eventData);
      if (result === false) {
        shouldContinue = false;
        break;
      }
    }

    // If middleware blocked the event, don't emit
    if (!shouldContinue) {
      return;
    }

    // Track event
    this.events.push(eventData);

    // Trigger wildcard subscribers
    for (const [pattern, handlers] of this.subscribers) {
      if (this.matchesPattern(pattern, type)) {
        handlers.forEach(handler => handler({ type, data }));
      }
    }
  }

  /**
   * Add middleware function
   * @param {Function} middleware - Middleware function (returns false to block)
   * @returns {Function} Unsubscribe function
   */
  use(middleware) {
    this.middleware.push(middleware);
    return () => {
      const index = this.middleware.indexOf(middleware);
      if (index !== -1) this.middleware.splice(index, 1);
    };
  }

  /**
   * Check if event type matches pattern
   * @param {string} pattern - Pattern (supports wildcards)
   * @param {string} type - Event type
   * @returns {boolean}
   */
  matchesPattern(pattern, type) {
    if (pattern === type) return true;
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return type.startsWith(prefix);
    }
    return false;
  }

  /**
   * Clear all events and subscribers
   */
  clear() {
    this.events = [];
    this.subscribers.clear();
    this.middleware = [];
  }

  /**
   * Get all events of a specific type
   * @param {string} type - Event type
   * @returns {Array<{type: string, data: any, timestamp: number}>}
   */
  getEventsByType(type) {
    return this.events.filter(e => e.type === type);
  }

  /**
   * Get all events
   * @returns {Array<{type: string, data: any, timestamp: number}>}
   */
  getAllEvents() {
    return [...this.events];
  }

  /**
   * Get event count
   * @returns {number}
   */
  getEventCount() {
    return this.events.length;
  }
}

