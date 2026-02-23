/**
 * Site Footer Component
 * Shared across all pages - Dashboard, Docs, etc.
 *
 * Usage: Add <div id="site-footer"></div> where you want the footer to render
 * Then include this script: <script src="/components/footer.js"></script>
 */

(function() {
  'use strict';

  // Configuration
  const VERSION = 'v0.2.0';
  const GITHUB_URL = 'https://github.com/ctavolazzi/pyrite';

  // Render footer HTML
  function render() {
    const container = document.getElementById('site-footer');
    if (!container) return;

    container.innerHTML = `
      <footer class="site-footer">
        <div class="footer-left">
          <span class="footer-brand">◈ _pyrite Mission Control</span>
          <span class="footer-sep">•</span>
          <span class="footer-version">${VERSION}</span>
        </div>
        <div class="footer-right">
          <a href="/docs/" class="footer-link">Docs</a>
          <span class="footer-sep">•</span>
          <a href="${GITHUB_URL}" class="footer-link" target="_blank" rel="noopener">GitHub</a>
          <span class="footer-sep">•</span>
          <span class="footer-status" id="footerStatus">
            <span class="status-dot" id="footerStatusDot"></span>
            <span class="status-label" id="footerStatusLabel">Checking...</span>
          </span>
        </div>
      </footer>
    `;

    checkSystemStatus();
  }

  // Check system status
  function checkSystemStatus() {
    const dot = document.getElementById('footerStatusDot');
    const label = document.getElementById('footerStatusLabel');
    if (!dot || !label) return;

    fetch('/api/health')
      .then(function(r) {
        if (r.ok) {
          dot.classList.add('online');
          label.textContent = 'System Online';
        } else {
          dot.classList.add('offline');
          label.textContent = 'System Offline';
        }
      })
      .catch(function() {
        dot.classList.add('offline');
        label.textContent = 'System Offline';
      });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();

