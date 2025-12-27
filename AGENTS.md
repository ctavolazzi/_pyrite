# AGENTS.md — Pyrite

## Project Overview

Pyrite is a cross-repository workspace for AI-assisted development. It integrates work across multiple repos in `/Users/ctavolazzi/Code/`.

**Name:** "Fool's gold" — experimental, promising, not everything will pan out.

## Directory Structure

```
_pyrite/
├── _work_efforts/     # Johnny Decimal task tracking
├── experiments/       # Prototypes and exploratory code
├── integrations/      # Cross-repo integration work
├── docs/              # Plans, decisions, architecture
└── README.md          # Project overview
```

## Work Conventions

### Work Efforts
- Use Johnny Decimal numbering (00-09 meta, 10-19 dev, etc.)
- Update devlog with progress
- Create work effort files for non-trivial tasks

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

See `docs/mcp/MCP-SERVERS.md` for full reference. Key servers:
- `sequential-thinking` - Problem breakdown
- `work-efforts` - Task tracking (v0.3.0: WE-YYMMDD-xxxx format)
- `memory` - Knowledge persistence
- `docs-maintainer` - Documentation management

## Safety Rules

- **Confirm before deleting** files outside `_pyrite/`
- **Don't modify** other repos without explicit instruction
- **Backup first** when touching production code

## Getting Started

```bash
cd /Users/ctavolazzi/Code/_pyrite
cat _work_efforts/devlog.md  # See recent work
ls _work_efforts/10-19_development/10_active/  # Active tasks
```
