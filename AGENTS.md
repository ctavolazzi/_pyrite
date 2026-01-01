# AGENTS.md — Pyrite

## Project Overview

Pyrite is an **AI-powered repository management toolkit** — configurable tools for managing, tracking, maintaining, and developing any codebase with AI assistance.

**Name:** "Fool's gold" — experimental, promising, not everything will pan out.

## Directory Structure

```
_pyrite/
├── tools/                 # Standalone utilities
│   ├── obsidian-linter/   # Markdown validation & fixing (v0.6.0)
│   ├── github-health-check/
│   └── structure-check/
├── _work_efforts/         # Work tracking (MCP v0.3.0)
│   ├── WE-*/              # Work effort folders
│   ├── checkpoints/       # Session journals
│   └── devlog.md          # Activity log
├── .claude/               # Claude Code config
├── .cursor/               # Cursor IDE config
├── experiments/           # Prototypes
├── integrations/          # Cross-repo work
└── docs/                  # Plans, decisions
```

## Work Conventions

### Work Efforts (MCP v0.3.0)
- **Work Effort ID**: `WE-YYMMDD-xxxx` (e.g., `WE-251231-a1b2`)
- **Ticket ID**: `TKT-xxxx-NNN` (e.g., `TKT-a1b2-001`)
- **Checkpoint ID**: `CKPT-YYMMDD-HHMM` (e.g., `CKPT-251231-1800`)
- Update devlog with progress
- Create work effort for non-trivial tasks (2+ tickets)

### Code
- Keep experiments isolated in `experiments/`
- Integration code goes in `integrations/`
- Document decisions in `docs/`

## Related Repositories

| Repo | Purpose |
|------|---------|
| `cursor-coding-protocols` | Versioning system, tooling |
| `awesome-pocketbase` | PocketBase infrastructure |
| `public-apis` | API adapters (arXiv, etc.) |

## AI Agent Instructions

### The Workflow (for non-trivial tasks)

```
STEP 0: ECHO      → Repeat understanding, WAIT for confirmation
STEP 1: THINK     → Use sequential-thinking MCP for complex problems
STEP 2: SEARCH    → Check work efforts for related work
STEP 3: PLAN      → Create Work Effort, WAIT for approval
STEP 4: EXECUTE   → Work through tickets, update status
STEP 5: VERIFY    → Test changes
STEP 6: COMPLETE  → Update all statuses
STEP 7: DOCUMENT  → Update docs if needed
STEP 8: PERSIST   → Store learnings in memory MCP
```

### Quick Guidelines

1. **Check devlog first** — understand recent context
2. **Use work efforts** — track non-trivial tasks
3. **Cross-repo work** — this is the integration point
4. **Experiment freely** — `experiments/` is for trying things
5. **Document decisions** — especially architectural ones

### MCP Servers

Key servers:
- `sequential-thinking` - Problem breakdown
- `work-efforts` - Task tracking (v0.3.0: WE-YYMMDD-xxxx format)
- `memory` - Knowledge persistence
- `docs-maintainer` - Documentation management
- `dev-log` - Devlog entries

### Tools

```bash
# Obsidian Linter (v0.6.0) - check, validate, fix markdown
python3 tools/obsidian-linter/lint.py --scope _work_efforts --fix

# GitHub Health Check - verify GitHub integration
python3 tools/github-health-check/check.py

# Structure Check - verify repo structure
python3 tools/structure-check/check.py --fix
```

## Safety Rules

- **Confirm before deleting** files outside `_pyrite/`
- **Don't modify** other repos without explicit instruction
- **Backup first** when touching production code

## Getting Started

```bash
cd /Users/ctavolazzi/Code/active/_pyrite
cat _work_efforts/devlog.md              # See recent work
ls _work_efforts/WE-*/                   # Active work efforts
ls _work_efforts/checkpoints/            # Session journals
```
