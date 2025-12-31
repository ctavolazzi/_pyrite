# Data Flow Architecture

**How data moves through the Pyrite system, from file system to UI and back.**

## Fundamental Data Flow Pattern

All data in Pyrite follows this unidirectional flow:

```
File System → Repository → Domain → Application → API → UI
     ↑                                                    ↓
     └────────────────────────────────────────────────────┘
                   (Commands flow back)
```

## Read Path: File → UI

### Step-by-Step Data Transformation

```
1. Raw Bytes (File System)
   ↓ fs.readFile()

2. UTF-8 String
   ↓ gray-matter.parse()

3. { data: Object, content: string }
   ↓ WorkEffort.fromJSON()

4. WorkEffort Entity (Domain)
   ↓ repository.findAll()

5. WorkEffort[] (Collection)
   ↓ useCase.execute()

6. DTO (Data Transfer Object)
   ↓ res.json()

7. JSON over HTTP
   ↓ fetch() in browser

8. JavaScript Object
   ↓ render()

9. DOM Elements (UI)
```

### Detailed Example: Loading Work Efforts

**Step 1: File System Read**
```javascript
// Input: File path
// Output: UTF-8 string
const content = await fs.readFile(
  '_work_efforts/WE-251231-a1b2_test_feature/WE-251231-a1b2_index.md',
  'utf-8'
);

// content = `---
// id: WE-251231-a1b2
// title: Test Feature
// status: in-progress
// progress: 60
// created: 2025-12-31T00:00:00.000Z
// ---
//
// Build a test feature for the dashboard.`
```

**Step 2: Parse Frontmatter**
```javascript
// Input: UTF-8 string with YAML frontmatter
// Output: Structured object
const parsed = matter(content);

// parsed = {
//   data: {
//     id: 'WE-251231-a1b2',
//     title: 'Test Feature',
//     status: 'in-progress',
//     progress: 60,
//     created: '2025-12-31T00:00:00.000Z'
//   },
//   content: 'Build a test feature for the dashboard.'
// }
```

**Step 3: Create Domain Entity**
```javascript
// Input: Parsed object
// Output: WorkEffort domain entity
const workEffort = new WorkEffort({
  id: parsed.data.id,
  title: parsed.data.title,
  status: parsed.data.status,
  progress: parsed.data.progress,
  created: new Date(parsed.data.created),
  description: parsed.content.trim()
});

// workEffort = WorkEffort {
//   id: 'WE-251231-a1b2',  // immutable
//   title: 'Test Feature',
//   status: 'in-progress',
//   progress: 60,
//   created: Date(2025-12-31),
//   description: 'Build a test feature for the dashboard.',
//   tickets: [],
//   events: []
// }
```

**Step 4: Repository Returns Collection**
```javascript
// Input: Repository query
// Output: Array of domain entities
const workEfforts = await repository.findAll();

// workEfforts = [
//   WorkEffort { id: 'WE-251231-a1b2', ... },
//   WorkEffort { id: 'WE-251230-c3d4', ... },
//   ...
// ]
```

**Step 5: Application Layer Transforms**
```javascript
// Input: Domain entities
// Output: DTOs (Data Transfer Objects)
const useCase = new ListWorkEfforts(repository);
const result = await useCase.execute({ status: 'in-progress' });

// result = {
//   ok: true,
//   value: {
//     workEfforts: [
//       {
//         id: 'WE-251231-a1b2',
//         title: 'Test Feature',
//         status: 'in-progress',
//         progress: 60,
//         created: '2025-12-31T00:00:00.000Z',
//         ticketCount: 3,
//         completedTickets: 2
//       },
//       ...
//     ],
//     meta: {
//       total: 5,
//       filtered: 2
//     }
//   }
// }
```

**Step 6: API Layer Serializes**
```javascript
// Input: Application layer result
// Output: HTTP response
router.get('/api/work-efforts', async (req, res) => {
  const result = await useCase.execute(req.query);

  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }

  res.json(result.value);
});

// HTTP Response:
// Status: 200
// Content-Type: application/json
// Body: { "workEfforts": [...], "meta": {...} }
```

**Step 7: Browser Fetches**
```javascript
// Input: HTTP request
// Output: JavaScript object
const response = await fetch('/api/work-efforts?status=in-progress');
const data = await response.json();

// data = {
//   workEfforts: [
//     { id: 'WE-251231-a1b2', title: 'Test Feature', ... },
//     ...
//   ],
//   meta: { total: 5, filtered: 2 }
// }
```

**Step 8: UI Renders**
```javascript
// Input: JavaScript object
// Output: DOM elements
function renderWorkEfforts(data) {
  const container = document.getElementById('work-efforts');

  container.innerHTML = data.workEfforts
    .map(we => `
      <div class="work-effort" data-id="${we.id}">
        <h3>${we.title}</h3>
        <div class="progress">
          <div class="progress-bar" style="width: ${we.progress}%"></div>
        </div>
        <span class="status">${we.status}</span>
      </div>
    `)
    .join('');
}

renderWorkEfforts(data);

// DOM Result:
// <div id="work-efforts">
//   <div class="work-effort" data-id="WE-251231-a1b2">
//     <h3>Test Feature</h3>
//     <div class="progress">
//       <div class="progress-bar" style="width: 60%"></div>
//     </div>
//     <span class="status">in-progress</span>
//   </div>
// </div>
```

## Write Path: UI → File

### Step-by-Step Data Transformation

```
1. User Action (Click, Type, etc.)
   ↓ Event Handler

2. Command Object { type, payload }
   ↓ fetch()

3. HTTP Request (JSON)
   ↓ Express Router

4. Validated Input
   ↓ Use Case Handler

5. Domain Entity Update
   ↓ Entity.toJSON()

6. Plain Object
   ↓ Repository.toMarkdown()

7. Markdown String with Frontmatter
   ↓ fs.writeFile()

8. Bytes on Disk
```

### Detailed Example: Updating Progress

**Step 1: User Interaction**
```javascript
// User drags progress slider to 80%
const slider = document.getElementById('progress-slider');
slider.addEventListener('input', (e) => {
  const newProgress = parseInt(e.target.value);

  updateWorkEffortProgress('WE-251231-a1b2', newProgress);
});
```

**Step 2: API Call**
```javascript
// Input: User action
// Output: HTTP request
async function updateWorkEffortProgress(id, progress) {
  const response = await fetch(`/api/work-efforts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ progress })
  });

  return await response.json();
}

// HTTP Request:
// PATCH /api/work-efforts/WE-251231-a1b2
// Body: { "progress": 80 }
```

**Step 3: API Route Handler**
```javascript
// Input: HTTP request
// Output: Validated data
router.patch('/work-efforts/:id', validate(UpdateWorkEffortSchema), async (req, res) => {
  const result = await updateUseCase.execute({
    id: req.params.id,
    progress: req.validatedData.progress
  });

  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }

  res.json(result.value);
});
```

**Step 4: Use Case Execution**
```javascript
// Input: Validated command
// Output: Updated domain entity
class UpdateWorkEffort {
  async execute({ id, progress }) {
    // Load current entity
    const workEffort = await this.repository.findById(id);

    if (!workEffort) {
      return { ok: false, error: 'Work effort not found' };
    }

    // Apply domain logic
    workEffort.updateProgress(progress);

    // Persist changes
    await this.repository.save(workEffort);

    // Publish events
    this.eventBus.publish('WorkEffortUpdated', {
      workEffortId: id,
      changes: { progress }
    });

    return { ok: true, value: workEffort };
  }
}
```

**Step 5: Domain Entity Update**
```javascript
// Input: New progress value
// Output: Updated entity with domain events
class WorkEffort {
  updateProgress(newProgress) {
    // Validate
    if (newProgress < 0 || newProgress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }

    const oldProgress = this.progress;
    this.progress = newProgress;

    // Record domain event
    this.events.push({
      type: 'ProgressUpdated',
      workEffortId: this.id,
      oldProgress,
      newProgress,
      timestamp: Date.now()
    });

    // Auto-complete if 100%
    if (newProgress === 100 && this.status !== 'completed') {
      this.markCompleted();
    }
  }
}
```

**Step 6: Repository Serialization**
```javascript
// Input: Domain entity
// Output: Markdown string
class FileRepository {
  toMarkdown(workEffort) {
    const frontmatter = {
      id: workEffort.id,
      title: workEffort.title,
      status: workEffort.status,
      progress: workEffort.progress,
      created: workEffort.created.toISOString(),
      updated: new Date().toISOString()
    };

    return matter.stringify(workEffort.description || '', frontmatter);
  }
}

// Output:
// ---
// id: WE-251231-a1b2
// title: Test Feature
// status: in-progress
// progress: 80
// created: 2025-12-31T00:00:00.000Z
// updated: 2025-12-31T10:30:00.000Z
// ---
//
// Build a test feature for the dashboard.
```

**Step 7: Atomic File Write**
```javascript
// Input: Markdown string
// Output: Bytes on disk (atomically)
async function save(workEffort) {
  const content = this.toMarkdown(workEffort);
  const filePath = this.getFilePath(workEffort);

  // Atomic write strategy:
  // 1. Write to temp file
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  await fs.writeFile(tempPath, content, 'utf-8');

  // 2. Atomic rename (POSIX guarantee)
  await fs.rename(tempPath, filePath);

  // Result: Readers see old content OR new content, never partial
}
```

## Event-Driven Data Flow

### WebSocket Real-Time Updates

```
File Change → Watcher → Parser → Event Bus → WebSocket → Browser → UI Update
```

**Step 1: File System Event**
```javascript
// Chokidar watches for file changes
const watcher = chokidar.watch('_work_efforts', {
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 300,
    pollInterval: 100
  }
});

watcher.on('change', async (path) => {
  // Debounce and parse
  const workEffort = await parseWorkEffort(path);

  // Emit event
  eventBus.emit('WorkEffortChanged', workEffort);
});
```

**Step 2: Event Bus Dispatch**
```javascript
// Event bus broadcasts to subscribers
class EventBus {
  emit(event, data) {
    const listeners = this.listeners.get(event) || [];

    for (const listener of listeners) {
      // Async dispatch (non-blocking)
      setImmediate(() => listener(data));
    }
  }
}
```

**Step 3: WebSocket Broadcast**
```javascript
// WebSocket server listens to events
eventBus.on('WorkEffortChanged', (workEffort) => {
  // Broadcast to all connected clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'WORK_EFFORT_UPDATED',
        payload: workEffort
      }));
    }
  });
});
```

**Step 4: Browser Receives Update**
```javascript
// Client WebSocket handler
const ws = new WebSocket('ws://localhost:3847/ws');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.type === 'WORK_EFFORT_UPDATED') {
    dataStore.updateWorkEffort(message.payload);
  }
};
```

**Step 5: UI Reactive Update**
```javascript
// DataStore notifies subscribers
class DataStore {
  updateWorkEffort(updated) {
    const index = this.workEfforts.findIndex(we => we.id === updated.id);

    if (index !== -1) {
      this.workEfforts[index] = updated;
    } else {
      this.workEfforts.push(updated);
    }

    // Notify all subscribers
    this.notifySubscribers('workEfforts', this.workEfforts);
  }

  notifySubscribers(key, value) {
    const subscribers = this.subscribers.get(key) || [];

    for (const callback of subscribers) {
      callback(value);
    }
  }
}

// UI subscribes to changes
dataStore.subscribe('workEfforts', (workEfforts) => {
  renderWorkEfforts(workEfforts);
});
```

## Data Integrity Guarantees

### Atomicity

**File Writes**: Use temp file + rename pattern
```javascript
// ✅ Atomic (readers see old OR new, never partial)
await fs.writeFile(tempPath, content);
await fs.rename(tempPath, finalPath);

// ❌ Not atomic (readers may see partial content)
await fs.writeFile(finalPath, content);
```

**Database Transactions**: Use transaction boundaries
```javascript
// ✅ All-or-nothing
const transaction = db.transaction((workEffort, tickets) => {
  db.insertWorkEffort(workEffort);
  for (const ticket of tickets) {
    db.insertTicket(ticket);
  }
});

transaction(workEffort, tickets);

// ❌ Partial updates possible
db.insertWorkEffort(workEffort);
for (const ticket of tickets) {
  db.insertTicket(ticket); // May fail halfway through
}
```

### Consistency

**Domain Invariants**: Enforce in entity constructors
```javascript
class WorkEffort {
  constructor(data) {
    // Invariant: progress must be 0-100
    if (data.progress < 0 || data.progress > 100) {
      throw new Error('Invalid progress');
    }

    // Invariant: status must be valid
    if (!VALID_STATUSES.includes(data.status)) {
      throw new Error('Invalid status');
    }

    this.progress = data.progress;
    this.status = data.status;
  }
}
```

**Validation at Boundaries**: Validate all external input
```javascript
// ✅ Validate at API boundary
router.post('/work-efforts', validate(CreateWorkEffortSchema), async (req, res) => {
  // req.validatedData is guaranteed to match schema
  const result = await createUseCase.execute(req.validatedData);
  res.json(result);
});

// ❌ Trust external input
router.post('/work-efforts', async (req, res) => {
  const result = await createUseCase.execute(req.body); // May be malformed
  res.json(result);
});
```

## Performance Optimization

### Caching Layer

```
Request → Cache Check → Hit? Return : Fetch → Update Cache → Return
```

```javascript
async function getWorkEfforts(query) {
  const cacheKey = `work-efforts:${JSON.stringify(query)}`;

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch from source
  const workEfforts = await repository.findAll(query);

  // Update cache
  cache.set(cacheKey, workEfforts, { ttl: 300 }); // 5 minutes

  return workEfforts;
}
```

### Batching

```javascript
// ❌ N+1 query problem
for (const workEffort of workEfforts) {
  workEffort.tickets = await ticketRepo.findByWorkEffort(workEffort.id);
}

// ✅ Batch load
const ids = workEfforts.map(we => we.id);
const allTickets = await ticketRepo.findByWorkEfforts(ids);

const ticketsByWE = groupBy(allTickets, t => t.workEffortId);

for (const workEffort of workEfforts) {
  workEffort.tickets = ticketsByWE[workEffort.id] || [];
}
```

---

**Next**: [State Machines](../state-machines/README.md) - See how entities transition through states
