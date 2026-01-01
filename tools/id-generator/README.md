# ID Generator

Generate and validate Pyrite work tracking IDs with a consistent naming structure.

## Quick Start

```bash
# Generate IDs
python3 tools/id-generator/generate.py work-effort
python3 tools/id-generator/generate.py ticket --parent WE-251231-a1b2
python3 tools/id-generator/generate.py checkpoint

# Validate IDs
python3 tools/id-generator/generate.py validate WE-251231-a1b2

# Batch generation for a new workflow
python3 tools/id-generator/generate.py batch --tickets 5 --checkpoint
```

## ID Formats

| Type | Format | Example | Description |
|------|--------|---------|-------------|
| Work Effort | `WE-YYMMDD-xxxx` | `WE-251231-a1b2` | Date + 4-char suffix |
| Ticket | `TKT-xxxx-NNN` | `TKT-a1b2-001` | Parent suffix + 3-digit number |
| Checkpoint | `CKPT-YYMMDD-HHMM` | `CKPT-251231-1430` | Date + time |

## Commands

### Generate Work Effort

```bash
python3 tools/id-generator/generate.py work-effort
# Output: WE-251231-x7k9

python3 tools/id-generator/generate.py we --json
# Output: {"valid": true, "type": "work_effort", "id": "WE-251231-x7k9", ...}
```

### Generate Ticket

```bash
# With parent (extracts suffix automatically)
python3 tools/id-generator/generate.py ticket --parent WE-251231-a1b2
# Output: TKT-a1b2-001

# With specific number
python3 tools/id-generator/generate.py ticket --parent WE-251231-a1b2 --number 5
# Output: TKT-a1b2-005

# Without parent (random suffix)
python3 tools/id-generator/generate.py ticket
# Output: TKT-x7k9-001
```

### Generate Checkpoint

```bash
python3 tools/id-generator/generate.py checkpoint
# Output: CKPT-251231-1430
```

### Validate ID

```bash
python3 tools/id-generator/generate.py validate WE-251231-a1b2
# ✅ Valid work_effort: WE-251231-a1b2
#    date: 2025-12-31
#    suffix: a1b2
#    folder_pattern: WE-251231-a1b2_*

python3 tools/id-generator/generate.py validate INVALID-123
# ❌ Invalid: INVALID-123
#    Does not match any known pattern
```

### Parse ID

```bash
python3 tools/id-generator/generate.py parse TKT-a1b2-001
# Type: ticket
# ID: TKT-a1b2-001
# Components:
#   parent_suffix: a1b2
#   number: 1
#   parent_pattern: WE-*-a1b2
```

### Batch Generation

```bash
python3 tools/id-generator/generate.py batch --tickets 3 --checkpoint
# ==================================================
# Batch ID Generation
# ==================================================
#
# 📁 Work Effort: WE-251231-x7k9
#
# 📋 Tickets (3):
#    TKT-x7k9-001
#    TKT-x7k9-002
#    TKT-x7k9-003
#
# 📍 Checkpoint: CKPT-251231-1430
```

### List Types

```bash
python3 tools/id-generator/generate.py types
# Supported ID Types:
#
#   work-effort (we)
#     Format: WE-YYMMDD-xxxx
#     Example: WE-251231-a1b2
#
#   ticket (tkt)
#     Format: TKT-xxxx-NNN
#     Example: TKT-a1b2-001
#     Requires: --parent WE-YYMMDD-xxxx
#
#   checkpoint (ckpt)
#     Format: CKPT-YYMMDD-HHMM
#     Example: CKPT-251231-1430
```

## Architecture

The script uses a **switch statement pattern** for extensibility:

```python
def generate_id(id_type: str, **kwargs) -> str:
    generators = {
        'work-effort': _generate_work_effort_id,
        'ticket': _generate_ticket_id,
        'checkpoint': _generate_checkpoint_id,
    }

    generator = generators.get(id_type.lower())
    return generator(**kwargs)
```

To add a new ID type:

1. Add pattern to `PATTERNS` dict
2. Add generator function `_generate_xxx_id()`
3. Add parser function `_parse_xxx()`
4. Register in `generate_id()` and `validate_id()`

## Integration

### With MCP Servers

The ID generator uses the same formats as MCP work-efforts server:

```python
# Generate ID programmatically
from generate import generate_id, validate_id

we_id = generate_id('work-effort')
tkt_id = generate_id('ticket', parent=we_id)

# Validate before using
result = validate_id(tkt_id)
if result['valid']:
    # Use the ID
    pass
```

### With Shell Scripts

```bash
#!/bin/bash
WE_ID=$(python3 tools/id-generator/generate.py work-effort)
echo "Created work effort: $WE_ID"

# Create folder
mkdir -p "_work_efforts/${WE_ID}_my_task"
```

## Requirements

- Python 3.6+
- No external dependencies (pure stdlib)

## License

MIT (same as parent project)

