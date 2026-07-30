---
id: WE-260730-rllq
title: "_pyrite tooling defects"
status: active
created: 2026-07-30T12:45:37.611Z
last_updated: 2026-07-30T12:45:37.611Z
objective: "Defects found while building the work effort tool, none of them fixed"
labels: ['pyrite', 'bug']
---

# _pyrite tooling defects

## Objective

Defects found while building the work effort tool, none of them fixed

## Description

Found by measurement while building pyrite we, and captured rather than fixed so the ticketing ask could ship first. The linter write-in-check-only-mode bug is tracked separately as its own work effort.

## Tickets

| Ticket | Title | Status |
|--------|-------|--------|
| [[TKT-rllq-001_validate_folder_name_can_never_validate_it_imports|TKT-rllq-001]] | validate_folder_name can never validate: it imports tools.naming_linter but the directory is tools/naming-linter, and the ImportError is swallowed and None returned | pending |
| [[TKT-rllq-002_convert_test_plugins_py_from_returning_true_and_fa|TKT-rllq-002]] | Convert test_plugins.py from returning True and False to asserting. A test returning False is currently reported as PASSED | pending |
| [[TKT-rllq-003_pyrite_ticket_help_claims_a_create_and_list_tool_b|TKT-rllq-003]] | pyrite ticket help claims a create and list tool, but tools/ticket/create.py implements no list action | pending |
| [[TKT-rllq-004_reconcile_ticket_id_drift_hand_made_tickets_use_th|TKT-rllq-004]] | Reconcile ticket ID drift: hand-made tickets use the date form TKT-260101-001, while the linter and the generator require TKT-xxxx-NNN | pending |
| [[TKT-rllq-005_decide_whether_pyrite_we_should_append_tickets_to|TKT-rllq-005]] | Decide whether pyrite we should append tickets to an existing work effort and regenerate the hub table, or stay create-only | pending |

## Progress

- Work effort created with 5 tickets
- The Tickets table above is the single record of per-ticket status

## Next Steps

1. Work the tickets above in order
2. Flip each ticket's `status` to completed as it lands
3. Set this work effort's `status` to completed when every ticket is done
