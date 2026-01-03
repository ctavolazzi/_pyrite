---
created: '2026-01-03T05:00:00Z'
id: architecture.02
links:
- '[[00.00_index]]'
- '[[architecture_category_index]]'
- '[[architecture.01_event_bus_pattern_implementation]]'
related_work_efforts: []
title: Core Data Structures and Algorithms
updated: '2026-01-03T05:00:00Z'
---

# Core Data Structures and Algorithms

**Last Updated:** 2026-01-03  
**Status:** Analysis Document  
**Related:** [[architecture.01_event_bus_pattern_implementation]]

## Executive Summary

This document analyzes the core data structures, algorithms, and data flow patterns in the Pyrite system. It examines how work efforts are stored, parsed, transformed, and accessed across the system, with consideration for future API development and git-like workflow operations.

## Current Understanding

### What We've Accomplished

1. **Documentation**: Created event bus pattern documentation
2. **Branch Management**: Cleaned up branches, established Git Flow
3. **Standardization**: Aligned with industry-standard branching conventions

### System Overview

Pyrite is a **file-based work tracking system** where:
- **Core Data Type**: Markdown files with YAML frontmatter
- **Storage**: File system (`_work_efforts/` directory)
- **Access Patterns**: File I/O → Parse → Transform → API/UI
- **Format**: Dual-format support (MCP v0.3.0 + legacy Johnny Decimal)

## Goals Analysis

### Immediate Goals (This Iteration)

**Status**: ✅ **COMPLETE**
- Document event bus pattern
- Establish standard Git Flow branching
- Clean up repository structure

**Next Immediate Steps**:
1. Analyze core data structures (THIS DOCUMENT)
2. Map data transformation pipeline
3. Identify API design requirements
4. Document git-like workflow patterns

### Medium-Term Goals (Next 2-4 Weeks)

**Status**: 🔄 **IN PROGRESS**
- Complete data structure documentation
- Design API specification
- Implement git-like operations (if needed)
- Create data flow diagrams

**Dependencies**:
- Core data structure analysis (this iteration)
- API requirements gathering
- Workflow pattern validation

### Long-Term Goals (Next 2-3 Months)

**Status**: 📋 **PLANNED**
- Full API implementation
- Git integration layer
- Multi-repository coordination
- Plugin system expansion

**Success Criteria**:
- API can perform all MCP operations
- Git operations integrated with work efforts
- Cross-repo workflows functional

## Core Data Structures

### 1. Work Effort (Primary Entity)

**Storage Format**: Markdown file with YAML frontmatter

**File Structure**:
```
_work_efforts/WE-YYMMDD-xxxx_slug/
├── WE-YYMMDD-xxxx_index.md    # Primary data file
└── tickets/
    ├── TKT-xxxx-001_task.md
    └── TKT-xxxx-002_task.md
```

**Data Structure (In-Memory)**:
```typescript
interface WorkEffort {
  // Identity
  id: string;                    // "WE-260102-t2z2"
  format: 'mcp' | 'jd';         // Format type
  
  // Metadata
  title: string;
  status: 'active' | 'paused' | 'completed';
  created: string;               // ISO 8601 timestamp
  last_updated?: string;
  created_by?: string;
  
  // Relationships
  branch?: string;               // "feature/WE-260102-t2z2-slug"
  repository?: string;           // Repository name
  tickets?: Ticket[];            // Child tickets (MCP only)
  
  // File System
  path: string;                  // Absolute path to directory
  
  // Legacy (Johnny Decimal)
  category?: string;            // JD format only
}
```

**Frontmatter Schema**:
```yaml
---
id: WE-260102-t2z2
title: "Dashboard Data Flow Testing"
status: completed
created: 2026-01-02T13:53:07.573Z
created_by: ctavolazzi
last_updated: 2026-01-03T04:35:47.198Z
branch: feature/WE-260102-t2z2-dashboard_data_flow_testing_analysis
repository: _pyrite
---
```

### 2. Ticket (Child Entity)

**Storage Format**: Markdown file with YAML frontmatter

**File Structure**:
```
_work_efforts/WE-YYMMDD-xxxx_slug/tickets/
└── TKT-xxxx-NNN_task_slug.md
```

**Data Structure (In-Memory)**:
```typescript
interface Ticket {
  // Identity
  id: string;                    // "TKT-t2z2-001"
  parent: string;                // "WE-260102-t2z2"
  
  // Metadata
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  created?: string;
  created_by?: string;
  assigned_to?: string;
  
  // Content
  description?: string;
  acceptance_criteria?: string[];
  files_changed?: string[];
  notes?: string;
  commits?: string[];
  
  // File System
  path: string;                  // Absolute path to file
}
```

**Frontmatter Schema**:
```yaml
---
id: TKT-t2z2-001
parent: WE-260102-t2z2
title: "Map data flow paths"
status: completed
created: 2026-01-02T13:53:07.573Z
created_by: ctavolazzi
---
```

### 3. Data Transformation Pipeline

**Flow**: File System → Parse → Transform → Domain → API/UI

```
┌─────────────────────────────────────────────────────────┐
│                    DATA FLOW PIPELINE                    │
└─────────────────────────────────────────────────────────┘

1. FILE SYSTEM (Storage Layer)
   Input:  File path (string)
   Output: Raw bytes
   └─> fs.readFile(path, 'utf-8')
   
2. TEXT PARSING (Parse Layer)
   Input:  UTF-8 string
   Output: { frontmatter: Object, content: string }
   └─> gray-matter.parse(content)
       - Extracts YAML frontmatter
       - Separates metadata from markdown body
   
3. DOMAIN ENTITY (Domain Layer)
   Input:  Parsed object
   Output: WorkEffort/Ticket entity
   └─> new WorkEffort({ ...frontmatter })
       - Validates required fields
       - Normalizes data types
       - Adds computed properties
   
4. COLLECTION (Repository Layer)
   Input:  Single entity
   Output: Array of entities
   └─> repository.findAll()
       - Scans directory structure
       - Parses all work efforts
       - Filters by criteria
   
5. DTO (Application Layer)
   Input:  Domain entity
   Output: Data Transfer Object
   └─> toDTO(workEffort)
       - Removes internal fields
       - Adds UI-specific fields
       - Formats dates/timestamps
   
6. API RESPONSE (Transport Layer)
   Input:  DTO
   Output: JSON over HTTP
   └─> res.json(dto)
   
7. CLIENT STATE (UI Layer)
   Input:  JSON
   Output: JavaScript object
   └─> JSON.parse(response)
       - Updates local state
       - Triggers re-render
```

## Core Algorithms

### Algorithm 1: Parse Work Effort

**Purpose**: Convert markdown file to WorkEffort entity

**Input**: 
- `filePath`: string (absolute path to index file)
- `dirName`: string (directory name)

**Output**: `WorkEffort | null`

**Steps**:
```javascript
async function parseMCPWorkEffort(dirPath, dirName) {
  // 1. Read file system
  const files = await fs.readdir(dirPath);
  const indexFile = files.find(f => f.endsWith('_index.md'));
  if (!indexFile) return null;
  
  // 2. Read file content
  const indexPath = path.join(dirPath, indexFile);
  const content = await fs.readFile(indexPath, 'utf-8');
  
  // 3. Parse frontmatter
  const { data: frontmatter, content: body } = matter(content);
  
  // 4. Extract ID
  const idMatch = dirName.match(/^(WE-\d{6}-[a-z0-9]{4})/);
  const id = frontmatter.id || (idMatch ? idMatch[1] : dirName);
  
  // 5. Parse child tickets
  const tickets = await parseMCPTickets(dirPath, id);
  
  // 6. Construct entity
  return {
    id,
    format: 'mcp',
    title: frontmatter.title || extractTitleFromBody(body) || 'Untitled',
    status: frontmatter.status || 'unknown',
    path: dirPath,
    created: frontmatter.created || null,
    tickets,
    branch: frontmatter.branch || null,
    repository: frontmatter.repository || null
  };
}
```

**Time Complexity**: O(n) where n = number of tickets
**Space Complexity**: O(n) for tickets array

### Algorithm 2: Generate Work Effort ID

**Purpose**: Create unique, date-based identifier

**Input**: Current timestamp (optional)

**Output**: `string` (e.g., "WE-260102-t2z2")

**Steps**:
```javascript
function generateWorkEffortId() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);    // "26"
  const mm = String(now.getMonth() + 1).padStart(2, '0'); // "01"
  const dd = String(now.getDate()).padStart(2, '0');      // "02"
  const suffix = generateSuffix();                        // "t2z2"
  return `WE-${yy}${mm}${dd}-${suffix}`;
}

function generateSuffix() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
```

**Collision Probability**: ~1 in 1.6 million per day (36^4 combinations)
**Uniqueness**: Date prefix ensures uniqueness across days

### Algorithm 3: Repository Scan

**Purpose**: Discover all work efforts in a repository

**Input**: 
- `repoPath`: string (repository root path)

**Output**: `WorkEffort[]`

**Steps**:
```javascript
async function parseRepo(repoPath) {
  const workEfforts = [];
  
  // 1. Find _work_efforts directory
  let workEffortsDir = null;
  for (const dirName of ['_work_efforts', '_work_efforts_']) {
    const tryPath = path.join(repoPath, dirName);
    try {
      await fs.access(tryPath);
      workEffortsDir = tryPath;
      break;
    } catch { /* try next */ }
  }
  
  if (!workEffortsDir) return { workEfforts: [] };
  
  // 2. Read directory entries
  const entries = await fs.readdir(workEffortsDir, { withFileTypes: true });
  
  // 3. Parse each directory
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    
    const dirName = entry.name;
    const dirPath = path.join(workEffortsDir, dirName);
    
    if (dirName.startsWith('WE-')) {
      // MCP format
      const we = await parseMCPWorkEffort(dirPath, dirName);
      if (we) workEfforts.push(we);
    } else if (/^\d{2}-\d{2}_/.test(dirName)) {
      // Johnny Decimal format
      const jdWorkEfforts = await parseJohnnyDecimalCategory(dirPath, dirName);
      workEfforts.push(...jdWorkEfforts);
    }
  }
  
  return { workEfforts };
}
```

**Time Complexity**: O(n * m) where n = directories, m = tickets per WE
**Space Complexity**: O(n) for workEfforts array

## Git-Like Workflow Considerations

### How Users Might Use Git Operations

**Current State**: Work efforts reference git branches but don't control them

**Potential Operations**:

1. **Create Work Effort → Create Branch**
   ```bash
   # User creates WE
   mcp_work-efforts_create_work_effort(...)
   
   # System could automatically:
   git checkout develop
   git checkout -b feature/WE-260102-xxxx-slug
   ```

2. **Update Work Effort → Commit**
   ```bash
   # User updates ticket status
   mcp_work-efforts_update_ticket(...)
   
   # System could automatically:
   git add _work_efforts/WE-260102-xxxx/
   git commit -m "WE-260102-xxxx/TKT-xxxx-001: Update status"
   ```

3. **Complete Work Effort → Merge**
   ```bash
   # User marks WE as completed
   mcp_work-efforts_update_work_effort(..., status: 'completed')
   
   # System could automatically:
   git checkout develop
   git merge feature/WE-260102-xxxx-slug
   ```

### Data Flow for Git Operations

```
┌─────────────────────────────────────────────────────────┐
│              GIT-INTEGRATED WORKFLOW                      │
└─────────────────────────────────────────────────────────┘

1. CREATE WORK EFFORT
   Input:  { title, objective, tickets[] }
   └─> Generate WE ID
   └─> Create directory structure
   └─> Write index.md file
   └─> [NEW] Create git branch: feature/WE-XXXX-xxxx-slug
   └─> [NEW] Commit initial files
   Output: WorkEffort + Branch reference

2. UPDATE TICKET
   Input:  { ticket_id, status, notes }
   └─> Read ticket file
   └─> Update frontmatter
   └─> Write file
   └─> [NEW] Stage file: git add tickets/TKT-xxxx-NNN.md
   └─> [NEW] Commit: git commit -m "WE-XXXX/TKT-xxxx-NNN: ..."
   Output: Updated Ticket + Commit hash

3. COMPLETE WORK EFFORT
   Input:  { we_id, status: 'completed' }
   └─> Update index.md status
   └─> Write file
   └─> [NEW] Final commit
   └─> [NEW] Merge to develop: git merge feature/WE-XXXX-xxxx
   └─> [NEW] Delete branch: git branch -d feature/WE-XXXX-xxxx
   Output: Completed WorkEffort + Merge commit
```

## API Design Considerations

### Core Data Type

**Answer**: **Text (Markdown with YAML frontmatter)**

**Storage**: File system (`.md` files)

**Rationale**:
- Human-readable
- Version-controllable (git-friendly)
- No database required
- Portable across systems
- Editable with any text editor

### API Operations Needed

**CRUD Operations**:

1. **CREATE**
   - `POST /api/work-efforts`
   - Input: `{ title, objective, tickets[] }`
   - Output: `{ we_id, path, branch }`
   - Side Effects: Creates directory, files, git branch

2. **READ**
   - `GET /api/work-efforts` (list all)
   - `GET /api/work-efforts/:id` (single)
   - Input: Query params (status, repository, etc.)
   - Output: `WorkEffort[]` or `WorkEffort`

3. **UPDATE**
   - `PATCH /api/work-efforts/:id`
   - `PATCH /api/tickets/:id`
   - Input: `{ status, notes, ... }`
   - Output: Updated entity
   - Side Effects: Updates file, commits to git

4. **DELETE**
   - `DELETE /api/work-efforts/:id`
   - Input: `{ id }`
   - Output: `{ deleted: true }`
   - Side Effects: Removes directory, deletes branch

### Data Transformation Functions

**Required Functions**:

```typescript
// File System → Domain
function parseWorkEffort(filePath: string): Promise<WorkEffort>
function parseTicket(filePath: string): Promise<Ticket>
function scanRepository(repoPath: string): Promise<WorkEffort[]>

// Domain → File System
function writeWorkEffort(we: WorkEffort): Promise<void>
function writeTicket(ticket: Ticket): Promise<void>

// Domain → DTO
function toWorkEffortDTO(we: WorkEffort): WorkEffortDTO
function toTicketDTO(ticket: Ticket): TicketDTO

// Validation
function validateWorkEffort(we: WorkEffort): ValidationResult
function validateTicket(ticket: Ticket): ValidationResult

// ID Generation
function generateWorkEffortId(): string
function generateTicketId(parentId: string, ticketNumber: number): string
```

### Data Flow for API Operations

**Example: Create Work Effort via API**

```
1. HTTP Request
   POST /api/work-efforts
   Body: { title: "New Feature", objective: "Build X", tickets: [...] }
   
2. Validation
   └─> validateInput(request.body)
   └─> Check repository exists
   └─> Verify permissions
   
3. Generate ID
   └─> we_id = generateWorkEffortId()  // "WE-260103-abc1"
   
4. Create Structure
   └─> Create directory: _work_efforts/WE-260103-abc1_new_feature/
   └─> Create tickets/ subdirectory
   └─> Generate ticket IDs: TKT-abc1-001, TKT-abc1-002, ...
   
5. Write Files
   └─> Write index.md with frontmatter
   └─> Write ticket files
   
6. Git Operations (if enabled)
   └─> git checkout develop
   └─> git checkout -b feature/WE-260103-abc1-new_feature
   └─> git add _work_efforts/WE-260103-abc1_new_feature/
   └─> git commit -m "WE-260103-abc1: New Feature"
   
7. Parse Back (for response)
   └─> we = await parseWorkEffort(indexPath)
   
8. Transform to DTO
   └─> dto = toWorkEffortDTO(we)
   
9. HTTP Response
   Status: 201 Created
   Body: { we_id, title, status, path, branch, tickets: [...] }
```

## Scope Definition

### In Scope (This Iteration)

✅ **Core Data Structures**
- WorkEffort entity structure
- Ticket entity structure
- Frontmatter schemas
- File system layout

✅ **Data Transformation Pipeline**
- Parse algorithms
- ID generation
- Repository scanning
- Validation logic

✅ **API Design Considerations**
- CRUD operation signatures
- Data flow patterns
- Transformation functions

✅ **Git Integration Patterns**
- Branch creation workflows
- Commit message formats
- Merge strategies

### Out of Scope (Future Iterations)

❌ **API Implementation**
- Actual HTTP server code
- Authentication/authorization
- Rate limiting
- Caching strategies

❌ **Git Implementation**
- Actual git command execution
- Branch protection rules
- Merge conflict resolution
- Git hooks integration

❌ **Advanced Features**
- Real-time synchronization
- Multi-repository coordination
- Conflict resolution
- Performance optimization

## Gaps and Oversights Analysis

### Identified Gaps

1. **No Standardized API**
   - Current: MCP server only (stdio-based)
   - Gap: No HTTP API for web/cli clients
   - Impact: Limited integration options

2. **Git Operations Not Automated**
   - Current: Manual git operations
   - Gap: No automatic branch/commit creation
   - Impact: Work efforts and git branches can drift

3. **No Validation Layer**
   - Current: Basic parsing, minimal validation
   - Gap: No schema validation, no constraint checking
   - Impact: Invalid data can be stored

4. **No Transaction Support**
   - Current: File operations are atomic but not transactional
   - Gap: No rollback on partial failures
   - Impact: Inconsistent state possible

5. **Limited Query Capabilities**
   - Current: Scan all, filter in memory
   - Gap: No indexing, no complex queries
   - Impact: Performance degrades with scale

### Potential Downstream Effects

**If We Add Git Integration**:
- ✅ **Positive**: Automatic branch/commit tracking
- ⚠️ **Risk**: Git operations can fail (repo not initialized, no permissions)
- ⚠️ **Risk**: Branch names must be valid (sanitization needed)
- ⚠️ **Risk**: Merge conflicts if multiple users work simultaneously

**If We Add API Layer**:
- ✅ **Positive**: Web dashboard can use REST API
- ⚠️ **Risk**: Concurrent modifications (file locking needed)
- ⚠️ **Risk**: Performance with many work efforts (pagination needed)
- ⚠️ **Risk**: Security (authentication, authorization)

**If We Add Validation**:
- ✅ **Positive**: Data integrity guaranteed
- ⚠️ **Risk**: Breaking changes for existing work efforts
- ⚠️ **Risk**: Migration needed for legacy data

## Recap: What We Did and Why

### Session Summary

1. **Documented Event Bus Pattern**
   - **What**: Created comprehensive documentation of pub/sub pattern
   - **Why**: Needed reference for understanding system architecture
   - **How**: Used docs-maintainer MCP to create structured doc

2. **Cleaned Up Branches**
   - **What**: Merged all feature branches to main, deleted old branches
   - **Why**: Repository had 7 branches, 0 PRs - needed consolidation
   - **How**: Merged feature/docs-event-bus-pattern, deleted all others

3. **Established Git Flow**
   - **What**: Created standard branch structure (main, develop)
   - **Why**: Needed industry-standard workflow
   - **How**: Created develop branch, updated documentation

4. **Updated Documentation**
   - **What**: Added branching strategy to CONTRIBUTING.md, README.md
   - **Why**: Needed clear guidelines for contributors
   - **How**: Updated files, committed to main

5. **Core Data Structure Analysis** (THIS DOCUMENT)
   - **What**: Analyzed data structures, algorithms, workflows
   - **Why**: User requested deep understanding of system internals
   - **How**: Examined parser code, MCP server, file structures

### Key Insights

1. **File-Based Storage is Core**
   - Everything is markdown files
   - No database needed
   - Git-friendly by design

2. **Dual-Format Support**
   - MCP v0.3.0 (primary)
   - Johnny Decimal (legacy)
   - Parser handles both

3. **ID Generation is Deterministic**
   - Date-based prefix ensures uniqueness
   - Random suffix for collision avoidance
   - Hierarchical (WE → TKT)

4. **Data Flow is Unidirectional**
   - File → Parse → Domain → DTO → API/UI
   - Commands flow back (write operations)

## Verification

### Current State Verification

✅ **Branches**: Only `main` and `develop` exist (verified)
✅ **Documentation**: Event bus pattern documented (verified)
✅ **Git Flow**: Standard structure in place (verified)
✅ **Data Structures**: Analyzed and documented (this document)

### Next Steps Verification

**Immediate** (This Session):
- ✅ Core data structure analysis - COMPLETE
- ⏳ API design specification - NEXT
- ⏳ Git workflow integration design - NEXT

**Medium-Term** (Next 2-4 Weeks):
- ⏳ API implementation
- ⏳ Git integration layer
- ⏳ Validation system

**Long-Term** (Next 2-3 Months):
- ⏳ Full feature set
- ⏳ Performance optimization
- ⏳ Multi-repo coordination

## Final Assessment

### What We Know

1. **Data Structure**: Markdown files with YAML frontmatter
2. **Storage**: File system (`_work_efforts/` directory)
3. **Parsing**: gray-matter library for frontmatter extraction
4. **ID Format**: Date-based with random suffix
5. **Relationships**: Hierarchical (WE → TKT)

### What We Need to Decide

1. **API Design**: REST vs GraphQL vs gRPC?
2. **Git Integration**: Automatic vs manual vs hybrid?
3. **Validation**: Schema validation library? Custom validators?
4. **Concurrency**: File locking? Optimistic locking?
5. **Performance**: Indexing? Caching? Pagination?

### Recommended Next Actions

1. **Design API Specification**
   - Define endpoints
   - Define request/response schemas
   - Define error handling

2. **Design Git Integration**
   - Define when to create branches
   - Define commit message formats
   - Define merge strategies

3. **Implement Validation Layer**
   - Schema definitions
   - Validation functions
   - Error messages

4. **Create Integration Tests**
   - Test data flow end-to-end
   - Test git operations
   - Test API operations

---

**Status**: ✅ Analysis Complete  
**Next Iteration**: API Design Specification
