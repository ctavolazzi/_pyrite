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

import re
import sys
from pathlib import Path

# Add project root for plugins import
_repo_root = Path(__file__).resolve().parent.parent.parent
if str(_repo_root) not in sys.path:
    sys.path.insert(0, str(_repo_root))

from plugins.helpers import (  # noqa: E402
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


def cmd_list(work_efforts_dir: Path, we_id: str = None) -> int:
    """List tickets, for one work effort or across all of them."""
    if we_id:
        we_path = find_work_effort_by_id(work_efforts_dir, we_id)
        if not we_path:
            print(f"Error: Work effort not found: {we_id}", file=sys.stderr)
            return 1
        folders = [we_path]
    else:
        folders = sorted(p for p in work_efforts_dir.glob("WE-*") if p.is_dir())

    rows = []
    for folder in folders:
        for path in sorted((folder / "tickets").glob("TKT-*.md")):
            text = path.read_text()
            fields = {}
            for key in ("id", "title", "status"):
                match = re.search(rf"^{key}:\s*(.+)$", text, re.MULTILINE)
                if match:
                    fields[key] = match.group(1).strip().strip("\"'")
            fields["we"] = folder.name.split("_")[0]
            rows.append(fields)

    if not rows:
        target = f" in {we_id}" if we_id else ""
        print(f"No tickets found{target}")
        return 0

    width = max(len(r.get("status", "")) for r in rows)
    for row in rows:
        prefix = "" if we_id else f"{row['we']}  "
        print(
            f"{prefix}{row.get('id', '?'):<16} "
            f"{row.get('status', '?'):<{width}}  "
            f"{row.get('title', '?')}"
        )
    done = sum(1 for r in rows if r.get("status") == "completed")
    print(f"\n{len(rows)} tickets, {done} completed")
    return 0


TICKET_STATUSES = ("pending", "in_progress", "completed", "blocked")


def cmd_status(work_efforts_dir: Path, ticket_id: str, status: str) -> int:
    """
    Set a ticket's status.

    Exists so changing a status is a CLI verb rather than a hand edit or a
    batch rewrite across files. It also keeps the work effort's Tickets table
    honest by telling you to sync afterwards.
    """
    if status not in TICKET_STATUSES:
        print(
            f"Error: invalid status {status!r}. "
            f"Expected one of: {', '.join(TICKET_STATUSES)}",
            file=sys.stderr,
        )
        return 1

    matches = list(work_efforts_dir.glob(f"WE-*/tickets/{ticket_id}_*.md"))
    if not matches:
        print(f"Error: Ticket not found: {ticket_id}", file=sys.stderr)
        return 1
    if len(matches) > 1:
        print(f"Error: {ticket_id} matches {len(matches)} files", file=sys.stderr)
        for path in matches:
            print(f"  {path}", file=sys.stderr)
        return 1

    path = matches[0]
    text = path.read_text()
    current = re.search(r"^status:\s*(.+)$", text, re.MULTILINE)
    if current and current.group(1).strip() == status:
        print(f"{ticket_id}: already {status}")
        return 0

    new_text, count = re.subn(
        r"^status:\s*.+$", f"status: {status}", text, count=1, flags=re.MULTILINE
    )
    if count == 0:
        print(f"Error: no status field in {path.name}", file=sys.stderr)
        return 1

    path.write_text(new_text)
    was = current.group(1).strip() if current else "?"
    print(f"{ticket_id}: {was} -> {status}")

    we_id = path.parent.parent.name.split("_")[0]
    print(f"  run `pyrite we sync --we {we_id}` to refresh the work effort table")
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
        choices=["create", "list", "status"],
        help="create (default), list or status",
    )
    parser.add_argument(
        "--id",
        help="Ticket ID to act on (e.g. TKT-abcd-001). Required for status",
    )
    parser.add_argument(
        "--status", "-s",
        help=f"New status for the ticket: {', '.join(TICKET_STATUSES)}",
    )
    parser.add_argument(
        "--we", "-w",
        help="Work effort ID (e.g. WE-260127-abcd). Required for create",
    )
    parser.add_argument(
        "--title", "-t",
        help="Ticket title. Required for create",
    )
    parser.add_argument(
        "--desc", "-d",
        default="",
        help="Ticket description",
    )
    parser.add_argument(
        "--work-efforts-dir",
        help="Base directory for work efforts (default: <repo root>/_work_efforts)",
    )

    args = parser.parse_args()
    # Default relative to the repo, not the shell's cwd. See the same note in
    # tools/work-effort/create.py: a cwd-relative default makes every verb
    # fail from a subdirectory, which cost a silently-skipped status change.
    base = (
        Path(args.work_efforts_dir).resolve()
        if args.work_efforts_dir
        else _repo_root / "_work_efforts"
    )

    if not base.exists():
        print(f"Error: Work efforts directory not found: {base}", file=sys.stderr)
        return 1

    if args.action == "list":
        return cmd_list(base, args.we)

    if args.action == "status":
        missing = [f for f, v in (("--id", args.id), ("--status", args.status)) if not v]
        if missing:
            print(
                f"Error: {' and '.join(missing)} required for status",
                file=sys.stderr,
            )
            return 1
        return cmd_status(base, args.id, args.status)

    missing = [f for f, v in (("--we", args.we), ("--title", args.title)) if not v]
    if missing:
        print(f"Error: {' and '.join(missing)} required for create", file=sys.stderr)
        return 1

    return cmd_create(base, args.we, args.title, args.desc)


if __name__ == "__main__":
    sys.exit(main())
