# Ticket Tool

Create tickets in work efforts using the existing TKT-xxxx-NNN format.

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
```

## Options

| Option | Short | Description |
|--------|-------|-------------|
| `--we` | `-w` | Work effort ID (required) |
| `--title` | `-t` | Ticket title (required) |
| `--desc` | `-d` | Ticket description |
| `--work-efforts-dir` | | Base directory (default: _work_efforts) |

## Output

Creates a ticket file at `{we_folder}/tickets/TKT-xxxx-NNN_{sanitized_title}.md` with YAML frontmatter and standard sections.
