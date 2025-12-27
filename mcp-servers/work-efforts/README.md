# Work Efforts MCP Server v0.3.0

MCP server for managing work efforts and tickets with date-based IDs.

## ID Format

### Work Effort: `WE-YYMMDD-xxxx`
- `YYMMDD` = date (251227 = Dec 27, 2025)
- `xxxx` = 4-char random alphanumeric (a-z, 0-9)
- Example: `WE-251227-a1b2`

### Ticket: `TKT-xxxx-NNN`
- `xxxx` = parent WE's unique suffix
- `NNN` = sequential (001, 002, 003...)
- Example: `TKT-a1b2-001`

## Folder Structure

```
_work_efforts_/
├── WE-251227-a1b2_api_architecture/
│   ├── WE-251227-a1b2_index.md
│   └── tickets/
│       ├── TKT-a1b2-001_define_endpoints.md
│       ├── TKT-a1b2-002_implement_api.md
│       └── TKT-a1b2-003_add_caching.md
```

## Tools

### `create_work_effort`
Create a new work effort with folder, index.md, and tickets/ subfolder.

**Parameters:**
- `repo_path` (required) - Full path to repository
- `title` (required) - Work effort title
- `objective` (required) - What needs to be done and why
- `branch` - Git branch name (auto-generated if not provided)
- `repository` - Repository name for reference
- `tickets` - Array of initial tickets to create
  - Each ticket: `{ title, description?, acceptance_criteria? }`

**Example:**
```
Create a work effort titled "API Architecture" with objective "Build REST API endpoints"
in repo /path/to/repo with initial tickets for "Define endpoints" and "Implement handlers"
```

### `create_ticket`
Create a new ticket in an existing work effort.

**Parameters:**
- `work_effort_path` (required) - Full path to work effort directory
- `title` (required) - Ticket title
- `description` - What needs to be done
- `acceptance_criteria` - Array of acceptance criteria strings

**Example:**
```
Create a ticket "Add caching layer" in work effort at /path/to/repo/_work_efforts_/WE-251227-a1b2_api
```

### `list_work_efforts`
List all work efforts in a repository.

**Parameters:**
- `repo_path` (required) - Full path to repository
- `status` - Filter: "active", "paused", "completed", "all" (default: "all")

### `list_tickets`
List all tickets in a work effort.

**Parameters:**
- `work_effort_path` (required) - Full path to work effort directory
- `status` - Filter: "pending", "in_progress", "completed", "blocked", "all" (default: "all")

### `update_work_effort`
Update a work effort status or add progress notes.

**Parameters:**
- `work_effort_path` (required) - Full path to work effort directory
- `status` - New status: "active", "paused", "completed"
- `progress` - Progress note to add
- `commit` - Commit hash to add to commits list

### `update_ticket`
Update a ticket status, files changed, or notes.

**Parameters:**
- `ticket_path` (required) - Full path to ticket file
- `status` - New status: "pending", "in_progress", "completed", "blocked"
- `files_changed` - Array of file paths that were modified
- `notes` - Implementation notes to add
- `commit` - Commit hash to add

### `search_work_efforts`
Search work efforts and tickets by keyword.

**Parameters:**
- `repo_path` (required) - Full path to repository
- `query` (required) - Search keyword
- `include_tickets` - Also search within tickets (default: true)

## Usage Examples

**Create a work effort with tickets:**
```
Create a work effort "User Authentication" with objective "Implement secure login"
and tickets for "Design auth flow", "Implement JWT", "Add password reset"
```

**Update ticket status:**
```
Mark ticket TKT-a1b2-001 as completed with files changed: src/auth.js, src/jwt.js
```

**Search for work:**
```
Search for "authentication" in work efforts
```

## Templates

### Work Effort Index
```markdown
---
id: WE-251227-a1b2
title: "Title"
status: active
created: 2025-12-27T09:13:45.000Z
created_by: username
last_updated: 2025-12-27T09:13:45.000Z
branch: feature/WE-251227-a1b2-title
repository: repo-name
---

# WE-251227-a1b2: Title

## Objective
...

## Tickets
| ID | Title | Status |
|----|-------|--------|

## Commits
...

## Related
...
```

### Ticket
```markdown
---
id: TKT-a1b2-001
parent: WE-251227-a1b2
title: "Title"
status: pending
created: 2025-12-27T09:15:22.000Z
created_by: username
assigned_to: null
---

# TKT-a1b2-001: Title

## Description
...

## Acceptance Criteria
- [ ] ...

## Files Changed
...

## Implementation Notes
...

## Commits
...
```

## Changelog

### v0.3.0 (2025-12-27)
- New ID format: `WE-YYMMDD-xxxx` for work efforts
- New ID format: `TKT-xxxx-NNN` for tickets
- New folder structure with `tickets/` subfolder
- Added `create_ticket` tool
- Added `list_tickets` tool
- Added `update_ticket` tool
- Enhanced metadata in templates
- Search now includes tickets

### v0.2.0
- Initial release with Johnny Decimal numbering
- Basic CRUD operations for work efforts
