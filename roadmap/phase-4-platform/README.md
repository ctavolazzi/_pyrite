# Phase 4: Platform & Ecosystem

**Version Target**: v1.0.0+
**Duration**: 8-10 weeks
**Status**: Planning
**Priority**: P1 (High)
**Depends On**: Phase 3 (Analytics & Intelligence)

## Objectives

Transform Pyrite from a standalone tool into an extensible platform:
1. Plugin architecture for community extensions
2. REST + GraphQL APIs for external integrations
3. GitHub/GitLab/Jira integrations
4. VS Code extension
5. Public marketplace and documentation portal
6. v1.0.0 production release

## Stage Breakdown

### Stage 1: Plugin Architecture (Weeks 1-3) → v1.0.0-alpha.1

**Goal**: Build extensible plugin system with sandboxing and lifecycle management

#### Plugin System Architecture

```
┌─────────────────────────────────────┐
│         Plugin Registry             │
│  (discover, load, manage plugins)   │
├─────────────────────────────────────┤
│         Plugin Sandbox              │
│    (isolated execution context)     │
├─────────────────────────────────────┤
│         Plugin API                  │
│  (hooks, events, data access)       │
├─────────────────────────────────────┤
│      Core Pyrite System             │
└─────────────────────────────────────┘
```

#### Plugin Manifest Schema

**File**: `plugin-manifest-schema.json`
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["name", "version", "main", "permissions"],
  "properties": {
    "name": {
      "type": "string",
      "pattern": "^[a-z0-9-]+$",
      "minLength": 3,
      "maxLength": 50
    },
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$"
    },
    "description": {
      "type": "string",
      "maxLength": 200
    },
    "author": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "email": { "type": "string", "format": "email" },
        "url": { "type": "string", "format": "uri" }
      }
    },
    "main": {
      "type": "string",
      "description": "Entry point file"
    },
    "permissions": {
      "type": "array",
      "items": {
        "enum": [
          "read:work-efforts",
          "write:work-efforts",
          "read:tickets",
          "write:tickets",
          "read:analytics",
          "network",
          "filesystem"
        ]
      }
    },
    "hooks": {
      "type": "object",
      "properties": {
        "onWorkEffortCreate": { "type": "string" },
        "onWorkEffortUpdate": { "type": "string" },
        "onWorkEffortComplete": { "type": "string" },
        "onTicketCreate": { "type": "string" },
        "onDashboardRender": { "type": "string" }
      }
    },
    "dependencies": {
      "type": "object",
      "additionalProperties": { "type": "string" }
    }
  }
}
```

#### Plugin Registry

**File**: `mcp-servers/dashboard/lib/plugins/registry.js`
```javascript
const { readdir, readFile } = require('fs/promises');
const { join } = require('path');
const Ajv = require('ajv');

/**
 * Plugin Registry
 * Manages plugin discovery, loading, and lifecycle
 */
class PluginRegistry {
  constructor(options = {}) {
    this.pluginsDir = options.pluginsDir || './plugins';
    this.plugins = new Map();
    this.hooks = new Map();

    // Initialize JSON schema validator
    this.ajv = new Ajv();
    this.manifestValidator = this.ajv.compile(
      require('./plugin-manifest-schema.json')
    );
  }

  /**
   * Discover and load all plugins
   * @returns {Promise<void>}
   */
  async loadAll() {
    try {
      const entries = await readdir(this.pluginsDir, { withFileTypes: true });
      const pluginDirs = entries.filter(e => e.isDirectory());

      for (const dir of pluginDirs) {
        try {
          await this.loadPlugin(dir.name);
        } catch (error) {
          console.error(`Failed to load plugin ${dir.name}:`, error);
        }
      }

      console.log(`Loaded ${this.plugins.size} plugins`);
    } catch (error) {
      console.error('Plugin directory not found:', error);
    }
  }

  /**
   * Load a single plugin
   * @param {string} pluginName
   * @returns {Promise<void>}
   */
  async loadPlugin(pluginName) {
    const pluginPath = join(this.pluginsDir, pluginName);

    // Read and validate manifest
    const manifestPath = join(pluginPath, 'plugin.json');
    const manifestJson = await readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestJson);

    const valid = this.manifestValidator(manifest);
    if (!valid) {
      throw new Error(
        `Invalid manifest: ${JSON.stringify(this.manifestValidator.errors)}`
      );
    }

    // Load plugin code
    const mainPath = join(pluginPath, manifest.main);
    const PluginClass = require(mainPath);

    // Create plugin instance with sandboxed API
    const api = this.createPluginAPI(manifest.permissions);
    const instance = new PluginClass(api);

    // Store plugin
    this.plugins.set(pluginName, {
      manifest,
      instance,
      enabled: true
    });

    // Register hooks
    if (manifest.hooks) {
      Object.entries(manifest.hooks).forEach(([hook, method]) => {
        this.registerHook(hook, pluginName, method);
      });
    }

    console.log(`Loaded plugin: ${pluginName} v${manifest.version}`);
  }

  /**
   * Create sandboxed API for plugin
   * @param {string[]} permissions
   * @returns {Object} Plugin API
   */
  createPluginAPI(permissions) {
    const api = {};

    // Only expose permitted APIs
    if (permissions.includes('read:work-efforts')) {
      api.getWorkEfforts = async (query) => {
        return await this.core.repository.findAll(query);
      };
    }

    if (permissions.includes('write:work-efforts')) {
      api.updateWorkEffort = async (id, updates) => {
        return await this.core.repository.update(id, updates);
      };
    }

    if (permissions.includes('read:analytics')) {
      api.getAnalytics = async (type) => {
        return await this.core.analytics.getStats(type);
      };
    }

    if (permissions.includes('network')) {
      api.fetch = require('node-fetch');
    }

    // Event emitter
    api.on = (event, handler) => {
      this.core.eventBus.on(event, handler);
    };

    api.emit = (event, data) => {
      this.core.eventBus.emit(event, data);
    };

    return api;
  }

  /**
   * Register plugin hook
   * @param {string} hookName
   * @param {string} pluginName
   * @param {string} methodName
   */
  registerHook(hookName, pluginName, methodName) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }

    this.hooks.get(hookName).push({
      pluginName,
      methodName
    });
  }

  /**
   * Execute hook
   * @param {string} hookName
   * @param {*} data
   * @returns {Promise<*>} Modified data
   */
  async executeHook(hookName, data) {
    const hooks = this.hooks.get(hookName) || [];
    let result = data;

    for (const { pluginName, methodName } of hooks) {
      const plugin = this.plugins.get(pluginName);

      if (!plugin || !plugin.enabled) continue;

      try {
        result = await plugin.instance[methodName](result);
      } catch (error) {
        console.error(
          `Error executing ${pluginName}.${methodName}:`,
          error
        );
      }
    }

    return result;
  }

  /**
   * Enable/disable plugin
   * @param {string} pluginName
   * @param {boolean} enabled
   */
  setPluginEnabled(pluginName, enabled) {
    const plugin = this.plugins.get(pluginName);
    if (plugin) {
      plugin.enabled = enabled;
    }
  }

  /**
   * Get all plugins
   * @returns {Object[]}
   */
  getAllPlugins() {
    return Array.from(this.plugins.entries()).map(([name, plugin]) => ({
      name,
      version: plugin.manifest.version,
      description: plugin.manifest.description,
      enabled: plugin.enabled,
      permissions: plugin.manifest.permissions
    }));
  }
}

module.exports = { PluginRegistry };
```

#### Example Plugin: Slack Notifications

**File**: `plugins/slack-notifications/plugin.json`
```json
{
  "name": "slack-notifications",
  "version": "1.0.0",
  "description": "Send Slack notifications for work effort events",
  "author": {
    "name": "Pyrite Community",
    "email": "community@pyrite.dev"
  },
  "main": "index.js",
  "permissions": [
    "read:work-efforts",
    "network"
  ],
  "hooks": {
    "onWorkEffortComplete": "notifyCompletion"
  },
  "config": {
    "webhookUrl": {
      "type": "string",
      "required": true,
      "description": "Slack webhook URL"
    }
  }
}
```

**File**: `plugins/slack-notifications/index.js`
```javascript
class SlackNotifications {
  constructor(api) {
    this.api = api;
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL;
  }

  async notifyCompletion(workEffort) {
    if (!this.webhookUrl) {
      console.warn('Slack webhook URL not configured');
      return workEffort;
    }

    const message = {
      text: `🎉 Work Effort Completed: ${workEffort.title}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${workEffort.title}* has been completed!`
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `ID: ${workEffort.id} | Created: ${new Date(workEffort.created).toLocaleDateString()}`
            }
          ]
        }
      ]
    };

    await this.api.fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });

    return workEffort; // Pass through unchanged
  }
}

module.exports = SlackNotifications;
```

---

### Stage 2: API Development (Weeks 4-6) → v1.0.0-beta.1

**Goal**: Production-ready REST and GraphQL APIs

#### REST API Design

**File**: `mcp-servers/api/routes/v1/index.js`
```javascript
const express = require('express');
const router = express.Router();

/**
 * REST API v1
 * OpenAPI 3.0 compliant
 */

// Work Efforts endpoints
router.get('/work-efforts', async (req, res) => {
  const {
    status,
    limit = 50,
    offset = 0,
    sort = '-updated_at'
  } = req.query;

  const workEfforts = await req.repo.findAll({
    status,
    limit: parseInt(limit),
    offset: parseInt(offset),
    sort
  });

  res.json({
    data: workEfforts,
    meta: {
      total: workEfforts.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    },
    links: {
      self: `/api/v1/work-efforts?${new URLSearchParams(req.query)}`,
      next: `/api/v1/work-efforts?${new URLSearchParams({ ...req.query, offset: parseInt(offset) + parseInt(limit) })}`
    }
  });
});

router.get('/work-efforts/:id', async (req, res) => {
  const we = await req.repo.findById(req.params.id);

  if (!we) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Work effort not found'
      }
    });
  }

  res.json({ data: we });
});

router.post('/work-efforts', async (req, res) => {
  const { title, description, tickets } = req.validatedData;

  const we = await req.workEffortService.create({
    title,
    description,
    tickets
  });

  res.status(201).json({
    data: we,
    links: {
      self: `/api/v1/work-efforts/${we.id}`
    }
  });
});

router.patch('/work-efforts/:id', async (req, res) => {
  const { status, progress } = req.validatedData;

  const updated = await req.workEffortService.update(req.params.id, {
    status,
    progress
  });

  res.json({ data: updated });
});

router.delete('/work-efforts/:id', async (req, res) => {
  await req.workEffortService.delete(req.params.id);
  res.status(204).send();
});

module.exports = router;
```

#### GraphQL Schema

**File**: `mcp-servers/api/graphql/schema.graphql`
```graphql
type Query {
  workEffort(id: ID!): WorkEffort
  workEfforts(
    status: WorkEffortStatus
    limit: Int = 50
    offset: Int = 0
    sort: String = "-updated_at"
  ): WorkEffortConnection!

  ticket(id: ID!): Ticket
  tickets(workEffortId: ID!, status: TicketStatus): [Ticket!]!

  analytics: Analytics!
  predictions(workEffortId: ID!): Prediction
}

type Mutation {
  createWorkEffort(input: CreateWorkEffortInput!): WorkEffort!
  updateWorkEffort(id: ID!, input: UpdateWorkEffortInput!): WorkEffort!
  deleteWorkEffort(id: ID!): Boolean!

  createTicket(input: CreateTicketInput!): Ticket!
  updateTicket(id: ID!, input: UpdateTicketInput!): Ticket!
}

type Subscription {
  workEffortUpdated(id: ID): WorkEffort!
  ticketUpdated(workEffortId: ID): Ticket!
}

type WorkEffort {
  id: ID!
  title: String!
  description: String
  status: WorkEffortStatus!
  progress: Int!
  branch: String
  createdAt: DateTime!
  updatedAt: DateTime!
  completedAt: DateTime

  tickets: [Ticket!]!
  tags: [Tag!]!

  # Analytics
  prediction: Prediction
  riskScore: Float
}

enum WorkEffortStatus {
  PLANNED
  IN_PROGRESS
  COMPLETED
  BLOCKED
}

type Ticket {
  id: ID!
  title: String!
  description: String
  status: TicketStatus!
  sequenceNumber: Int!
  workEffortId: ID!
  workEffort: WorkEffort!
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum TicketStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
}

type WorkEffortConnection {
  edges: [WorkEffortEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type WorkEffortEdge {
  node: WorkEffort!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

type Analytics {
  velocity: Velocity!
  cycleTime: CycleTimeStats!
  patterns: [Pattern!]!
}

type Velocity {
  current: Float!
  average: Float!
  trend: Float!
  forecast: [Float!]!
}

type Prediction {
  estimatedDays: Int!
  confidence: Float!
  completionDate: DateTime!
  range: PredictionRange!
}

type PredictionRange {
  min: Int!
  max: Int!
}

input CreateWorkEffortInput {
  title: String!
  description: String
  tickets: [String!]
}

input UpdateWorkEffortInput {
  status: WorkEffortStatus
  progress: Int
  branch: String
}

scalar DateTime
```

#### GraphQL Resolvers

**File**: `mcp-servers/api/graphql/resolvers.js`
```javascript
const { PubSub } = require('graphql-subscriptions');

const pubsub = new PubSub();

const resolvers = {
  Query: {
    workEffort: async (_, { id }, { repo }) => {
      return await repo.findById(id);
    },

    workEfforts: async (_, args, { repo }) => {
      const { status, limit, offset } = args;

      const workEfforts = await repo.findAll({
        status,
        limit,
        offset
      });

      return {
        edges: workEfforts.map((we, idx) => ({
          node: we,
          cursor: Buffer.from(`${offset + idx}`).toString('base64')
        })),
        pageInfo: {
          hasNextPage: workEfforts.length === limit,
          hasPreviousPage: offset > 0,
          startCursor: workEfforts.length > 0
            ? Buffer.from(`${offset}`).toString('base64')
            : null,
          endCursor: workEfforts.length > 0
            ? Buffer.from(`${offset + workEfforts.length - 1}`).toString('base64')
            : null
        },
        totalCount: await repo.count({ status })
      };
    },

    analytics: async (_, __, { analytics }) => {
      return {}; // Resolved by Analytics type resolvers
    },

    predictions: async (_, { workEffortId }, { predictor, repo }) => {
      const we = await repo.findById(workEffortId);
      return predictor.predictCompletion(we);
    }
  },

  Mutation: {
    createWorkEffort: async (_, { input }, { workEffortService }) => {
      const we = await workEffortService.create(input);

      // Publish subscription
      pubsub.publish('WORK_EFFORT_UPDATED', {
        workEffortUpdated: we
      });

      return we;
    },

    updateWorkEffort: async (_, { id, input }, { workEffortService }) => {
      const updated = await workEffortService.update(id, input);

      pubsub.publish('WORK_EFFORT_UPDATED', {
        workEffortUpdated: updated
      });

      return updated;
    }
  },

  Subscription: {
    workEffortUpdated: {
      subscribe: (_, { id }) => {
        if (id) {
          return pubsub.asyncIterator([`WORK_EFFORT_UPDATED_${id}`]);
        }
        return pubsub.asyncIterator(['WORK_EFFORT_UPDATED']);
      }
    }
  },

  WorkEffort: {
    tickets: async (workEffort, _, { repo }) => {
      return await repo.findTickets(workEffort.id);
    },

    prediction: async (workEffort, _, { predictor }) => {
      return predictor.predictCompletion(workEffort);
    },

    riskScore: async (workEffort, _, { predictor }) => {
      const risks = await predictor.identifyRisks();
      const risk = risks.find(r => r.workEffort.id === workEffort.id);
      return risk?.riskScore || 0;
    }
  },

  Analytics: {
    velocity: async (_, __, { analytics }) => {
      return analytics.calculateVelocity();
    },

    cycleTime: async (_, __, { analytics }) => {
      return analytics.analyzeCycleTime();
    }
  }
};

module.exports = { resolvers };
```

---

### Stage 3: Integrations (Weeks 7-9) → v1.0.0-rc.1

**Goal**: GitHub, GitLab, and Jira integrations

#### GitHub Integration

**File**: `mcp-servers/integrations/github/index.js`
```javascript
const { Octokit } = require('@octokit/rest');

/**
 * GitHub Integration
 * Syncs work efforts with GitHub issues and PRs
 */
class GitHubIntegration {
  constructor(config) {
    this.octokit = new Octokit({
      auth: config.token
    });

    this.owner = config.owner;
    this.repo = config.repo;
  }

  /**
   * Sync work effort to GitHub issue
   * @param {Object} workEffort
   * @returns {Promise<Object>} GitHub issue
   */
  async syncToIssue(workEffort) {
    const issueNumber = this.extractIssueNumber(workEffort);

    const issueData = {
      title: workEffort.title,
      body: this.formatIssueBody(workEffort),
      labels: [workEffort.status, ...workEffort.tags]
    };

    if (issueNumber) {
      // Update existing issue
      const { data } = await this.octokit.issues.update({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        ...issueData
      });

      return data;
    } else {
      // Create new issue
      const { data } = await this.octokit.issues.create({
        owner: this.owner,
        repo: this.repo,
        ...issueData
      });

      return data;
    }
  }

  /**
   * Create PR from work effort branch
   * @param {Object} workEffort
   * @returns {Promise<Object>} Pull request
   */
  async createPullRequest(workEffort) {
    if (!workEffort.branch) {
      throw new Error('Work effort has no branch');
    }

    const { data } = await this.octokit.pulls.create({
      owner: this.owner,
      repo: this.repo,
      title: workEffort.title,
      head: workEffort.branch,
      base: 'main',
      body: this.formatPRBody(workEffort)
    });

    return data;
  }

  /**
   * Add comment to PR when work effort updates
   * @param {number} prNumber
   * @param {string} message
   */
  async addPRComment(prNumber, message) {
    await this.octokit.issues.createComment({
      owner: this.owner,
      repo: this.repo,
      issue_number: prNumber,
      body: message
    });
  }

  formatIssueBody(we) {
    return `
## Work Effort: ${we.id}

${we.description || ''}

**Status:** ${we.status}
**Progress:** ${we.progress}%

### Tickets
${we.tickets.map(t => `- [${t.status === 'completed' ? 'x' : ' '}] ${t.title}`).join('\n')}

---
*Synced from Pyrite Mission Control*
    `.trim();
  }

  formatPRBody(we) {
    return `
## Summary
${we.description || ''}

## Work Effort
- ID: ${we.id}
- Status: ${we.status}
- Progress: ${we.progress}%

## Tickets
${we.tickets.map(t => `- [${t.status === 'completed' ? 'x' : ' '}] ${t.title}`).join('\n')}

---
*Auto-generated from Pyrite work effort ${we.id}*
    `.trim();
  }

  extractIssueNumber(we) {
    // Extract from metadata if exists
    return we.metadata?.githubIssue || null;
  }
}

module.exports = { GitHubIntegration };
```

---

### Stage 4: VS Code Extension (Weeks 10-12) → v1.0.0

**Goal**: VS Code extension for in-editor work effort management

#### Extension Manifest

**File**: `extensions/vscode/package.json`
```json
{
  "name": "pyrite-vscode",
  "displayName": "Pyrite Mission Control",
  "description": "Manage work efforts and tickets from VS Code",
  "version": "1.0.0",
  "publisher": "pyrite",
  "engines": {
    "vscode": "^1.80.0"
  },
  "categories": ["Other"],
  "activationEvents": ["onStartupFinished"],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "pyrite.createWorkEffort",
        "title": "Pyrite: Create Work Effort"
      },
      {
        "command": "pyrite.viewWorkEfforts",
        "title": "Pyrite: View Work Efforts"
      },
      {
        "command": "pyrite.updateStatus",
        "title": "Pyrite: Update Status"
      }
    ],
    "viewsContainers": {
      "activitybar": [
        {
          "id": "pyrite",
          "title": "Pyrite",
          "icon": "resources/icon.svg"
        }
      ]
    },
    "views": {
      "pyrite": [
        {
          "id": "workEfforts",
          "name": "Work Efforts"
        },
        {
          "id": "analytics",
          "name": "Analytics"
        }
      ]
    },
    "configuration": {
      "title": "Pyrite",
      "properties": {
        "pyrite.apiUrl": {
          "type": "string",
          "default": "http://localhost:3847",
          "description": "Pyrite API URL"
        }
      }
    }
  }
}
```

#### Extension Main

**File**: `extensions/vscode/src/extension.ts`
```typescript
import * as vscode from 'vscode';
import { WorkEffortTreeProvider } from './workEffortTree';
import { PyriteClient } from './client';

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('pyrite');
  const apiUrl = config.get<string>('apiUrl')!;

  const client = new PyriteClient(apiUrl);
  const treeProvider = new WorkEffortTreeProvider(client);

  vscode.window.registerTreeDataProvider('workEfforts', treeProvider);

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('pyrite.createWorkEffort', async () => {
      const title = await vscode.window.showInputBox({
        prompt: 'Work Effort Title',
        placeHolder: 'Enter title...'
      });

      if (title) {
        await client.createWorkEffort({ title });
        treeProvider.refresh();
        vscode.window.showInformationMessage(`Created work effort: ${title}`);
      }
    })
  );

  // Status bar item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left
  );
  statusBarItem.text = '$(rocket) Pyrite';
  statusBarItem.command = 'pyrite.viewWorkEfforts';
  statusBarItem.show();

  context.subscriptions.push(statusBarItem);
}

export function deactivate() {}
```

## v1.0.0 Release Checklist

- [ ] All Phase 1-3 features complete
- [ ] Plugin system tested with 5+ community plugins
- [ ] REST API v1 frozen and documented (OpenAPI 3.0)
- [ ] GraphQL API stable
- [ ] VS Code extension published to marketplace
- [ ] Docker images published to Docker Hub
- [ ] Documentation portal live (docs.pyrite.dev)
- [ ] Security audit completed (zero critical vulnerabilities)
- [ ] Performance benchmarks published
- [ ] Migration guide from v0.x to v1.0
- [ ] CHANGELOG comprehensive
- [ ] Announcement blog post published
- [ ] Community Discord/Slack channel active

## Success Metrics

- [ ] 10+ community plugins in marketplace
- [ ] 100+ external API integrations
- [ ] 1000+ downloads of VS Code extension
- [ ] API uptime 99.9%
- [ ] <100ms p95 API response time
- [ ] Complete API documentation with examples
- [ ] 50+ stars on GitHub
- [ ] Active community (10+ contributors)

---

**Congratulations on reaching v1.0.0! 🎉**
