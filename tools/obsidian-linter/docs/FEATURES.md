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

## Not Yet Supported ❌

### Obsidian-Specific Features
- ❌ **Callouts** - `> [!note]`, `> [!warning]`, `> [!tip]`, etc.
  - Not checked for syntax errors
  - Not validated for proper nesting
  - Not auto-fixed

- ❌ **Tags** - `#tag` syntax
  - Not indexed or validated
  - Not checked for consistency
  - Not checked for broken tag references

- ❌ **Embeds** - `![[file]]` syntax
  - Not validated (target file existence)
  - Not checked for broken embeds
  - Not auto-fixed

- ❌ **Dates** - Date linking `[[2025-12-31]]`, date formatting
  - Not validated
  - Not checked for format consistency

- ❌ **Code Blocks** - Syntax highlighting validation
  - Not checked for valid language tags
  - Not validated for proper closing

- ❌ **Task Lists** - `- [ ]` and `- [x]` syntax
  - Not checked for consistency
  - Not validated for proper nesting

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

## Planned for Phase 2 🚧

See `_coordination/tasks/TASK_obsidian_linter_phase2.md` for the full Phase 2 scope.

**Priority Features:**
1. Callout syntax checking
2. Tag validation and indexing
3. Embed validation
4. Date linking validation
5. Code block syntax validation

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
| Callouts | ❌ | ❌ | ❌ |
| Tags | ❌ | ❌ | ❌ |
| Embeds | ❌ | ❌ | ❌ |
| Dates | ❌ | ❌ | ❌ |
| Code Blocks | ❌ | ❌ | ❌ |
| Task Lists | ❌ | ❌ | ❌ |
| LaTeX | ❌ | ❌ | ❌ |
| Footnotes | ❌ | ❌ | ❌ |
| Comments | ❌ | ❌ | ❌ |
| Highlights | ❌ | ❌ | ❌ |

---

**Last Updated:** 2025-12-31
**Phase 2 Task:** `_coordination/tasks/TASK_obsidian_linter_phase2.md`

