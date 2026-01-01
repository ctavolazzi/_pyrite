/**
 * Counter System Validator
 *
 * Validates counter state against actual filesystem to ensure accuracy and consistency.
 * Can detect discrepancies and suggest corrections.
 */

import fs from 'fs/promises';
import path from 'path';

class CounterValidator {
  constructor(counterSystem, workEffortsPath) {
    this.counterSystem = counterSystem;
    this.workEffortsPath = workEffortsPath;
  }

  /**
   * Run full validation
   */
  async validate() {
    console.log('[Validator] Starting validation...');

    const results = {
      timestamp: new Date().toISOString(),
      status: 'unknown',
      checks: [],
      discrepancies: [],
      suggestions: []
    };

    try {
      // Check 1: Verify work efforts count
      const weCheck = await this.validateWorkEffortsCount();
      results.checks.push(weCheck);
      if (!weCheck.passed) {
        results.discrepancies.push(weCheck);
      }

      // Check 2: Verify tickets count
      const ticketCheck = await this.validateTicketsCount();
      results.checks.push(ticketCheck);
      if (!ticketCheck.passed) {
        results.discrepancies.push(ticketCheck);
      }

      // Check 3: Verify per-work-effort ticket counts
      const perWECheck = await this.validatePerWorkEffortCounts();
      results.checks.push(perWECheck);
      if (!perWECheck.passed) {
        results.discrepancies.push(perWECheck);
      }

      // Check 4: Verify state integrity (checksum)
      const integrityCheck = await this.validateStateIntegrity();
      results.checks.push(integrityCheck);
      if (!integrityCheck.passed) {
        results.discrepancies.push(integrityCheck);
      }

      // Check 5: Verify ID format consistency
      const formatCheck = await this.validateIDFormats();
      results.checks.push(formatCheck);
      if (!formatCheck.passed) {
        results.discrepancies.push(formatCheck);
      }

      // Determine overall status
      if (results.discrepancies.length === 0) {
        results.status = 'valid';
      } else {
        results.status = 'invalid';
        results.suggestions = this.generateSuggestions(results.discrepancies);
      }

      console.log(`[Validator] Validation complete: ${results.status}`);
      console.log(`[Validator] Passed: ${results.checks.filter(c => c.passed).length}/${results.checks.length}`);

      return results;
    } catch (error) {
      results.status = 'error';
      results.error = error.message;
      console.error('[Validator] Validation error:', error);
      return results;
    }
  }

  /**
   * Validate work efforts count
   */
  async validateWorkEffortsCount() {
    try {
      const entries = await fs.readdir(this.workEffortsPath, { withFileTypes: true });
      const weDirs = entries.filter(entry =>
        entry.isDirectory() && entry.name.match(/^WE-\d{6}-[a-z0-9]{4}_/)
      );

      const actualCount = weDirs.length;
      const counterState = this.counterSystem.getCurrentCounters();
      const stateCount = counterState.workEfforts.global;

      const passed = actualCount === stateCount;

      return {
        name: 'Work Efforts Count',
        passed,
        actual: actualCount,
        expected: stateCount,
        difference: actualCount - stateCount,
        message: passed
          ? 'Work efforts count matches'
          : `Mismatch: Found ${actualCount} work efforts, state shows ${stateCount}`
      };
    } catch (error) {
      return {
        name: 'Work Efforts Count',
        passed: false,
        error: error.message
      };
    }
  }

  /**
   * Validate total tickets count
   */
  async validateTicketsCount() {
    try {
      const entries = await fs.readdir(this.workEffortsPath, { withFileTypes: true });
      const weDirs = entries.filter(entry =>
        entry.isDirectory() && entry.name.match(/^WE-\d{6}-[a-z0-9]{4}_/)
      );

      let totalTickets = 0;

      for (const weDir of weDirs) {
        const ticketsPath = path.join(this.workEffortsPath, weDir.name, 'tickets');
        try {
          const ticketFiles = await fs.readdir(ticketsPath);
          const mdFiles = ticketFiles.filter(f => f.endsWith('.md'));
          totalTickets += mdFiles.length;
        } catch (error) {
          // Tickets directory might not exist
          if (error.code !== 'ENOENT') {
            throw error;
          }
        }
      }

      const counterState = this.counterSystem.getCurrentCounters();
      const stateCount = counterState.tickets.global;

      const passed = totalTickets === stateCount;

      return {
        name: 'Tickets Count',
        passed,
        actual: totalTickets,
        expected: stateCount,
        difference: totalTickets - stateCount,
        message: passed
          ? 'Tickets count matches'
          : `Mismatch: Found ${totalTickets} tickets, state shows ${stateCount}`
      };
    } catch (error) {
      return {
        name: 'Tickets Count',
        passed: false,
        error: error.message
      };
    }
  }

  /**
   * Validate per-work-effort ticket counts
   */
  async validatePerWorkEffortCounts() {
    try {
      const entries = await fs.readdir(this.workEffortsPath, { withFileTypes: true });
      const weDirs = entries.filter(entry =>
        entry.isDirectory() && entry.name.match(/^WE-\d{6}-[a-z0-9]{4}_/)
      );

      const discrepancies = [];
      const counterState = this.counterSystem.getCurrentCounters();

      for (const weDir of weDirs) {
        // Extract WE ID from directory name
        const match = weDir.name.match(/^(WE-\d{6}-[a-z0-9]{4})_/);
        if (!match) continue;

        const weId = match[1];
        const ticketsPath = path.join(this.workEffortsPath, weDir.name, 'tickets');

        let actualCount = 0;
        try {
          const ticketFiles = await fs.readdir(ticketsPath);
          actualCount = ticketFiles.filter(f => f.endsWith('.md')).length;
        } catch (error) {
          if (error.code !== 'ENOENT') {
            throw error;
          }
        }

        const stateCount = counterState.tickets.byWorkEffort[weId] || 0;

        if (actualCount !== stateCount) {
          discrepancies.push({
            workEffort: weId,
            actual: actualCount,
            expected: stateCount,
            difference: actualCount - stateCount
          });
        }
      }

      const passed = discrepancies.length === 0;

      return {
        name: 'Per-Work-Effort Ticket Counts',
        passed,
        discrepancies,
        message: passed
          ? 'All per-work-effort ticket counts match'
          : `Found ${discrepancies.length} work efforts with mismatched ticket counts`
      };
    } catch (error) {
      return {
        name: 'Per-Work-Effort Ticket Counts',
        passed: false,
        error: error.message
      };
    }
  }

  /**
   * Validate state integrity (checksum)
   */
  async validateStateIntegrity() {
    try {
      const isValid = await this.counterSystem.verifyIntegrity();

      return {
        name: 'State Integrity',
        passed: isValid,
        message: isValid
          ? 'State checksum is valid'
          : 'State checksum mismatch - possible corruption'
      };
    } catch (error) {
      return {
        name: 'State Integrity',
        passed: false,
        error: error.message
      };
    }
  }

  /**
   * Validate ID format consistency
   */
  async validateIDFormats() {
    try {
      const entries = await fs.readdir(this.workEffortsPath, { withFileTypes: true });
      const weDirs = entries.filter(entry => entry.isDirectory());

      const invalidFormats = [];

      for (const weDir of weDirs) {
        // Check WE directory format
        if (!weDir.name.match(/^WE-\d{6}-[a-z0-9]{4}_/) &&
            !weDir.name.match(/^\d{2}-\d{2}_/) &&  // Allow Johnny Decimal
            weDir.name !== 'checkpoints') {
          invalidFormats.push({
            type: 'directory',
            name: weDir.name,
            issue: 'Invalid work effort directory format'
          });
        }

        // Check ticket file formats
        const ticketsPath = path.join(this.workEffortsPath, weDir.name, 'tickets');
        try {
          const ticketFiles = await fs.readdir(ticketsPath);
          for (const ticket of ticketFiles) {
            if (ticket.endsWith('.md') && !ticket.match(/^TKT-[a-z0-9]{4}-\d{3}_/)) {
              invalidFormats.push({
                type: 'ticket',
                name: ticket,
                workEffort: weDir.name,
                issue: 'Invalid ticket file format'
              });
            }
          }
        } catch (error) {
          if (error.code !== 'ENOENT') {
            throw error;
          }
        }
      }

      const passed = invalidFormats.length === 0;

      return {
        name: 'ID Format Consistency',
        passed,
        invalidFormats,
        message: passed
          ? 'All IDs follow correct format'
          : `Found ${invalidFormats.length} items with invalid format`
      };
    } catch (error) {
      return {
        name: 'ID Format Consistency',
        passed: false,
        error: error.message
      };
    }
  }

  /**
   * Generate suggestions for fixing discrepancies
   */
  generateSuggestions(discrepancies) {
    const suggestions = [];

    for (const check of discrepancies) {
      switch (check.name) {
        case 'Work Efforts Count':
          if (check.difference > 0) {
            suggestions.push({
              issue: check.name,
              suggestion: `Increase global work efforts counter by ${check.difference}`,
              action: 'setCounter',
              params: {
                path: 'workEfforts.global',
                value: check.actual
              }
            });
          } else {
            suggestions.push({
              issue: check.name,
              suggestion: `Counter is ${Math.abs(check.difference)} higher than actual. This may indicate deleted work efforts.`,
              action: 'manual_review'
            });
          }
          break;

        case 'Tickets Count':
          if (check.difference > 0) {
            suggestions.push({
              issue: check.name,
              suggestion: `Increase global tickets counter by ${check.difference}`,
              action: 'setCounter',
              params: {
                path: 'tickets.global',
                value: check.actual
              }
            });
          } else {
            suggestions.push({
              issue: check.name,
              suggestion: `Counter is ${Math.abs(check.difference)} higher than actual. This may indicate deleted tickets.`,
              action: 'manual_review'
            });
          }
          break;

        case 'Per-Work-Effort Ticket Counts':
          for (const disc of check.discrepancies) {
            suggestions.push({
              issue: `Ticket count for ${disc.workEffort}`,
              suggestion: `Set ${disc.workEffort} ticket count to ${disc.actual}`,
              action: 'setCounter',
              params: {
                path: `tickets.byWorkEffort.${disc.workEffort}`,
                value: disc.actual
              }
            });
          }
          break;

        case 'State Integrity':
          suggestions.push({
            issue: check.name,
            suggestion: 'Recalculate and save state to fix checksum',
            action: 'recalculate_checksum'
          });
          break;

        case 'ID Format Consistency':
          suggestions.push({
            issue: check.name,
            suggestion: 'Review and fix invalid ID formats manually',
            action: 'manual_review',
            details: check.invalidFormats
          });
          break;
      }
    }

    return suggestions;
  }

  /**
   * Auto-repair discrepancies
   */
  async autoRepair(validationResults) {
    console.log('[Validator] Starting auto-repair...');

    const repairs = [];

    for (const suggestion of validationResults.suggestions) {
      if (suggestion.action === 'setCounter') {
        try {
          await this.counterSystem.setCounter(
            suggestion.params.path,
            suggestion.params.value,
            `auto-repair: ${suggestion.issue}`
          );
          repairs.push({
            success: true,
            action: suggestion.action,
            suggestion: suggestion.suggestion
          });
          console.log(`[Validator] Repaired: ${suggestion.suggestion}`);
        } catch (error) {
          repairs.push({
            success: false,
            action: suggestion.action,
            suggestion: suggestion.suggestion,
            error: error.message
          });
          console.error(`[Validator] Failed to repair: ${suggestion.suggestion}`, error);
        }
      } else if (suggestion.action === 'recalculate_checksum') {
        try {
          await this.counterSystem.saveState();
          repairs.push({
            success: true,
            action: suggestion.action,
            suggestion: suggestion.suggestion
          });
          console.log(`[Validator] Repaired: ${suggestion.suggestion}`);
        } catch (error) {
          repairs.push({
            success: false,
            action: suggestion.action,
            suggestion: suggestion.suggestion,
            error: error.message
          });
        }
      } else {
        repairs.push({
          success: false,
          action: suggestion.action,
          suggestion: suggestion.suggestion,
          reason: 'Requires manual intervention'
        });
      }
    }

    console.log(`[Validator] Auto-repair complete: ${repairs.filter(r => r.success).length}/${repairs.length} successful`);

    return {
      timestamp: new Date().toISOString(),
      repairs,
      successCount: repairs.filter(r => r.success).length,
      totalCount: repairs.length
    };
  }
}

export default CounterValidator;
