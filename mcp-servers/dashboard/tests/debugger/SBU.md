# Safety and Basic Use (SBU) - The Oracle

**"I need to consult The Oracle"** - Here's how to do it safely.

## Safety First

### ⚠️ What NOT to Do

1. **Don't run on production** - Always test on local/dev first
2. **Don't modify source code** - The Oracle reads, it doesn't write
3. **Don't delete test results** - They're stored for learning
4. **Don't run without PocketBase** - Will fail gracefully, but won't store results
5. **Don't test while server is restarting** - Wait for stable connection

### ✅ Safe Practices

1. **Test on localhost first** - `http://localhost:3848`
2. **Use read-only mode** - The Oracle doesn't modify your code
3. **Backup before testing** - Just in case (though it's read-only)
4. **Start with one component** - Don't test everything at once initially
5. **Monitor PocketBase** - Make sure it's running and accessible

### 🛡️ What The Oracle Does

- ✅ Reads DOM structure
- ✅ Analyzes CSS properties
- ✅ Tests component interactions
- ✅ Captures screenshots
- ✅ Stores results in PocketBase
- ✅ Generates reports

### 🚫 What The Oracle Does NOT Do

- ❌ Modify your code
- ❌ Delete files
- ❌ Change component state permanently
- ❌ Break your application
- ❌ Access external APIs (unless configured)

## Basic Use

### Prerequisites

1. **PocketBase running:**
   ```bash
   ./pocketbase serve
   # Should be at http://127.0.0.1:8090
   ```

2. **Dashboard server running:**
   ```bash
   cd mcp-servers/dashboard-v3
   npm start
   # Should be at http://localhost:3848
   ```

3. **Dependencies installed:**
   ```bash
   npm install
   ```

### Quick Start

```javascript
import { TheOracle } from './tests/debugger/TheOracle.js';

// "I need to consult The Oracle"
const oracle = new TheOracle({
  pocketbaseUrl: 'http://127.0.0.1:8090',
  pocketbaseAdminEmail: 'admin@example.com',
  pocketbaseAdminPassword: 'your-password',
  targetUrl: 'http://localhost:3848'
});

// Initialize
await oracle.initialize();

// Run tests
const results = await oracle.run();

// Check results
console.log(`Found ${results.bugs.length} bugs`);
```

### Using NPM Scripts

```bash
# Run The Oracle
npm run test:oracle

# Watch mode (re-runs on changes)
npm run test:oracle:watch

# Test specific component
npm run test:oracle:component
```

### Configuration

Create `oracle.config.js` from `oracle.config.example.js`:

```javascript
export const oracleConfig = {
  pocketbase: {
    url: 'http://127.0.0.1:8090',
    adminEmail: 'admin@example.com',
    adminPassword: 'your-password'
  },
  target: {
    url: 'http://localhost:3848'
  }
};
```

## Common Issues

### PocketBase Connection Failed

**Error:** `Failed to connect to PocketBase`

**Fix:**
1. Check PocketBase is running: `./pocketbase serve`
2. Verify URL: `http://127.0.0.1:8090`
3. Check credentials in config

### Dashboard Not Accessible

**Error:** `Cannot connect to target URL`

**Fix:**
1. Start dashboard: `npm start` in `mcp-servers/dashboard-v3`
2. Verify URL: `http://localhost:3848`
3. Check firewall/port conflicts

### No Components Found

**Error:** `Found 0 components`

**Fix:**
1. Verify page loaded correctly
2. Check browser console for errors
3. Verify discovery selectors in config

### Tests Timing Out

**Error:** `Test timeout`

**Fix:**
1. Increase timeout in config
2. Check if page is slow to load
3. Verify network connectivity

## Best Practices

### 1. Start Small

```javascript
// Test just one component first
const components = await oracle.discovery.discoverAll();
const firstComponent = components[0];
await oracle.agents.component.test(firstComponent);
```

### 2. Check Results Regularly

```javascript
const results = await oracle.run();
if (results.bugs.length > 0) {
  console.log('Bugs found:', results.bugs);
}
```

### 3. Use PocketBase Admin UI

- View test results: `http://127.0.0.1:8090/_/`
- Check collections: `debug_sessions`, `component_tests`, `bug_reports`
- Review learned patterns: `learned_patterns`

### 4. Monitor Performance

```javascript
// Check test duration
console.log(`Tests took ${results.duration}ms`);

// Check component count
console.log(`Tested ${results.components.length} components`);
```

## Emergency Stop

If something goes wrong:

1. **Stop The Oracle:**
   ```javascript
   // If running in code
   process.exit(1);
   ```

2. **Stop PocketBase:**
   ```bash
   # Ctrl+C in PocketBase terminal
   ```

3. **Stop Dashboard:**
   ```bash
   # Ctrl+C in dashboard terminal
   ```

4. **Check Logs:**
   ```bash
   # Check component-results/logs/
   cat tests/component-results/logs/oracle.log
   ```

## Safety Guarantees

✅ **Read-only:** The Oracle never modifies your code
✅ **Isolated:** Tests run in separate browser context
✅ **Reversible:** All changes are in test results, not source
✅ **Logged:** Everything is logged for audit trail
✅ **Graceful:** Fails gracefully, doesn't crash your app

## Getting Help

1. **Check logs:** `tests/component-results/logs/`
2. **Check PocketBase:** `http://127.0.0.1:8090/_/`
3. **Check documentation:** `README.md`
4. **Check examples:** `examples/basic-usage.js`

## Quick Reference

```javascript
// Initialize
const oracle = new TheOracle(config);
await oracle.initialize();

// Run all tests
const results = await oracle.run();

// Access results
results.components      // All components found
results.testResults    // All test results
results.bugs          // All bugs found
results.patterns      // Learned patterns
results.report        // Generated report
```

---

**"I need to consult The Oracle"** - Now you know how to do it safely! 🔴

