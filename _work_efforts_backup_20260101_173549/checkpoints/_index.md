---
id: checkpoints-index
type: index
updated: 2025-12-31
---

# Session Checkpoints

Dev journal entries capturing session milestones and decisions.

## Checkpoint Format

`CKPT-YYMMDD-HHMM` - Timestamp-based ID for easy chronological sorting.

## Checkpoints

| ID | Date | Summary | Version |
|----|------|---------|---------|
| [[CKPT-251231-1800]] | 2025-12-31 | Obsidian Linter System v1.0 | 0.6.0 |

## Usage

```bash
# View all checkpoints
ls _work_efforts/checkpoints/

# Search checkpoints
grep -l "keyword" _work_efforts/checkpoints/*.md
```

## Creating Checkpoints

Checkpoints are created at significant session milestones:
- Major feature completion
- System integration
- Before/after risky changes
- End of multi-hour sessions

They capture:
- What was built
- Files changed
- Decisions made
- PRs merged
- Next steps

