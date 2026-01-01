#!/usr/bin/env python3
"""
Naming Linter - Validates and fixes work effort naming conventions

Validates:
- WE folder names: WE-YYMMDD-xxxx_description/
- Index files: WE-YYMMDD-xxxx_index.md
- Ticket files: TKT-YYMMDD-NNN_description.md
- YAML frontmatter structure

Usage:
    python3 tools/naming-linter/lint.py --check
    python3 tools/naming-linter/lint.py --fix
    python3 tools/naming-linter/lint.py --check --path _work_efforts/WE-260101-a1b2_test/
"""

import sys
import argparse
from pathlib import Path
from typing import List, Dict
from rules.work_efforts import WorkEffortValidator


class Colors:
    """ANSI color codes for terminal output"""
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'


def main():
    parser = argparse.ArgumentParser(
        description="Naming Linter - Validates work effort naming conventions",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Check all work efforts (read-only)
  python3 tools/naming-linter/lint.py --check

  # Check specific work effort
  python3 tools/naming-linter/lint.py --check --path _work_efforts/WE-260101-a1b2_test/

  # Fix violations automatically
  python3 tools/naming-linter/lint.py --fix

  # Preview fixes without applying
  python3 tools/naming-linter/lint.py --fix --dry-run
        """
    )

    parser.add_argument(
        '--check',
        action='store_true',
        help='Check for naming violations (read-only, default)'
    )

    parser.add_argument(
        '--fix',
        action='store_true',
        help='Fix naming violations automatically'
    )

    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Preview fixes without applying them (requires --fix)'
    )

    parser.add_argument(
        '--path',
        type=str,
        default='_work_efforts',
        help='Path to check (default: _work_efforts)'
    )

    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Show detailed output'
    )

    args = parser.parse_args()

    # Default to check mode if neither --check nor --fix specified
    if not args.check and not args.fix:
        args.check = True

    # Print header
    print(f"\n{Colors.HEADER}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}📝 Naming Linter - Work Effort Naming Validator{Colors.END}")
    print(f"{Colors.HEADER}{'='*60}{Colors.END}")
    print(f"Path: {args.path}")

    if args.fix:
        mode = 'DRY RUN (preview only)' if args.dry_run else 'FIX (will modify files)'
    else:
        mode = 'CHECK ONLY (read-only)'
    print(f"Mode: {mode}")
    print(f"{Colors.HEADER}{'='*60}{Colors.END}\n")

    # Initialize validator
    validator = WorkEffortValidator(
        root_path=args.path,
        verbose=args.verbose
    )

    # Run validation
    violations = validator.validate()

    # Display results
    if not violations:
        print(f"\n{Colors.GREEN}✅ No violations found! All naming conventions are correct.{Colors.END}\n")
        return 0

    # Show violations
    print(f"\n{Colors.RED}Found {len(violations)} violation(s):{Colors.END}\n")

    for i, violation in enumerate(violations, 1):
        print(f"{Colors.YELLOW}{i}.{Colors.END} {violation['type']}")
        print(f"   File: {violation['path']}")
        print(f"   Issue: {violation['message']}")
        if 'expected' in violation:
            print(f"   Expected: {violation['expected']}")
        print()

    # Apply fixes if requested
    if args.fix:
        if args.dry_run:
            print(f"\n{Colors.CYAN}💡 Dry run mode - showing what would be fixed:{Colors.END}\n")
            validator.preview_fixes(violations)
            print(f"\n{Colors.YELLOW}Remove --dry-run to apply these fixes.{Colors.END}\n")
        else:
            print(f"\n{Colors.CYAN}🔧 Applying fixes...{Colors.END}\n")
            fixed_count = validator.apply_fixes(violations)
            print(f"\n{Colors.GREEN}✅ Fixed {fixed_count} violations!{Colors.END}\n")
            print(f"{Colors.CYAN}💡 Run again to verify all issues are resolved.{Colors.END}\n")
    else:
        print(f"{Colors.CYAN}💡 To fix these violations, run with --fix flag:{Colors.END}")
        print(f"   python3 tools/naming-linter/lint.py --fix\n")

    return 1 if violations else 0


if __name__ == '__main__':
    sys.exit(main())
