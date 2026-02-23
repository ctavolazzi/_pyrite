/**
 * @fileoverview Basic Usage Example - The Oracle
 *
 * "I need to consult The Oracle" - Here's how!
 *
 * @example
 * node tests/debugger/examples/basic-usage.js
 */

import { TheOracle } from '../TheOracle.js';
import oracleConfig from '../oracle.config.js';

/**
 * Basic example: Run The Oracle on the dashboard
 */
async function basicExample() {
  console.log('🔴 Consulting The Oracle...\n');

  // Create Oracle instance
  const oracle = new TheOracle({
    pocketbaseUrl: oracleConfig.pocketbase.url,
    pocketbaseAdminEmail: oracleConfig.pocketbase.adminEmail,
    pocketbaseAdminPassword: oracleConfig.pocketbase.adminPassword,
    targetUrl: oracleConfig.target.url
  });

  try {
    // Initialize
    await oracle.initialize();

    // Run comprehensive analysis
    const results = await oracle.run();

    // Access results
    console.log('\n📊 Results Summary:');
    console.log(`   Components tested: ${results.components.length}`);
    console.log(`   Tests run: ${results.testResults.length}`);
    console.log(`   Bugs found: ${results.bugs.length}`);
    console.log(`   Patterns learned: ${results.patterns.length}`);

    // Access bugs
    if (results.bugs.length > 0) {
      console.log('\n🐛 Bugs Found:');
      for (const bug of results.bugs) {
        console.log(`   [${bug.severity}] ${bug.category}: ${bug.description}`);
      }
    }

    // Access report
    console.log('\n📄 Report generated:');
    console.log(`   Session ID: ${results.session.id}`);
    console.log(`   Report stored in PocketBase`);

  } catch (error) {
    console.error('❌ Error consulting The Oracle:', error);
    process.exit(1);
  }
}

/**
 * Example: Test specific component
 */
async function componentExample() {
  console.log('🔴 Testing specific component...\n');

  const oracle = new TheOracle({
    pocketbaseUrl: oracleConfig.pocketbase.url,
    pocketbaseAdminEmail: oracleConfig.pocketbase.adminEmail,
    pocketbaseAdminPassword: oracleConfig.pocketbase.adminPassword,
    targetUrl: oracleConfig.target.url
  });

  await oracle.initialize();

  // Discover components
  const components = await oracle.discovery.discoverAll();

  // Find specific component
  const button = components.find(c => c.tag === 'button' && c.text?.includes('Test System'));

  if (button) {
    // Test just this component
    const results = await oracle.agents.component.test(button);
    console.log(`✅ Tested component: ${button.id}`);
    console.log(`   Status: ${results.status}`);
  }
}

/**
 * Example: Custom configuration
 */
async function customConfigExample() {
  console.log('🔴 Custom configuration example...\n');

  const oracle = new TheOracle({
    pocketbaseUrl: 'http://127.0.0.1:8090',
    pocketbaseAdminEmail: 'admin@example.com',
    pocketbaseAdminPassword: 'password',
    targetUrl: 'http://localhost:3848',
    options: {
      // Only test accessibility
      agents: ['accessibility'],
      // Custom timeout
      timeout: 60000,
      // Skip visual regression
      skipVisual: true
    }
  });

  await oracle.initialize();
  const results = await oracle.run();
  console.log(`✅ Accessibility tests complete: ${results.testResults.length} tests`);
}

// Run examples
if (import.meta.url === `file://${process.argv[1]}`) {
  const example = process.argv[2] || 'basic';

  switch (example) {
    case 'basic':
      basicExample();
      break;
    case 'component':
      componentExample();
      break;
    case 'custom':
      customConfigExample();
      break;
    default:
      console.log('Usage: node basic-usage.js [basic|component|custom]');
  }
}

export { basicExample, componentExample, customConfigExample };

