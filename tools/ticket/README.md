# Ticket Tool

Create, list and re-status tickets in work efforts, using the canonical
TKT-xxxx-NNN format where `xxxx` is the parent work effort's short id.

Uses `plugins.helpers` (create_ticket_file, generate_ticket_id, find_work_effort_by_id).

## Usage

```bash
# Via pyrite CLI (from project root)
pyrite ticket create --we WE-260127-abcd --title "Fix login bug"
pyrite ticket create --we WE-260127-abcd --title "Add tests" --desc "Unit tests for auth"

# Direct (from _pyrite or project with _work_efforts)
python3 tools/ticket/create.py --we WE-260127-abcd --title "Fix bug"

# Custom work efforts directory
pyrite ticket create --we WE-260127-abcd --title "Fix bug" --work-efforts-dir /path/to/_work_efforts

# List tickets, for one work effort or across all of them
pyrite ticket list --we WE-260127-abcd
pyrite ticket list

# Change a ticket's status without hand-editing frontmatter
pyrite ticket status --id TKT-abcd-001 --status in_progress
pyrite ticket status --id TKT-abcd-001 --status completed
```

Valid ticket statuses are `pending`, `in_progress`, `completed` and `blocked`.
After changing one, run `pyrite we sync --we <WE-ID>` so the work effort's
Tickets table matches the ticket files.

## Options

| Option | Short | Description |
|--------|-------|-------------|
| `--we` | `-w` | Work effort ID (required) |
| `--title` | `-t` | Ticket title (required) |
| `--desc` | `-d` | Ticket description |
| `--work-efforts-dir` | | Base directory (default: _work_efforts) |

## Output

Creates a ticket file at `{we_folder}/tickets/TKT-xxxx-NNN_{sanitized_title}.md` with YAML frontmatter and standard sections.
