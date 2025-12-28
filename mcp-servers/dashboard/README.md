# _pyrite Mission Control

> Real-time command center for AI-assisted development workflows

![Dashboard Hero](docs/images/dashboard-hero.png)

## Overview

Mission Control is a real-time dashboard for monitoring work efforts across multiple repositories. It provides a unified view of task management with support for both Johnny Decimal and MCP v0.3.0 work effort formats.

**Key Features:**
- Real-time WebSocket updates with automatic reconnection
- Multi-repository monitoring from a single dashboard
- Dual format support (Johnny Decimal + MCP v0.3.0)
- Beautiful dark theme with amber accents
- Interactive SVG charts and visualizations
- Live Demo walkthrough for onboarding
- Mobile-responsive design

## Quick Start

```bash
# Navigate to dashboard directory
cd mcp-servers/dashboard

# Install dependencies
npm install

# Start the server
npm start
```

Open [http://localhost:3847](http://localhost:3847) in your browser.

## Screenshots

### Dashboard Overview
The main dashboard shows all repositories with their work efforts in a tree navigation on the left, and a work queue in the center.

![Dashboard](docs/images/dashboard-hero.png)

### Work Effort Detail View
Click any work effort to see the full command center with:
- Progress ring and ticket distribution
- Velocity metrics and time tracking
- Activity heatmap
- Action buttons

![Detail View](docs/images/detail-view.png)

### Mobile Responsive
Fully responsive design works on phones and tablets with collapsible navigation.

![Mobile View](docs/images/mobile-view.png)

## Features

### Multi-Repository Support
Monitor multiple repositories from a single dashboard. Each repository shows:
- Total work efforts and tickets
- Status breakdown (active, pending, completed)
- Real-time updates when files change

### Dual Format Parsing
Supports both work effort formats:

**MCP v0.3.0 Format:**
```
_work_efforts/
└── WE-251227-a1b2_task_name/
    ├── WE-251227-a1b2_index.md
    └── tickets/
        ├── TKT-a1b2-001_subtask.md
        └── TKT-a1b2-002_another.md
```

**Johnny Decimal Format:**
```
_work_efforts/
├── 10-19_development/
│   └── 10_active/
│       ├── 10.01_task_name.md
│       └── 10.02_another_task.md
```

### Real-time Updates
- WebSocket connection with automatic reconnection
- File system watching with debounce/throttle
- Toast notifications for changes
- Activity state tracking (active/idle/away)

### Interactive Charts
Built-in SVG chart library with:
- Progress rings (donut charts)
- Line charts for progress over time
- Activity heatmaps
- Sparklines for velocity

### Live Demo
10-step guided walkthrough that:
1. Creates a real work effort
2. Adds tickets with different statuses
3. Shows status transitions
4. Demonstrates real-time updates
5. Cleans up demo data

## Configuration

Edit `config.json` to configure repositories:

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

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `port` | number | 3847 | Server port |
| `repos` | array | [] | Repositories to monitor |
| `repos[].name` | string | required | Display name |
| `repos[].path` | string | required | Absolute path |
| `debounceMs` | number | 300 | File change debounce |

## API Endpoints

### Repository Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/repos` | GET | List all repos with current state |
| `GET /api/repos/:name` | GET | Get single repo state |
| `POST /api/repos` | POST | Add new repo `{name, path}` |
| `DELETE /api/repos/:name` | DELETE | Remove repo from watch |

### Work Effort Updates

| Endpoint | Method | Description |
|----------|--------|-------------|
| `PATCH /api/repos/:name/work-efforts/:id/status` | PATCH | Update status |

### Directory Browser

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/browse?path=...` | GET | Browse directories |
| `POST /api/repos/bulk` | POST | Add multiple repos |

### Health Check

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/health` | GET | Server health and stats |

## WebSocket Protocol

Connect to `ws://localhost:3847` for real-time updates.

### Server Messages

```javascript
// Initial state on connect
{ type: "init", repos: { "name": { workEfforts, stats } } }

// Repository updated
{ type: "update", repo: "name", workEfforts, stats }

// Repository added/removed
{ type: "repo_change", action: "added" | "removed", repo: "name" }

// Hot reload (development)
{ type: "hot_reload", file: "filename" }
```

### Client Messages

```javascript
// Request manual refresh
{ type: "refresh", repo: "name" }
```

## Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup
```bash
npm install
npm start
```

### Hot Reload
In development mode, the server watches the `public/` directory and sends `hot_reload` messages to connected clients. The browser automatically refreshes when files change.

### Project Structure
```
dashboard/
├── server.js          # Express + WebSocket server
├── config.json        # Repository configuration
├── lib/
│   ├── parser.js      # Dual-format work effort parser
│   └── watcher.js     # Debounced file watcher
├── public/
│   ├── index.html     # Dashboard shell
│   ├── app.js         # MissionControl client class
│   ├── events.js      # EventBus + ToastManager
│   ├── charts.js      # SVG chart library
│   ├── datastore.js   # State management
│   └── styles.css     # Fogsift dark theme
└── docs/
    ├── ARCHITECTURE.md
    ├── USER-GUIDE.md
    └── images/
```

## Troubleshooting

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3847
```
**Solution:** The server will automatically try ports 3848, 3849, etc. Check the console output for the actual port.

### No Work Efforts Showing
1. Check that `_work_efforts/` folder exists in the repository
2. Verify the path in `config.json` is correct
3. Ensure work effort files have valid frontmatter
4. Check server logs for parsing errors

### WebSocket Disconnected
The client automatically reconnects with exponential backoff:
- First retry: 1 second
- Max delay: 30 seconds
- Check browser console for connection status

### Files Not Updating
1. File watcher has debounce (300ms default)
2. Throttle prevents updates within 2 seconds
3. Try the "Test System" button to verify connectivity

### Mobile Layout Issues
1. Clear browser cache
2. Ensure viewport meta tag is present
3. Try landscape orientation for more space

## Status Badges

| Status | Color | Description |
|--------|-------|-------------|
| `active` | Orange | Currently being worked on |
| `in_progress` | Orange | Ticket in progress |
| `completed` | Green | Work finished |
| `paused` | Gray | Temporarily stopped |
| `blocked` | Red | Waiting on dependency |
| `pending` | Yellow | Not yet started |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `?` | Toggle help |
| `Escape` | Close panels/modals |
| `/` | Focus search |

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.x | HTTP server |
| ws | ^8.x | WebSocket server |
| chokidar | ^3.x | File watching |
| gray-matter | ^4.x | Frontmatter parsing |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly with multiple repositories
5. Submit a pull request

### Code Style
- Vanilla JavaScript (no framework)
- ES modules (`import`/`export`)
- JSDoc comments for public functions
- CSS custom properties for theming

## Architecture

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed technical documentation including:
- System architecture diagrams
- Component breakdown
- Data flow sequences
- API reference
- Design decisions

## Related Documentation

- [User Guide](docs/USER-GUIDE.md) - How to use the dashboard
- [API Documentation](/docs/) - Interactive API docs (when server running)
- [Brand Guidelines](public/assets/brand-backup/README.md) - Logo and color specs

## License

MIT

---

Built with care for the _pyrite ecosystem.
