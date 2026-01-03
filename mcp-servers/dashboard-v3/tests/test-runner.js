#!/usr/bin/env node
/**
 * @fileoverview Custom test runner with progress bar and verbose output
 *
 * Wraps Node's built-in test runner with:
 * - Real-time progress indicators
 * - Color-coded output
 * - Summary statistics
 * - Verbose mode option
 */

import { spawn } from 'child_process';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse command line arguments
const args = process.argv.slice(2);
const verbose = args.includes('--verbose') || args.includes('-v');
const testPattern = args.find(arg => !arg.startsWith('--') && !arg.startsWith('-')) || 'tests/**/*.test.js';

// Statistics
let stats = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  duration: 0,
  currentTest: '',
  currentSuite: ''
};

// Progress tracking
let testCount = 0;
const startTime = Date.now();

// Colors
const colors = {
  pass: chalk.green,
  fail: chalk.red,
  skip: chalk.yellow,
  info: chalk.blue,
  dim: chalk.dim,
  accent: chalk.hex('#ff9d3d')
};

// Progress bar helper
function renderProgressBar(current, total, width = 40) {
  // Guard against division by zero or invalid totals
  if (!total || total <= 0 || !isFinite(total)) {
    return `${colors.accent('░'.repeat(width))} 0%`;
  }

  const percentage = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * width);
  const empty = Math.max(0, width - filled); // Ensure non-negative

  const bar = '█'.repeat(Math.max(0, filled)) + '░'.repeat(empty);
  return `${colors.accent(bar)} ${percentage}%`;
}

// Parse TAP output
function parseTAPLine(line) {
  // Test result: "ok 1 - Test Name" or "not ok 2 - Test Name"
  const okMatch = line.match(/^(ok|not ok)\s+(\d+)\s+-\s+(.+)$/);
  if (okMatch) {
    const [, status, num, name] = okMatch;
    return { type: 'result', status: status === 'ok', num: parseInt(num), name };
  }

  // Test count: "1..6"
  const countMatch = line.match(/^(\d+)\.\.(\d+)$/);
  if (countMatch) {
    return { type: 'count', start: parseInt(countMatch[1]), total: parseInt(countMatch[2]) };
  }

  // Summary: "# tests 6"
  const summaryMatch = line.match(/^#\s+(\w+)\s+(\d+)$/);
  if (summaryMatch) {
    return { type: 'summary', key: summaryMatch[1], value: parseInt(summaryMatch[2]) };
  }

  // Subtest: "# Subtest: Test Name"
  const subtestMatch = line.match(/^#\s+Subtest:\s+(.+)$/);
  if (subtestMatch) {
    return { type: 'subtest', name: subtestMatch[1] };
  }

  return null;
}

// Main test runner
function runTests() {
  console.log(colors.accent.bold('\n◈ Mission Control Test Runner\n'));
  console.log(colors.dim(`Pattern: ${testPattern}`));
  console.log(colors.dim(`Verbose: ${verbose ? 'Yes' : 'No'}\n`));

  const nodeArgs = [
    '--test',
    '--test-reporter', verbose ? 'spec' : 'tap',
    testPattern
  ];

  const proc = spawn('node', nodeArgs, {
    cwd: path.join(__dirname, '..'),
    stdio: ['inherit', 'pipe', 'pipe']
  });

  let outputBuffer = '';

  proc.stdout.on('data', (data) => {
    outputBuffer += data.toString();
    const lines = outputBuffer.split('\n');
    outputBuffer = lines.pop() || ''; // Keep incomplete line

    for (const line of lines) {
      if (verbose) {
        // In verbose mode, show all output
        process.stdout.write(line + '\n');
      } else {
        // Parse and display progress
        const parsed = parseTAPLine(line.trim());

        if (parsed) {
          if (parsed.type === 'count') {
            stats.total = parsed.total;
            console.log(colors.info(`Running ${stats.total} test(s)...\n`));
          } else if (parsed.type === 'subtest') {
            stats.currentTest = parsed.name;
            if (verbose) {
              console.log(colors.dim(`  → ${parsed.name}`));
            }
          } else if (parsed.type === 'result') {
            testCount++;
            if (parsed.status) {
              stats.passed++;
              process.stdout.write(colors.pass('✓'));
            } else {
              stats.failed++;
              process.stdout.write(colors.fail('✗'));
              if (!verbose) {
                console.log(colors.fail(`\n  ✗ ${parsed.name}`));
              }
            }

            // Show progress every 10 tests or at the end
            // Only render if we know the total, or if we're showing individual test results
            if (stats.total > 0 && (testCount % 10 === 0 || testCount === stats.total)) {
              const progress = renderProgressBar(testCount, stats.total);
              process.stdout.write(`\r${progress} ${testCount}/${stats.total}`);
            }
          } else if (parsed.type === 'summary') {
            if (parsed.key === 'tests') {
              stats.total = parsed.value;
            } else if (parsed.key === 'pass') {
              stats.passed = parsed.value;
            } else if (parsed.key === 'fail') {
              stats.failed = parsed.value;
            } else if (parsed.key === 'skip') {
              stats.skipped = parsed.value;
            }
          }
        }
      }
    }
  });

  proc.stderr.on('data', (data) => {
    const line = data.toString();
    if (verbose || line.includes('Error') || line.includes('FAIL')) {
      process.stderr.write(colors.fail(line));
    }
  });

  // Set a maximum timeout for tests
  const maxDuration = 30000; // 30 seconds
  const timeout = setTimeout(() => {
    console.log(colors.fail('\n\n⏱️  Test timeout exceeded!'));
    proc.kill('SIGTERM');
    stats.duration = Date.now() - startTime;
    showSummary();
    process.exit(1);
  }, maxDuration);

  function showSummary() {
    stats.duration = Date.now() - startTime;

    console.log('\n');
    console.log(colors.accent.bold('═══════════════════════════════════════'));
    console.log(colors.accent.bold('  Test Results Summary'));
    console.log(colors.accent.bold('═══════════════════════════════════════\n'));

    console.log(`  ${colors.pass('✓ Passed:')}  ${colors.pass.bold(stats.passed)}`);
    if (stats.failed > 0) {
      console.log(`  ${colors.fail('✗ Failed:')}  ${colors.fail.bold(stats.failed)}`);
    }
    if (stats.skipped > 0) {
      console.log(`  ${colors.skip('⊘ Skipped:')} ${colors.skip.bold(stats.skipped)}`);
    }
    console.log(`  ${colors.info('Total:')}    ${stats.total}`);
    console.log(`  ${colors.dim('Duration:')}  ${(stats.duration / 1000).toFixed(2)}s\n`);
  }

  proc.on('close', (code) => {
    clearTimeout(timeout);
    showSummary();

    if (stats.failed === 0 && code === 0) {
      console.log(colors.pass.bold('✅ All tests passed!\n'));
      process.exit(0);
    } else {
      console.log(colors.fail.bold(`❌ ${stats.failed || 'Some'} test(s) failed\n`));
      process.exit(code || 1);
    }
  });

  proc.on('error', (error) => {
    console.error(colors.fail(`\n❌ Failed to run tests: ${error.message}\n`));
    process.exit(1);
  });
}

// Run it
runTests();

