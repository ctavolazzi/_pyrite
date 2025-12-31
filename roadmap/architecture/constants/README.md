# Constants, Configuration & Lookup Tables

**All magic numbers, configuration values, enums, and reference data centralized and documented.**

## Configuration Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Environment Variables (.env)                             │
│  - Secrets (API keys, passwords)                         │
│  - Environment-specific (dev/staging/prod)               │
└────────────────┬─────────────────────────────────────────┘
                 │ loaded at startup
                 ↓
┌──────────────────────────────────────────────────────────┐
│  Configuration Files (config/*.json)                      │
│  - Application settings                                  │
│  - Feature flags                                         │
│  - Business rules                                        │
└────────────────┬─────────────────────────────────────────┘
                 │ merged with env vars
                 ↓
┌──────────────────────────────────────────────────────────┐
│  Runtime Configuration Object                             │
│  - Type-safe                                             │
│  - Validated                                             │
│  - Frozen (immutable)                                    │
└──────────────────────────────────────────────────────────┘
```

## Constants

### 1. Domain Constants

**File**: `src/domain/constants.js`
```javascript
/**
 * Domain Constants - Business rules and constraints
 */

// Work Effort Status
const WorkEffortStatus = Object.freeze({
  PLANNED: 'planned',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  BLOCKED: 'blocked'
});

// Valid status transitions
const WorkEffortTransitions = Object.freeze({
  [WorkEffortStatus.PLANNED]: [WorkEffortStatus.IN_PROGRESS],
  [WorkEffortStatus.IN_PROGRESS]: [
    WorkEffortStatus.BLOCKED,
    WorkEffortStatus.COMPLETED
  ],
  [WorkEffortStatus.BLOCKED]: [WorkEffortStatus.IN_PROGRESS],
  [WorkEffortStatus.COMPLETED]: [] // Terminal state
});

// Ticket Status
const TicketStatus = Object.freeze({
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed'
});

// Progress Constraints
const ProgressConstraints = Object.freeze({
  MIN: 0,
  MAX: 100,
  AUTO_COMPLETE_THRESHOLD: 100
});

// ID Patterns (RegExp)
const IDPatterns = Object.freeze({
  WORK_EFFORT: /^WE-\d{6}-[a-z0-9]{4}$/,
  TICKET: /^TKT-[a-z0-9]{4}-\d{3}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
});

// Validation Rules
const ValidationRules = Object.freeze({
  WORK_EFFORT_TITLE_MAX_LENGTH: 200,
  WORK_EFFORT_DESCRIPTION_MAX_LENGTH: 10000,
  TICKET_TITLE_MAX_LENGTH: 150,
  MAX_TICKETS_PER_WORK_EFFORT: 100,
  BLOCK_REASON_MAX_LENGTH: 500
});

// Time Constants (milliseconds)
const TimeConstants = Object.freeze({
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000
});

// Default Values
const Defaults = Object.freeze({
  INITIAL_PROGRESS: 0,
  INITIAL_STATUS: WorkEffortStatus.PLANNED,
  PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100
});

module.exports = {
  WorkEffortStatus,
  WorkEffortTransitions,
  TicketStatus,
  ProgressConstraints,
  IDPatterns,
  ValidationRules,
  TimeConstants,
  Defaults
};
```

### 2. Infrastructure Constants

**File**: `src/infrastructure/constants.js`
```javascript
/**
 * Infrastructure Constants - Technical limits and defaults
 */

// Cache Configuration
const CacheConfig = Object.freeze({
  L1_MAX_SIZE: 100 * 1024 * 1024,        // 100 MB
  L1_MAX_AGE: 5 * 60 * 1000,             // 5 minutes
  L2_MAX_SIZE: 1 * 1024 * 1024 * 1024,   // 1 GB
  L2_MAX_AGE: 60 * 60 * 1000,            // 1 hour
  DEFAULT_TTL: 300 * 1000                // 5 minutes
});

// Database Configuration
const DatabaseConfig = Object.freeze({
  CONNECTION_POOL_SIZE: 10,
  QUERY_TIMEOUT: 30 * 1000,              // 30 seconds
  TRANSACTION_TIMEOUT: 60 * 1000,        // 60 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000                      // 1 second
});

// File System
const FileSystemConfig = Object.freeze({
  WATCH_DEBOUNCE: 300,                   // 300ms
  WATCH_THROTTLE: 2000,                  // 2 seconds
  MAX_FILE_SIZE: 10 * 1024 * 1024,       // 10 MB
  TEMP_FILE_PREFIX: '.tmp.',
  ATOMIC_WRITE_RETRIES: 3
});

// HTTP/API
const HTTPConfig = Object.freeze({
  PORT: 3847,
  CORS_MAX_AGE: 86400,                   // 24 hours
  REQUEST_TIMEOUT: 30 * 1000,            // 30 seconds
  BODY_SIZE_LIMIT: 1024 * 1024,          // 1 MB
  RATE_LIMIT_WINDOW: 15 * 60 * 1000,     // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100
});

// WebSocket
const WebSocketConfig = Object.freeze({
  PING_INTERVAL: 30 * 1000,              // 30 seconds
  PONG_TIMEOUT: 5 * 1000,                // 5 seconds
  RECONNECT_INITIAL_DELAY: 1000,         // 1 second
  RECONNECT_MAX_DELAY: 30 * 1000,        // 30 seconds
  RECONNECT_MULTIPLIER: 1.5,
  MAX_MESSAGE_SIZE: 1024 * 1024          // 1 MB
});

// Logging
const LogConfig = Object.freeze({
  MAX_LOG_SIZE: 10 * 1024 * 1024,        // 10 MB
  MAX_LOG_FILES: 5,
  LOG_ROTATION_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
  DEFAULT_LOG_LEVEL: 'info'
});

module.exports = {
  CacheConfig,
  DatabaseConfig,
  FileSystemConfig,
  HTTPConfig,
  WebSocketConfig,
  LogConfig
};
```

### 3. Error Codes

**File**: `src/domain/error-codes.js`
```javascript
/**
 * Error Codes - Categorized error taxonomy
 */

const ErrorCodes = Object.freeze({
  // Validation Errors (1000-1999)
  VALIDATION_FAILED: 1000,
  INVALID_ID_FORMAT: 1001,
  INVALID_STATUS: 1002,
  INVALID_PROGRESS: 1003,
  TITLE_TOO_LONG: 1004,
  TITLE_REQUIRED: 1005,
  INVALID_TRANSITION: 1006,

  // Not Found Errors (2000-2999)
  WORK_EFFORT_NOT_FOUND: 2000,
  TICKET_NOT_FOUND: 2001,
  FILE_NOT_FOUND: 2002,

  // Conflict Errors (3000-3999)
  DUPLICATE_ID: 3000,
  OPTIMISTIC_LOCK_FAILED: 3001,
  STATE_CONFLICT: 3002,

  // Permission Errors (4000-4999)
  UNAUTHORIZED: 4000,
  FORBIDDEN: 4001,
  INSUFFICIENT_PERMISSIONS: 4002,

  // Infrastructure Errors (5000-5999)
  DATABASE_ERROR: 5000,
  FILE_SYSTEM_ERROR: 5001,
  NETWORK_ERROR: 5002,
  CACHE_ERROR: 5003,
  EXTERNAL_SERVICE_ERROR: 5004,

  // Business Logic Errors (6000-6999)
  CANNOT_COMPLETE_INCOMPLETE: 6000,
  CANNOT_START_COMPLETED: 6001,
  CANNOT_MODIFY_COMPLETED: 6002,
  MAX_TICKETS_EXCEEDED: 6003
});

// Error code → message mapping
const ErrorMessages = Object.freeze({
  [ErrorCodes.VALIDATION_FAILED]: 'Validation failed',
  [ErrorCodes.INVALID_ID_FORMAT]: 'Invalid ID format',
  [ErrorCodes.INVALID_STATUS]: 'Invalid status value',
  [ErrorCodes.INVALID_PROGRESS]: 'Progress must be between 0 and 100',
  [ErrorCodes.TITLE_TOO_LONG]: 'Title exceeds maximum length',
  [ErrorCodes.TITLE_REQUIRED]: 'Title is required',
  [ErrorCodes.INVALID_TRANSITION]: 'Invalid state transition',

  [ErrorCodes.WORK_EFFORT_NOT_FOUND]: 'Work effort not found',
  [ErrorCodes.TICKET_NOT_FOUND]: 'Ticket not found',
  [ErrorCodes.FILE_NOT_FOUND]: 'File not found',

  [ErrorCodes.DUPLICATE_ID]: 'ID already exists',
  [ErrorCodes.OPTIMISTIC_LOCK_FAILED]: 'Resource was modified by another process',
  [ErrorCodes.STATE_CONFLICT]: 'State conflict detected',

  [ErrorCodes.UNAUTHORIZED]: 'Authentication required',
  [ErrorCodes.FORBIDDEN]: 'Access denied',
  [ErrorCodes.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions',

  [ErrorCodes.DATABASE_ERROR]: 'Database error occurred',
  [ErrorCodes.FILE_SYSTEM_ERROR]: 'File system error occurred',
  [ErrorCodes.NETWORK_ERROR]: 'Network error occurred',
  [ErrorCodes.CACHE_ERROR]: 'Cache error occurred',
  [ErrorCodes.EXTERNAL_SERVICE_ERROR]: 'External service error occurred',

  [ErrorCodes.CANNOT_COMPLETE_INCOMPLETE]: 'Cannot complete: progress must be 100%',
  [ErrorCodes.CANNOT_START_COMPLETED]: 'Cannot start completed work effort',
  [ErrorCodes.CANNOT_MODIFY_COMPLETED]: 'Cannot modify completed work effort',
  [ErrorCodes.MAX_TICKETS_EXCEEDED]: 'Maximum number of tickets exceeded'
});

// Error code → HTTP status mapping
const ErrorHTTPStatus = Object.freeze({
  // Validation → 400 Bad Request
  [ErrorCodes.VALIDATION_FAILED]: 400,
  [ErrorCodes.INVALID_ID_FORMAT]: 400,
  [ErrorCodes.INVALID_STATUS]: 400,
  [ErrorCodes.INVALID_PROGRESS]: 400,
  [ErrorCodes.TITLE_TOO_LONG]: 400,
  [ErrorCodes.TITLE_REQUIRED]: 400,
  [ErrorCodes.INVALID_TRANSITION]: 400,

  // Not Found → 404
  [ErrorCodes.WORK_EFFORT_NOT_FOUND]: 404,
  [ErrorCodes.TICKET_NOT_FOUND]: 404,
  [ErrorCodes.FILE_NOT_FOUND]: 404,

  // Conflict → 409
  [ErrorCodes.DUPLICATE_ID]: 409,
  [ErrorCodes.OPTIMISTIC_LOCK_FAILED]: 409,
  [ErrorCodes.STATE_CONFLICT]: 409,

  // Permission → 401/403
  [ErrorCodes.UNAUTHORIZED]: 401,
  [ErrorCodes.FORBIDDEN]: 403,
  [ErrorCodes.INSUFFICIENT_PERMISSIONS]: 403,

  // Infrastructure → 500
  [ErrorCodes.DATABASE_ERROR]: 500,
  [ErrorCodes.FILE_SYSTEM_ERROR]: 500,
  [ErrorCodes.NETWORK_ERROR]: 500,
  [ErrorCodes.CACHE_ERROR]: 500,
  [ErrorCodes.EXTERNAL_SERVICE_ERROR]: 502,

  // Business Logic → 422
  [ErrorCodes.CANNOT_COMPLETE_INCOMPLETE]: 422,
  [ErrorCodes.CANNOT_START_COMPLETED]: 422,
  [ErrorCodes.CANNOT_MODIFY_COMPLETED]: 422,
  [ErrorCodes.MAX_TICKETS_EXCEEDED]: 422
});

module.exports = {
  ErrorCodes,
  ErrorMessages,
  ErrorHTTPStatus
};
```

## Configuration Management

### Configuration Schema

**File**: `config/schema.js`
```javascript
const Joi = require('joi');

/**
 * Configuration Schema - Type-safe configuration validation
 */
const ConfigSchema = Joi.object({
  // Environment
  env: Joi.string()
    .valid('development', 'staging', 'production')
    .default('development'),

  // Server
  server: Joi.object({
    port: Joi.number().port().default(3847),
    host: Joi.string().hostname().default('localhost'),
    cors: Joi.object({
      origin: Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(Joi.string())
      ).default('*'),
      credentials: Joi.boolean().default(true)
    })
  }).required(),

  // Database
  database: Joi.object({
    type: Joi.string().valid('sqlite', 'postgres').default('sqlite'),
    path: Joi.string().when('type', {
      is: 'sqlite',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    host: Joi.string().when('type', {
      is: 'postgres',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    port: Joi.number().when('type', {
      is: 'postgres',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    database: Joi.string().required(),
    poolSize: Joi.number().min(1).max(100).default(10)
  }).required(),

  // Cache
  cache: Joi.object({
    enabled: Joi.boolean().default(true),
    l1MaxSize: Joi.number().min(1024 * 1024).default(100 * 1024 * 1024),
    l1MaxAge: Joi.number().min(1000).default(5 * 60 * 1000),
    l2Type: Joi.string().valid('disk', 'redis').default('disk'),
    l2Path: Joi.string().when('l2Type', {
      is: 'disk',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  }),

  // Logging
  logging: Joi.object({
    level: Joi.string()
      .valid('debug', 'info', 'warn', 'error')
      .default('info'),
    format: Joi.string().valid('json', 'pretty').default('pretty'),
    destination: Joi.string().default('stdout')
  }),

  // Feature Flags
  features: Joi.object({
    analytics: Joi.boolean().default(false),
    mlPredictions: Joi.boolean().default(false),
    githubIntegration: Joi.boolean().default(false),
    pluginSystem: Joi.boolean().default(false)
  }),

  // Secrets (from environment variables)
  secrets: Joi.object({
    jwtSecret: Joi.string().min(32).when('env', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    githubToken: Joi.string().when('features.githubIntegration', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  })
}).required();

module.exports = { ConfigSchema };
```

### Configuration Loader

**File**: `src/infrastructure/config-loader.js`
```javascript
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { ConfigSchema } = require('../../config/schema');

/**
 * Configuration Loader
 * Loads, validates, and merges configuration from multiple sources
 */
class ConfigLoader {
  constructor() {
    this.config = null;
  }

  /**
   * Load configuration
   */
  load() {
    // 1. Load environment variables
    dotenv.config();

    // 2. Load config file based on NODE_ENV
    const env = process.env.NODE_ENV || 'development';
    const configPath = path.join(__dirname, '../../config', `${env}.json`);

    let fileConfig = {};
    if (fs.existsSync(configPath)) {
      fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }

    // 3. Merge with environment variables (env vars take precedence)
    const config = this.mergeWithEnv(fileConfig);

    // 4. Validate
    const { error, value } = ConfigSchema.validate(config, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      throw new Error(`Configuration validation failed: ${error.message}`);
    }

    // 5. Freeze (make immutable)
    this.config = Object.freeze(this.deepFreeze(value));

    return this.config;
  }

  /**
   * Merge file config with environment variables
   * @private
   */
  mergeWithEnv(fileConfig) {
    return {
      env: process.env.NODE_ENV || fileConfig.env,
      server: {
        port: parseInt(process.env.PORT) || fileConfig.server?.port,
        host: process.env.HOST || fileConfig.server?.host,
        cors: fileConfig.server?.cors
      },
      database: {
        type: process.env.DB_TYPE || fileConfig.database?.type,
        path: process.env.DB_PATH || fileConfig.database?.path,
        host: process.env.DB_HOST || fileConfig.database?.host,
        port: parseInt(process.env.DB_PORT) || fileConfig.database?.port,
        database: process.env.DB_NAME || fileConfig.database?.database,
        poolSize: parseInt(process.env.DB_POOL_SIZE) || fileConfig.database?.poolSize
      },
      cache: fileConfig.cache,
      logging: {
        level: process.env.LOG_LEVEL || fileConfig.logging?.level,
        format: process.env.LOG_FORMAT || fileConfig.logging?.format,
        destination: process.env.LOG_DEST || fileConfig.logging?.destination
      },
      features: fileConfig.features,
      secrets: {
        jwtSecret: process.env.JWT_SECRET || fileConfig.secrets?.jwtSecret,
        githubToken: process.env.GITHUB_TOKEN || fileConfig.secrets?.githubToken
      }
    };
  }

  /**
   * Deep freeze object
   * @private
   */
  deepFreeze(obj) {
    Object.freeze(obj);

    Object.getOwnPropertyNames(obj).forEach(prop => {
      if (obj[prop] !== null &&
          (typeof obj[prop] === 'object' || typeof obj[prop] === 'function') &&
          !Object.isFrozen(obj[prop])) {
        this.deepFreeze(obj[prop]);
      }
    });

    return obj;
  }

  /**
   * Get configuration value by path
   */
  get(path) {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }

    const keys = path.split('.');
    let value = this.config;

    for (const key of keys) {
      value = value[key];
      if (value === undefined) {
        return undefined;
      }
    }

    return value;
  }
}

// Singleton instance
const configLoader = new ConfigLoader();

module.exports = { configLoader };
```

## Lookup Tables

### Status Display Names

**File**: `src/presentation/lookup-tables.js`
```javascript
/**
 * Lookup Tables - Display strings, icons, colors
 */

// Status → Display Name
const StatusDisplayNames = Object.freeze({
  'planned': 'Planned',
  'in-progress': 'In Progress',
  'completed': 'Completed',
  'blocked': 'Blocked'
});

// Status → Icon (emoji or CSS class)
const StatusIcons = Object.freeze({
  'planned': '📋',
  'in-progress': '🔄',
  'completed': '✅',
  'blocked': '🚫'
});

// Status → Color
const StatusColors = Object.freeze({
  'planned': '#6B7280',     // Gray
  'in-progress': '#3B82F6', // Blue
  'completed': '#10B981',   // Green
  'blocked': '#EF4444'      // Red
});

// Progress → Label
const ProgressLabels = Object.freeze({
  0: 'Not Started',
  1: 'Just Started',
  25: 'Quarter Done',
  50: 'Half Done',
  75: 'Almost Done',
  100: 'Complete'
});

// Event Type → Human Readable
const EventTypeLabels = Object.freeze({
  'WorkEffortStarted': 'Started',
  'ProgressUpdated': 'Progress Updated',
  'WorkEffortCompleted': 'Completed',
  'WorkEffortBlocked': 'Blocked',
  'WorkEffortUnblocked': 'Unblocked',
  'TicketCreated': 'Ticket Created',
  'TicketCompleted': 'Ticket Completed'
});

// HTTP Status → Message
const HTTPStatusMessages = Object.freeze({
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable'
});

// Mime Type → Extension
const MimeTypeExtensions = Object.freeze({
  'text/markdown': '.md',
  'application/json': '.json',
  'text/plain': '.txt',
  'application/pdf': '.pdf'
});

module.exports = {
  StatusDisplayNames,
  StatusIcons,
  StatusColors,
  ProgressLabels,
  EventTypeLabels,
  HTTPStatusMessages,
  MimeTypeExtensions
};
```

### Conversion Tables

**File**: `src/domain/conversions.js`
```javascript
/**
 * Conversion Tables - Unit conversions, mappings
 */

// Duration → Human Readable
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

// Bytes → Human Readable
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

// ISO Date → Human Readable
function formatDate(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now - date;

  if (diff < 60 * 1000) return 'just now';
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60 / 1000)}m ago`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 60 / 60 / 1000)}h ago`;
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / 24 / 60 / 60 / 1000)}d ago`;

  return date.toLocaleDateString();
}

module.exports = {
  formatDuration,
  formatBytes,
  formatDate
};
```

## Usage Examples

```javascript
const { WorkEffortStatus, ValidationRules } = require('./domain/constants');
const { configLoader } = require('./infrastructure/config-loader');
const { StatusColors } = require('./presentation/lookup-tables');

// Load configuration
const config = configLoader.load();

// Use constants
if (workEffort.status === WorkEffortStatus.COMPLETED) {
  console.log('Work effort is complete!');
}

// Validate using constants
if (title.length > ValidationRules.WORK_EFFORT_TITLE_MAX_LENGTH) {
  throw new Error('Title too long');
}

// Use configuration
const port = config.server.port;
const dbPath = config.database.path;

// Use lookup tables
const color = StatusColors[workEffort.status];
const displayName = StatusDisplayNames[workEffort.status];
```

---

**Next**: [Event Loops & Queues](../queues/README.md)
