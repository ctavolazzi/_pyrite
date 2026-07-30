---
id: WE-260730-7hgp
title: "STS checkout go-live"
status: active
created: 2026-07-30T12:45:36.176Z
last_updated: 2026-07-30T12:45:36.176Z
objective: "One real dollar moves from a real card and all four downstream effects fire"
labels: ['sts', 'p0', 'money-path']
---

# STS checkout go-live

## Objective

One real dollar moves from a real card and all four downstream effects fire

## Description

The only workstream that unblocks promotion. Measured 2026-07-30: the store has never taken a real dollar, 0 livemode paid charges and 0 livemode webhook endpoints. Production runs 332fdfd and is 11 commits behind HEAD. Those 11 commits contain EVERY piece of webhook hardening: the fail-closed financial ledger (0b1d5b5), event idempotency (36c0edb), the timestamp bound and its bypass fix (6899e43 plus a9bf245), and the buy-button fix (e0cd238). Taking a real dollar against production today would test none of it. ORDER IS NOT NEGOTIABLE: B-03 before B-04. Reversing them means production accepts real payments and records none of them.

## Tickets

| Ticket | Title | Status |
|--------|-------|--------|
| [[TKT-7hgp-001_re_probe_before_touching_anything_sts_py_status_st|TKT-7hgp-001]] | Re-probe before touching anything: sts.py status, sts.py live, and the Stripe API for livemode webhook endpoints and paid charges. Trust no status line, including PLAN.md and this ticket | pending |
| [[TKT-7hgp-002_decide_and_execute_the_deploy_of_the_11_commits_pr|TKT-7hgp-002]] | Decide and execute the deploy of the 11 commits production does not have. Production runs 332fdfd and has none of the webhook hardening | pending |
| [[TKT-7hgp-003_apply_sql_014_to_production_supabase_or_accept_in|TKT-7hgp-003]] | Apply sql/014 to production Supabase, or accept in writing that webhook_events degrades open and B-08 idempotency ships inert | pending |
| [[TKT-7hgp-004_b_05_add_the_stripe_price_id_authors_secret_to_clo|TKT-7hgp-004]] | B-05: add the STRIPE_PRICE_ID_AUTHORS secret to Cloudflare Pages. Independent of B-03 and B-04, can go first | pending |
| [[TKT-7hgp-005_b_03_create_the_live_mode_stripe_webhook_endpoint|TKT-7hgp-005]] | B-03: create the live-mode Stripe webhook endpoint pointing at /api/webhooks/stripe. Must precede B-04 | pending |
| [[TKT-7hgp-006_b_04_set_the_live_signing_secret_and_switch_stripe|TKT-7hgp-006]] | B-04: set the live signing secret and switch STRIPE_SECRET_KEY to the live key. Only after B-03 shows a livemode=true row | pending |
| [[TKT-7hgp-007_b_07_take_one_real_dollar_from_one_real_card|TKT-7hgp-007]] | B-07: take one real dollar from one real card | pending |
| [[TKT-7hgp-008_confirm_all_four_downstream_effects_the_stripe_cha|TKT-7hgp-008]] | Confirm all four downstream effects: the Stripe charge, the fulfilled_sessions row, the transactional email, and a working download link | pending |
| [[TKT-7hgp-009_record_v_04_in_the_verification_ledger_with_all_fo|TKT-7hgp-009]] | Record V-04 in the verification ledger with all four observations and the deployed commit SHA | pending |
| [[TKT-7hgp-010_re_run_the_i_checkout_gate_playwright_suite_after|TKT-7hgp-010]] | Re-run the i-checkout-gate Playwright suite after the switch and compare against the 3 passed / 6 failed baseline | pending |

## Progress

- Work effort created with 10 tickets
- The Tickets table above is the single record of per-ticket status

## Next Steps

1. Work the tickets above in order
2. Flip each ticket's `status` to completed as it lands
3. Set this work effort's `status` to completed when every ticket is done
