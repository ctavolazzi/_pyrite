---
id: TKT-260101-001
title: "Create BasePlugin Helper Methods"
status: in_progress
created: 2026-01-01T22:08:00.000Z
we_id: WE-260101-ph2b
---

# Create BasePlugin Helper Methods

Add helper methods to BasePlugin for common operations that all plugins will need.

## Tasks

- [x] Create `plugins/helpers.py` module
- [ ] Implement `generate_we_id()` function
- [ ] Implement `sanitize_title()` function
- [ ] Integrate naming linter validation
- [ ] Add unit tests for helpers

## Implementation Notes

These helpers should:
1. Generate WE IDs in `WE-YYMMDD-xxxx` format
2. Sanitize task titles for folder names
3. Validate using Phase 1 naming linter
4. Be reusable across all plugins

## Integration

Import and use in `create_work_effort()` method:
```python
from plugins.helpers import generate_we_id, sanitize_title
from tools.naming_linter.rules.common import validate_we_folder_name
```

## Acceptance Criteria

- Helper functions exist and work correctly
- Naming linter validation integrated
- Template plugin updated to use helpers
- Tests pass
