---
id: WE-260101-ph2b
title: "Plugin System v0.9 Phase 2 - Base Classes"
status: completed
created: 2026-01-01T22:06:00.000Z
completed: 2026-01-01T22:12:00.000Z
objective: "Create abstract plugin architecture for external task integrations"
phase: 2
total_phases: 6
---

# Plugin System v0.9 Phase 2 - Base Classes

Create the abstract plugin architecture that Todoist (Phase 3) and future plugins will implement.

## Objectives

- ✅ Create `plugins/base.py` with abstract base classes
- ✅ Define `ExternalTask` and `WorkEffort` dataclasses
- ✅ Implement event system for dashboard integration
- ✅ Create `_template` plugin for developers
- ✅ Integrate naming linter validation
- ✅ Add comprehensive documentation
- ✅ Test and validate implementation

## Architecture

### Core Components

1. **BasePlugin** - Abstract base class for all plugins
   - Config validation
   - Task fetching
   - Work effort creation
   - Feedback posting
   - Cleanup operations
   - Event system

2. **ExternalTask** - Dataclass for external tasks
   - ID, title, description
   - Timestamps (created, due)
   - Labels, URL
   - Raw API data

3. **WorkEffort** - Dataclass for created work efforts
   - WE ID
   - Paths (folder, index, tickets)
   - Source task reference

### Integration Points

- **Naming Linter**: Uses Phase 1 validation for folder names
- **Event System**: Emits events for dashboard monitoring
- **Template**: Shows developers how to implement plugins

## Progress

- [x] Created `plugins/` directory structure
- [x] Implemented `plugins/__init__.py`
- [x] Implemented `plugins/base.py` with all dataclasses
- [x] Implemented event system
- [x] Created template plugin structure
- [x] Created template README with developer guide
- [x] Added naming linter integration helpers (`plugins/helpers.py`)
- [x] Created main `plugins/README.md`
- [x] Tested imports and abstract class behavior (all tests passed!)
- [x] Ready to commit and push changes

## Test Results

All 6 tests passed:
- ✓ Imports work correctly
- ✓ Dataclasses instantiate properly
- ✓ BasePlugin prevents direct instantiation
- ✓ Template plugin works as expected
- ✓ Event system functions correctly
- ✓ Helper functions validated

## Next Steps (Phase 3)

After Phase 2 completion:
- Build Todoist plugin as first concrete implementation
- Create Todoist API v2 client
- Test with real Todoist tasks
- Validate complete workflow

## References

- Spec: `V0.9.0_PHASE2_CONTINUATION.md`
- Phase 1: `tools/naming-linter/`
- ID Generation: `tools/work-effort-migrator/migrate.py`
