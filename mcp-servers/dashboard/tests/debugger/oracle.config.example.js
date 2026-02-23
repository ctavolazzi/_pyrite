/**
 * @fileoverview The Oracle Configuration Example
 *
 * Copy this file to `oracle.config.js` and customize for your environment.
 *
 * "I need to consult The Oracle" - But first, configure it!
 */

export const oracleConfig = {
  // PocketBase Configuration
  pocketbase: {
    url: 'http://127.0.0.1:8090',
    adminEmail: 'admin@example.com',
    adminPassword: 'your-password-here',
    // Optional: Custom collections prefix
    collectionsPrefix: 'oracle_'
  },

  // Target Application
  target: {
    url: 'http://localhost:3848',
    // Optional: Authentication if needed
    auth: {
      type: 'none', // 'none' | 'basic' | 'bearer' | 'cookie'
      credentials: {}
    }
  },

  // Test Execution
  execution: {
    // Timeouts (in milliseconds)
    timeouts: {
      componentDiscovery: 30000,  // 30s to discover all components
      individualTest: 10000,      // 10s per test
      fullSuite: 300000,          // 5min for full suite
      pageLoad: 30000              // 30s for page load
    },

    // Retry Configuration
    retry: {
      enabled: true,
      maxRetries: 2,
      retryDelay: 1000,  // 1s between retries
      retryOnErrors: ['timeout', 'network', 'browser-crash']
    },

    // Parallel Execution
    parallel: {
      enabled: true,
      maxWorkers: 4,
      isolation: 'browser-context' // 'browser-context' | 'browser' | 'none'
    }
  },

  // Performance Thresholds
  performance: {
    // Render time (milliseconds)
    renderTime: {
      warning: 100,   // Warn if > 100ms
      error: 500      // Fail if > 500ms
    },

    // Memory usage (MB)
    memory: {
      warning: 50,    // Warn if > 50MB
      error: 200      // Fail if > 200MB
    },

    // Bundle size (KB)
    bundleSize: {
      warning: 500,   // Warn if > 500KB
      error: 1000     // Fail if > 1000KB
    },

    // Network requests
    network: {
      maxRequests: 50,        // Max requests per page
      maxRequestTime: 3000,   // Max request time (ms)
      maxTotalSize: 5000      // Max total size (KB)
    },

    // Core Web Vitals
    webVitals: {
      lcp: { warning: 2500, error: 4000 },  // Largest Contentful Paint (ms)
      fid: { warning: 100, error: 300 },     // First Input Delay (ms)
      cls: { warning: 0.1, error: 0.25 }     // Cumulative Layout Shift
    }
  },

  // Visual Regression
  visual: {
    // Screenshot settings
    screenshot: {
      fullPage: true,
      clip: null,  // { x, y, width, height } or null for full page
      animations: 'disabled'  // 'disabled' | 'keep'
    },

    // Diff thresholds
    diff: {
      pixelDifference: 0.01,    // 1% pixel difference allowed
      perceptualDiff: 0.02,     // 2% perceptual difference
      layoutShift: 5,           // 5px layout shift allowed
      colorTolerance: 5         // Color difference tolerance (0-255)
    },

    // Baseline management
    baseline: {
      autoUpdate: false,        // Auto-update baselines on changes
      requireApproval: true,    // Require manual approval for baseline updates
      storage: 'pocketbase'     // 'pocketbase' | 'filesystem' | 'both'
    }
  },

  // Accessibility
  accessibility: {
    // WCAG Level
    standard: 'AA',  // 'A' | 'AA' | 'AAA'

    // Color contrast
    colorContrast: {
      normalText: 4.5,    // WCAG AA for normal text
      largeText: 3.0,     // WCAG AA for large text
      enhanced: 7.0       // WCAG AAA
    },

    // Keyboard navigation
    keyboard: {
      requireTabOrder: true,
      requireFocusIndicators: true,
      requireSkipLinks: true
    },

    // Screen reader
    screenReader: {
      requireAriaLabels: true,
      requireAriaRoles: true,
      requireSemanticHTML: true
    }
  },

  // Browser Configuration
  browsers: {
    // Which browsers to test
    targets: [
      { name: 'chromium', channel: 'chrome' },
      // { name: 'firefox' },
      // { name: 'webkit' }
    ],

    // Viewport sizes (responsive testing)
    viewports: [
      { width: 375, height: 667, name: 'mobile' },      // iPhone
      { width: 768, height: 1024, name: 'tablet' },     // iPad
      { width: 1280, height: 720, name: 'desktop' },    // Desktop
      { width: 1920, height: 1080, name: 'large' }     // Large desktop
    ]
  },

  // Component Discovery
  discovery: {
    // Which elements to discover
    include: [
      'button',
      'input',
      'select',
      'textarea',
      'a',
      '[role="button"]',
      '[role="link"]',
      '[data-testid]',
      '[data-component]'
    ],

    // Elements to exclude
    exclude: [
      'script',
      'style',
      'noscript',
      '[hidden]',
      '[aria-hidden="true"]'
    ],

    // Discovery strategy
    strategy: 'bfs',  // 'dfs' | 'bfs' | 'hybrid'
    maxDepth: 10      // Maximum DOM depth to traverse
  },

  // CSS Analysis
  css: {
    // Properties to analyze
    properties: [
      'color',
      'background-color',
      'font-size',
      'font-family',
      'line-height',
      'margin',
      'padding',
      'border',
      'width',
      'height',
      'display',
      'position',
      'z-index',
      'opacity',
      'transform'
    ],

    // Check for conflicts
    checkConflicts: true,

    // Check specificity
    checkSpecificity: true,

    // Source mapping
    sourceMapping: true
  },

  // Reporting
  reporting: {
    // Report formats
    formats: ['html', 'json', 'junit'],

    // Report location
    outputDir: './tests/component-results/reports',

    // Include in reports
    include: {
      screenshots: true,
      logs: true,
      metrics: true,
      trends: true
    }
  },

  // Learning & Patterns
  learning: {
    // Enable pattern learning
    enabled: true,

    // Pattern recognition
    patternRecognition: {
      minOccurrences: 3,      // Min occurrences to recognize pattern
      confidenceThreshold: 0.7 // Confidence threshold (0-1)
    },

    // Anomaly detection
    anomalyDetection: {
      enabled: true,
      sensitivity: 'medium'  // 'low' | 'medium' | 'high'
    }
  },

  // Logging
  logging: {
    level: 'info',  // 'debug' | 'info' | 'warn' | 'error'
    file: './tests/component-results/logs/oracle.log',
    console: true,
    debugMode: false  // Enable debug mode logging
  }
};

