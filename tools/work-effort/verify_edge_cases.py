#!/usr/bin/env python3
"""
Edge cases for the work effort and ticket tooling, past the happy path.

verify.py covers plugins/helpers.py. verify_cli.py covers the CLI surface on
hostile input at CREATE time. This file covers what happens AFTERWARDS: the
states a work effort reaches once a human has edited it, which is where the
last two data-integrity bugs actually lived.

The distinction matters. Every check in verify.py builds a ticket and inspects
it immediately, so the title in the frontmatter and the title baked into the
filename can never disagree. That is precisely the assumption that broke: sync
recomputed the wikilink target from the title, the file kept its original name,
and renaming a ticket left the hub pointing at a file nobody had written. The
suite passed the whole time because its fixtures never renamed anything.

So the rule here: mutate state after creation, then re-check the invariants.

    python3 tools/work-effort/verify_edge_cases.py

Exits non-zero if any check fails.
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


def we_dir(base, we_id):
    hits = [p for p in base.iterdir() if p.is_dir() and p.name.startswith(we_id)]
    return hits[0] if hits else None


def hub_text(base, we_id):
    d = we_dir(base, we_id)
    return (d / f"{we_id}_index.md").read_text()


def ticket_rows(base, we_id):
    """Every data row of the hub's Tickets table."""
    return [ln for ln in hub_text(base, we_id).splitlines() if ln.startswith("| [[")]


def link_targets(base, we_id):
    """The stem each hub wikilink points at."""
    return re.findall(r'\[\[(TKT-[^|\]]+)', hub_text(base, we_id))


def dangling(base, we_id):
    """Hub links with no ticket file behind them. This is the money check."""
    d = we_dir(base, we_id)
    return [t for t in link_targets(base, we_id)
            if not (d / "tickets" / f"{t}.md").exists()]


def unescaped_pipes(row):
    """
    Count pipes that a markdown table parser will treat as delimiters.

    Counting RAW pipes is the wrong instrument and was already shipped once as
    a hollow check: the fix emits \\| which still contains the character, so a
    raw count passes whether or not the bug is present. A correct data row has
    exactly five: four cell delimiters plus the one inside [[stem|ID]], which
    is Obsidian link syntax and is deliberately not escaped.
    """
    return len(re.findall(r'(?<!\\)\|', row))


def frontmatter(path):
    text = path.read_text()
    m = re.match(r'^---\n(.*?)\n---\n', text, re.DOTALL)
    return yaml.safe_load(m.group(1)) if m else None


def retitle(path, new_title):
    """Edit a ticket's title in place, the way a human would."""
    text = path.read_text()
    text = re.sub(r'^title:.*$', f'title: {yaml.dump(new_title).strip()}',
                  text, count=1, flags=re.MULTILINE)
    path.write_text(text)


def make_we(base, title="Edge case host", todos=("first", "second", "third")):
    args = ["create", "--title", title]
    for t in todos:
        args += ["--todo", t]
    r = we(base, *args)
    return we_id_from(r.stdout)


print("== 1. a title edited after creation must not orphan its hub link ==")
with tempfile.TemporaryDirectory() as tmp:
    base = Path(tmp)
    wid = make_we(base)
    d = we_dir(base, wid)
    first = sorted((d / "tickets").glob("TKT-*.md"))[0]
    original_stem = first.stem

    retitle(first, "a completely different title than the filename encodes")
    r = we(base, "sync", "--we", wid)

    check(r.returncode == 0, "sync succeeds after a title edit")
    check(first.exists(), "the ticket file itself was not renamed or moved")
    check(dangling(base, wid) == [],
          "no hub wikilink dangles after a title edit")
    check(original_stem in link_targets(base, wid),
          "the hub link still points at the real filename, not the new title")
    check("a completely different title than the filename encodes"
          in hub_text(base, wid),
          "the hub table still displays the NEW title")

print()
print("== 2. a ticket file renamed on disk keeps a resolving link ==")
with tempfile.TemporaryDirectory() as tmp:
    base = Path(tmp)
    wid = make_we(base)
    d = we_dir(base, wid)
    first = sorted((d / "tickets").glob("TKT-*.md"))[0]
    tid = frontmatter(first)["id"]

    moved = first.with_name(f"{tid}_renamed_by_hand.md")
    first.rename(moved)
    r = we(base, "sync", "--we", wid)

    check(r.returncode == 0, "sync succeeds after a file rename")
    check(dangling(base, wid) == [], "no hub wikilink dangles after a rename")
    check(f"{tid}_renamed_by_hand" in link_targets(base, wid),
          "the hub link followed the file to its new name")

print()
print("== 3. hostile titles survive the create -> read -> sync round trip ==")
HOSTILE = [
    ('handle "quoted" input', "double quote"),
    ("a|b routing table", "pipe"),
    ('both "quoted" and a|pipe', "quote and pipe together"),
    ("see [[SomeOtherNote]] for context", "wikilink braces"),
    ("trailing backslash \\", "trailing backslash"),
    ("'fully single quoted'", "leading and trailing apostrophes"),
    ('"fully double quoted"', "leading and trailing double quotes"),
]
for title, label in HOSTILE:
    with tempfile.TemporaryDirectory() as tmp:
        base = Path(tmp)
        wid = make_we(base, todos=("placeholder",))
        d = we_dir(base, wid)
        r = tkt(base, "create", "--we", wid, "--title", title)
        created = r.returncode == 0
        check(created, f"[{label}] ticket creates without error")
        if not created:
            continue

        paths = sorted((d / "tickets").glob("TKT-*.md"))
        target = [p for p in paths if p.stem.startswith("TKT-") and
                  frontmatter(p) and frontmatter(p).get("title") is not None]
        fm = frontmatter(paths[-1])

        check(fm is not None,
              f"[{label}] frontmatter still parses as YAML after write")
        if fm is not None:
            check(fm.get("title") == title,
                  f"[{label}] title round-trips through YAML byte for byte")

        we(base, "sync", "--we", wid)
        check(dangling(base, wid) == [], f"[{label}] no dangling hub link")
        rows = ticket_rows(base, wid)
        check(all(unescaped_pipes(r) == 5 for r in rows),
              f"[{label}] every table row keeps exactly 5 unescaped pipes")

print()
print("== 4. the table stays a table when the title fights it ==")
with tempfile.TemporaryDirectory() as tmp:
    base = Path(tmp)
    wid = make_we(base, todos=("plain one",))
    d = we_dir(base, wid)
    tkt(base, "create", "--we", wid, "--title", "col|umn|splitter|everywhere")
    we(base, "sync", "--we", wid)

    rows = ticket_rows(base, wid)
    counts = {unescaped_pipes(r) for r in rows}
    check(counts == {5},
          f"all rows have 5 unescaped pipes, got {sorted(counts)}")

    header = [ln for ln in hub_text(base, wid).splitlines()
              if ln.startswith("| Ticket")]
    check(len(header) == 1, "exactly one header row survives sync")

print()
print("== 5. repeated syncs are idempotent ==")
with tempfile.TemporaryDirectory() as tmp:
    base = Path(tmp)
    wid = make_we(base)
    we(base, "sync", "--we", wid)
    once = hub_text(base, wid)
    we(base, "sync", "--we", wid)
    twice = hub_text(base, wid)
    # last_updated is expected to move; the Tickets block is not.
    block = lambda t: t.split("## Tickets")[1].split("\n## ")[0]
    check(block(once) == block(twice),
          "the Tickets block is byte identical after a second sync")
    check(len(ticket_rows(base, wid)) == 3,
          "a second sync does not duplicate or drop rows")

print()
print("== 6. sequence numbers survive deletion of a middle ticket ==")
with tempfile.TemporaryDirectory() as tmp:
    base = Path(tmp)
    wid = make_we(base)
    d = we_dir(base, wid)
    paths = sorted((d / "tickets").glob("TKT-*.md"))
    paths[1].unlink()

    tkt(base, "create", "--we", wid, "--title", "added after a deletion")
    ids = [frontmatter(p)["id"] for p in sorted((d / "tickets").glob("TKT-*.md"))]
    check(len(ids) == len(set(ids)), f"no duplicate ticket ids, got {ids}")

print()
print("== 7. close refuses on the states that must block it ==")
with tempfile.TemporaryDirectory() as tmp:
    base = Path(tmp)

    empty = we(base, "create", "--title", "No tickets at all")
    eid = we_id_from(empty.stdout)
    r = we(base, "close", "--we", eid)
    check(r.returncode != 0,
          "close REFUSES a work effort with zero tickets (vacuous truth guard)")

    wid = make_we(base)
    r = we(base, "close", "--we", wid)
    check(r.returncode != 0, "close refuses while tickets are still open")

print()
print("== 8. sync tolerates the structural shapes that used to break it ==")
with tempfile.TemporaryDirectory() as tmp:
    base = Path(tmp)

    wid = make_we(base)
    d = we_dir(base, wid)
    hub = d / f"{wid}_index.md"
    text = hub.read_text()
    tail = text.split("## Tickets")[0] + "## Tickets\n\n| Ticket | Title | Status |\n|--------|-------|--------|\n"
    hub.write_text(tail)
    r = we(base, "sync", "--we", wid)
    check(r.returncode == 0, "sync works when Tickets is the FINAL section")
    check(len(ticket_rows(base, wid)) == 3,
          "all rows rebuilt when Tickets is the final section")

    wid2 = make_we(base, title="No tickets heading")
    d2 = we_dir(base, wid2)
    hub2 = d2 / f"{wid2}_index.md"
    hub2.write_text(hub2.read_text().split("## Tickets")[0])
    r = we(base, "sync", "--we", wid2)
    check(r.returncode == 0, "sync works when there is NO Tickets section yet")

print()
print("== 9. a frontmatter id that disagrees with its filename ==")
with tempfile.TemporaryDirectory() as tmp:
    base = Path(tmp)
    wid = make_we(base)
    d = we_dir(base, wid)
    first = sorted((d / "tickets").glob("TKT-*.md"))[0]
    text = first.read_text()
    first.write_text(re.sub(r'^id:.*$', 'id: TKT-zzzz-999', text,
                            count=1, flags=re.MULTILINE))
    r = we(base, "sync", "--we", wid)
    check(r.returncode == 0, "sync does not crash on an id/filename mismatch")
    check(dangling(base, wid) == [],
          "the link still resolves even when the id disagrees with the file")

print()
print("== 10. an empty title does not produce a broken link ==")
with tempfile.TemporaryDirectory() as tmp:
    base = Path(tmp)
    wid = make_we(base, todos=("real one",))
    d = we_dir(base, wid)
    first = sorted((d / "tickets").glob("TKT-*.md"))[0]
    retitle(first, "")
    r = we(base, "sync", "--we", wid)
    check(r.returncode == 0, "sync survives an empty title")
    check(dangling(base, wid) == [], "an empty title does not dangle the link")

print()
print(f"{checks} checks, {len(failures)} failed")
if failures:
    for f in failures:
        print(f"  FAILED: {f}")
    sys.exit(1)
