# Frontmatter Validation Guide

## What We Check

### ✅ Currently Validated

1. **YAML Syntax**
   - Valid opening/closing `---` markers
   - Basic key-value parsing
   - Error reporting for malformed YAML

2. **Required Fields**
   - `id` - Entity identifier
   - `title` - Display title
   - `status` - Current status
   - `created` - Creation timestamp

3. **ID Format Validation**
   - **Work Effort**: `WE-YYMMDD-xxxx` (e.g., `WE-251231-25qq`)
   - **Ticket**: `TKT-xxxx-NNN` (e.g., `TKT-25qq-001`)
   - Validates against regex patterns
   - Checks ID matches filename pattern

4. **Status Value Validation**
   - **Work Effort**: `active`, `paused`, `completed`
   - **Ticket**: `pending`, `in_progress`, `completed`, `blocked`
   - Case-insensitive matching
   - Warns on invalid values

5. **Date Format Validation**
   - ISO 8601 format: `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss.sssZ`
   - Validates `created` and `last_updated` fields

6. **Parent Relationship Validation**
   - Ticket `parent` field must be valid work effort ID format
   - Checks if parent work effort exists in repository
   - Validates ticket ID suffix matches parent work effort suffix

7. **Consistency Checks**
   - ID matches file/folder naming pattern
   - Ticket suffix matches parent work effort suffix

## Example Valid Frontmatter

### Work Effort
```yaml
---
id: WE-251231-25qq
title: "GitHub Health Check Tool"
status: completed
created: 2025-12-31T20:34:34.994Z
created_by: ctavolazzi
last_updated: 2025-12-31T20:53:55.999Z
branch: feature/WE-251231-25qq-github_health_check_tool_foundation
repository: ctavolazzi/_pyrite
---
```

### Ticket
```yaml
---
id: TKT-25qq-001
parent: WE-251231-25qq
title: "Define tool architecture and file structure"
status: completed
created: 2025-12-31T20:34:35.146Z
created_by: ctavolazzi
assigned_to: null
---
```

## Common Issues & Fixes

### Issue: Invalid ID Format
**Error:** `Invalid work effort ID format: WE-123-abc (expected WE-YYMMDD-xxxx)`

**Fix:** Ensure ID follows format:
- Work Effort: `WE-YYMMDD-xxxx` (6-digit date, 4-char suffix)
- Ticket: `TKT-xxxx-NNN` (4-char parent suffix, 3-digit number)

### Issue: Invalid Status
**Warning:** `Invalid work effort status: active (expected: active, paused, completed)`

**Fix:** Use one of the valid status values (case-insensitive)

### Issue: Missing Parent
**Warning:** `Parent work effort not found: WE-251231-25qq`

**Fix:** Ensure parent work effort exists in repository

### Issue: ID Mismatch
**Warning:** `Ticket ID suffix '25qq' doesn't match parent work effort suffix 'abcd'`

**Fix:** Ticket ID must match parent: `TKT-25qq-001` → parent `WE-251231-25qq`

## Future Enhancements

### Planned for Phase 2
- Auto-fix common issues (normalize status, fix date formats)
- Validate additional fields (`created_by`, `assigned_to`, etc.)
- Check for required fields per file type
- Validate date ranges (created < updated)
- Check for orphaned tickets (parent doesn't exist)

### Not Yet Implemented
- Complex YAML structures (arrays, nested objects)
- Custom field validation
- Schema-based validation
- Auto-generation of missing fields

---

**Last Updated:** 2025-12-31
**Tool:** `tools/obsidian-linter/check.py`

