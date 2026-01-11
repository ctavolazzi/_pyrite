---
id: obsidian-features-guide
title: Obsidian Features Guide for Work Efforts
type: documentation
category: guides
tags:
  - obsidian
  - zettelkasten
  - gtd
  - johnny-decimal
  - productivity
created: 2026-01-11
updated: 2026-01-11
---

# Obsidian Features Guide for Work Efforts

> [!info] Integration Philosophy
> This system combines **Obsidian** markdown features with **Zettelkasten** linking, **GTD** workflows, and **Johnny Decimal** organization - all focused on **ease of use** and **convenience**.

## Quick Links
- [[WORK_EFFORT_TOOL_BAG_STANDARD|Tool Bag Standard]]
- [[WORK_EFFORT_CREATION_GUIDE|Creation Guide]]
- [[#Obsidian Features]]
- [[#Zettelkasten Principles]]
- [[#GTD Integration]]
- [[#Johnny Decimal System]]

---

## Obsidian Features

### 1. YAML Frontmatter

Every tool file includes rich metadata for Dataview queries and organization:

```yaml
---
id: WE-260111-example
title: Work Effort Example
type: tracker
status: in-progress
project: WE-260111-example
created: 2026-01-11
updated: 2026-01-11
tags:
  - work-effort
  - tracker
contexts:
  - "@computer"
  - "@deep-work"
priority: high
energy: medium
completion: 45%
---
```

**Benefits**:
- ✅ Searchable metadata
- ✅ Dataview queries
- ✅ Status tracking
- ✅ Automatic organization

### 2. Wikilinks

Connect work efforts, procedures, and commands with bidirectional links:

```markdown
## Related Work Efforts
- [[WE-260110-order66|Order 66 Execution]]
- [[WE-260109-scope|Scope Definition]]

## Procedures Used
- [[../../.cursor/procedures/CMD-002_create_work_effort_with_tools|CMD-002]]

## Dependencies
- [[WE-260108-foundation|Foundation Work]] - Blocked on this
```

**Benefits**:
- ✅ Click to navigate
- ✅ Automatic backlinks
- ✅ Knowledge graph visualization
- ✅ Discover connections

### 3. Callouts/Admonitions

Use callouts for important information:

```markdown
> [!warning] Critical Blocker
> Database migration must complete before proceeding

> [!tip] Quick Win
> This can be done in under 10 minutes

> [!info] Context
> Related to previous work in WE-260109-scope

> [!success] Completed
> All tests passing, ready for merge
```

**Available Types**:
- `[!note]` - General notes
- `[!info]` - Information
- `[!tip]` - Tips and hints
- `[!warning]` - Warnings
- `[!danger]` - Dangers/blockers
- `[!success]` - Success states
- `[!example]` - Examples

### 4. Tags

Hierarchical tagging for organization:

```markdown
#work-effort/WE-260111-example
#priority/high
#status/in-progress
#context/computer
#type/feature
```

**Tag Hierarchy**:
- `#work-effort/[ID]` - Work effort identifier
- `#priority/{high,medium,low}` - Priority level
- `#status/{pending,in-progress,completed,blocked}` - Status
- `#context/{computer,deep-work,quick,research,review}` - GTD context
- `#type/{feature,bug,refactor,docs,test}` - Work type

### 5. Dataview Queries

Query across all work efforts:

```dataview
TABLE status, priority, completion
FROM #work-effort
WHERE status = "in-progress"
SORT priority DESC
```

**Common Queries**:

**All Work Efforts**:
```dataview
TABLE status, created, updated
FROM #work-effort
SORT created DESC
```

**Next Actions**:
```dataview
TASK
FROM #work-effort
WHERE contains(text, "@computer")
AND !completed
LIMIT 10
```

**High Priority Items**:
```dataview
TABLE file.link as "Work Effort", priority, status
FROM #work-effort
WHERE priority = "high"
AND status != "completed"
```

**Blocked Work**:
```dataview
TABLE file.link as "Work Effort", status
FROM #work-effort
WHERE contains(file.outlinks, "blocker")
OR status = "blocked"
```

---

## Zettelkasten Principles

### 1. Atomic Notes

Each work effort tool is a self-contained "atomic" note:
- **One Focus**: Each note has one primary purpose
- **Self-Contained**: Can be understood independently
- **Linkable**: Can be linked from anywhere
- **Evergreen**: Updated as work evolves

### 2. Unique Identifiers

Johnny Decimal-inspired ID system:

```
WE-YYMMDD-xxxx
│  │      │
│  │      └─ Description slug
│  └─ Date created (YYMMDD)
└─ Category (Work Effort)
```

**Examples**:
- `WE-260111-obsidian_integration`
- `WE-260110-order66_execution`
- `WE-260109-scope_definition`

### 3. Progressive Summarization

Build knowledge over time:
1. **Capture** - Initial work effort creation
2. **Connect** - Link to related work efforts
3. **Summarize** - Update tracker with insights
4. **Distill** - Extract patterns to documentation
5. **Express** - Share learnings across project

### 4. Bidirectional Linking

Every link creates two-way connection:
- **Forward Link**: `[[WE-260110-order66]]` links TO Order 66
- **Backlink**: Order 66 automatically shows link FROM current note
- **Graph View**: Visualize all connections in Obsidian

**Example Link Pattern**:
```markdown
## Dependencies
- [[WE-260108-foundation]] - Provides base functionality

## Follow-Ups
- [[WE-260112-enhancement]] - Builds on this work
```

Both notes now know about each other!

---

## GTD Integration

### 1. Capture Everything

Use Quick Actions to capture immediately:

```bash
# Capture next action
echo "- [ ] Review PR #123 @review #priority-high ~15min" >> tools/work_effort_tracker.md

# Capture note
echo "### $(date '+%Y-%m-%d %H:%M') - Quick Note" >> tools/work_effort_tracker.md
echo "Found interesting pattern in data flow" >> tools/work_effort_tracker.md
```

### 2. Clarify & Organize

Use Next Actions section with contexts:

```markdown
## Next Actions ⚡

### Immediate (Do Now)
- [ ] Fix broken test `@computer` `#priority-high` `~10min`
- [ ] Review code changes `@review` `#priority-high` `~20min`

### Soon (This Session)
- [ ] Update documentation `@computer` `#priority-medium` `~30min`
- [ ] Research alternatives `@research` `#priority-medium` `~1hr`

### Later (Backlog)
- [ ] Refactor old code `@deep-work` `#priority-low` `~2hr`
```

### 3. Contexts

Tag actions by context for filtering:

**Contexts**:
- `@computer` - Need computer (coding, writing)
- `@deep-work` - Need focused time (architecture, complex problems)
- `@quick` - Quick wins (<15 minutes)
- `@research` - Reading, investigation
- `@review` - Review/decision needed
- `@blocked` - Waiting on something

**Filter by Context**:
```dataview
TASK
FROM #work-effort
WHERE contains(text, "@quick")
AND !completed
```

### 4. Time Estimates

Every action has time estimate:
- `~5min` - Very quick
- `~15min` - Quick win
- `~30min` - Medium task
- `~1hr` - Large task
- `~2hr+` - Deep work session

### 5. Priority Levels

Use priority tags:
- `#priority-high` - Critical, do first
- `#priority-medium` - Important, do soon
- `#priority-low` - Nice to have, do later

### 6. Energy Levels

Match tasks to energy:
- `#energy-high` - Complex problem solving
- `#energy-medium` - Regular coding work
- `#energy-low` - Documentation, review

**Frontmatter**:
```yaml
energy: medium  # Current energy required
```

---

## Johnny Decimal System

### 1. Category Structure

Organized by category prefixes:

**Work Efforts**: `WE-YYMMDD-xxxx`
- `WE` = Work Effort category
- Unique per date + description
- Easy to find and reference

**Procedures**: `CAT-###`
- `CMD-001` = Command Operations
- `ENG-001` = Engineering Workflow
- `VER-001` = Verification Workflow
- `ANL-001` = Analysis Workflow
- etc.

### 2. Hierarchical Organization

```
00-09: System/Meta
  └─ 01: Procedures (CMD-###)
  └─ 02: Commands (/command-name)

10-19: Work Efforts
  └─ 10: Active (WE-YYMMDD-xxxx)
  └─ 11: Completed
  └─ 12: Archived

20-29: Documentation
  └─ 20: Standards
  └─ 21: Guides
  └─ 22: References
```

### 3. Quick Reference

Find anything by ID:
- `CMD-002` → Create Work Effort procedure
- `WE-260111-xxx` → Today's work effort
- `VER-001` → Verification workflow

**Benefits**:
- ✅ Memorable IDs
- ✅ Self-organizing
- ✅ Scalable (999 per category)
- ✅ Clear hierarchy

---

## Convenience Features

### 1. Quick Nav Sections

Every file has Quick Nav at top:

```markdown
## Quick Nav
- [[README|Tool Bag Home]]
- [[work_effort_tracker|Progress Tracker]]
- [[verification_checklist|Verification]]
- [[#Next Actions]] ⚡
- [[#Decisions]]
```

**Benefits**:
- Jump to any section instantly
- Navigate between tools easily
- Find what you need fast

### 2. One-Liner Commands

Quick updates without editing files:

```bash
# Add next action
echo "- [ ] Update tests @computer #high ~20min" >> tools/work_effort_tracker.md

# Quick note
echo "### $(date '+%Y-%m-%d %H:%M') - Insight" >> tools/work_effort_tracker.md
echo "Discovered better approach for X" >> tools/work_effort_tracker.md

# Check status
grep "Status:" tools/work_effort_tracker.md
```

### 3. Template Placeholders

Easy to customize:
- `[WORK_EFFORT_ID]` → Replaced by script
- `[DESCRIPTION]` → Replaced by script
- `[DATE]` → Replaced by script

Just run the setup script and templates are auto-populated!

### 4. Search & Filter

Use Obsidian search:
- Search tags: `tag:#work-effort`
- Search by status: `status: in-progress`
- Search by context: `@computer`
- Search by priority: `#priority-high`

### 5. Graph Visualization

See all connections in Obsidian graph view:
- How work efforts relate
- Which procedures are used
- What depends on what
- Knowledge structure

---

## Common Workflows

### Create New Work Effort with All Features

```bash
# 1. Create work effort
/create-work-effort

# 2. Files auto-generated with:
#    - YAML frontmatter
#    - Wikilinks
#    - Tags
#    - Next Actions
#    - GTD contexts
#    - All templates
```

### Add Next Action (GTD)

```bash
# Quick capture
echo "- [ ] [Action] @context #priority ~time" >> tools/work_effort_tracker.md

# Example
echo "- [ ] Fix auth bug @computer #priority-high ~30min" >> tools/work_effort_tracker.md
```

### Link to Related Work

```markdown
## Related Work Efforts

### Dependencies
- [[WE-260108-foundation|Foundation]] - Provides base
- [[WE-260107-api|API Setup]] - Required for integration

### Follow-Ups
- [[WE-260112-frontend|Frontend]] - Uses this work
```

### Query Progress (Dataview)

```dataview
TABLE status, completion, priority
FROM #work-effort
WHERE created >= date(2026-01-01)
SORT priority DESC, completion DESC
```

### Update Status

```markdown
---
status: completed  # Update this
completion: 100%   # Update this
---
```

### Track Decision

```markdown
## Decisions

| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| 2026-01-11 | Use PostgreSQL | Better JSON support | Requires migration |
```

---

## Best Practices

### 1. Use Wikilinks Everywhere

❌ **Don't**: `See WE-260110-order66 for details`
✅ **Do**: `See [[WE-260110-order66|Order 66]] for details`

### 2. Tag Consistently

❌ **Don't**: Mix tag styles
✅ **Do**: Use hierarchical tags `#work-effort/WE-260111-xxx`

### 3. Add Contexts to Actions

❌ **Don't**: `- [ ] Fix bug`
✅ **Do**: `- [ ] Fix auth bug @computer #priority-high ~30min`

### 4. Keep Frontmatter Updated

✅ Update `status`, `completion`, `updated` fields regularly

### 5. Link Related Work

✅ Always link dependencies, follow-ups, and related efforts

### 6. Use Callouts for Emphasis

✅ `> [!warning]` for blockers, `> [!tip]` for quick wins

### 7. Estimate Time

✅ Add time estimates to every action: `~15min`, `~1hr`, etc.

---

## Obsidian Plugins (Optional)

### Recommended Plugins

1. **Dataview** - Query and display data
   - Show all in-progress work efforts
   - List next actions by context
   - Track completion across projects

2. **Templater** - Advanced templating
   - Auto-generate work effort structure
   - Date-based filenames
   - Dynamic content

3. **Calendar** - Date navigation
   - See work efforts by date
   - Navigate timeline
   - Track start/completion dates

4. **Tasks** - Advanced task management
   - Filter by context, priority
   - Due dates and recurring tasks
   - Task queries

5. **Kanban** - Board view
   - Visualize workflow stages
   - Drag-drop task management
   - Status tracking

### Plugin Setup

**Dataview**:
1. Install from Community Plugins
2. Enable JavaScript queries
3. Use query examples from this guide

**Tasks**:
1. Install from Community Plugins
2. Configure emoji settings
3. Use with GTD contexts

---

## Examples

### Example 1: Full Work Effort

```markdown
---
id: WE-260111-auth-refactor
title: Authentication System Refactor
type: work-effort
status: in-progress
priority: high
energy: high
created: 2026-01-11
updated: 2026-01-11
completion: 35%
tags:
  - work-effort/WE-260111-auth-refactor
  - type/refactor
  - priority/high
---

# Authentication System Refactor

> [!info] Work Effort Summary
> Refactor authentication to use JWT tokens instead of sessions

## Quick Nav
- [[README|Tool Bag]]
- [[work_effort_tracker|Tracker]]
- [[#Next Actions]] ⚡

## Next Actions ⚡

### Immediate
- [ ] Migrate user model @computer #priority-high ~1hr
- [ ] Update auth middleware @computer #priority-high ~30min

### Soon
- [ ] Write migration tests @computer #priority-medium ~45min
- [ ] Update documentation @quick #priority-medium ~20min

## Related Work
- [[WE-260108-user-model|User Model]] - Dependency
- [[WE-260112-api-v2|API v2]] - Will use this

#work-effort/WE-260111-auth-refactor #refactor #high-priority
```

### Example 2: Dataview Dashboard

Create `_work_efforts/Dashboard.md`:

```markdown
# Work Efforts Dashboard

## 🔥 High Priority

```dataview
TABLE status, completion, updated
FROM #work-effort
WHERE priority = "high"
AND status != "completed"
SORT updated DESC
```

## 🚧 In Progress

```dataview
TABLE completion, updated
FROM #work-effort
WHERE status = "in-progress"
SORT completion DESC
```

## ⚡ Quick Wins Available

```dataview
TASK
FROM #work-effort
WHERE contains(text, "@quick")
AND !completed
LIMIT 10
```

## 🔴 Blocked

```dataview
TABLE status, updated
FROM #work-effort
WHERE status = "blocked"
```
```

---

## Troubleshooting

### Wikilinks Not Working

**Issue**: Links don't navigate
**Solution**: Ensure files exist and paths are correct. Use Obsidian's link autocomplete.

### Dataview Not Showing Results

**Issue**: Queries return empty
**Solution**:
- Check Dataview plugin is enabled
- Verify tags match exactly (case-sensitive)
- Ensure frontmatter YAML is valid

### Tags Not Organizing

**Issue**: Tags don't show in tag pane
**Solution**:
- Remove spaces: `#work-effort`, not `#work effort`
- Use hierarchical: `#work-effort/ID`
- Place tags in frontmatter or at end of file

---

## Summary

This system gives you:

✅ **Obsidian**: Rich markdown, wikilinks, callouts, tags
✅ **Zettelkasten**: Atomic notes, unique IDs, bidirectional links
✅ **GTD**: Next actions, contexts, time estimates, priority
✅ **Johnny Decimal**: Organized IDs, clear hierarchy
✅ **Convenience**: One-liners, quick nav, auto-templates

**Most Important**: **Ease of use and convenience!**

---

**Created**: 2026-01-11
**Version**: 1.0
**Last Updated**: 2026-01-11

#obsidian #zettelkasten #gtd #johnny-decimal #productivity #guide
