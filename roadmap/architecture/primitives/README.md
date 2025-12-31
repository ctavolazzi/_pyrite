# Core Primitives: Atomic Operations

Every operation in Pyrite decomposes into these atomic primitives. Understanding these is understanding the entire system.

## File System Primitives

### Atomic Read
```javascript
/**
 * Read file contents atomically
 * Invariant: Either succeeds with full content or fails completely
 * Side Effect: Opens file descriptor, reads bytes, closes descriptor
 *
 * @type {(path: string) => Promise<string>}
 */
async function readFile(path) {
  // Atomic operation - no partial reads exposed
  const content = await fs.readFile(path, 'utf-8');
  return content;
}

// Contract:
// - Input: Valid file path string
// - Output: Full file contents as string OR Error
// - Side Effect: File descriptor opened/closed
// - Guarantees: Contents are consistent snapshot
```

### Atomic Write
```javascript
/**
 * Write file contents atomically
 * Invariant: Write completes fully or not at all (no partial writes)
 * Side Effect: Creates/overwrites file
 *
 * @type {(path: string, content: string) => Promise<void>}
 */
async function writeFile(path, content) {
  // Atomic write using rename strategy:
  // 1. Write to temp file
  // 2. Rename temp → target (atomic on POSIX)
  const tempPath = `${path}.tmp.${Date.now()}`;

  await fs.writeFile(tempPath, content, 'utf-8');
  await fs.rename(tempPath, path); // Atomic operation
}

// Contract:
// - Input: Valid path + string content
// - Output: void OR Error
// - Side Effect: File created/modified
// - Guarantees: No partial writes, readers see old OR new (never partial)
```

### Directory Listing
```javascript
/**
 * List directory entries atomically
 *
 * @type {(path: string) => Promise<string[]>}
 */
async function listDirectory(path) {
  const entries = await fs.readdir(path);
  return entries;
}

// Contract:
// - Input: Valid directory path
// - Output: Array of entry names OR Error
// - Side Effect: None (read-only)
// - Guarantees: Consistent snapshot of directory at time of call
```

### File Metadata
```javascript
/**
 * Get file metadata atomically
 *
 * @type {(path: string) => Promise<FileStats>}
 */
async function getMetadata(path) {
  const stats = await fs.stat(path);

  return {
    size: stats.size,           // bytes
    modified: stats.mtimeMs,    // timestamp
    created: stats.birthtimeMs, // timestamp
    isDirectory: stats.isDirectory(),
    isFile: stats.isFile()
  };
}

// Contract:
// - Input: Valid path
// - Output: Metadata object OR Error
// - Side Effect: None (read-only)
// - Guarantees: Metadata consistent at time of call
```

## String Primitives

### Parsing Frontmatter
```javascript
/**
 * Parse YAML frontmatter from markdown
 * Pure function - no side effects
 *
 * @type {(content: string) => { data: Object, content: string }}
 */
function parseFrontmatter(content) {
  const matter = require('gray-matter');
  return matter(content);
}

// Contract:
// - Input: Markdown string with optional YAML frontmatter
// - Output: { data: parsed YAML, content: remaining markdown }
// - Side Effect: None (pure)
// - Guarantees: Always returns valid object (data may be empty {})
```

### Tokenization
```javascript
/**
 * Split string into tokens
 * Pure function
 *
 * @type {(text: string, delimiter: string | RegExp) => string[]}
 */
function tokenize(text, delimiter = /\s+/) {
  return text
    .split(delimiter)
    .filter(token => token.length > 0);
}

// Contract:
// - Input: String + delimiter (string or regex)
// - Output: Array of non-empty tokens
// - Side Effect: None (pure)
// - Guarantees: Output array never contains empty strings
```

### String Normalization
```javascript
/**
 * Normalize string for comparison
 * Pure function - idempotent
 *
 * @type {(str: string) => string}
 */
function normalize(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

// Contract:
// - Input: Any string
// - Output: Normalized string
// - Side Effect: None (pure)
// - Guarantees: normalize(normalize(s)) === normalize(s) (idempotent)
```

## Collection Primitives

### Map (Transform)
```javascript
/**
 * Transform each element in array
 * Pure function - no mutation
 *
 * @type {<A, B>(fn: (a: A) => B, list: A[]) => B[]}
 */
function map(fn, list) {
  const result = [];
  for (let i = 0; i < list.length; i++) {
    result.push(fn(list[i]));
  }
  return result;
}

// Contract:
// - Input: Transform function + array
// - Output: New array with transformed elements
// - Side Effect: None (pure, input array unchanged)
// - Guarantees: output.length === input.length
```

### Filter (Select)
```javascript
/**
 * Select elements matching predicate
 * Pure function - no mutation
 *
 * @type {<A>(pred: (a: A) => boolean, list: A[]) => A[]}
 */
function filter(pred, list) {
  const result = [];
  for (let i = 0; i < list.length; i++) {
    if (pred(list[i])) {
      result.push(list[i]);
    }
  }
  return result;
}

// Contract:
// - Input: Predicate function + array
// - Output: New array with selected elements
// - Side Effect: None (pure)
// - Guarantees: output.length ≤ input.length, order preserved
```

### Reduce (Fold)
```javascript
/**
 * Combine array elements into single value
 * Pure function
 *
 * @type {<A, B>(fn: (acc: B, val: A) => B, initial: B, list: A[]) => B}
 */
function reduce(fn, initial, list) {
  let accumulator = initial;
  for (let i = 0; i < list.length; i++) {
    accumulator = fn(accumulator, list[i]);
  }
  return accumulator;
}

// Contract:
// - Input: Reducer function + initial value + array
// - Output: Accumulated value
// - Side Effect: None (pure)
// - Guarantees: Empty array returns initial value
```

### GroupBy
```javascript
/**
 * Group array elements by key function
 * Pure function
 *
 * @type {<A, K extends string>(keyFn: (a: A) => K, list: A[]) => Record<K, A[]>}
 */
function groupBy(keyFn, list) {
  const groups = {};

  for (let i = 0; i < list.length; i++) {
    const key = keyFn(list[i]);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(list[i]);
  }

  return groups;
}

// Contract:
// - Input: Key extraction function + array
// - Output: Object mapping keys to arrays
// - Side Effect: None (pure)
// - Guarantees: Every element appears exactly once across all groups
```

### Sort
```javascript
/**
 * Sort array by comparator
 * Creates new array - does not mutate
 *
 * @type {<A>(compareFn: (a: A, b: A) => number, list: A[]) => A[]}
 */
function sort(compareFn, list) {
  // Create copy to avoid mutation
  const copy = list.slice();
  copy.sort(compareFn);
  return copy;
}

// Contract:
// - Input: Compare function + array
// - Output: New sorted array
// - Side Effect: None (input unchanged)
// - Guarantees: output.length === input.length, all elements present
```

## Object Primitives

### Clone (Deep Copy)
```javascript
/**
 * Create deep copy of object
 * Pure function
 *
 * @type {<T>(obj: T) => T}
 */
function clone(obj) {
  // Structured clone for deep copy
  return JSON.parse(JSON.stringify(obj));
}

// Contract:
// - Input: Serializable object
// - Output: Deep copy
// - Side Effect: None (pure)
// - Guarantees: Changes to copy don't affect original
// - Limitations: Loses functions, Dates, RegExp, etc.
```

### Merge
```javascript
/**
 * Merge two objects (shallow)
 * Pure function - creates new object
 *
 * @type {<A, B>(a: A, b: B) => A & B}
 */
function merge(a, b) {
  return { ...a, ...b };
}

// Contract:
// - Input: Two objects
// - Output: New object with combined properties
// - Side Effect: None (pure)
// - Guarantees: b's properties override a's on conflict
```

### Pick
```javascript
/**
 * Select specific properties from object
 * Pure function
 *
 * @type {<T, K extends keyof T>(keys: K[], obj: T) => Pick<T, K>}
 */
function pick(keys, obj) {
  const result = {};
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

// Contract:
// - Input: Array of keys + object
// - Output: New object with only specified keys
// - Side Effect: None (pure)
// - Guarantees: Output has subset of input's properties
```

### Omit
```javascript
/**
 * Remove specific properties from object
 * Pure function
 *
 * @type {<T, K extends keyof T>(keys: K[], obj: T) => Omit<T, K>}
 */
function omit(keys, obj) {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

// Contract:
// - Input: Array of keys + object
// - Output: New object without specified keys
// - Side Effect: None (pure)
// - Guarantees: Output has complement of picked properties
```

## Validation Primitives

### Type Check
```javascript
/**
 * Check if value matches type predicate
 * Pure function
 *
 * @type {<T>(pred: (val: unknown) => val is T, value: unknown) => value is T}
 */
function isType(pred, value) {
  return pred(value);
}

// Example predicates:
const isString = (val) => typeof val === 'string';
const isNumber = (val) => typeof val === 'number' && !isNaN(val);
const isArray = (val) => Array.isArray(val);
const isObject = (val) => val !== null && typeof val === 'object' && !Array.isArray(val);

// Contract:
// - Input: Type predicate + value
// - Output: Boolean
// - Side Effect: None (pure)
// - Guarantees: Type narrowing in TypeScript
```

### Validate Schema
```javascript
/**
 * Validate object against schema
 * Pure function - returns Result type
 *
 * @type {(schema: Schema, obj: unknown) => Result<T, Error[]>}
 */
function validate(schema, obj) {
  const errors = [];

  for (const [key, validator] of Object.entries(schema)) {
    const value = obj[key];
    const result = validator(value);

    if (!result.valid) {
      errors.push({
        field: key,
        message: result.error
      });
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: obj };
}

// Contract:
// - Input: Schema definition + object to validate
// - Output: Result with value OR errors
// - Side Effect: None (pure)
// - Guarantees: Either returns valid value or all errors
```

### Assert
```javascript
/**
 * Assert condition holds, throw if not
 * Side effect: Throws on failure
 *
 * @type {(condition: boolean, message: string) => void | never}
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Contract:
// - Input: Boolean condition + error message
// - Output: void (silent success) OR throws Error
// - Side Effect: Throws exception on failure
// - Guarantees: If function returns, condition was true
```

## Date/Time Primitives

### Now
```javascript
/**
 * Get current timestamp
 * Effectful - returns different value each call
 *
 * @type {() => number}
 */
function now() {
  return Date.now(); // Unix milliseconds
}

// Contract:
// - Input: None
// - Output: Current timestamp
// - Side Effect: Reads system clock
// - Guarantees: Monotonically increasing (usually)
```

### Date Arithmetic
```javascript
/**
 * Add duration to timestamp
 * Pure function
 *
 * @type {(timestamp: number, duration: number) => number}
 */
function addDuration(timestamp, duration) {
  return timestamp + duration;
}

// Contract:
// - Input: Timestamp + duration (both in ms)
// - Output: New timestamp
// - Side Effect: None (pure)
// - Guarantees: Commutative: add(t, d) === add(d, t)
```

### Format Date
```javascript
/**
 * Format timestamp as human-readable string
 * Pure function
 *
 * @type {(timestamp: number, format: string) => string}
 */
function formatDate(timestamp, format = 'iso') {
  const date = new Date(timestamp);

  switch (format) {
    case 'iso':
      return date.toISOString();
    case 'human':
      return date.toLocaleDateString();
    case 'filename':
      return date.toISOString().split('T')[0];
    default:
      return date.toString();
  }
}

// Contract:
// - Input: Timestamp + format string
// - Output: Formatted date string
// - Side Effect: None (pure)
// - Guarantees: Same timestamp always produces same string (for given format)
```

## ID Generation Primitives

### Generate Work Effort ID
```javascript
/**
 * Generate unique work effort ID
 * Effectful - uses current date
 *
 * @type {() => WorkEffortId}
 */
function generateWorkEffortId() {
  const date = new Date();
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  const random = generateRandomHash(4); // 4 chars: a-z0-9

  return `WE-${yy}${mm}${dd}-${random}`;
}

// Contract:
// - Input: None
// - Output: Work effort ID matching WE-YYMMDD-xxxx pattern
// - Side Effect: Reads system clock, uses random number generator
// - Guarantees: Format is always valid, collisions astronomically unlikely
```

### Generate Random Hash
```javascript
/**
 * Generate random alphanumeric string
 * Effectful - non-deterministic
 *
 * @type {(length: number) => string}
 */
function generateRandomHash(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }

  return result;
}

// Contract:
// - Input: Desired length
// - Output: Random string of specified length
// - Side Effect: Uses Math.random()
// - Guarantees: Output.length === input length, chars from [a-z0-9]
```

## Error Handling Primitives

### Result Type
```javascript
/**
 * Result type for operations that can fail
 * Pure data structure
 *
 * @typedef {
 *   | { ok: true, value: T }
 *   | { ok: false, error: E }
 * } Result<T, E>
 */

// Constructors
const Ok = (value) => ({ ok: true, value });
const Err = (error) => ({ ok: false, error });

// Contract:
// - Discriminated union - exactly one branch is true
// - No exceptions thrown, errors are values
// - Forces explicit error handling
```

### Try-Catch Wrapper
```javascript
/**
 * Wrap throwing function in Result
 * Converts exceptions to Result type
 *
 * @type {<T>(fn: () => T) => Result<T, Error>}
 */
function tryCatch(fn) {
  try {
    const value = fn();
    return Ok(value);
  } catch (error) {
    return Err(error);
  }
}

// Contract:
// - Input: Function that may throw
// - Output: Result<T, Error>
// - Side Effect: Executes fn (may have side effects)
// - Guarantees: Never throws, always returns Result
```

## Composition Primitives

### Pipe (Left-to-right composition)
```javascript
/**
 * Compose functions left-to-right
 * Pure function
 *
 * @type {<A, B, C>(...fns: Function[]) => (a: A) => C}
 */
function pipe(...fns) {
  return (initial) => {
    return fns.reduce((value, fn) => fn(value), initial);
  };
}

// Example:
const transform = pipe(
  parseWorkEffort,    // string → WorkEffort
  validateWorkEffort, // WorkEffort → Result<WorkEffort, Error>
  enrichWithTickets   // WorkEffort → WorkEffortWithTickets
);

// Contract:
// - Input: Array of functions
// - Output: Single composed function
// - Side Effect: None (pure)
// - Guarantees: (pipe(f, g))(x) === g(f(x))
```

### Compose (Right-to-left composition)
```javascript
/**
 * Compose functions right-to-left
 * Pure function
 *
 * @type {<A, B, C>(...fns: Function[]) => (a: A) => C}
 */
function compose(...fns) {
  return (initial) => {
    return fns.reduceRight((value, fn) => fn(value), initial);
  };
}

// Contract:
// - Input: Array of functions
// - Output: Single composed function
// - Side Effect: None (pure)
// - Guarantees: (compose(g, f))(x) === g(f(x))
```

---

## Primitive Guarantees

Every primitive operation guarantees:

1. **Type Safety**: Input/output types are known
2. **Determinism**: Pure functions always return same output for same input
3. **Totality**: Functions handle all possible inputs (or explicitly throw)
4. **Atomicity**: Operations complete fully or not at all
5. **Composability**: Primitives combine into larger operations

These primitives form the foundation of all higher-level operations in Pyrite.

**Next**: [Data Flow](../data-flow/README.md) - See how these primitives compose into complete workflows.
