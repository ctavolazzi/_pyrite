# Core Architecture - Minimal Viable Plan

## The Simplest Thing That Could Work

**Read Operations:**

- Scan `_work_efforts/` directory
- Parse markdown files
- Return results
- **That's it.** O(n) but fast enough for most cases.

**Write Operations:**

- Write file directly
- Git commit with retry logic (if lock fails, wait 100ms, retry)
- **That's it.** No queue, just retry on failure.

## Why This Is Better

**No premature optimization:**

- Don't build a queue until git locks become a real problem
- Don't build an index until lookups become slow
- Measure first, optimize later

**Simpler codebase:**

- No SQLite dependency
- No queue system
- No mode switching
- Just: read files, write files, handle errors

**Actually works:**

- File system is fast enough for < 1000 items
- Git's built-in locking works fine with retry
- Can always add complexity later if needed

## Implementation

### Phase 1: Basic File Operations

**Files to Create:**

- `core/WorkEffortManager.js` - Simple read/write operations

**Operations:**

```javascript
// Read
async getWorkEffort(id) {
  const dirs = await fs.readdir('_work_efforts/');
  for (const dir of dirs) {
    if (dir.startsWith(`WE-${id}`)) {
      const content = await fs.readFile(`${dir}/WE-${id}_index.md`);
      return parseWorkEffort(content);
    }
  }
  return null;
}

// Write
async createWorkEffort(data) {
  const id = generateId();
  const path = `_work_efforts/WE-${id}_${slug}/`;
  await fs.mkdir(path, { recursive: true });
  await fs.writeFile(`${path}WE-${id}_index.md`, generateContent(data));

  // Git commit with retry
  await gitCommitWithRetry(path, `WE-${id}: ${data.title}`);
}
```

**Git Retry Logic:**

```javascript
async function gitCommitWithRetry(path, message, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await exec(`git add ${path}`);
      await exec(`git commit -m "${message}"`);
      return;
    } catch (error) {
      if (error.message.includes('index.lock') && i < maxRetries - 1) {
        await sleep(100 * (i + 1)); // Exponential backoff
        continue;
      }
      throw error;
    }
  }
}
```



### Phase 2: Add Complexity Only If Needed

**If lookups become slow:**

- Add in-memory index (rebuild on startup)
- Still no SQLite, just a Map in memory

**If git locks become frequent:**

- Add simple retry queue (not full job system)
- Just a list of operations to retry

**If scale becomes huge:**

- Then consider SQLite index
- Then consider full queue system

## When to Add What

| Problem | Solution | When |

|---------|----------|------|

| Lookups slow | In-memory index | > 500 items |

| Git locks frequent | Simple retry queue | > 10 failures/hour |

| Scale huge | SQLite index | > 2000 items |

| Need transactions | Full queue system | Complex workflows |

## Success Criteria

- ✅ Can read work efforts
- ✅ Can write work efforts
- ✅ Git commits work (with retry)
- ✅ Handles errors gracefully
- ✅ Simple, maintainable code

## Dependencies

- `fs/promises` - File system
- `child_process` - Git commands
- `gray-matter` - YAML parsing (already in use)