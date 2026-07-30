---
id: WE-260730-pbno
title: "STS unblocked engineering"
status: active
created: 2026-07-30T12:45:36.946Z
last_updated: 2026-07-30T12:45:36.946Z
objective: "Everything on the STS plan that needs no credential and no decision"
labels: ['sts', 'unblocked']
---

# STS unblocked engineering

## Objective

Everything on the STS plan that needs no credential and no decision

## Description

Work that can proceed right now with nothing from Chris. Drawn from WS-B and WS-C of PLAN.md plus one piece of environment hygiene. C-02 is the keystone: C-03 and C-04 both depend on it.

## Tickets

| Ticket | Title | Status |
|--------|-------|--------|
| [[TKT-pbno-001_c_02_add_a_prebuild_step_emitting_src_lib_stats_ge|TKT-pbno-001]] | C-02: add a prebuild step emitting src/lib/stats.generated.json from scripts/sts.py | pending |
| [[TKT-pbno-002_c_03_port_the_provenance_pattern_so_every_rendered|TKT-pbno-002]] | C-03: port the provenance pattern so every rendered stat carries the artifact it came from | pending |
| [[TKT-pbno-003_c_04_add_a_build_assertion_that_fails_on_any_hardc|TKT-pbno-003]] | C-04: add a build assertion that fails on any hardcoded number in sales copy. A-08 is the template | pending |
| [[TKT-pbno-004_c_05_resolve_the_1_dead_link_of_186_in_works_cited|TKT-pbno-004]] | C-05: resolve the 1 dead link of 186 in Works Cited | pending |
| [[TKT-pbno-005_b_10_shorten_the_7_day_signed_download_url_ttl_or|TKT-pbno-005]] | B-10: shorten the 7 day signed download URL TTL, or accept it explicitly in writing in /policies | pending |
| [[TKT-pbno-006_b_06sched_decide_what_calls_api_admin_reconcile_si|TKT-pbno-006]] | B-06sched: decide what calls /api/admin/reconcile, since Cloudflare Pages has no cron | pending |
| [[TKT-pbno-007_f_07_wire_or_drop_preorder_counts_which_exists_in|TKT-pbno-007]] | F-07: wire or drop preorder_counts, which exists in the schema and is referenced nowhere in src | pending |
| [[TKT-pbno-008_kill_the_stale_python_http_server_squatting_port_5|TKT-pbno-008]] | Kill the stale python http.server squatting port 5173, PID 6731, which silently broke the Playwright suite | pending |

## Progress

- Work effort created with 8 tickets
- The Tickets table above is the single record of per-ticket status

## Next Steps

1. Work the tickets above in order
2. Flip each ticket's `status` to completed as it lands
3. Set this work effort's `status` to completed when every ticket is done
