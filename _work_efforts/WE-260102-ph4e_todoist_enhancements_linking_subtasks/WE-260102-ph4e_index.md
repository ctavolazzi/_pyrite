---
id: WE-260102-ph4e
title: "Todoist Plugin Enhancements: Linking & Subtasks (Phase 4)"
status: in_progress
created: 2026-01-03T00:00:00Z
source: manual
labels: [plugin-system, v0.9.0, phase-4, todoist, enhancements]
---

# Todoist Plugin Enhancements: Linking & Subtasks (Phase 4)

Phase 4 enhancements to the Todoist plugin, adding work effort linking, subtask parsing, and ticket creation capabilities.

## Description

Phase 4 builds on the Phase 3 Todoist integration by adding advanced features:
- **WE Lookup**: Check for existing work efforts before creating new ones
- **Subtask Parsing**: Convert Todoist subtasks into individual tickets
- **Multi-Task WE**: Allow multiple Todoist tasks to contribute to the same work effort
- **Enhanced Feedback**: Show detailed information about created tickets

## Objectives

- [ ] Implement work effort lookup by WE-ID
- [ ] Parse subtasks from Todoist task descriptions
- [ ] Create tickets from subtasks
- [ ] Link multiple tasks to same work effort
- [ ] Enhance feedback messages
- [ ] Write comprehensive tests
- [ ] Update documentation

## Implementation Details

### 1. Work Effort Lookup & Linking

**Current behavior**: Every Todoist task with 'pyrite' label creates a NEW work effort

**New behavior**:
- Check if task references an existing WE first
- Parse `WE-YYMMDD-xxxx` from task description
- If found, link to that WE instead of creating new one
- If not found, create new WE as before

**Example**:
```
Todoist task: "Frontend auth UI [pyrite] WE-260102-auth"
→ Finds existing WE-260102-auth
→ Links to it instead of creating new WE
```

### 2. Subtask → Ticket Mapping

**Current behavior**: Only the main task is processed, subtasks ignored

**New behavior**:
- Main task → work effort (existing or new)
- Each subtask → ticket in `tickets/` directory

**Example**:
```
Todoist:
☐ Build auth system [pyrite] WE-260102-auth
  ☐ Create login form
  ☐ Add password reset
  ☐ Implement OAuth

→ Creates:
_work_efforts/WE-260102-auth_authentication_system/
  tickets/
    TKT-auth-001_create_login_form.md
    TKT-auth-002_add_password_reset.md
    TKT-auth-003_implement_oauth.md
```

### 3. Multiple Tasks → One Work Effort

**Scenario**:
```
Todoist Task 1: "Frontend auth UI [pyrite] WE-260102-auth"
  ☐ Login form
  ☐ Signup form

Todoist Task 2: "Backend auth API [pyrite] WE-260102-auth"
  ☐ JWT middleware
  ☐ Password hashing
```

Both tasks find same WE and create tickets in same `tickets/` directory.

### 4. Enhanced Feedback

**Current feedback**:
```markdown
✅ Work Effort Created!
📁 Folder: WE-260102-auth_authentication_system
```

**New feedback**:
```markdown
✅ Linked to Work Effort: WE-260102-auth

📁 Folder: WE-260102-auth_authentication_system
📋 Index: WE-260102-auth_index.md

🎫 Tickets Created:
- TKT-auth-001_create_login_form.md
- TKT-auth-002_add_password_reset.md

You can now track progress in the _pyrite system!
```

## Technical Implementation

### New Methods in TodoistPlugin

1. **`find_work_effort(we_id: str) -> Optional[Path]`**
   - Search for existing work effort by WE-ID
   - Return path if found, None otherwise

2. **`parse_subtasks(task: ExternalTask) -> List[str]`**
   - Parse markdown checklist from task description
   - Extract subtask titles
   - Return list of subtask strings

3. **`create_ticket(we_path: Path, title: str, description: str, source_task_id: str) -> Path`**
   - Create ticket file in WE tickets/ directory
   - Use TKT-xxxx-NNN naming format
   - Add frontmatter with Todoist task reference
   - Return path to created ticket

4. **Enhanced `create_work_effort(task: ExternalTask) -> WorkEffort`**
   - Check for WE-ID in task description first
   - If found, link to existing WE
   - If not found, create new WE (current behavior)
   - Parse subtasks and create tickets
   - Return enhanced WorkEffort with ticket info

5. **Enhanced `_format_feedback_message(task: ExternalTask, we: WorkEffort) -> str`**
   - Show whether WE was linked or created
   - List all created tickets
   - Provide helpful next steps

### New Helper Functions

Add to `plugins/helpers.py`:

1. **`find_work_effort_by_id(base_path: Path, we_id: str) -> Optional[Path]`**
   - Global search for WE by ID
   - Check all WE directories
   - Return first match

2. **`generate_ticket_id(we_id: str, sequence: int) -> str`**
   - Generate TKT-xxxx-NNN format
   - Use WE short ID for consistency
   - Zero-pad sequence number

## Testing Strategy

### Unit Tests

- Test WE lookup with existing and non-existing WE-IDs
- Test subtask parsing with various formats
- Test ticket creation with proper naming
- Test multiple tasks → one WE scenario
- Test enhanced feedback formatting

### Integration Tests

- Test complete workflow: Todoist task → WE + tickets
- Test linking to existing WE
- Test creating new WE when none exists
- Verify event system integration

### Manual Testing

1. Create WE manually, then create Todoist task referencing it
2. Create Todoist task with subtasks
3. Create multiple Todoist tasks with same WE-ID
4. Verify all scenarios work end-to-end

## Files to Create/Modify

### Modified
- `plugins/todoist/plugin.py` - Add new methods and enhance existing ones
- `plugins/helpers.py` - Add work effort and ticket utilities
- `test_todoist.py` - Add tests for new functionality
- `plugins/todoist/README.md` - Document new features

### Created
- Test fixtures for Phase 4 scenarios
- Example Todoist tasks with subtasks

## Success Criteria

Phase 4 is complete when:

- ✅ Plugin checks for existing WE before creating new
- ✅ WE-ID can be parsed from task description
- ✅ Subtasks are converted to tickets
- ✅ Multiple tasks can contribute to same WE
- ✅ Enhanced feedback shows created tickets
- ✅ All tests passing (existing + new)
- ✅ Documentation updated with examples
- ✅ Real-world testing with Todoist completed

## Next Steps (Phase 5+)

- Webhook support instead of polling
- Bi-directional sync (update Todoist when tickets complete)
- Dashboard integration for real-time monitoring
- Additional plugin types (GitHub Issues, Jira)
- Plugin marketplace/registry

## Timeline

- **Started**: 2026-01-03
- **Target Completion**: TBD
- **Status**: In Progress

## Dependencies

- Phase 3: ✅ Todoist plugin (merged in PR #29)
- Python 3.11+
- requests library

## References

- **Phase 4 Plan**: `V0.9.0_PHASE4_CONTINUATION.md`
- **Phase 3 Recap**: `FINAL_RECAP_PHASE3.md`
- **Todoist Plugin**: `plugins/todoist/`
- **Base Classes**: `plugins/base.py`
