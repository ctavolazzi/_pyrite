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
│   ├── WE-251227-a1b2_index.md      # Main WE file
│   └── tickets/
│       ├── TKT-a1b2-001_define_endpoints.md
│       ├── TKT-a1b2-002_implement_api.md
│       └── TKT-a1b2-003_add_caching.md
```

## Tools

| Tool | Description |
|------|-------------|
| `create_work_effort` | Create WE folder + index.md + tickets/ subfolder |
| `create_ticket` | Create TKT in work effort's tickets/ folder |
| `list_work_efforts` | List all WEs with status and ticket count |
| `list_tickets` | List tickets in a specific WE |
| `update_work_effort` | Update WE status, add progress/commits |
| `update_ticket` | Update ticket status, files changed, notes |
| `search_work_efforts` | Search WEs and tickets by keyword |

## Usage Examples

### Create Work Effort
```javascript
{
  "repo_path": "/path/to/repo",
  "title": "API Architecture",
  "objective": "Build clean API layer for wiki",
  "repository": "fogsift",
  "tickets": [
    "Define API endpoints",
    "Implement WikiAPI client",
    "Add caching layer"
  ]
}
```

### Create Ticket
```javascript
{
  "work_effort_path": "/path/to/repo/_work_efforts_/WE-251227-a1b2_api_architecture",
  "title": "Add error handling",
  "description": "Implement proper error handling for API calls",
  "acceptance_criteria": [
    "All API errors return proper status codes",
    "Error messages are user-friendly",
    "Errors are logged for debugging"
  ]
}
```

### Update Ticket
```javascript
{
  "ticket_path": "/path/to/ticket.md",
  "status": "completed",
  "files_changed": ["src/js/api.js", "src/js/debug.js"],
  "commit": "abc1234"
}
```

## Installation

```bash
# Copy to local MCP servers
cp -r work-efforts ~/.mcp-servers/

# Install dependencies
cd ~/.mcp-servers/work-efforts
npm install

# Add to ~/.cursor/mcp.json
{
  "work-efforts": {
    "command": "node",
    "args": ["~/.mcp-servers/work-efforts/server.js"]
  }
}

# Restart Cursor
```

## Version History

- **v0.3.0** - Date-based IDs (WE-YYMMDD-xxxx), ticket system, 7 tools
- **v0.2.0** - Johnny Decimal numbering (00.01, 00.02)
- **v0.1.0** - Initial release
