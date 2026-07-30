---
id: WE-260730-k0j9
title: "Mission Control stat tiles are a race"
status: active
created: 2026-07-30T13:45:22.097Z
last_updated: 2026-07-30T13:45:22.097Z
objective: "The four headline counters never show the correct total, and disagree with themselves across loads"
labels: ['dashboard', 'bug']
---

# Mission Control stat tiles are a race

## Objective

The four headline counters never show the correct total, and disagree with themselves across loads

## Description

Measured 2026-07-30 against an unchanging dataset. API ground truth is 3 repos, 190 work efforts, 834 tickets. Three independent headless loads of the same page produced 0/0/0/0, then 1/38/167/17, then 0/29/125/13. Two earlier interactive loads produced 2/95/417/44 and 1/86/375/39. Six loads, six different answers, none correct. The counters appear to render while repo data is still streaming in and are never reconciled against the final set. The sidebar tree, the work queue and /api/repos are all correct, so only the headline tiles are affected. This matters because the tiles are the first thing a human reads to judge progress.

## Tickets

| Ticket | Title | Status |
|--------|-------|--------|
| [[TKT-k0j9-001_reproduce_with_a_scripted_n_load_harness_and_recor|TKT-k0j9-001]] | Reproduce with a scripted N-load harness and record the spread, so the fix has a before number | pending |
| [[TKT-k0j9-002_find_where_the_counters_are_computed_and_whether_t|TKT-k0j9-002]] | Find where the counters are computed and whether they subscribe to the same store the sidebar uses | pending |
| [[TKT-k0j9-003_recompute_the_tiles_from_the_full_repo_set_after_e|TKT-k0j9-003]] | Recompute the tiles from the full repo set after every WebSocket frame, not once per partial load | pending |
| [[TKT-k0j9-004_add_a_check_that_asserts_tile_totals_equal_the_sum|TKT-k0j9-004]] | Add a check that asserts tile totals equal the sum over /api/repos, run against a fixed fixture | pending |

## Progress

- Work effort created with 4 tickets
- The Tickets table above is the single record of per-ticket status

## Next Steps

1. Work the tickets above in order
2. Flip each ticket's `status` to completed as it lands
3. Set this work effort's `status` to completed when every ticket is done
