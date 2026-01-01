/**
 * @fileoverview Command Input Component
 *
 * Conversational command interface for the Command Center.
 * Supports commands like: start, pause, complete, create ticket, status
 *
 * @author _pyrite
 * @version 0.6.3
 */

/**
 * Command Input Manager
 * Handles command parsing and execution for the Command Center.
 */
class CommandInput {
  constructor() {
    /** @type {HTMLInputElement|null} */
    this.input = null;

    /** @type {HTMLButtonElement|null} */
    this.submitBtn = null;

    /** @type {Array<{command: string, description: string, aliases: string[]}>} */
    this.commands = [
      { command: 'start', description: 'Start working on next ticket', aliases: ['begin', 'go'] },
      { command: 'pause', description: 'Pause current work', aliases: ['stop', 'hold'] },
      { command: 'complete', description: 'Mark current ticket as done', aliases: ['done', 'finish'] },
      { command: 'status', description: 'Show current work status', aliases: ['info', 'stats'] },
      { command: 'create ticket', description: 'Create a new ticket', aliases: ['new ticket', 'add ticket'] },
      { command: 'help', description: 'Show available commands', aliases: ['?', 'commands'] },
      { command: 'demo', description: 'Run activity demo', aliases: ['test'] },
      { command: 'clear', description: 'Clear activity feed', aliases: ['cls'] }
    ];

    /** @type {Array<string>} */
    this.history = [];

    /** @type {number} */
    this.historyIndex = -1;

    /** @type {boolean} */
    this.initialized = false;

    /** @type {Function|null} */
    this.onCommand = null;
  }

  /**
   * Initialize the command input.
   */
  init() {
    this.input = document.getElementById('commandInput');
    this.submitBtn = document.getElementById('commandSubmitBtn');

    if (!this.input) {
      console.warn('CommandInput: Input not found');
      return;
    }

    // Submit on Enter
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.submit();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.navigateHistory(-1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.navigateHistory(1);
      } else if (e.key === 'Escape') {
        this.clear();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        this.autocomplete();
      }
    });

    // Submit button click
    if (this.submitBtn) {
      this.submitBtn.addEventListener('click', () => this.submit());
    }

    this.initialized = true;
    console.log('CommandInput initialized');
  }

  /**
   * Submit the current command.
   */
  submit() {
    if (!this.initialized) return;

    const text = this.input.value.trim();
    if (!text) return;

    // Add to history
    this.history.push(text);
    this.historyIndex = this.history.length;

    // Clear input
    this.input.value = '';

    // Parse and execute
    this.execute(text);
  }

  /**
   * Execute a command.
   * @param {string} text - Raw command text
   */
  execute(text) {
    const { command, args } = this.parse(text);

    // Log to activity feed
    if (window.activityFeed) {
      window.activityFeed.add('command', `> ${text}`);
    }

    // Execute command
    switch (command) {
      case 'start':
      case 'begin':
      case 'go':
        this.handleStart(args);
        break;

      case 'pause':
      case 'stop':
      case 'hold':
        this.handlePause();
        break;

      case 'complete':
      case 'done':
      case 'finish':
        this.handleComplete(args);
        break;

      case 'status':
      case 'info':
      case 'stats':
        this.handleStatus();
        break;

      case 'create':
        if (args.startsWith('ticket')) {
          this.handleCreateTicket(args.replace('ticket', '').trim());
        } else {
          this.handleUnknown(text);
        }
        break;

      case 'new':
      case 'add':
        if (args.startsWith('ticket')) {
          this.handleCreateTicket(args.replace('ticket', '').trim());
        } else {
          this.handleUnknown(text);
        }
        break;

      case 'help':
      case '?':
      case 'commands':
        this.handleHelp();
        break;

      case 'demo':
      case 'test':
        this.handleDemo();
        break;

      case 'clear':
      case 'cls':
        this.handleClear();
        break;

      default:
        this.handleUnknown(text);
    }

    // Notify callback
    if (this.onCommand) {
      this.onCommand(command, args, text);
    }
  }

  /**
   * Parse command text.
   * @param {string} text - Raw text
   * @returns {{command: string, args: string}} Parsed result
   */
  parse(text) {
    const lower = text.toLowerCase();
    const parts = lower.split(/\s+/);
    const command = parts[0] || '';
    const args = parts.slice(1).join(' ');
    return { command, args };
  }

  /**
   * Handle start command.
   * @param {string} args - Command arguments
   */
  handleStart(args) {
    if (window.activityFeed) {
      if (args) {
        window.activityFeed.add('action', `Starting ticket: ${args}`);
      } else {
        const next = window.workQueue?.getNextPending();
        if (next) {
          window.activityFeed.add('action', `Starting next ticket: ${next.id}`);
          window.workQueue.updateTicketStatus(next.id, 'in_progress');
        } else {
          window.activityFeed.add('info', 'No pending tickets to start');
        }
      }
    }
  }

  /**
   * Handle pause command.
   */
  handlePause() {
    if (window.activityFeed) {
      window.activityFeed.add('action', 'Pausing current work...');
      window.activityFeed.add('success', 'Work paused');
    }
  }

  /**
   * Handle complete command.
   * @param {string} args - Command arguments
   */
  handleComplete(args) {
    if (window.activityFeed) {
      if (window.workQueue) {
        const inProgress = window.workQueue.getByStatus('in_progress');
        if (inProgress.length > 0) {
          const ticket = inProgress[0];
          window.activityFeed.add('success', `Completed: ${ticket.id}`);
          window.workQueue.updateTicketStatus(ticket.id, 'completed');
        } else {
          window.activityFeed.add('info', 'No tickets currently in progress');
        }
      } else {
        window.activityFeed.add('success', 'Ticket marked as complete');
      }
    }
  }

  /**
   * Handle status command.
   */
  handleStatus() {
    if (window.activityFeed) {
      if (window.workQueue) {
        const stats = window.workQueue.getStats();
        window.activityFeed.add('info', `Total: ${stats.total} tickets`);
        window.activityFeed.add('info', `In Progress: ${stats.inProgress}`);
        window.activityFeed.add('info', `Pending: ${stats.pending}`);
        window.activityFeed.add('info', `Completed: ${stats.completed}`);
        window.activityFeed.add('info', `Progress: ${stats.progress}%`);
      } else {
        window.activityFeed.add('info', 'Work queue not available');
      }
    }
  }

  /**
   * Handle create ticket command.
   * @param {string} title - Ticket title
   */
  handleCreateTicket(title) {
    if (window.activityFeed) {
      if (title) {
        window.activityFeed.add('action', `Creating ticket: ${title}`);

        // Add to queue if available
        if (window.workQueue) {
          const id = `TKT-new-${String(Date.now()).slice(-3)}`;
          window.workQueue.addTicket({
            id,
            title,
            status: 'pending'
          });
          window.activityFeed.add('success', `Created ticket: ${id}`);
        }
      } else {
        window.activityFeed.add('warning', 'Usage: create ticket <title>');
      }
    }
  }

  /**
   * Handle help command.
   */
  handleHelp() {
    if (window.activityFeed) {
      window.activityFeed.addHighlight('Available Commands:');
      for (const cmd of this.commands) {
        window.activityFeed.add('info', `  ${cmd.command} — ${cmd.description}`);
      }
    }
  }

  /**
   * Handle demo command.
   */
  handleDemo() {
    if (window.activityFeed) {
      window.activityFeed.add('action', 'Starting demo...');
      window.activityFeed.runDemo();
    }
    if (window.workQueue) {
      window.workQueue.loadDemo();
    }
  }

  /**
   * Handle clear command.
   */
  handleClear() {
    if (window.activityFeed) {
      window.activityFeed.clear();
    }
  }

  /**
   * Handle unknown command.
   * @param {string} text - Original text
   */
  handleUnknown(text) {
    if (window.activityFeed) {
      window.activityFeed.add('warning', `Unknown command: ${text}`);
      window.activityFeed.add('info', 'Type "help" for available commands');
    }
  }

  /**
   * Navigate command history.
   * @param {number} direction - -1 for up, 1 for down
   */
  navigateHistory(direction) {
    if (this.history.length === 0) return;

    this.historyIndex += direction;

    if (this.historyIndex < 0) {
      this.historyIndex = 0;
    } else if (this.historyIndex >= this.history.length) {
      this.historyIndex = this.history.length;
      this.input.value = '';
      return;
    }

    this.input.value = this.history[this.historyIndex] || '';
  }

  /**
   * Autocomplete current input.
   */
  autocomplete() {
    const text = this.input.value.toLowerCase().trim();
    if (!text) return;

    // Find matching command
    for (const cmd of this.commands) {
      if (cmd.command.startsWith(text)) {
        this.input.value = cmd.command;
        return;
      }
      for (const alias of cmd.aliases) {
        if (alias.startsWith(text)) {
          this.input.value = alias;
          return;
        }
      }
    }
  }

  /**
   * Clear the input.
   */
  clear() {
    if (this.input) {
      this.input.value = '';
    }
    this.historyIndex = this.history.length;
  }

  /**
   * Focus the input.
   */
  focus() {
    if (this.input) {
      this.input.focus();
    }
  }

  /**
   * Set placeholder text.
   * @param {string} text - Placeholder text
   */
  setPlaceholder(text) {
    if (this.input) {
      this.input.placeholder = text;
    }
  }
}

// Export singleton instance
window.commandInput = new CommandInput();

