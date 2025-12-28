# MCP Servers

Custom Model Context Protocol servers for use with Cursor and other MCP-compatible tools.

📚 **[View Full API Documentation](dashboard/public/docs/index.html)** | 🤖 **[AI-Friendly Docs](dashboard/public/docs/ai-docs.txt)**

> **Tip:** When the dashboard is running, access docs at `http://localhost:3847/docs/`

## Servers

| Server | Language | Version | Description |
|--------|----------|---------|-------------|
| `work-efforts` | Node.js | v0.3.0 | Work effort and ticket management with date-based IDs |
| `simple-tools` | Node.js | v0.2.0 | Utility tools (random names, unique IDs, date formatting) |
| `docs-maintainer` | Python | v0.1.0 | Documentation management with Johnny Decimal structure |
| `dashboard` | Node.js | - | Mission Control REST API + WebSocket server |

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

## Quick Reference

### work-efforts (v0.3.0)

ID Format:
- Work Effort: `WE-YYMMDD-xxxx` (e.g., WE-251227-a1b2)
- Ticket: `TKT-xxxx-NNN` (e.g., TKT-a1b2-001)

Tools:
- `create_work_effort` - Create new work effort with tickets
- `create_ticket` - Create ticket in work effort
- `list_work_efforts` - List all work efforts
- `list_tickets` - List tickets in a work effort
- `update_work_effort` - Update status/progress
- `update_ticket` - Update ticket status
- `search_work_efforts` - Search by keyword

### simple-tools (v0.2.0)

Tools:
- `generate_random_name` - Generate name like "HappyPanda123"
- `generate_unique_id` - Generate timestamped unique ID
- `format_date` - Format dates (iso, human, filename, devlog)

### docs-maintainer (v0.1.0)

Tools:
- `initialize_docs` - Create _docs structure
- `create_doc` - Create doc with Johnny Decimal numbering
- `update_doc` - Update content and links
- `rebuild_indices` - Regenerate all indexes
- `link_work_effort` - Bidirectional doc-WE linking
- `search_docs` - Search documentation
- `check_health` - Documentation health score

### dashboard (Mission Control)

REST API at `http://localhost:3847` for monitoring work efforts across repositories.

Key endpoints:
- `GET /api/repos` - List monitored repos
- `POST /api/repos` - Add repo
- `GET /api/browse` - Browse directories

WebSocket for real-time updates.
