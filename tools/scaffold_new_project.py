#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = []
# ///
"""
Golden Template Project Scaffolder

Creates a new project with Adversarial Verification standards pre-baked in.

Usage:
    uv run tools/scaffold_new_project.py <project_name> [target_directory]

Example:
    uv run tools/scaffold_new_project.py my_new_idea
    uv run tools/scaffold_new_project.py my_new_idea /path/to/projects
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path
from typing import Optional


class ProjectScaffolder:
    """Scaffolds a new project with Golden Template standards."""

    def __init__(self, project_name: str, target_dir: Optional[Path] = None):
        self.project_name = project_name
        self.project_slug = project_name.lower().replace(" ", "_").replace("-", "_")
        self.target_dir = target_dir or Path.cwd() / project_name
        self.template_dir = Path(__file__).parent.parent

    def scaffold(self):
        """Main scaffolding process."""
        print("=" * 80)
        print(f"Golden Template Project Scaffolder")
        print("=" * 80)
        print(f"Project: {self.project_name}")
        print(f"Target: {self.target_dir}")
        print()

        # Step 1: Initialize uv project
        self._init_uv_project()

        # Step 2: Install standard tooling
        self._install_standard_tooling()

        # Step 3: Scaffold documentation
        self._scaffold_documentation()

        # Step 4: Inject validation suite
        self._inject_validation_suite()

        # Step 5: Setup VS Code
        self._setup_vscode()

        # Step 6: Setup GitHub Actions
        self._setup_github_actions()

        # Step 7: Create Justfile
        self._create_justfile()

        # Step 8: Create README
        self._create_readme()

        print()
        print("=" * 80)
        print("✅ Project scaffolded successfully!")
        print("=" * 80)
        print()
        print(f"Next steps:")
        print(f"  1. cd {self.target_dir}")
        print(f"  2. just verify  # Run validation suite")
        print(f"  3. Start developing!")
        print()

    def _run_command(self, cmd: list, cwd: Optional[Path] = None, check: bool = True):
        """Run a command and handle errors."""
        try:
            result = subprocess.run(
                cmd,
                cwd=cwd or self.target_dir,
                check=check,
                capture_output=True,
                text=True
            )
            return result.returncode == 0, result.stdout, result.stderr
        except subprocess.CalledProcessError as e:
            return False, e.stdout, e.stderr

    def _init_uv_project(self):
        """Step 1: Initialize uv project."""
        print("📦 Step 1: Initializing uv project...")

        # Create target directory if it doesn't exist
        self.target_dir.mkdir(parents=True, exist_ok=True)

        # Check if pyproject.toml already exists
        if (self.target_dir / "pyproject.toml").exists():
            print(f"   ⚠️  pyproject.toml already exists, skipping uv init")
            return

        # Run uv init
        success, stdout, stderr = self._run_command(
            ["uv", "init", "--name", self.project_slug, "--no-readme"],
            cwd=self.target_dir.parent if self.target_dir.name == self.project_name else None
        )

        if success:
            print(f"   ✅ uv project initialized")
        else:
            print(f"   ❌ Failed to initialize uv project: {stderr}")
            sys.exit(1)

    def _install_standard_tooling(self):
        """Step 2: Install standard tooling (ruff, pytest, etc.)."""
        print("🔧 Step 2: Installing standard tooling...")

        # Standard dependencies for validation and development
        dev_dependencies = [
            "ruff>=0.1.0",  # Linter/formatter
            "pytest>=7.0.0",  # Testing framework
            "pytest-cov>=4.0.0",  # Coverage plugin
        ]

        for dep in dev_dependencies:
            success, stdout, stderr = self._run_command(
                ["uv", "add", "--dev", dep],
                check=False
            )
            if success:
                print(f"   ✅ Installed {dep}")
            else:
                print(f"   ⚠️  Failed to install {dep}: {stderr[:100]}")

        # Configure ruff in pyproject.toml
        self._configure_ruff()

    def _configure_ruff(self):
        """Add ruff configuration to pyproject.toml."""
        pyproject_path = self.target_dir / "pyproject.toml"

        if not pyproject_path.exists():
            return

        # Read current pyproject.toml
        with open(pyproject_path, 'r') as f:
            content = f.read()

        # Check if ruff config already exists
        if "[tool.ruff]" in content:
            return

        # Add ruff configuration
        ruff_config = """
[tool.ruff]
line-length = 100
target-version = "py310"

[tool.ruff.lint]
select = [
    "E",   # pycodestyle errors
    "W",   # pycodestyle warnings
    "F",   # pyflakes
    "I",   # isort
    "B",   # flake8-bugbear
    "C4",  # flake8-comprehensions
    "UP",  # pyupgrade
]
ignore = []

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
"""

        # Append to pyproject.toml
        with open(pyproject_path, 'a') as f:
            f.write(ruff_config)

        print("   ✅ Configured ruff in pyproject.toml")

    def _scaffold_documentation(self):
        """Step 3: Scaffold _docs directory structure."""
        print("📚 Step 3: Scaffolding documentation structure...")

        # Create _docs structure
        docs_dir = self.target_dir / "_docs"
        standards_dir = docs_dir / "20-29_development" / "standards_category"
        standards_dir.mkdir(parents=True, exist_ok=True)

        # Create master index
        self._create_master_index(docs_dir)

        # Create standards category index
        self._create_standards_index(standards_dir)

        # Copy adversarial verification protocol
        self._copy_verification_protocol(standards_dir)

        print("   ✅ Documentation structure created")

    def _create_master_index(self, docs_dir: Path):
        """Create master documentation index."""
        index_path = docs_dir / "00.00_index.md"

        if index_path.exists():
            return

        content = """# Master Index

## Areas
### 20-29 Development
- [[20-29_development/standards_category/standards_category_index|standards Category]]

"""
        index_path.write_text(content)

    def _create_standards_index(self, standards_dir: Path):
        """Create standards category index."""
        index_path = standards_dir / "standards_category_index.md"

        if index_path.exists():
            return

        content = """# Standards Category Index

## Related Documents
- [[standards.01_adversarial_verification_protocol|Adversarial Verification Protocol]] - Testing standards for project stability validation

## Categories
- [[../../00.00_index|Master Index]] - Project overview

"""
        index_path.write_text(content)

    def _copy_verification_protocol(self, standards_dir: Path):
        """Copy adversarial verification protocol from template."""
        protocol_path = standards_dir / "standards.01_adversarial_verification_protocol.md"

        if protocol_path.exists():
            return

        # Read from template
        template_protocol = self.template_dir / "_docs" / "20-29_development" / "standards_category" / "standards.01_adversarial_verification_protocol.md"

        if template_protocol.exists():
            shutil.copy(template_protocol, protocol_path)
            print("   ✅ Copied Adversarial Verification Protocol")
        else:
            # Create a basic version if template doesn't exist
            self._create_basic_protocol(protocol_path)

    def _create_basic_protocol(self, protocol_path: Path):
        """Create a basic adversarial verification protocol if template is missing."""
        content = """# Adversarial Verification Standard (2026)

**Status**: Active Standard
**Based on**: Pyrite Validation Protocols
**Last Updated**: 2026-01-04

## Purpose

This document defines the **Adversarial Verification Standard** for testing project stability and configuration correctness.

**Core Principle**: Don't just run tests—actively try to break the setup to prove it's robust.

## The Adversarial Verification Checklist

### 1. The "Fresh Clone" Simulation
- Remove lock file and venv
- Run setup from scratch
- Verify everything works

### 2. The "Deleted Venv" Test
- Delete `.venv` folder
- Run script (should auto-recreate venv)

### 3. The "Editable" Linkage Test
- Modify editable dependency
- Verify changes are immediately reflected

### 4. Path Fragility Test
- Execute scripts from different directories
- Ensure relative paths are robust

## Deliverables for Verification

1. Dedicated regression script
2. Machine-readable report (JSON)
3. Adversarial log (markdown)
4. Comprehensive report (markdown)

"""
        protocol_path.write_text(content)

    def _inject_validation_suite(self):
        """Step 4: Inject generic validation test suite."""
        print("🧪 Step 4: Injecting validation test suite...")

        tools_dir = self.target_dir / "tools"
        tools_dir.mkdir(exist_ok=True)

        validation_script = tools_dir / "validation_test.py"

        if validation_script.exists():
            print("   ⚠️  validation_test.py already exists, skipping")
            return

        # Create generic validation test script
        self._create_validation_script(validation_script)

        print("   ✅ Validation test suite created")

    def _create_validation_script(self, script_path: Path):
        """Create a generic validation test script."""
        content = '''#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = []
# ///
"""
Adversarial Validation Test Suite

Tests project stability using the Adversarial Verification Standard.

Usage:
    uv run tools/validation_test.py
"""

import os
import sys
import subprocess
import shutil
import json
from pathlib import Path
from typing import List, Tuple, Optional
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class TestResult:
    """Result of a single test."""
    name: str
    status: str  # PASS, FAIL, WARNING, SKIP
    message: str
    evidence: List[str] = field(default_factory=list)


@dataclass
class TestReport:
    """Complete test report."""
    timestamp: str
    total_tests: int = 0
    passed: int = 0
    failed: int = 0
    warnings: int = 0
    results: List[TestResult] = field(default_factory=list)
    critical_issues: List[str] = field(default_factory=list)


class ProjectValidator:
    """Adversarial validator for project setup."""

    def __init__(self, repo_root: Path):
        self.repo_root = repo_root.resolve()
        self.report = TestReport(timestamp=datetime.now().isoformat())

    def run_all_tests(self):
        """Execute all validation tests."""
        print("=" * 80)
        print("ADVERSARIAL VALIDATION TEST SUITE")
        print("=" * 80)
        print(f"Repository: {self.repo_root}")
        print(f"Started: {self.report.timestamp}")
        print()

        # Test 1: Fresh Clone Simulation
        self._test_fresh_clone()

        # Test 2: Deleted Venv Test
        self._test_deleted_venv()

        # Test 3: Path Fragility
        self._test_path_fragility()

        # Test 4: Configuration Validation
        self._test_configuration()

        # Generate report
        self._generate_report()

    def _add_result(self, result: TestResult):
        """Add a test result."""
        self.report.results.append(result)
        self.report.total_tests += 1

        if result.status == "PASS":
            self.report.passed += 1
            symbol = "✅"
        elif result.status == "FAIL":
            self.report.failed += 1
            symbol = "❌"
            if "CRITICAL" in result.message.upper():
                self.report.critical_issues.append(f"{result.name}: {result.message}")
        elif result.status == "WARNING":
            self.report.warnings += 1
            symbol = "⚠️"
        else:
            symbol = "⏭️"

        print(f"{symbol} {result.name}")
        if result.message:
            print(f"   {result.message}")
        print()

    def _run_command(self, cmd: list, cwd: Optional[Path] = None) -> Tuple[int, str, str]:
        """Run a command."""
        try:
            result = subprocess.run(
                cmd,
                cwd=cwd or self.repo_root,
                capture_output=True,
                text=True,
                timeout=60
            )
            return result.returncode, result.stdout, result.stderr
        except Exception as e:
            return 1, "", str(e)

    def _test_fresh_clone(self):
        """Test 1: Fresh Clone Simulation."""
        lock_file = self.repo_root / "uv.lock"
        venv_dir = self.repo_root / ".venv"

        lock_backup = None
        venv_backup = None

        try:
            # Backup if they exist
            if lock_file.exists():
                lock_backup = self.repo_root / "uv.lock.backup_test"
                shutil.copy(lock_file, lock_backup)
                lock_file.unlink()

            if venv_dir.exists():
                venv_backup = self.repo_root / ".venv_backup_test"
                shutil.copytree(venv_dir, venv_backup)
                shutil.rmtree(venv_dir)

            # Try to sync
            exit_code, stdout, stderr = self._run_command(["uv", "sync"])

            if exit_code == 0:
                # Test that a simple script works
                test_script = self.repo_root / "test_validation_temp.py"
                test_script.write_text('print("OK")')

                exit_code2, stdout2, stderr2 = self._run_command(
                    ["uv", "run", "python", "test_validation_temp.py"]
                )

                test_script.unlink()

                if exit_code2 == 0:
                    self._add_result(TestResult(
                        name="Test 1: Fresh Clone Simulation",
                        status="PASS",
                        message="Setup works from scratch"
                    ))
                else:
                    self._add_result(TestResult(
                        name="Test 1: Fresh Clone Simulation",
                        status="FAIL",
                        message="CRITICAL: Script execution failed after fresh sync",
                        evidence=[stderr2[:200]]
                    ))
            else:
                self._add_result(TestResult(
                    name="Test 1: Fresh Clone Simulation",
                    status="FAIL",
                    message="CRITICAL: uv sync failed",
                    evidence=[stderr[:200]]
                ))

            # Restore backups
            if lock_backup and lock_backup.exists():
                shutil.move(lock_backup, lock_file)
            if venv_backup and venv_backup.exists():
                if venv_dir.exists():
                    shutil.rmtree(venv_dir)
                shutil.move(venv_backup, venv_dir)

        except Exception as e:
            self._add_result(TestResult(
                name="Test 1: Fresh Clone Simulation",
                status="WARNING",
                message=f"Could not complete test: {e}"
            ))

    def _test_deleted_venv(self):
        """Test 2: Deleted Venv Test."""
        venv_dir = self.repo_root / ".venv"
        venv_backup = None

        if not venv_dir.exists():
            self._add_result(TestResult(
                name="Test 2: Deleted Venv Test",
                status="SKIP",
                message="No .venv to test with"
            ))
            return

        try:
            # Backup venv
            venv_backup = self.repo_root / ".venv_backup_test"
            shutil.copytree(venv_dir, venv_backup)

            # Delete venv
            shutil.rmtree(venv_dir)

            # Try to run a script (should auto-recreate)
            test_script = self.repo_root / "test_validation_temp.py"
            test_script.write_text('print("OK")')

            exit_code, stdout, stderr = self._run_command(
                ["uv", "run", "python", "test_validation_temp.py"]
            )

            test_script.unlink()

            if exit_code == 0 and venv_dir.exists():
                self._add_result(TestResult(
                    name="Test 2: Deleted Venv Test",
                    status="PASS",
                    message="uv auto-recreated venv successfully"
                ))
            else:
                self._add_result(TestResult(
                    name="Test 2: Deleted Venv Test",
                    status="FAIL",
                    message="CRITICAL: uv did not auto-recreate venv",
                    evidence=[stderr[:200]]
                ))

            # Restore venv
            if venv_backup.exists():
                if venv_dir.exists():
                    shutil.rmtree(venv_dir)
                shutil.move(venv_backup, venv_dir)

        except Exception as e:
            self._add_result(TestResult(
                name="Test 2: Deleted Venv Test",
                status="WARNING",
                message=f"Could not complete test: {e}"
            ))

    def _test_path_fragility(self):
        """Test 3: Path Fragility Test."""
        # Test running from different directories
        test_script = self.repo_root / "test_validation_temp.py"
        test_script.write_text('import sys; print("OK")')

        # Test from root
        exit_code1, _, _ = self._run_command(
            ["uv", "run", "python", "test_validation_temp.py"]
        )

        # Test from parent
        exit_code2, _, _ = self._run_command(
            ["uv", "run", "python", f"{self.repo_root.name}/test_validation_temp.py"],
            cwd=self.repo_root.parent
        )

        test_script.unlink()

        if exit_code1 == 0 and exit_code2 == 0:
            self._add_result(TestResult(
                name="Test 3: Path Fragility Test",
                status="PASS",
                message="Scripts work from different directories"
            ))
        else:
            self._add_result(TestResult(
                name="Test 3: Path Fragility Test",
                status="WARNING",
                message="Some path scenarios may have issues"
            ))

    def _test_configuration(self):
        """Test 4: Configuration Validation."""
        pyproject = self.repo_root / "pyproject.toml"

        if not pyproject.exists():
            self._add_result(TestResult(
                name="Test 4: Configuration Validation",
                status="FAIL",
                message="CRITICAL: pyproject.toml not found"
            ))
            return

        # Check for ruff config
        content = pyproject.read_text()
        has_ruff = "[tool.ruff]" in content

        if has_ruff:
            self._add_result(TestResult(
                name="Test 4: Configuration Validation",
                status="PASS",
                message="pyproject.toml has ruff configuration"
            ))
        else:
            self._add_result(TestResult(
                name="Test 4: Configuration Validation",
                status="WARNING",
                message="pyproject.toml missing ruff configuration"
            ))

    def _generate_report(self):
        """Generate final test report."""
        print("=" * 80)
        print("VALIDATION REPORT")
        print("=" * 80)
        print()

        print(f"Total Tests: {self.report.total_tests}")
        print(f"✅ Passed: {self.report.passed}")
        print(f"❌ Failed: {self.report.failed}")
        print(f"⚠️  Warnings: {self.report.warnings}")
        print()

        # Determine overall status
        if self.report.failed > 0 or self.report.critical_issues:
            status = "🔴 INVALID"
        elif self.report.warnings > 0:
            status = "🟡 PARTIAL"
        else:
            status = "🟢 VALID"

        print(f"Overall Status: {status}")
        print()

        if self.report.critical_issues:
            print("Critical Issues:")
            for issue in self.report.critical_issues:
                print(f"  ❌ {issue}")
            print()

        # Save JSON report
        report_file = self.repo_root / "validation_report.json"
        try:
            report_data = {
                "timestamp": self.report.timestamp,
                "summary": {
                    "total": self.report.total_tests,
                    "passed": self.report.passed,
                    "failed": self.report.failed,
                    "warnings": self.report.warnings,
                    "status": status
                },
                "critical_issues": self.report.critical_issues,
                "results": [
                    {
                        "name": r.name,
                        "status": r.status,
                        "message": r.message,
                        "evidence": r.evidence
                    }
                    for r in self.report.results
                ]
            }

            with open(report_file, 'w') as f:
                json.dump(report_data, f, indent=2)

            print(f"Report saved to: {report_file}")
        except Exception as e:
            print(f"Could not save report: {e}")


def main():
    """Main entry point."""
    repo_root = Path(__file__).parent.parent.resolve()
    validator = ProjectValidator(repo_root)
    validator.run_all_tests()


if __name__ == "__main__":
    main()
'''
        script_path.write_text(content)
        script_path.chmod(0o755)  # Make executable

    def _setup_vscode(self):
        """Step 5: Setup VS Code settings."""
        print("⚙️  Step 5: Setting up VS Code configuration...")

        vscode_dir = self.target_dir / ".vscode"
        vscode_dir.mkdir(exist_ok=True)

        settings_path = vscode_dir / "settings.json"

        if settings_path.exists():
            print("   ⚠️  .vscode/settings.json already exists, skipping")
            return

        settings = {
            "editor.formatOnSave": True,
            "editor.codeActionsOnSave": {
                "source.fixAll": "explicit",
                "source.organizeImports": "explicit"
            },
            "[python]": {
                "editor.defaultFormatter": "charliermarsh.ruff",
                "editor.formatOnSave": True,
                "editor.codeActionsOnSave": {
                    "source.fixAll": "explicit",
                    "source.organizeImports": "explicit"
                }
            },
            "ruff.enable": True,
            "ruff.organizeImports": True,
            "ruff.fixAll": True
        }

        import json
        with open(settings_path, 'w') as f:
            json.dump(settings, f, indent=2)

        print("   ✅ VS Code settings configured for Ruff")

    def _setup_github_actions(self):
        """Step 6: Setup GitHub Actions CI/CD."""
        print("🚀 Step 6: Setting up GitHub Actions...")

        workflows_dir = self.target_dir / ".github" / "workflows"
        workflows_dir.mkdir(parents=True, exist_ok=True)

        ci_yml = workflows_dir / "ci.yml"

        if ci_yml.exists():
            print("   ⚠️  .github/workflows/ci.yml already exists, skipping")
            return

        ci_content = """name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  validate:
    name: Adversarial Verification
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install uv
        uses: astral-sh/setup-uv@v4
        with:
          version: "latest"

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.10"

      - name: Install dependencies
        run: uv sync

      - name: Run Adversarial Verification
        run: uv run tools/validation_test.py

      - name: Upload validation report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: validation-report
          path: validation_report.json
          retention-days: 30

  test:
    name: Run Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install uv
        uses: astral-sh/setup-uv@v4
        with:
          version: "latest"

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.10"

      - name: Install dependencies
        run: uv sync

      - name: Run tests
        run: uv run pytest

  lint:
    name: Lint and Format Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install uv
        uses: astral-sh/setup-uv@v4
        with:
          version: "latest"

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.10"

      - name: Install dependencies
        run: uv sync

      - name: Check formatting
        run: uv run ruff format --check .

      - name: Check linting
        run: uv run ruff check .
"""

        ci_yml.write_text(ci_content)
        print("   ✅ GitHub Actions workflow created")

    def _create_justfile(self):
        """Step 7: Create Justfile for task automation."""
        print("📋 Step 7: Creating Justfile...")

        justfile_path = self.target_dir / "Justfile"

        if justfile_path.exists():
            print("   ⚠️  Justfile already exists, skipping")
            return

        justfile_content = """# Justfile - Modern task runner
# Install: cargo install just
# Usage: just <recipe>

# Setup project dependencies
setup:
    uv sync

# Run tests
test:
    uv run pytest

# Run adversarial validation suite
verify:
    uv run tools/validation_test.py

# Fix linting and formatting issues
fix:
    uv run ruff check --fix .
    uv run ruff format .

# Format code only
format:
    uv run ruff format .

# Lint code only
lint:
    uv run ruff check .

# Run all checks (lint, format, test, verify)
check: lint format test verify
    @echo "✅ All checks passed!"

# Clean generated files
clean:
    rm -rf .venv
    rm -f uv.lock
    find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    find . -type f -name "*.pyc" -delete
    find . -type f -name "*.pyo" -delete
    find . -type f -name ".coverage" -delete
    find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
    @echo "✅ Cleaned generated files"

# Show available recipes
default:
    @just --list
"""

        justfile_path.write_text(justfile_content)
        print("   ✅ Justfile created")

    def _create_readme(self):
        """Step 6: Create README with project info."""
        readme_path = self.target_dir / "README.md"

        if readme_path.exists():
            print("   ⚠️  README.md already exists, skipping")
            return

        content = f"""# {self.project_name}

## Quick Start

```bash
# Setup project
just setup

# Run validation suite
just verify

# Run tests
just test

# Fix linting and formatting
just fix

# Run all checks
just check
```

Or use `uv run` directly:
```bash
# Run validation suite
uv run tools/validation_test.py

# Run tests
uv run pytest

# Format code
uv run ruff format .

# Lint code
uv run ruff check .
```

## Project Structure

```
{self.project_slug}/
├── _docs/                    # Documentation
│   └── 20-29_development/
│       └── standards_category/  # Adversarial Verification Standard
├── .github/
│   └── workflows/
│       └── ci.yml            # CI/CD pipeline
├── tools/                    # Utility scripts
│   └── validation_test.py    # Adversarial validation suite
├── .vscode/                  # VS Code settings (Ruff configured)
├── Justfile                  # Task runner (just)
├── pyproject.toml            # Project configuration
└── README.md                 # This file
```

## Standards

This project follows the **Adversarial Verification Standard**. See `_docs/20-29_development/standards_category/standards.01_adversarial_verification_protocol.md` for details.

## Development

- **Python**: Managed via `uv`
- **Linting**: `ruff` (configured in pyproject.toml)
- **Testing**: `pytest`
- **Formatting**: `ruff format`
- **Task Runner**: `just` (see `just --list` for all recipes)
- **CI/CD**: GitHub Actions (runs on push/PR)

Always use `uv run` to execute scripts - never activate venvs manually.

## CI/CD

This project includes GitHub Actions workflows that:
- Run Adversarial Verification on every push/PR
- Run test suite
- Check linting and formatting
- Upload validation reports as artifacts

See `.github/workflows/ci.yml` for details.

"""
        readme_path.write_text(content)
        print("   ✅ README.md created")


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: uv run tools/scaffold_new_project.py <project_name> [target_directory]")
        sys.exit(1)

    project_name = sys.argv[1]
    target_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else None

    scaffolder = ProjectScaffolder(project_name, target_dir)
    scaffolder.scaffold()


if __name__ == "__main__":
    main()

