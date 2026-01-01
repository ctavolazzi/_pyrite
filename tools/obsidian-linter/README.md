# Obsidian Markdown Linter

Validates Obsidian-flavored markdown files for syntax, consistency, and common issues.

## Purpose

Checks markdown files for Obsidian-specific features and best practices including frontmatter, wikilinks, and formatting. Helps maintain consistency across your Obsidian vault or documentation.

## What It Checks

- ✅ **Frontmatter** - YAML syntax validity and standard fields
- ✅ **Wikilinks** - Link syntax and broken link detection
- ✅ **Formatting** - Trailing whitespace, heading consistency, final newlines
- ✅ **Structure** - Heading level hierarchy, multiple H1s

## Usage

### Basic Usage

```bash
# Lint entire repository
python3 tools/obsidian-linter/check.py

# Lint specific directory
python3 tools/obsidian-linter/check.py --scope _work_efforts

# Preview fixes without applying
python3 tools/obsidian-linter/check.py --dry-run

# Automatically fix safe issues
python3 tools/obsidian-linter/check.py --fix

# Strict mode (additional warnings)
python3 tools/obsidian-linter/check.py --strict
```

### Command Line Options

```
positional arguments:
  path          Root path to check (default: current directory)

options:
  --scope DIR   Limit checking to specific directory
  --strict      Enable stricter checking
  --fix         Automatically fix issues (safe fixes only)
  --dry-run     Preview fixes without applying
```

## What Gets Fixed Automatically

When using `--fix` or `--dry-run`, the linter can automatically fix:

- **Trailing whitespace** - Removed from end of lines
- **Missing final newline** - Added to end of file

These are "safe" fixes that won't change content meaning.

## Check Categories

### Frontmatter Validation

Checks YAML frontmatter blocks for:
- Valid YAML syntax
- Proper opening/closing `---` markers
- Standard fields: `id`, `title`, `status`, `created`

**Example:**
```markdown
---
id: WE-251231-abc
title: "My Work Effort"
status: active
created: 2025-12-31
---
```

### Wikilink Checking

Validates Obsidian wikilinks:
- Detects `[[target]]` and `[[target|alias]]` syntax
- Checks if link targets exist in repository
- Reports broken links with line numbers

**Note:** Relative path wikilinks (e.g., `[[../../path/file]]`) may be flagged if the target uses a different naming pattern.

### Formatting Checks

- **Trailing whitespace** - Detects and fixes extra spaces/tabs at line ends
- **Final newline** - Ensures files end with newline (POSIX standard)
- **Heading hierarchy** - Warns on skipped heading levels (e.g., H1 → H3)
- **Multiple H1s** - Warns when multiple top-level headings exist

## Output Example

```
📝 Obsidian Markdown Linter
==================================================
Scope: _work_efforts
Files found: 46
==================================================

Issues found:

📄 _work_efforts/example.md
  Line 1: Missing standard fields: id, status
  Line 15: Broken wikilink: [[nonexistent]] - target not found
  Trailing whitespace on 3 line(s)

==================================================
Files checked: 46
Files with issues: 1
❌ Errors: 0
⚠️  Warnings: 2
ℹ️  Info: 1
==================================================

⚠️  2 warning(s) found
```

## Exit Codes

- `0` - No errors (warnings are OK)
- `1` - One or more errors found

## Severity Levels

- **Error (❌)** - Critical issues (malformed YAML, read errors)
- **Warning (⚠️)** - Best practice violations (broken links, missing fields)
- **Info (ℹ️)** - Style suggestions (trailing whitespace, formatting)

## Integration

### Manual Check

Add to your workflow before commits:

```bash
python3 tools/obsidian-linter/check.py --scope _work_efforts --fix
```

### Pre-Commit Hook (Future)

```bash
#!/bin/bash
# .git/hooks/pre-commit
python3 tools/obsidian-linter/check.py --scope _work_efforts
```

### CI/CD (Future)

```yaml
# GitHub Actions example
- name: Lint Markdown
  run: python3 tools/obsidian-linter/check.py
```

## Limitations

- **Simple YAML parser** - Handles basic `key: value` pairs, not complex YAML
- **Relative path wikilinks** - May not resolve all relative path patterns
- **Obsidian-specific features** - Focuses on core features (frontmatter, wikilinks, basic formatting)
- **Not checked**: Callouts, embeds, tags, LaTeX, footnotes (future enhancements)

## Examples

### Check specific directory
```bash
python3 tools/obsidian-linter/check.py --scope _docs
```

### Preview fixes
```bash
python3 tools/obsidian-linter/check.py --dry-run
```

### Fix and check strictly
```bash
python3 tools/obsidian-linter/check.py --fix --strict
```

### Check from different root
```bash
python3 tools/obsidian-linter/check.py /path/to/vault --scope notes
```

## Requirements

- Python 3.6+
- No external dependencies (uses stdlib only)

## Comparison with Other Tools

| Feature | obsidian-linter | markdownlint | mdformat-obsidian |
|---------|----------------|--------------|-------------------|
| Frontmatter validation | ✅ | ⚠️ Basic | ✅ |
| Wikilink checking | ✅ | ❌ | ✅ |
| Broken link detection | ✅ | ❌ | ❌ |
| Auto-fix | ✅ Safe only | ✅ | ✅ |
| Zero dependencies | ✅ | ❌ | ❌ |
| Obsidian-specific | ✅ | ❌ | ✅ |

## Future Enhancements

- Tag validation and indexing
- Callout syntax checking
- Embed validation
- Custom frontmatter schemas
- Pre-commit hook integration
- JSON output for CI
- Configurable rules (`.obsidian-linter.yaml`)

## Development

### Pattern

This tool follows the same pattern as `tools/github-health-check/`:
- Single Python file (stdlib only)
- Class-based architecture
- Clear visual output
- Exit code conventions

### Testing

Test on the current repository:

```bash
# Dry run on entire repo
python3 tools/obsidian-linter/check.py --dry-run

# Test on work efforts
python3 tools/obsidian-linter/check.py --scope _work_efforts --strict
```

## License

MIT (same as parent project)

---

**Created:** 2025-12-31
**Pattern:** Follows `tools/github-health-check/` structure
**Dependencies:** None (pure Python stdlib)
