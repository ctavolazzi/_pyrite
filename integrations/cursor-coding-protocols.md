# Integration: cursor-coding-protocols

## Overview

This integration connects `_pyrite` with the `cursor-coding-protocols` repository for cross-repo development and testing.

## Repository Location

**Local:** `/Users/ctavolazzi/Code/cursor-coding-protocols`
**GitHub:** `https://github.com/ctavolazzi/cursor-coding-protocols`

## Key Components

### Update System

The update system provides version management, update checking, and rollback capabilities.

| Component | Path | Purpose |
|-----------|------|---------|
| Version Manager | `scripts/version-manager.js` | Core version tracking |
| Update Checker | `scripts/update-checker.js` | GitHub API integration |
| Update Installer | `scripts/update-installer.js` | Download, backup, rollback |

### Test Suite

| Test File | Tests | Status |
|-----------|-------|--------|
| `tests/update-system.test.js` | 17 | ✅ All Passing |
| `tests/version-manager-security.test.js` | 18 | ✅ All Passing |
| `tests/work-efforts-server.test.js` | 5 | ✅ All Passing |

### MCP Servers

- **work-efforts** - Johnny Decimal task tracking
- **simple-tools** - Utility functions (random names, IDs, dates)

## Integration Points

### Running Tests from _pyrite

```bash
# Run update system tests
cd /Users/ctavolazzi/Code/cursor-coding-protocols
node tests/update-system.test.js

# Run all tests
for test in tests/*.test.js; do node "$test"; done
```

### Linking Work Efforts

Work efforts in `_pyrite` can reference cursor-coding-protocols issues:

```markdown
## Related
- cursor-coding-protocols: Issue #XX
- cursor-coding-protocols: `tests/update-system.test.js`
```

## Status

- **Integration Created:** 2025-12-21
- **Last Verified:** 2025-12-21
- **Status:** Active
