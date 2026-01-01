---
status: partial_complete
assigned_to: claude_code
created: 2025-12-31T17:30:00-08:00
created_by: cursor
task_type: tool_development
priority: normal
last_updated: 2025-12-31T18:15:00-08:00
---

# Task: Obsidian Linter Phase 2 - Advanced Features

## Status

**Phase 2A: COMPLETE** ✅ (PR #14 merged)
- Task list validation (`- [ ]`, `- [x]`)
- Auto-fix `[X]` → `[x]`
- Add missing spaces after checkboxes
- Skip task lists in code blocks

**Phase 2B: NOT STARTED**
- Callouts, tags, embeds, code blocks, etc.

---

## What's Done

| Feature | Status | PR |
|---------|--------|-----|
| Task list validation | ✅ Complete | #14 |
| Task list auto-fix | ✅ Complete | #14 |
| Callouts | ❌ Not started | - |
| Tags | ❌ Not started | - |
| Embeds | ❌ Not started | - |
| Code blocks | ❌ Not started | - |
| LaTeX | ❌ Not started | - |
| Footnotes | ❌ Not started | - |
| Comments | ❌ Not started | - |
| Highlights | ❌ Not started | - |

---

## What's Left (Phase 2B+)

### Features Not Yet Implemented

From the original research, these features were identified but not implemented:

| Feature | Syntax | Priority | Reason |
|---------|--------|----------|--------|
| Callouts | `> [!type]` | 🟡 Medium | Not currently used in _pyrite |
| Tags | `#tag` | 🟢 Low | Not currently used |
| Embeds | `![[file]]` | 🟢 Low | Not currently used |
| Code blocks | ` ``` ` | 🟡 Medium | Used but no validation |
| LaTeX | `$...$` | ⚪ Skip | Not used |
| Footnotes | `[^1]` | ⚪ Skip | Not used |
| Comments | `%%...%%` | ⚪ Skip | Not used |
| Highlights | `==text==` | ⚪ Skip | Not used |

### Recommendation

**No immediate action needed.** The high-priority feature (task lists) is complete. The remaining features are:
- Not currently used in _pyrite
- Low validation value
- Can be added later if needed

---

## Instructions (If Resuming)

If you want to add more Phase 2 features:

1. **Check current usage:**
   ```bash
   grep -r ">\s*\[!" _work_efforts/     # Callouts
   grep -r "#[a-z]" _work_efforts/       # Tags
   grep -r "!\[\[" _work_efforts/        # Embeds
   ```

2. **If features are found:**
   - Update this task file
   - Propose scope in `CONTEXT.md`
   - Wait for Cursor approval
   - Implement following existing patterns

3. **If features are NOT found:**
   - Close this task as complete
   - Features can be added when actually needed

---

## Context Files

| File | Purpose |
|------|---------|
| `_coordination/CONTEXT.md` | Coordination state |
| `tools/obsidian-linter/check.py` | Linter (includes task list validation) |
| `tools/obsidian-linter/fix-all.py` | Fixer (includes task list fixing) |
| `tools/obsidian-linter/FEATURES.md` | Coverage matrix |

---

## Completion Log

- **2025-12-31 18:15 PST:** Phase 2A (task lists) merged via PR #14
- **2025-12-31 17:30 PST:** Task created by Cursor
