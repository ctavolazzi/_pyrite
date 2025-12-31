# Structure Check Tool

Verifies _pyrite repository structure is correct. Composable individual checks.

## Usage

```bash
# Check everything
python3 tools/structure-check/check.py

# Check specific area
python3 tools/structure-check/check.py --check coordination
python3 tools/structure-check/check.py --check work_efforts
python3 tools/structure-check/check.py --check spin_up
python3 tools/structure-check/check.py --check tools

# Auto-fix missing directories
python3 tools/structure-check/check.py --fix

# Quiet mode (only show failures)
python3 tools/structure-check/check.py --quiet
```

## Expected Structure

```
_pyrite/
├── _coordination/           # Cross-AI coordination
│   ├── CONTEXT.md          # Current state
│   ├── tasks/              # Pending tasks
│   └── completed/          # Archived handoffs
├── _work_efforts/          # Work tracking
│   └── devlog.md           # Progress log
├── _spin_up/               # Session initialization
│   └── SPIN_UP_PROCEDURE.md
└── tools/                  # Built tools
    ├── github-health-check/
    └── structure-check/
```

## Design Principles

### Composable Checks
Each check function is independent:
- `check_coordination()` - Just _coordination/
- `check_work_efforts()` - Just _work_efforts/
- `check_spin_up()` - Just _spin_up/
- `check_tools()` - Just tools/
- `check_all()` - Everything

### Configurable Structure
Edit `EXPECTED_STRUCTURE` dict to change what's checked:

```python
EXPECTED_STRUCTURE = {
    "folder_name": {
        "type": "dir",      # "dir" or "file"
        "required": True,   # Must exist
        "children": {...}   # Nested structure
    }
}
```

### Fixable Issues
Some issues can be auto-fixed:
- Missing directories → `mkdir -p`
- Missing files → Not auto-fixed (would need templates)

## Exit Codes

- `0` - All checks passed
- `1` - One or more checks failed

## Adding New Checks

1. Add to `EXPECTED_STRUCTURE` config
2. Or create a new check function:

```python
def check_my_feature(repo_root: Path) -> list[CheckResult]:
    results = []
    # Your check logic
    results.append(CheckResult(
        name="my_check",
        passed=True,
        message="OK: thing exists"
    ))
    return results

# Register it
CHECKS["my_feature"] = check_my_feature
```

## Integration

### With spin-up
```bash
# In spin-up procedure
python3 tools/structure-check/check.py --quiet
```

### With CI
```yaml
- name: Check structure
  run: python3 tools/structure-check/check.py
```

## Requirements

- Python 3.6+
- No external dependencies

