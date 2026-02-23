# Mission Control - User Guide

Welcome to Mission Control, your command center for managing work efforts across multiple repositories.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Navigation](#dashboard-navigation)
3. [Work Effort Lifecycle](#work-effort-lifecycle)
4. [Live Demo Walkthrough](#live-demo-walkthrough)
5. [Keyboard Shortcuts](#keyboard-shortcuts)
6. [Mobile Usage](#mobile-usage)
7. [API Usage Examples](#api-usage-examples)

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- A repository with a `_work_efforts/` folder

### Quick Start

```bash
# Navigate to dashboard directory
cd mcp-servers/dashboard

# Install dependencies (first time only)
npm install

# Start the server
npm start
```

Open http://localhost:3847 in your browser.

### First Run

When you first open Mission Control:

1. **No repositories configured**: Click "+ Add Repository" in the sidebar
2. **Browse to your code folder**: Navigate to find repositories with `_work_efforts/` folders
3. **Add repositories**: Click on folders with the ◈ badge to add them
4. **Watch the dashboard populate**: Work efforts appear automatically

---

## Dashboard Navigation

### Main Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ◈ _pyrite                              Dashboard | Docs    │
├────────────┬────────────────────────────────────────────────┤
│  Sidebar   │                Main Content                    │
│            │  ┌──────────────────────────────────────┐     │
│  Search    │  │  Stats Cards                         │     │
│            │  └──────────────────────────────────────┘     │
│  Repos     │  ┌──────────────────────────────────────┐     │
│   ├ WE 1   │  │  Work Queue (filterable)             │     │
│   ├ WE 2   │  │    • Active work efforts             │     │
│   └ WE 3   │  │    • Pending items                   │     │
│            │  │    • Completed work                  │     │
│  + Add     │  └──────────────────────────────────────┘     │
└────────────┴────────────────────────────────────────────────┘
```

### Sidebar Components

**Logo Area**
- Click the diamond logo to collapse/expand sidebar
- Shows `_pyrite MISSION CONTROL` branding

**Search**
- Type to filter work efforts across all repositories
- Highlights matching text in results
- Press `/` to focus search from anywhere

**Repository Tree**
- Expandable list of repositories
- Click triangle to expand/collapse
- Number badge shows work effort count
- Each work effort shows status badge

**Add Repository**
- Click "+ Add Repository" to add new repos
- Scans for `_work_efforts/` folder automatically
- Shows work effort count before adding

### Stats Cards

The dashboard shows live statistics:

| Card | Description |
|------|-------------|
| Repositories | Total repos being monitored |
| Work Efforts | Total across all repos |
| Tickets | Total tickets in MCP format |
| Active | Currently in-progress items |

### Work Queue

The main work queue lists all work efforts with:

- **ID**: Work effort identifier
- **Title**: Name of the work effort
- **Ticket count**: For MCP format (e.g., "3/5 tickets complete")
- **Status badge**: Current status with color coding

**Filtering**
- `All`: Show everything
- `Active`: In-progress work
- `Pending`: Not yet started
- `Completed`: Finished work

---

## Work Effort Lifecycle

### Statuses

| Status | Badge Color | Description |
|--------|-------------|-------------|
| `active` | Orange | Currently being worked on |
| `in_progress` | Orange | Same as active |
| `pending` | Yellow | Waiting to start |
| `paused` | Gray | Temporarily stopped |
| `completed` | Green | Finished |
| `blocked` | Red | Waiting on dependency |

### Status Transitions

```
pending → active → completed
           ↓
         paused → active
           ↓
        blocked → active
```

### Detail View

Click any work effort to see the full command center:

**Left Column (Stats)**
- Progress ring showing completion percentage
- Ticket distribution donut chart
- Work effort details (ID, repo, format, branch)
- Velocity metrics (tickets/day, estimated completion)
- Agent assignment section

**Center Column (Content)**
- Tab navigation: Tickets | Description | Activity | Files
- Ticket list with status filters
- Add ticket button

**Right Column (Actions)**
- Quick actions: Start, Pause, Done, Archive
- Progress over time line chart
- Time tracking (created, updated, duration)
- Activity heatmap
- Tags section
- Related work efforts

---

## Live Demo Walkthrough

Mission Control includes a 10-step guided demo that creates real work efforts to showcase features.

### Starting the Demo

1. Click the **"▶ Live Demo"** button in the stats area
2. Watch as the demo creates work efforts and tickets
3. Observe real-time updates in the dashboard
4. Demo cleans up automatically at the end

### Demo Steps

1. **Create Work Effort**: A new demo work effort appears
2. **Add Tickets**: Multiple tickets are created
3. **Start Work**: Status changes to active
4. **Complete Tickets**: Tickets marked as done one by one
5. **Show Progress**: Charts update in real-time
6. **Complete Work Effort**: Final status change
7. **Cleanup**: Demo data is removed

### Manual Test

For a quick test without the full demo:
1. Click **"⚡ Test System"** button
2. A toast notification appears confirming connectivity
3. Check the connection status in the footer

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `?` | Toggle help overlay |
| `/` | Focus search input |
| `Escape` | Close panels, modals, clear search |

### Navigation

- Click any work effort to view details
- Click "← Back" to return to dashboard
- Use breadcrumb links for navigation

---

## Mobile Usage

Mission Control is fully responsive:

### Phone Layout (< 768px)

- **Sidebar**: Hidden by default, toggle with ☰ button
- **Navigation**: Horizontal scroll for tabs
- **Cards**: Stack vertically
- **Detail view**: Single column layout

### Tablet Layout (768px - 1024px)

- **Sidebar**: Collapsible
- **Detail view**: Two-column layout
- **Charts**: Responsive sizing

### Tips for Mobile

1. Use landscape orientation for more space
2. Tap hamburger menu to access sidebar
3. Swipe to scroll through tickets
4. Pull down to refresh (if supported)

---

## API Usage Examples

Mission Control provides a REST API for programmatic access.

### Base URL

```
http://localhost:3847/api
```

### List All Repositories

```bash
curl http://localhost:3847/api/repos
```

Response:
```json
{
  "repos": {
    "_pyrite": {
      "workEfforts": [...],
      "stats": {
        "total": 5,
        "byStatus": { "active": 2, "completed": 3 }
      }
    }
  }
}
```

### Add a Repository

```bash
curl -X POST http://localhost:3847/api/repos \
  -H "Content-Type: application/json" \
  -d '{"name": "myproject", "path": "/path/to/myproject"}'
```

### Update Work Effort Status

```bash
curl -X PATCH http://localhost:3847/api/repos/_pyrite/work-efforts/WE-251227-a1b2/status \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

### Health Check

```bash
curl http://localhost:3847/api/health
```

Response:
```json
{
  "status": "ok",
  "uptime": 3600,
  "repos": ["_pyrite", "fogsift"],
  "clients": 2
}
```

### WebSocket Connection

```javascript
const ws = new WebSocket('ws://localhost:3847');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Update:', message);
};

// Request manual refresh
ws.send(JSON.stringify({ type: 'refresh', repo: '_pyrite' }));
```

---

## Tips & Best Practices

### Organization

1. **Use MCP format** for new work efforts - it's more structured
2. **Add tickets** to break down large efforts
3. **Update status** regularly to keep dashboard accurate
4. **Use branches** in frontmatter to track Git branches

### Performance

1. **Limit repositories**: Monitor only active projects
2. **Close browser tabs**: WebSocket connections use resources
3. **Check server logs**: Look for parsing errors

### Troubleshooting

**Work efforts not appearing?**
- Check `_work_efforts/` folder exists
- Verify markdown files have valid frontmatter
- Look at server console for errors

**Connection lost?**
- Dashboard auto-reconnects
- Check if server is still running
- Verify network connectivity

**Updates delayed?**
- File watcher has 300ms debounce
- Updates throttled to 2 second minimum
- Large changes may take a moment

---

## Getting Help

- **API Docs**: http://localhost:3847/docs/
- **Architecture**: See `docs/ARCHITECTURE.md`
- **Source Code**: Browse `public/` and `lib/` directories
- **Brand Guidelines**: See `public/assets/brand-backup/README.md`

---

Built with ◈ for the _pyrite ecosystem.

