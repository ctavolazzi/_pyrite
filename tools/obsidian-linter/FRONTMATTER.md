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

## Linter Status Tracking (Tier System)

**New in v0.7.0+**: Files track validation status to enable progressive enhancement.

### Linter Metadata Fields

```yaml
linter_status: validated              # Current status (see values below)
linter_last_check: 2026-01-01T12:00:00Z  # Last validation timestamp
linter_version: 0.6.1                 # Linter version used
```

### Status Values

| Value | Tier 1 | Tier 2 (Enhancement) | Meaning |
|-------|--------|---------------------|---------|
| `unvalidated` | ❌ Run linter | ⛔ Blocked | Never checked |
| `validated` | ✅ Clean | ✅ Ready | Passed all checks |
| `has_warnings` | ⚠️ Optional | ⚠️ Caution | Minor issues |
| `has_errors` | ❌ Must fix | ⛔ Blocked | Critical issues |

**Why this matters:**
- Tier 1 tools validate and fix files (current features)
- Tier 2 tools enhance validated files (AI, auto-indexing, frameworks)
- Enhancement tier REQUIRES `linter_status: validated` to prevent garbage-in-garbage-out

See `ARCHITECTURE.md` for details on the two-tier system.

---

## Example Valid Frontmatter

### Work Effort (Tier 1 Validated)
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
linter_status: validated
linter_last_check: 2026-01-01T12:00:00Z
linter_version: 0.6.1
---
```

### Work Effort (Tier 2 Enhanced - Future)
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
# Tier 1 metadata
linter_status: validated
linter_last_check: 2026-01-01T12:00:00Z
linter_version: 0.6.1
# Tier 2 enhancements (auto-generated)
summary: "Tool for validating GitHub repository health and configuration"
related:
  - [[WE-251228-xyz_github_integration]]
  - [[WE-251230-abc_tool_framework]]
tags: [github, tooling, health-check]
framework: gtd
gtd_context: ["@computer", "@development"]
gtd_priority: high
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

## Tier System Progression

### Tier 1: Standardization (Current - v0.6.1) ✅
- Validates structure and syntax
- Fixes formatting issues
- Adds `linter_status: validated` when clean

### Tier 2: Enhancement (Future - v0.7.0+) 🚧
- Requires `linter_status: validated`
- Auto-generates summaries, tags, relationships
- Applies knowledge management frameworks
- See `ROADMAP_ENHANCEMENT.md` for details

---

## Future Enhancements

### Planned for Tier 1 (v0.7.0)
- Auto-add `linter_status` field
- Track validation history
- Auto-fix common issues (normalize status, fix date formats)

### Planned for Tier 2 (v0.8.0+)
- AI-generated `summary` field
- Auto-populated `related` links
- Framework-specific fields (`gtd_*`, `zettelkasten_*`, `para_*`)
- Auto-tagging based on content
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

