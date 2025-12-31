#!/usr/bin/env python3
"""
Structure Check Tool

Verifies _pyrite repository structure is correct.
Composable individual checks - each check is independent.

Usage:
    python3 tools/structure-check/check.py
    python3 tools/structure-check/check.py --check coordination
    python3 tools/structure-check/check.py --fix
"""

import os
import sys
import argparse
from pathlib import Path
from typing import Callable, NamedTuple


# =============================================================================
# Configuration - Edit this to change expected structure
# =============================================================================

EXPECTED_STRUCTURE = {
    "_coordination": {
        "type": "dir",
        "required": True,
        "children": {
            "CONTEXT.md": {"type": "file", "required": True},
            "tasks": {"type": "dir", "required": True},
            "completed": {"type": "dir", "required": True},
        }
    },
    "_work_efforts": {
        "type": "dir",
        "required": True,
        "children": {
            "devlog.md": {"type": "file", "required": True},
        }
    },
    "_spin_up": {
        "type": "dir",
        "required": True,
        "children": {
            "SPIN_UP_PROCEDURE.md": {"type": "file", "required": True},
        }
    },
    "tools": {
        "type": "dir",
        "required": True,
        "children": {
            "github-health-check": {"type": "dir", "required": True},
            "structure-check": {"type": "dir", "required": True},
        }
    },
}


# =============================================================================
# Check Result Type
# =============================================================================

class CheckResult(NamedTuple):
    name: str
    passed: bool
    message: str
    fixable: bool = False
    fix_action: str = ""


# =============================================================================
# Individual Check Functions - Each is independent and composable
# =============================================================================

def check_path_exists(path: Path, expected_type: str) -> CheckResult:
    """Check if a path exists and is the correct type."""
    name = f"exists:{path.name}"
    
    if not path.exists():
        return CheckResult(
            name=name,
            passed=False,
            message=f"Missing: {path}",
            fixable=(expected_type == "dir"),
            fix_action=f"mkdir -p {path}" if expected_type == "dir" else ""
        )
    
    if expected_type == "dir" and not path.is_dir():
        return CheckResult(name=name, passed=False, message=f"Expected directory, got file: {path}")
    
    if expected_type == "file" and not path.is_file():
        return CheckResult(name=name, passed=False, message=f"Expected file, got directory: {path}")
    
    return CheckResult(name=name, passed=True, message=f"OK: {path}")


def check_structure_recursive(base: Path, structure: dict, results: list) -> None:
    """Recursively check directory structure."""
    for name, spec in structure.items():
        path = base / name
        result = check_path_exists(path, spec["type"])
        results.append(result)
        
        # Recurse into children if directory exists and has children spec
        if result.passed and spec["type"] == "dir" and "children" in spec:
            check_structure_recursive(path, spec["children"], results)


def check_coordination(repo_root: Path) -> list[CheckResult]:
    """Check _coordination structure."""
    results = []
    check_structure_recursive(repo_root, {"_coordination": EXPECTED_STRUCTURE["_coordination"]}, results)
    return results


def check_work_efforts(repo_root: Path) -> list[CheckResult]:
    """Check _work_efforts structure."""
    results = []
    check_structure_recursive(repo_root, {"_work_efforts": EXPECTED_STRUCTURE["_work_efforts"]}, results)
    return results


def check_spin_up(repo_root: Path) -> list[CheckResult]:
    """Check _spin_up structure."""
    results = []
    check_structure_recursive(repo_root, {"_spin_up": EXPECTED_STRUCTURE["_spin_up"]}, results)
    return results


def check_tools(repo_root: Path) -> list[CheckResult]:
    """Check tools structure."""
    results = []
    check_structure_recursive(repo_root, {"tools": EXPECTED_STRUCTURE["tools"]}, results)
    return results


def check_all(repo_root: Path) -> list[CheckResult]:
    """Run all structure checks."""
    results = []
    check_structure_recursive(repo_root, EXPECTED_STRUCTURE, results)
    return results


# =============================================================================
# Check Registry - Add new checks here
# =============================================================================

CHECKS: dict[str, Callable[[Path], list[CheckResult]]] = {
    "all": check_all,
    "coordination": check_coordination,
    "work_efforts": check_work_efforts,
    "spin_up": check_spin_up,
    "tools": check_tools,
}


# =============================================================================
# Output Formatting
# =============================================================================

def print_results(results: list[CheckResult], verbose: bool = True) -> tuple[int, int]:
    """Print results and return (passed, failed) counts."""
    passed = 0
    failed = 0
    
    print("\n🏗️  Structure Check")
    print("=" * 50)
    
    for result in results:
        if result.passed:
            passed += 1
            if verbose:
                print(f"✅ {result.message}")
        else:
            failed += 1
            print(f"❌ {result.message}")
            if result.fixable:
                print(f"   Fix: {result.fix_action}")
    
    print("=" * 50)
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    
    if failed == 0:
        print("\n✨ Structure is healthy!")
    else:
        print("\n⚠️  Structure issues found")
    
    return passed, failed


def apply_fixes(results: list[CheckResult], repo_root: Path) -> int:
    """Apply fixable issues. Returns count of fixes applied."""
    fixes = 0
    
    for result in results:
        if not result.passed and result.fixable and result.fix_action:
            # Only handle mkdir for now
            if result.fix_action.startswith("mkdir"):
                path_str = result.fix_action.split()[-1]
                path = Path(path_str) if path_str.startswith("/") else repo_root / path_str
                path.mkdir(parents=True, exist_ok=True)
                print(f"🔧 Fixed: Created {path}")
                fixes += 1
    
    return fixes


# =============================================================================
# Main
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description="Check _pyrite repository structure")
    parser.add_argument("--check", choices=list(CHECKS.keys()), default="all",
                        help="Which check to run (default: all)")
    parser.add_argument("--fix", action="store_true",
                        help="Attempt to fix issues (creates missing directories)")
    parser.add_argument("--quiet", action="store_true",
                        help="Only show failures")
    parser.add_argument("--repo-path", default=".",
                        help="Path to repository root (default: current directory)")
    
    args = parser.parse_args()
    
    repo_root = Path(args.repo_path).resolve()
    
    # Verify we're in a _pyrite repo
    if not (repo_root / "_work_efforts").exists() and not (repo_root / "_coordination").exists():
        print(f"⚠️  Warning: {repo_root} doesn't look like a _pyrite repository")
    
    # Run checks
    check_fn = CHECKS[args.check]
    results = check_fn(repo_root)
    
    # Apply fixes if requested
    if args.fix:
        fixes = apply_fixes(results, repo_root)
        if fixes > 0:
            print(f"\n🔧 Applied {fixes} fix(es). Re-running checks...\n")
            results = check_fn(repo_root)
    
    # Print results
    passed, failed = print_results(results, verbose=not args.quiet)
    
    # Exit code
    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()

