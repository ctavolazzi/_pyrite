/**
 * Site Navigation Component
 * Shared across all pages - Dashboard, Docs, etc.
 *
 * Usage: Add <div id="site-nav"></div> where you want the nav to render
 * Then include this script: <script src="/components/nav.js"></script>
 */

(function() {
  'use strict';

  // Detect current page for active state
  const currentPath = window.location.pathname;
  const isDocsPage = currentPath.includes('/docs');
  const isDashboard = currentPath === '/' || currentPath === '/index.html';

  // Render navigation HTML
  function render() {
    const container = document.getElementById('site-nav');
    if (!container) return;

    container.innerHTML = `
      <nav class="site-nav">
        <a href="/" class="site-nav-brand">
          <span class="site-nav-gem">◈</span>
          <span class="site-nav-text">_pyrite</span>
        </a>
        <ul class="site-nav-links" id="siteNavLinks">
          <li>
            <a href="/" class="site-nav-link ${isDashboard ? 'site-nav-link-active' : ''}">Dashboard</a>
          </li>
          <li>
            <a href="/docs/" class="site-nav-link ${isDocsPage ? 'site-nav-link-active' : ''}">Docs</a>
          </li>
          <li class="site-nav-status">
            <span class="site-nav-status-dot" id="apiStatusDot"></span>
            <span>API</span>
          </li>
        </ul>
        <button class="site-nav-toggle" id="siteNavToggle" aria-label="Toggle navigation">☰</button>
      </nav>
    `;

    initEventListeners();
    checkApiStatus();
  }

  // Initialize event listeners
  function initEventListeners() {
    const toggle = document.getElementById('siteNavToggle');
    const links = document.getElementById('siteNavLinks');

    if (toggle && links) {
      // Toggle menu on hamburger click
      toggle.addEventListener('click', function(e) {
        e.stopPropagation();
        links.classList.toggle('open');
        toggle.classList.toggle('active');
      });

      // Close menu when clicking outside
      document.addEventListener('click', function(e) {
        if (!links.contains(e.target) && !toggle.contains(e.target)) {
          links.classList.remove('open');
          toggle.classList.remove('active');
        }
      });

      // Close menu when pressing Escape
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          links.classList.remove('open');
          toggle.classList.remove('active');
        }
      });

      // Close menu when clicking a link
      links.querySelectorAll('.site-nav-link').forEach(function(link) {
        link.addEventListener('click', function() {
          links.classList.remove('open');
          toggle.classList.remove('active');
        });
      });
    }
  }

  // Check API health status
  function checkApiStatus() {
    const dot = document.getElementById('apiStatusDot');
    if (!dot) return;

    fetch('/api/health')
      .then(function(r) { return r.ok ? 'online' : 'offline'; })
      .catch(function() { return 'offline'; })
      .then(function(status) {
        dot.classList.add(status);
      });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();

