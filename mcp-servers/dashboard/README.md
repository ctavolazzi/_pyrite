# Mission Control Dashboard

Real-time dashboard for monitoring work efforts across multiple repositories.

![Mission Control Screenshot](../../.playwright-mcp/mission-control-dashboard.png)

## Features

- **Multi-repo support** - Monitor work efforts across multiple repositories
- **Dual format parsing** - Supports both Johnny Decimal and MCP v0.3.0 formats
- **Real-time updates** - WebSocket connection with automatic reconnection
- **Fogsift dark theme** - Beautiful dark UI with amber/orange accents
- **Graceful shutdown** - Clean cleanup of file watchers on exit

## Quick Start

```bash
cd mcp-servers/dashboard
npm install
npm start
```

Open http://localhost:3847 in your browser.

## Configuration

Edit `config.json` to add repositories:

```json
{
  "port": 3847,
  "repos": [
    {
      "name": "_pyrite",
      "path": "/Users/ctavolazzi/Code/active/_pyrite"
    },
    {
      "name": "fogsift",
      "path": "/Users/ctavolazzi/Code/fogsift"
    }
  ],
  "debounceMs": 300
}
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /` | GET | Dashboard UI |
| `GET /api/repos` | GET | List all repos with current state |
| `GET /api/repos/:name` | GET | Get single repo state |
| `POST /api/repos` | POST | Add new repo to watch |
| `DELETE /api/repos/:name` | DELETE | Remove repo from watch |
| `GET /api/health` | GET | Server health check |

## Work Effort Formats

### Johnny Decimal (JD)
```
_work_efforts/
├── 10-19_development/
│   └── 10_active/
│       ├── 10.01_task_name.md
│       └── 10.02_another_task.md
```

### MCP v0.3.0
```
_work_efforts/
└── WE-251227-a1b2_task_name/
    ├── WE-251227-a1b2_index.md
    └── tickets/
        ├── TKT-a1b2-001_subtask.md
        └── TKT-a1b2-002_another.md
```

The dashboard automatically detects and displays both formats.

## WebSocket Protocol

### Server → Client

```javascript
// Initial state
{ type: "init", repos: { "repo_name": { workEfforts: [...], stats: {...} } } }

// Update
{ type: "update", repo: "repo_name", workEfforts: [...], stats: {...} }

// Repo change
{ type: "repo_change", action: "added" | "removed", repo: "repo_name" }
```

### Client → Server

```javascript
// Request refresh
{ type: "refresh", repo: "repo_name" }
```

## Dependencies

- `express` - Web server
- `ws` - WebSocket server
- `chokidar` - File watching
- `gray-matter` - Frontmatter parsing

## Development

```bash
# Run with auto-restart on changes
npm run dev
```

## Architecture

```
dashboard/
├── server.js          # Express + WebSocket + file watchers
├── lib/
│   ├── parser.js      # Dual-format work effort parsing
│   └── watcher.js     # Debounced file watcher
├── public/
│   ├── index.html     # Dashboard shell
│   ├── styles.css     # Fogsift dark theme
│   └── app.js         # Client with WS reconnection
├── config.json        # Repo configuration
└── package.json
```

## Status Badges

| Status | Color | Meaning |
|--------|-------|---------|
| `active` / `in_progress` | Orange | Currently being worked on |
| `completed` | Green | Done |
| `paused` | Gray | Temporarily stopped |
| `blocked` | Red | Waiting on something |
| `pending` | Yellow | Not yet started |

## Documentation

For comprehensive documentation on the work efforts system, see:
- [Work Efforts System Documentation](../../docs/work-efforts-system.md)
- [Quick Reference](../../docs/QUICK-REFERENCE.md)
- [MCP Servers](../../docs/mcp/MCP-SERVERS.md)

## License

MIT

