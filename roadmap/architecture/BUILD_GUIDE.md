# Professional Build Guide: From Zero to Production

**How a senior developer would actually build this system.**

## Development Philosophy

A pro doesn't start with the dashboard. They build from the **data model up**, with **tests first**, deploying **incrementally**.

### Core Principles

1. **Data First** - Get the data model right, everything else follows
2. **Test-Driven** - Write tests before implementation
3. **Bottom-Up** - Build foundation before features
4. **Incremental** - Ship working code every day
5. **Measure** - Instrument from day one
6. **Document** - Write docs as you code, not after

## Build Order: The Professional Way

### Phase 0: Foundation (Day 1)
**Goal**: Set up project infrastructure before writing any features

#### Step 1: Initialize Project Structure
```bash
# Create project
mkdir pyrite && cd pyrite
git init
npm init -y

# Create standard structure
mkdir -p {src,test,docs,scripts}
mkdir -p src/{domain,infrastructure,application,presentation}

# Version control
echo "node_modules/" > .gitignore
echo ".env" >> .gitignore
echo "*.log" >> .gitignore
echo "dist/" >> .gitignore

git add .
git commit -m "chore: initial project structure"
```

#### Step 2: Configure Testing (Do This First!)
```bash
# Install test framework
npm install --save-dev jest @types/jest

# Create jest.config.js
cat > jest.config.js << 'EOF'
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.js'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
EOF

# Add test script to package.json
npm pkg set scripts.test="jest"
npm pkg set scripts.test:watch="jest --watch"
npm pkg set scripts.test:coverage="jest --coverage"

git add .
git commit -m "chore: configure Jest testing framework"
```

#### Step 3: Configure Linting
```bash
# Install ESLint
npm install --save-dev eslint

# Initialize ESLint config
npx eslint --init
# Choose: problems, modules, none, node, JSON, popular style guide

# Create .eslintignore
echo "node_modules/" > .eslintignore
echo "dist/" >> .eslintignore
echo "coverage/" >> .eslintignore

# Add lint script
npm pkg set scripts.lint="eslint src test"
npm pkg set scripts.lint:fix="eslint src test --fix"

git add .
git commit -m "chore: configure ESLint"
```

#### Step 4: Configure CI/CD (Before Any Code!)
```bash
# Create GitHub Actions workflow
mkdir -p .github/workflows

cat > .github/workflows/ci.yml << 'EOF'
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
EOF

git add .
git commit -m "ci: add GitHub Actions workflow"
```

### Phase 1: Domain Model (Days 2-3)
**Goal**: Define the core domain entities and business rules

#### Step 1: Write Tests for Domain Entities

**File**: `test/domain/work-effort.test.js`
```javascript
const { WorkEffort } = require('../../src/domain/work-effort');

describe('WorkEffort', () => {
  describe('constructor', () => {
    it('creates work effort with valid data', () => {
      const we = new WorkEffort({
        id: 'WE-251231-a1b2',
        title: 'Test Feature',
        status: 'planned',
        created: new Date('2025-12-31')
      });

      expect(we.id).toBe('WE-251231-a1b2');
      expect(we.title).toBe('Test Feature');
      expect(we.status).toBe('planned');
      expect(we.progress).toBe(0);
    });

    it('throws on invalid ID format', () => {
      expect(() => {
        new WorkEffort({
          id: 'invalid',
          title: 'Test',
          status: 'planned',
          created: new Date()
        });
      }).toThrow('Invalid work effort ID format');
    });

    it('throws on invalid status', () => {
      expect(() => {
        new WorkEffort({
          id: 'WE-251231-a1b2',
          title: 'Test',
          status: 'invalid',
          created: new Date()
        });
      }).toThrow('Invalid status');
    });
  });

  describe('markInProgress', () => {
    it('transitions from planned to in-progress', () => {
      const we = new WorkEffort({
        id: 'WE-251231-a1b2',
        title: 'Test',
        status: 'planned',
        created: new Date()
      });

      we.markInProgress();

      expect(we.status).toBe('in-progress');
      expect(we.events).toContainEqual({
        type: 'WorkEffortStarted',
        workEffortId: 'WE-251231-a1b2',
        timestamp: expect.any(Number)
      });
    });

    it('throws when transitioning from completed', () => {
      const we = new WorkEffort({
        id: 'WE-251231-a1b2',
        title: 'Test',
        status: 'completed',
        created: new Date()
      });

      expect(() => we.markInProgress()).toThrow('Invalid state transition');
    });
  });
});
```

#### Step 2: Implement Domain Entity (Make Tests Pass)

**File**: `src/domain/work-effort.js`
```javascript
/**
 * WorkEffort - Domain Entity
 * Represents a unit of work with identity and behavior
 *
 * Invariants:
 * - ID must match WE-YYMMDD-xxxx format
 * - Status must be one of: planned, in-progress, completed, blocked
 * - Progress must be 0-100
 * - State transitions follow rules (planned → in-progress → completed)
 */
class WorkEffort {
  /**
   * @param {Object} data
   * @param {string} data.id
   * @param {string} data.title
   * @param {string} data.status
   * @param {Date} data.created
   * @param {string} [data.description]
   * @param {number} [data.progress=0]
   */
  constructor(data) {
    // Validate ID format
    if (!WorkEffort.isValidId(data.id)) {
      throw new Error('Invalid work effort ID format');
    }

    // Validate status
    if (!WorkEffort.VALID_STATUSES.includes(data.status)) {
      throw new Error(`Invalid status: ${data.status}`);
    }

    // Validate progress
    const progress = data.progress ?? 0;
    if (progress < 0 || progress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }

    // Assign properties (immutable after construction)
    Object.defineProperty(this, 'id', { value: data.id, writable: false });
    Object.defineProperty(this, 'created', { value: data.created, writable: false });

    this.title = data.title;
    this.description = data.description || '';
    this.status = data.status;
    this.progress = progress;
    this.tickets = [];
    this.events = []; // Domain events
  }

  /**
   * Transition to in-progress status
   * @throws {Error} If transition is invalid
   */
  markInProgress() {
    if (this.status === 'completed') {
      throw new Error('Invalid state transition: Cannot restart completed work effort');
    }

    if (this.status === 'in-progress') {
      return; // Already in progress
    }

    this.status = 'in-progress';
    this.addEvent('WorkEffortStarted', {
      workEffortId: this.id,
      timestamp: Date.now()
    });
  }

  /**
   * Mark as completed
   * @throws {Error} If progress is not 100%
   */
  markCompleted() {
    if (this.progress < 100) {
      throw new Error('Cannot complete: progress must be 100%');
    }

    this.status = 'completed';
    this.completedAt = new Date();
    this.addEvent('WorkEffortCompleted', {
      workEffortId: this.id,
      timestamp: Date.now()
    });
  }

  /**
   * Update progress
   * @param {number} newProgress - Progress percentage (0-100)
   */
  updateProgress(newProgress) {
    if (newProgress < 0 || newProgress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }

    const oldProgress = this.progress;
    this.progress = newProgress;

    this.addEvent('ProgressUpdated', {
      workEffortId: this.id,
      oldProgress,
      newProgress,
      timestamp: Date.now()
    });
  }

  /**
   * Add domain event
   * @private
   */
  addEvent(type, data) {
    this.events.push({ type, ...data });
  }

  /**
   * Validate work effort ID format
   * @param {string} id
   * @returns {boolean}
   */
  static isValidId(id) {
    return /^WE-\d{6}-[a-z0-9]{4}$/.test(id);
  }

  /**
   * Serialize to plain object (for storage)
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      status: this.status,
      progress: this.progress,
      created: this.created.toISOString(),
      completedAt: this.completedAt?.toISOString()
    };
  }

  /**
   * Deserialize from plain object
   * @param {Object} data
   * @returns {WorkEffort}
   */
  static fromJSON(data) {
    return new WorkEffort({
      ...data,
      created: new Date(data.created)
    });
  }
}

WorkEffort.VALID_STATUSES = ['planned', 'in-progress', 'completed', 'blocked'];

module.exports = { WorkEffort };
```

#### Step 3: Run Tests (Red → Green → Refactor)
```bash
# Run tests - should pass
npm test

# Check coverage
npm run test:coverage

# Should see 100% coverage for WorkEffort class

git add .
git commit -m "feat(domain): implement WorkEffort entity with full test coverage"
```

### Phase 2: Infrastructure Layer (Days 4-5)
**Goal**: Build persistence and I/O operations

#### Step 1: Write Repository Tests

**File**: `test/infrastructure/file-repository.test.js`
```javascript
const { FileRepository } = require('../../src/infrastructure/file-repository');
const { WorkEffort } = require('../../src/domain/work-effort');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');

describe('FileRepository', () => {
  let repo;
  let testDir;

  beforeEach(async () => {
    // Create temp directory for tests
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pyrite-test-'));
    repo = new FileRepository(testDir);
  });

  afterEach(async () => {
    // Cleanup
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('save', () => {
    it('saves work effort to file system', async () => {
      const we = new WorkEffort({
        id: 'WE-251231-a1b2',
        title: 'Test Feature',
        status: 'planned',
        created: new Date()
      });

      await repo.save(we);

      // Verify file exists
      const filePath = path.join(testDir, 'WE-251231-a1b2_test_feature', 'WE-251231-a1b2_index.md');
      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      // Verify content
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toContain('id: WE-251231-a1b2');
      expect(content).toContain('title: Test Feature');
      expect(content).toContain('status: planned');
    });
  });

  describe('findById', () => {
    it('loads work effort from file system', async () => {
      // First save
      const original = new WorkEffort({
        id: 'WE-251231-a1b2',
        title: 'Test Feature',
        status: 'planned',
        created: new Date()
      });
      await repo.save(original);

      // Then load
      const loaded = await repo.findById('WE-251231-a1b2');

      expect(loaded).toBeInstanceOf(WorkEffort);
      expect(loaded.id).toBe('WE-251231-a1b2');
      expect(loaded.title).toBe('Test Feature');
      expect(loaded.status).toBe('planned');
    });

    it('returns null if work effort not found', async () => {
      const result = await repo.findById('WE-999999-zzzz');
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('returns all work efforts', async () => {
      // Save multiple
      await repo.save(new WorkEffort({
        id: 'WE-251231-a1b2',
        title: 'Feature A',
        status: 'planned',
        created: new Date()
      }));

      await repo.save(new WorkEffort({
        id: 'WE-251231-c3d4',
        title: 'Feature B',
        status: 'in-progress',
        created: new Date()
      }));

      const all = await repo.findAll();

      expect(all).toHaveLength(2);
      expect(all.map(we => we.id)).toEqual(
        expect.arrayContaining(['WE-251231-a1b2', 'WE-251231-c3d4'])
      );
    });
  });
});
```

#### Step 2: Implement Repository

**File**: `src/infrastructure/file-repository.js`
```javascript
const fs = require('fs/promises');
const path = require('path');
const matter = require('gray-matter');
const { WorkEffort } = require('../domain/work-effort');

/**
 * FileRepository - Infrastructure Layer
 * Persists WorkEffort entities to file system
 *
 * Responsibilities:
 * - Save/load work efforts from markdown files
 * - Handle file I/O errors
 * - Parse frontmatter
 * - Maintain file structure
 */
class FileRepository {
  /**
   * @param {string} basePath - Base directory for work efforts
   */
  constructor(basePath) {
    this.basePath = basePath;
  }

  /**
   * Save work effort to file system
   * @param {WorkEffort} workEffort
   * @returns {Promise<void>}
   */
  async save(workEffort) {
    const dirName = this.toDirName(workEffort);
    const dirPath = path.join(this.basePath, dirName);
    const filePath = path.join(dirPath, `${workEffort.id}_index.md`);

    // Create directory
    await fs.mkdir(dirPath, { recursive: true });

    // Create markdown content with frontmatter
    const content = this.toMarkdown(workEffort);

    // Atomic write using temp file
    const tempPath = `${filePath}.tmp.${Date.now()}`;
    await fs.writeFile(tempPath, content, 'utf-8');
    await fs.rename(tempPath, filePath);
  }

  /**
   * Find work effort by ID
   * @param {string} id
   * @returns {Promise<WorkEffort | null>}
   */
  async findById(id) {
    try {
      const entries = await fs.readdir(this.basePath, { withFileTypes: true });
      const dir = entries.find(e => e.isDirectory() && e.name.startsWith(id));

      if (!dir) {
        return null;
      }

      const filePath = path.join(this.basePath, dir.name, `${id}_index.md`);
      const content = await fs.readFile(filePath, 'utf-8');

      return this.fromMarkdown(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Find all work efforts
   * @returns {Promise<WorkEffort[]>}
   */
  async findAll() {
    try {
      const entries = await fs.readdir(this.basePath, { withFileTypes: true });
      const weDirs = entries.filter(e =>
        e.isDirectory() && /^WE-\d{6}-[a-z0-9]{4}_/.test(e.name)
      );

      const workEfforts = await Promise.all(
        weDirs.map(async (dir) => {
          const id = dir.name.match(/^(WE-\d{6}-[a-z0-9]{4})/)[1];
          return this.findById(id);
        })
      );

      return workEfforts.filter(we => we !== null);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Convert work effort to directory name
   * @private
   */
  toDirName(workEffort) {
    const slug = workEffort.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');

    return `${workEffort.id}_${slug}`;
  }

  /**
   * Convert work effort to markdown with frontmatter
   * @private
   */
  toMarkdown(workEffort) {
    const frontmatter = {
      id: workEffort.id,
      title: workEffort.title,
      status: workEffort.status,
      progress: workEffort.progress,
      created: workEffort.created.toISOString()
    };

    if (workEffort.completedAt) {
      frontmatter.completed_at = workEffort.completedAt.toISOString();
    }

    return matter.stringify(workEffort.description || '', frontmatter);
  }

  /**
   * Parse markdown with frontmatter into WorkEffort
   * @private
   */
  fromMarkdown(content) {
    const { data, content: description } = matter(content);

    return new WorkEffort({
      id: data.id,
      title: data.title,
      status: data.status,
      progress: data.progress || 0,
      created: new Date(data.created),
      description: description.trim()
    });
  }
}

module.exports = { FileRepository };
```

#### Step 3: Test and Commit
```bash
npm test -- --coverage

git add .
git commit -m "feat(infrastructure): implement file-based repository with full test coverage"
```

### Phase 3: Application Layer (Days 6-7)
**Goal**: Implement use cases and business operations

#### Step 1: Write Use Case Tests

**File**: `test/application/create-work-effort.test.js`
```javascript
const { CreateWorkEffort } = require('../../src/application/create-work-effort');
const { InMemoryRepository } = require('../helpers/in-memory-repository');

describe('CreateWorkEffort Use Case', () => {
  let useCase;
  let repository;

  beforeEach(() => {
    repository = new InMemoryRepository();
    useCase = new CreateWorkEffort(repository);
  });

  it('creates work effort with valid data', async () => {
    const result = await useCase.execute({
      title: 'Test Feature',
      description: 'Build a test feature',
      tickets: ['Setup', 'Implement', 'Test']
    });

    expect(result.ok).toBe(true);
    expect(result.value.id).toMatch(/^WE-\d{6}-[a-z0-9]{4}$/);
    expect(result.value.title).toBe('Test Feature');
    expect(result.value.status).toBe('planned');

    // Verify saved to repository
    const saved = await repository.findById(result.value.id);
    expect(saved).not.toBeNull();
  });

  it('fails with invalid title', async () => {
    const result = await useCase.execute({
      title: '', // Invalid
      description: 'Test'
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain('Title is required');
  });
});
```

#### Step 2: Implement Use Case

**File**: `src/application/create-work-effort.js`
```javascript
const { WorkEffort } = require('../domain/work-effort');

/**
 * CreateWorkEffort - Application Use Case
 * Handles the creation of new work efforts
 *
 * Responsibilities:
 * - Validate input
 * - Generate ID
 * - Create domain entity
 * - Persist via repository
 * - Publish domain events
 */
class CreateWorkEffort {
  constructor(repository, eventBus = null) {
    this.repository = repository;
    this.eventBus = eventBus;
  }

  /**
   * Execute use case
   * @param {Object} input
   * @param {string} input.title
   * @param {string} [input.description]
   * @param {string[]} [input.tickets]
   * @returns {Promise<Result<WorkEffort, string>>}
   */
  async execute(input) {
    // Validate input
    const validation = this.validate(input);
    if (!validation.ok) {
      return validation;
    }

    try {
      // Generate ID
      const id = this.generateId();

      // Create domain entity
      const workEffort = new WorkEffort({
        id,
        title: input.title,
        description: input.description,
        status: 'planned',
        created: new Date()
      });

      // Persist
      await this.repository.save(workEffort);

      // Publish events
      if (this.eventBus) {
        for (const event of workEffort.events) {
          this.eventBus.publish(event);
        }
      }

      return { ok: true, value: workEffort };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Validate input
   * @private
   */
  validate(input) {
    if (!input.title || input.title.trim().length === 0) {
      return { ok: false, error: 'Title is required' };
    }

    if (input.title.length > 200) {
      return { ok: false, error: 'Title must be 200 characters or less' };
    }

    return { ok: true };
  }

  /**
   * Generate work effort ID
   * @private
   */
  generateId() {
    const date = new Date();
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    const random = this.randomHash(4);

    return `WE-${yy}${mm}${dd}-${random}`;
  }

  /**
   * Generate random hash
   * @private
   */
  randomHash(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }
}

module.exports = { CreateWorkEffort };
```

### Phase 4: API Layer (Days 8-9)
**Goal**: Expose operations via HTTP API

This would continue with Express routes, middleware, validation, etc.

## Professional Developer Workflow

### Daily Routine

```bash
# Morning: Update dependencies and check CI
git pull
npm install
npm test -- --watch  # Keep running

# Development loop:
# 1. Write failing test
# 2. Run test (red)
# 3. Implement minimum code to pass
# 4. Run test (green)
# 5. Refactor
# 6. Run test (still green)
# 7. Commit

# Example commit messages
git commit -m "test: add test for work effort validation"
git commit -m "feat: implement work effort validation"
git commit -m "refactor: extract validation to separate function"

# End of day: Ensure clean state
npm run lint
npm run test:coverage
git status  # Should be clean or with only feature branch changes
```

### Quality Gates (Before Every Commit)

```bash
#!/bin/bash
# pre-commit.sh - Run before every commit

set -e  # Exit on error

echo "Running quality checks..."

# Lint
npm run lint || { echo "❌ Lint failed"; exit 1; }

# Tests
npm test || { echo "❌ Tests failed"; exit 1; }

# Coverage threshold
npm run test:coverage -- --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80,"statements":80}}' || { echo "❌ Coverage below 80%"; exit 1; }

echo "✅ All checks passed"
```

### Code Review Checklist

Before requesting review:
- [ ] All tests pass
- [ ] Coverage >80%
- [ ] No linting errors
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Migration guide if breaking changes
- [ ] Performance tested (if applicable)

## Key Takeaways

A professional developer:

1. **Tests First** - TDD isn't optional, it's how you think
2. **Small Commits** - Each commit is a complete, tested feature
3. **CI/CD Early** - Set up automation before writing features
4. **Bottom-Up** - Build foundation (domain, infrastructure) before UI
5. **Measure Everything** - Instrumentation from day 1
6. **Document Continuously** - Write docs as you code

The result is a system that's **testable**, **maintainable**, and **deployable** at every commit.
