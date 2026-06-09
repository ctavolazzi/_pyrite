#!/usr/bin/env python3
"""
Ticket creation tool - Create tickets in work efforts using existing helpers.

Uses plugins.helpers (create_ticket_file, generate_ticket_id) and
find_work_effort_by_id to create TKT-xxxx-NNN ticket files.

Usage:
  pyrite ticket create --we WE-260127-abcd --title "Fix login bug"
  pyrite ticket create --we WE-260127-abcd --title "Add tests" --desc "Unit tests for auth"
  python3 tools/ticket/create.py create --we WE-260127-abcd --title "Fix bug"
"""

import sys
from pathlib import Path

# Add project root for plugins import
_repo_root = Path(__file__).resolve().parent.parent.parent
if str(_repo_root) not in sys.path:
    sys.path.insert(0, str(_repo_root))

from plugins.helpers import (
    find_work_effort_by_id,
    generate_ticket_id,
    create_ticket_file,
)


def cmd_create(work_efforts_dir: Path, we_id: str, title: str, description: str = "") -> int:
    """Create a ticket in the given work effort."""
    base = work_efforts_dir
    we_path = find_work_effort_by_id(base, we_id)

    if not we_path:
        print(f"Error: Work effort not found: {we_id}", file=sys.stderr)
        print(f"  Searched in: {base}", file=sys.stderr)
        return 1

    tickets_dir = we_path / "tickets"
    tickets_dir.mkdir(exist_ok=True)

    existing = list(tickets_dir.glob("TKT-*.md"))
    sequence = len(existing) + 1
    ticket_id = generate_ticket_id(we_id, sequence)

    ticket_path = create_ticket_file(
        tickets_dir=tickets_dir,
        ticket_id=ticket_id,
        title=title,
        description=description or None,
        labels=["pyrite"],
    )

    print(f"Created: {ticket_path.relative_to(base)}")
    print(f"  ID: {ticket_id}")
    return 0


def main():
    import argparse

    parser = argparse.ArgumentParser(
        prog="pyrite ticket create",
        description="Create a ticket in a work effort",
    )
    parser.add_argument(
        "action",
        nargs="?",
        default="create",
        help="create (default)",
    )
    parser.add_argument(
        "--we", "-w",
        required=True,
        help="Work effort ID (e.g. WE-260127-abcd)",
    )
    parser.add_argument(
        "--title", "-t",
        required=True,
        help="Ticket title",
    )
    parser.add_argument(
        "--desc", "-d",
        default="",
        help="Ticket description",
    )
    parser.add_argument(
        "--work-efforts-dir",
        default="_work_efforts",
        help="Base directory for work efforts (default: _work_efforts)",
    )

    args = parser.parse_args()
    base = Path(args.work_efforts_dir).resolve()

    if not base.exists():
        print(f"Error: Work efforts directory not found: {base}", file=sys.stderr)
        return 1

    return cmd_create(base, args.we, args.title, args.desc)


if __name__ == "__main__":
    sys.exit(main())
