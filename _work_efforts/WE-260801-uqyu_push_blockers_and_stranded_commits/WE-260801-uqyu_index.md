---
id: WE-260801-uqyu
title: "Push blockers and stranded commits"
status: active
created: 2026-08-01T09:08:59.647Z
last_updated: 2026-08-01T09:08:59.647Z
objective: "Four repos cannot reach a remote they own, and sts has an unclaimed dirty tree"
---

# Push blockers and stranded commits

## Objective

Four repos cannot reach a remote they own, and sts has an unclaimed dirty tree

## Description

Found while pushing everything on 2026-08-01. Four of seven repos pushed cleanly. Three could not, each for a different real reason, and none of them should be forced. Separately sts-v0.7.3 carries a dirty tree nobody has claimed.

## Tickets

| Ticket | Title | Status |
|--------|-------|--------|
| [[TKT-uqyu-001_novasystem_codex_dev_is_ahead_1_behind_5_so_the_pu|TKT-uqyu-001]] | NovaSystem-Codex dev is ahead 1 behind 5, so the push was rejected as a non-fast-forward. Decide rebase vs merge and land commit 4adefc8. | pending |
| [[TKT-uqyu-002_public_apis_origin_points_at_the_upstream_public_a|TKT-uqyu-002]] | public-apis origin points at the UPSTREAM public-apis/public-apis, not a fork, so the 1 local commit has nowhere to go. Fork it or drop the commit. | pending |
| [[TKT-uqyu-003_quartz_site_origin_points_at_the_upstream_jackyzha|TKT-uqyu-003]] | quartz-site origin points at the UPSTREAM jackyzha0/quartz, same problem, 1 local commit stranded on branch v4. | pending |
| [[TKT-uqyu-004_triage_the_23_modified_and_28_untracked_paths_in_s|TKT-uqyu-004]] | Triage the 23 modified and 28 untracked paths in sts-v0.7.3 that no session has claimed, including scripts/sts.py and book chapters. | pending |

## Progress

- Work effort created with 4 tickets
- The Tickets table above is the single record of per-ticket status

## Next Steps

1. Work the tickets above in order
2. Flip each ticket's `status` to completed as it lands
3. Set this work effort's `status` to completed when every ticket is done
