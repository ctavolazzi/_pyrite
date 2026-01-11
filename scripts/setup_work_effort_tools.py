#!/usr/bin/env python3
"""
Work Effort Tool Bag Setup Script

This script automatically sets up a standard tool bag for a work effort.
It copies essential tools from the template and customizes them for the specific work effort.

Usage:
    python scripts/setup_work_effort_tools.py <work_effort_path> [--optional]

Examples:
    python scripts/setup_work_effort_tools.py _work_efforts/WE-260110-example_work_effort
    python scripts/setup_work_effort_tools.py _work_efforts/WE-260110-example_work_effort --optional
"""

import os
import sys
import shutil
import argparse
from datetime import datetime
from pathlib import Path


def get_work_effort_info(work_effort_path):
    """Extract work effort ID and description from path."""
    path = Path(work_effort_path)
    folder_name = path.name

    # Extract ID and description from folder name (e.g., WE-260110-example_work_effort)
    parts = folder_name.split('-', 2)
    if len(parts) >= 3:
        work_effort_id = f"{parts[0]}-{parts[1]}"
        description = parts[2].replace('_', ' ').title()
    else:
        work_effort_id = folder_name
        description = "Work Effort"

    return work_effort_id, description


def setup_tool_bag(work_effort_path, include_optional=False):
    """Set up tool bag for a work effort."""
    work_effort_path = Path(work_effort_path)

    # Validate work effort exists
    if not work_effort_path.exists():
        print(f"❌ Error: Work effort path does not exist: {work_effort_path}")
        return False

    # Get work effort info
    work_effort_id, description = get_work_effort_info(work_effort_path)
    current_date = datetime.now().strftime("%Y-%m-%d")

    # Paths
    template_path = Path("_work_efforts/.tool_bag_template")
    tools_path = work_effort_path / "tools"

    # Validate template exists
    if not template_path.exists():
        print(f"❌ Error: Template not found: {template_path}")
        print("   Run this script from the project root directory.")
        return False

    # Create tools directory
    print(f"📁 Creating tools directory: {tools_path}")
    tools_path.mkdir(exist_ok=True)

    # Copy essential tools
    essential_tools = [
        "README.md",
        "work_effort_tracker.md",
        "verification_checklist.md"
    ]

    print(f"📋 Copying essential tools...")
    for tool in essential_tools:
        src = template_path / tool
        dst = tools_path / tool

        if not src.exists():
            print(f"   ⚠️  Warning: Template file not found: {src}")
            continue

        # Copy file
        shutil.copy2(src, dst)

        # Customize placeholders
        customize_file(dst, work_effort_id, description, current_date)
        print(f"   ✅ {tool}")

    # Handle optional tools
    if include_optional:
        print(f"📦 Including optional tools...")
        # Optional tools would be copied from other work efforts
        # For now, just note that they can be added
        print(f"   ℹ️  Optional tools can be copied from other work efforts as needed")
        print(f"   ℹ️  See tools/README.md for examples")

    print(f"\n✅ Tool bag setup complete!")
    print(f"   Work Effort: {work_effort_id}")
    print(f"   Description: {description}")
    print(f"   Tools Path: {tools_path}")
    print(f"\n📖 Next steps:")
    print(f"   1. Review and update tools/work_effort_tracker.md")
    print(f"   2. Customize tools/verification_checklist.md for your needs")
    print(f"   3. Add optional tools from other work efforts if needed")
    print(f"   4. See tools/README.md for more information")

    return True


def customize_file(file_path, work_effort_id, description, current_date):
    """Replace placeholders in a file with actual values."""
    try:
        # Read file
        with open(file_path, 'r') as f:
            content = f.read()

        # Replace placeholders
        content = content.replace('[WORK_EFFORT_ID]', work_effort_id)
        content = content.replace('[DESCRIPTION]', description)
        content = content.replace('[DATE]', current_date)

        # Write back
        with open(file_path, 'w') as f:
            f.write(content)
    except Exception as e:
        print(f"   ⚠️  Warning: Could not customize {file_path}: {e}")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Set up tool bag for a work effort",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/setup_work_effort_tools.py _work_efforts/WE-260110-example
  python scripts/setup_work_effort_tools.py _work_efforts/WE-260110-example --optional

For more information, see:
  _work_efforts/WORK_EFFORT_TOOL_BAG_STANDARD.md
  _work_efforts/WORK_EFFORT_CREATION_GUIDE.md
        """
    )

    parser.add_argument(
        'work_effort_path',
        help='Path to the work effort directory (e.g., _work_efforts/WE-260110-example)'
    )

    parser.add_argument(
        '--optional',
        action='store_true',
        help='Include optional tools (currently just notes where to find them)'
    )

    args = parser.parse_args()

    # Run setup
    success = setup_tool_bag(args.work_effort_path, args.optional)

    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
