/**
 * @fileoverview Test Data Generator - Experimental Tool
 *
 * Generates realistic test data by parsing actual work efforts and creating
 * test scenarios based on real patterns found in the codebase.
 */

import { parseRepo } from '../../lib/parser.js';
import {
  createWorkEffortFixture,
  createTicketFixture,
  createTestScenario,
  createRepoStateFixture
} from '../helpers/fixtures.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoPath = path.resolve(__dirname, '../../../..');

/**
 * Analyze real work efforts and extract patterns
 */
async function analyzeRealWorkEfforts() {
  console.log('🔍 Analyzing real work efforts from repository...\n');

  const result = await parseRepo(repoPath);

  if (result.error) {
    console.error('❌ Error:', result.error);
    return null;
  }

  const workEfforts = result.workEfforts;

  console.log(`📊 Found ${workEfforts.length} work efforts\n`);

  // Analyze patterns
  const statusCounts = {};
  const ticketCounts = [];
  const formatCounts = {};

  for (const we of workEfforts) {
    // Status distribution
    statusCounts[we.status] = (statusCounts[we.status] || 0) + 1;

    // Ticket counts
    const ticketCount = we.tickets?.length || 0;
    ticketCounts.push(ticketCount);

    // Format distribution
    formatCounts[we.format] = (formatCounts[we.format] || 0) + 1;
  }

  const avgTickets = ticketCounts.reduce((a, b) => a + b, 0) / ticketCounts.length;
  const maxTickets = Math.max(...ticketCounts, 0);

  return {
    total: workEfforts.length,
    statusCounts,
    formatCounts,
    avgTickets: Math.round(avgTickets * 10) / 10,
    maxTickets,
    workEfforts: workEfforts.slice(0, 10) // Sample first 10
  };
}

/**
 * Generate test scenarios based on real patterns
 */
function generateTestScenarios(analysis) {
  console.log('🎲 Generating test scenarios based on real patterns...\n');

  const scenarios = [];

  // Scenario 1: Typical active work effort
  scenarios.push({
    name: 'Typical Active Work Effort',
    description: 'Single active work effort with 2-3 tickets',
    data: createTestScenario({
      workEffortCount: 1,
      ticketsPerWE: 2,
      repoName: '_pyrite'
    })
  });

  // Scenario 2: Multiple work efforts (matching real distribution)
  const activeCount = analysis.statusCounts.active || 3;
  scenarios.push({
    name: 'Multiple Work Efforts',
    description: `${activeCount} active work efforts matching real distribution`,
    data: createTestScenario({
      workEffortCount: activeCount,
      ticketsPerWE: Math.round(analysis.avgTickets),
      repoName: '_pyrite'
    })
  });

  // Scenario 3: Mixed statuses
  scenarios.push({
    name: 'Mixed Status Work Efforts',
    description: 'Work efforts with various statuses',
    data: {
      repos: {
        '_pyrite': createRepoStateFixture('_pyrite', [
          createWorkEffortFixture('WE-260102-active1', 'Active Work 1', 'active', {
            tickets: [
              createTicketFixture('TKT-active1-001', 'Ticket 1', 'in_progress'),
              createTicketFixture('TKT-active1-002', 'Ticket 2', 'pending')
            ]
          }),
          createWorkEffortFixture('WE-260102-paused1', 'Paused Work', 'paused', {
            tickets: [
              createTicketFixture('TKT-paused1-001', 'Ticket 1', 'blocked')
            ]
          }),
          createWorkEffortFixture('WE-260102-completed1', 'Completed Work', 'completed', {
            tickets: [
              createTicketFixture('TKT-completed1-001', 'Ticket 1', 'completed'),
              createTicketFixture('TKT-completed1-002', 'Ticket 2', 'completed')
            ]
          })
        ], {
          stats: {
            totalWorkEfforts: 3,
            activeWorkEfforts: 1,
            totalTickets: 4,
            completedTickets: 2
          }
        })
      },
      workEfforts: [
        createWorkEffortFixture('WE-260102-active1', 'Active Work 1', 'active'),
        createWorkEffortFixture('WE-260102-paused1', 'Paused Work', 'paused'),
        createWorkEffortFixture('WE-260102-completed1', 'Completed Work', 'completed')
      ]
    }
  });

  // Scenario 4: Large work effort (matching max)
  scenarios.push({
    name: 'Large Work Effort',
    description: `Work effort with ${analysis.maxTickets} tickets (matching real max)`,
    data: createTestScenario({
      workEffortCount: 1,
      ticketsPerWE: analysis.maxTickets,
      repoName: '_pyrite'
    })
  });

  return scenarios;
}

/**
 * Generate test data files
 */
async function generateTestDataFiles(scenarios) {
  console.log('📝 Generating test data files...\n');

  const outputDir = path.join(__dirname, 'generated-test-data');
  await fs.mkdir(outputDir, { recursive: true });

  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    const filename = `scenario-${String(i + 1).padStart(2, '0')}-${scenario.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    const filepath = path.join(outputDir, filename);

    await fs.writeFile(
      filepath,
      JSON.stringify(scenario, null, 2)
    );

    console.log(`  ✅ ${filename}`);
  }

  return outputDir;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Test Data Generator - Experimental Tool\n');
  console.log('=' .repeat(60) + '\n');

  // Step 1: Analyze real work efforts
  const analysis = await analyzeRealWorkEfforts();

  if (!analysis) {
    console.error('Failed to analyze work efforts');
    process.exit(1);
  }

  // Print analysis
  console.log('📈 Analysis Results:');
  console.log(`  Total Work Efforts: ${analysis.total}`);
  console.log(`  Status Distribution:`, analysis.statusCounts);
  console.log(`  Format Distribution:`, analysis.formatCounts);
  console.log(`  Average Tickets per WE: ${analysis.avgTickets}`);
  console.log(`  Max Tickets in a WE: ${analysis.maxTickets}\n`);

  // Step 2: Generate scenarios
  const scenarios = generateTestScenarios(analysis);
  console.log(`✅ Generated ${scenarios.length} test scenarios\n`);

  // Step 3: Generate files
  const outputDir = await generateTestDataFiles(scenarios);

  console.log(`\n✨ Test data generated in: ${outputDir}\n`);

  // Print summary
  console.log('📋 Generated Scenarios:');
  scenarios.forEach((scenario, i) => {
    console.log(`  ${i + 1}. ${scenario.name}`);
    console.log(`     ${scenario.description}`);
  });

  console.log('\n🎉 Done!\n');
}

main().catch(console.error);

