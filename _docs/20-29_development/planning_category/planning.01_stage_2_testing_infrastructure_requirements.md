---
created: '2025-12-21T19:38:31Z'
id: planning.01
links:
- '[[00.00_index]]'
- '[[planning_category_index]]'
related_work_efforts: []
title: Stage 2 Testing Infrastructure Requirements
updated: '2025-12-21T19:38:31Z'
---

# Stage 2: Testing Infrastructure Requirements

## Overview

Stage 2 involves making the cursor-coding-protocols update system testable with mocked dependencies.

## Current Problem

`update-installer.js` has hardcoded dependencies that cannot be mocked:

```javascript
// Current implementation - NOT testable
const { execSync } = require('child_process');
execSync(`unzip -q -o "${zipPath}" -d "${this.tmpDir}"`);
```

This means tests would:
- Hit real GitHub API
- Download real files
- Execute real unzip commands

## Required Changes

### 1. Refactor `update-installer.js`

Add dependency injection to constructor:

```javascript
class UpdateInstaller {
  constructor(options = {}) {
    // Existing options
    this.tmpDir = options.tmpDir || os.tmpdir();

    // NEW: Injectable dependencies
    this.downloadFn = options.downloadFn || this._defaultDownload;
    this.extractFn = options.extractFn || this._defaultExtract;
  }

  _defaultDownload(url, destPath) {
    // Current download implementation
  }

  _defaultExtract(zipPath, destDir) {
    execSync(`unzip -q -o "${zipPath}" -d "${destDir}"`);
  }
}
```

### 2. Write Integration Tests

```javascript
// tests/update-installer.test.js
const mockDownload = (url, destPath) => {
  fs.writeFileSync(destPath, 'mock-zip-content');
};

const mockExtract = (zipPath, destDir) => {
  fs.mkdirSync(destDir, { recursive: true });
  fs.writeFileSync(path.join(destDir, 'README.md'), '# Mock');
};

const installer = new UpdateInstaller({
  downloadFn: mockDownload,
  extractFn: mockExtract
});
```

### 3. Test Scenarios

| Scenario | Expected |
|----------|----------|
| check → reports version | JSON with currentVersion |
| install → downloads | Calls downloadFn |
| install → extracts | Calls extractFn |
| rollback → restores | Backup applied |

## Files to Modify

1. `scripts/update-installer.js` - Add DI
2. `scripts/update-checker.js` - Add DI for fetch
3. `tests/update-installer.test.js` - New test file

## Estimated Effort

- Refactoring: 2-3 hours
- Tests: 2-3 hours
- Documentation: 1 hour

## Dependencies

- No external dependencies needed
- Node.js built-in mocking sufficient

## Success Criteria

- [x] update-installer.js accepts custom download/extract functions
- [x] Tests run without network access
- [x] Tests run without unzip command
- [x] 80%+ code coverage on update system (16 mocked + 17 existing = 33 tests)

## Implementation Complete (2025-12-21)

**Files Modified:**
- `scripts/update-installer.js` - Added `downloadFn` and `extractFn` DI
- `scripts/update-checker.js` - Added `fetchFn` DI
- `tests/update-installer-mocked.test.js` - New file with 16 mocked tests

**Test Results:**
- Mocked tests: 16/16 passed
- Existing tests: 17/17 passed