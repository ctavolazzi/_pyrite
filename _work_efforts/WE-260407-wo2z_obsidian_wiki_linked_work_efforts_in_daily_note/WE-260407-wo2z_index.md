---
id: WE-260407-wo2z
title: "Obsidian Wiki-Linked Work Efforts in Daily Note"
status: completed
created: 2026-04-07T23:05:37.815361
last_updated: 2026-04-07T23:08:00.000000
source: daily_note_bridge
labels: ['daily-note', 'obsidian', 'pyrite-plugin']
objective: "Wire _pyrite work effort tracking into the daily note harness with Obsidian wiki-links"
---

# Obsidian Wiki-Linked Work Efforts in Daily Note

## Objective

Make the daily note's `## Work Efforts` section a live, navigable dashboard of _pyrite work effort activity by:
1. Syncing structured WE summaries from `_pyrite/_work_efforts/` into the Obsidian daily note
2. Rendering WE IDs as `[[wiki-links]]` so they are clickable in Obsidian
3. Including git repository health data in the same section

## Description

Two independent work-tracking systems existed in the workspace:
- **_pyrite** (`active/_pyrite/`) — 28 work efforts (WE-YYMMDD-xxxx), MCP server, plugin architecture
- **Daily Note harness** (`_experiments/SimpleAgentOS/daily_note.py`) — Obsidian daily notes with a `## Work Efforts` section

They had no integration. This WE bridges them.

## Architecture

**Bridge lives in _pyrite** as `plugins/daily_note/plugin.py`, following the Todoist plugin pattern.

**Data flow:** `_pyrite WE dirs -> scan frontmatter -> format markdown with [[wiki-links]] -> write_section("work_efforts")`

**Communication:** Direct Python import of `daily_note.py` via `sys.path` insertion. daily_note.py stays zero-dependency.

## Files Created

| File | Purpose |
|------|---------|
| `plugins/daily_note/__init__.py` | Package init |
| `plugins/daily_note/plugin.py` | `DailyNoteBridge` class (~155 lines) |

## Files Modified

| File | Change |
|------|--------|
| `pyrite` (CLI) | Added `daily-note` subcommand with `--dry-run`, `--no-git-health`, `--date` flags |

## Key Design Decisions

- **Bridge in _pyrite, not SimpleAgentOS** — _pyrite is the data producer; daily_note.py is write-only target
- **Regex YAML parser** — no PyYAML dependency, consistent with daily_note.py's approach
- **`[[WE-ID\|Title]]` alias syntax** — ID column links to WE note, Title column shows human-readable name with link
- **Git health included by default** — DailyNoteBridge takes ownership of entire `## Work Efforts` section
- **Replace mode** — idempotent; running twice produces identical output
- **`created` fallback** — if `last_updated` is missing, falls back to `created` date for display

## CLI Usage

```bash
./pyrite daily-note              # live sync (WEs + git health -> daily note)
./pyrite daily-note --dry-run    # preview output without writing
./pyrite daily-note --no-git-health  # WEs only, skip repo scan
./pyrite daily-note --date 2026-04-08  # target a specific date
```

## Output Format

```markdown
**_pyrite Work Efforts** -- synced HH:MM

| Status | ID | Title | Last Updated |
|--------|----|-------|--------------|
| active | [[WE-260407-wo2z]] | [[WE-260407-wo2z|Obsidian Wiki-Linked...]] | Apr 07 |

**Summary:** 28 total -- 10 active, 17 completed, 1 paused

---

**Git Health Scan** -- 2026-04-07 HH:MM
[repo table...]
```

## Test Results

| Test | Result |
|------|--------|
| Dry run (no git health) | 28 WEs scanned, 10 active, wiki-links rendered |
| Dry run (with git health) | Full output with repo health table |
| Live sync | `status: written` to `work_efforts` section |
| Section status | Confirmed `filled` in daily note |
| Idempotent re-sync | Identical output on second run |
| Cross-reference | `daily_note.py read work_efforts` returns wiki-linked content |

## Progress

- [x] Created DailyNoteBridge plugin class
- [x] Implemented frontmatter scanner (regex, zero-dep)
- [x] Implemented markdown formatter with [[wiki-links]]
- [x] Wired git_scanner integration (optional)
- [x] Added `daily-note` subcommand to pyrite CLI
- [x] Tested dry-run, live sync, idempotency
- [x] Created this work effort (WE-260407-wo2z) using the system itself

## Future Work

- Pre-create Obsidian note files for each WE so [[links]] resolve to real content
- Hook into MCP work-efforts server events to auto-sync on WE create/update
- Add `--active-only` flag to filter output
- Integrate with `/spin-up` and `/continue` slash commands
