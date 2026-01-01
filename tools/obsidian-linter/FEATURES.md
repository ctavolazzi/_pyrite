# Obsidian Markdown Features - Coverage Matrix

This document tracks which Obsidian markdown features are checked, fixed, and validated by our tools.

## Currently Supported ✅

### Checked & Fixed
- ✅ **Frontmatter** - YAML syntax, standard fields (`id`, `title`, `status`, `created`)
- ✅ **Wikilinks** - `[[target]]` and `[[target|alias]]` syntax, broken link detection
- ✅ **Unlinked References** - Auto-converts ticket/work effort IDs to wikilinks with aliases
- ✅ **Formatting** - Trailing whitespace, final newline, heading hierarchy

### Validated Only
- ✅ **Duplicate IDs** - Collision detection in frontmatter
- ✅ **Broken Links** - Wikilink target validation
- ✅ **File Naming** - Consistency checks
- ✅ **Orphaned Files** - Files not linked from anywhere
- ✅ **Case Sensitivity** - Potential case conflicts

## Phase 2B: Advanced Markdown Features ✅

- ✅ **Callouts** - `> [!note]`, `> [!warning]`, `> [!tip]`, etc. (Phase 2B - IMPLEMENTED)
  - Validated: Checks callout type against Obsidian's standard types
  - Warns on unknown callout types (note, warning, tip, danger, info, etc.)
  - Skips callouts in code blocks

- ✅ **Tags** - `#tag` syntax (Phase 2B - IMPLEMENTED)
  - Validated: Tag format (must start with letter, alphanumeric/dash/underscore/slash)
  - Detects: Consecutive slashes in tags (e.g., `#bad//tag`)
  - Skips tags in code blocks

- ✅ **Embeds** - `![[file]]` syntax (Phase 2B - IMPLEMENTED)
  - Validated: Embedded file existence
  - Supports: Headings `![[file#heading]]` and aliases `![[file|alias]]`
  - Warns on broken embed targets
  - Skips embeds in code blocks

- ✅ **Code Blocks** - Syntax highlighting validation (Phase 2B - IMPLEMENTED)
  - Validated: Checks for matched fence pairs (opening/closing ```)
  - Warns: Missing language specifiers (informational)
  - Detects: Unmatched code fences

- ✅ **Task Lists** - `- [ ]` and `- [x]` syntax (Phase 2A - IMPLEMENTED)
  - Checked: Uppercase [X] vs lowercase [x], missing spaces
  - Auto-fixed: Normalizes [X] → [x], adds missing spaces
  - Skips task lists in code blocks

## Not Yet Supported ❌

### Obsidian-Specific Features
- ❌ **Dates** - Date linking `[[2025-12-31]]`, date formatting
  - Not validated
  - Not checked for format consistency

- ❌ **LaTeX/Math** - `$...$` and `$$...$$` syntax
  - Not validated
  - Not checked for proper closing

- ❌ **Footnotes** - `[^1]` syntax
  - Not validated
  - Not checked for broken references

- ❌ **Comments** - `%%comment%%` syntax
  - Not checked
  - Not validated

- ❌ **Highlights** - `==text==` syntax
  - Not checked
  - Not validated

- ❌ **Block References** - `![[file#^block-id]]` syntax
  - Not validated
  - Not checked for broken references

- ❌ **Aliases** - Multiple aliases in frontmatter
  - Not validated
  - Not checked for consistency

## Completed: Phase 2 ✅

**Phase 2A** (Task Lists) - Completed 2025-12-31
**Phase 2B** (Callouts, Tags, Embeds, Code Blocks) - Completed 2026-01-01

See `_coordination/tasks/TASK_obsidian_linter_phase2.md` for details.

## Current Limitations

1. **Wikilink Resolution**
   - Links like `[[TKT-25qq-001]]` won't resolve if file is `TKT-25qq-001_title.md`
   - **Solution**: Use aliases `[[TKT-25qq-001_title|TKT-25qq-001]]` (now fixed in fix-links.py)

2. **Relative Paths**
   - Complex relative paths may not resolve correctly
   - Obsidian's path resolution is more sophisticated than our simple matching

3. **Frontmatter Parsing**
   - Simple YAML parser (basic `key: value` pairs only)
   - Doesn't handle complex YAML structures

4. **No Auto-Fix for Advanced Features**
   - Callouts, tags, embeds require manual fixing
   - No validation means issues go undetected

## Usage Recommendations

### For Maximum Obsidian Compatibility

1. **Use aliases for ticket links:**
   ```markdown
   [[TKT-25qq-001_define_tool_architecture|TKT-25qq-001]]
   ```

2. **Use full filenames for work efforts:**
   ```markdown
   [[WE-251231-25qq_index|WE-251231-25qq]]
   ```

3. **Check manually for:**
   - Callout syntax errors
   - Broken embeds
   - Tag consistency
   - Date format consistency

### Tool Coverage

| Feature | Checked | Fixed | Validated |
|---------|---------|-------|-----------|
| Frontmatter | ✅ | ⚠️ Partial | ✅ |
| Wikilinks | ✅ | ✅ | ✅ |
| Unlinked IDs | ✅ | ✅ | ✅ |
| Formatting | ✅ | ✅ | ❌ |
| **Callouts** | ✅ | ❌ | ✅ |
| **Tags** | ✅ | ⚠️ Partial | ✅ |
| **Embeds** | ✅ | ❌ | ✅ |
| Dates | ❌ | ❌ | ❌ |
| **Code Blocks** | ✅ | ❌ | ✅ |
| Task Lists | ✅ | ✅ | ❌ |
| LaTeX | ❌ | ❌ | ❌ |
| Footnotes | ❌ | ❌ | ❌ |
| Comments | ❌ | ❌ | ❌ |
| Highlights | ❌ | ❌ | ❌ |

---

**Last Updated:** 2026-01-01
**Phase 2 Complete:** See `_coordination/tasks/TASK_obsidian_linter_phase2.md`

