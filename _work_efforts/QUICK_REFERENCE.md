---
id: quick-reference
title: Work Effort Tool Bag - Quick Reference
type: reference
category: guides
tags:
  - reference
  - quick-start
  - cheatsheet
created: 2026-01-11
---

# Work Effort Tool Bag - Quick Reference

> [!tip] One-Page Cheatsheet
> Everything you need to know on one page!

## Quick Links
- [[WORK_EFFORT_TOOL_BAG_STANDARD|Full Standard]]
- [[WORK_EFFORT_CREATION_GUIDE|Creation Guide]]
- [[OBSIDIAN_FEATURES_GUIDE|Obsidian Features]]

---

## Create Work Effort

### Option 1: Command (Easiest)
```
/create-work-effort
```

### Option 2: Script
```bash
# Create folder
mkdir -p _work_efforts/WE-260111-my_work

# Setup tools
python scripts/setup_work_effort_tools.py _work_efforts/WE-260111-my_work
```

### Option 3: Procedure
```
/CMD-002
```

---

## File Structure

```
WE-YYMMDD-description/
├── README.md                    # Overview
└── tools/                      # Tool bag
    ├── README.md               # Tool docs
    ├── work_effort_tracker.md  # Progress tracking
    └── verification_checklist.md # Quality checks
```

---

## Quick Actions

### Add Next Action
```bash
echo "- [ ] [Task] @context #priority ~time" >> tools/work_effort_tracker.md
```

### Add Note
```bash
echo "### $(date '+%Y-%m-%d %H:%M') - Note" >> tools/work_effort_tracker.md
echo "Your note here" >> tools/work_effort_tracker.md
```

### Check Status
```bash
grep "Status:" tools/work_effort_tracker.md
```

---

## Contexts (GTD)

Use `@context` for filtering:

- `@computer` - Need computer
- `@deep-work` - Need focused time
- `@quick` - Quick wins (<15min)
- `@research` - Reading/investigation
- `@review` - Review/decision needed

**Example**:
```markdown
- [ ] Fix bug @computer #priority-high ~30min
```

---

## Priority Levels

- `#priority-high` - Critical, do first
- `#priority-medium` - Important, do soon
- `#priority-low` - Nice to have, do later

---

## Time Estimates

- `~5min` - Very quick
- `~15min` - Quick win
- `~30min` - Medium task
- `~1hr` - Large task
- `~2hr+` - Deep work

---

## Wikilinks

Link to other work efforts, procedures, commands:

```markdown
[[WE-260110-order66|Order 66]]
[[../../.cursor/procedures/CMD-002_create_work_effort_with_tools|CMD-002]]
[[work_effort_tracker|Tracker]]
```

---

## Tags

Hierarchical tags:

```markdown
#work-effort/WE-260111-example
#priority/high
#status/in-progress
#context/computer
#type/feature
```

---

## Callouts

```markdown
> [!info] Information
> [!tip] Helpful tip
> [!warning] Warning or blocker
> [!success] Success or completion
```

---

## Frontmatter (YAML)

Every file has metadata:

```yaml
---
id: WE-260111-example
title: Work Effort Example
status: in-progress
priority: high
tags:
  - work-effort
  - tracker
contexts:
  - "@computer"
completion: 45%
---
```

---

## Dataview Queries

### All In-Progress Work
```dataview
TABLE status, completion
FROM #work-effort
WHERE status = "in-progress"
```

### Next Actions by Context
```dataview
TASK
FROM #work-effort
WHERE contains(text, "@computer")
AND !completed
```

### High Priority Items
```dataview
TABLE priority, status
FROM #work-effort
WHERE priority = "high"
```

---

## ID System (Johnny Decimal)

**Work Efforts**: `WE-YYMMDD-description`
- `WE` = Category (Work Effort)
- `YYMMDD` = Date (260111 = Jan 11, 2026)
- `description` = Slug

**Procedures**: `CAT-###`
- `CMD-002` = Command Operations #2
- `ENG-001` = Engineering Workflow #1
- `VER-001` = Verification Workflow #1

---

## Common Workflows

### 1. Start Work Session
```markdown
## Next Actions ⚡

### Immediate (Do Now)
- [ ] [Top priority task] @context #high ~time
```

### 2. Link Related Work
```markdown
## Related Work Efforts
- [[WE-YYMMDD-dependency|Description]] - Depends on this
- [[WE-YYMMDD-related|Description]] - Related
```

### 3. Track Decision
```markdown
| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| 2026-01-11 | Use X | Because Y | Changes Z |
```

### 4. Update Status
```yaml
---
status: completed
completion: 100%
updated: 2026-01-11
---
```

---

## File Locations

| Item | Location |
|------|----------|
| Templates | `_work_efforts/.tool_bag_template/` |
| Setup Script | `scripts/setup_work_effort_tools.py` |
| Procedures | `.cursor/procedures/` |
| Commands | `.cursor/commands/` |
| Standards | `_work_efforts/WORK_EFFORT_TOOL_BAG_STANDARD.md` |
| This Guide | `_work_efforts/QUICK_REFERENCE.md` |

---

## Help

**Commands**:
- `/help` - Show all commands
- `/create-work-effort` - Create work effort
- `/CMD-002` - Work effort procedure

**Documentation**:
- [[WORK_EFFORT_TOOL_BAG_STANDARD|Full Standard]]
- [[WORK_EFFORT_CREATION_GUIDE|Creation Guide]]
- [[OBSIDIAN_FEATURES_GUIDE|Obsidian Features]]

**Script Help**:
```bash
python scripts/setup_work_effort_tools.py --help
```

---

## Obsidian Plugins (Optional)

Recommended for enhanced features:
1. **Dataview** - Query and display data
2. **Templater** - Advanced templates
3. **Calendar** - Date navigation
4. **Tasks** - Advanced task management
5. **Kanban** - Board view

---

## Example Templates

### Next Action Template
```markdown
- [ ] [Verb] [Object] @context #priority-level ~estimate
```

### Link Template
```markdown
[[WE-YYMMDD-xxxx|Display Name]]
```

### Decision Template
```markdown
| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| YYYY-MM-DD | What | Why | Result |
```

### Note Template
```markdown
### YYYY-MM-DD HH:MM - Title
Content here
```

---

## Keyboard Shortcuts (Obsidian)

| Action | Shortcut |
|--------|----------|
| Command Palette | `Cmd/Ctrl + P` |
| Quick Switcher | `Cmd/Ctrl + O` |
| Search | `Cmd/Ctrl + Shift + F` |
| Follow Link | `Cmd/Ctrl + Click` |
| Create Link | `[[` then type |
| Toggle Checkbox | `Cmd/Ctrl + Enter` |

---

## Tips

✅ **DO**:
- Use wikilinks everywhere
- Add contexts to actions
- Estimate time for tasks
- Link related work
- Update frontmatter regularly

❌ **DON'T**:
- Skip the setup script
- Forget to add contexts
- Leave status outdated
- Break the file structure

---

## One-Liner Collection

```bash
# Add action
echo "- [ ] Task @computer #high ~30min" >> tools/work_effort_tracker.md

# Add note
echo "### $(date '+%Y-%m-%d %H:%M') - Note" >> tools/work_effort_tracker.md

# Check status
grep "Status:" tools/work_effort_tracker.md

# List actions
grep "- \[ \]" tools/work_effort_tracker.md

# Count incomplete tasks
grep -c "- \[ \]" tools/work_effort_tracker.md

# Show high priority
grep "#priority-high" tools/work_effort_tracker.md

# Show quick wins
grep "@quick" tools/work_effort_tracker.md
```

---

## Common Patterns

### Blocked Work
```markdown
> [!warning] Blocked
> **Blocker**: [[WE-260108-dependency|Dependency]] must complete
> **Owner**: @team-member
> **ETA**: 2026-01-15
```

### Decision Needed
```markdown
> [!tip] Decision Needed
> **Question**: Use X or Y?
> **Context**: Z situation
> **Action**: Schedule decision meeting @review
```

### Quick Win
```markdown
- [ ] [Quick task] @quick #priority-medium ~10min
```

### Deep Work
```markdown
- [ ] [Complex task] @deep-work #priority-high ~2hr
```

---

**Version**: 2.0
**Last Updated**: 2026-01-11

#reference #quick-start #cheatsheet

---

**See Also**:
- [[WORK_EFFORT_TOOL_BAG_STANDARD|Full Standard]] - Complete documentation
- [[OBSIDIAN_FEATURES_GUIDE|Obsidian Guide]] - Detailed feature guide
- [[WORK_EFFORT_CREATION_GUIDE|Creation Guide]] - Step-by-step tutorial
