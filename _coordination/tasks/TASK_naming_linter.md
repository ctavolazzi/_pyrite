# TASK: Build Naming Linter Tool

## Vision

A **permanent utility** that validates and fixes naming conventions across the project. Like `obsidian-linter` but for file/folder naming. Runs continuously, grows with the project, has tests.

## Context

The project has naming conventions defined in AGENTS.md and .cursorrules:
- Work Effort ID: `WE-YYMMDD-xxxx` (e.g., `WE-251231-a1b2`)
- Ticket ID: `TKT-xxxx-NNN` (e.g., `TKT-a1b2-001`)
- Checkpoint ID: `CKPT-YYMMDD-HHMM`

Currently there are violations:
- Old Johnny Decimal folders in `_work_efforts/` (00-09_meta/, 10-19_category/, etc.)
- Files like `10.01_title.md` instead of proper ticket format

## Existing Pattern to Follow

Look at `tools/obsidian-linter/`:
- Main script with `--check` and `--fix` modes
- Scoped validation
- Clear output with violations listed
- Can be run anytime, not just once

---

## Create: `tools/naming-linter/`

```
tools/naming-linter/
├── README.md
├── lint.py
├── rules.py        # All rules in one file (simple start)
└── tests/
    ├── __init__.py
    ├── test_lint.py
    └── fixtures/
        ├── valid/          # Examples of correct naming
        └── invalid/        # Examples of violations
```

---

## CLI Interface

```bash
# Check all naming conventions (default: dry run)
python3 tools/naming-linter/lint.py

# Check specific directory
python3 tools/naming-linter/lint.py --scope _work_efforts

# Fix violations (rename files/folders)
python3 tools/naming-linter/lint.py --fix

# Verbose output
python3 tools/naming-linter/lint.py -v

# Output JSON (for tooling)
python3 tools/naming-linter/lint.py --json
```

---

## Rules to Implement (Start Simple)

### Rule 1: Work Effort Folder Names
```
Pattern: WE-YYMMDD-xxxx_slug/
Valid:   WE-251231-a1b2_mission_control/
Invalid: 10-19_category/
Invalid: WE-251231-mission-control/  (missing suffix)
```

### Rule 2: Work Effort Index Files
```
Pattern: WE-YYMMDD-xxxx_index.md
Valid:   WE-251231-a1b2_index.md
Invalid: index.md
Invalid: WE-251231-a1b2.md
```

### Rule 3: Ticket Files
```
Pattern: TKT-xxxx-NNN_slug.md
Valid:   TKT-a1b2-001_setup_environment.md
Invalid: ticket-001.md
Invalid: TKT-a1b2-1_setup.md  (NNN must be 3 digits)
```

### Rule 4: No Orphaned Johnny Decimal Folders
```
Invalid in _work_efforts/:
  - 00-09_*/
  - 10-19_*/
  - 20-29_*/
  etc.

These belong in _docs/, not _work_efforts/
```

---

## Core Logic: `lint.py`

```python
#!/usr/bin/env python3
"""
Naming Linter - Validates and fixes naming conventions.
Part of the Pyrite toolkit.
"""

import argparse
import re
import sys
from pathlib import Path

# Patterns
WE_FOLDER = re.compile(r'^WE-\d{6}-[a-z0-9]{4}_[\w]+$')
WE_INDEX = re.compile(r'^WE-\d{6}-[a-z0-9]{4}_index\.md$')
TKT_FILE = re.compile(r'^TKT-[a-z0-9]{4}-\d{3}_[\w]+\.md$')
JOHNNY_DECIMAL = re.compile(r'^\d{2}-\d{2}_')

def check_work_efforts(path: Path) -> list[dict]:
    """Check _work_efforts/ for naming violations."""
    violations = []

    for item in path.iterdir():
        if item.is_dir():
            # Check for orphaned Johnny Decimal folders
            if JOHNNY_DECIMAL.match(item.name):
                violations.append({
                    'path': str(item),
                    'rule': 'no_johnny_decimal',
                    'message': f'Johnny Decimal folder should not be in _work_efforts: {item.name}',
                    'fix': 'delete_or_migrate'
                })
            # Check WE folder naming
            elif item.name.startswith('WE-'):
                if not WE_FOLDER.match(item.name):
                    violations.append({
                        'path': str(item),
                        'rule': 'we_folder_format',
                        'message': f'Invalid WE folder format: {item.name}',
                        'fix': 'rename'
                    })
                # Check index file inside
                # Check tickets inside

    return violations

def main():
    parser = argparse.ArgumentParser(description='Validate naming conventions')
    parser.add_argument('--scope', default='_work_efforts', help='Directory to check')
    parser.add_argument('--fix', action='store_true', help='Fix violations')
    parser.add_argument('-v', '--verbose', action='store_true')
    parser.add_argument('--json', action='store_true', help='Output JSON')
    args = parser.parse_args()

    # Run checks
    violations = check_work_efforts(Path(args.scope))

    # Report
    if violations:
        print(f"Found {len(violations)} violations:")
        for v in violations:
            print(f"  ❌ {v['path']}: {v['message']}")
        sys.exit(1)
    else:
        print("✅ All naming conventions valid")
        sys.exit(0)

if __name__ == '__main__':
    main()
```

---

## Fix Logic (When --fix is passed)

### Fix Johnny Decimal → Migrate or Delete

For old files like `10.01_update_system.md`:
1. Parse the file for created date
2. Generate new WE-YYMMDD-xxxx ID
3. Create new folder structure
4. Move content
5. Delete old folder if empty

### Fix Invalid WE Names → Rename

For folders like `WE-251231-mission-control/`:
1. Extract the date portion
2. Generate valid 4-char suffix
3. Rename folder
4. Update index file name inside

---

## Test Fixtures

Create test data that validates the linter works:

```
tests/fixtures/
├── valid/
│   └── _work_efforts/
│       ├── WE-251231-a1b2_valid_effort/
│       │   ├── WE-251231-a1b2_index.md
│       │   └── tickets/
│       │       └── TKT-a1b2-001_valid_ticket.md
│       ├── checkpoints/
│       └── devlog.md
└── invalid/
    └── _work_efforts/
        ├── 10-19_category/           # Johnny Decimal violation
        │   └── 10.01_old_file.md
        ├── WE-251231-bad/            # Missing suffix
        ├── WE-251231-a1b2_effort/
        │   ├── index.md              # Wrong index name
        │   └── tickets/
        │       └── ticket-1.md       # Wrong ticket name
```

---

## Test Cases: `test_lint.py`

```python
def test_valid_structure_passes():
    """Valid naming should return no violations"""

def test_johnny_decimal_detected():
    """Should catch 00-09_*, 10-19_*, etc. folders"""

def test_invalid_we_folder_detected():
    """Should catch WE folders without proper suffix"""

def test_invalid_ticket_detected():
    """Should catch tickets not matching TKT-xxxx-NNN pattern"""

def test_fix_renames_correctly():
    """--fix should rename invalid items properly"""

def test_fix_preserves_content():
    """Content should be identical after fix"""

def test_scope_limits_check():
    """--scope should only check specified directory"""

def test_json_output_format():
    """--json should output valid JSON"""
```

---

## Future Extensibility

The linter can grow to check:
- `_docs/` naming (Johnny Decimal format)
- Checkpoint naming (`CKPT-YYMMDD-HHMM.md`)
- Branch naming (`feature/WE-YYMMDD-xxxx-slug`)
- Commit message format
- File naming in `tools/`

Each becomes a new rule module when needed.

---

## Success Criteria

1. `python3 tools/naming-linter/lint.py` runs without error
2. Detects the 4 current violations (Johnny Decimal folders)
3. `--fix` migrates old files to new format
4. All tests pass
5. Can be run anytime as part of development workflow
6. README explains usage

---

## Constraints

- Python 3.8+, minimal dependencies
- Follow existing `tools/` patterns
- Simple first (one `rules.py`), refactor to modules later if needed
- Output matches `obsidian-linter` style where possible

