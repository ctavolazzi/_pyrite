# MCP Servers

Model Context Protocol servers configured globally for Cursor IDE.

**Global Config:** `~/.cursor/mcp.json`

## All Configured Servers (10 Total)

| Server | Type | Tools | Description |
|--------|------|-------|-------------|
| **memory** | npx | 9 | Persistent knowledge graph |
| **filesystem** | npx | 14 | File operations (workspace-scoped) |
| **github** | remote | - | GitHub API via MCP |
| **pixellab** | remote | 20+ | AI pixel art generation |
| **nano-banana** | npx | 6 | Gemini image generation |
| **webdev** | npx | 2 | Screen capture |
| **browser-tools** | npx | 13 | Browser debugging & audits |
| **docs-maintainer** | local | 7 | Documentation management |
| **work-efforts** | local | 4 | Task tracking |
| **simple-tools** | local | 3 | Utility functions |

---

## NPX-Based Servers (Auto-Install)

### memory
**Package:** `@modelcontextprotocol/server-memory`
**Purpose:** Persistent knowledge graph across sessions

| Tool | Description |
|------|-------------|
| `create_entities` | Create entities in knowledge graph |
| `create_relations` | Build relationships between entities |
| `add_observations` | Add notes to entities |
| `delete_entities` | Remove entities |
| `delete_observations` | Remove observations |
| `delete_relations` | Remove relationships |
| `read_graph` | Read entire knowledge graph |
| `search_nodes` | Search entities by query |
| `open_nodes` | Get specific entities by name |

**Storage:** `~/.cursor/memory.jsonl`

### filesystem
**Package:** `@modelcontextprotocol/server-filesystem`
**Purpose:** File operations scoped to workspace

| Tool | Description |
|------|-------------|
| `read_file` | Read file contents |
| `read_multiple_files` | Read multiple files at once |
| `write_file` | Write/create files |
| `edit_file` | Edit existing files |
| `create_directory` | Create directories |
| `list_directory` | List directory contents |
| `directory_tree` | Get directory tree |
| `move_file` | Move/rename files |
| `search_files` | Search by glob pattern |
| `get_file_info` | Get file metadata |
| ... | (14 tools total) |

**Scope:** Limited to `${workspaceFolder}` for security

### nano-banana
**Package:** `nano-banana-mcp`
**Purpose:** AI image generation via Google Gemini

| Tool | Description |
|------|-------------|
| `configure_gemini_token` | Set up API authentication |
| `generate_image` | Create image from text |
| `edit_image` | Modify existing image |
| `continue_editing` | Iterate on last image |
| `get_last_image_info` | Get current image info |
| `get_configuration_status` | Check API status |

**Requires:** Gemini API key in environment

### webdev
**Package:** `webdev-mcp`
**Purpose:** Screen capture utilities

| Tool | Description |
|------|-------------|
| `listScreens` | List available displays |
| `takeScreenshot` | Capture screen as base64 |

**Note:** Requires screen recording permission on macOS

### browser-tools
**Package:** `@agentdeskai/browser-tools-mcp@1.2.1`
**Purpose:** Browser monitoring and debugging

Requires Chrome extension + middleware server.

| Tool | Description |
|------|-------------|
| `getConsoleLogs` | Capture browser console output |
| `getConsoleErrors` | Get console errors only |
| `getNetworkLogs` | Monitor all network traffic |
| `getNetworkErrors` | Get network errors only |
| `takeScreenshot` | Capture page screenshots |
| `getSelectedElement` | Analyze selected DOM elements |
| `wipeLogs` | Clear stored logs |
| `runAccessibilityAudit` | WCAG compliance checks |
| `runPerformanceAudit` | Lighthouse performance analysis |
| `runSEOAudit` | Search engine optimization checks |
| `runNextJSAudit` | NextJS-specific audit |
| `runBestPracticesAudit` | Web development best practices |
| `runDebuggerMode` | Run all debugging tools in sequence |
| `runAuditMode` | Run all audits in sequence |

**Setup:**
1. Install Chrome extension from [GitHub releases](https://github.com/AgentDeskAI/browser-tools-mcp/releases/tag/v1.2.0)
2. Start middleware: `npx @agentdeskai/browser-tools-server@1.2.0`
3. Open Chrome DevTools → BrowserToolsMCP panel

**Extension location:** `.mcp-servers/browser-tools/repo/chrome-extension/`

---

## Remote API Servers

### github
**URL:** `https://api.githubcopilot.com/mcp/`
**Purpose:** GitHub API access via MCP

Provides direct GitHub API integration. Complements the `gh` CLI for MCP-native operations.

### pixellab
**URL:** `https://api.pixellab.ai/mcp`
**Purpose:** AI-powered pixel art generation for games

| Tool | Description |
|------|-------------|
| `create_character` | Generate character sprites (4 or 8 directions) |
| `animate_character` | Add animations to characters |
| `get_character` | Retrieve character data |
| `list_characters` | List all characters |
| `delete_character` | Remove a character |
| `create_isometric_tile` | Generate isometric tiles |
| `get_isometric_tile` | Retrieve tile data |
| `list_isometric_tiles` | List all tiles |
| `delete_isometric_tile` | Remove a tile |
| `create_map_object` | Generate map objects |
| `get_map_object` | Retrieve map object |
| `create_topdown_tileset` | Generate top-down tilesets |
| `get_topdown_tileset` | Retrieve tileset |
| `list_topdown_tilesets` | List tilesets |
| `delete_topdown_tileset` | Remove tileset |
| `create_sidescroller_tileset` | Generate platformer tilesets |
| `get_sidescroller_tileset` | Retrieve sidescroller tileset |
| `list_sidescroller_tilesets` | List sidescroller tilesets |
| `delete_sidescroller_tileset` | Remove sidescroller tileset |

**Assets saved to:** `.mcp-servers/pixellab-assets/`

---

## Local Custom Servers

### docs-maintainer

| Tool | Description |
|------|-------------|
| `initialize_docs` | Create `_docs`, master index, and default area folders |
| `create_doc` | Create a new doc with sequential ID and update indexes |
| `update_doc` | Update content/links and refresh timestamps |
| `rebuild_indices` | Regenerate all indexes, clean broken links, and report health |
| `link_work_effort` | Add bidirectional links between docs and work efforts |
| `search_docs` | Search titles, frontmatter, and optionally content |
| `check_health` | Report missing metadata, broken links, and orphaned docs |

### work-efforts

| Tool | Description |
|------|-------------|
| `create_work_effort` | Create new work effort with Johnny Decimal numbering |
| `list_work_efforts` | List all work efforts in a repo |
| `update_work_effort` | Update status or add progress |
| `search_work_efforts` | Search by keyword in title/content |

### simple-tools

| Tool | Description |
|------|-------------|
| `generate_random_name` | Generate names like "HappyPanda123" |
| `generate_unique_id` | Generate timestamp-based unique IDs |
| `format_date` | Format dates (ISO, human, filename, devlog) |

---

## Testing

### Run Full Test Suite

```bash
node /Users/ctavolazzi/Code/.mcp-servers/test-all-tools.mjs
```

### Test Results

Results are saved to `test-results/` folder:

```
test-results/
├── 2025-12-14_21-37-02_mcp-test.json   # Timestamped result
├── 2025-12-15_10-00-00_mcp-test.json   # Another run...
└── latest.json                          # Always the most recent
```

**Naming format:** `YYYY-MM-DD_HH-MM-SS_mcp-test.json`

### Test Coverage

| Server | Tests |
|--------|-------|
| browser-tools | 0 tests (requires browser) |
| docs-maintainer | 0 tests (manual) |
| simple-tools | 7 tests (name, id, 4 date formats, error case) |
| work-efforts | 4 tests (list all, list active, 2 searches) |
| **Total** | **11 functional tests** |

### When to Run

| Trigger | Run |
|---------|-----|
| After modifying server code | ✅ Required |
| Before committing changes | ✅ Required |
| MCP tools not working | ✅ Required |
| After Node.js update | Recommended |

---

## Files

```
.mcp-servers/
├── README.md              # This file (documentation for all 10 servers)
├── test-all-tools.mjs     # Full functional test suite
├── test-servers.mjs       # Quick syntax check
├── test-results/          # Test output folder
│   ├── YYYY-MM-DD_HH-MM-SS_mcp-test.json
│   └── latest.json
├── browser-tools/
│   ├── repo/              # Cloned GitHub repo
│   │   └── chrome-extension/  # Chrome extension to install
│   ├── start-server.sh    # Middleware launcher
│   └── README.md
├── docs-maintainer/
│   ├── server.py          # Python/FastMCP server
│   ├── requirements.txt
│   └── README.md
├── work-efforts/
│   ├── server.js          # Node.js MCP server
│   └── package.json
├── simple-tools/
│   ├── server.js          # Node.js MCP server
│   └── package.json
├── pixellab-assets/       # Generated pixel art assets
│   └── *.png
└── MCP_STARTUP_TEST.md    # Startup test documentation
```

**Global config location:** `~/.cursor/mcp.json`
**Memory storage:** `~/.cursor/memory.jsonl`

---

## Configuration

Global MCP config: `~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": { "MEMORY_FILE_PATH": "/Users/ctavolazzi/.cursor/memory.jsonl" }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "${workspaceFolder}"]
    },
    "github": {
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": { "Authorization": "Bearer <token>" }
    },
    "pixellab": {
      "url": "https://api.pixellab.ai/mcp",
      "headers": { "Authorization": "Bearer <token>" }
    },
    "nano-banana": {
      "command": "npx",
      "args": ["nano-banana-mcp"],
      "env": { "GEMINI_API_KEY": "<key>" }
    },
    "webdev": {
      "command": "npx",
      "args": ["webdev-mcp"]
    },
    "browser-tools": {
      "command": "npx",
      "args": ["-y", "@agentdeskai/browser-tools-mcp@1.2.1"]
    },
    "docs-maintainer": {
      "command": "python",
      "args": ["/Users/ctavolazzi/Code/.mcp-servers/docs-maintainer/server.py"]
    },
    "work-efforts": {
      "command": "node",
      "args": ["/Users/ctavolazzi/Code/.mcp-servers/work-efforts/server.js"]
    },
    "simple-tools": {
      "command": "node",
      "args": ["/Users/ctavolazzi/Code/.mcp-servers/simple-tools/server.js"]
    }
  }
}
```

**Note:** Actual tokens/keys are stored in the real config file. Above shows structure only.

---

## Troubleshooting

### Server not appearing in Cursor

1. Restart Cursor (Cmd+Q, reopen)
2. Check `~/.cursor/mcp.json` syntax: `cat ~/.cursor/mcp.json | jq .`
3. Run test suite: `node test-all-tools.mjs`

### Tool not working

1. Run `node test-all-tools.mjs`
2. Check `test-results/latest.json`
3. Verify Node.js: `node --version` (v18+)

### NPX-based servers (memory, filesystem, nano-banana, webdev)

1. Clear npx cache: `rm -rf ~/.npm/_npx/*`
2. Restart Cursor
3. Check npx is available: `which npx`

### Browser-tools specific

1. Ensure middleware running: `npx @agentdeskai/browser-tools-server@1.2.0`
2. Chrome DevTools open with BrowserToolsMCP panel
3. Only one DevTools panel at a time
4. Extension installed from `.mcp-servers/browser-tools/repo/chrome-extension/`

### Remote servers (github, pixellab)

1. Check API tokens are valid in `~/.cursor/mcp.json`
2. Verify network connectivity
3. Check API service status

### Local servers (docs-maintainer, work-efforts, simple-tools)

1. Check server file exists: `ls -la .mcp-servers/*/server.*`
2. For Python: Ensure venv is set up: `source .mcp-servers/docs-maintainer/.venv/bin/activate`
3. For Node.js: Run `npm install` in server directory

### webdev specific

1. Grant screen recording permission: System Preferences → Privacy & Security → Screen Recording → Cursor
2. Restart Cursor after granting permission

---

## Quick Reference

| Server | Start Command | Port |
|--------|--------------|------|
| browser-tools middleware | `npx @agentdeskai/browser-tools-server@1.2.0` | 3025 |
| All others | Auto-started by Cursor | N/A |

---

*Last updated: 2025-12-21*
