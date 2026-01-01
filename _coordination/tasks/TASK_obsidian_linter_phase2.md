---
status: awaiting_pickup
assigned_to: claude_code
created: 2025-12-31T17:30:00-08:00
created_by: cursor
task_type: tool_development
priority: normal
---

# Task: Obsidian Linter Phase 2 - Advanced Features

## Goal

Extend the existing Obsidian linter tools to support **advanced Obsidian markdown features**: callouts, tags, embeds, dates, code blocks, and other Obsidian-specific syntax.

---

## Before You Start

```bash
git pull origin main
python3 tools/github-health-check/check.py
python3 tools/obsidian-linter/check.py --scope _work_efforts
```

---

## Context

**Phase 1 Complete:** ✅ Basic linter, link fixer, comprehensive fixer, and validator are all working.

**Current Tools:**
- `check.py` - Basic linter (frontmatter, wikilinks, formatting)
- `fix-links.py` - Auto-fixes unlinked ticket/work effort references
- `fix-all.py` - Comprehensive auto-fixer (formatting + links)
- `validate.py` - Validator (collisions, broken links, orphaned files)

**What's Missing:**
From the original research (see `_coordination/CONTEXT.md`), these Obsidian features were identified but not implemented:
- **Callouts**: `> [!type]` admonitions (note, warning, tip, etc.)
- **Tags**: `#tag` syntax
- **Embeds**: `![[file]]` syntax
- **Dates**: Date linking and formatting
- **Code blocks**: Syntax highlighting validation
- **Task lists**: `- [ ]` and `- [x]` syntax
- **LaTeX**: Math expressions
- **Footnotes**: `[^1]` syntax
- **Comments**: `%%comment%%` syntax
- **Highlights**: `==text==` syntax

---

## Instructions

**This is Phase 2. Build on what exists. Do NOT jump to implementation.**

### Step 1: State Your Understanding
Start your response with:
> "My understanding of the goal is to extend the existing Obsidian linter tools to support advanced Obsidian markdown features that were identified in Phase 1 but not yet implemented..."

### Step 2: Research & Assess
1. **Review existing tools:**
   - Read `tools/obsidian-linter/check.py`
   - Read `tools/obsidian-linter/fix-all.py`
   - Read `tools/obsidian-linter/validate.py`
   - Understand the patterns and architecture

2. **Research Obsidian features:**
   - Browse: https://help.obsidian.md/
   - Focus on: callouts, tags, embeds, dates, code blocks
   - Check: What validation/checking makes sense for each?

3. **Assess current usage:**
   - Search `_work_efforts/` for callouts, tags, embeds
   - Search `_docs/` for these features
   - Determine: Which features are actually used? Which should we prioritize?

### Step 3: Propose Scope
Before creating any work effort:

1. **Prioritize features:**
   - Which are most commonly used in _pyrite?
   - Which have the most validation value?
   - Which are easiest to implement?

2. **Design approach:**
   - Extend existing `check.py` or create new modules?
   - Add to `fix-all.py` or create separate fixers?
   - How to handle edge cases?

3. **Update `_coordination/CONTEXT.md`** with your proposal:
   - Feature list with priorities
   - Implementation approach
   - Testing strategy
   - **STOP and wait for Cursor feedback**

### Step 4: Create Work Effort (After Approval)
Only after Cursor approves your scope:
- Use `mcp_work-efforts_create_work_effort`
- Follow pattern from existing tools
- Create tickets for each feature/phase

---

## Context Files

| File | Purpose |
|------|---------|
| `_coordination/CONTEXT.md` | Full coordination protocol + Phase 1 history |
| `tools/obsidian-linter/check.py` | Existing linter to extend |
| `tools/obsidian-linter/fix-all.py` | Existing fixer to extend |
| `tools/obsidian-linter/validate.py` | Existing validator to extend |
| `tools/github-health-check/` | Pattern to follow |
| `_work_efforts/` | Real-world test cases |

---

## Coordination

- **Cursor (local):** Monitoring, will review your scope proposal
- **Claude Code:** Research, propose, implement after approval
- **Handoff point:** Your scope proposal commit

---

## Success Criteria

1. ✅ Goal clearly identified before any code
2. ✅ Obsidian advanced features researched and documented
3. ✅ Scope proposed with priorities and approach
4. ✅ Scope approved by Cursor
5. ✅ Work effort created with tickets
6. ✅ Tools extended following existing patterns
7. ✅ All new features tested on real `_work_efforts/` files
8. ✅ Documentation updated
9. ✅ PR created and reviewed

---

## Key Considerations

1. **Maintain zero dependencies** - Pure Python stdlib only
2. **Follow existing patterns** - Don't reinvent the wheel
3. **Backward compatible** - Don't break existing functionality
4. **Real-world testing** - Use actual `_work_efforts/` files
5. **Incremental** - Can we ship features one at a time?

---

**When you find this file, you've found your task. Begin with Step 1.**

