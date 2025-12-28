// ============================================================================
// Mission Control V2 - Command Center Application
// ============================================================================

class MissionControl {
  constructor() {
    this.ws = null;
    this.repos = {};
    this.selectedItem = null;
    this.currentFilter = 'all';
    this.searchQuery = '';
    this.reconnectAttempts = 0;
    this.maxReconnectDelay = 30000;
    this.baseReconnectDelay = 1000;

    // Activity tracking
    this.isWindowFocused = document.hasFocus();
    this.lastActivityTime = Date.now();
    this.idleThreshold = 30000; // 30 seconds
    this.activityState = 'active'; // 'active', 'idle', 'away'
    this.activityCheckInterval = null;

    // Notification center
    this.notifications = [];
    this.unreadCount = 0;
    this.isPanelOpen = false;

    // Event system - initialized after bindElements
    this.eventBus = window.eventBus || new EventBus({ debug: false });
    this.toastManager = null;
    this.animationController = null;

    this.elements = {};
    this.bindElements();
    this.bindEvents();
    this.initEventSystem();
    this.connect();
    this.startActivityTracking();
  }

  // ============================================================================
  // Event System Integration
  // ============================================================================

  initEventSystem() {
    // Initialize toast manager with container
    this.toastManager = new ToastManager(
      this.elements.toastContainer,
      this.eventBus,
      { maxVisible: 5, position: 'bottom-right' }
    );

    // Initialize animation controller
    this.animationController = new AnimationController(this.eventBus);

    // Subscribe to events for notification center integration
    this.eventBus.on('workeffort:*', (event) => this.handleWorkEffortEvent(event));
    this.eventBus.on('ticket:*', (event) => this.handleTicketEvent(event));
    this.eventBus.on('repo:*', (event) => this.handleRepoEvent(event));
    this.eventBus.on('system:*', (event) => this.handleSystemEvent(event));

    // Middleware for logging (optional, for debugging)
    if (window.location.search.includes('debug=events')) {
      this.eventBus.use((event) => {
        console.log(`[Event] ${event.type}`, event.data);
        return true;
      });
    }
  }

  handleWorkEffortEvent(event) {
    const { type, data } = event;
    const action = type.split(':')[1];

    const titles = {
      created: '📋 New Work Effort',
      updated: '📝 Updated',
      started: '▶️ Started',
      completed: '✅ Completed',
      paused: '⏸️ Paused',
      deleted: '🗑️ Deleted',
    };

    const toastTypes = {
      created: 'info',
      updated: 'info',
      started: 'success',
      completed: 'success',
      paused: 'warning',
      deleted: 'warning',
    };

    // Show toast or queue notification based on activity
    this.smartNotify({
      type: toastTypes[action] || 'info',
      title: titles[action] || 'Work Effort',
      message: data.title || data.id,
      data: { eventType: type, ...data },
      onClick: () => {
        if (data.repo && data.we) {
          this.showDetail(data.repo, data.we);
        }
      },
    });
  }

  handleTicketEvent(event) {
    const { type, data } = event;
    const action = type.split(':')[1];

    const titles = {
      created: '🎫 New Ticket',
      updated: '📝 Ticket Updated',
      completed: '✅ Ticket Done',
      blocked: '🚫 Ticket Blocked',
    };

    const toastTypes = {
      created: 'info',
      updated: 'info',
      completed: 'success',
      blocked: 'error',
    };

    this.smartNotify({
      type: toastTypes[action] || 'info',
      title: titles[action] || 'Ticket',
      message: data.title || data.id,
      data: { eventType: type, ...data },
    });
  }

  handleRepoEvent(event) {
    const { type, data } = event;
    const action = type.split(':')[1];

    const messages = {
      added: `Repository "${data.name}" added`,
      removed: `Repository "${data.name}" removed`,
      synced: `Repository "${data.name}" synced`,
    };

    this.smartNotify({
      type: action === 'removed' ? 'warning' : 'success',
      title: action === 'added' ? '📁 Repo Added' : action === 'removed' ? '📁 Repo Removed' : '🔄 Synced',
      message: messages[action] || data.name,
      data: { eventType: type, ...data },
    });
  }

  handleSystemEvent(event) {
    const { type, data } = event;
    const action = type.split(':')[1];

    if (action === 'connected') {
      this.toastManager.show({
        type: 'success',
        title: '🔗 Connected',
        message: 'Mission Control is online',
        duration: 3000,
      });
    } else if (action === 'disconnected') {
      this.toastManager.show({
        type: 'error',
        title: '⚠️ Disconnected',
        message: 'Connection lost. Attempting to reconnect...',
        duration: 0, // Persistent until reconnected
      });
    } else if (action === 'error') {
      this.toastManager.show({
        type: 'error',
        title: '❌ Error',
        message: data.message || 'An error occurred',
        duration: 0,
      });
    }
  }

  /**
   * Smart notification routing based on user activity
   */
  smartNotify(options) {
    const shouldQueue = !this.isWindowFocused ||
                        this.activityState === 'idle' ||
                        this.activityState === 'away' ||
                        this.isPanelOpen;

    if (shouldQueue) {
      // Queue to notification center
      this.addNotification({
        type: options.type,
        title: options.title,
        message: options.message,
        timestamp: Date.now(),
        data: options.data,
        onClick: options.onClick,
      });

      // Also trigger browser notification if window not focused
      if (!this.isWindowFocused) {
        this.triggerBackgroundAlert(options.title, options.message);
      }
    } else {
      // Show toast immediately
      this.toastManager.show({
        type: options.type,
        title: options.title,
        message: options.message,
        duration: options.duration,
        onClick: options.onClick,
        actions: options.actions,
      });
    }
  }

  // ============================================================================
  // DOM Binding
  // ============================================================================

  bindElements() {
    // Sidebar
    this.elements.sidebar = document.getElementById('sidebar');
    this.elements.sidebarToggle = document.getElementById('sidebarToggle');
    this.elements.searchInput = document.getElementById('searchInput');
    this.elements.searchClear = document.getElementById('searchClear');
    this.elements.searchResults = document.getElementById('searchResults');
    this.elements.treeLoading = document.getElementById('treeLoading');
    this.elements.treeContainer = document.getElementById('treeContainer');
    this.elements.connectionStatus = document.getElementById('connectionStatus');
    this.elements.statusText = this.elements.connectionStatus?.querySelector('.status-text');

    // Main Content
    this.elements.mobileMenuBtn = document.getElementById('mobileMenuBtn');
    this.elements.breadcrumb = document.getElementById('breadcrumb');
    this.elements.dashboardView = document.getElementById('dashboardView');
    this.elements.detailView = document.getElementById('detailView');
    this.elements.detailContent = document.getElementById('detailContent');
    this.elements.backBtn = document.getElementById('backBtn');

    // Stats
    this.elements.statRepos = document.getElementById('statRepos');
    this.elements.statWorkEfforts = document.getElementById('statWorkEfforts');
    this.elements.statTickets = document.getElementById('statTickets');
    this.elements.statActive = document.getElementById('statActive');

    // Queue
    this.elements.queueContainer = document.getElementById('queueContainer');
    this.elements.queueList = document.getElementById('queueList');
    this.elements.queueEmpty = document.getElementById('queueEmpty');

    // Detail view elements (new design)
    this.elements.detailTitle = document.getElementById('detailTitle');
    this.elements.detailMeta = document.getElementById('detailMeta');
    this.elements.metadataGrid = document.getElementById('metadataGrid');
    this.elements.ticketsList = document.getElementById('ticketsList');

    // Toast & Modal
    this.elements.toastContainer = document.getElementById('toastContainer');
    this.elements.modalOverlay = document.getElementById('modalOverlay');
    this.elements.modal = document.getElementById('modal');
    this.elements.modalTitle = document.getElementById('modalTitle');
    this.elements.modalBody = document.getElementById('modalBody');
    this.elements.modalClose = document.getElementById('modalClose');
    this.elements.modalDismiss = document.getElementById('modalDismiss');
    this.elements.modalOpen = document.getElementById('modalOpen');

    // Notification Center
    this.elements.notificationBell = document.getElementById('notificationBell');
    this.elements.bellBtn = document.getElementById('bellBtn');
    this.elements.bellBadge = document.getElementById('bellBadge');
    this.elements.notificationPanel = document.getElementById('notificationPanel');
    this.elements.notificationList = document.getElementById('notificationList');
    this.elements.clearAllNotifications = document.getElementById('clearAllNotifications');

    // Activity Indicator
    this.elements.activityIndicator = document.getElementById('activityIndicator');
    this.elements.activityDot = this.elements.activityIndicator?.querySelector('.activity-dot');
    this.elements.activityText = this.elements.activityIndicator?.querySelector('.activity-text');

    // Repo Browser
    this.elements.addRepoBtn = document.getElementById('addRepoBtn');
    this.elements.addRepoOverlay = document.getElementById('addRepoOverlay');
    this.elements.addRepoClose = document.getElementById('addRepoClose');
    this.elements.addRepoCancel = document.getElementById('addRepoCancel');
    this.elements.addRepoConfirm = document.getElementById('addRepoConfirm');
    this.elements.browserUp = document.getElementById('browserUp');
    this.elements.browserRefresh = document.getElementById('browserRefresh');
    this.elements.browserPath = document.getElementById('browserPath');
    this.elements.browserList = document.getElementById('browserList');

    // About Modal & Hero
    this.elements.aboutBtn = document.getElementById('aboutBtn');
    this.elements.aboutOverlay = document.getElementById('aboutOverlay');
    this.elements.aboutClose = document.getElementById('aboutClose');
    this.elements.heroBanner = document.querySelector('.hero-banner');
    this.elements.heroDismiss = document.getElementById('heroDismiss');
    this.elements.footerDocs = document.getElementById('footerDocs');
    this.elements.footerGithub = document.getElementById('footerGithub');

    // Test System
    this.elements.testSystemBtn = document.getElementById('testSystemBtn');
    this.elements.testResults = document.getElementById('testResults');
    this.elements.testResultsBody = document.getElementById('testResultsBody');
    this.elements.testResultsSummary = document.getElementById('testResultsSummary');
    this.elements.testResultsClose = document.getElementById('testResultsClose');

    // Demo System
    this.elements.demoBtn = document.getElementById('demoBtn');
    this.elements.demoPanel = document.getElementById('demoPanel');
    this.elements.demoPanelSteps = document.getElementById('demoPanelSteps');
    this.elements.demoPanelFooter = document.getElementById('demoPanelFooter');
    this.elements.demoPanelClose = document.getElementById('demoPanelClose');
  }

  bindEvents() {
    // Sidebar toggle
    this.elements.sidebarToggle?.addEventListener('click', () => this.toggleSidebar());
    this.elements.mobileMenuBtn?.addEventListener('click', () => this.toggleMobileSidebar());

    // Search
    this.elements.searchInput?.addEventListener('input', (e) => this.handleSearch(e.target.value));
    this.elements.searchClear?.addEventListener('click', () => this.clearSearch());

    // View toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => this.toggleView(btn.dataset.view));
    });

    // Queue filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => this.setFilter(btn.dataset.filter));
    });

    // Back button
    this.elements.backBtn?.addEventListener('click', () => this.showDashboard());

    // Modal
    this.elements.modalClose?.addEventListener('click', () => this.closeModal());
    this.elements.modalDismiss?.addEventListener('click', () => this.closeModal());
    this.elements.modalOpen?.addEventListener('click', () => this.openFromModal());
    this.elements.modalOverlay?.addEventListener('click', (e) => {
      if (e.target === this.elements.modalOverlay) this.closeModal();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));

    // Notification bell
    this.elements.bellBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleNotificationPanel();
    });
    this.elements.clearAllNotifications?.addEventListener('click', () => this.clearAllNotifications());

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isPanelOpen && !this.elements.notificationBell?.contains(e.target)) {
        this.closeNotificationPanel();
      }
    });

    // Activity tracking events
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, () => this.recordActivity(), { passive: true });
    });

    // Window focus events
    window.addEventListener('focus', () => this.handleWindowFocus(true));
    window.addEventListener('blur', () => this.handleWindowFocus(false));

    // Visibility change (tab switching)
    document.addEventListener('visibilitychange', () => {
      this.handleWindowFocus(!document.hidden);
    });

    // Repo Browser
    this.elements.addRepoBtn?.addEventListener('click', () => this.openRepoBrowser());
    this.elements.addRepoClose?.addEventListener('click', () => this.closeRepoBrowser());
    this.elements.addRepoCancel?.addEventListener('click', () => this.closeRepoBrowser());
    this.elements.addRepoConfirm?.addEventListener('click', () => this.confirmAddRepos());
    this.elements.browserUp?.addEventListener('click', () => this.browseParent());
    this.elements.browserRefresh?.addEventListener('click', () => this.refreshBrowser());
    this.elements.addRepoOverlay?.addEventListener('click', (e) => {
      if (e.target === this.elements.addRepoOverlay) this.closeRepoBrowser();
    });

    // About Modal
    this.elements.aboutBtn?.addEventListener('click', () => this.openAboutModal());
    this.elements.aboutClose?.addEventListener('click', () => this.closeAboutModal());
    this.elements.aboutOverlay?.addEventListener('click', (e) => {
      if (e.target === this.elements.aboutOverlay) this.closeAboutModal();
    });

    // Hero Banner
    this.elements.heroDismiss?.addEventListener('click', () => this.dismissHeroBanner());

    // Footer Links
    this.elements.footerDocs?.addEventListener('click', () => this.openAboutModal());
    this.elements.footerGithub?.addEventListener('click', () => {
      window.open('https://github.com/ctavolazzi/_pyrite', '_blank');
    });

    // Test System
    this.elements.testSystemBtn?.addEventListener('click', () => this.runSystemTest());
    this.elements.testResultsClose?.addEventListener('click', () => this.closeTestResults());

    // Demo System
    this.elements.demoBtn?.addEventListener('click', () => this.runLiveDemo());
    this.elements.demoPanelClose?.addEventListener('click', () => this.closeDemoPanel());

    // Initialize repo browser state
    this.browserPath = '/Users/ctavolazzi/Code';
    this.selectedRepos = new Set();

    // Check if hero should be hidden (user preference)
    if (localStorage.getItem('pyrite_hero_hidden') === 'true') {
      this.elements.heroBanner?.classList.add('hidden');
    }
  }

  // ============================================================================
  // WebSocket
  // ============================================================================

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.setConnectionStatus('connected', 'Connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.setConnectionStatus('disconnected', 'Reconnecting...');
      this.scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  scheduleReconnect() {
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );
    this.reconnectAttempts++;
    setTimeout(() => this.connect(), delay);
  }

  setConnectionStatus(state, text) {
    if (this.elements.connectionStatus) {
      this.elements.connectionStatus.className = `connection-status ${state}`;
    }
    if (this.elements.statusText) {
      this.elements.statusText.textContent = text;
    }
  }

  // ============================================================================
  // Message Handling (with EventBus integration)
  // ============================================================================

  handleMessage(message) {
    switch (message.type) {
      case 'hot_reload':
        // Hot reload: refresh page when code changes
        console.log(`🔥 Hot reload triggered: ${message.file}`);
        this.showToast('info', '🔥 Reloading...', `${message.file} changed`);
        setTimeout(() => window.location.reload(), 500);
        return;

      case 'init':
        this.repos = message.repos;
        this.render();
        this.eventBus.emit('system:connected', { repoCount: Object.keys(message.repos).length });
        break;

      case 'update':
        const prevState = this.repos[message.repo];
        this.repos[message.repo] = {
          workEfforts: message.workEfforts,
          stats: message.stats,
          error: message.error,
          lastUpdated: new Date().toISOString()
        };
        this.render();
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
        this.render();
        break;

      case 'error':
        this.eventBus.emit('system:error', { repo: message.repo, message: message.message });
        break;
    }
  }

  /**
   * Detect changes and emit appropriate events through EventBus
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
          oldStatus: prev.status,
          newStatus: we.status,
          repo: repoName,
          we: we,
        });
      }

      // Detect new tickets
      if (we.tickets) {
        const prevTicketIds = new Set((prev?.tickets || []).map(t => t.id));
        const newTickets = we.tickets.filter(t => !prevTicketIds.has(t.id));

        for (const ticket of newTickets) {
          this.eventBus.emit('ticket:created', {
            id: ticket.id,
            title: ticket.title,
            status: ticket.status,
            weId: we.id,
            weTitle: we.title,
            repo: repoName,
          });
        }

        // Detect ticket status changes
        const prevTicketMap = new Map((prev?.tickets || []).map(t => [t.id, t]));
        for (const ticket of we.tickets) {
          const prevTicket = prevTicketMap.get(ticket.id);
          if (prevTicket && prevTicket.status !== ticket.status) {
            const ticketEventType = ticket.status === 'completed' ? 'ticket:completed'
              : ticket.status === 'blocked' ? 'ticket:blocked'
              : 'ticket:updated';

            this.eventBus.emit(ticketEventType, {
              id: ticket.id,
              title: ticket.title,
              oldStatus: prevTicket.status,
              newStatus: ticket.status,
              weId: we.id,
              weTitle: we.title,
              repo: repoName,
            });
          }
        }
      }
    }
  }

  // ============================================================================
  // Rendering
  // ============================================================================

  render() {
    this.elements.treeLoading?.classList.add('hidden');
    this.renderTree();
    this.renderStats();
    this.renderQueue();

    // Re-render detail view if open
    if (this.selectedItem && this.elements.detailView?.classList.contains('active')) {
      this.renderDetail();
    }
  }

  // ============================================================================
  // Tree Navigation
  // ============================================================================

  renderTree() {
    const repoNames = Object.keys(this.repos);

    if (repoNames.length === 0) {
      this.elements.treeContainer.innerHTML = `
        <div class="tree-empty">
          <p style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: var(--space-md);">
            No repositories configured
          </p>
        </div>
      `;
      return;
    }

    this.elements.treeContainer.innerHTML = repoNames.map(name =>
      this.renderTreeRepo(name, this.repos[name])
    ).join('');

    // Bind tree events
    this.elements.treeContainer.querySelectorAll('.tree-node').forEach(node => {
      node.addEventListener('click', (e) => this.handleTreeClick(e, node));
    });
  }

  renderTreeRepo(name, state) {
    const { workEfforts = [] } = state;
    const hasChildren = workEfforts.length > 0;

    return `
      <div class="tree-item expanded" data-type="repo" data-repo="${this.escapeHtml(name)}">
        <div class="tree-node">
          ${hasChildren ? '<span class="tree-expand">▶</span>' : '<span class="tree-expand"></span>'}
          <span class="tree-icon repo">◇</span>
          <span class="tree-label">${this.escapeHtml(name)}</span>
          <span class="tree-count" style="font-size: 0.65rem; color: var(--text-dim);">${workEfforts.length}</span>
        </div>
        ${hasChildren ? `
          <div class="tree-children">
            ${workEfforts.map(we => this.renderTreeWorkEffort(name, we)).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  renderTreeWorkEffort(repoName, we) {
    const hasTickets = we.tickets && we.tickets.length > 0;

    return `
      <div class="tree-item" data-type="we" data-repo="${this.escapeHtml(repoName)}" data-id="${this.escapeHtml(we.id)}">
        <div class="tree-node">
          ${hasTickets ? '<span class="tree-expand">▶</span>' : '<span class="tree-expand"></span>'}
          <span class="tree-icon we">◈</span>
          <span class="tree-label" title="${this.escapeHtml(we.title)}">${this.escapeHtml(we.title)}</span>
          <span class="tree-status ${this.escapeHtml(we.status)}">${this.escapeHtml(we.status)}</span>
        </div>
        ${hasTickets ? `
          <div class="tree-children">
            ${we.tickets.map(ticket => this.renderTreeTicket(repoName, we.id, ticket)).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  renderTreeTicket(repoName, weId, ticket) {
    return `
      <div class="tree-item" data-type="ticket" data-repo="${this.escapeHtml(repoName)}" data-we="${this.escapeHtml(weId)}" data-id="${this.escapeHtml(ticket.id)}">
        <div class="tree-node">
          <span class="tree-expand"></span>
          <span class="tree-icon ticket">▣</span>
          <span class="tree-label" title="${this.escapeHtml(ticket.title)}">${this.escapeHtml(ticket.title)}</span>
          <span class="tree-status ${this.escapeHtml(ticket.status)}">${this.escapeHtml(ticket.status)}</span>
        </div>
      </div>
    `;
  }

  handleTreeClick(e, node) {
    const item = node.closest('.tree-item');
    const type = item.dataset.type;

    // Toggle expand/collapse for items with children
    if (item.querySelector('.tree-children')) {
      item.classList.toggle('expanded');
    }

    // Handle selection based on type
    if (type === 'we') {
      const repo = item.dataset.repo;
      const we = this.findWorkEffort(repo, item.dataset.id);
      if (we) {
        this.showDetail(repo, we);
      }
    } else if (type === 'ticket') {
      const repo = item.dataset.repo;
      const we = this.findWorkEffort(repo, item.dataset.we);
      if (we) {
        this.showDetail(repo, we, item.dataset.id);
      }
    }
  }

  // ============================================================================
  // Stats
  // ============================================================================

  renderStats() {
    let totalWEs = 0;
    let totalTickets = 0;
    let activeWEs = 0;
    const repoCount = Object.keys(this.repos).length;

    for (const state of Object.values(this.repos)) {
      const wes = state.workEfforts || [];
      totalWEs += wes.length;

      for (const we of wes) {
        if (we.tickets) {
          totalTickets += we.tickets.length;
        }
        if (we.status === 'active' || we.status === 'in_progress') {
          activeWEs++;
        }
      }
    }

    this.animateNumber(this.elements.statRepos, repoCount);
    this.animateNumber(this.elements.statWorkEfforts, totalWEs);
    this.animateNumber(this.elements.statTickets, totalTickets);
    this.animateNumber(this.elements.statActive, activeWEs);
  }

  animateNumber(element, target) {
    if (!element) return;
    const current = parseInt(element.textContent) || 0;
    if (current === target) return;

    const duration = 300;
    const steps = 20;
    const increment = (target - current) / steps;
    let step = 0;

    const animate = () => {
      step++;
      const value = Math.round(current + increment * step);
      element.textContent = value;

      if (step < steps) {
        requestAnimationFrame(animate);
      } else {
        element.textContent = target;
      }
    };

    requestAnimationFrame(animate);
  }

  // ============================================================================
  // Queue
  // ============================================================================

  renderQueue() {
    const allItems = this.getAllWorkEfforts();
    const filtered = this.filterItems(allItems);

    if (filtered.length === 0) {
      this.elements.queueEmpty?.classList.remove('hidden');
      this.elements.queueList.innerHTML = '';
      return;
    }

    this.elements.queueEmpty?.classList.add('hidden');
    this.elements.queueList.innerHTML = filtered.map(({ repo, we }) =>
      this.renderQueueItem(repo, we)
    ).join('');

    // Bind queue item events
    this.elements.queueList.querySelectorAll('.queue-item').forEach(item => {
      item.addEventListener('click', () => {
        const repo = item.dataset.repo;
        const we = this.findWorkEffort(repo, item.dataset.id);
        if (we) this.showDetail(repo, we);
      });
    });

    // Bind quick action buttons
    this.elements.queueList.querySelectorAll('.queue-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = btn.closest('.queue-item');
        const repo = item.dataset.repo;
        const we = this.findWorkEffort(repo, item.dataset.id);
        if (we) {
          this.quickAction(btn.dataset.action, repo, we);
        }
      });
    });
  }

  renderQueueItem(repo, we) {
    const ticketCount = we.tickets?.length || 0;
    const completedTickets = we.tickets?.filter(t => t.status === 'completed').length || 0;

    return `
      <div class="queue-item ${we.status === 'active' || we.status === 'in_progress' ? 'active' : ''}"
           data-repo="${this.escapeHtml(repo)}"
           data-id="${this.escapeHtml(we.id)}">
        <div class="queue-indicator ${this.escapeHtml(we.status)}"></div>
        <div class="queue-info">
          <div class="queue-id">${this.escapeHtml(we.id)} • ${this.escapeHtml(repo)}</div>
          <div class="queue-title">${this.escapeHtml(we.title)}</div>
          ${ticketCount > 0 ? `
            <div class="queue-meta">${completedTickets}/${ticketCount} tickets complete</div>
          ` : ''}
        </div>
        <span class="queue-badge ${this.escapeHtml(we.status)}">${this.escapeHtml(we.status)}</span>
        <div class="queue-actions">
          ${we.status !== 'completed' ? `
            <button class="queue-action-btn" data-action="complete" title="Mark Complete">✓</button>
          ` : ''}
          ${we.status === 'active' || we.status === 'in_progress' ? `
            <button class="queue-action-btn" data-action="pause" title="Pause">⏸</button>
          ` : ''}
          ${we.status === 'paused' || we.status === 'pending' ? `
            <button class="queue-action-btn" data-action="start" title="Start">▶</button>
          ` : ''}
        </div>
      </div>
    `;
  }

  getAllWorkEfforts() {
    const items = [];
    for (const [repo, state] of Object.entries(this.repos)) {
      for (const we of state.workEfforts || []) {
        items.push({ repo, we });
      }
    }
    // Sort: active first, then by date
    return items.sort((a, b) => {
      const statusOrder = { active: 0, in_progress: 1, pending: 2, paused: 3, completed: 4 };
      return (statusOrder[a.we.status] || 5) - (statusOrder[b.we.status] || 5);
    });
  }

  filterItems(items) {
    if (this.currentFilter === 'all') return items;

    return items.filter(({ we }) => {
      switch (this.currentFilter) {
        case 'active':
          return we.status === 'active' || we.status === 'in_progress';
        case 'pending':
          return we.status === 'pending' || we.status === 'paused';
        case 'completed':
          return we.status === 'completed';
        default:
          return true;
      }
    });
  }

  setFilter(filter) {
    this.currentFilter = filter;

    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    this.renderQueue();
  }

  // ============================================================================
  // Search
  // ============================================================================

  handleSearch(query) {
    this.searchQuery = query.toLowerCase();

    if (query.length === 0) {
      this.elements.searchClear?.classList.add('hidden');
      this.elements.searchResults?.classList.add('hidden');
      return;
    }

    this.elements.searchClear?.classList.remove('hidden');

    const results = this.searchWorkEfforts(query);
    this.renderSearchResults(results);
  }

  searchWorkEfforts(query) {
    const results = [];
    const q = query.toLowerCase();

    for (const [repo, state] of Object.entries(this.repos)) {
      for (const we of state.workEfforts || []) {
        if (we.title.toLowerCase().includes(q) || we.id.toLowerCase().includes(q)) {
          results.push({ type: 'we', repo, we });
        }

        for (const ticket of we.tickets || []) {
          if (ticket.title.toLowerCase().includes(q) || ticket.id.toLowerCase().includes(q)) {
            results.push({ type: 'ticket', repo, we, ticket });
          }
        }
      }
    }

    return results.slice(0, 10); // Limit results
  }

  renderSearchResults(results) {
    if (results.length === 0) {
      this.elements.searchResults.innerHTML = `
        <div class="search-result-item">
          <div class="result-title" style="color: var(--text-muted);">No results found</div>
        </div>
      `;
    } else {
      this.elements.searchResults.innerHTML = results.map(result => {
        if (result.type === 'we') {
          return `
            <div class="search-result-item" data-type="we" data-repo="${this.escapeHtml(result.repo)}" data-id="${this.escapeHtml(result.we.id)}">
              <div class="result-title">${this.highlightMatch(result.we.title, this.searchQuery)}</div>
              <div class="result-meta">${this.escapeHtml(result.we.id)} • ${this.escapeHtml(result.repo)}</div>
            </div>
          `;
        } else {
          return `
            <div class="search-result-item" data-type="ticket" data-repo="${this.escapeHtml(result.repo)}" data-we="${this.escapeHtml(result.we.id)}" data-id="${this.escapeHtml(result.ticket.id)}">
              <div class="result-title">${this.highlightMatch(result.ticket.title, this.searchQuery)}</div>
              <div class="result-meta">${this.escapeHtml(result.ticket.id)} • ${this.escapeHtml(result.we.title)}</div>
            </div>
          `;
        }
      }).join('');
    }

    this.elements.searchResults?.classList.remove('hidden');

    // Bind click events
    this.elements.searchResults.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const repo = item.dataset.repo;
        if (item.dataset.type === 'we') {
          const we = this.findWorkEffort(repo, item.dataset.id);
          if (we) this.showDetail(repo, we);
        } else {
          const we = this.findWorkEffort(repo, item.dataset.we);
          if (we) this.showDetail(repo, we, item.dataset.id);
        }
        this.clearSearch();
      });
    });
  }

  highlightMatch(text, query) {
    if (!query) return this.escapeHtml(text);
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return this.escapeHtml(text).replace(regex, '<span class="search-highlight">$1</span>');
  }

  clearSearch() {
    this.searchQuery = '';
    if (this.elements.searchInput) this.elements.searchInput.value = '';
    this.elements.searchClear?.classList.add('hidden');
    this.elements.searchResults?.classList.add('hidden');
  }

  // ============================================================================
  // Detail View
  // ============================================================================

  showDetail(repo, we, ticketId = null) {
    this.selectedItem = { repo, we, ticketId };
    this.ticketFilter = 'all';
    this.activeTab = 'tickets';

    this.elements.dashboardView?.classList.remove('active');
    this.elements.detailView?.classList.add('active');

    this.renderDetail();
    this.bindDetailEvents();

    this.updateBreadcrumb([
      { label: 'Command Center', action: () => this.showDashboard() },
      { label: repo },
      { label: we.title, active: true }
    ]);
  }

  renderDetail() {
    if (!this.selectedItem || !this.selectedItem.we) {
      this.showEmptyDetailState();
      return;
    }

    const { repo, we, ticketId } = this.selectedItem;
    const tickets = we.tickets || [];
    const completedCount = tickets.filter(t => t.status === 'completed').length;
    const totalCount = tickets.length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Update header
    this.elements.detailTitle = document.getElementById('detailTitle');
    this.elements.detailMeta = document.getElementById('detailMeta');

    const title = we.title || we.id || 'Untitled Work Effort';
    if (this.elements.detailTitle) {
      this.elements.detailTitle.textContent = title;
    }

    if (this.elements.detailMeta) {
      this.elements.detailMeta.innerHTML = `
        <span class="queue-badge ${this.escapeHtml(we.status)}">${this.escapeHtml(we.status)}</span>
        <span>${this.escapeHtml(we.id)}</span>
        <span>•</span>
        <span>${this.escapeHtml(repo)}</span>
        <span>•</span>
        <span class="badge">${(we.format || 'unknown').toUpperCase()}</span>
      `;
    }

    // Update mini progress
    const progressMini = document.getElementById('detailProgressMini');
    if (progressMini) {
      progressMini.innerHTML = `
        <span class="progress-text">${completedCount}/${totalCount}</span>
        <div class="progress-bar-mini"><div class="progress-fill-mini" style="width: ${progressPercent}%"></div></div>
      `;
    }

    // Update status controls
    this.renderStatusControls(we.status);

    // Render panels
    this.renderMetadataPanel(we, repo);
    this.renderProgressPanel(we);
    this.renderTicketsTab(we, ticketId);
    this.renderDescriptionTab(we);
    this.renderActivityTab(we);
    this.renderFilesTab(we);
    this.renderTimeTracking(we);
    this.renderTags(we);
  }

  renderStatusControls(currentStatus) {
    const controls = document.getElementById('detailStatusControls');
    if (!controls) return;

    controls.querySelectorAll('.status-btn').forEach(btn => {
      btn.classList.remove('current');
      if (btn.dataset.status === currentStatus) {
        btn.classList.add('current');
      }
    });
  }

  renderMetadataPanel(we, repo) {
    const grid = document.getElementById('metadataGrid');
    if (!grid) return;

    const created = we.created ? this.formatDate(we.created) : '—';
    const updated = we.updated || we.lastModified ? this.formatDate(we.updated || we.lastModified) : '—';

    grid.innerHTML = `
      <div class="metadata-item">
        <span class="metadata-label">ID</span>
        <span class="metadata-value">${this.escapeHtml(we.id)}</span>
      </div>
      <div class="metadata-item">
        <span class="metadata-label">Repository</span>
        <span class="metadata-value">${this.escapeHtml(repo)}</span>
      </div>
      <div class="metadata-item">
        <span class="metadata-label">Format</span>
        <span class="metadata-value badge">${(we.format || 'unknown').toUpperCase()}</span>
      </div>
      <div class="metadata-item">
        <span class="metadata-label">Status</span>
        <span class="metadata-value queue-badge ${this.escapeHtml(we.status)}">${this.escapeHtml(we.status)}</span>
      </div>
      <div class="metadata-item">
        <span class="metadata-label">Priority</span>
        <span class="metadata-value">${we.priority || 'Normal'}</span>
      </div>
      <div class="metadata-item">
        <span class="metadata-label">Path</span>
        <span class="metadata-value" style="font-size: 0.65rem; word-break: break-all;">${this.escapeHtml(we.path || '—')}</span>
      </div>
    `;
  }

  renderProgressPanel(we) {
    const tickets = we.tickets || [];
    const completedCount = tickets.filter(t => t.status === 'completed').length;
    const totalCount = tickets.length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Update progress ring
    const progressRing = document.getElementById('progressRing');
    if (progressRing) {
      const circumference = 2 * Math.PI * 45;
      const offset = circumference - (progressPercent / 100) * circumference;
      progressRing.style.strokeDashoffset = offset;
    }

    const progressPercentEl = document.getElementById('progressPercent');
    if (progressPercentEl) {
      progressPercentEl.textContent = `${progressPercent}%`;
    }

    const ticketsCompleted = document.getElementById('ticketsCompleted');
    const ticketsTotal = document.getElementById('ticketsTotal');
    if (ticketsCompleted) ticketsCompleted.textContent = completedCount;
    if (ticketsTotal) ticketsTotal.textContent = totalCount;
  }

  renderTicketsTab(we, highlightTicketId) {
    const list = document.getElementById('ticketsList');
    if (!list) return;

    const tickets = we.tickets || [];
    const filtered = this.ticketFilter === 'all'
      ? tickets
      : tickets.filter(t => t.status === this.ticketFilter);

    if (filtered.length === 0) {
      list.innerHTML = `
        <div class="panel-empty" style="text-align: center; padding: var(--space-lg);">
          ${tickets.length === 0 ? 'No tickets yet. Click "+ Add Ticket" to create one.' : 'No tickets match the selected filter.'}
        </div>
      `;
      return;
    }

    list.innerHTML = filtered.map(ticket => `
      <div class="ticket-card ${highlightTicketId === ticket.id ? 'expanded' : ''}" data-ticket-id="${this.escapeHtml(ticket.id)}">
        <div class="ticket-card-header">
          <div class="ticket-indicator ${this.escapeHtml(ticket.status)}"></div>
          <div class="ticket-info">
            <div class="ticket-id">${this.escapeHtml(ticket.id)}</div>
            <div class="ticket-title">${this.escapeHtml(ticket.title)}</div>
          </div>
          <span class="ticket-badge ${this.escapeHtml(ticket.status)}">${this.escapeHtml(ticket.status)}</span>
          <span class="ticket-expand">▶</span>
        </div>
        <div class="ticket-card-body">
          <p class="ticket-description">${this.escapeHtml(ticket.description || ticket.objective || 'No description provided.')}</p>
          <div class="ticket-actions">
            ${ticket.status !== 'in_progress' && ticket.status !== 'completed' ? `
              <button class="ticket-action-btn primary" data-action="start" data-ticket="${this.escapeHtml(ticket.id)}">▶ Start</button>
            ` : ''}
            ${ticket.status === 'in_progress' ? `
              <button class="ticket-action-btn" data-action="pause" data-ticket="${this.escapeHtml(ticket.id)}">⏸ Pause</button>
            ` : ''}
            ${ticket.status !== 'completed' ? `
              <button class="ticket-action-btn primary" data-action="complete" data-ticket="${this.escapeHtml(ticket.id)}">✓ Complete</button>
            ` : ''}
            ${ticket.status !== 'blocked' && ticket.status !== 'completed' ? `
              <button class="ticket-action-btn" data-action="block" data-ticket="${this.escapeHtml(ticket.id)}">⚠ Block</button>
            ` : ''}
          </div>
        </div>
      </div>
    `).join('');
  }

  renderDescriptionTab(we) {
    const content = document.getElementById('descriptionContent');
    if (!content) return;

    content.innerHTML = `
      <h2>Objective</h2>
      <p>${this.escapeHtml(we.objective || 'No objective specified.')}</p>

      ${we.description ? `
        <h3>Description</h3>
        <p>${this.escapeHtml(we.description)}</p>
      ` : ''}

      ${we.notes ? `
        <h3>Notes</h3>
        <p>${this.escapeHtml(we.notes)}</p>
      ` : ''}

      ${we.acceptance_criteria && we.acceptance_criteria.length > 0 ? `
        <h3>Acceptance Criteria</h3>
        <ul>
          ${we.acceptance_criteria.map(c => `<li>${this.escapeHtml(c)}</li>`).join('')}
        </ul>
      ` : ''}
    `;
  }

  renderActivityTab(we) {
    const timeline = document.getElementById('activityTimeline');
    if (!timeline) return;

    // Generate activity from available data
    const activities = [];

    if (we.created) {
      activities.push({
        type: 'created',
        time: we.created,
        text: 'Work effort created'
      });
    }

    // Add ticket activities
    (we.tickets || []).forEach(ticket => {
      if (ticket.created) {
        activities.push({
          type: 'ticket-added',
          time: ticket.created,
          text: `Ticket "${ticket.title}" added`
        });
      }
    });

    // Sort by time (most recent first)
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));

    if (activities.length === 0) {
      timeline.innerHTML = '<p class="panel-empty">No activity recorded yet.</p>';
      return;
    }

    timeline.innerHTML = activities.slice(0, 20).map(activity => `
      <div class="activity-item ${activity.type}">
        <span class="activity-time">${this.formatRelativeTime(activity.time)}</span>
        <p class="activity-text">${this.escapeHtml(activity.text)}</p>
      </div>
    `).join('');
  }

  renderFilesTab(we) {
    const list = document.getElementById('filesList');
    if (!list) return;

    const files = we.files_changed || we.files || [];

    if (files.length === 0) {
      list.innerHTML = '<p class="panel-empty">No files tracked for this work effort.</p>';
      return;
    }

    list.innerHTML = files.map(file => {
      const fileName = typeof file === 'string' ? file : file.path;
      const status = typeof file === 'object' ? file.status : 'modified';
      return `
        <div class="file-item">
          <span class="file-icon">📄</span>
          <span class="file-path">${this.escapeHtml(fileName)}</span>
          <span class="file-status ${status}">${status}</span>
        </div>
      `;
    }).join('');
  }

  renderTimeTracking(we) {
    const timeCreated = document.getElementById('timeCreated');
    const timeUpdated = document.getElementById('timeUpdated');
    const timeDuration = document.getElementById('timeDuration');

    if (timeCreated) {
      timeCreated.textContent = we.created ? this.formatRelativeTime(we.created) : '—';
    }
    if (timeUpdated) {
      timeUpdated.textContent = (we.updated || we.lastModified) ? this.formatRelativeTime(we.updated || we.lastModified) : '—';
    }
    if (timeDuration) {
      if (we.created) {
        const created = new Date(we.created);
        const now = new Date();
        const diffMs = now - created;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        timeDuration.textContent = diffDays > 0 ? `${diffDays}d ${diffHours}h` : `${diffHours}h`;
      } else {
        timeDuration.textContent = '—';
      }
    }
  }

  renderTags(we) {
    const tagsList = document.getElementById('tagsList');
    if (!tagsList) return;

    const tags = we.tags || we.labels || ['work-effort'];
    tagsList.innerHTML = `
      ${tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
      <button class="tag-add" title="Add Tag">+</button>
    `;
  }

  bindDetailEvents() {
    // Tab switching
    document.querySelectorAll('.detail-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const pane = document.getElementById(`${tab.dataset.tab}Pane`);
        if (pane) pane.classList.add('active');
        this.activeTab = tab.dataset.tab;
      });
    });

    // Ticket filter
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.ticketFilter = btn.dataset.filter;
        if (this.selectedItem) {
          this.renderTicketsTab(this.selectedItem.we, null);
          this.bindTicketCardEvents();
        }
      });
    });

    // Status controls
    document.querySelectorAll('.status-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.changeStatus(btn.dataset.status);
      });
    });

    // Quick action buttons
    document.getElementById('quickStartBtn')?.addEventListener('click', () => this.changeStatus('active'));
    document.getElementById('quickPauseBtn')?.addEventListener('click', () => this.changeStatus('paused'));
    document.getElementById('quickCompleteBtn')?.addEventListener('click', () => this.changeStatus('completed'));

    // Ticket card events
    this.bindTicketCardEvents();
  }

  bindTicketCardEvents() {
    document.querySelectorAll('.ticket-card-header').forEach(header => {
      header.addEventListener('click', () => {
        const card = header.closest('.ticket-card');
        card.classList.toggle('expanded');
      });
    });

    document.querySelectorAll('.ticket-action-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const ticketId = btn.dataset.ticket;
        await this.handleTicketAction(action, ticketId);
      });
    });
  }

  async handleTicketAction(action, ticketId) {
    if (!this.selectedItem) return;

    const { repo, we } = this.selectedItem;
    const ticket = we.tickets?.find(t => t.id === ticketId);
    if (!ticket) return;

    const statusMap = {
      'start': 'in_progress',
      'pause': 'pending',
      'complete': 'completed',
      'block': 'blocked'
    };

    const newStatus = statusMap[action];
    if (!newStatus) return;

    // For now, just update locally and show toast
    // In a full implementation, this would call an API
    this.showToast('info', 'Ticket Action', `${ticket.title} → ${newStatus}`);

    // Update local state (temporary until WebSocket updates)
    ticket.status = newStatus;
    this.renderTicketsTab(we, ticketId);
    this.renderProgressPanel(we);
    this.bindTicketCardEvents();
  }

  formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  }

  formatRelativeTime(dateString) {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 60) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHour < 24) return `${diffHour}h ago`;
      if (diffDay < 7) return `${diffDay}d ago`;
      return this.formatDate(dateString);
    } catch (e) {
      return dateString;
    }
  }

  showEmptyDetailState() {
    const container = document.querySelector('.detail-body');
    if (container) {
      container.innerHTML = `
        <div class="detail-empty-state">
          <div class="empty-icon">◈</div>
          <h2 class="empty-title">Select a Work Effort</h2>
          <p class="empty-message">Choose a work effort from the sidebar to view details, manage tickets, and track progress.</p>
          <div class="empty-hints">
            <div class="hint">
              <span class="hint-icon">🌲</span>
              <span class="hint-text">Browse the tree on the left</span>
            </div>
            <div class="hint">
              <span class="hint-icon">🔍</span>
              <span class="hint-text">Use search to find specific items</span>
            </div>
            <div class="hint">
              <span class="hint-icon">▶</span>
              <span class="hint-text">Try the Live Demo to see it in action</span>
            </div>
          </div>
          <button class="empty-action-btn" onclick="window.missionControl.showDashboard()">
            ← Back to Dashboard
          </button>
        </div>
      `;
    }
  }

  showDashboard() {
    this.selectedItem = null;
    this.elements.detailView?.classList.remove('active');
    this.elements.dashboardView?.classList.add('active');
    this.updateBreadcrumb([{ label: 'Command Center', active: true }]);
  }

  updateBreadcrumb(items) {
    if (!this.elements.breadcrumb) return;

    this.elements.breadcrumb.innerHTML = items.map((item, i) => `
      <span class="breadcrumb-item ${item.active ? 'active' : ''}"
            ${item.action ? 'style="cursor: pointer;"' : ''}>
        ${this.escapeHtml(item.label)}
      </span>
    `).join('');

    // Bind click events
    this.elements.breadcrumb.querySelectorAll('.breadcrumb-item').forEach((el, i) => {
      if (items[i].action) {
        el.addEventListener('click', items[i].action);
      }
    });
  }

  // ============================================================================
  // Actions
  // ============================================================================

  async changeStatus(newStatus) {
    if (!this.selectedItem) return;

    const { repo, we } = this.selectedItem;

    try {
      const response = await fetch(`/api/repos/${encodeURIComponent(repo)}/work-efforts/${encodeURIComponent(we.id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        this.showToast('success', 'Status Updated', `${we.title} is now ${newStatus}`);
      } else {
        const error = await response.json();
        this.showToast('error', 'Update Failed', error.message || 'Could not update status');
      }
    } catch (error) {
      this.showToast('error', 'Network Error', 'Could not connect to server');
    }
  }

  quickAction(action, repo, we) {
    const statusMap = { start: 'active', pause: 'paused', complete: 'completed' };
    const newStatus = statusMap[action];

    if (newStatus) {
      this.selectedItem = { repo, we };
      this.changeStatus(newStatus);
      this.selectedItem = null;
    }
  }

  // ============================================================================
  // Toast Notifications (delegating to ToastManager)
  // ============================================================================

  /**
   * Show a toast notification (legacy API - delegates to ToastManager)
   */
  showToast(type, title, message, options = {}) {
    // Delegate to the new ToastManager if available
    if (this.toastManager) {
      return this.toastManager.show({
        type,
        title,
        message,
        duration: options.duration,
        actions: options.actions,
        onClick: options.onClick,
        dismissable: options.dismissable !== false,
      });
    }

    // Fallback for init race condition - create toast manually
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const duration = options.duration !== undefined ? options.duration : TOAST_DURATIONS[type] || 5000;

    toast.innerHTML = `
      <div class="toast-glow"></div>
      <div class="toast-header">
        <span class="toast-icon">${type === 'error' ? '✕' : type === 'success' ? '✓' : type === 'warning' ? '⚠' : 'ℹ️'}</span>
        <span class="toast-indicator"></span>
        <span class="toast-title">${this.escapeHtml(title)}</span>
        <button class="toast-close">×</button>
      </div>
      <div class="toast-body">
        <p class="toast-message">${this.escapeHtml(message)}</p>
        ${options.actions ? `
          <div class="toast-actions">
            ${options.actions.map(action => `
              <button class="toast-action ${action.primary ? 'primary' : ''}">${this.escapeHtml(action.label)}</button>
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

    // Bind close
    toast.querySelector('.toast-close').addEventListener('click', () => this.dismissToast(toast));

    // Bind actions
    if (options.actions) {
      toast.querySelectorAll('.toast-action').forEach((btn, i) => {
        btn.addEventListener('click', () => {
          options.actions[i].action?.();
          this.dismissToast(toast);
        });
      });
    }

    this.elements.toastContainer?.appendChild(toast);

    // Animation & auto-dismiss for fallback toasts
    if (duration > 0) {
      const progressBar = toast.querySelector('.toast-progress-bar');
      let remaining = duration;
      let isPaused = false;
      const tick = 50;
      let startTime = Date.now();

      const updateProgress = () => {
        if (isPaused) return;
        remaining = duration - (Date.now() - startTime);
        if (progressBar) {
          progressBar.style.width = `${Math.max(0, (remaining / duration) * 100)}%`;
        }
        if (remaining <= 0) {
          this.dismissToast(toast);
        }
      };

      const interval = setInterval(updateProgress, tick);

      toast.addEventListener('mouseenter', () => {
        isPaused = true;
        toast.classList.add('paused');
      });

      toast.addEventListener('mouseleave', () => {
        isPaused = false;
        startTime = Date.now();
        toast.classList.remove('paused');
      });

      // Store interval for cleanup
      toast._dismissInterval = interval;
    }

    return toast;
  }

  dismissToast(toast) {
    if (toast._dismissInterval) {
      clearInterval(toast._dismissInterval);
    }
    toast.classList.add('exiting');
    setTimeout(() => toast.remove(), 300);
  }

  // ============================================================================
  // Modal
  // ============================================================================

  showModal(title, content, data = {}) {
    this.modalData = data;

    if (this.elements.modalTitle) {
      this.elements.modalTitle.textContent = title;
    }
    if (this.elements.modalBody) {
      this.elements.modalBody.innerHTML = content;
    }

    this.elements.modalOverlay?.classList.remove('hidden');
  }

  closeModal() {
    this.elements.modalOverlay?.classList.add('hidden');
    this.modalData = null;
  }

  openFromModal() {
    if (this.modalData?.repo && this.modalData?.we) {
      this.showDetail(this.modalData.repo, this.modalData.we);
    }
    this.closeModal();
  }

  // ============================================================================
  // About Modal & Hero Banner
  // ============================================================================

  openAboutModal() {
    this.elements.aboutOverlay?.classList.remove('hidden');

    // Animate the gem
    const gem = this.elements.aboutOverlay?.querySelector('.about-gem');
    if (gem && this.animationController) {
      this.animationController.animate(gem, 'pulse');
    }
  }

  closeAboutModal() {
    this.elements.aboutOverlay?.classList.add('hidden');
  }

  dismissHeroBanner() {
    this.elements.heroBanner?.classList.add('hidden');
    localStorage.setItem('pyrite_hero_hidden', 'true');
  }

  showHeroBanner() {
    this.elements.heroBanner?.classList.remove('hidden');
    localStorage.removeItem('pyrite_hero_hidden');
  }

  // ============================================================================
  // System Test
  // ============================================================================

  async runSystemTest() {
    // Show test panel and disable button
    this.elements.testResults?.classList.remove('hidden');
    this.elements.testSystemBtn?.classList.add('running');

    // Define tests
    const tests = [
      { name: 'WebSocket Connection', test: () => this.testWebSocket() },
      { name: 'API Health Check', test: () => this.testApiHealth() },
      { name: 'Repos Loaded', test: () => this.testReposLoaded() },
      { name: 'Event Bus Active', test: () => this.testEventBus() },
      { name: 'Toast System', test: () => this.testToastSystem() },
      { name: 'Notification Center', test: () => this.testNotificationCenter() },
      { name: 'File Watcher', test: () => this.testFileWatcher() },
    ];

    // Clear previous results
    this.elements.testResultsBody.innerHTML = '';

    let passed = 0;
    let failed = 0;

    // Run each test
    for (const { name, test } of tests) {
      // Show running state
      const itemEl = this.createTestItem(name, 'running');
      this.elements.testResultsBody.appendChild(itemEl);

      try {
        await new Promise(resolve => setTimeout(resolve, 300)); // Visual delay
        const result = await test();

        if (result.pass) {
          this.updateTestItem(itemEl, 'pass', result.message || 'Passed');
          passed++;
        } else {
          this.updateTestItem(itemEl, 'fail', result.message || 'Failed');
          failed++;
        }
      } catch (error) {
        this.updateTestItem(itemEl, 'fail', error.message);
        failed++;
      }
    }

    // Show summary
    const total = tests.length;
    const allPassed = failed === 0;
    this.elements.testResultsSummary.innerHTML = `
      <span class="test-summary-text">${passed}/${total} tests passed</span>
      <span class="test-summary-result ${allPassed ? 'pass' : 'fail'}">
        ${allPassed ? '✓ ALL PASS' : `✗ ${failed} FAILED`}
      </span>
    `;

    // Re-enable button
    this.elements.testSystemBtn?.classList.remove('running');

    // Show celebration if all passed
    if (allPassed && this.animationController) {
      this.animationController._celebrationEffect();
      this.showToast('success', '🎉 All Tests Passed!', 'System is fully operational');
    } else if (failed > 0) {
      this.showToast('error', '⚠️ Some Tests Failed', `${failed} of ${total} tests failed`);
    }
  }

  createTestItem(name, status) {
    const icons = { pass: '✓', fail: '✗', running: '◌' };
    const div = document.createElement('div');
    div.className = 'test-item';
    div.innerHTML = `
      <span class="test-item-icon ${status}">${icons[status]}</span>
      <span class="test-item-name">${this.escapeHtml(name)}</span>
      <span class="test-item-status ${status}">${status === 'running' ? 'Testing...' : status}</span>
    `;
    return div;
  }

  updateTestItem(itemEl, status, message) {
    const icons = { pass: '✓', fail: '✗' };
    itemEl.querySelector('.test-item-icon').className = `test-item-icon ${status}`;
    itemEl.querySelector('.test-item-icon').textContent = icons[status];
    itemEl.querySelector('.test-item-status').className = `test-item-status ${status}`;
    itemEl.querySelector('.test-item-status').textContent = message || status;
  }

  closeTestResults() {
    this.elements.testResults?.classList.add('hidden');
  }

  // Individual test implementations
  async testWebSocket() {
    const isConnected = this.ws?.readyState === WebSocket.OPEN;
    return { pass: isConnected, message: isConnected ? 'Connected' : 'Disconnected' };
  }

  async testApiHealth() {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      return { pass: data.status === 'ok', message: `Uptime: ${Math.round(data.uptime)}s` };
    } catch (e) {
      return { pass: false, message: e.message };
    }
  }

  async testReposLoaded() {
    const repoCount = Object.keys(this.repos).length;
    return { pass: repoCount > 0, message: `${repoCount} repos loaded` };
  }

  async testEventBus() {
    const hasEventBus = !!this.eventBus;
    const metrics = this.eventBus?.getMetrics?.();
    return {
      pass: hasEventBus,
      message: metrics ? `${metrics.totalEmitted} events emitted` : 'Active'
    };
  }

  async testToastSystem() {
    const hasToastManager = !!this.toastManager;
    // Show a test toast
    if (hasToastManager) {
      this.toastManager.show({
        type: 'info',
        title: '🧪 Test Toast',
        message: 'This is a system test toast',
        duration: 3000
      });
    }
    return { pass: hasToastManager, message: hasToastManager ? 'Toast displayed' : 'Not initialized' };
  }

  async testNotificationCenter() {
    const hasNotifications = Array.isArray(this.notifications);
    return {
      pass: hasNotifications,
      message: `${this.notifications?.length || 0} notifications`
    };
  }

  async testFileWatcher() {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      const watchedRepos = data.repos?.length || 0;
      return { pass: watchedRepos > 0, message: `Watching ${watchedRepos} repos` };
    } catch (e) {
      return { pass: false, message: e.message };
    }
  }

  // ============================================================================
  // Live Demo
  // ============================================================================

  async runLiveDemo() {
    // Show panel and disable button
    this.elements.demoPanel?.classList.remove('hidden');
    this.elements.demoBtn?.classList.add('running');

    // Define demo steps
    const steps = [
      { id: 'init', title: 'Initializing Demo', detail: 'Setting up the demonstration...' },
      { id: 'create-we', title: 'Creating Work Effort', detail: 'Creating a new demo work effort...' },
      { id: 'detect-we', title: 'File System Detection', detail: 'Waiting for file watcher to detect changes...' },
      { id: 'create-ticket-1', title: 'Creating Ticket #1', detail: 'Adding first demo ticket...' },
      { id: 'create-ticket-2', title: 'Creating Ticket #2', detail: 'Adding second demo ticket...' },
      { id: 'detect-tickets', title: 'Real-time Update', detail: 'Watch the dashboard update in real-time...' },
      { id: 'update-ticket', title: 'Updating Ticket Status', detail: 'Marking ticket as in_progress...' },
      { id: 'complete-ticket', title: 'Completing Ticket', detail: 'Marking ticket as completed...' },
      { id: 'complete-we', title: 'Completing Work Effort', detail: 'Marking entire work effort as completed...' },
      { id: 'done', title: 'Demo Complete!', detail: 'All systems working correctly!' }
    ];

    // Render initial state
    this.renderDemoSteps(steps);
    this.updateDemoStatus('Starting demo...');

    let workEffort = null;
    let ticket1 = null;
    let ticket2 = null;

    try {
      // Step 1: Initialize
      await this.runDemoStep('init', steps, async () => {
        await this.delay(800);
        return 'Ready to begin';
      });

      // Step 2: Create Work Effort
      await this.runDemoStep('create-we', steps, async () => {
        const res = await fetch('/api/demo/work-effort', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Demo Work Effort',
            objective: 'Demonstrate the full Mission Control event system'
          })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        workEffort = data.workEffort;
        return `Created ${workEffort.id}`;
      });

      // Step 3: Wait for detection
      await this.runDemoStep('detect-we', steps, async () => {
        await this.delay(1500); // Wait for file watcher
        return 'Work effort detected!';
      });

      // Step 4: Create Ticket 1
      await this.runDemoStep('create-ticket-1', steps, async () => {
        const res = await fetch('/api/demo/ticket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workEffortPath: workEffort.path,
            title: 'Setup demo environment',
            description: 'Initialize and configure the demo workspace'
          })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        ticket1 = data.ticket;
        return `Created ${ticket1.id}`;
      });

      // Step 5: Create Ticket 2
      await this.runDemoStep('create-ticket-2', steps, async () => {
        const res = await fetch('/api/demo/ticket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workEffortPath: workEffort.path,
            title: 'Verify event system',
            description: 'Test all event types and notifications'
          })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        ticket2 = data.ticket;
        return `Created ${ticket2.id}`;
      });

      // Step 6: Wait for real-time update
      await this.runDemoStep('detect-tickets', steps, async () => {
        await this.delay(1500);
        return 'Dashboard updated!';
      });

      // Step 7: Update ticket to in_progress
      await this.runDemoStep('update-ticket', steps, async () => {
        const res = await fetch(`/api/demo/ticket/${encodeURIComponent(ticket1.path)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'in_progress' })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        await this.delay(1000);
        return 'Status → in_progress';
      });

      // Step 8: Complete ticket
      await this.runDemoStep('complete-ticket', steps, async () => {
        const res = await fetch(`/api/demo/ticket/${encodeURIComponent(ticket1.path)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        await this.delay(1000);
        return 'Status → completed ✓';
      });

      // Step 9: Complete work effort
      await this.runDemoStep('complete-we', steps, async () => {
        const res = await fetch(`/api/demo/work-effort/${encodeURIComponent(workEffort.path)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        await this.delay(1000);
        return 'Work effort completed!';
      });

      // Step 10: Done
      await this.runDemoStep('done', steps, async () => {
        return '🎉 All systems operational!';
      });

      // Success!
      this.updateDemoStatus('Demo completed successfully!', 'success');
      this.showToast('success', '🎉 Demo Complete!', 'All Mission Control systems verified');

      if (this.animationController) {
        this.animationController._celebrationEffect();
      }

    } catch (error) {
      console.error('Demo error:', error);
      this.updateDemoStatus(`Error: ${error.message}`, 'error');
      this.showToast('error', 'Demo Failed', error.message);
    }

    // Re-enable button
    this.elements.demoBtn?.classList.remove('running');
  }

  renderDemoSteps(steps) {
    this.elements.demoPanelSteps.innerHTML = steps.map(step => `
      <div class="demo-step pending" data-step="${step.id}">
        <div class="demo-step-icon">○</div>
        <div class="demo-step-content">
          <div class="demo-step-title">${this.escapeHtml(step.title)}</div>
          <div class="demo-step-detail">${this.escapeHtml(step.detail)}</div>
        </div>
      </div>
    `).join('');
  }

  async runDemoStep(stepId, steps, action) {
    const stepEl = this.elements.demoPanelSteps.querySelector(`[data-step="${stepId}"]`);
    if (!stepEl) return;

    const STEP_PAUSE = 2670; // 2.67 seconds per step for user to absorb

    // Set to running
    stepEl.className = 'demo-step running';
    stepEl.querySelector('.demo-step-icon').textContent = '◌';

    // Scroll step into view
    stepEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    try {
      const result = await action();

      // Set to complete
      stepEl.className = 'demo-step complete';
      stepEl.querySelector('.demo-step-icon').textContent = '✓';
      stepEl.querySelector('.demo-step-detail').textContent = result;

      // Pause so user can see the result
      await this.delay(STEP_PAUSE);

      return result;
    } catch (error) {
      stepEl.className = 'demo-step error';
      stepEl.querySelector('.demo-step-icon').textContent = '✗';
      stepEl.querySelector('.demo-step-detail').textContent = error.message;
      await this.delay(STEP_PAUSE); // Still pause on error so user can see
      throw error;
    }
  }

  updateDemoStatus(message, type = '') {
    const footer = this.elements.demoPanelFooter;
    if (footer) {
      footer.innerHTML = `<span class="demo-status ${type}">${this.escapeHtml(message)}</span>`;
    }
  }

  closeDemoPanel() {
    this.elements.demoPanel?.classList.add('hidden');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================================================
  // Sidebar
  // ============================================================================

  toggleSidebar() {
    this.elements.sidebar?.classList.toggle('collapsed');
  }

  toggleMobileSidebar() {
    this.elements.sidebar?.classList.toggle('open');
  }

  toggleView(view) {
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });

    // For now, we only have dashboard view implemented
    // List view would be an alternative layout
  }

  // ============================================================================
  // Keyboard Shortcuts
  // ============================================================================

  handleKeyboard(e) {
    // Escape to close modal or go back
    if (e.key === 'Escape') {
      if (!this.elements.modalOverlay?.classList.contains('hidden')) {
        this.closeModal();
      } else if (this.elements.detailView?.classList.contains('active')) {
        this.showDashboard();
      }
    }

    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      this.elements.searchInput?.focus();
    }
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  findWorkEffort(repo, id) {
    const state = this.repos[repo];
    if (!state) return null;
    return state.workEfforts?.find(we => we.id === id);
  }

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // ============================================================================
  // Activity Tracking
  // ============================================================================

  startActivityTracking() {
    // Check activity state every second
    this.activityCheckInterval = setInterval(() => this.checkActivityState(), 1000);
  }

  recordActivity() {
    this.lastActivityTime = Date.now();
    if (this.activityState !== 'active' && this.isWindowFocused) {
      this.setActivityState('active');
    }
  }

  handleWindowFocus(focused) {
    this.isWindowFocused = focused;
    if (focused) {
      this.recordActivity();
    } else {
      this.setActivityState('away');
    }
  }

  checkActivityState() {
    if (!this.isWindowFocused) {
      if (this.activityState !== 'away') {
        this.setActivityState('away');
      }
      return;
    }

    const timeSinceActivity = Date.now() - this.lastActivityTime;

    if (timeSinceActivity > this.idleThreshold) {
      if (this.activityState !== 'idle') {
        this.setActivityState('idle');
      }
    } else if (this.activityState !== 'active') {
      this.setActivityState('active');
    }
  }

  setActivityState(state) {
    this.activityState = state;

    // Update UI
    if (this.elements.activityDot) {
      this.elements.activityDot.className = `activity-dot ${state}`;
    }
    if (this.elements.activityText) {
      const labels = { active: 'Active', idle: 'Idle', away: 'Away' };
      this.elements.activityText.textContent = labels[state];
    }

    console.log(`Activity state: ${state}`);
  }

  shouldUseNotificationCenter() {
    // Use notification center (bell) instead of toasts when:
    // 1. Window is not focused (user is away)
    // 2. User has been idle for more than 30 seconds
    // 3. Panel is currently open (don't interrupt)
    return !this.isWindowFocused ||
           this.activityState === 'idle' ||
           this.activityState === 'away' ||
           this.isPanelOpen;
  }

  // ============================================================================
  // Notification Center
  // ============================================================================

  /**
   * Add a notification to the notification center
   * Supports both object and positional signatures:
   * - addNotification({ type, title, message, data, onClick })
   * - addNotification(type, title, message, data)
   */
  addNotification(typeOrOptions, title, message, data = {}) {
    let notification;

    // Handle object signature (new style)
    if (typeof typeOrOptions === 'object') {
      const opts = typeOrOptions;
      notification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type: opts.type || 'info',
        title: opts.title || 'Notification',
        message: opts.message || '',
        data: opts.data || {},
        onClick: opts.onClick,
        timestamp: new Date(opts.timestamp || Date.now()),
        read: false
      };
    } else {
      // Handle positional signature (legacy)
      notification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type: typeOrOptions,
        title,
        message,
        data,
        timestamp: new Date(),
        read: false
      };
    }

    this.notifications.unshift(notification);
    this.unreadCount++;

    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    this.updateBellBadge();
    this.renderNotificationList();

    // Ring the bell animation
    this.elements.bellBtn?.classList.add('has-notifications');

    // Animate the bell
    if (this.animationController) {
      this.animationController.animate(this.elements.bellBtn, 'bounce');
    }

    return notification;
  }

  updateBellBadge() {
    if (!this.elements.bellBadge) return;

    if (this.unreadCount > 0) {
      this.elements.bellBadge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
      this.elements.bellBadge.classList.remove('hidden');
      this.elements.bellBtn?.classList.add('has-notifications');
    } else {
      this.elements.bellBadge.classList.add('hidden');
      this.elements.bellBtn?.classList.remove('has-notifications');
    }
  }

  toggleNotificationPanel() {
    if (this.isPanelOpen) {
      this.closeNotificationPanel();
    } else {
      this.openNotificationPanel();
    }
  }

  openNotificationPanel() {
    this.isPanelOpen = true;
    this.elements.notificationPanel?.classList.remove('hidden');

    // Mark all as read when opening
    this.notifications.forEach(n => n.read = true);
    this.unreadCount = 0;
    this.updateBellBadge();
    this.renderNotificationList();
  }

  closeNotificationPanel() {
    this.isPanelOpen = false;
    this.elements.notificationPanel?.classList.add('hidden');
  }

  renderNotificationList() {
    if (!this.elements.notificationList) return;

    if (this.notifications.length === 0) {
      this.elements.notificationList.innerHTML = `
        <div class="panel-empty">No notifications</div>
      `;
      return;
    }

    this.elements.notificationList.innerHTML = this.notifications.map(n => `
      <div class="notification-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
        <div class="notification-indicator ${n.type}"></div>
        <div class="notification-content">
          <div class="notification-title">${this.escapeHtml(n.title)}</div>
          <div class="notification-message">${this.escapeHtml(n.message)}</div>
          <div class="notification-time">${this.formatTimeAgo(n.timestamp)}</div>
        </div>
        <button class="notification-dismiss" data-id="${n.id}" title="Dismiss">×</button>
      </div>
    `).join('');

    // Bind click events
    this.elements.notificationList.querySelectorAll('.notification-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('notification-dismiss')) return;
        const notification = this.notifications.find(n => n.id === item.dataset.id);

        // Support both onClick (new) and data.action (legacy) callbacks
        const callback = notification?.onClick || notification?.data?.action;
        if (callback) {
          callback();
          this.closeNotificationPanel();
        }
      });
    });

    this.elements.notificationList.querySelectorAll('.notification-dismiss').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.dismissNotification(btn.dataset.id);
      });
    });
  }

  dismissNotification(id) {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      if (!this.notifications[index].read) {
        this.unreadCount--;
      }
      this.notifications.splice(index, 1);
      this.updateBellBadge();
      this.renderNotificationList();
    }
  }

  clearAllNotifications() {
    this.notifications = [];
    this.unreadCount = 0;
    this.updateBellBadge();
    this.renderNotificationList();
  }

  formatTimeAgo(date) {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return date.toLocaleDateString();
  }

  // ============================================================================
  // Smart Notification Dispatch
  // ============================================================================

  notify(type, title, message, options = {}) {
    // Decide: toast or notification center?
    if (this.shouldUseNotificationCenter()) {
      // User is away/idle - queue to notification center
      this.addNotification(type, title, message, {
        action: options.action,
        ...options.data
      });

      // Also play a subtle sound or trigger browser notification if permitted
      this.triggerBackgroundAlert(title, message);
    } else {
      // User is active - show toast
      this.showToast(type, title, message, options);
    }
  }

  triggerBackgroundAlert(title, message) {
    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Mission Control: ${title}`, {
        body: message,
        icon: '/favicon.ico',
        silent: false
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }

  // ============================================================================
  // Repository Browser
  // ============================================================================

  async openRepoBrowser() {
    this.elements.addRepoOverlay?.classList.remove('hidden');
    this.selectedRepos = new Set();
    this.updateAddRepoButton();
    await this.browsePath(this.browserPath);
  }

  closeRepoBrowser() {
    this.elements.addRepoOverlay?.classList.add('hidden');
    this.selectedRepos.clear();
  }

  async browsePath(dirPath) {
    if (!this.elements.browserList) return;

    this.browserPath = dirPath;
    this.elements.browserPath.textContent = dirPath;
    this.elements.browserList.innerHTML = '<div class="browser-loading">Scanning directories...</div>';

    try {
      const res = await fetch(`/api/browse?path=${encodeURIComponent(dirPath)}`);
      const data = await res.json();

      if (!res.ok) {
        this.elements.browserList.innerHTML = `<div class="browser-loading">❌ ${data.error}</div>`;
        return;
      }

      this.elements.browserUp.disabled = !data.canGoUp;
      this.browserParent = data.parent;

      if (data.items.length === 0) {
        this.elements.browserList.innerHTML = '<div class="browser-loading">No folders found</div>';
        return;
      }

      this.elements.browserList.innerHTML = data.items.map(item => `
        <div class="browser-item ${item.hasWorkEfforts ? 'has-work-efforts' : ''} ${item.isAdded ? 'already-added' : ''} ${this.selectedRepos.has(item.path) ? 'selected' : ''}"
             data-path="${this.escapeHtml(item.path)}"
             data-selectable="${item.hasWorkEfforts && !item.isAdded}">
          <input type="checkbox"
                 class="browser-checkbox"
                 ${item.hasWorkEfforts && !item.isAdded ? '' : 'disabled'}
                 ${this.selectedRepos.has(item.path) ? 'checked' : ''}
                 ${item.isAdded ? 'checked disabled' : ''}>
          <span class="browser-item-icon ${item.hasWorkEfforts ? 'repo' : 'folder'}">
            ${item.hasWorkEfforts ? '◈' : '📁'}
          </span>
          <div class="browser-item-content">
            <div class="browser-item-name">${this.escapeHtml(item.name)}</div>
            <div class="browser-item-meta">
              ${item.hasWorkEfforts ? `
                <span class="browser-item-badge ${item.isAdded ? 'warning' : ''}">
                  ${item.isAdded ? 'Added' : 'Has Work Efforts'}
                </span>
                <span class="browser-item-count">${item.workEffortCount} WEs</span>
              ` : ''}
            </div>
          </div>
        </div>
      `).join('');

      // Bind click events
      this.elements.browserList.querySelectorAll('.browser-item').forEach(item => {
        const checkbox = item.querySelector('.browser-checkbox');
        const itemPath = item.dataset.path;
        const isSelectable = item.dataset.selectable === 'true';

        item.addEventListener('click', (e) => {
          if (e.target === checkbox) return;

          // If it's a folder without work efforts, navigate into it
          if (!isSelectable && !item.classList.contains('already-added')) {
            this.browsePath(itemPath);
            return;
          }

          // Toggle selection
          if (isSelectable) {
            this.toggleRepoSelection(itemPath, item, checkbox);
          }
        });

        checkbox?.addEventListener('change', () => {
          if (isSelectable) {
            this.toggleRepoSelection(itemPath, item, checkbox);
          }
        });
      });
    } catch (error) {
      console.error('Browse error:', error);
      this.elements.browserList.innerHTML = '<div class="browser-loading">❌ Failed to load</div>';
    }
  }

  toggleRepoSelection(path, item, checkbox) {
    if (this.selectedRepos.has(path)) {
      this.selectedRepos.delete(path);
      item.classList.remove('selected');
      checkbox.checked = false;
    } else {
      this.selectedRepos.add(path);
      item.classList.add('selected');
      checkbox.checked = true;
    }
    this.updateAddRepoButton();
  }

  updateAddRepoButton() {
    const count = this.selectedRepos.size;
    if (this.elements.addRepoConfirm) {
      this.elements.addRepoConfirm.disabled = count === 0;
      this.elements.addRepoConfirm.textContent = `Add Selected (${count})`;
    }
  }

  browseParent() {
    if (this.browserParent) {
      this.browsePath(this.browserParent);
    }
  }

  refreshBrowser() {
    this.browsePath(this.browserPath);
  }

  async confirmAddRepos() {
    if (this.selectedRepos.size === 0) return;

    const paths = Array.from(this.selectedRepos);
    this.elements.addRepoConfirm.disabled = true;
    this.elements.addRepoConfirm.textContent = 'Adding...';

    try {
      const res = await fetch('/api/repos/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths })
      });

      const data = await res.json();

      if (data.added.length > 0) {
        this.notify('success', 'Repos Added', `Added ${data.added.length} repositories`);
      }

      if (data.errors.length > 0) {
        this.notify('warning', 'Some Failed', `${data.errors.length} repos couldn't be added`);
      }

      this.closeRepoBrowser();
    } catch (error) {
      console.error('Add repos error:', error);
      this.notify('error', 'Error', 'Failed to add repositories');
    }

    this.updateAddRepoButton();
  }
}

// ============================================================================
// Initialize
// ============================================================================

const app = new MissionControl();
window.missionControl = app;
