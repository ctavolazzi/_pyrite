# Golden Template Project Scaffolder

## Overview

The `scaffold_new_project.py` script automates the creation of new projects with Adversarial Verification standards pre-baked in.

## Usage

```bash
# Scaffold a new project in current directory
uv run tools/scaffold_new_project.py my_new_idea

# Scaffold in a specific directory
uv run tools/scaffold_new_project.py my_new_idea /path/to/projects
```

## What It Creates

### 1. UV Project Initialization
- Runs `uv init` to create a new Python project
- Sets up `pyproject.toml` with proper project metadata

### 2. Standard Tooling
- Installs `ruff` (linter/formatter)
- Installs `pytest` (testing framework)
- Installs `pytest-cov` (coverage plugin)
- Configures `ruff` in `pyproject.toml`

### 3. Documentation Structure
- Creates `_docs/` directory with Johnny Decimal structure
- Sets up `standards_category` with:
  - `standards_category_index.md`
  - `standards.01_adversarial_verification_protocol.md` (copied from template)

### 4. Validation Suite
- Creates `tools/validation_test.py` - generic adversarial validation script
- Implements all 4 Adversarial Verification tests:
  - Fresh Clone Simulation
  - Deleted Venv Test
  - Path Fragility Test
  - Configuration Validation

### 5. VS Code Configuration
- Creates `.vscode/settings.json` with:
  - Ruff as default formatter
  - Format on save enabled
  - Fix on save enabled
  - Organize imports on save

### 6. README
- Creates `README.md` with:
  - Quick start commands
  - Project structure overview
  - Standards reference
  - Development guidelines

## Generated Project Structure

```
my_new_idea/
├── _docs/
│   ├── 00.00_index.md
│   └── 20-29_development/
│       └── standards_category/
│           ├── standards_category_index.md
│           └── standards.01_adversarial_verification_protocol.md
├── tools/
│   └── validation_test.py
├── .vscode/
│   └── settings.json
├── pyproject.toml
├── uv.lock
└── README.md
```

## Next Steps After Scaffolding

1. **Run Validation Suite:**
   ```bash
   cd my_new_idea
   uv run tools/validation_test.py
   ```

2. **Start Developing:**
   ```bash
   # Add your dependencies
   uv add <package>

   # Run your code
   uv run python script.py

   # Run tests
   uv run pytest
   ```

3. **Format and Lint:**
   ```bash
   # Format code
   uv run ruff format .

   # Lint code
   uv run ruff check .
   ```

## Standards Compliance

The scaffolded project is immediately compliant with:
- ✅ Adversarial Verification Standard
- ✅ UV stack (no legacy tools)
- ✅ Ruff for linting/formatting
- ✅ Stateless execution (always use `uv run`)

## Customization

After scaffolding, you can:
- Add project-specific dependencies
- Customize `pyproject.toml`
- Add additional documentation
- Extend the validation suite

## Requirements

- `uv` must be installed and in PATH
- Python 3.10+ available
- Write permissions to target directory

## Troubleshooting

**Issue: `uv init` fails**
- Ensure `uv` is installed: `curl -LsSf https://astral.sh/uv/install.sh | sh`
- Check target directory permissions

**Issue: Dependencies fail to install**
- Check internet connection
- Verify `uv` can access PyPI

**Issue: VS Code settings not working**
- Install Ruff extension: `charliermarsh.ruff`
- Reload VS Code window

---

**Last Updated**: 2026-01-04
**Status**: Production Ready

