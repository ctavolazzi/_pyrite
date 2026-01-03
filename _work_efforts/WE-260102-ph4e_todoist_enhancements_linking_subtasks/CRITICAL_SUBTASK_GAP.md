# CRITICAL GAP: Subtask Implementation Mismatch

**Date**: 2026-01-03
**Severity**: HIGH
**Status**: Needs Decision

## The Problem

Our Phase 4 implementation has a fundamental mismatch between what we claim to do and what we actually do.

### What We Say We Do
- "Parse subtasks from Todoist task descriptions"
- "Convert Todoist subtasks into individual tickets"

### What We Actually Do
- Parse markdown checklist items (`- [ ] Item`) from the task's **description** field
- Convert those checklist items into tickets

### What Todoist Actually Does for Subtasks
- Subtasks are **separate Task objects** with a `parent_id` field
- They appear in the API as distinct tasks, not as description text
- Parent-child relationship is via `parent_id`, not description content

## Example

### Native Todoist Subtasks (NOT handled):
```json
// Parent task
{
  "id": "12345",
  "content": "Build authentication system",
  "parent_id": null
}

// Subtask (separate API object)
{
  "id": "12346",
  "content": "Create login form",
  "parent_id": "12345"  // ← Links to parent
}
```

### What We Actually Parse (description checklists):
```json
{
  "id": "12345",
  "content": "Build authentication system",
  "description": "- [ ] Create login form\n- [ ] Add OAuth",
  "parent_id": null
}
```

## Impact

### Users Will Be Confused
- If they create native Todoist subtasks → **They won't be processed**
- They must manually type markdown checklists in the description → **Awkward workflow**

### Documentation is Misleading
- README says "subtasks" but doesn't clarify this means "description checklists"
- QUICK_START guide shows checklist example but doesn't mention this limitation

### Feature Completeness
- We only handle ~50% of Todoist's subtask model
- Native subtasks (the main feature) are ignored

## Options

### Option 1: Enhance to Handle Both (Recommended)
**Pros**:
- Supports native Todoist workflow
- Users can create subtasks naturally in Todoist UI
- More complete integration

**Implementation**:
1. When fetching a task with trigger label
2. Check if it has `parent_id` (it's a subtask) → skip it, process parent instead
3. When processing a parent task:
   - Fetch all child tasks (using API filter `parent_id=TASK_ID`)
   - Create tickets from both:
     - Native subtasks (from API)
     - Description checklist items (current implementation)

**Effort**: ~2 hours

### Option 2: Document the Limitation (Quick Fix)
**Pros**:
- No code changes needed
- Clear about what we actually do

**Implementation**:
1. Update README to say "description checklists" not "subtasks"
2. Add note: "Native Todoist subtasks not yet supported"
3. Update QUICK_START with clear example

**Effort**: ~15 minutes

### Option 3: Remove Description Parsing, Only Use Native Subtasks
**Pros**:
- Aligns with Todoist's model
- Cleaner implementation

**Cons**:
- Breaks current tests
- Forces users to use Todoist UI (can't put checklists in description)

**Effort**: ~1 hour

## Recommendation

**Go with Option 1** for Phase 4 completion:
- Enhances the feature to handle BOTH types
- Provides best user experience
- Aligns with "subtask" terminology we've been using

**For NOW** (before live testing):
- Use Option 2 to clarify docs
- Test with real Todoist to confirm API behavior
- Then implement Option 1 in a follow-up commit

## API Investigation Needed

Before implementing, we need to:
1. ✅ Confirm `parent_id` field exists in API response
2. ✅ Test fetching tasks with `parent_id` filter
3. ✅ Verify behavior when parent has trigger label but children don't

## Sources

- [Todoist REST API Documentation](https://developer.todoist.com/rest/v1/)
- [Introduction to sub-tasks](https://www.todoist.com/help/articles/introduction-to-sub-tasks-kMamDo)
- [How to sync parent tasks and sub-tasks](https://2sync.com/faq/article/how-to-sync-parent-tasks-and-subtasks)

## Next Steps

1. Test with real Todoist API to confirm behavior
2. Decide on option (recommend Option 1)
3. Update documentation immediately (Option 2)
4. Implement native subtask support (Option 1)
5. Add tests for both types of subtasks
