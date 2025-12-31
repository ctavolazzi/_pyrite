# Phase 1: Foundation & Quality

**Version Target**: v0.4.0 - v0.5.0
**Duration**: 6-8 weeks
**Status**: Planning
**Priority**: P0 (Critical)

## Objectives

Establish a solid foundation for rapid, confident development by implementing:
1. Comprehensive testing infrastructure
2. Type safety across the codebase
3. Code quality tooling and standards
4. Enhanced CI/CD pipeline
5. Security hardening

## Stage Breakdown

### Stage 1: Testing Foundation (Weeks 1-2) → v0.4.0-alpha.1

**Goal**: Achieve 50%+ test coverage with automated testing infrastructure

#### Deliverables
- Jest configuration and test runner setup
- Playwright E2E test framework
- Test utilities and fixtures
- 50%+ coverage on critical paths

#### Technical Implementation

##### Test Infrastructure Setup

**File**: `jest.config.js`
```javascript
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'mcp-servers/**/*.js',
    '!mcp-servers/**/node_modules/**',
    '!mcp-servers/**/dist/**'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.js']
};
```

**File**: `test/setup.js`
```javascript
// Global test setup
const { mkdtemp, rm } = require('fs/promises');
const { tmpdir } = require('os');
const { join } = require('path');

// Create temporary test directory
global.createTestDir = async () => {
  return await mkdtemp(join(tmpdir(), 'pyrite-test-'));
};

// Cleanup helper
global.cleanup = async (dir) => {
  await rm(dir, { recursive: true, force: true });
};

// Mock logger for tests
global.mockLogger = () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
});
```

##### Parser Tests

**File**: `mcp-servers/dashboard/__tests__/lib/parser.test.js`
```javascript
const { parseWorkEfforts } = require('../../lib/parser');
const { join } = require('path');

describe('Parser', () => {
  describe('parseWorkEfforts', () => {
    let testDir;

    beforeEach(async () => {
      testDir = await global.createTestDir();
    });

    afterEach(async () => {
      await global.cleanup(testDir);
    });

    test('parses MCP v0.3.0 format work efforts', async () => {
      // Create test work effort
      const weId = 'WE-251227-a1b2';
      const wePath = join(testDir, `${weId}_test_feature`);
      await createMockWorkEffort(wePath, {
        id: weId,
        title: 'Test Feature',
        status: 'in-progress',
        created: '2025-12-27'
      });

      const result = await parseWorkEfforts(testDir);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(weId);
      expect(result[0].title).toBe('Test Feature');
      expect(result[0].status).toBe('in-progress');
    });

    test('parses tickets within work efforts', async () => {
      // Implementation
    });

    test('handles malformed frontmatter gracefully', async () => {
      // Implementation
    });

    test('falls back to Johnny Decimal format', async () => {
      // Implementation
    });
  });
});

// Test helper factory
function createMockWorkEffort(path, data) {
  // Implementation
}
```

##### Dashboard Server Tests

**File**: `mcp-servers/dashboard/__tests__/server.test.js`
```javascript
const request = require('supertest');
const { createServer } = require('../server');

describe('Dashboard Server', () => {
  let app;
  let server;

  beforeAll(() => {
    app = createServer({ port: 0 }); // Random port
    server = app.listen();
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('GET /api/work-efforts', () => {
    test('returns work efforts array', async () => {
      const res = await request(app).get('/api/work-efforts');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('workEfforts');
      expect(Array.isArray(res.body.workEfforts)).toBe(true);
    });

    test('filters by status query param', async () => {
      const res = await request(app)
        .get('/api/work-efforts?status=in-progress');

      expect(res.status).toBe(200);
      expect(res.body.workEfforts.every(we => we.status === 'in-progress'))
        .toBe(true);
    });
  });

  describe('WebSocket /ws', () => {
    test('accepts connections and sends initial state', (done) => {
      // WebSocket client test implementation
    });

    test('broadcasts updates on file changes', (done) => {
      // File watcher integration test
    });
  });
});
```

##### E2E Tests with Playwright

**File**: `playwright.config.js`
```javascript
module.exports = {
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3847',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } }
  ]
};
```

**File**: `e2e/dashboard.test.js`
```javascript
const { test, expect } = require('@playwright/test');

test.describe('Mission Control Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads and displays work efforts', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Mission Control');

    const weList = page.locator('.work-effort-item');
    await expect(weList).not.toHaveCount(0);
  });

  test('filters work efforts by status', async ({ page }) => {
    await page.click('[data-filter="in-progress"]');

    const items = page.locator('.work-effort-item');
    const count = await items.count();

    for (let i = 0; i < count; i++) {
      const status = await items.nth(i).getAttribute('data-status');
      expect(status).toBe('in-progress');
    }
  });

  test('real-time updates via WebSocket', async ({ page }) => {
    const initialCount = await page.locator('.work-effort-item').count();

    // Trigger file change externally
    await createTestWorkEffort();

    // Wait for WebSocket update
    await page.waitForSelector('.work-effort-item', {
      timeout: 5000,
      state: 'attached'
    });

    const newCount = await page.locator('.work-effort-item').count();
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test('handles disconnection gracefully', async ({ page }) => {
    // Close WebSocket connection
    await page.evaluate(() => {
      window.missionControl.ws.close();
    });

    // Should show reconnecting status
    await expect(page.locator('.status-indicator'))
      .toContainText('Reconnecting');
  });
});
```

---

### Stage 2: Type Safety (Weeks 3-4) → v0.4.0-alpha.2

**Goal**: Add type safety to all public APIs and critical functions

#### Option A: JSDoc Type System (Recommended for minimal disruption)

**Benefits:**
- No build step required
- Gradual adoption
- Works with existing tooling
- VSCode IntelliSense support

**File**: `mcp-servers/dashboard/lib/parser.js`
```javascript
/**
 * @typedef {Object} WorkEffort
 * @property {string} id - Work effort ID (WE-YYMMDD-xxxx)
 * @property {string} title - Human-readable title
 * @property {'planned'|'in-progress'|'completed'|'blocked'} status
 * @property {Date} created - Creation timestamp
 * @property {string} [branch] - Git branch name
 * @property {number} progress - Percentage complete (0-100)
 * @property {Ticket[]} tickets - Associated tickets
 */

/**
 * @typedef {Object} Ticket
 * @property {string} id - Ticket ID (TKT-xxxx-NNN)
 * @property {string} title - Ticket title
 * @property {'pending'|'in-progress'|'completed'} status
 * @property {string} workEffortId - Parent work effort ID
 */

/**
 * Parse work efforts from a directory
 * @param {string} workEffortsPath - Path to _work_efforts directory
 * @param {Object} [options] - Parse options
 * @param {boolean} [options.includeTickets=true] - Include ticket details
 * @param {string[]} [options.statusFilter] - Filter by status
 * @returns {Promise<WorkEffort[]>} Parsed work efforts
 * @throws {Error} If directory doesn't exist or is inaccessible
 */
async function parseWorkEfforts(workEffortsPath, options = {}) {
  const {
    includeTickets = true,
    statusFilter = null
  } = options;

  // Implementation with type-safe parameters
}
```

**File**: `jsconfig.json` (Enable type checking in VSCode)
```json
{
  "compilerOptions": {
    "checkJs": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "module": "commonjs",
    "target": "ES2020",
    "lib": ["ES2020"],
    "baseUrl": ".",
    "paths": {
      "@dashboard/*": ["mcp-servers/dashboard/*"],
      "@work-efforts/*": ["mcp-servers/work-efforts/*"]
    }
  },
  "include": ["mcp-servers/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### Option B: TypeScript Migration (More robust, higher effort)

**Migration Strategy:**
1. Add TypeScript compiler (`tsc`)
2. Convert one module at a time
3. Start with leaf modules (no dependencies)
4. Use `.ts` and `.js` files side-by-side during transition

**File**: `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "allowJs": true,
    "checkJs": false
  },
  "include": ["mcp-servers/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**File**: `mcp-servers/dashboard/types/index.ts`
```typescript
// Core type definitions
export type WorkEffortStatus = 'planned' | 'in-progress' | 'completed' | 'blocked';
export type TicketStatus = 'pending' | 'in-progress' | 'completed';

export interface WorkEffort {
  id: string;
  title: string;
  status: WorkEffortStatus;
  created: Date;
  branch?: string;
  progress: number;
  tickets: Ticket[];
  metadata?: Record<string, unknown>;
}

export interface Ticket {
  id: string;
  title: string;
  status: TicketStatus;
  workEffortId: string;
  created: Date;
  updated?: Date;
}

export interface ParseOptions {
  includeTickets?: boolean;
  statusFilter?: WorkEffortStatus[];
  limit?: number;
  offset?: number;
}

export interface ParserResult {
  workEfforts: WorkEffort[];
  totalCount: number;
  parseErrors: ParseError[];
}

export interface ParseError {
  path: string;
  error: Error;
  severity: 'warning' | 'error';
}
```

---

### Stage 3: Code Quality (Weeks 5-6) → v0.4.0-beta.1

**Goal**: Establish code quality standards and automated enforcement

#### ESLint Configuration

**File**: `.eslintrc.js`
```javascript
module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'plugin:security/recommended',
    'plugin:promise/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  rules: {
    // Code style
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'never'],

    // Best practices
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'require-await': 'error',
    'no-return-await': 'error',

    // Security
    'security/detect-object-injection': 'warn',
    'security/detect-non-literal-regexp': 'warn',

    // Promises
    'promise/always-return': 'error',
    'promise/catch-or-return': 'error'
  },
  overrides: [
    {
      files: ['**/__tests__/**/*.js'],
      env: {
        jest: true
      },
      rules: {
        'no-console': 'off'
      }
    }
  ]
};
```

#### Prettier Configuration

**File**: `.prettierrc.json`
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "printWidth": 100,
  "trailingComma": "none",
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

#### Pre-commit Hooks

**File**: `.husky/pre-commit`
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run lint-staged
npx lint-staged
```

**File**: `.lintstagedrc.json`
```json
{
  "*.js": [
    "eslint --fix",
    "prettier --write",
    "jest --bail --findRelatedTests"
  ],
  "*.md": [
    "markdownlint --fix"
  ]
}
```

---

### Stage 4: CI/CD Enhancement (Weeks 7-8) → v0.4.0

**Goal**: Comprehensive CI/CD pipeline with automated testing, security scanning, and deployment

#### Enhanced GitHub Actions Workflow

**File**: `.github/workflows/ci.yml`
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop, 'claude/**']
  pull_request:
    branches: [main, develop]

jobs:
  # Job 1: Linting and formatting
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run Prettier check
        run: npm run format:check

      - name: Markdown lint
        uses: DavidAnson/markdownlint-cli2-action@v16

  # Job 2: Unit and integration tests
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm test -- --coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          flags: unittests

  # Job 3: E2E tests
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Start dashboard server
        run: |
          npm run start:dashboard &
          sleep 5

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-screenshots
          path: e2e/screenshots/

  # Job 4: Security scanning
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run npm audit
        run: npm audit --audit-level=moderate

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'

  # Job 5: Build verification
  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build TypeScript (if applicable)
        run: npm run build --if-present

      - name: Verify build artifacts
        run: |
          if [ -d "dist" ]; then
            echo "Build successful"
            ls -la dist/
          fi
```

---

### Stage 5: Security Hardening (Weeks 9-10) → v0.5.0

**Goal**: Implement security best practices and hardening

#### Security Middleware

**File**: `mcp-servers/dashboard/lib/security.js`
```javascript
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

/**
 * Create security middleware stack
 * @param {Object} options - Security options
 * @returns {Array} Middleware array
 */
function createSecurityMiddleware(options = {}) {
  const {
    corsOrigin = process.env.CORS_ORIGIN || '*',
    rateLimitWindow = 15 * 60 * 1000, // 15 minutes
    rateLimitMax = 100 // Max requests per window
  } = options;

  return [
    // Helmet for security headers
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", 'ws:', 'wss:']
        }
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }),

    // CORS
    cors({
      origin: corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }),

    // Rate limiting
    rateLimit({
      windowMs: rateLimitWindow,
      max: rateLimitMax,
      message: 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false
    })
  ];
}

module.exports = { createSecurityMiddleware };
```

#### Input Validation

**File**: `mcp-servers/dashboard/lib/validation.js`
```javascript
const { z } = require('zod');

// Validation schemas
const WorkEffortIdSchema = z.string().regex(/^WE-\d{6}-[a-z0-9]{4}$/);
const TicketIdSchema = z.string().regex(/^TKT-[a-z0-9]{4}-\d{3}$/);

const WorkEffortStatusSchema = z.enum(['planned', 'in-progress', 'completed', 'blocked']);

const CreateWorkEffortSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  tickets: z.array(z.string()).max(50).optional()
});

const UpdateWorkEffortSchema = z.object({
  status: WorkEffortStatusSchema.optional(),
  progress: z.number().min(0).max(100).optional(),
  branch: z.string().max(100).optional()
});

/**
 * Validate request body against schema
 * @param {z.ZodSchema} schema - Zod validation schema
 * @returns {Function} Express middleware
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      req.validatedData = schema.parse(req.body);
      next();
    } catch (error) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
  };
}

module.exports = {
  WorkEffortIdSchema,
  TicketIdSchema,
  CreateWorkEffortSchema,
  UpdateWorkEffortSchema,
  validate
};
```

## Success Metrics

- [ ] 80%+ test coverage on all modules
- [ ] Zero ESLint errors
- [ ] Zero security vulnerabilities (high/critical)
- [ ] All CI/CD checks passing
- [ ] Type errors caught before runtime
- [ ] <100ms average API response time maintained
- [ ] Zero regressions in existing functionality

## Next Steps

After Phase 1 completion, proceed to [Phase 2: Performance & Scale](../phase-2-performance/README.md).
