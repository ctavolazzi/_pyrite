# MCP Servers

Custom Model Context Protocol servers for use with Cursor and other MCP-compatible tools.

## Servers

| Server | Language | Description |
|--------|----------|-------------|
| `work-efforts` | Node.js | Work effort and ticket management with Johnny Decimal system |
| `simple-tools` | Node.js | Utility tools (random names, unique IDs, date formatting) |
| `docs-maintainer` | Python | Documentation management with Johnny Decimal structure |

## Installation

### 1. Copy to local .mcp-servers folder

```bash
# Create local MCP servers directory
mkdir -p ~/.mcp-servers

# Copy servers
cp -r work-efforts ~/.mcp-servers/
cp -r simple-tools ~/.mcp-servers/
cp -r docs-maintainer ~/.mcp-servers/
```

### 2. Install dependencies

```bash
# Node.js servers
cd ~/.mcp-servers/work-efforts && npm install
cd ~/.mcp-servers/simple-tools && npm install

# Python server
cd ~/.mcp-servers/docs-maintainer
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Configure Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "work-efforts": {
      "command": "node",
      "args": ["~/.mcp-servers/work-efforts/server.js"]
    },
    "simple-tools": {
      "command": "node", 
      "args": ["~/.mcp-servers/simple-tools/server.js"]
    },
    "docs-maintainer": {
      "command": "~/.mcp-servers/docs-maintainer/.venv/bin/python3",
      "args": ["~/.mcp-servers/docs-maintainer/server.py"]
    }
  }
}
```

### 4. Restart Cursor

The servers will be available after restart.

## Updating

When servers are updated in this repo:

```bash
cd ~/Code/active/_pyrite
git pull

# Copy updated files to local
cp mcp-servers/work-efforts/server.js ~/.mcp-servers/work-efforts/
cp mcp-servers/simple-tools/server.js ~/.mcp-servers/simple-tools/
cp mcp-servers/docs-maintainer/server.py ~/.mcp-servers/docs-maintainer/

# Restart Cursor
```

## Development

To modify a server:

1. Edit in this repo (`_pyrite/mcp-servers/...`)
2. Test locally by copying to `~/.mcp-servers/`
3. Commit and push changes
4. Other machines can pull and deploy

## Work Efforts Server

### Current Version: 0.2.0

Tools:
- `create_work_effort` - Create new work effort
- `list_work_efforts` - List all work efforts
- `update_work_effort` - Update status/progress
- `search_work_efforts` - Search by keyword

### Planned Version: 0.3.0 (WE-YYMMDD-xxxx format)

New ID format with date-based work efforts and ticket system:
- `WE-251227-a1b2` - Work Effort (date + 4-char unique)
- `TKT-a1b2-001` - Ticket (parent suffix + sequence)

New tools:
- `create_ticket` - Create ticket in work effort
- `list_tickets` - List tickets in a work effort
- `update_ticket` - Update ticket status

