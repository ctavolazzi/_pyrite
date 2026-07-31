# Work Effort Tool

Turn a list of todos into a wired work effort: one hub index, one ticket per todo,
links that resolve in both directions.

Fills the gap between `plugins.helpers` (which could build work effort folders but
was only ever driven by the Todoist plugin) and `tools/ticket/create.py` (which adds
one ticket at a time to a work effort that already exists). Before this, there was no
way to create a work effort from the CLI at all.

## Usage

```bash
# Todos as repeated flags
pyrite we create --title "Ship checkout" --todo "Wire the webhook" --todo "Take one real dollar"

# Todos from a file: markdown checklist, bullets, numbered list, or one per line
pyrite we create --title "Ship checkout" --todos-file todos.md

# Todos from stdin
cat todos.md | pyrite we create --title "Ship checkout" --todos-file -

# See what would be written, write nothing
pyrite we create --title "Ship checkout" --todos-file todos.md --dry-run

# List work efforts and their IDs, which is what `pyrite ticket create --we` needs
pyrite we list
pyrite we list --filter-status active
```

## Options

| Option | Short | Description |
|--------|-------|-------------|
| `--title` | `-t` | Work effort title (required for create) |
| `--objective` | `-o` | One-line statement of what this is for |
| `--desc` | `-d` | Longer description |
| `--todo` | | A todo to capture as a ticket (repeatable) |
| `--todos-file` | | File of todos, or `-` for stdin |
| `--label` | | Label for the work effort and its tickets (repeatable) |
| `--status` | | `active`, `paused` or `completed` (default: `active`) |
| `--we` | `-w` | Use this work effort ID instead of generating one |
| `--filter-status` | | list only: show work efforts with this status |
| `--dry-run` | | Report what would be created, write nothing |
| `--work-efforts-dir` | | Base directory (default: `_work_efforts`) |

## What gets written

```
_work_efforts/WE-260730-tfxo_sightglass_follow_through/
    WE-260730-tfxo_index.md                     hub
    tickets/TKT-tfxo-001_wire_page_coverage.md  spoke
    tickets/TKT-tfxo-002_diff_each_probe_s.md   spoke
```

The hub carries a Tickets table linking out to each spoke. Each spoke carries a
`parent:` frontmatter field and a `Part of [[...]]` link back to the hub.

## Why links use the full filename stem

`tools/obsidian-linter` resolves a wikilink only against exact index keys, and the
key for a ticket is its full filename stem. So:

| Form | Result |
|------|--------|
| `TKT-tfxo-001` bare | flagged: unlinked reference |
| `[[TKT-tfxo-001]]` | flagged: broken wikilink, target not found |
| `[[TKT-tfxo-001_wire_page_coverage\|TKT-tfxo-001]]` | resolves |

Only the third form satisfies both linter rules. `sanitize_title` truncates at 50
characters, so the stem is not derivable by eye. `ticket_file_stem()` in
`plugins/helpers.py` is shared by the code that writes the file and the code that
links to it, which is what keeps them from drifting apart. Do not inline it.

Several hand-written tickets elsewhere in `_work_efforts/` predate this and use bare
`[[WE-...]]` links, which the linter reports as broken. That is a pre-existing
condition, not something this tool introduces.

## Verification

```bash
python3 tools/work-effort/verify.py       # 25 checks on plugins/helpers.py
python3 tools/work-effort/verify_cli.py   # 52 checks on the CLI surface
pyrite lint --scope _work_efforts/WE-260730-tfxo_sightglass_follow_through
```

`verify_cli.py` drives the real scripts through subprocess and feeds them
hostile input, because that is where the bugs were. It found four:

| Defect | Symptom |
|--------|---------|
| Unescaped `"` in a title | Emitted invalid YAML. `gray-matter`, which the dashboard uses, **throws**, so one ticket took down a whole work effort |
| Unescaped `\|` in a title | Silently added a column to the Tickets table |
| `sync` regex needed a trailing `## ` | Could never sync a work effort whose Tickets table was the last section |
| Ticket sequence used `len() + 1` | Deleting a middle ticket made the next one reuse an existing ID |

All four were latent rather than manifest: a scan of all 314 markdown files
under `_work_efforts/` found zero unparseable, because no title had yet
contained a double quote. That is luck, not design.

Each fix is mutation-tested. Reverting any one of them turns the suite red,
which is the only reason the green result means anything.

`verify.py` asserts. It does not follow the pattern in the repo root's
`test_plugins.py`, which returns `True`/`False` instead of asserting. pytest reports a
test that returns `False` as PASSED, so those 6 passes cannot detect a regression.
Measured directly:

```
$ printf 'def test_definitely_broken():\n    return False\n' > t.py && pytest t.py -q
1 passed, 1 warning in 0.01s
```
