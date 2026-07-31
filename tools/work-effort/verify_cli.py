#!/usr/bin/env python3
"""
Adversarial checks on the work effort and ticket CLI surface.

verify.py covers plugins/helpers.py. This covers the layer above it: the
argument handling, the todo parser, and the sync/close/status verbs, which
until now had been exercised exactly once each, by hand, on happy paths.

Every check is an assert and runs the real scripts through subprocess, so it
tests the CLI as a user meets it rather than the functions underneath.

    python3 tools/work-effort/verify_cli.py

Hostile inputs are the point. A title containing a pipe, a quote, a newline
or a leading dash is not exotic: it is what happens the first time someone
pastes a real todo list.
"""

import re
import subprocess
import sys
import tempfile
from pathlib import Path

import yaml

REPO = Path(__file__).resolve().parent.parent.parent
WE_TOOL = REPO / "tools" / "work-effort" / "create.py"
TKT_TOOL = REPO / "tools" / "ticket" / "create.py"

checks = 0
failures = []


def check(condition, label):
    global checks
    checks += 1
    if condition:
        print(f"  ok   {label}")
    else:
        print(f"  FAIL {label}")
        failures.append(label)


def we(base, *args):
    return subprocess.run(
        [sys.executable, str(WE_TOOL), *args, "--work-efforts-dir", str(base)],
        capture_output=True, text=True,
    )


def tkt(base, *args):
    return subprocess.run(
        [sys.executable, str(TKT_TOOL), *args, "--work-efforts-dir", str(base)],
        capture_output=True, text=True,
    )


def we_id_from(stdout):
    m = re.search(r'(WE-\d{6}-[a-z0-9]{4})', stdout)
    return m.group(1) if m else None


def index_of(base, we_id):
    hits = list(base.glob(f"{we_id}*/{we_id}_index.md"))
    return hits[0] if hits else None


def frontmatter(text):
    """Parse frontmatter the way the obsidian linter does: naive key: value."""
    body = text.split('---', 2)[1]
    out = {}
    for line in body.strip().splitlines():
        if ':' in line:
            k, v = line.split(':', 1)
            out[k.strip()] = v.strip()
    return out


with tempfile.TemporaryDirectory() as tmp:
    base = Path(tmp) / "_work_efforts"
    base.mkdir(parents=True)

    print("todo parsing")
    r = we(base, "create", "--title", "Marker soup",
           "--todo", "plain one",
           "--todo", "- [x] checked",
           "--todo", "1. numbered",
           "--dry-run")
    check(r.returncode == 0, "dry run exits 0")
    check(r.stdout.count("ticket:") == 3, "three todos become three tickets")
    check("-- dry run, nothing written --" in r.stdout, "dry run says it wrote nothing")
    check(not any(base.iterdir()), "dry run genuinely wrote nothing to disk")

    print("\nhostile titles")
    # 1. A pipe in a title lands in a markdown table cell.
    #
    #    Counting raw pipes cannot test this, and my first attempt to do so
    #    was simply wrong: a correct row already holds 5 of them, 4 cell
    #    delimiters plus the one inside [[stem|ID]], and the fix escapes to
    #    \| which still contains the character. The question is how many CELLS
    #    a markdown renderer sees, so compare against a title with no pipe.
    def ticket_row(title):
        res = we(base, "create", "--title", f"Row {title[:12]}", "--todo", title)
        wid = we_id_from(res.stdout)
        body = index_of(base, wid).read_text()
        return [ln for ln in body.splitlines() if ln.startswith("| [[")][0]

    def cell_count(row):
        # Split on pipes that are not backslash-escaped, the way a GFM
        # renderer delimits cells.
        return len(re.split(r'(?<!\\)\|', row))

    plain_row = ticket_row("fix ab routing")
    piped_row = ticket_row("fix a|b routing")
    check(
        cell_count(piped_row) == cell_count(plain_row),
        f"a pipe in a title adds no table cells "
        f"(piped {cell_count(piped_row)} vs plain {cell_count(plain_row)})",
    )
    check("a\\|b" in piped_row, "the pipe is escaped rather than dropped")

    # 2. Hostile titles must survive a REAL yaml parser, not a naive one.
    #
    #    The first version of this check asserted that the number of double
    #    quotes in the title line was even. Four quotes satisfy that, so it
    #    happily passed `title: "handle "quoted" input"`, which is invalid
    #    YAML that the dashboard's gray-matter parser throws on. A weak
    #    assertion is worse than no assertion, because it reads as coverage.
    hostile = [
        ('embedded quotes', 'handle "quoted" input'),
        ('colon', 'fix bug: the sequel'),
        ('backslash', r'normalise C:\temp\path'),
        ('leading dash', '- looks like a list item'),
        ('hash', 'strip the # from anchors'),
        ('brace', 'render {{mustache}} tags'),
        ('both quote kinds', 'the "user\'s" account'),
    ]
    for label, title in hostile:
        r = we(base, "create", "--title", f"Hostile {label}", "--todo", title)
        hid = we_id_from(r.stdout)
        check(hid is not None, f"work effort created for a {label} title")
        if not hid:
            continue
        tfile = next(base.glob(f"{hid}*/tickets/TKT-*.md"))
        raw = tfile.read_text()
        try:
            parsed = yaml.safe_load(raw.split('---')[1])
            ok = isinstance(parsed, dict) and parsed.get('title') == title
            detail = f"parsed title={parsed.get('title')!r}" if isinstance(parsed, dict) else 'not a mapping'
        except yaml.YAMLError as exc:
            ok, detail = False, f"YAMLError: {str(exc).splitlines()[0][:60]}"
        check(ok, f"{label}: frontmatter round-trips through a real yaml parser ({detail})")

        idx = index_of(base, hid)
        try:
            iparsed = yaml.safe_load(idx.read_text().split('---')[1])
            iok = isinstance(iparsed, dict) and iparsed.get('status') == 'active'
        except yaml.YAMLError:
            iok = False
        check(iok, f"{label}: the work effort index also parses")

    print("\nsync")
    # 4. Tickets as the final section, with nothing after it.
    r = we(base, "create", "--title", "Tail test", "--todo", "only todo")
    tail_we = we_id_from(r.stdout)
    idx = index_of(base, tail_we)
    text = idx.read_text()
    cut = text.index("## Progress")
    idx.write_text(text[:cut].rstrip() + "\n")  # Tickets is now the last section
    check("## Tickets" in idx.read_text(), "fixture has Tickets as the final section")
    r = we(base, "sync", "--we", tail_we)
    check(r.returncode == 0, f"sync succeeds when Tickets is last (stderr: {r.stderr.strip()[:80]})")
    check("## Tickets" in idx.read_text(), "Tickets section survives that sync")

    # 5. Sync must reflect a status change.
    r = we(base, "create", "--title", "Sync test", "--todo", "alpha", "--todo", "beta")
    sync_we = we_id_from(r.stdout)
    short = sync_we.split("-")[-1]
    tkt(base, "status", "--id", f"TKT-{short}-001", "--status", "completed")
    we(base, "sync", "--we", sync_we)
    body = index_of(base, sync_we).read_text()
    tickets_block = body.split("## Tickets")[1].split("## ")[0]
    check("completed" in tickets_block, "sync writes the new status into the table")
    check(tickets_block.count("| pending |") == 1, "the untouched ticket stays pending")

    # 6. Sync must not clobber hand-written prose.
    idx = index_of(base, sync_we)
    marked = idx.read_text().replace("## Tickets", "## Notes\n\nHAND WRITTEN\n\n## Tickets", 1)
    idx.write_text(marked)
    we(base, "sync", "--we", sync_we)
    check("HAND WRITTEN" in idx.read_text(), "sync preserves hand-written sections")

    print("\nclose")
    check(we(base, "close", "--we", sync_we).returncode == 1,
          "close refuses while a ticket is open")
    tkt(base, "status", "--id", f"TKT-{short}-002", "--status", "completed")
    r = we(base, "close", "--we", sync_we)
    check(r.returncode == 0, "close succeeds once every ticket is completed")
    check(frontmatter(index_of(base, sync_we).read_text())["status"] == "completed",
          "close writes status: completed")

    print("\nticket status")
    r = tkt(base, "status", "--id", f"TKT-{short}-001", "--status", "banana")
    check(r.returncode == 1, "an invalid status is refused")
    check("banana" in r.stderr, "the refusal names the bad value")
    check(tkt(base, "status", "--id", "TKT-zzzz-999", "--status", "completed").returncode == 1,
          "an unknown ticket id is refused")
    r = tkt(base, "status", "--id", f"TKT-{short}-001", "--status", "completed")
    check(r.returncode == 0 and "already" in r.stdout, "re-setting the same status is idempotent")

    print("\nid allocation")
    # 7. Deleting a ticket must not cause the next one to reuse an id.
    r = we(base, "create", "--title", "Seq test", "--todo", "one", "--todo", "two", "--todo", "three")
    seq_we = we_id_from(r.stdout)
    seq_short = seq_we.split("-")[-1]
    victim = next(base.glob(f"{seq_we}*/tickets/TKT-{seq_short}-002_*.md"))
    victim.unlink()
    tkt(base, "create", "--we", seq_we, "--title", "added after a deletion")
    ids = sorted(p.name.split("_")[0] for p in base.glob(f"{seq_we}*/tickets/TKT-*.md"))
    check(len(ids) == len(set(ids)), f"ticket ids stay unique after a deletion (got {ids})")

    # 8. An explicit WE id that already exists must be refused, not merged.
    r = we(base, "create", "--title", "Collision", "--we", seq_we, "--todo", "x")
    check(r.returncode == 1, "reusing an existing work effort id is refused")
    check("already exists" in r.stderr, "the refusal explains why")

    # 9. An invalid explicit WE id is refused.
    check(we(base, "create", "--title", "Bad id", "--we", "WE-BAD", "--todo", "x").returncode == 1,
          "a malformed work effort id is refused")

    # 10. A RANDOM id collision. generate_we_id draws 4 chars from 36, so
    #     across a few hundred work efforts a repeat is a question of when.
    #     create_work_effort_structure uses mkdir(exist_ok=True), so the
    #     failure mode is not an error, it is two unrelated work efforts
    #     quietly sharing one folder. Simulated by handing the same id back.
    r = we(base, "create", "--title", "First occupant", "--we", "WE-260730-cc11", "--todo", "alpha")
    check(r.returncode == 0, "a fresh explicit id is accepted")
    r = we(base, "create", "--title", "Second occupant", "--we", "WE-260730-cc11", "--todo", "beta")
    check(r.returncode == 1, "a colliding id is refused rather than merged")
    folders = list(base.glob("WE-260730-cc11*"))
    check(len(folders) == 1, f"the collision produced no second folder (got {len(folders)})")
    tickets = list(folders[0].glob("tickets/TKT-*.md")) if folders else []
    check(len(tickets) == 1,
          f"the first occupant's tickets were not joined by the second's (got {len(tickets)})")

    print("\nlisting")
    r = we(base, "list")
    check(r.returncode == 0 and "work efforts" in r.stdout, "we list runs")
    r = we(base, "list", "--filter-status", "completed")
    check(sync_we in r.stdout, "status filter includes the closed work effort")
    check(seq_we not in r.stdout, "status filter excludes an active one")
    r = tkt(base, "list", "--we", seq_we)
    check("tickets" in r.stdout, "ticket list runs for one work effort")

print(f"\n{checks} checks, {len(failures)} failed")
for f in failures:
    print(f"  FAILED: {f}")
sys.exit(1 if failures else 0)
