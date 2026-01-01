# Cross-Chat Context

**Last Updated:** 2025-12-31 18:15 PST
**Version:** 0.6.0
**Status:** All work complete, branches cleaned

---

## Current State

### Repository Health
- ✅ All code on `main` branch
- ✅ All PRs merged
- ✅ All feature branches deleted
- ✅ v0.6.0 released on GitHub

### Completed Work
- **WE-251231-25qq** - GitHub Health Check Tool ✅
- **Obsidian Linter v0.6.0** ✅
  - Phase 1: Basic linter, fixers, validator
  - Phase 2A: Task list validation & fixing (via PR #14)

### Tools Available

```
tools/
├── obsidian-linter/       # v0.6.0 - Markdown validation & fixing
│   ├── lint.py            # Unified command (recommended)
│   ├── check.py           # Linter
│   ├── fix-links.py       # Link fixer
│   ├── fix-all.py         # Comprehensive fixer
│   └── validate.py        # Validator
├── github-health-check/   # GitHub integration verification
└── structure-check/       # Repository structure validation
```

---

## Work Tracking System

**Primary System:** MCP Work Efforts v0.3.0

| Type | Format | Example |
|------|--------|---------|
| Work Effort | `WE-YYMMDD-xxxx` | `WE-251231-25qq` |
| Ticket | `TKT-xxxx-NNN` | `TKT-25qq-001` |
| Checkpoint | `CKPT-YYMMDD-HHMM` | `CKPT-251231-1800` |

**Legacy:** Johnny Decimal (00-09_meta, 10-19_development) - maintained for backwards compatibility

---

## Session Checkpoints

| ID | Date | Summary |
|----|------|---------|
| `CKPT-251231-1800` | 2025-12-31 | Obsidian Linter System v0.6.0 delivered |

---

## Coordination Protocol

### For Claude Code
```bash
git pull origin main
python3 tools/github-health-check/check.py
ls _coordination/tasks/
# Read task file for instructions
```

### For Cursor (Local)
- Monitor commits from Claude Code
- Review scope proposals
- Approve before implementation
- Track in devlog

---

## Task Workflow

```
awaiting_pickup → in_progress → scope_proposal → STOP
                                      ↓
                              (Cursor approval)
                                      ↓
                              implementation → PR → merge
```

---

## Key Files

| File | Purpose |
|------|---------|
| `_coordination/CONTEXT.md` | Current state (this file) |
| `_coordination/tasks/*.md` | Pending tasks |
| `_work_efforts/devlog.md` | Progress log |
| `_work_efforts/checkpoints/` | Session journals |
| `tools/obsidian-linter/` | Main tooling |

---

## What's Next (Phase 2B+)

Not yet implemented:
- Callouts (`> [!note]`)
- Tags (`#tag`)
- Embeds (`![[file]]`)
- Code block validation
- LaTeX, footnotes, comments, highlights

See `_coordination/tasks/` for pending work.
