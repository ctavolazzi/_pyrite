---
id: TKT-0h84-004
title: "Audit fix-all.py, fix-links.py and fix-obsidian-links.py for the same missing guard"
status: completed
created: 2026-07-30T12:24:54.246Z
parent: WE-260730-0h84
labels: ['linter', 'bug']
---

# Audit fix-all.py, fix-links.py and fix-obsidian-links.py for the same missing guard

Part of [[WE-260730-0h84_index|WE-260730-0h84]]

## Status

- [x] Audited. No same-class defect found in the other three scripts.

## Notes

All three guard their writes on `self.dry_run` and are fixers by contract,
not checkers:

| Script | Write guard | Reachable by default? |
|--------|-------------|-----------------------|
| `fix-all.py` | `if not self.dry_run` at line 285 | No. `lint.py` runs it only inside `if args.fix` |
| `fix-links.py` | `if not self.dry_run` at line 216 | No. Standalone, never invoked by `lint.py` |
| `fix-obsidian-links.py` | `if not self.dry_run` at line 381 | No. Standalone, never invoked by `lint.py` |

The defect was specific to `check.py`, and the reason is worth keeping: it is
the only one of the four that is a **checker** which also wrote. A fixer
guarding on `dry_run` alone is correct, because writing is what it is for. A
checker guarding on `dry_run` alone writes by default, because checking is
what it is for and nobody passes `--dry-run` to a checker.

Read that as the general rule: the guard has to match what the tool claims to
be, not what the code happens to do.
