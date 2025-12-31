# Cross-Chat Context

**Last Updated:** 2025-12-31 13:30 PST
**Active Cursor Session:** Yes (local)

---

## Repository Structure

```
_pyrite/
├── _coordination/           # Cross-AI coordination (YOU ARE HERE)
│   ├── CONTEXT.md          # This file - current state
│   ├── tasks/              # Pending tasks for pickup
│   └── completed/          # Archived handoffs
├── _work_efforts/          # Work tracking (Johnny Decimal)
├── _spin_up/               # Session initialization
└── tools/                  # Built tools
```

---

## Current State

### Active Task
**File:** `_coordination/tasks/TASK_obsidian_linter.md`
**Status:** `awaiting_pickup`
**Assigned:** `claude_code`

### Completed Work Efforts
- **WE-251231-25qq** - GitHub Health Check Tool ✅

---

## Coordination Protocol

### For Claude Code
1. `git pull origin main`
2. `python3 tools/github-health-check/check.py`
3. Find task: `ls _coordination/tasks/`
4. Read task file for instructions
5. Follow the workflow in the task

### For Cursor (Local)
- Monitor commits from Claude Code
- Review scope proposals
- Approve before implementation
- Track in devlog

---

## Task Workflow

```
awaiting_pickup → in_progress → blocked/completed
                      ↓
              (scope proposal)
                      ↓
              STOP: Wait for Cursor
                      ↓
              (approval)
                      ↓
              Create Work Effort
                      ↓
              Implementation
                      ↓
              PR → Review → Merge
```

---

## Key Files

| File | Purpose |
|------|---------|
| `_coordination/CONTEXT.md` | Current state (this file) |
| `_coordination/tasks/*.md` | Pending tasks |
| `_work_efforts/devlog.md` | Progress log |
| `_spin_up/understanding_*.md` | Session snapshots |
| `tools/github-health-check/` | Pattern to follow |

---

**Find your task in `_coordination/tasks/` and begin.**
