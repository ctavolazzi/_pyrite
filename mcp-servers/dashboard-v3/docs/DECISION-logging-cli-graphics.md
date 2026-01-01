# Decision: Structured Logging and CLI Graphics

**Date:** 2025-12-28
**Status:** Accepted
**Deciders:** Development Team

## Context

The Mission Control dashboard server has approximately 50 `console.log`, `console.error`, and `console.warn` calls across 7 files. The current logging approach has several limitations:

1. **No log levels** - Cannot filter info vs debug vs error messages
2. **Unstructured output** - Plain text, not parseable in production
3. **No context** - Missing timestamps, request IDs, or structured data
4. **Plain CLI output** - Server startup banner has ASCII art but no colors

### Audit Results

| File | console.* calls | Purpose |
|------|-----------------|---------|
| server.js | ~30 | Startup, API requests, WebSocket events |
| lib/watcher.js | ~5 | File change detection |
| lib/parser.js | ~3 | Parse errors |
| public/*.js | ~12 | Browser debugging (out of scope) |

## Decision

1. **Add `pino`** for structured JSON logging on the server
2. **Add `chalk`** for colored CLI output in startup banner
3. **Keep `console.log`** in client-side (browser) code

## Rationale

### Why pino?

| Library | Bundle Size | Performance | JSON Output | Log Levels |
|---------|-------------|-------------|-------------|------------|
| **pino** | 45KB | Fastest | ✅ Native | ✅ 6 levels |
| winston | 200KB+ | Slower | ✅ Plugin | ✅ 8 levels |
| bunyan | 150KB | Medium | ✅ Native | ✅ 6 levels |
| console | 0KB | Fast | ❌ Text only | ❌ None |

Pino was chosen because:
- **Performance**: 5x faster than winston in benchmarks
- **Simplicity**: Minimal API surface
- **Size**: Smallest footprint among structured loggers
- **Output**: JSON by default, ideal for log aggregation

### Why chalk?

| Library | Size | API | Terminal Support |
|---------|------|-----|------------------|
| **chalk** | 12KB | Simple | ✅ Full 256 colors |
| colors | 8KB | Prototype pollution risk | ⚠️ Deprecated |
| ansi-colors | 6KB | Similar to chalk | ✅ Good |
| kleur | 4KB | Minimal | ✅ Basic |

Chalk was chosen because:
- **Safety**: No prototype pollution (unlike `colors`)
- **API**: Clean, chainable syntax
- **Adoption**: Most popular, well-maintained
- **Features**: Supports 256 colors, template literals

## Consequences

### Positive

- Log output is structured JSON, enabling:
  - Log aggregation (ELK, Loki, CloudWatch)
  - Filtering by level (DEBUG, INFO, WARN, ERROR)
  - Parsing for metrics/alerting
- Server startup is visually clearer with colored status
- Development experience improved with `pino-pretty`

### Negative

- Two new dependencies (~60KB total)
- Existing `console.log` calls need refactoring
- Developers must learn pino API (minimal learning curve)

### Neutral

- Client-side logging unchanged
- No breaking changes to external API

## Implementation

### Logger Configuration

```javascript
// lib/logger.js
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined
});

export default logger;
```

### Log Level Mapping

| Previous | New | When to Use |
|----------|-----|-------------|
| `console.log()` | `logger.info()` | Normal operations |
| `console.error()` | `logger.error()` | Exceptions, failures |
| `console.warn()` | `logger.warn()` | Deprecated usage, recoverable issues |
| (none) | `logger.debug()` | Verbose debugging (off by default) |

### CLI Output

The startup banner uses `chalk` directly (not through pino) since it's decorative output, not a log message:

```javascript
import chalk from 'chalk';

console.log(chalk.cyan(`
  ╔══════════════════════════════════════════════╗
  ║  ${chalk.bold('Mission Control Dashboard')}              ║
  ║  Local: ${chalk.green(`http://localhost:${port}`)}         ║
  ╚══════════════════════════════════════════════╝
`));
```

## Alternatives Considered

### 1. Winston

Rejected because:
- Larger bundle size (200KB+)
- More complex configuration
- Slower performance

### 2. No Change

Rejected because:
- Cannot filter logs by level
- Cannot parse logs for monitoring
- No structured context for debugging

### 3. Custom Logger

Rejected because:
- Reinventing the wheel
- Maintenance burden
- Missing features (child loggers, serializers)

## References

- [pino documentation](https://getpino.io/)
- [chalk documentation](https://github.com/chalk/chalk)
- [Node.js logging best practices](https://github.com/goldbergyoni/nodebestpractices#2-error-handling-practices)

