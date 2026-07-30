---
id: TKT-90bx-004
title: "Record the sixth and seventh false passes in the verification ledger, including the one where a structurally-zero number was cited as evidence"
status: completed
created: 2026-07-30T12:45:37.282Z
parent: WE-260730-90bx
labels: ['debt']
---

# Record the sixth and seventh false passes in the verification ledger, including the one where a structurally-zero number was cited as evidence

Part of [[WE-260730-90bx_index|WE-260730-90bx]]

## Status

- [x] Recorded. There were three more, not two.

## Notes

### 6. Citing a structurally-zero number as evidence

"0 degrade-open events" was offered as proof a guard worked, in a run where
that counter could not have been anything but zero. Recorded in the previous
session; repeated here because it is the same defect as 8 below.

### 7. `test_plugins.py` reported 6 passed and could not fail

Every test returned `True`/`False` and pytest ignores a returned `False`.
Measured directly: `def test_x(): return False` reports `1 passed`. Six green
checks were load-bearing for "I did not break the helpers" and were worth
nothing. Fixed in 771e673; the mutation test now gives 1 failed, 5 passed.

### 8. The WebSocket monitor counted the frame that proves nothing

First version printed "VERDICT: live updates proven" off a single frame. That
frame was the `init` state dump that arrives on connect, which proves the
socket opened and nothing about whether changes propagate. Rewritten to
exclude `init` and count only post-change frames. Same defect as 6: a number
that cannot come out any other way is not evidence.

### 9. A fabricated bug report from an instrument that could not see

Six `chrome --dump-dom --virtual-time-budget` loads read the dashboard's stat
tiles as wrong and mutually inconsistent. `--virtual-time-budget` does not
drive `requestAnimationFrame`, so all six were frozen frames of a 300ms
tween. The dashboard was correct throughout. Filed as WE-260730-k0j9,
committed in 05ed228, retracted in 1b5ccd5.

### The pattern across all four

Three of these are the same error: **a measurement whose result was fixed
before the thing being measured had any say.** A counter that can only be
zero, a test that returns instead of asserting, a socket frame that arrives
regardless. The fourth inverts it, a false negative rather than a false
positive, but the root cause is identical: nobody asked whether the
instrument could observe the thing at all.

The habit that catches all four is the control. Before believing a green
result, break the thing on purpose and confirm the check goes red. Every
check written in this session now carries one, and the k0j9 retraction is
what a missing control costs.
