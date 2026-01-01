/**
 * Counter System Visualization
 * Interactive dashboard for monitoring and managing the counter system
 */

let validationResults = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  await refreshCounters();
  await checkIntegrity();
  await refreshAuditLog();
});

/**
 * Refresh counter display
 */
async function refreshCounters() {
  const display = document.getElementById('counters-display');
  display.innerHTML = '<div class="loading"><div class="spinner"></div>Loading counters...</div>';

  try {
    const response = await fetch('/api/counter/stats');
    if (!response.ok) throw new Error('Failed to fetch counters');

    const data = await response.json();

    display.innerHTML = `
      <div class="counter-display">
        <label>Work Efforts</label>
        <div class="value">${data.totalWorkEfforts || 0}</div>
      </div>
      <div class="counter-display">
        <label>Tickets</label>
        <div class="value">${data.totalTickets || 0}</div>
      </div>
      <div class="counter-display">
        <label>Checkpoints</label>
        <div class="value">${data.totalCheckpoints || 0}</div>
      </div>
      <h3>By Repository</h3>
      <div class="counter-display">
        <label>Repositories</label>
        <div class="value">${data.repositories || 0}</div>
      </div>
      <p style="color: var(--text-secondary, #a0a0a0); font-size: 0.85rem; margin-top: 1rem;">
        Last updated: ${new Date(data.lastUpdated).toLocaleString()}
      </p>
    `;
  } catch (error) {
    console.error('Error refreshing counters:', error);
    display.innerHTML = `
      <p style="color: #ff5050;">Failed to load counters</p>
      <p style="color: var(--text-secondary, #a0a0a0); font-size: 0.85rem;">
        ${error.message}
      </p>
    `;
  }
}

/**
 * Check system integrity
 */
async function checkIntegrity() {
  const display = document.getElementById('integrity-display');
  display.innerHTML = '<div class="loading"><div class="spinner"></div>Checking...</div>';

  try {
    const response = await fetch('/api/counter/stats');
    if (!response.ok) throw new Error('Failed to fetch integrity status');

    const data = await response.json();
    const integrity = data.integrity || {};

    const statusClass = integrity.validationStatus === 'valid' ? 'valid' : 'invalid';
    const statusText = integrity.validationStatus === 'valid' ? 'Valid' : 'Invalid';

    display.innerHTML = `
      <div class="counter-display">
        <label>Checksum Status</label>
        <span class="status-indicator ${statusClass}">
          <span class="status-dot"></span>
          ${statusText}
        </span>
      </div>
      <div class="counter-display">
        <label>Last Validation</label>
        <div style="color: var(--text-secondary, #a0a0a0); font-size: 0.85rem;">
          ${new Date(integrity.lastValidation).toLocaleString()}
        </div>
      </div>
      <div class="counter-display">
        <label>Audit Entries</label>
        <div class="value" style="font-size: 1.2rem;">${data.auditEntries || 0}</div>
      </div>
    `;
  } catch (error) {
    console.error('Error checking integrity:', error);
    display.innerHTML = `
      <p style="color: #ff5050;">Failed to check integrity</p>
      <p style="color: var(--text-secondary, #a0a0a0); font-size: 0.85rem;">
        ${error.message}
      </p>
    `;
  }
}

/**
 * Run validation
 */
async function runValidation() {
  const statusDisplay = document.getElementById('validation-status');
  const checksDisplay = document.getElementById('validation-checks');
  const repairBtn = document.getElementById('repair-btn');

  statusDisplay.innerHTML = '<div class="loading"><div class="spinner"></div>Running validation...</div>';
  checksDisplay.innerHTML = '<div class="loading"><div class="spinner"></div>Validating...</div>';

  try {
    const response = await fetch('/api/counter/validate');
    if (!response.ok) throw new Error('Validation failed');

    validationResults = await response.json();

    // Update status
    const statusClass = validationResults.status === 'valid' ? 'valid' : 'invalid';
    const statusText = validationResults.status === 'valid' ? 'All Checks Passed' : 'Issues Found';

    statusDisplay.innerHTML = `
      <div class="counter-display">
        <label>Overall Status</label>
        <span class="status-indicator ${statusClass}">
          <span class="status-dot"></span>
          ${statusText}
        </span>
      </div>
      <div class="counter-display">
        <label>Checks Run</label>
        <div class="value" style="font-size: 1.2rem;">${validationResults.checks.length}</div>
      </div>
      <div class="counter-display">
        <label>Issues Found</label>
        <div class="value" style="font-size: 1.2rem; color: ${validationResults.discrepancies.length > 0 ? '#ff5050' : '#00c864'}">
          ${validationResults.discrepancies.length}
        </div>
      </div>
      <p style="color: var(--text-secondary, #a0a0a0); font-size: 0.85rem; margin-top: 1rem;">
        Validated: ${new Date(validationResults.timestamp).toLocaleString()}
      </p>
    `;

    // Update checks display
    let checksHtml = '';
    for (const check of validationResults.checks) {
      const iconClass = check.passed ? 'pass' : 'fail';
      const icon = check.passed ? '✓' : '✗';

      checksHtml += `
        <div class="validation-check">
          <div class="check-icon ${iconClass}">${icon}</div>
          <div class="check-content">
            <div class="name">${check.name}</div>
            <div class="message">${check.message}</div>
          </div>
        </div>
      `;
    }

    checksDisplay.innerHTML = checksHtml || '<p style="color: var(--text-secondary, #a0a0a0);">No checks run</p>';

    // Enable repair button if there are issues
    repairBtn.disabled = validationResults.discrepancies.length === 0;

  } catch (error) {
    console.error('Error running validation:', error);
    statusDisplay.innerHTML = `
      <p style="color: #ff5050;">Validation failed</p>
      <p style="color: var(--text-secondary, #a0a0a0); font-size: 0.85rem;">
        ${error.message}
      </p>
    `;
    checksDisplay.innerHTML = `
      <p style="color: #ff5050;">Failed to run validation checks</p>
    `;
  }
}

/**
 * Auto-repair issues
 */
async function autoRepair() {
  if (!validationResults || validationResults.discrepancies.length === 0) {
    alert('No issues to repair');
    return;
  }

  if (!confirm(`This will automatically repair ${validationResults.discrepancies.length} issue(s). Continue?`)) {
    return;
  }

  const statusDisplay = document.getElementById('validation-status');
  statusDisplay.innerHTML = '<div class="loading"><div class="spinner"></div>Repairing...</div>';

  try {
    const response = await fetch('/api/counter/repair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validationResults)
    });

    if (!response.ok) throw new Error('Repair failed');

    const result = await response.json();

    alert(`Repair complete: ${result.successCount}/${result.totalCount} issues fixed`);

    // Re-run validation
    await runValidation();
    await refreshCounters();
    await checkIntegrity();

  } catch (error) {
    console.error('Error during repair:', error);
    alert(`Repair failed: ${error.message}`);
    statusDisplay.innerHTML = `
      <p style="color: #ff5050;">Repair failed</p>
      <p style="color: var(--text-secondary, #a0a0a0); font-size: 0.85rem;">
        ${error.message}
      </p>
    `;
  }
}

/**
 * Refresh audit log
 */
async function refreshAuditLog() {
  const display = document.getElementById('audit-log');
  display.innerHTML = '<div class="loading"><div class="spinner"></div>Loading audit log...</div>';

  try {
    const response = await fetch('/api/counter/audit');
    if (!response.ok) throw new Error('Failed to fetch audit log');

    const entries = await response.json();

    if (entries.length === 0) {
      display.innerHTML = '<p style="color: var(--text-secondary, #a0a0a0);">No audit entries yet</p>';
      return;
    }

    let html = '';
    for (const entry of entries) {
      const timestamp = new Date(entry.timestamp).toLocaleString();
      const context = entry.context ? JSON.stringify(entry.context) : '';

      html += `
        <div class="audit-entry">
          <div class="timestamp">${timestamp}</div>
          <div class="action">
            ${entry.action.toUpperCase()} ${entry.counter} → ${entry.value || entry.newValue}
            ${context ? `<br><span style="font-size: 0.9em; color: var(--text-secondary, #a0a0a0);">${context}</span>` : ''}
          </div>
        </div>
      `;
    }

    display.innerHTML = html;
  } catch (error) {
    console.error('Error refreshing audit log:', error);
    display.innerHTML = `
      <p style="color: #ff5050;">Failed to load audit log</p>
      <p style="color: var(--text-secondary, #a0a0a0); font-size: 0.85rem;">
        ${error.message}
      </p>
    `;
  }
}

/**
 * Preview migration
 */
async function previewMigration() {
  const statusDisplay = document.getElementById('migration-status');
  statusDisplay.innerHTML = '<div class="loading"><div class="spinner"></div>Previewing migration...</div>';

  try {
    const response = await fetch('/api/counter/migrate/preview');
    if (!response.ok) throw new Error('Preview failed');

    const preview = await response.json();

    let html = '<h3>Migration Preview</h3>';

    if (preview.changes.length === 0) {
      html += '<p style="color: #00c864;">✓ No migration needed - counters are up to date</p>';
    } else {
      html += `<p style="color: #ffc800;">⚠ ${preview.changes.length} counter(s) would be updated:</p>`;
      html += '<div style="margin-top: 1rem;">';

      for (const change of preview.changes) {
        html += `
          <div class="counter-display">
            <label>${change.counter}</label>
            <div style="font-size: 0.9rem;">
              <span style="color: #ff5050;">${change.current}</span>
              →
              <span style="color: #00c864;">${change.proposed}</span>
              <span style="color: var(--text-secondary, #a0a0a0);">(${change.change > 0 ? '+' : ''}${change.change})</span>
            </div>
          </div>
        `;
      }

      html += '</div>';
    }

    html += `<p style="color: var(--text-secondary, #a0a0a0); font-size: 0.85rem; margin-top: 1rem;">
      Preview generated: ${new Date(preview.timestamp).toLocaleString()}
    </p>`;

    statusDisplay.innerHTML = html;

  } catch (error) {
    console.error('Error previewing migration:', error);
    statusDisplay.innerHTML = `
      <p style="color: #ff5050;">Preview failed</p>
      <p style="color: var(--text-secondary, #a0a0a0); font-size: 0.85rem;">
        ${error.message}
      </p>
    `;
  }
}

/**
 * Run migration
 */
async function runMigration() {
  if (!confirm('This will scan the filesystem and initialize counters. This should only be done once. Continue?')) {
    return;
  }

  const statusDisplay = document.getElementById('migration-status');
  statusDisplay.innerHTML = '<div class="loading"><div class="spinner"></div>Running migration...</div>';

  try {
    const response = await fetch('/api/counter/migrate', {
      method: 'POST'
    });

    if (!response.ok) throw new Error('Migration failed');

    const result = await response.json();

    let html = '<h3>Migration Complete</h3>';
    html += `
      <div class="counter-display">
        <label>Work Efforts Initialized</label>
        <div class="value" style="font-size: 1.2rem;">${result.initResults.countersSet.workEfforts}</div>
      </div>
      <div class="counter-display">
        <label>Tickets Initialized</label>
        <div class="value" style="font-size: 1.2rem;">${result.initResults.countersSet.tickets}</div>
      </div>
      <div class="counter-display">
        <label>Checkpoints Initialized</label>
        <div class="value" style="font-size: 1.2rem;">${result.initResults.countersSet.checkpoints}</div>
      </div>
      <p style="color: #00c864; margin-top: 1rem;">✓ Migration successful</p>
      <p style="color: var(--text-secondary, #a0a0a0); font-size: 0.85rem;">
        Completed: ${new Date(result.timestamp).toLocaleString()}
      </p>
    `;

    statusDisplay.innerHTML = html;

    // Refresh displays
    await refreshCounters();
    await checkIntegrity();
    await refreshAuditLog();

  } catch (error) {
    console.error('Error running migration:', error);
    statusDisplay.innerHTML = `
      <p style="color: #ff5050;">Migration failed</p>
      <p style="color: var(--text-secondary, #a0a0a0); font-size: 0.85rem;">
        ${error.message}
      </p>
    `;
  }
}

/**
 * View detailed statistics
 */
function viewStatistics() {
  // This could open a modal or navigate to a detailed stats page
  // For now, just log to console
  fetch('/api/counter/stats')
    .then(res => res.json())
    .then(data => {
      console.log('=== Counter System Statistics ===');
      console.log('Version:', data.version);
      console.log('Created:', data.created);
      console.log('Last Updated:', data.lastUpdated);
      console.log('Total Work Efforts:', data.totalWorkEfforts);
      console.log('Total Tickets:', data.totalTickets);
      console.log('Total Checkpoints:', data.totalCheckpoints);
      console.log('Repositories:', data.repositories);
      console.log('Audit Entries:', data.auditEntries);
      console.log('Integrity:', data.integrity);
      alert('Statistics logged to console (F12)');
    })
    .catch(error => {
      console.error('Error fetching statistics:', error);
      alert('Failed to fetch statistics');
    });
}
