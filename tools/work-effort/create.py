#!/usr/bin/env python3
"""
Work effort creation tool - turn a list of todos into a wired work effort.

Fills the gap between plugins.helpers (which can build work effort folders
but was only ever driven by the Todoist plugin) and tools/ticket/create.py
(which adds one ticket at a time to a work effort that already exists).

The output is a hub and spoke structure:

    _work_efforts/WE-YYMMDD-xxxx_title/
        WE-YYMMDD-xxxx_index.md      hub, links out to every ticket
        tickets/TKT-xxxx-001_....md  spoke, `parent` field links back

Both directions of that link resolve under tools/obsidian-linter, so the
work effort is navigable in Obsidian from either end.

Usage:
  pyrite we create --title "Ship checkout" --todo "Wire webhook" --todo "Test it"
  pyrite we create --title "Ship checkout" --todos-file todos.md
  cat todos.md | pyrite we create --title "Ship checkout" --todos-file -
  pyrite we list
"""

import re
import sys
from pathlib import Path

# Add project root for plugins import
_repo_root = Path(__file__).resolve().parent.parent.parent
if str(_repo_root) not in sys.path:
    sys.path.insert(0, str(_repo_root))

from plugins.helpers import (  # noqa: E402
    iso_z,
    generate_we_id,
    sanitize_title,
    create_work_effort_structure,
    find_work_effort_by_id,
    generate_ticket_id,
    create_ticket_file,
    ticket_file_stem,
    format_index_file,
)

WE_ID_PATTERN = re.compile(r'^WE-\d{6}-[a-z0-9]{4}$')

# Leading list markers to strip off a todo line: "- [ ] ", "- [x] ",
# "* ", "+ ", "1. ", "1) ", "- ".
TODO_MARKER = re.compile(r'^\s*(?:[-*+]\s+(?:\[[ xX]\]\s+)?|\d+[.)]\s+)')


def parse_todos(text: str) -> list[str]:
    """
    Pull todo titles out of free-form text.

    Accepts markdown checklists, bullets, numbered lists, or one todo per
    line. Blank lines and markdown headings are dropped. A trailing status
    marker is not interpreted: a checked box still becomes a ticket, because
    the point is to capture the whole list, not only the unfinished part.
    """
    todos = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line or line.startswith('#'):
            continue
        line = TODO_MARKER.sub('', line).strip()
        if line:
            todos.append(line)
    return todos


def read_todos(todo_args: list[str], todos_file: str | None) -> list[str]:
    """Collect todos from repeated --todo flags and/or a file or stdin."""
    todos = list(todo_args or [])

    if todos_file:
        if todos_file == '-':
            todos.extend(parse_todos(sys.stdin.read()))
        else:
            path = Path(todos_file)
            if not path.exists():
                raise FileNotFoundError(f"Todos file not found: {path}")
            todos.extend(parse_todos(path.read_text()))

    return todos


def cmd_create(
    work_efforts_dir: Path,
    title: str,
    todos: list[str],
    objective: str = "",
    description: str = "",
    labels: list[str] | None = None,
    status: str = "active",
    we_id: str | None = None,
    dry_run: bool = False,
) -> int:
    """Create a work effort with one ticket per todo."""
    if we_id:
        if not WE_ID_PATTERN.match(we_id):
            print(
                f"Error: Invalid work effort ID: {we_id} (expected WE-YYMMDD-xxxx)",
                file=sys.stderr,
            )
            return 1
        if find_work_effort_by_id(work_efforts_dir, we_id):
            print(
                f"Error: Work effort already exists: {we_id}",
                file=sys.stderr,
            )
            print(
                "  Use `pyrite ticket create` to add tickets to it.",
                file=sys.stderr,
            )
            return 1
    else:
        we_id = generate_we_id()

    folder_name = f"{we_id}_{sanitize_title(title)}"

    # Ticket IDs are assigned up front so the index can link to files that
    # have not been written yet, and so a dry run reports real IDs.
    planned = [
        {'id': generate_ticket_id(we_id, i), 'title': todo, 'status': 'pending'}
        for i, todo in enumerate(todos, start=1)
    ]

    if dry_run:
        print(f"Would create: {work_efforts_dir.name}/{folder_name}/")
        print(f"  index:  {we_id}_index.md")
        if planned:
            for ticket in planned:
                stem = ticket_file_stem(ticket['id'], ticket['title'])
                print(f"  ticket: tickets/{stem}.md")
                print(f"          {ticket['title']}")
        else:
            print("  tickets: none (no todos given)")
        print("-- dry run, nothing written --")
        return 0

    folder_path, index_path, tickets_dir = create_work_effort_structure(
        base_path=work_efforts_dir,
        we_id=we_id,
        title=title,
        validate=True,
    )

    for ticket in planned:
        create_ticket_file(
            tickets_dir=tickets_dir,
            ticket_id=ticket['id'],
            title=ticket['title'],
            parent=we_id,
            labels=labels or ['pyrite'],
        )

    index_path.write_text(format_index_file(
        we_id=we_id,
        title=title,
        description=description or None,
        objective=objective or None,
        status=status,
        labels=labels,
        tickets=planned,
    ))

    print(f"Created: {folder_path.relative_to(work_efforts_dir.parent)}")
    print(f"  ID: {we_id}")
    print(f"  Tickets: {len(planned)}")
    for ticket in planned:
        print(f"    {ticket['id']}  {ticket['title']}")
    return 0


def read_ticket(path: Path) -> dict:
    """Pull id, title and status out of a ticket file's frontmatter."""
    text = path.read_text()
    fields = {}
    for key in ('id', 'title', 'status'):
        match = re.search(rf'^{key}:\s*(.+)$', text, re.MULTILINE)
        if match:
            fields[key] = match.group(1).strip().strip('"\'')
    return fields


def cmd_sync(work_efforts_dir: Path, we_id: str, dry_run: bool = False) -> int:
    """
    Rewrite a work effort's Tickets table from the ticket files on disk.

    The hub carries each ticket's status so the table is readable on its own,
    which means the table drifts the moment a ticket file changes. This is the
    reconciler. It replaces ONLY the Tickets block and the last_updated field,
    so an objective, a description or hand-written notes elsewhere in the
    index survive untouched.
    """
    we_path = find_work_effort_by_id(work_efforts_dir, we_id)
    if not we_path:
        print(f"Error: Work effort not found: {we_id}", file=sys.stderr)
        return 1

    index_path = we_path / f"{we_id}_index.md"
    if not index_path.exists():
        print(f"Error: Index not found: {index_path}", file=sys.stderr)
        return 1

    tickets = [read_ticket(p) for p in sorted((we_path / 'tickets').glob('TKT-*.md'))]
    if not tickets:
        print(f"No tickets in {we_id}, nothing to sync")
        return 0

    table = "## Tickets\n\n| Ticket | Title | Status |\n|--------|-------|--------|\n"
    for ticket in tickets:
        stem = ticket_file_stem(ticket['id'], ticket['title'])
        table += (
            f"| [[{stem}|{ticket['id']}]] "
            f"| {ticket['title']} "
            f"| {ticket.get('status', 'pending')} |\n"
        )

    text = index_path.read_text()
    # Replace from the Tickets heading up to the next second-level heading.
    new_text, count = re.subn(
        r'## Tickets\n.*?(?=\n## )',
        table,
        text,
        count=1,
        flags=re.DOTALL,
    )
    if count == 0:
        print(
            f"Error: no '## Tickets' section in {index_path.name} to sync",
            file=sys.stderr,
        )
        return 1

    new_text = re.sub(
        r'^last_updated:.*$',
        f'last_updated: {iso_z()}',
        new_text,
        count=1,
        flags=re.MULTILINE,
    )

    done = sum(1 for t in tickets if t.get('status') == 'completed')
    if dry_run:
        print(f"Would sync {we_id}: {done}/{len(tickets)} complete")
        print(table)
        print("-- dry run, nothing written --")
        return 0

    if new_text == text:
        print(f"{we_id}: already in sync, {done}/{len(tickets)} complete")
        return 0

    index_path.write_text(new_text)
    print(f"Synced {we_id}: {done}/{len(tickets)} tickets complete")
    if done == len(tickets):
        print("  every ticket is complete. Set the work effort status with:")
        print(f"    pyrite we close --we {we_id}")
    return 0


def cmd_close(work_efforts_dir: Path, we_id: str, dry_run: bool = False) -> int:
    """Set a work effort to completed, refusing while tickets are open."""
    we_path = find_work_effort_by_id(work_efforts_dir, we_id)
    if not we_path:
        print(f"Error: Work effort not found: {we_id}", file=sys.stderr)
        return 1

    tickets = [read_ticket(p) for p in sorted((we_path / 'tickets').glob('TKT-*.md'))]
    open_tickets = [t for t in tickets if t.get('status') != 'completed']
    if open_tickets:
        print(
            f"Refusing to close {we_id}: {len(open_tickets)} ticket(s) still open",
            file=sys.stderr,
        )
        for ticket in open_tickets:
            print(f"  {ticket['id']}  {ticket.get('status')}", file=sys.stderr)
        return 1

    index_path = we_path / f"{we_id}_index.md"
    text = index_path.read_text()
    new_text = re.sub(
        r'^status:.*$', 'status: completed', text, count=1, flags=re.MULTILINE
    )
    new_text = re.sub(
        r'^last_updated:.*$',
        f'last_updated: {iso_z()}',
        new_text,
        count=1,
        flags=re.MULTILINE,
    )

    if dry_run:
        print(f"Would close {we_id} ({len(tickets)} tickets, all complete)")
        print("-- dry run, nothing written --")
        return 0

    index_path.write_text(new_text)
    print(f"Closed {we_id}: {len(tickets)} tickets, all complete")
    return 0


def cmd_list(work_efforts_dir: Path, status_filter: str | None = None) -> int:
    """List work efforts with their ID, status and title."""
    rows = []
    for index_path in sorted(work_efforts_dir.glob("WE-*/WE-*_index.md")):
        text = index_path.read_text()
        fields = {}
        for key in ('id', 'title', 'status'):
            match = re.search(rf'^{key}:\s*(.+)$', text, re.MULTILINE)
            if match:
                fields[key] = match.group(1).strip().strip('"\'')
        if status_filter and fields.get('status') != status_filter:
            continue
        rows.append(fields)

    if not rows:
        target = f" with status {status_filter}" if status_filter else ""
        print(f"No work efforts found{target} in {work_efforts_dir}")
        return 0

    width = max(len(r.get('status', '')) for r in rows)
    for row in rows:
        print(
            f"{row.get('id', '?'):<18} "
            f"{row.get('status', '?'):<{width}}  "
            f"{row.get('title', '?')}"
        )
    print(f"\n{len(rows)} work efforts")
    return 0


def main():
    import argparse

    parser = argparse.ArgumentParser(
        prog="pyrite we",
        description="Create a work effort from a list of todos",
    )
    parser.add_argument(
        "action",
        nargs="?",
        default="create",
        choices=["create", "list", "sync", "close"],
        help="create (default), list, sync or close",
    )
    parser.add_argument("--title", "-t", help="Work effort title (required for create)")
    parser.add_argument("--objective", "-o", default="", help="One-line objective")
    parser.add_argument("--desc", "-d", default="", help="Longer description")
    parser.add_argument(
        "--todo",
        action="append",
        default=[],
        help="A todo to capture as a ticket (repeatable)",
    )
    parser.add_argument(
        "--todos-file",
        help="File of todos, one per line or a markdown checklist. Use - for stdin",
    )
    parser.add_argument(
        "--label",
        action="append",
        default=[],
        help="Label to tag the work effort and its tickets with (repeatable)",
    )
    parser.add_argument(
        "--status",
        default="active",
        choices=["active", "paused", "completed"],
        help="Work effort status (default: active)",
    )
    parser.add_argument(
        "--we", "-w",
        help="Use this work effort ID instead of generating one",
    )
    parser.add_argument(
        "--filter-status",
        choices=["active", "paused", "completed"],
        help="list only: show work efforts with this status",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be created without writing anything",
    )
    parser.add_argument(
        "--work-efforts-dir",
        help="Base directory for work efforts (default: <repo root>/_work_efforts)",
    )

    args = parser.parse_args()
    # Default relative to the repo, not the shell's cwd. `pyrite` lives at the
    # repo root but is run from anywhere, and a cwd-relative default fails
    # silently from a subdirectory: the command reports "work efforts
    # directory not found" and the status change never lands.
    base = (
        Path(args.work_efforts_dir).resolve()
        if args.work_efforts_dir
        else _repo_root / "_work_efforts"
    )

    if not base.exists():
        print(f"Error: Work efforts directory not found: {base}", file=sys.stderr)
        return 1

    if args.action == "list":
        return cmd_list(base, args.filter_status)

    if args.action in ("sync", "close"):
        if not args.we:
            print(f"Error: --we is required for {args.action}", file=sys.stderr)
            return 1
        handler = cmd_sync if args.action == "sync" else cmd_close
        return handler(base, args.we, args.dry_run)

    if not args.title:
        print("Error: --title is required for create", file=sys.stderr)
        return 1

    try:
        todos = read_todos(args.todo, args.todos_file)
    except FileNotFoundError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    return cmd_create(
        work_efforts_dir=base,
        title=args.title,
        todos=todos,
        objective=args.objective,
        description=args.desc,
        labels=args.label or None,
        status=args.status,
        we_id=args.we,
        dry_run=args.dry_run,
    )


if __name__ == "__main__":
    sys.exit(main())
