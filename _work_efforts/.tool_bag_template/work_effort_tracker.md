---
id: [WORK_EFFORT_ID]-tracker
title: Progress Tracker - [WORK_EFFORT_ID]
type: tracker
status: in-progress
project: [WORK_EFFORT_ID]
created: [DATE]
updated: [DATE]
tags:
  - tracker
  - progress
  - gtd
  - work-effort/[WORK_EFFORT_ID]
contexts:
  - "@computer"
priority: medium
energy: medium
---

# Work Effort Progress Tracker

> [!info] Work Effort Summary
> **ID**: `[WORK_EFFORT_ID]`
> **Description**: [DESCRIPTION]
> **Status**: 🚧 In Progress
> **Started**: [DATE]
> **Updated**: [DATE]

## Quick Nav
- [[README|Tool Bag Home]]
- [[verification_checklist|Verification]]
- [[#Next Actions]] ⚡
- [[#Tasks]]
- [[#Decisions]]

---

## Overview

**Goal**: [Primary objective of this work effort]

**Success Criteria**:
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

---

## Next Actions ⚡

> [!warning] GTD: What Can I Do Right Now?
> Focus on actionable, context-specific next steps

### Immediate (Do Now)
- [ ] [Next action 1] `@computer` `#priority-high` `~5min`
- [ ] [Next action 2] `@deep-work` `#priority-high` `~30min`

### Soon (This Session)
- [ ] [Next action 3] `@quick` `#priority-medium` `~10min`
- [ ] [Next action 4] `@computer` `#priority-medium` `~20min`

### Later (Backlog)
- [ ] [Next action 5] `@research` `#priority-low` `~1hr`

**Context Legend**:
- `@computer` - Need computer
- `@deep-work` - Need focused time
- `@quick` - Quick wins (<15min)
- `@research` - Research/reading
- `@review` - Review/decision needed

**Time Estimates**: `~Xmin` or `~Xhr`

---

## Current Status

**Phase**: [Current phase name]
**Progress**: [X]% complete
**Health**: 🟢 On Track | 🟡 At Risk | 🔴 Blocked

### Summary
[Brief description of current state and what's being worked on]

---

## Tasks

### Completed ✅
- [x] [Task 1] - [Date completed]
- [x] [Task 2] - [Date completed]

### In Progress 🚧
- [ ] [Task 3] - [Started date] - [Owner if applicable]
- [ ] [Task 4] - [Started date] - [Owner if applicable]

### Pending ⏳
- [ ] [Task 5]
- [ ] [Task 6]
- [ ] [Task 7]

---

## Milestones

| Milestone | Target Date | Status | Notes |
|-----------|-------------|--------|-------|
| [Milestone 1] | [Date] | ✅ Complete | [Notes] |
| [Milestone 2] | [Date] | 🚧 In Progress | [Notes] |
| [Milestone 3] | [Date] | ⏳ Pending | [Notes] |

---

## Blockers

### Active Blockers 🔴
1. **[Blocker 1]**
   - Impact: [High/Medium/Low]
   - Description: [What's blocking progress]
   - Resolution: [What's needed to unblock]
   - Owner: [Who's responsible for resolving]

### Resolved Blockers ✅
1. **[Blocker X]** - Resolved [Date]
   - Resolution: [How it was resolved]

---

## Decisions

| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| [Date] | [Decision 1] | [Why this was decided] | [What changed] |
| [Date] | [Decision 2] | [Why this was decided] | [What changed] |

---

## Dependencies

### This Work Effort Depends On
- [ ] [External dependency 1] - Status: [Status]
- [ ] [External dependency 2] - Status: [Status]

### Other Work Efforts Depend On This
- [ ] [WE-YYMMDD-xxxx] - Waiting for: [What they need]

---

## Key Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| [Metric 1] | [Value] | [Goal] | 🟢/🟡/🔴 |
| [Metric 2] | [Value] | [Goal] | 🟢/🟡/🔴 |
| [Metric 3] | [Value] | [Goal] | 🟢/🟡/🔴 |

---

## Timeline

```
[Start]---[Milestone 1]---[Milestone 2]---[Milestone 3]---[Complete]
   ✅          ✅              🚧              ⏳            ⏳
```

**Estimated Completion**: [Date or "TBD"]
**Actual Completion**: [Date when completed]

---

## Notes

### [Date] - [Note Title]
[Detailed notes about progress, challenges, insights, etc.]

### [Date] - [Note Title]
[More notes...]

---

## Quick Reference

**Commands Used**:
- `[Common command 1]`
- `[Common command 2]`

**Key Files**:
- `[Important file 1]`
- `[Important file 2]`

**Resources**:
- [Link 1](url)
- [Link 2](url)

---

## Related Work Efforts

> [!note] Zettelkasten: Linked Knowledge
> Connect this work to other efforts, creating a knowledge graph

### Dependencies
- [[WE-YYMMDD-dependency1|Dependency Description]] - Status: ✅/🚧/⏳
- [[WE-YYMMDD-dependency2|Dependency Description]] - Status: ✅/🚧/⏳

### Related Efforts
- [[WE-YYMMDD-related1|Related Work]] - Connection: [How they're related]
- [[WE-YYMMDD-related2|Related Work]] - Connection: [How they're related]

### Follow-Ups
- [[WE-YYMMDD-followup1|Follow-Up Work]] - Spawned from this effort
- [[WE-YYMMDD-followup2|Follow-Up Work]] - Next phase

---

## Reference Links

### Procedures Used
- [[../../.cursor/procedures/CMD-002_create_work_effort_with_tools|CMD-002]] - Work effort creation
- [[../../.cursor/procedures/ENG-001_engineering_workflow|ENG-001]] - Engineering workflow (if used)

### Commands Used
- `/create-work-effort` - Initial setup
- `/verify` - Verification workflow
- `/checkpoint` - Progress snapshots

### External Resources
- [External Link 1](url) - Description
- [External Link 2](url) - Description

---

## Dataview Queries

> [!tip] Obsidian Dataview Examples
> Use these if you have Dataview plugin installed

```dataview
TABLE status, priority, energy
FROM #work-effort
WHERE contains(file.path, "[WORK_EFFORT_ID]")
SORT priority DESC
```

```dataview
TASK
FROM #work-effort/[WORK_EFFORT_ID]
WHERE contains(text, "@computer")
AND !completed
```

---

**Last Updated**: [DATE]
**Next Review**: [DATE]

#tracker #progress #gtd #work-effort/[WORK_EFFORT_ID]
