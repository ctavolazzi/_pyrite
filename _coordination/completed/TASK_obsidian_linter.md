---
status: awaiting_pickup
assigned_to: claude_code
created: 2025-12-31T13:15:00-08:00
created_by: cursor
task_type: tool_development
priority: normal
---

# Task: Obsidian Markdown Linter

## Goal

Build an **Obsidian-style markdown linter tool**.

---

## Before You Start

```bash
git pull origin main
python3 tools/github-health-check/check.py
```

---

## Instructions

**This is a workflow test. Do NOT jump to implementation.**

### Step 1: State Your Understanding
Start your response with:
> "My understanding of the goal is..."

### Step 2: Research
- What Obsidian markdown features exist? (wikilinks, callouts, frontmatter, tags, embeds)
- Browse: https://help.obsidian.md/
- Examine existing markdown in `_work_efforts/` for patterns

### Step 3: Propose Scope
Before creating any work effort:
- What's MVP? What's future?
- Update `_coordination/CONTEXT.md` with your proposal
- Commit and push
- **STOP and wait for Cursor feedback**

### Step 4: Create Work Effort (After Approval)
Only after Cursor approves your scope:
- Use `mcp_work-efforts_create_work_effort`
- Follow pattern from `tools/github-health-check/`

---

## Context Files

| File | Purpose |
|------|---------|
| `_coordination/CONTEXT.md` | Full coordination protocol |
| `tools/github-health-check/check.py` | Pattern to follow |
| `_spin_up/understanding_20251231_1305.md` | Session context |

---

## Coordination

- **Cursor (local):** Monitoring, will review your scope proposal
- **Claude Code:** Research, propose, implement after approval
- **Handoff point:** Your scope proposal commit

---

## Success Criteria

1. Goal clearly identified before any code
2. Obsidian features researched and documented
3. Scope proposed and approved
4. Work effort created with tickets
5. Tool implemented following existing patterns
6. PR created and reviewed

---

**When you find this file, you've found your task. Begin with Step 1.**
