---
status: completed
assigned_to: claude_code
created: 2025-12-31T17:30:00-08:00
created_by: cursor
task_type: tool_development
priority: normal
last_updated: 2026-01-01T02:30:00-08:00
---

# Task: Obsidian Linter Phase 2 - Advanced Features

## Status

**Phase 2A: COMPLETE** ✅ (PR #14 merged)
- Task list validation (`- [ ]`, `- [x]`)
- Auto-fix `[X]` → `[x]`
- Add missing spaces after checkboxes
- Skip task lists in code blocks

**Phase 2B: COMPLETE** ✅ (Feature branch: claude/phase-2b-advanced-markdown)
- Callout validation (type checking against Obsidian standards)
- Tag validation (format checking, consecutive slash detection)
- Embed validation (file existence checking)
- Code block validation (fence matching, language specifier warnings)

---

## What's Done

| Feature | Status | PR |
|---------|--------|-----|
| Task list validation | ✅ Complete | #14 |
| Task list auto-fix | ✅ Complete | #14 |
| **Callouts** | ✅ Complete | Pending |
| **Tags** | ✅ Complete | Pending |
| **Embeds** | ✅ Complete | Pending |
| **Code blocks** | ✅ Complete | Pending |
| LaTeX | ⚪ Skipped | - |
| Footnotes | ⚪ Skipped | - |
| Comments | ⚪ Skipped | - |
| Highlights | ⚪ Skipped | - |

---

## Implementation Details (Phase 2B)

### Callouts (`check.py:560-594`)
- Pattern: `^>\s*\[!([a-zA-Z-]+)\](.*)$`
- Validates callout type against 24 standard Obsidian types
- Warns on unknown types
- Skips callouts in code blocks

### Tags (`check.py:596-641`)
- Pattern: `(?:^|[^#\w])#([a-zA-Z][\w/-]*)`
- Validates format (must start with letter)
- Detects consecutive slashes
- Skips tags in code blocks

### Embeds (`check.py:643-687`)
- Pattern: `!\[\[([^\]]+)\]\]`
- Validates embedded file existence
- Supports headings and aliases
- Skips embeds in code blocks

### Code Blocks (`check.py:689-722`)
- Pattern: `^```([a-zA-Z0-9_+-]*)\s*$`
- Checks for matched fence pairs
- Warns on missing language specifiers
- Detects unmatched fences

---

## What's Left (Phase 3+)

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

- **2026-01-01 02:30 PST:** Phase 2B (callouts, tags, embeds, code blocks) implemented on feature branch
- **2025-12-31 18:15 PST:** Phase 2A (task lists) merged via PR #14
- **2025-12-31 17:30 PST:** Task created by Cursor

## Next Steps

- Merge Phase 2B branch via PR
- Consider auto-fix implementations for:
  - Tag consecutive slashes (low priority)
  - Callout type corrections (low priority)
- Future: Date validation, LaTeX, footnotes (if needed)
