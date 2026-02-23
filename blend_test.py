#!/usr/bin/env python3
"""
The Blend Architecture Verification Script

Verifies that empirica (The Brain) and novasystem (The Body) are properly
linked as editable dependencies from sibling directories.
"""

import os
import sys
from pathlib import Path


def verify_working_directory():
    """Ensure script is running from _pyrite root."""
    script_dir = Path(__file__).parent.resolve()
    expected_name = "_pyrite"
    if script_dir.name != expected_name:
        print(f"❌ ERROR: Script must be run from {expected_name} root directory")
        print(f"   Current directory: {script_dir}")
        return False
    return True


def check_path_is_local(path_str, expected_sibling):
    """Verify path points to sibling directory, not site-packages."""
    path = Path(path_str).resolve()
    path_str_normalized = str(path)

    # Check for site-packages (bad)
    if "site-packages" in path_str_normalized or "dist-packages" in path_str_normalized:
        return False, "points to site-packages (not local)"

    # Check for expected sibling directory (good)
    if expected_sibling in path_str_normalized:
        return True, f"points to ../{expected_sibling}"

    # If neither, it's ambiguous
    return None, "path validation unclear"


def test_import(module_name, expected_sibling, case_variations=None):
    """Attempt to import a module and verify its path."""
    if case_variations is None:
        case_variations = [module_name]

    for variant in case_variations:
        try:
            module = __import__(variant)
            module_file = getattr(module, '__file__', None)

            if module_file is None:
                return False, f"Module {variant} imported but has no __file__ attribute", None

            module_path = os.path.dirname(module_file)
            is_local, path_status = check_path_is_local(module_path, expected_sibling)

            if is_local is False:
                return False, f"Module {variant} imported from {module_path} ({path_status})", module_path
            elif is_local is True:
                return True, f"Module {variant} imported from {module_path} ({path_status})", module_path
            else:
                return None, f"Module {variant} imported from {module_path} ({path_status})", module_path

        except ImportError as e:
            continue

    return False, f"Failed to import {module_name} (tried: {', '.join(case_variations)})", None


def main():
    """Run verification tests."""
    print("=" * 70)
    print("The Blend Architecture - Verification Test")
    print("=" * 70)
    print()

    # Verify working directory
    if not verify_working_directory():
        sys.exit(1)

    print("✅ Working directory: OK (running from _pyrite root)")
    print()

    # Test imports
    results = {}

    # Test empirica (The Brain)
    print("Testing empirica (The Brain)...")
    success, message, path = test_import(
        "empirica",
        "empirica",
        case_variations=["empirica", "Empirica"]
    )
    results["empirica"] = (success, message, path)
    if success:
        print(f"  ✅ {message}")
    else:
        print(f"  ❌ {message}")
    print()

    # Test novasystem (The Body)
    print("Testing novasystem (The Body)...")
    success, message, path = test_import(
        "novasystem",
        "NovaSystem-Codex",
        case_variations=["novasystem", "NovaSystem"]
    )
    results["novasystem"] = (success, message, path)
    if success:
        print(f"  ✅ {message}")
    else:
        print(f"  ❌ {message}")
    print()

    # Final report
    print("=" * 70)
    print("VERIFICATION REPORT")
    print("=" * 70)
    print()

    all_success = all(result[0] for result in results.values())

    if all_success:
        print("🟢 GREEN LIGHTS - All imports successful from local paths!")
        print()
        print("Package Locations:")
        for name, (success, message, path) in results.items():
            if path:
                print(f"  • {name}: {path}")
        print()
        print("Python Version:", sys.version.split()[0])
        return 0
    else:
        print("🔴 RED LIGHTS - Import verification failed!")
        print()
        print("Errors:")
        for name, (success, message, path) in results.items():
            if not success:
                print(f"  • {name}: {message}")
        print()
        print("Python Version:", sys.version.split()[0])
        return 1


if __name__ == "__main__":
    sys.exit(main())

