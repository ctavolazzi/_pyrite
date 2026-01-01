# Pyrite

> "Fool's gold" — shiny, promising, experimental.

**AI-powered repository management toolkit** — configurable tools for managing, tracking, maintaining, and developing any codebase with AI assistance.

## What is Pyrite?

Pyrite is a **configurable toolkit** for AI-assisted development. Drop it into any repository to get:

- 📋 **Work tracking** — Johnny Decimal task management with tickets and checkpoints
- 🔍 **Code quality** — Linting, validation, and auto-fixing for markdown and more
- 🤖 **AI coordination** — Session hooks, context sharing, and cross-tool collaboration
- 📊 **Health checks** — GitHub integration verification, structure validation

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

# Run the linter on any markdown folder
python3 tools/obsidian-linter/lint.py --scope path/to/docs --fix

# Check GitHub integration
python3 tools/github-health-check/check.py

# Verify structure
python3 tools/structure-check/check.py --fix
```

## Philosophy

- **Configurable**: Adapt tools to your workflow, not the other way around
- **Incremental**: Use what you need, ignore what you don't
- **AI-first**: Built for AI-assisted development workflows
- **Documented**: Track what you try, what works, what doesn't

## Tools

### Obsidian Linter (v0.6.0)

Validates and fixes Obsidian-flavored markdown:

```bash
python3 tools/obsidian-linter/lint.py --scope _work_efforts --fix
```

- **Link fixing**: Auto-converts references to wikilinks
- **Frontmatter validation**: ID formats, status values, dates
- **Task list support**: Validates and fixes `[ ]` and `[x]` syntax
- **Validation**: Detects broken links, duplicates, orphaned files

See [`tools/obsidian-linter/`](tools/obsidian-linter/README.md) for details.

### GitHub Health Check

Session startup verification for GitHub integration:

```bash
python3 tools/github-health-check/check.py
```

- Authentication status
- API rate limits
- Repository access and permissions
- Branch, PR, and issue operations

See [`tools/github-health-check/`](tools/github-health-check/README.md) for details.

### Structure Check

Verifies and fixes repository structure:

```bash
python3 tools/structure-check/check.py --fix
```

See [`tools/structure-check/`](tools/structure-check/README.md) for details.

## Structure

```
_pyrite/
├── tools/                     # Standalone utilities (copy what you need)
│   ├── obsidian-linter/       # Markdown validation & fixing
│   ├── github-health-check/   # GitHub integration verification
│   └── structure-check/       # Repository structure validation
├── _work_efforts/             # Johnny Decimal task tracking
│   └── checkpoints/           # Session journal entries
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

### Work Effort Tracking

Uses Johnny Decimal system with these ID formats:
- **Work Efforts**: `WE-YYMMDD-xxxx` (e.g., `WE-251231-a1b2`)
- **Tickets**: `TKT-xxxx-NNN` (e.g., `TKT-a1b2-001`)
- **Checkpoints**: `CKPT-YYMMDD-HHMM` (session journals)

### AI Integration

| AI Tool | Config Location | Purpose |
|---------|-----------------|---------|
| Claude Code | `.claude/` | Skills, session hooks |
| Cursor | `.cursor/`, `.cursorrules` | Commands, rules |
| Both | `AGENTS.md` | Shared instructions |

## Conventions

- Prefix with `_` to sort to top of directory listing
- Use `_work_efforts/` for task tracking
- Document decisions in `docs/`
- Keep experiments isolated in `experiments/`
- Tools go in `tools/` (standalone, portable utilities)

## Roadmap

- [ ] **Plugin system** — Drop-in tool modules
- [ ] **Config file** — Central `pyrite.config.json` for all tools
- [ ] **CLI wrapper** — `pyrite lint`, `pyrite check`, etc.
- [ ] **Templates** — Starter configs for common project types

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT — see [LICENSE](LICENSE) for details.

---

*Created: 2025-12-20* | *Updated: 2025-12-31* | *Version: 0.6.0*
