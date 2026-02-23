#!/usr/bin/env python3
"""
The Blend Architecture: Comprehensive Adversarial Validation Test Suite

Systematically tests all aspects of the editable dependency setup to find
issues, edge cases, and potential failures.
"""

import os
import sys
import subprocess
import shutil
import tempfile
import json
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class TestResult:
    """Result of a single test."""
    name: str
    phase: str
    status: str  # PASS, FAIL, WARNING, SKIP
    message: str
    evidence: List[str] = field(default_factory=list)
    command: Optional[str] = None
    output: Optional[str] = None


@dataclass
class TestReport:
    """Complete test report."""
    timestamp: str
    total_tests: int = 0
    passed: int = 0
    failed: int = 0
    warnings: int = 0
    skipped: int = 0
    results: List[TestResult] = field(default_factory=list)
    critical_issues: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)


class BlendValidator:
    """Comprehensive validator for The Blend architecture setup."""

    def __init__(self, repo_root: Path):
        self.repo_root = repo_root.resolve()
        self.report = TestReport(timestamp=datetime.now().isoformat())
        self.original_cwd = Path.cwd()
        self.backup_dirs = {}

    def run_all_tests(self):
        """Execute all validation tests."""
        print("=" * 80)
        print("THE BLEND ARCHITECTURE: ADVERSARIAL VALIDATION")
        print("=" * 80)
        print(f"Repository: {self.repo_root}")
        print(f"Started: {self.report.timestamp}")
        print()

        # Phase 1: Basic Functionality
        self._phase_1_basic_functionality()

        # Phase 2: Path and Directory Edge Cases
        self._phase_2_path_edge_cases()

        # Phase 3: Environment and Virtual Environment Tests
        self._phase_3_environment_tests()

        # Phase 4: Configuration Validation
        self._phase_4_configuration_validation()

        # Phase 5: Dependency and Conflict Detection
        self._phase_5_dependency_tests()

        # Phase 6: Verification Script Logic
        self._phase_6_verification_script()

        # Phase 7: Cross-Environment Compatibility
        self._phase_7_cross_environment()

        # Phase 8: Git and Version Control
        self._phase_8_git_tests()

        # Generate final report
        self._generate_report()

    def _add_result(self, result: TestResult):
        """Add a test result to the report."""
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
            self.report.skipped += 1
            symbol = "⏭️"

        print(f"{symbol} [{result.phase}] {result.name}")
        if result.message:
            print(f"   {result.message}")
        if result.evidence:
            for evidence in result.evidence[:3]:  # Show first 3 lines
                print(f"   → {evidence}")
        print()

    def _run_command(self, cmd: List[str], cwd: Optional[Path] = None,
                    capture_output: bool = True) -> Tuple[int, str, str]:
        """Run a command and return exit code, stdout, stderr."""
        try:
            result = subprocess.run(
                cmd,
                cwd=cwd or self.repo_root,
                capture_output=capture_output,
                text=True,
                timeout=60
            )
            return result.returncode, result.stdout, result.stderr
        except subprocess.TimeoutExpired:
            return 1, "", "Command timed out after 60 seconds"
        except Exception as e:
            return 1, "", str(e)

    def _check_file_exists(self, path: Path) -> bool:
        """Check if a file exists."""
        return path.exists() and path.is_file()

    def _check_dir_exists(self, path: Path) -> bool:
        """Check if a directory exists."""
        return path.exists() and path.is_dir()

    # Phase 1: Basic Functionality Tests
    def _phase_1_basic_functionality(self):
        """Test 1.1: Run Verification Script"""
        print("\n" + "=" * 80)
        print("PHASE 1: BASIC FUNCTIONALITY TESTS")
        print("=" * 80 + "\n")

        # Test 1.1: Run Verification Script
        blend_test = self.repo_root / "blend_test.py"
        if not self._check_file_exists(blend_test):
            self._add_result(TestResult(
                name="Test 1.1: Run Verification Script",
                phase="Phase 1",
                status="FAIL",
                message="blend_test.py not found",
                evidence=[f"Expected: {blend_test}"]
            ))
            return

        exit_code, stdout, stderr = self._run_command(
            ["uv", "run", "python", "blend_test.py"]
        )

        if exit_code == 0:
            if "GREEN LIGHTS" in stdout:
                self._add_result(TestResult(
                    name="Test 1.1: Run Verification Script",
                    phase="Phase 1",
                    status="PASS",
                    message="Verification script passes",
                    evidence=[line for line in stdout.split('\n') if line.strip()][:5]
                ))
            else:
                self._add_result(TestResult(
                    name="Test 1.1: Run Verification Script",
                    phase="Phase 1",
                    status="WARNING",
                    message="Script runs but output unclear",
                    evidence=[stdout[:200]]
                ))
        else:
            self._add_result(TestResult(
                name="Test 1.1: Run Verification Script",
                phase="Phase 1",
                status="FAIL",
                message=f"Script failed with exit code {exit_code}",
                evidence=[stderr[:200] if stderr else stdout[:200]]
            ))

        # Test 1.2: Fresh Python Session
        test_code = """
import sys
import os
try:
    import empirica
    empirica_path = os.path.dirname(empirica.__file__) if hasattr(empirica, '__file__') else 'unknown'
    print(f"empirica: {empirica_path}")
except ImportError as e:
    print(f"empirica import failed: {e}")
    sys.exit(1)

try:
    import novasystem
    novasystem_path = os.path.dirname(novasystem.__file__) if hasattr(novasystem, '__file__') else 'unknown'
    print(f"novasystem: {novasystem_path}")
except ImportError as e:
    print(f"novasystem import failed: {e}")
    sys.exit(1)
"""

        exit_code, stdout, stderr = self._run_command(
            ["uv", "run", "python", "-c", test_code]
        )

        if exit_code == 0:
            paths_found = []
            for line in stdout.split('\n'):
                if 'empirica:' in line or 'novasystem:' in line:
                    paths_found.append(line.strip())

            # Check if paths point to local directories
            is_local = all(
                ('site-packages' not in path and 'dist-packages' not in path)
                for path in paths_found
            )

            if is_local:
                self._add_result(TestResult(
                    name="Test 1.2: Fresh Python Session",
                    phase="Phase 1",
                    status="PASS",
                    message="Both packages import from local paths",
                    evidence=paths_found
                ))
            else:
                self._add_result(TestResult(
                    name="Test 1.2: Fresh Python Session",
                    phase="Phase 1",
                    status="FAIL",
                    message="CRITICAL: Packages imported from site-packages, not local",
                    evidence=paths_found
                ))
        else:
            self._add_result(TestResult(
                name="Test 1.2: Fresh Python Session",
                phase="Phase 1",
                status="FAIL",
                message="CRITICAL: Import failed in fresh session",
                evidence=[stderr[:200] if stderr else stdout[:200]]
            ))

        # Test 1.3: Actual Package Usage
        test_code = """
import empirica
import novasystem

# Try to access package structure
empirica_attrs = [x for x in dir(empirica) if not x.startswith('_')]
novasystem_attrs = [x for x in dir(novasystem) if not x.startswith('_')]

print(f"empirica attributes: {len(empirica_attrs)}")
print(f"novasystem attributes: {len(novasystem_attrs)}")
print(f"empirica has __version__: {hasattr(empirica, '__version__')}")
print(f"novasystem has __version__: {hasattr(novasystem, '__version__')}")
"""

        exit_code, stdout, stderr = self._run_command(
            ["uv", "run", "python", "-c", test_code]
        )

        if exit_code == 0:
            self._add_result(TestResult(
                name="Test 1.3: Actual Package Usage",
                phase="Phase 1",
                status="PASS",
                message="Packages have accessible structure",
                evidence=[line for line in stdout.split('\n') if line.strip()][:5]
            ))
        else:
            self._add_result(TestResult(
                name="Test 1.3: Actual Package Usage",
                phase="Phase 1",
                status="WARNING",
                message="Package structure access had issues",
                evidence=[stderr[:200] if stderr else stdout[:200]]
            ))

    # Phase 2: Path and Directory Edge Cases
    def _phase_2_path_edge_cases(self):
        """Test path resolution and edge cases."""
        print("\n" + "=" * 80)
        print("PHASE 2: PATH AND DIRECTORY EDGE CASES")
        print("=" * 80 + "\n")

        # Test 2.1: Different Working Directory
        parent_dir = self.repo_root.parent
        exit_code, stdout, stderr = self._run_command(
            ["uv", "run", "python", str(self.repo_root / "blend_test.py")],
            cwd=parent_dir
        )

        if exit_code == 0:
            self._add_result(TestResult(
                name="Test 2.1: Different Working Directory",
                phase="Phase 2",
                status="PASS",
                message="Script works from parent directory"
            ))
        else:
            self._add_result(TestResult(
                name="Test 2.1: Different Working Directory",
                phase="Phase 2",
                status="WARNING",
                message="Script may require specific working directory",
                evidence=[stderr[:200] if stderr else stdout[:200]]
            ))

        # Test 2.2: Missing Sibling Directories
        empirica_path = self.repo_root.parent / "empirica"
        novasystem_path = self.repo_root.parent / "NovaSystem-Codex"

        if self._check_dir_exists(empirica_path):
            # Temporarily rename
            backup_path = self.repo_root.parent / "empirica_backup_test"
            try:
                shutil.move(str(empirica_path), str(backup_path))
                self.backup_dirs['empirica'] = backup_path

                exit_code, stdout, stderr = self._run_command(
                    ["uv", "run", "python", "-c", "import empirica"]
                )

                if exit_code != 0:
                    self._add_result(TestResult(
                        name="Test 2.2: Missing Sibling Directory (empirica)",
                        phase="Phase 2",
                        status="PASS",
                        message="Correctly fails when directory missing"
                    ))
                else:
                    self._add_result(TestResult(
                        name="Test 2.2: Missing Sibling Directory (empirica)",
                        phase="Phase 2",
                        status="WARNING",
                        message="Import still works when directory missing (cached?)"
                    ))

                # Restore
                shutil.move(str(backup_path), str(empirica_path))
                del self.backup_dirs['empirica']
            except Exception as e:
                self._add_result(TestResult(
                    name="Test 2.2: Missing Sibling Directory",
                    phase="Phase 2",
                    status="SKIP",
                    message=f"Could not test (permission issue?): {e}"
                ))

        # Test 2.4: Case Sensitivity
        test_code = """
try:
    import Empirica
    print("Empirica (capital E) imported")
except ImportError:
    print("Empirica (capital E) failed - expected")

try:
    import NovaSystem
    print("NovaSystem (capital N) imported")
except ImportError:
    print("NovaSystem (capital N) failed - expected")
"""

        exit_code, stdout, stderr = self._run_command(
            ["uv", "run", "python", "-c", test_code]
        )

        # Case-sensitive imports should fail
        if "failed - expected" in stdout or exit_code != 0:
            self._add_result(TestResult(
                name="Test 2.4: Case Sensitivity",
                phase="Phase 2",
                status="PASS",
                message="Package names are case-sensitive as expected"
            ))
        else:
            self._add_result(TestResult(
                name="Test 2.4: Case Sensitivity",
                phase="Phase 2",
                status="WARNING",
                message="Case variations may work (filesystem-dependent)"
            ))

    # Phase 3: Environment and Virtual Environment Tests
    def _phase_3_environment_tests(self):
        """Test environment and virtual environment scenarios."""
        print("\n" + "=" * 80)
        print("PHASE 3: ENVIRONMENT AND VIRTUAL ENVIRONMENT TESTS")
        print("=" * 80 + "\n")

        # Test 3.1: Deleted Virtual Environment
        venv_path = self.repo_root / ".venv"
        venv_backup = None

        if self._check_dir_exists(venv_path):
            try:
                # Backup venv
                venv_backup = self.repo_root / ".venv_backup_test"
                if venv_backup.exists():
                    shutil.rmtree(venv_backup)
                shutil.copytree(venv_path, venv_backup)

                # Remove venv
                shutil.rmtree(venv_path)

                # Recreate
                exit_code, stdout, stderr = self._run_command(["uv", "sync"])

                if exit_code == 0:
                    # Test imports
                    test_code = "import empirica; import novasystem; print('OK')"
                    exit_code2, stdout2, stderr2 = self._run_command(
                        ["uv", "run", "python", "-c", test_code]
                    )

                    if exit_code2 == 0:
                        self._add_result(TestResult(
                            name="Test 3.1: Deleted Virtual Environment",
                            phase="Phase 3",
                            status="PASS",
                            message="Editable dependencies restored after venv recreation"
                        ))
                    else:
                        self._add_result(TestResult(
                            name="Test 3.1: Deleted Virtual Environment",
                            phase="Phase 3",
                            status="FAIL",
                            message="CRITICAL: Imports fail after venv recreation",
                            evidence=[stderr2[:200] if stderr2 else stdout2[:200]]
                        ))
                else:
                    self._add_result(TestResult(
                        name="Test 3.1: Deleted Virtual Environment",
                        phase="Phase 3",
                        status="FAIL",
                        message="uv sync failed after venv deletion",
                        evidence=[stderr[:200] if stderr else stdout[:200]]
                    ))

                # Restore venv
                if venv_backup.exists():
                    if venv_path.exists():
                        shutil.rmtree(venv_path)
                    shutil.move(str(venv_backup), str(venv_path))
            except Exception as e:
                self._add_result(TestResult(
                    name="Test 3.1: Deleted Virtual Environment",
                    phase="Phase 3",
                    status="SKIP",
                    message=f"Could not test: {e}"
                ))

        # Test 3.4: Environment Variable Interference
        env_backup = os.environ.get("PYTHONPATH")
        try:
            os.environ["PYTHONPATH"] = "/tmp/fake_path"
            test_code = "import empirica; print('OK')"
            exit_code, stdout, stderr = self._run_command(
                ["uv", "run", "python", "-c", test_code]
            )

            if exit_code == 0:
                self._add_result(TestResult(
                    name="Test 3.4: Environment Variable Interference",
                    phase="Phase 3",
                    status="PASS",
                    message="uv isolates environment from PYTHONPATH"
                ))
            else:
                self._add_result(TestResult(
                    name="Test 3.4: Environment Variable Interference",
                    phase="Phase 3",
                    status="WARNING",
                    message="PYTHONPATH may interfere with imports"
                ))
        finally:
            if env_backup:
                os.environ["PYTHONPATH"] = env_backup
            elif "PYTHONPATH" in os.environ:
                del os.environ["PYTHONPATH"]

    # Phase 4: Configuration Validation
    def _phase_4_configuration_validation(self):
        """Validate configuration files."""
        print("\n" + "=" * 80)
        print("PHASE 4: CONFIGURATION VALIDATION")
        print("=" * 80 + "\n")

        # Test 4.1: pyproject.toml Syntax
        pyproject_path = self.repo_root / "pyproject.toml"
        if not self._check_file_exists(pyproject_path):
            self._add_result(TestResult(
                name="Test 4.1: pyproject.toml Syntax",
                phase="Phase 4",
                status="FAIL",
                message="CRITICAL: pyproject.toml not found"
            ))
            return

        # Try to parse TOML
        try:
            import tomli
            with open(pyproject_path, 'rb') as f:
                config = tomli.load(f)

            # Check for required sections
            has_sources = "tool" in config and "uv" in config.get("tool", {}) and "sources" in config.get("tool", {}).get("uv", {})
            has_empirica = has_sources and "empirica" in config["tool"]["uv"]["sources"]
            has_novasystem = has_sources and "novasystem" in config["tool"]["uv"]["sources"]

            if has_empirica and has_novasystem:
                self._add_result(TestResult(
                    name="Test 4.1: pyproject.toml Syntax",
                    phase="Phase 4",
                    status="PASS",
                    message="TOML syntax valid, both editable sources defined"
                ))
            else:
                self._add_result(TestResult(
                    name="Test 4.1: pyproject.toml Syntax",
                    phase="Phase 4",
                    status="FAIL",
                    message="CRITICAL: Missing editable source definitions",
                    evidence=[f"empirica: {has_empirica}", f"novasystem: {has_novasystem}"]
                ))
        except ImportError:
            # Try with tomllib (Python 3.11+)
            try:
                import tomllib
                with open(pyproject_path, 'rb') as f:
                    config = tomllib.load(f)
                self._add_result(TestResult(
                    name="Test 4.1: pyproject.toml Syntax",
                    phase="Phase 4",
                    status="PASS",
                    message="TOML syntax valid (using tomllib)"
                ))
            except Exception as e:
                self._add_result(TestResult(
                    name="Test 4.1: pyproject.toml Syntax",
                    phase="Phase 4",
                    status="WARNING",
                    message=f"Could not validate TOML: {e}"
                ))
        except Exception as e:
            self._add_result(TestResult(
                name="Test 4.1: pyproject.toml Syntax",
                phase="Phase 4",
                status="FAIL",
                message=f"CRITICAL: TOML syntax error: {e}"
            ))

        # Test 4.2: Path Resolution
        if has_sources:
            empirica_path = config["tool"]["uv"]["sources"]["empirica"].get("path", "")
            novasystem_path = config["tool"]["uv"]["sources"]["novasystem"].get("path", "")

            # Resolve paths
            empirica_resolved = (self.repo_root / empirica_path).resolve()
            novasystem_resolved = (self.repo_root / novasystem_path).resolve()

            empirica_exists = self._check_dir_exists(empirica_resolved)
            novasystem_exists = self._check_dir_exists(novasystem_resolved)

            if empirica_exists and novasystem_exists:
                self._add_result(TestResult(
                    name="Test 4.2: Path Resolution",
                    phase="Phase 4",
                    status="PASS",
                    message="Both paths resolve to existing directories",
                    evidence=[
                        f"empirica: {empirica_resolved}",
                        f"novasystem: {novasystem_resolved}"
                    ]
                ))
            else:
                self._add_result(TestResult(
                    name="Test 4.2: Path Resolution",
                    phase="Phase 4",
                    status="FAIL",
                    message="CRITICAL: Paths do not resolve correctly",
                    evidence=[
                        f"empirica exists: {empirica_exists} ({empirica_resolved})",
                        f"novasystem exists: {novasystem_exists} ({novasystem_resolved})"
                    ]
                ))

        # Test 4.3: uv.lock Consistency
        lock_path = self.repo_root / "uv.lock"
        if self._check_file_exists(lock_path):
            # Check if lock file references editable paths
            try:
                with open(lock_path, 'r') as f:
                    lock_content = f.read()

                has_empirica_editable = 'empirica' in lock_content and 'editable' in lock_content.lower()
                has_novasystem_editable = 'novasystem' in lock_content and 'editable' in lock_content.lower()

                if has_empirica_editable and has_novasystem_editable:
                    self._add_result(TestResult(
                        name="Test 4.3: uv.lock Consistency",
                        phase="Phase 4",
                        status="PASS",
                        message="Lock file contains editable references"
                    ))
                else:
                    self._add_result(TestResult(
                        name="Test 4.3: uv.lock Consistency",
                        phase="Phase 4",
                        status="WARNING",
                        message="Lock file may not properly reference editable deps"
                    ))
            except Exception as e:
                self._add_result(TestResult(
                    name="Test 4.3: uv.lock Consistency",
                    phase="Phase 4",
                    status="WARNING",
                    message=f"Could not analyze lock file: {e}"
                ))

    # Phase 5: Dependency and Conflict Detection
    def _phase_5_dependency_tests(self):
        """Test dependencies and conflicts."""
        print("\n" + "=" * 80)
        print("PHASE 5: DEPENDENCY AND CONFLICT DETECTION")
        print("=" * 80 + "\n")

        # Test 5.2: Missing Dependencies
        test_code = """
import empirica
import novasystem

# Try to use packages and see if transitive deps are available
try:
    # This will fail if dependencies are missing
    print("empirica imported successfully")
    print("novasystem imported successfully")
except Exception as e:
    print(f"Error: {e}")
    exit(1)
"""

        exit_code, stdout, stderr = self._run_command(
            ["uv", "run", "python", "-c", test_code]
        )

        if exit_code == 0:
            self._add_result(TestResult(
                name="Test 5.2: Missing Dependencies",
                phase="Phase 5",
                status="PASS",
                message="No missing transitive dependencies detected"
            ))
        else:
            self._add_result(TestResult(
                name="Test 5.2: Missing Dependencies",
                phase="Phase 5",
                status="FAIL",
                message="CRITICAL: Missing dependencies detected",
                evidence=[stderr[:300] if stderr else stdout[:300]]
            ))

    # Phase 6: Verification Script Logic
    def _phase_6_verification_script(self):
        """Test verification script logic."""
        print("\n" + "=" * 80)
        print("PHASE 6: VERIFICATION SCRIPT LOGIC")
        print("=" * 80 + "\n")

        blend_test = self.repo_root / "blend_test.py"
        if not self._check_file_exists(blend_test):
            return

        # Read and analyze the script
        try:
            with open(blend_test, 'r') as f:
                script_content = f.read()

            # Check for path validation logic
            has_path_check = 'check_path_is_local' in script_content
            has_working_dir_check = 'verify_working_directory' in script_content
            has_site_packages_check = 'site-packages' in script_content

            if has_path_check and has_working_dir_check and has_site_packages_check:
                self._add_result(TestResult(
                    name="Test 6.1: Path Validation Logic",
                    phase="Phase 6",
                    status="PASS",
                    message="Verification script has required validation functions"
                ))
            else:
                self._add_result(TestResult(
                    name="Test 6.1: Path Validation Logic",
                    phase="Phase 6",
                    status="WARNING",
                    message="Verification script may be missing some checks",
                    evidence=[
                        f"has_path_check: {has_path_check}",
                        f"has_working_dir_check: {has_working_dir_check}",
                        f"has_site_packages_check: {has_site_packages_check}"
                    ]
                ))
        except Exception as e:
            self._add_result(TestResult(
                name="Test 6.1: Path Validation Logic",
                phase="Phase 6",
                status="WARNING",
                message=f"Could not analyze script: {e}"
            ))

    # Phase 7: Cross-Environment Compatibility
    def _phase_7_cross_environment(self):
        """Test cross-environment compatibility."""
        print("\n" + "=" * 80)
        print("PHASE 7: CROSS-ENVIRONMENT COMPATIBILITY")
        print("=" * 80 + "\n")

        # Test 7.1: Alternative Package Managers
        # Check if pip is available
        exit_code, stdout, stderr = self._run_command(["which", "pip"])
        pip_available = exit_code == 0

        if pip_available:
            self._add_result(TestResult(
                name="Test 7.1: Alternative Package Managers",
                phase="Phase 7",
                status="SKIP",
                message="pip available but not tested (uv-specific setup)"
            ))
        else:
            self._add_result(TestResult(
                name="Test 7.1: Alternative Package Managers",
                phase="Phase 7",
                status="SKIP",
                message="pip not available, setup is uv-specific"
            ))

        # Test 7.2: Operating System Differences
        import platform
        os_name = platform.system()
        is_case_sensitive = os_name != "Darwin"  # macOS is case-insensitive by default

        self._add_result(TestResult(
            name="Test 7.2: Operating System Differences",
            phase="Phase 7",
            status="INFO",
            message=f"Running on {os_name} (case-sensitive: {is_case_sensitive})"
        ))

    # Phase 8: Git and Version Control
    def _phase_8_git_tests(self):
        """Test Git and version control aspects."""
        print("\n" + "=" * 80)
        print("PHASE 8: GIT AND VERSION CONTROL")
        print("=" * 80 + "\n")

        # Test 8.1: Lock File Commit Status
        lock_path = self.repo_root / "uv.lock"
        gitignore_path = self.repo_root / ".gitignore"

        if self._check_file_exists(gitignore_path):
            try:
                with open(gitignore_path, 'r') as f:
                    gitignore_content = f.read()

                is_ignored = "uv.lock" in gitignore_content or ".lock" in gitignore_content

                if is_ignored:
                    self._add_result(TestResult(
                        name="Test 8.1: Lock File Commit Status",
                        phase="Phase 8",
                        status="WARNING",
                        message="uv.lock is in .gitignore (may cause issues for other developers)"
                    ))
                else:
                    self._add_result(TestResult(
                        name="Test 8.1: Lock File Commit Status",
                        phase="Phase 8",
                        status="PASS",
                        message="uv.lock is not ignored (recommended for editable deps)"
                    ))
            except Exception:
                pass

        # Test 8.2: Path Portability
        lock_path = self.repo_root / "uv.lock"
        if self._check_file_exists(lock_path):
            try:
                with open(lock_path, 'r') as f:
                    lock_content = f.read()

                # Check for absolute paths
                has_absolute_paths = '/Users/' in lock_content or 'C:\\' in lock_content

                if has_absolute_paths:
                    self._add_result(TestResult(
                        name="Test 8.2: Path Portability",
                        phase="Phase 8",
                        status="WARNING",
                        message="Lock file contains absolute paths (may not be portable)"
                    ))
                else:
                    self._add_result(TestResult(
                        name="Test 8.2: Path Portability",
                        phase="Phase 8",
                        status="PASS",
                        message="Lock file uses relative paths (portable)"
                    ))
            except Exception as e:
                self._add_result(TestResult(
                    name="Test 8.2: Path Portability",
                    phase="Phase 8",
                    status="WARNING",
                    message=f"Could not check lock file: {e}"
                ))

    def _generate_report(self):
        """Generate final test report."""
        print("\n" + "=" * 80)
        print("FINAL VALIDATION REPORT")
        print("=" * 80 + "\n")

        print(f"Total Tests: {self.report.total_tests}")
        print(f"✅ Passed: {self.report.passed}")
        print(f"❌ Failed: {self.report.failed}")
        print(f"⚠️  Warnings: {self.report.warnings}")
        print(f"⏭️  Skipped: {self.report.skipped}")
        print()

        # Determine overall status
        if self.report.failed > 0 or self.report.critical_issues:
            status = "🔴 INVALID"
            if self.report.critical_issues:
                print("CRITICAL ISSUES FOUND:")
                for issue in self.report.critical_issues:
                    print(f"  ❌ {issue}")
                print()
        elif self.report.warnings > 0:
            status = "🟡 PARTIAL"
        else:
            status = "🟢 VALID"

        print(f"Overall Status: {status}")
        print()

        # Generate recommendations
        if self.report.critical_issues:
            self.report.recommendations.append("Fix critical issues before using in production")

        if self.report.warnings > 5:
            self.report.recommendations.append("Address warnings to improve reliability")

        if self.report.recommendations:
            print("Recommendations:")
            for rec in self.report.recommendations:
                print(f"  • {rec}")
            print()

        # Save detailed report to file
        report_file = self.repo_root / "blend_validation_report.json"
        try:
            report_data = {
                "timestamp": self.report.timestamp,
                "summary": {
                    "total": self.report.total_tests,
                    "passed": self.report.passed,
                    "failed": self.report.failed,
                    "warnings": self.report.warnings,
                    "skipped": self.report.skipped,
                    "status": status
                },
                "critical_issues": self.report.critical_issues,
                "recommendations": self.report.recommendations,
                "results": [
                    {
                        "name": r.name,
                        "phase": r.phase,
                        "status": r.status,
                        "message": r.message,
                        "evidence": r.evidence
                    }
                    for r in self.report.results
                ]
            }

            with open(report_file, 'w') as f:
                json.dump(report_data, f, indent=2)

            print(f"Detailed report saved to: {report_file}")
        except Exception as e:
            print(f"Could not save report: {e}")


def main():
    """Main entry point."""
    repo_root = Path(__file__).parent.resolve()
    validator = BlendValidator(repo_root)
    validator.run_all_tests()


if __name__ == "__main__":
    main()

