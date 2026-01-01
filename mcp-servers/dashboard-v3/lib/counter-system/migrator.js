/**
 * Counter System Migrator
 *
 * Scans existing work efforts and tickets to initialize or update counter state.
 * Handles migration from the current random-suffix system to sequential numbering.
 */

import fs from 'fs/promises';
import path from 'path';

class CounterMigrator {
  constructor(counterSystem, workEffortsPath) {
    this.counterSystem = counterSystem;
    this.workEffortsPath = workEffortsPath;
  }

  /**
   * Scan filesystem and initialize counters
   */
  async scanAndInitialize() {
    console.log('[Migrator] Starting filesystem scan...');

    const results = {
      timestamp: new Date().toISOString(),
      workEfforts: {
        scanned: 0,
        byRepo: {}
      },
      tickets: {
        scanned: 0,
        byWorkEffort: {},
        byRepo: {}
      },
      checkpoints: {
        scanned: 0
      }
    };

    try {
      // Scan work efforts
      const entries = await fs.readdir(this.workEffortsPath, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        // Check if it's a work effort directory
        const weMatch = entry.name.match(/^(WE-\d{6}-[a-z0-9]{4})_/);
        if (weMatch) {
          const weId = weMatch[1];
          results.workEfforts.scanned++;

          // Try to determine repo from index file
          const indexPath = path.join(this.workEffortsPath, entry.name, `${weId}_index.md`);
          let repo = '_pyrite'; // default

          try {
            const content = await fs.readFile(indexPath, 'utf8');
            const repoMatch = content.match(/repository:\s*(.+)/);
            if (repoMatch) {
              repo = repoMatch[1].trim();
            }
          } catch (error) {
            // Index file might not exist, use default
          }

          if (!results.workEfforts.byRepo[repo]) {
            results.workEfforts.byRepo[repo] = 0;
          }
          results.workEfforts.byRepo[repo]++;

          // Scan tickets for this work effort
          const ticketsPath = path.join(this.workEffortsPath, entry.name, 'tickets');
          try {
            const ticketFiles = await fs.readdir(ticketsPath);
            const mdFiles = ticketFiles.filter(f => f.endsWith('.md'));

            results.tickets.scanned += mdFiles.length;

            if (!results.tickets.byWorkEffort[weId]) {
              results.tickets.byWorkEffort[weId] = 0;
            }
            results.tickets.byWorkEffort[weId] += mdFiles.length;

            if (!results.tickets.byRepo[repo]) {
              results.tickets.byRepo[repo] = 0;
            }
            results.tickets.byRepo[repo] += mdFiles.length;

          } catch (error) {
            if (error.code !== 'ENOENT') {
              throw error;
            }
            // No tickets directory, that's ok
          }
        }

        // Check if it's the checkpoints directory
        if (entry.name === 'checkpoints') {
          const checkpointsPath = path.join(this.workEffortsPath, entry.name);
          try {
            const checkpointFiles = await fs.readdir(checkpointsPath);
            const ckptFiles = checkpointFiles.filter(f => f.match(/^CKPT-\d{6}-\d{4}\.md$/));
            results.checkpoints.scanned = ckptFiles.length;
          } catch (error) {
            // Ignore errors
          }
        }
      }

      console.log('[Migrator] Scan complete:');
      console.log(`  Work Efforts: ${results.workEfforts.scanned}`);
      console.log(`  Tickets: ${results.tickets.scanned}`);
      console.log(`  Checkpoints: ${results.checkpoints.scanned}`);

      return results;
    } catch (error) {
      console.error('[Migrator] Scan failed:', error);
      throw error;
    }
  }

  /**
   * Initialize counter state from scan results
   */
  async initializeFromScan(scanResults) {
    console.log('[Migrator] Initializing counter state...');

    try {
      // Set global counters
      await this.counterSystem.setCounter(
        'workEfforts.global',
        scanResults.workEfforts.scanned,
        'migration: scan-based initialization'
      );

      await this.counterSystem.setCounter(
        'tickets.global',
        scanResults.tickets.scanned,
        'migration: scan-based initialization'
      );

      await this.counterSystem.setCounter(
        'checkpoints.global',
        scanResults.checkpoints.scanned,
        'migration: scan-based initialization'
      );

      // Set per-repo work efforts counters
      for (const [repo, count] of Object.entries(scanResults.workEfforts.byRepo)) {
        await this.counterSystem.setCounter(
          `workEfforts.byRepo.${repo}`,
          count,
          'migration: scan-based initialization'
        );
      }

      // Set per-work-effort ticket counters
      for (const [weId, count] of Object.entries(scanResults.tickets.byWorkEffort)) {
        await this.counterSystem.setCounter(
          `tickets.byWorkEffort.${weId}`,
          count,
          'migration: scan-based initialization'
        );
      }

      // Set per-repo ticket counters
      for (const [repo, count] of Object.entries(scanResults.tickets.byRepo)) {
        await this.counterSystem.setCounter(
          `tickets.byRepo.${repo}`,
          count,
          'migration: scan-based initialization'
        );
      }

      console.log('[Migrator] Counter state initialized successfully');

      return {
        success: true,
        timestamp: new Date().toISOString(),
        countersSet: {
          workEfforts: scanResults.workEfforts.scanned,
          tickets: scanResults.tickets.scanned,
          checkpoints: scanResults.checkpoints.scanned
        }
      };
    } catch (error) {
      console.error('[Migrator] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Full migration: scan + initialize
   */
  async migrate() {
    console.log('[Migrator] Starting full migration...');

    const scanResults = await this.scanAndInitialize();
    const initResults = await this.initializeFromScan(scanResults);

    return {
      timestamp: new Date().toISOString(),
      scanResults,
      initResults
    };
  }

  /**
   * Generate migration report
   */
  async generateReport() {
    const scanResults = await this.scanAndInitialize();
    const currentState = this.counterSystem.getCurrentCounters();

    const report = {
      timestamp: new Date().toISOString(),
      filesystem: {
        workEfforts: scanResults.workEfforts.scanned,
        tickets: scanResults.tickets.scanned,
        checkpoints: scanResults.checkpoints.scanned,
        byRepo: scanResults.workEfforts.byRepo
      },
      counterState: {
        workEfforts: currentState.workEfforts.global,
        tickets: currentState.tickets.global,
        checkpoints: currentState.checkpoints.global
      },
      discrepancies: {
        workEfforts: scanResults.workEfforts.scanned - currentState.workEfforts.global,
        tickets: scanResults.tickets.scanned - currentState.tickets.global,
        checkpoints: scanResults.checkpoints.scanned - currentState.checkpoints.global
      },
      needsMigration: false
    };

    report.needsMigration = (
      report.discrepancies.workEfforts !== 0 ||
      report.discrepancies.tickets !== 0 ||
      report.discrepancies.checkpoints !== 0
    );

    return report;
  }

  /**
   * Preview what would change without actually changing it
   */
  async previewMigration() {
    const report = await this.generateReport();

    const preview = {
      timestamp: new Date().toISOString(),
      currentState: report.counterState,
      proposedState: report.filesystem,
      changes: []
    };

    if (report.discrepancies.workEfforts !== 0) {
      preview.changes.push({
        counter: 'workEfforts.global',
        current: report.counterState.workEfforts,
        proposed: report.filesystem.workEfforts,
        change: report.discrepancies.workEfforts
      });
    }

    if (report.discrepancies.tickets !== 0) {
      preview.changes.push({
        counter: 'tickets.global',
        current: report.counterState.tickets,
        proposed: report.filesystem.tickets,
        change: report.discrepancies.tickets
      });
    }

    if (report.discrepancies.checkpoints !== 0) {
      preview.changes.push({
        counter: 'checkpoints.global',
        current: report.counterState.checkpoints,
        proposed: report.filesystem.checkpoints,
        change: report.discrepancies.checkpoints
      });
    }

    preview.needsMigration = report.needsMigration;

    return preview;
  }
}

export default CounterMigrator;
