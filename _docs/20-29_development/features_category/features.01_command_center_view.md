---
created: '2026-01-01T05:06:08Z'
id: features.01
links:
- '[[00.00_index]]'
- '[[features_category_index]]'
related_work_efforts:
- '[[_work_efforts/WE-251231-tbsw_mission_control_live_ai_command_center_redesign/WE-251231-tbsw_index]]'
title: Command Center View
updated: '2026-01-01T05:06:44Z'
---

# Command Center View

## Overview

A live AI command center alternative to the classic detail view. Transforms work effort management from a static dashboard into an interactive, real-time operational interface.

**Analogy:** Less Jira, more NASA Mission Control + Discord hybrid.

## Key Features

### 1. Live Activity Feed
Terminal-style streaming output showing real-time AI activity.

**Features:**
- Timestamped entries with icons
- Entry types: info, success, warning, error, action, system, command
- Auto-scroll with pause on hover
- Clear and pause controls
- Maximum 500 entries (auto-trimming)

**Example Output:**
```
21:00:21  ◇  Opened Command Center for WE-251231-tbsw
21:00:30  ›  > help
21:00:30  ★  Available Commands:
21:00:30  ℹ  start — Start working on next ticket
21:00:30  ℹ  pause — Pause current work
```

### 2. Work Queue Panel
Tickets grouped by status for quick operational awareness.

**Groups:**
- ▶ **In Progress** - Currently being worked on
- ○ **Up Next** - Pending tickets
- ✓ **Done** - Completed tickets
- ⚠ **Blocked** - Blocked tickets (if any)

**Features:**
- Click to select ticket
- Visual status indicators
- Ticket count per group
- Active ticket highlighting

### 3. Command Input
Conversational command interface at the bottom of the view.

**Available Commands:**
| Command | Description | Aliases |
|---------|-------------|---------|
| `start` | Start working on next ticket | begin, go |
| `pause` | Pause current work | stop, hold |
| `complete` | Mark current ticket as done | done, finish |
| `status` | Show current work status | info, stats |
| `create ticket <title>` | Create a new ticket | new ticket, add ticket |
| `help` | Show available commands | ?, commands |
| `demo` | Run activity demo | test |
| `clear` | Clear activity feed | cls |

**Features:**
- Command history (Arrow Up/Down)
- Tab autocomplete
- Escape to clear

### 4. View Toggle
Seamless switching between Classic and Command Center views.

- **Classic → Command Center**: Click "◎ Command" button in detail header
- **Command Center → Classic**: Click "◫ Classic" button in command header

## Technical Implementation

### Files Created
| File | Lines | Purpose |
|------|-------|---------|
| `components/activity-feed.js` | 298 | Activity feed component |
| `components/work-queue.js` | 292 | Work queue component |
| `components/command-input.js` | 297 | Command input component |
| `styles/components/command-center.css` | 513 | Command center styling |

### Files Modified
| File | Changes |
|------|---------|
| `index.html` | +95 lines - Command center HTML section |
| `app.js` | +130 lines - View toggle, init, handlers |
| `main.css` | +1 line - CSS import |
| `server.js` | +20 lines - Activity broadcast |

### HTML Structure
```html
<div class="view command-center" id="commandCenterView">
  <header class="command-header">
    <!-- Back, title, status, action buttons -->
  </header>
  <div class="command-body">
    <div class="feed-panel"><!-- Live Activity Feed --></div>
    <div class="queue-panel"><!-- Work Queue --></div>
  </div>
  <div class="command-input-bar">
    <!-- Command input -->
  </div>
</div>
```

### WebSocket Integration
New broadcast type for real-time activity:
```javascript
broadcastActivity('action', 'Work effort started', { weId, status });
```

### Component API

**ActivityFeed:**
```javascript
window.activityFeed.add(type, message, icon);
window.activityFeed.addHighlight(message);
window.activityFeed.clear();
window.activityFeed.runDemo();
```

**WorkQueue:**
```javascript
window.workQueue.setTickets(tickets);
window.workQueue.updateTicketStatus(ticketId, newStatus);
window.workQueue.getStats();
```

**CommandInput:**
```javascript
window.commandInput.execute(text);
window.commandInput.focus();
```

## Usage

1. Navigate to any work effort detail view
2. Click the "◎ Command" button in the header
3. Use commands or click tickets to interact
4. Click "◫ Classic" to return to classic view

## Demo Mode

Run the `demo` command to see a simulated work session:
```
> demo
Starting demo...
Command Center initialized
Connected to Mission Control server
Loading work effort WE-251231-tbsw...
Work effort loaded successfully
Found 7 tickets in queue
Starting ticket TKT-tbsw-001...
...
Demo complete! All tasks executed successfully.
```

## Responsive Design

| Breakpoint | Layout |
|------------|--------|
| < 480px | Feed only (queue hidden) |
| < 768px | Stacked (feed + queue vertical) |
| ≥ 768px | Two columns (feed + queue side by side) |
| ≥ 1024px | Full layout with wider queue panel |

## Related Work
- Work Effort: WE-251231-tbsw
- Complements: Detail View Overhaul (PR #16)
- Part of: Mission Control V3

## Version History
| Version | Changes |
|---------|---------|
| v0.6.3 | Initial release |

## Future Enhancements
- Natural language command parsing
- Drag-and-drop ticket reordering
- Full bidirectional AI context sharing
- Theme customization for command center