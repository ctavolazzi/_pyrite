# Work Efforts System Documentation

> **Version:** 0.3.0
> **Last Updated:** 2025-12-27
> **Author:** AI-assisted development

## Overview

The Work Efforts system is a task tracking infrastructure designed for AI-assisted development workflows. It provides structured documentation of work-in-progress across multiple repositories.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     WORK EFFORTS ECOSYSTEM                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │   MCP Server     │    │    Dashboard     │                   │
│  │  (AI Interface)  │    │  (Human Interface)│                  │
│  │  Port: stdio     │    │  Port: 3847      │                   │
│  └────────┬─────────┘    └────────┬─────────┘                   │
│           │                       │                              │
│           └───────────┬───────────┘                              │
│                       ▼                                          │
│           ┌───────────────────────┐                              │
│           │   _work_efforts/      │                              │
│           │   (Markdown Files)    │                              │
│           └───────────────────────┘                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## ID Formats (v0.3.0)

### Work Effort ID
```
WE-YYMMDD-xxxx
│  │      │
│  │      └── 4-char alphanumeric suffix (a-z, 0-9)
│  └── Date: Year (2 digits), Month, Day
└── Prefix: Work Effort
```

**Example:** `WE-251227-a1b2`

### Ticket ID
```
TKT-xxxx-NNN
│   │    │
│   │    └── 3-digit sequential number (001-999)
│   └── Parent WE suffix (links to parent)
└── Prefix: Ticket
```

**Example:** `TKT-a1b2-001` (child of WE-251227-a1b2)

### Status Values

| Entity | Statuses |
|--------|----------|
| Work Effort | `active`, `paused`, `completed` |
| Ticket | `pending`, `in_progress`, `completed`, `blocked` |

## Directory Structure

```
_work_efforts/
├── WE-YYMMDD-xxxx_slug/
│   ├── WE-YYMMDD-xxxx_index.md    # Work effort metadata
│   └── tickets/
│       ├── TKT-xxxx-001_task.md   # First ticket
│       ├── TKT-xxxx-002_task.md   # Second ticket
│       └── ...
├── WE-YYMMDD-yyyy_other/
│   └── ...
└── devlog.md                       # Optional: session notes
```

## Components

### 1. MCP Server (`mcp-servers/work-efforts/`)

The MCP server provides tools for AI agents to manage work efforts.

**Tools Available:**
| Tool | Description |
|------|-------------|
| `create_work_effort` | Create new WE with optional initial tickets |
| `create_ticket` | Add ticket to existing WE |
| `list_work_efforts` | List all WEs in a repo |
| `list_tickets` | List tickets in a WE |
| `update_work_effort` | Update status, add progress |
| `update_ticket` | Update status, files, notes |
| `search_work_efforts` | Search by keyword |

**Location:** `/Users/ctavolazzi/Code/.mcp-servers/work-efforts/`

**Config (in Cursor settings):**
```json
{
  "mcpServers": {
    "work-efforts": {
      "command": "node",
      "args": ["/Users/ctavolazzi/Code/.mcp-servers/work-efforts/server.js"]
    }
  }
}
```

### 2. Dashboard (`mcp-servers/dashboard/`)

Real-time web interface for monitoring work efforts.

**Features:**
- Multi-repo support
- Dual format parsing (Johnny Decimal + MCP v0.3.0)
- WebSocket real-time updates
- Fogsift dark theme

**Quick Start:**
```bash
cd mcp-servers/dashboard
npm install
npm start
# Open http://localhost:3847
```

**Configuration (`config.json`):**
```json
{
  "port": 3847,
  "repos": [
    {
      "name": "_pyrite",
      "path": "/Users/ctavolazzi/Code/active/_pyrite"
    }
  ],
  "debounceMs": 300
}
```

### 3. Legacy: Johnny Decimal Format

Some existing work efforts use the older Johnny Decimal system:

```
_work_efforts/
├── 00-09_meta/
│   └── 00_organization/
│       ├── 00.00_index.md
│       └── 00.01_setup.md
├── 10-19_development/
│   └── 10_active/
│       └── 10.01_feature.md
```

The dashboard supports both formats automatically.

## Workflow

### Creating a Work Effort (AI Agent)

```
1. Agent calls create_work_effort via MCP
2. Server generates WE-YYMMDD-xxxx ID
3. Creates folder structure and index.md
4. Creates initial tickets if provided
5. Returns paths for reference
```

### Updating Progress

```
1. Agent works on ticket
2. Calls update_ticket with:
   - status: in_progress → completed
   - files_changed: list of modified files
   - notes: implementation details
   - commit: git commit hash
3. When all tickets done, calls update_work_effort
   - status: active → completed
```

### Monitoring (Human)

```
1. Start dashboard: npm start
2. Open http://localhost:3847
3. See real-time updates as files change
4. Click cards to see ticket details
```

## File Templates

### Work Effort Index (`WE-YYMMDD-xxxx_index.md`)

```markdown
---
id: WE-251227-a1b2
title: "Feature Implementation"
status: active
created: 2025-12-27T10:00:00.000Z
created_by: ctavolazzi
last_updated: 2025-12-27T10:00:00.000Z
branch: feature/WE-251227-a1b2-feature_implementation
repository: _pyrite
---

# WE-251227-a1b2: Feature Implementation

## Metadata
- **Created**: Friday, December 27, 2025
- **Author**: ctavolazzi
- **Repository**: _pyrite
- **Branch**: feature/WE-251227-a1b2-feature_implementation

## Objective
Implement the new feature as specified.

## Tickets

| ID | Title | Status |
|----|-------|--------|
| TKT-a1b2-001 | Setup | pending |
| TKT-a1b2-002 | Implementation | pending |

## Commits
(populated as work progresses)

## Related
- Docs: (add links)
- PRs: (add links)
```

### Ticket (`TKT-xxxx-NNN_slug.md`)

```markdown
---
id: TKT-a1b2-001
parent: WE-251227-a1b2
title: "Setup"
status: pending
created: 2025-12-27T10:00:00.000Z
created_by: ctavolazzi
assigned_to: null
---

# TKT-a1b2-001: Setup

## Metadata
- **Created**: Friday, December 27, 2025
- **Parent Work Effort**: WE-251227-a1b2
- **Author**: ctavolazzi

## Description
Set up the project structure.

## Acceptance Criteria
- [ ] Create directory structure
- [ ] Add configuration files
- [ ] Write initial tests

## Files Changed
(populated when complete)

## Implementation Notes
(decisions, blockers, context)

## Commits
(populated as work progresses)
```

## Git Conventions

### Branch Naming
```
feature/WE-YYMMDD-xxxx-slug
```

### Commit Messages
```
WE-YYMMDD-xxxx/TKT-xxxx-NNN: Description

Body with details if needed.
```

### Code Comments
```javascript
// TKT-a1b2-001: Reason for this implementation choice
```

## Related Systems

| System | Purpose | Location |
|--------|---------|----------|
| NovaSystem CLI | AI problem-solving CLI | `NovaSystem-Codex/novasystem/cli/` |
| docs-maintainer | Documentation management | `.mcp-servers/docs-maintainer/` |
| memory MCP | Knowledge persistence | Built-in MCP |

## Future Development

### Planned Features
- [ ] Global CLI for human interaction
- [ ] Cloud sync for remote viewing
- [ ] GitHub integration (PR status)
- [ ] Mobile-responsive dashboard
- [ ] Notifications when tickets complete

### Architecture Goal

```
┌─────────────────────────────────────────────────────────────────┐
│                     UNIFIED CORE LIBRARY                         │
│  @work-efforts/core                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ lib/parser.js      - Parse both formats                 │   │
│  │ lib/watcher.js     - File watching                      │   │
│  │ lib/operations.js  - CRUD operations                    │   │
│  │ lib/types.ts       - TypeScript interfaces              │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
      ┌──────────┐     ┌──────────┐     ┌──────────┐
      │ MCP Server│     │    CLI   │     │ Dashboard│
      │ (AI)      │     │ (Human)  │     │ (Visual) │
      └──────────┘     └──────────┘     └──────────┘
```

## Troubleshooting

### Dashboard won't start
```bash
# Check if port is in use
lsof -i :3847

# Kill existing process
kill -9 <PID>

# Restart
npm start
```

### MCP server not connecting
```bash
# Test server directly
node /Users/ctavolazzi/Code/.mcp-servers/work-efforts/server.js

# Check Cursor MCP settings
# Cmd+Shift+P → "MCP: Show Servers"
```

### Work efforts not showing
1. Verify folder name is `_work_efforts` (single underscore prefix)
2. Check repo path in `config.json`
3. Ensure WE folders start with `WE-` or match Johnny Decimal pattern

---

## Quick Reference

```bash
# Start dashboard
cd /Users/ctavolazzi/Code/active/_pyrite/mcp-servers/dashboard && npm start

# View at
open http://localhost:3847

# MCP server location (global)
/Users/ctavolazzi/Code/.mcp-servers/work-efforts/server.js

# Dashboard location
/Users/ctavolazzi/Code/active/_pyrite/mcp-servers/dashboard/
```

