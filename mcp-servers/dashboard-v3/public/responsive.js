/**
 * Mission Control V3 - Responsive System
 *
 * Handles breakpoint detection, drawer state, and responsive behaviors.
 * Mobile-first design with progressive enhancement.
 */

// Breakpoint values (must match CSS)
const BREAKPOINTS = {
  sm: 480,
  md: 640,
  lg: 1024,
  xl: 1280,
  '2xl': 1440
};

// Current breakpoint state
let currentBreakpoint = 'base';
let isDrawerOpen = false;

/**
 * Get the current breakpoint name based on viewport width
 */
function getCurrentBreakpoint() {
  const width = window.innerWidth;

  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'base';
}

/**
 * Check if current viewport is at or above a breakpoint
 */
function isBreakpoint(bp) {
  const width = window.innerWidth;
  return width >= (BREAKPOINTS[bp] || 0);
}

/**
 * Initialize responsive system
 */
function initResponsive() {
  // Set initial breakpoint
  currentBreakpoint = getCurrentBreakpoint();
  document.documentElement.dataset.breakpoint = currentBreakpoint;

  // Set up media query listeners for each breakpoint
  Object.entries(BREAKPOINTS).forEach(([name, width]) => {
    const mq = window.matchMedia(`(min-width: ${width}px)`);

    mq.addEventListener('change', (e) => {
      const newBreakpoint = getCurrentBreakpoint();
      if (newBreakpoint !== currentBreakpoint) {
        const oldBreakpoint = currentBreakpoint;
        currentBreakpoint = newBreakpoint;
        document.documentElement.dataset.breakpoint = currentBreakpoint;

        // Dispatch custom event for other components to react
        window.dispatchEvent(new CustomEvent('breakpointchange', {
          detail: {
            from: oldBreakpoint,
            to: newBreakpoint,
            isMobile: !isBreakpoint('md'),
            isTablet: isBreakpoint('md') && !isBreakpoint('lg'),
            isDesktop: isBreakpoint('lg')
          }
        }));

        // Auto-manage sidebar state based on breakpoint
        const sidebar = document.getElementById('sidebar');
        const app = document.querySelector('.app');

        if (sidebar) {
          if (isBreakpoint('lg')) {
            // Desktop: Always expanded
            sidebar.dataset.state = 'expanded';
            sidebar.setAttribute('aria-hidden', 'false');
            isDrawerOpen = false;
          } else if (isBreakpoint('md')) {
            // Tablet: Collapsed by default, close any open drawer
            if (isDrawerOpen) {
              closeDrawer();
            }
            sidebar.dataset.state = 'collapsed';
            sidebar.setAttribute('aria-hidden', 'false');
          } else {
            // Mobile: Close drawer if open
            if (isDrawerOpen) {
              closeDrawer();
            }
            sidebar.dataset.state = 'closed';
            sidebar.setAttribute('aria-hidden', 'true');
          }

          // Sync app container state
          if (app) {
            app.dataset.sidebar = sidebar.dataset.state;
          }
        }
      }
    });
  });

  // Initialize drawer functionality
  initDrawer();

  // Log initial state
  console.log(`[Responsive] Initialized at breakpoint: ${currentBreakpoint}`);
}

/**
 * Initialize drawer (sidebar) functionality
 */
function initDrawer() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('drawerBackdrop');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarClose = document.getElementById('sidebarClose');

  // Mobile menu button opens drawer
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      toggleDrawer();
    });
  }

  // Sidebar close button (mobile)
  if (sidebarClose) {
    sidebarClose.addEventListener('click', () => {
      closeDrawer();
    });
  }

  // Sidebar toggle button (tablet/desktop)
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      if (isBreakpoint('md')) {
        // Tablet/desktop: toggle collapsed state
        toggleSidebarCollapse();
      } else {
        // Mobile: close drawer
        closeDrawer();
      }
    });
  }

  // Backdrop click closes drawer
  if (backdrop) {
    backdrop.addEventListener('click', () => {
      closeDrawer();
    });
  }

  // Escape key closes drawer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isDrawerOpen) {
      closeDrawer();
    }
  });

  // Touch gestures for drawer
  initDrawerGestures(sidebar, backdrop);

  // Set initial state based on screen size
  if (sidebar) {
    if (isBreakpoint('lg')) {
      sidebar.dataset.state = 'expanded';
      sidebar.setAttribute('aria-hidden', 'false');
    } else if (isBreakpoint('md')) {
      sidebar.dataset.state = 'collapsed';
      sidebar.setAttribute('aria-hidden', 'false');
    } else {
      sidebar.dataset.state = 'closed';
      sidebar.setAttribute('aria-hidden', 'true');
    }

    // Also update the app container
    const app = document.querySelector('.app');
    if (app) {
      app.dataset.sidebar = sidebar.dataset.state;
    }
  }
}

/**
 * Open the drawer (mobile)
 */
function openDrawer() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('drawerBackdrop');

  if (sidebar) {
    sidebar.dataset.state = 'open';
    sidebar.setAttribute('aria-hidden', 'false');
  }

  if (backdrop) {
    backdrop.dataset.visible = 'true';
  }

  // Prevent body scroll
  document.body.style.overflow = 'hidden';

  // Trap focus inside drawer
  trapFocus(sidebar);

  isDrawerOpen = true;

  // Dispatch event
  window.dispatchEvent(new CustomEvent('drawerchange', {
    detail: { isOpen: true }
  }));
}

/**
 * Close the drawer (mobile)
 */
function closeDrawer() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('drawerBackdrop');

  if (sidebar) {
    sidebar.dataset.state = 'closed';
    sidebar.setAttribute('aria-hidden', 'true');
  }

  if (backdrop) {
    backdrop.dataset.visible = 'false';
  }

  // Restore body scroll
  document.body.style.overflow = '';

  // Release focus trap
  releaseFocusTrap();

  isDrawerOpen = false;

  // Dispatch event
  window.dispatchEvent(new CustomEvent('drawerchange', {
    detail: { isOpen: false }
  }));
}

/**
 * Toggle drawer state
 */
function toggleDrawer() {
  if (isDrawerOpen) {
    closeDrawer();
  } else {
    openDrawer();
  }
}

/**
 * Toggle sidebar collapsed state (tablet/desktop)
 */
function toggleSidebarCollapse() {
  const sidebar = document.getElementById('sidebar');
  const app = document.querySelector('.app');

  if (!sidebar) return;

  const isCollapsed = sidebar.dataset.state === 'collapsed';

  sidebar.dataset.state = isCollapsed ? 'expanded' : 'collapsed';

  if (app) {
    app.dataset.sidebar = isCollapsed ? 'expanded' : 'collapsed';
  }

  // Store preference
  localStorage.setItem('sidebarState', sidebar.dataset.state);

  // Dispatch event
  window.dispatchEvent(new CustomEvent('sidebarchange', {
    detail: { isCollapsed: !isCollapsed }
  }));
}

/**
 * Initialize touch gestures for drawer
 */
function initDrawerGestures(sidebar, backdrop) {
  if (!sidebar) return;

  let startX = 0;
  let currentX = 0;
  let isDragging = false;

  // Swipe from left edge to open
  document.addEventListener('touchstart', (e) => {
    // Only trigger from left edge when drawer is closed
    if (e.touches[0].clientX < 20 && !isDrawerOpen && !isBreakpoint('md')) {
      startX = e.touches[0].clientX;
      isDragging = true;
    }
  }, { passive: true });

  // Swipe on sidebar to close
  sidebar.addEventListener('touchstart', (e) => {
    if (isDrawerOpen) {
      startX = e.touches[0].clientX;
      isDragging = true;
    }
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;

    currentX = e.touches[0].clientX;
    const diff = currentX - startX;

    // Visual feedback during drag
    if (isDrawerOpen && diff < 0) {
      // Dragging left to close
      const progress = Math.max(-1, diff / sidebar.offsetWidth);
      sidebar.style.transform = `translateX(${progress * 100}%)`;
    } else if (!isDrawerOpen && diff > 0) {
      // Dragging right to open
      const progress = Math.min(1, diff / sidebar.offsetWidth);
      sidebar.style.transform = `translateX(${(progress - 1) * 100}%)`;
    }
  }, { passive: true });

  document.addEventListener('touchend', () => {
    if (!isDragging) return;

    const diff = currentX - startX;
    const threshold = sidebar.offsetWidth * 0.3;

    // Reset transform
    sidebar.style.transform = '';

    if (isDrawerOpen && diff < -threshold) {
      closeDrawer();
    } else if (!isDrawerOpen && diff > threshold) {
      openDrawer();
    }

    isDragging = false;
    startX = 0;
    currentX = 0;
  }, { passive: true });
}

/**
 * Focus trap for drawer
 */
let focusTrapElement = null;
let previouslyFocused = null;

function trapFocus(element) {
  if (!element) return;

  previouslyFocused = document.activeElement;
  focusTrapElement = element;

  const focusables = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  if (focusables.length) {
    focusables[0].focus();
  }

  document.addEventListener('keydown', handleFocusTrap);
}

function handleFocusTrap(e) {
  if (e.key !== 'Tab' || !focusTrapElement) return;

  const focusables = focusTrapElement.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  if (!focusables.length) return;

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function releaseFocusTrap() {
  document.removeEventListener('keydown', handleFocusTrap);
  focusTrapElement = null;

  if (previouslyFocused && previouslyFocused.focus) {
    previouslyFocused.focus();
  }
  previouslyFocused = null;
}

/**
 * Restore sidebar state from localStorage
 */
function restoreSidebarState() {
  const savedState = localStorage.getItem('sidebarState');
  const sidebar = document.getElementById('sidebar');
  const app = document.querySelector('.app');

  if (!sidebar || !isBreakpoint('lg')) return;

  if (savedState === 'collapsed') {
    sidebar.dataset.state = 'collapsed';
    if (app) app.dataset.sidebar = 'collapsed';
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initResponsive();
    restoreSidebarState();
  });
} else {
  initResponsive();
  restoreSidebarState();
}

// Export for use in other modules
window.ResponsiveSystem = {
  getCurrentBreakpoint,
  isBreakpoint,
  openDrawer,
  closeDrawer,
  toggleDrawer,
  toggleSidebarCollapse,
  BREAKPOINTS
};

