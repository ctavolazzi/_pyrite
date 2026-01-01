#!/usr/bin/env python3
"""
Unified Obsidian linter - runs all checks, validation, and optional fixes in sequence.

Usage:
    python3 tools/obsidian-linter/lint.py [--scope DIR] [--fix] [--dry-run]
"""

import sys
import argparse
import subprocess
from pathlib import Path


def run_command(cmd, description):
    """Run a command and return success status."""
    print(f"\n{'='*60}")
    print(f"🔍 {description}")
    print('='*60)
    
    result = subprocess.run(cmd, capture_output=False)
    return result.returncode == 0


def main():
    parser = argparse.ArgumentParser(
        description="Unified Obsidian linter - runs all checks, validation, and optional fixes",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Check and validate only (read-only)
  python3 tools/obsidian-linter/lint.py --scope _work_efforts

  # Preview fixes without applying
  python3 tools/obsidian-linter/lint.py --scope _work_efforts --dry-run

  # Check, validate, and apply fixes
  python3 tools/obsidian-linter/lint.py --scope _work_efforts --fix

  # Run on entire repository
  python3 tools/obsidian-linter/lint.py --fix
        """
    )
    
    parser.add_argument(
        '--scope',
        type=str,
        help='Limit checking to specific directory (e.g., "_work_efforts")'
    )
    
    parser.add_argument(
        '--fix',
        action='store_true',
        help='Apply auto-fixes after checking and validating'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Preview fixes without applying them (requires --fix)'
    )
    
    parser.add_argument(
        '--strict',
        action='store_true',
        help='Enable stricter checking'
    )
    
    args = parser.parse_args()
    
    # Build base command arguments
    base_args = []
    if args.scope:
        base_args.extend(['--scope', args.scope])
    if args.strict:
        base_args.append('--strict')
    
    # Get script directory
    script_dir = Path(__file__).parent
    
    print("\n" + "="*60)
    print("📝 Obsidian Markdown Linter - Unified Tool")
    print("="*60)
    print(f"Scope: {args.scope or 'entire repository'}")
    if args.fix:
        print(f"Mode: {'DRY RUN (preview only)' if args.dry_run else 'FIX (will modify files)'}")
    else:
        print("Mode: CHECK ONLY (read-only)")
    print("="*60)
    
    # Step 1: Run linter (check.py)
    check_cmd = [sys.executable, str(script_dir / 'check.py')] + base_args
    check_success = run_command(check_cmd, "Step 1: Linting (checking for issues)")
    
    if not check_success:
        print("\n⚠️  Linter found errors. Continuing with validation...")
    
    # Step 2: Run validator (validate.py)
    validate_cmd = [sys.executable, str(script_dir / 'validate.py')] + base_args
    validate_success = run_command(validate_cmd, "Step 2: Validation (checking for accuracy)")
    
    if not validate_success:
        print("\n⚠️  Validator found issues. Continuing...")
    
    # Step 3: Apply fixes if requested
    if args.fix:
        fix_cmd = [sys.executable, str(script_dir / 'fix-all.py')] + base_args
        if args.dry_run:
            fix_cmd.append('--dry-run')
        
        fix_success = run_command(fix_cmd, "Step 3: Auto-fixing (applying fixes)")
        
        if fix_success and not args.dry_run:
            print("\n✅ Fixes applied successfully!")
            print("\n💡 Tip: Run this command again to verify all issues are resolved.")
        elif args.dry_run:
            print("\n💡 This was a dry run. Remove --dry-run to apply fixes.")
    else:
        print("\n" + "="*60)
        print("💡 To apply auto-fixes, run with --fix flag:")
        if args.scope:
            print(f"   python3 tools/obsidian-linter/lint.py --scope {args.scope} --fix")
        else:
            print("   python3 tools/obsidian-linter/lint.py --fix")
        print("="*60)
    
    # Summary
    print("\n" + "="*60)
    print("📊 Summary")
    print("="*60)
    print(f"✅ Linter: {'PASSED' if check_success else 'ISSUES FOUND'}")
    print(f"✅ Validator: {'PASSED' if validate_success else 'ISSUES FOUND'}")
    if args.fix:
        print(f"✅ Auto-fix: {'COMPLETED' if args.fix else 'SKIPPED'}")
    print("="*60)
    
    # Exit with error if any step failed
    if not check_success or not validate_success:
        sys.exit(1)
    
    sys.exit(0)


if __name__ == '__main__':
    main()

