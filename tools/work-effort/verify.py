"""
Assert-based check on the work effort and ticket helpers.

Exercises the exact keyword sets the existing callers use, so a change to
plugins/helpers.py cannot silently break them:

  plugins/todoist/plugin.py  -> format_index_file, create_ticket_file
  tools/ticket/create.py     -> create_ticket_file
  tools/work-effort/create.py -> both, plus ticket_file_stem

Run it directly:

    python3 tools/work-effort/verify.py

Every check is an assert, so a regression exits non-zero. This is
deliberate: test_plugins.py in the repo root returns True/False instead of
asserting, and pytest reports a test that returns False as PASSED, so those
6 passes cannot detect a regression. Do not copy that pattern here.

One check is a control: it asserts that the OLD datetime.isoformat() output
fails the linter's date regex. If someone loosened that regex to match
everything, the control fails and the whole file stops being evidence.
"""

import re
import sys
import tempfile
from datetime import datetime
from pathlib import Path

_repo_root = Path(__file__).resolve().parent.parent.parent
if str(_repo_root) not in sys.path:
    sys.path.insert(0, str(_repo_root))

from plugins.helpers import (  # noqa: E402
    iso_z,
    format_index_file,
    create_ticket_file,
    ticket_file_stem,
    sanitize_title,
)

LINTER_DATE = re.compile(r'^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$')
WE_STATUSES = {'active', 'paused', 'completed'}
TKT_STATUSES = {'pending', 'in_progress', 'completed', 'blocked'}

checks = 0


def check(condition, label):
    global checks
    checks += 1
    assert condition, f"FAILED: {label}"
    print(f"  ok  {label}")


def frontmatter(text):
    body = text.split('---', 2)[1]
    fields = {}
    for line in body.strip().splitlines():
        if ':' in line:
            key, value = line.split(':', 1)
            fields[key.strip()] = value.strip().strip('"\'')
    return fields


print("iso_z format")
check(LINTER_DATE.match(iso_z()), "iso_z() matches the linter date regex")
check(
    iso_z(datetime(2026, 7, 30, 12, 15, 28, 126905)) == '2026-07-30T12:15:28.126Z',
    "iso_z truncates microseconds to milliseconds and appends Z",
)
check(
    not LINTER_DATE.match(datetime.now().isoformat()),
    "the old isoformat() output does NOT match, so this was a real fix",
)

print("\nformat_index_file, todoist keyword set")
content = format_index_file(
    we_id='WE-260730-abcd',
    title='Todoist Task',
    description='desc',
    source='todoist',
    source_url='https://example.com/t/1',
    labels=['urgent'],
    created=datetime(2026, 7, 30, 9, 0, 0, 500000),
)
fm = frontmatter(content)
check(fm['id'] == 'WE-260730-abcd', "id preserved")
check(fm['status'] in WE_STATUSES, f"status {fm['status']} is a valid WE status")
check(fm['status'] == 'active', "default status is active, not the invalid in_progress")
check(LINTER_DATE.match(fm['created']), f"created {fm['created']} passes linter regex")
check(fm['last_updated'] == fm['created'], "last_updated emitted, defaults to created")
check('## Source Task' in content, "source block still rendered for todoist")
check('## Tickets' not in content, "no Tickets table when no tickets passed")

print("\nformat_index_file, with tickets")
tickets = [
    {'id': 'TKT-abcd-001', 'title': 'A' * 80, 'status': 'pending'},
    {'id': 'TKT-abcd-002', 'title': 'Short one', 'status': 'completed'},
]
content = format_index_file(
    we_id='WE-260730-abcd',
    title='Hub',
    objective='Do the thing',
    tickets=tickets,
)
fm = frontmatter(content)
check(fm['objective'] == 'Do the thing', "objective in frontmatter")
check('## Tickets' in content, "Tickets table rendered")
for ticket in tickets:
    stem = ticket_file_stem(ticket['id'], ticket['title'])
    check(f"[[{stem}|{ticket['id']}]]" in content, f"link to {ticket['id']} uses exact stem")
check(
    len(re.findall(r'TKT-abcd-00\d', content.split('## Tickets')[1])) == 4,
    "every ticket ID mention in the table body sits inside a wikilink or the alias",
)

print("\ncreate_ticket_file, ticket-tool and todoist keyword sets")
with tempfile.TemporaryDirectory() as tmp:
    tickets_dir = Path(tmp)

    legacy = create_ticket_file(
        tickets_dir=tickets_dir,
        ticket_id='TKT-abcd-001',
        title='Legacy call',
        description='d',
        source_task_id='12345',
        source_url='https://example.com',
        labels=['todoist'],
    )
    fm = frontmatter(legacy.read_text())
    check(legacy.exists(), "legacy keyword set still writes a file")
    check('parent' not in fm, "no parent field when parent not passed")
    check(fm['status'] in TKT_STATUSES, "ticket status valid")
    check(LINTER_DATE.match(fm['created']), "ticket created passes linter regex")
    check(fm['source_task_id'] == '12345', "source_task_id preserved")

    linked = create_ticket_file(
        tickets_dir=tickets_dir,
        ticket_id='TKT-abcd-002',
        title='Linked call',
        parent='WE-260730-abcd',
    )
    body = linked.read_text()
    fm = frontmatter(body)
    check(fm['parent'] == 'WE-260730-abcd', "parent field emitted")
    check('[[WE-260730-abcd_index|WE-260730-abcd]]' in body, "back-link to the index resolves by stem")
    check(
        fm['id'].split('-')[1] == fm['parent'].split('-')[-1],
        "ticket ID suffix matches parent suffix, the linter's reciprocity rule",
    )

    long_title = 'B' * 120
    path = create_ticket_file(
        tickets_dir=tickets_dir,
        ticket_id='TKT-abcd-003',
        title=long_title,
    )
    check(
        path.stem == ticket_file_stem('TKT-abcd-003', long_title),
        "written filename equals what ticket_file_stem predicts, even truncated",
    )
    check(len(sanitize_title(long_title)) == 50, "long titles truncate at 50 chars")

print(f"\n{checks} checks passed, all assert-based")
