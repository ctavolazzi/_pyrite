# Obsidian Linter Integration Guide

## Project Integration

The Obsidian linter tools are located in `tools/obsidian-linter/` and can be used throughout the project.

## Quick Access

### From Project Root
```bash
# Unified command (recommended)
python3 tools/obsidian-linter/lint.py --scope _work_efforts

# Individual tools
python3 tools/obsidian-linter/check.py --scope _work_efforts
python3 tools/obsidian-linter/validate.py --scope _work_efforts
python3 tools/obsidian-linter/fix-all.py --scope _work_efforts
```

### From Any Directory
```bash
# Use absolute path or relative from project root
python3 /path/to/_pyrite/tools/obsidian-linter/lint.py --scope _work_efforts
```

## Recommended Usage Points

### 1. Pre-Commit Hook
Add to `.git/hooks/pre-commit`:
```bash
#!/bin/bash
python3 tools/obsidian-linter/lint.py --scope _work_efforts
```

### 2. CI/CD Pipeline
Add to `.github/workflows/ci.yml`:
```yaml
- name: Lint Obsidian Markdown
  run: python3 tools/obsidian-linter/lint.py --scope _work_efforts
```

### 3. Manual Workflow
```bash
# Before committing changes
python3 tools/obsidian-linter/lint.py --scope _work_efforts --fix
```

## Directory Structure

```
tools/obsidian-linter/
├── lint.py              # Unified command (use this!)
├── check.py             # Linter (read-only)
├── fix-links.py         # Link fixer
├── fix-all.py           # Comprehensive fixer
├── validate.py          # Validator
├── README.md            # Full documentation
├── INTEGRATION.md       # This file - integration guide
└── docs/
    ├── FEATURES.md      # Coverage matrix
    └── FRONTMATTER.md   # Frontmatter guide
```
```

## Integration with Other Tools

### MCP Server Integration
The linter can be called from MCP servers:
```python
import subprocess
result = subprocess.run([
    'python3', 
    'tools/obsidian-linter/lint.py',
    '--scope', '_work_efforts'
], capture_output=True)
```

### Script Integration
```python
import sys
from pathlib import Path

# Add tools to path
tools_path = Path(__file__).parent.parent / 'tools' / 'obsidian-linter'
sys.path.insert(0, str(tools_path))

# Import and use
from check import ObsidianLinter
linter = ObsidianLinter(scope='_work_efforts')
```

## Environment Requirements

- Python 3.6+
- No external dependencies (pure stdlib)
- Works on macOS, Linux, Windows

## Exit Codes

- `0` - Success (no errors)
- `1` - Errors found or validation failed

Use in scripts:
```bash
if python3 tools/obsidian-linter/lint.py --scope _work_efforts; then
    echo "All checks passed"
else
    echo "Issues found"
    exit 1
fi
```

---

**Location:** `tools/obsidian-linter/`
**Main Command:** `lint.py`
**Documentation:** `README.md`

