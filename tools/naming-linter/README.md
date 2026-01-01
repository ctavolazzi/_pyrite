# Naming Linter - Work Effort Naming Validator

## Overview

The Naming Linter validates and fixes work effort naming conventions to ensure consistency across the `_pyrite` repository.

## Purpose

Unlike the work-effort-migrator (which was a one-time migration tool), the naming linter is a **continuous validation tool** that:

- Runs during development to catch naming violations
- Can be integrated into CI/CD pipelines
- Validates existing work efforts
- Auto-fixes common violations
- Prevents naming inconsistencies from accumulating

## Validated Patterns

### Work Effort Folders
- **Pattern**: `WE-YYMMDD-xxxx_description/`
- **Example**: `WE-260101-a1b2_build_authentication/`
- **Rules**:
  - Must start with `WE-`
  - Date part: 6 digits (YYMMDD format)
  - Suffix: 4 lowercase hex characters
  - Description: lowercase with underscores

### Index Files
- **Pattern**: `WE-YYMMDD-xxxx_index.md`
- **Example**: `WE-260101-a1b2_index.md`
- **Rules**:
  - Must match parent folder's WE ID
  - Must end with `_index.md`

### Ticket Files
- **Pattern**: `TKT-YYMMDD-NNN_description.md`
- **Example**: `TKT-260101-001_setup_environment.md`
- **Rules**:
  - Must start with `TKT-`
  - Date part: 6 digits (YYMMDD), **must match parent WE date**
  - Sequence: 3 digits (001-999)
  - Description: lowercase with underscores

### YAML Frontmatter
- **Required fields**: `id`, `title`, `status`, `created`
- **ID validation**: Frontmatter `id` must match filename/folder

## Usage

### Check Mode (Read-Only)

Check all work efforts:
```bash
python3 tools/naming-linter/lint.py --check
```

Check specific work effort:
```bash
python3 tools/naming-linter/lint.py --check --path _work_efforts/WE-260101-a1b2_test/
```

Verbose output:
```bash
python3 tools/naming-linter/lint.py --check --verbose
```

### Fix Mode (Auto-Repair)

Preview fixes without applying:
```bash
python3 tools/naming-linter/lint.py --fix --dry-run
```

Apply fixes automatically:
```bash
python3 tools/naming-linter/lint.py --fix
```

## Violation Types

| Type | Description | Auto-Fix |
|------|-------------|----------|
| `INVALID_FOLDER_NAME` | Folder name doesn't match WE pattern | ❌ Manual |
| `INVALID_INDEX_NAME` | Index file has wrong name | ✅ Auto |
| `MISSING_INDEX_FILE` | No index file found | ❌ Manual |
| `MISSING_FRONTMATTER` | Index missing YAML frontmatter | ❌ Manual |
| `INVALID_YAML` | Malformed YAML syntax | ❌ Manual |
| `MISSING_FRONTMATTER_FIELD` | Required field missing | ✅ Auto |
| `ID_MISMATCH` | Frontmatter ID ≠ folder/file ID | ✅ Auto |
| `INVALID_TICKET_NAME` | Ticket filename doesn't match pattern | 🚧 Planned |
| `TICKET_DATE_MISMATCH` | Ticket date ≠ parent WE date | 🚧 Planned |

## Common Issues Found

### Issue 1: Tickets Using Hex Suffix Instead of Date

**Problem**: Many tickets use the WE hex suffix instead of date part

❌ **Wrong**:
```
WE-260101-5cc6_demo/
└── tickets/
    └── TKT-5cc6-001_setup.md    ← Using hex "5cc6"
```

✅ **Correct**:
```
WE-260101-5cc6_demo/
└── tickets/
    └── TKT-260101-001_setup.md  ← Using date "260101"
```

**Why**: Ticket IDs should use the date part for chronological sorting and clarity.

**Fix**: Currently requires manual rename (auto-fix coming soon)

## Integration with Plugin System (v0.9.0)

The naming linter is used by the plugin system to validate generated work efforts:

```python
from tools.naming_linter.rules import validate_we_folder_name

def create_work_effort(task):
    folder_name = generate_folder_name(task)

    # Validate before creating
    error = validate_we_folder_name(folder_name)
    if error:
        raise ValueError(f"Invalid folder name: {error}")

    # Create WE folder...
```

## Development

### Project Structure

```
tools/naming-linter/
├── lint.py                 # Main CLI entry point
├── rules/
│   ├── __init__.py
│   ├── common.py           # Pattern validation utilities
│   └── work_efforts.py     # WorkEffortValidator class
├── tests/
│   ├── fixtures/           # Test data
│   └── test_rules.py       # Unit tests
└── README.md               # This file
```

### Adding New Rules

1. Add pattern to `rules/common.py`:
   ```python
   NEW_PATTERN = re.compile(r'^...$')

   def validate_new_pattern(text: str) -> Optional[str]:
       if not NEW_PATTERN.match(text):
           return "Error message"
       return None
   ```

2. Use in `rules/work_efforts.py`:
   ```python
   def _validate_new_thing(self, path: Path):
       error = validate_new_pattern(path.name)
       if error:
           self.violations.append({...})
   ```

3. Add tests in `tests/test_rules.py`

## Exit Codes

- `0` - No violations found
- `1` - Violations found (or errors occurred)

## Examples

### Example Output: Check Mode

```bash
$ python3 tools/naming-linter/lint.py --check

============================================================
📝 Naming Linter - Work Effort Naming Validator
============================================================
Path: _work_efforts
Mode: CHECK ONLY (read-only)
============================================================

Found 3 violation(s):

1. INVALID_TICKET_NAME
   File: _work_efforts/WE-260101-5cc6_demo/tickets/TKT-5cc6-001_setup.md
   Issue: Ticket file must match pattern: TKT-YYMMDD-NNN_description.md

2. ID_MISMATCH
   File: _work_efforts/WE-260101-a1b2_test/WE-260101-a1b2_index.md
   Issue: Frontmatter ID does not match folder name
   Actual: WE-260101-xxxx
   Expected: WE-260101-a1b2

3. MISSING_FRONTMATTER_FIELD
   File: _work_efforts/WE-260101-c1ny_demo/WE-260101-c1ny_index.md
   Issue: Missing required frontmatter field: created

💡 To fix these violations, run with --fix flag:
   python3 tools/naming-linter/lint.py --fix
```

### Example Output: Fix Mode

```bash
$ python3 tools/naming-linter/lint.py --fix

...

🔧 Applying fixes...

  ✓ Updated ID in: _work_efforts/WE-260101-a1b2_test/WE-260101-a1b2_index.md

✅ Fixed 1 violations!

💡 Run again to verify all issues are resolved.
```

## Comparison to Migration Tool

| Feature | Migration Tool | Naming Linter |
|---------|---------------|---------------|
| **Purpose** | One-time migration | Continuous validation |
| **Complexity** | High (backup/rollback) | Low (simple checks) |
| **When to use** | Legacy → new format | Ongoing development |
| **Modifications** | Moves/renames files | Validates + fixes |
| **CI Integration** | ❌ No | ✅ Yes |

## Future Enhancements

- [ ] Auto-fix for ticket renaming (with frontmatter update)
- [ ] GitHub Action integration
- [ ] Pre-commit hook support
- [ ] JSON output mode for CI
- [ ] Configurable rules via `.naming-lint.yml`
- [ ] Validate checkpoint files
- [ ] Validate documentation structure

## Related

- **Migration Tool**: `tools/work-effort-migrator/` - One-time legacy migration
- **Obsidian Linter**: `tools/obsidian-linter/` - Markdown validation
- **Plugin System**: `plugins/` - Uses linter for validation (v0.9.0)

## Support

Found a bug or have a suggestion? Open an issue or submit a PR!
