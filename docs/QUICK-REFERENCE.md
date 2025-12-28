# Quick Reference

> Fast lookup for common operations in _pyrite

## Work Efforts

### ID Formats
```
Work Effort:  WE-YYMMDD-xxxx     (e.g., WE-251227-a1b2)
Ticket:       TKT-xxxx-NNN       (e.g., TKT-a1b2-001)
```

### Status Values
| Entity | Statuses |
|--------|----------|
| Work Effort | `active` → `paused` → `completed` |
| Ticket | `pending` → `in_progress` → `completed` (or `blocked`) |

### Commands

**Start Dashboard:**
```bash
cd /Users/ctavolazzi/Code/active/_pyrite/mcp-servers/dashboard
npm start
# Open http://localhost:3847
```

**MCP Tools (via AI):**
```
create_work_effort   - New WE with tickets
create_ticket        - Add ticket to WE
list_work_efforts    - View all WEs
update_ticket        - Change status/add notes
search_work_efforts  - Find by keyword
```

## Git Conventions

```bash
# Branch
git checkout -b feature/WE-251227-a1b2-slug

# Commit
git commit -m "WE-251227-a1b2/TKT-a1b2-001: Description"
```

## Key Paths

| What | Path |
|------|------|
| Work Efforts | `_work_efforts/` |
| Dashboard | `mcp-servers/dashboard/` |
| MCP Server | `/Users/ctavolazzi/Code/.mcp-servers/work-efforts/` |
| Docs | `docs/` |
| Devlog | `_work_efforts/devlog.md` |

## File Templates

### Work Effort Index
```yaml
---
id: WE-251227-a1b2
title: "Title"
status: active
created: 2025-12-27T00:00:00.000Z
branch: feature/WE-251227-a1b2-title
---
```

### Ticket
```yaml
---
id: TKT-a1b2-001
parent: WE-251227-a1b2
title: "Task"
status: pending
---
```

## Troubleshooting

```bash
# Port in use?
lsof -i :3847 && kill -9 <PID>

# Dashboard not showing WEs?
# Check folder is _work_efforts (not _work_efforts_)

# MCP not working?
# Restart Cursor, check MCP settings
```

---

**Full docs:** [work-efforts-system.md](./work-efforts-system.md)

