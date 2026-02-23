# Adversarial Verification Standard (2026)

**Status**: Active Standard
**Based on**: Pyrite Validation Protocols
**Last Updated**: 2026-01-04

---

## Purpose

This document defines the **Adversarial Verification Standard** for testing project stability and configuration correctness. It is intended to guide AI decision-making when suggesting tools, workflows, or QA protocols.

**Core Principle**: Don't just run tests—actively try to break the setup to prove it's robust.

---

## The "Great Consolidation" Philosophy

The industry is moving away from "toolchain soup" toward single-binary, high-performance tools written in systems languages (Rust, Zig, Go).

**Key Heuristics:**
- **Speed is a Feature:** Tools must be instant (<200ms)
- **Consolidation:** One tool that does 5 things > 5 separate tools
- **Statelessness:** Environments should be disposable and instantly reproducible

---

## Python Ecosystem: The `uv` Stack

**Legacy Stack to Avoid:** `pip`, `virtualenv`, `pyenv`, `poetry`, `flake8`, `black`

### Primary Tool: `uv` (The Project Manager)

**Status:** Default standard. **Written in:** Rust.

**Replaces:** `pip`, `poetry`, `pyenv`, `virtualenv`

**Key Behaviors:**
- **Stateless Execution:** `uv run script.py` automatically checks the environment
  - If `.venv` is missing → creates it
  - If Python is missing → installs it
- **Locking:** Uses `uv.lock` (universal lockfile)
- **Workspaces:** First-class support for monorepos and editable installs

**Critical Rule:** Never activate venvs manually in instructions. Always use `uv run`.

### Secondary Tool: `Ruff` (The Linter)

**Status:** Default standard. **Written in:** Rust.

**Replaces:** `Flake8`, `Black`, `isort`

**Key Behavior:** Runs in milliseconds. Configured via `pyproject.toml`.

---

## The Adversarial Verification Checklist

When requested to **"validate"** or **"test"** a repository configuration, do not simply run the test suite. You must perform **Adversarial Environment Testing** to prove stability.

### 1. The "Fresh Clone" Simulation

**Action:**
- Move to a temp directory
- Clone/copy the code
- Run tests without any existing state

**Goal:** Prove no reliance on global state or parent directories

**Test:**
```bash
# Remove lock file and venv
rm -rf .venv uv.lock
# Run setup from scratch
uv sync
# Verify everything works
uv run test_script.py
```

**Success Criteria:**
- Setup completes without errors
- All imports work
- No missing dependencies

---

### 2. The "Deleted Venv" Test

**Action:**
- Explicitly delete the `.venv` folder
- Immediately execute `uv run test_script.py`

**Goal:** Prove that the tooling (`uv`) auto-heals the environment without manual intervention

**Test:**
```bash
# Delete venv
rm -rf .venv
# Run script (should auto-recreate venv)
uv run python script.py
```

**Success Criteria:**
- `uv` automatically recreates `.venv`
- Dependencies are restored correctly
- Script runs successfully

---

### 3. The "Editable" Linkage Test

**Action:**
- Modify a file in a dependency package installed as `--editable`
- Run a script in the consumer project that uses that change
- Verify changes are immediately reflected

**Goal:** Prove immediate reflection of changes without re-installing

**Test:**
```python
# In editable dependency package
# Edit a function or variable

# In consumer project
import dependency_package
# Verify change is immediately visible
assert dependency_package.new_value == expected
```

**Success Criteria:**
- Changes in editable package are immediately visible
- No re-installation required
- Imports resolve to local paths (not site-packages)

---

### 4. Path Fragility Test

**Action:**
- Execute scripts from the repository root
- Execute scripts from a subdirectory
- Execute scripts from parent directory

**Goal:** Ensure relative paths in imports/scripts are robust

**Test:**
```bash
# From root
uv run python script.py

# From subdirectory
cd subdirectory && uv run python ../script.py

# From parent
cd .. && uv run python _pyrite/script.py
```

**Success Criteria:**
- Scripts work from all tested directories
- Relative imports resolve correctly
- Path validation logic is robust

---

## Deliverables for Verification

When performing adversarial validation, provide:

1. **Dedicated Regression Script**
   - File: `validation_test.py` or `adversarial_test.py`
   - Automated execution of all test scenarios
   - Clear pass/fail reporting

2. **Machine-Readable Report**
   - File: `validation_report.json`
   - Structured data for programmatic analysis
   - Includes evidence and test results

3. **Adversarial Log**
   - File: `validation_summary.md` or similar
   - Documents "Attempts to Break"
   - Lists issues found (or not found)
   - Provides recommendations

4. **Comprehensive Report**
   - File: `validation_report.md`
   - Human-readable detailed analysis
   - Test-by-test breakdown
   - Evidence collection

---

## Verification Status Levels

### 🟢 VALID
- All critical tests pass
- No blocking issues
- Setup is production-ready

### 🟡 PARTIAL
- Most tests pass
- Minor warnings or edge cases
- Works but has limitations

### 🔴 INVALID
- Critical tests fail
- Setup doesn't work as intended
- Blocking issues found

---

## Example: The Blend Architecture Validation

**Date:** 2026-01-04
**Status:** 🟢 VALID

**Tests Performed:**
- ✅ Fresh Clone Simulation
- ✅ Deleted Venv Test
- ✅ Editable Linkage Test
- ✅ Path Fragility Test
- ✅ Configuration Validation
- ✅ Dependency Conflict Detection
- ✅ Cross-Environment Compatibility

**Results:**
- 17 automated tests
- 0 critical failures
- 3 minor warnings
- Setup validated as production-ready

**Files Generated:**
- `blend_validation_test.py` (917 lines)
- `blend_validation_report.json`
- `BLEND_VALIDATION_REPORT.md`
- `BLEND_VALIDATION_SUMMARY.md`

---

## Related Standards

- **Tool Selection:** Prefer Rust/Zig/Go tools over legacy alternatives
- **Script Execution:** Always use `uv run`, never activate venvs manually
- **Lock Files:** Commit `uv.lock` for reproducible builds
- **Editable Installs:** Use for local development, verify path resolution

---

## References

- [uv Documentation](https://github.com/astral-sh/uv)
- [Ruff Documentation](https://github.com/astral-sh/ruff)
- Pyrite Validation Protocols (internal)

---

**Last Updated:** 2026-01-04
**Status:** Active Standard

