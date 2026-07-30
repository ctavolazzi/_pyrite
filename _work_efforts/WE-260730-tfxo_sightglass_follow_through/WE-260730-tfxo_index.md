---
id: WE-260730-tfxo
title: "Sightglass follow-through"
status: active
created: 2026-07-30T12:19:27.331Z
last_updated: 2026-07-30T16:31:48.485Z
objective: "Close the four gaps the README names, starting with the only objective anti-overfitting signal"
labels: ['sightglass', 'testing']
---

# Sightglass follow-through

## Objective

Close the four gaps the README names, starting with the only objective anti-overfitting signal

## Description

Coverage-based pruning is wired through prune.mjs scoring but never fed: coverageAdded is always 0, so the NO_NEW_GROUND rule can never fire. Until V8 coverage lands, every other prune rule is heuristic and 'is the suite overfitting' is answered by vibes. Repo: https://github.com/ctavolazzi/sightglass

## Tickets

| Ticket | Title | Status |
|--------|-------|--------|
| [[TKT-tfxo-001_wire_page_coverage_startjscoverage_into_interprete|TKT-tfxo-001]] | Wire page.coverage.startJSCoverage() into interpreter.mjs and feed coverageAdded | completed |
| [[TKT-tfxo-002_diff_each_probe_s_covered_ranges_against_the_union|TKT-tfxo-002]] | Diff each probe's covered ranges against the union of all other probes | completed |
| [[TKT-tfxo-003_confirm_no_new_ground_actually_fires_in_prune_mjs|TKT-tfxo-003]] | Confirm NO_NEW_GROUND actually fires in prune.mjs once coverageAdded is non-zero | completed |
| [[TKT-tfxo-004_add_axe_core_playwright_to_the_explore_loop_for_fr|TKT-tfxo-004]] | Add @axe-core/playwright to the explore loop for free defects at no LLM cost | pending |
| [[TKT-tfxo-005_give_the_hollow_detector_an_opt_out_for_tests_that|TKT-tfxo-005]] | Give the hollow detector an opt-out for tests that trigger an empty sweep on purpose | pending |
| [[TKT-tfxo-006_add_asynclocalstorage_to_the_expect_mjs_assertion|TKT-tfxo-006]] | Add AsyncLocalStorage to the expect.mjs assertion sink before any parallelism | pending |
| [[TKT-tfxo-007_decide_playwright_real_devdependency_or_documented|TKT-tfxo-007]] | Decide Playwright: real devDependency or documented peer dep, and drop the symlink | pending |
| [[TKT-tfxo-008_write_adapters_playwright_json_mjs_to_ingest_an_ex|TKT-tfxo-008]] | Write adapters/playwright-json.mjs to ingest an existing Playwright suite | pending |

## Progress

- Work effort created with 8 tickets
- The Tickets table above is the single record of per-ticket status

## Next Steps

1. Work the tickets above in order
2. Flip each ticket's `status` to completed as it lands
3. Set this work effort's `status` to completed when every ticket is done
