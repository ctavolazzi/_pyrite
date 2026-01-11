---
id: [WORK_EFFORT_ID]-verification
title: Verification Checklist - [WORK_EFFORT_ID]
type: checklist
status: pending
project: [WORK_EFFORT_ID]
created: [DATE]
verified: [DATE]
verifier: [Name/AI/Team]
tags:
  - verification
  - quality
  - checklist
  - work-effort/[WORK_EFFORT_ID]
completion: 0%
---

# Verification Checklist

> [!success] Quality Gate
> **Work Effort**: `[WORK_EFFORT_ID]`
> **Description**: [DESCRIPTION]
> **Verified**: [DATE]
> **Verifier**: [Name/AI/Team]
> **Completion**: 0%

## Quick Nav
- [[README|Tool Bag Home]]
- [[work_effort_tracker|Progress Tracker]]
- [[#Final Checks]]
- [[#Sign-Off]]

---

## Purpose

This checklist ensures work meets quality standards before being considered complete. Check off items as they're verified.

---

## Code Quality

### Functionality
- [ ] All intended features work as expected
- [ ] Edge cases handled appropriately
- [ ] Error handling implemented
- [ ] No critical bugs identified

### Testing
- [ ] Unit tests written and passing
- [ ] Integration tests passing (if applicable)
- [ ] Test coverage meets standards (specify: ___%)
- [ ] Manual testing completed

### Code Standards
- [ ] Code follows project style guide
- [ ] No linter warnings/errors
- [ ] Code is properly formatted
- [ ] Comments and docstrings added where needed

---

## Documentation

### Code Documentation
- [ ] Functions/classes documented
- [ ] Complex logic explained
- [ ] API documentation updated (if applicable)
- [ ] README updated with new features/changes

### Work Effort Documentation
- [ ] Changes documented in work effort README
- [ ] Decision log updated
- [ ] Known issues documented
- [ ] Usage examples provided

---

## Integration

### Compatibility
- [ ] Works with existing codebase
- [ ] No breaking changes (or documented)
- [ ] Dependencies updated and documented
- [ ] Backwards compatibility verified (if applicable)

### Performance
- [ ] No performance regressions
- [ ] Resource usage acceptable
- [ ] Scalability considerations addressed
- [ ] Optimization opportunities noted

---

## Version Control

### Git
- [ ] Changes committed with clear messages
- [ ] Branch up to date with main/base
- [ ] Merge conflicts resolved
- [ ] Commit history is clean

### Code Review
- [ ] Code reviewed (by peer/AI/self)
- [ ] Feedback addressed
- [ ] Approved for merge
- [ ] No outstanding review comments

---

## Security & Safety

### Security
- [ ] No security vulnerabilities introduced
- [ ] Sensitive data protected
- [ ] Input validation implemented
- [ ] Security best practices followed

### Safety
- [ ] No destructive operations without safeguards
- [ ] Data loss prevention measures in place
- [ ] Rollback plan exists
- [ ] Failure modes considered

---

## Deployment

### Pre-Deployment
- [ ] Configuration updated (if needed)
- [ ] Environment variables documented
- [ ] Dependencies listed and versioned
- [ ] Migration scripts tested (if applicable)

### Deployment Verification
- [ ] Deployment steps documented
- [ ] Rollback procedure documented
- [ ] Monitoring/alerting configured (if applicable)
- [ ] Smoke tests defined

---

## Custom Verification Criteria

Add project-specific checks below:

### [Custom Category 1]
- [ ] [Custom check 1]
- [ ] [Custom check 2]

### [Custom Category 2]
- [ ] [Custom check 3]
- [ ] [Custom check 4]

---

## Final Checks

- [ ] All sections above completed
- [ ] No outstanding blockers
- [ ] Success criteria met (see work_effort_tracker.md)
- [ ] Ready for handoff/deployment/merge

---

## Sign-Off

**Verified By**: [Name/AI/Team]
**Date**: [DATE]
**Status**: ✅ Verified | 🔴 Issues Found | 🟡 Partial

### Notes
[Any additional notes, caveats, or follow-up items]

---

## Issues Found

If verification reveals issues, document them here:

### Issue 1
- **Severity**: [Critical/High/Medium/Low]
- **Description**: [What's wrong]
- **Impact**: [What it affects]
- **Resolution**: [How to fix]
- **Status**: [Open/In Progress/Resolved]

---

## Completion Tracking

> [!example] Auto-Calculate Completion
> Update completion percentage in frontmatter based on checked items

**Progress**: `0/100 items` (0%)

**Category Breakdown**:
- Code Quality: 0/12 (0%)
- Documentation: 0/8 (0%)
- Integration: 0/8 (0%)
- Version Control: 0/8 (0%)
- Security & Safety: 0/8 (0%)
- Deployment: 0/8 (0%)
- Custom Criteria: 0/X (0%)
- Final Checks: 0/4 (0%)

> [!tip] Update Frontmatter
> When complete, update `completion: X%` and `status: verified` in frontmatter

---

## Dataview Queries

> [!tip] Obsidian Dataview Examples
> Track verification progress across all work efforts

```dataview
TABLE completion, status, verified
FROM #verification
WHERE contains(file.path, "work_efforts")
SORT completion DESC
```

```dataview
TASK
FROM #work-effort/[WORK_EFFORT_ID]
WHERE contains(file.name, "verification")
AND !completed
```

---

## Related Checklists

### Prerequisites
- [[work_effort_tracker|Progress Tracker]] - Ensure all tasks complete
- [[../../.cursor/procedures/VER-001_verification_workflow|VER-001]] - Verification procedure

### Follow-Up
- Create deployment checklist if needed
- Link to PR/issue for tracking
- Schedule post-deployment review

---

**Verification Version**: 1.0
**Last Updated**: [DATE]

#verification #quality #checklist #work-effort/[WORK_EFFORT_ID]
