/**
 * @fileoverview The Oracle - "Bug's Life" meets "The Matrix"
 *
 * A comprehensive, self-learning debugging system that observes everything,
 * learns from patterns, and stores knowledge in PocketBase.
 *
 * Theme: "Bug's Life" (finding every bug) + "The Matrix" (seeing the code)
 *
 * "There is no spoon... but there are bugs, and we will find them all."
 *
 * @author _pyrite
 * @version 0.1.0
 */

import PocketBase from 'pocketbase';
import { ComponentAgent } from './agents/ComponentAgent.js';
import { LayoutAgent } from './agents/LayoutAgent.js';
import { StyleAgent } from './agents/StyleAgent.js';
import { InteractionAgent } from './agents/InteractionAgent.js';
import { AccessibilityAgent } from './agents/AccessibilityAgent.js';
import { PerformanceAgent } from './agents/PerformanceAgent.js';
import { ComponentDiscovery } from './discovery/ComponentDiscovery.js';
import { CSSAnalyzer } from './analysis/CSSAnalyzer.js';
import { PatternLearner } from './learning/PatternLearner.js';
import { TestQueue } from './queue/TestQueue.js';
import { ResultRepository } from './storage/ResultRepository.js';

/**
 * The Oracle - Core debugging class
 *
 * "I need to consult The Oracle" - When you need to find every bug, test every component,
 * and understand your codebase better than it understands itself.
 *
 * Pop Culture References:
 * - The Matrix (1999): The Oracle sees patterns and predicts outcomes
 * - Back to the Future: "Great Scott!" - Time-traveling through code history
 * - Ghostbusters: "Who you gonna call?" - BugBusters!
 * - Terminator: "I'll be back" - Relentless testing until all bugs are found
 * - Jurassic Park: "Life finds a way" - Bugs always find a way, we find them first
 * - The Shawshank Redemption: "Get busy testing, or get busy debugging"
 * - Lord of the Rings: "One does not simply debug without The Oracle"
 * - Pirates of the Caribbean: "Why is the bug always gone?" - We track them all
 *
 * @example
 * const oracle = new TheOracle({...});
 * await oracle.initialize();
 * const results = await oracle.run(); // "Consult The Oracle"
 */
export class TheOracle {
  /**
   * Create a new Oracle instance
   *
   * @param {Object} config - Configuration
   * @param {string} config.pocketbaseUrl - PocketBase server URL
   * @param {string} config.pocketbaseAdminEmail - Admin email
   * @param {string} config.pocketbaseAdminPassword - Admin password
   * @param {string} config.targetUrl - URL to test
   * @param {Object} config.options - Additional options
   */
  constructor(config) {
    this.config = {
      pocketbaseUrl: config.pocketbaseUrl || 'http://127.0.0.1:8090',
      pocketbaseAdminEmail: config.pocketbaseAdminEmail,
      pocketbaseAdminPassword: config.pocketbaseAdminPassword,
      targetUrl: config.targetUrl || 'http://localhost:3848',
      ...config.options
    };

    // PocketBase client
    this.pb = new PocketBase(this.config.pocketbaseUrl);

    // Current session
    this.session = null;

    // Agents (The Oracle's helpers)
    this.agents = {
      component: new ComponentAgent(this),
      layout: new LayoutAgent(this),
      style: new StyleAgent(this),
      interaction: new InteractionAgent(this),
      accessibility: new AccessibilityAgent(this),
      performance: new PerformanceAgent(this)
    };

    // Discovery and analysis
    this.discovery = new ComponentDiscovery(this);
    this.cssAnalyzer = new CSSAnalyzer(this);
    this.patternLearner = new PatternLearner(this);

    // Queue and storage
    this.testQueue = new TestQueue(this);
    this.repository = new ResultRepository(this);

    // State
    this.components = new Map();
    this.testResults = [];
    this.bugs = [];
    this.learnedPatterns = new Map();
  }

  /**
   * Initialize the debugger
   * Connect to PocketBase and authenticate
   */
  async initialize() {
    try {
      // Authenticate with PocketBase
      if (this.config.pocketbaseAdminEmail && this.config.pocketbaseAdminPassword) {
        await this.pb.admins.authWithPassword(
          this.config.pocketbaseAdminEmail,
          this.config.pocketbaseAdminPassword
        );
      }

      // Create new debug session
      this.session = await this.repository.createSession({
        name: `Debug Session ${new Date().toISOString()}`,
        targetUrl: this.config.targetUrl,
        status: 'running'
      });

      console.log('🔴 The Oracle initialized');
      console.log('   "I need to consult The Oracle" - Ready to find all bugs');
      console.log(`   Session ID: ${this.session.id}`);
      console.log(`   Target: ${this.config.targetUrl}`);

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize The Oracle:', error);
      throw error;
    }
  }

  /**
   * Start a comprehensive debug run
   *
   * "Welcome to the real world."
   */
  async run() {
    if (!this.session) {
      await this.initialize();
    }

    console.log('\n🔴 THE ORACLE - FULL SYSTEM ANALYSIS');
    console.log('   "There is no spoon... but there are bugs, and we will find them all."');
    console.log('='.repeat(60));

    try {
      // Phase 1: Discovery
      console.log('\n📡 Phase 1: Component Discovery...');
      console.log('   "Life finds a way" - We find all components (Jurassic Park)');
      const components = await this.discovery.discoverAll();
      console.log(`   Found ${components.length} components`);

      // Phase 2: CSS Analysis
      console.log('\n🎨 Phase 2: CSS Analysis...');
      console.log('   "Great Scott!" - Analyzing every CSS property (Back to the Future)');
      for (const component of components) {
        const cssAnalysis = await this.cssAnalyzer.analyze(component);
        component.cssAnalysis = cssAnalysis;
      }
      console.log(`   Analyzed ${components.length} components`);

      // Phase 3: Run all agent tests
      console.log('\n🤖 Phase 3: Running Agent Tests...');
      console.log('   "I\'ll be back" - Testing everything relentlessly (Terminator)');
      for (const [agentName, agent] of Object.entries(this.agents)) {
        console.log(`   ${agentName} agent running...`);
        const results = await agent.testAll(components);
        this.testResults.push(...results);
        console.log(`   ${agentName}: ${results.length} tests completed`);
      }

      // Phase 4: Pattern Learning
      console.log('\n🧠 Phase 4: Pattern Learning...');
      console.log('   "I see dead code... everywhere" - Learning patterns (The Sixth Sense)');
      const patterns = await this.patternLearner.analyze(this.testResults);
      console.log(`   Learned ${patterns.length} patterns`);

      // Phase 5: Bug Detection
      console.log('\n🐛 Phase 5: Bug Detection...');
      console.log('   "Who you gonna call? BugBusters!" - Finding all bugs (Ghostbusters)');
      this.bugs = await this.detectBugs();
      console.log(`   Found ${this.bugs.length} bugs`);

      // Phase 6: Store Results
      console.log('\n💾 Phase 6: Storing Results...');
      console.log('   "One does not simply debug without The Oracle" - Storing knowledge (LOTR)');
      await this.repository.storeResults({
        session: this.session,
        components,
        testResults: this.testResults,
        bugs: this.bugs,
        patterns
      });
      console.log('   Results stored in PocketBase');

      // Phase 7: Generate Report
      console.log('\n📊 Phase 7: Generating Report...');
      console.log('   "Get busy testing, or get busy debugging" - Final report (Shawshank)');
      const report = await this.generateReport();
      console.log('   Report generated');

      // Update session
      await this.repository.updateSession(this.session.id, {
        status: 'completed',
        ended: new Date().toISOString(),
        components_tested: components.length,
        bugs_found: this.bugs.length
      });

      console.log('\n✅ Debug run complete!');
      console.log(`   Components tested: ${components.length}`);
      console.log(`   Tests run: ${this.testResults.length}`);
      console.log(`   Bugs found: ${this.bugs.length}`);
      console.log(`   Patterns learned: ${patterns.length}`);

      return {
        session: this.session,
        components,
        testResults: this.testResults,
        bugs: this.bugs,
        patterns,
        report
      };
    } catch (error) {
      console.error('❌ Debug run failed:', error);
      if (this.session) {
        await this.repository.updateSession(this.session.id, {
          status: 'failed',
          ended: new Date().toISOString()
        });
      }
      throw error;
    }
  }

  /**
   * Detect bugs from test results
   *
   * "There is a difference between knowing the path and walking the path."
   */
  async detectBugs() {
    const bugs = [];

    for (const result of this.testResults) {
      if (result.status === 'fail') {
        bugs.push({
          session_id: this.session.id,
          component_id: result.componentId,
          severity: this.calculateSeverity(result),
          category: result.testType,
          description: result.error?.message || 'Test failed',
          reproduction: this.generateReproduction(result),
          screenshots: result.screenshots || [],
          fixed: false
        });
      }
    }

    // Store bugs in PocketBase
    for (const bug of bugs) {
      await this.repository.createBug(bug);
    }

    return bugs;
  }

  /**
   * Calculate bug severity
   */
  calculateSeverity(result) {
    // Critical: Accessibility failures, broken interactions
    if (result.testType === 'accessibility' || result.testType === 'interaction') {
      return 'critical';
    }
    // High: Layout issues, performance problems
    if (result.testType === 'layout' || result.testType === 'performance') {
      return 'high';
    }
    // Medium: Style issues
    if (result.testType === 'style') {
      return 'medium';
    }
    // Low: Everything else
    return 'low';
  }

  /**
   * Generate reproduction steps
   */
  generateReproduction(result) {
    return `1. Navigate to ${this.config.targetUrl}\n2. Find component: ${result.componentId}\n3. Run test: ${result.testType}\n4. Expected: ${result.expected}\n5. Actual: ${result.actual}`;
  }

  /**
   * Generate comprehensive report
   */
  async generateReport() {
    const report = {
      session: this.session,
      summary: {
        components_tested: this.components.size,
        tests_run: this.testResults.length,
        tests_passed: this.testResults.filter(r => r.status === 'pass').length,
        tests_failed: this.testResults.filter(r => r.status === 'fail').length,
        bugs_found: this.bugs.length,
        bugs_by_severity: {
          critical: this.bugs.filter(b => b.severity === 'critical').length,
          high: this.bugs.filter(b => b.severity === 'high').length,
          medium: this.bugs.filter(b => b.severity === 'medium').length,
          low: this.bugs.filter(b => b.severity === 'low').length
        }
      },
      components: Array.from(this.components.values()),
      testResults: this.testResults,
      bugs: this.bugs,
      patterns: Array.from(this.learnedPatterns.values())
    };

    // Store report in PocketBase
    await this.repository.storeReport(report);

    return report;
  }

  /**
   * Get PocketBase client
   */
  getPocketBase() {
    return this.pb;
  }

  /**
   * Get current session
   */
  getSession() {
    return this.session;
  }
}

