# 🔮 Pyrite Console

> Direct Drive chat interface for _pyrite work efforts

**Simple. Fast. Useful.**

Chat with your repository using your own API key. Create tickets, update status, and search work efforts through a conversational interface.

## Quick Start

```bash
cd mcp-servers/console
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000)

## Features

- 💬 **Natural Language Interface** — Chat with your work efforts
- 🎯 **Direct File System Access** — No MCP overhead, instant updates
- ⚡ **Streaming Responses** — See AI thinking in real-time
- 🔒 **Your API Key** — Stored locally, never sent to our servers
- 🎨 **Consistent Theme** — Matches Mission Control dashboard
- 🚀 **Instant Reload** — No build step, vanilla JavaScript

## What You Can Do

**List Work Efforts:**
```
"What work efforts do I have?"
"Show me all active work"
```

**Create Tickets:**
```
"Create a ticket for fixing the auth bug in WE-251227-1gku"
"Add a new task to improve performance"
```

**Update Status:**
```
"Mark ticket TKT-1gku-001 as completed"
"Update the status of the auth ticket to in progress"
```

**Search:**
```
"Find all tickets about authentication"
"Search for performance-related work"
```

## Architecture

```
console/
├── server.js           # Express + AI SDK streaming
├── lib/
│   ├── parser.js       # Work effort parser (with caching)
│   ├── file-ops.js     # Create/update operations
│   └── tools.js        # AI SDK tool definitions
└── public/
    ├── index.html      # UI shell
    ├── app.js          # Vanilla JS client with streaming
    └── styles.css      # Mission Control theme
```

### How It Works

1. **User sends message** → Frontend posts to `/api/chat`
2. **Server streams response** → AI SDK handles LLM + tool calling
3. **Tools modify files** → Direct file system operations
4. **Cache invalidation** → Parser cache updates
5. **Client receives stream** → Vanilla JS reads and displays

### Performance

- **In-memory cache** with 5-second TTL
- **Lazy loading** for ticket content
- **Efficient file operations** using Node.js async I/O
- **No build step** for instant reload during development

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/chat` | POST | Streaming chat endpoint |
| `GET /api/stats` | GET | Repository statistics |
| `GET /api/health` | GET | Health check |

## Configuration

**API Key:**
Click the ⚙️ settings button and enter your Anthropic API key.

**Repository Path:**
Hardcoded to `/home/user/_pyrite` — edit `lib/file-ops.js` to change.

## AI Tools

The AI has access to these tools:

- `list_work_efforts` — List all work efforts with stats
- `get_work_effort` — Get detailed info about a specific work effort
- `create_ticket` — Create a new ticket
- `update_ticket_status` — Change ticket status
- `search` — Search work efforts and tickets

## Development

**Instant reload:**
```bash
npm run dev
```

The server uses `node --watch` to automatically restart on file changes.

**File watching:**
The frontend doesn't need a build step. Edit files in `public/` and refresh your browser.

## Troubleshooting

**"API key required" error:**
- Click settings (⚙️) and add your Anthropic API key
- Key is stored in `localStorage`

**No work efforts showing:**
- Check that `_work_efforts/` exists in `/home/user/_pyrite`
- Verify work effort format (MCP v0.3.0)

**Streaming not working:**
- Check browser console for errors
- Verify AI SDK version compatibility

## Philosophy

**Folk Technica:**
- Robust: Direct file system access, no distributed system complexity
- Reliable: Battle-tested parser from Mission Control
- Fast: In-memory caching, lazy loading, vanilla JS
- Consistent: Shares theme and patterns with dashboard
- Useful: Does one thing well — chat with your work

## Related Tools

- **Mission Control Dashboard** (`../dashboard/`) — Real-time monitoring
- **Work Efforts MCP Server** (`../work-efforts/`) — MCP protocol interface
- **Obsidian Linter** (`../../tools/obsidian-linter/`) — Markdown validation

## License

MIT

---

Built with care for the _pyrite ecosystem.
