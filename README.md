# Pyrite

> "Fool's gold" — shiny, promising, experimental.

**AI-powered repository management toolkit** — configurable tools for managing, tracking, maintaining, and developing any codebase with AI assistance.

## What is Pyrite?

Pyrite is a **configurable toolkit** for AI-assisted development. Drop it into any repository to get:

- 📋 **Work tracking** — Task management with tickets, checkpoints, and devlog
- 💬 **Chat interface** — Natural language commands for creating/managing work efforts
- 📊 **Real-time dashboard** — Visual monitoring of work across repositories
- 🔍 **Code quality** — Linting, validation, and auto-fixing for markdown and more
- 🤖 **AI coordination** — Session hooks, context sharing, and cross-tool collaboration
- 🔧 **Health checks** — GitHub integration verification, structure validation

### Use Cases

| Scenario | How Pyrite Helps |
|----------|------------------|
| **New project** | Bootstrap with work tracking and AI config |
| **Existing repo** | Add tools incrementally as needed |
| **Multi-repo work** | Central coordination point for cross-cutting tasks |
| **AI pair programming** | Session startup, context persistence, checkpoints |

## Quick Start

```bash
# Clone into your project (or as a standalone workspace)
git clone https://github.com/ctavolazzi/_pyrite.git
cd _pyrite

# Using the unified CLI (recommended)
./pyrite lint --scope path/to/docs --fix
./pyrite health
./pyrite structure --fix

# Or use tools directly
python3 tools/obsidian-linter/lint.py --scope path/to/docs --fix
python3 tools/github-health-check/check.py
python3 tools/structure-check/check.py --fix
```

## Philosophy

- **Configurable**: Adapt tools to your workflow, not the other way around
- **Incremental**: Use what you need, ignore what you don't
- **AI-first**: Built for AI-assisted development workflows
- **Documented**: Track what you try, what works, what doesn't

## Work Tracking System

Pyrite uses a **hybrid work tracking system** that combines two approaches:

### MCP Work Efforts (v0.3.0) — Primary System

Active work uses timestamped IDs managed by MCP servers:

```
_work_efforts/
├── WE-251227-1gku_mission_control_dashboard/
│   ├── WE-251227-1gku_index.md      # Work effort with frontmatter
│   └── tickets/
│       ├── TKT-1gku-001_fix_bug.md
│       ├── TKT-1gku-002_build_server.md
│       └── ...
├── WE-251231-25qq_github_health_check/
│   └── ...
├── checkpoints/                      # Session journals
│   └── CKPT-251231-1800.md
└── devlog.md                         # Rolling activity log
```

**ID Formats:**
| Type | Format | Example |
|------|--------|---------|
| Work Effort | `WE-YYMMDD-xxxx` | `WE-251227-1gku` |
| Ticket | `TKT-xxxx-NNN` | `TKT-1gku-001` |
| Checkpoint | `CKPT-YYMMDD-HHMM` | `CKPT-251231-1800` |

**MCP Tools:**
- `mcp_work-efforts_create_work_effort` — New initiative
- `mcp_work-efforts_create_ticket` — Add task to work effort
- `mcp_work-efforts_update_ticket` — Change status
- `mcp_work-efforts_search_work_efforts` — Find related work

### Johnny Decimal (Legacy/Optional)

Some older files use Johnny Decimal numbering for categorization:

```
_work_efforts/
├── 00-09_meta/           # Organization, indexes
├── 10-19_development/    # Active development
├── 20-29_experiments/    # Exploratory work
└── ...
```

This is **optional** and maintained for backwards compatibility. New work should use MCP Work Efforts.

## CLI

### Unified Command (v0.7.0)

Use the `pyrite` CLI wrapper for convenient access to all tools:

```bash
# Show all available commands
./pyrite --help

# Lint markdown files
./pyrite lint --scope _work_efforts --fix

# Check GitHub integration
./pyrite health

# Verify repository structure
./pyrite structure --fix

# Show version
./pyrite --version
```

**Benefits:**
- Shorter, more memorable commands
- Unified help system (`pyrite --help`)
- Future-ready for plugin architecture
- Backward compatible (old paths still work)

For command-specific options, use `./pyrite <command> --help`

## Tools

### Obsidian Linter (v0.6.0)

Validates and fixes Obsidian-flavored markdown:

```bash
./pyrite lint --scope _work_efforts --fix
# Or: python3 tools/obsidian-linter/lint.py --scope _work_efforts --fix
```

- **Link fixing**: Auto-converts `TKT-xxxx-NNN` and `WE-YYMMDD-xxxx` to wikilinks
- **Frontmatter validation**: ID formats, status values, dates
- **Task list support**: Validates and fixes `[ ]` and `[x]` syntax
- **Validation**: Detects broken links, duplicates, orphaned files

See [`tools/obsidian-linter/`](tools/obsidian-linter/README.md) for details.

### GitHub Health Check

Session startup verification for GitHub integration:

```bash
./pyrite health
# Or: python3 tools/github-health-check/check.py
```

- Authentication status
- API rate limits
- Repository access and permissions
- Branch, PR, and issue operations

See [`tools/github-health-check/`](tools/github-health-check/README.md) for details.

### Structure Check

Verifies and fixes repository structure:

```bash
./pyrite structure --fix
# Or: python3 tools/structure-check/check.py --fix
```

See [`tools/structure-check/`](tools/structure-check/README.md) for details.

## Interfaces

### Pyrite Console (NEW)

Chat interface for natural language work effort management:

```bash
cd mcp-servers/console
npm install
npm start
# Open http://localhost:3000
```

- **Natural language commands**: "List work efforts", "Create a ticket for..."
- **Streaming AI responses**: Real-time feedback with AI SDK
- **Direct file system**: No MCP overhead, instant updates
- **Your API key**: Stored locally in browser
- **Instant reload**: Vanilla JS, no build step

**AI Tools:**
- List and search work efforts
- Create tickets with auto-generated IDs
- Update ticket status
- Get detailed work effort information

See [`mcp-servers/console/`](mcp-servers/console/README.md) for details.

### Mission Control Dashboard

Real-time monitoring dashboard for work efforts:

```bash
cd mcp-servers/dashboard
npm install
npm start
# Open http://localhost:3847
```

- **Multi-repository support**: Monitor multiple repos
- **WebSocket updates**: Real-time file watching
- **Dual format parsing**: MCP v0.3.0 + Johnny Decimal
- **Interactive charts**: Progress rings, heatmaps, velocity metrics

See [`mcp-servers/dashboard/`](mcp-servers/dashboard/README.md) for details.

## Structure

```
_pyrite/
├── tools/                     # Standalone utilities (copy what you need)
│   ├── obsidian-linter/       # Markdown validation & fixing
│   ├── github-health-check/   # GitHub integration verification
│   └── structure-check/       # Repository structure validation
├── mcp-servers/               # Web interfaces and MCP servers
│   ├── console/               # Chat interface for work efforts (NEW)
│   ├── dashboard/             # Real-time work effort monitoring
│   └── work-efforts/          # MCP server for work effort operations
├── _work_efforts/             # Work tracking (MCP + optional Johnny Decimal)
│   ├── WE-*/                  # MCP work efforts (primary)
│   ├── checkpoints/           # Session journals
│   ├── 00-09_meta/            # Johnny Decimal (legacy)
│   └── devlog.md              # Rolling activity log
├── .claude/                   # Claude Code configuration
│   └── skills/                # Session start hooks
├── .cursor/                   # Cursor IDE configuration
│   └── commands/              # Custom commands
├── experiments/               # Exploratory code and prototypes
├── integrations/              # Cross-repo integration work
└── docs/                      # Plans, decisions, learnings
```

## Configuration

### For Any Repository

1. **Copy tools you need** from `tools/` into your project
2. **Adapt paths** in scripts to match your structure
3. **Configure AI hooks** in `.claude/` or `.cursor/` as needed

### AI Integration

| AI Tool | Config Location | Purpose |
|---------|-----------------|---------|
| Claude Code | `.claude/` | Skills, session hooks |
| Cursor | `.cursor/`, `.cursorrules` | Commands, rules |
| Both | `AGENTS.md` | Shared instructions |

### MCP Servers

Pyrite integrates with these MCP servers (configured separately):

| Server | Purpose |
|--------|---------|
| `work-efforts` | Create/update work efforts and tickets |
| `memory` | Persist knowledge across sessions |
| `sequential-thinking` | Complex problem breakdown |
| `docs-maintainer` | Documentation management |
| `dev-log` | Devlog entries |

## Development Workflow

### Branching Strategy

This project uses **Git Flow**:

- **`main`** - Production/stable code (protected)
- **`develop`** - Development integration branch
- **`feature/*`** - Feature branches (e.g., `feature/WE-260102-xxxx-work-effort`)

**Workflow:**
1. Create feature branches from `develop`
2. Work on features, commit changes
3. Merge feature branches → `develop` for integration
4. Merge `develop` → `main` when ready for production

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for detailed contribution guidelines.

## Conventions

- Prefix with `_` to sort to top of directory listing
- Use `_work_efforts/` for task tracking
- Document decisions in `docs/`
- Keep experiments isolated in `experiments/`
- Tools go in `tools/` (standalone, portable utilities)

## Roadmap

- [ ] **Plugin system** — Drop-in tool modules
- [ ] **Config file** — Central `pyrite.config.json` for all tools
- [x] **CLI wrapper** — `pyrite lint`, `pyrite check`, etc. ✨
- [ ] **Templates** — Starter configs for common project types
- [ ] **Deprecate Johnny Decimal** — Full migration to MCP Work Efforts

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT — see [LICENSE](LICENSE) for details.

---

*Created: 2025-12-20* | *Updated: 2026-01-01* | *Version: 0.7.0*
