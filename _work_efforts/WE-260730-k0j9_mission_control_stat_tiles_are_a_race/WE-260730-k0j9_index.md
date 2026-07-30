---
id: WE-260730-k0j9
title: "Mission Control stat tiles: RETRACTED, not a bug"
status: completed
created: 2026-07-30T13:45:22.097Z
last_updated: 2026-07-30T16:22:01.722Z
objective: "RETRACTED. The tiles were always correct. The defect was in how I measured them"
labels: ['dashboard', 'retracted', 'measurement']
---

# Mission Control stat tiles: RETRACTED, not a bug

## Retraction

**This work effort was opened on a false report and no dashboard code was
changed to resolve it.** The original claim is preserved below because the
mistake is more useful than the non-bug.

**Claimed:** the four headline counters never show the correct total and
disagree with themselves across loads. Filed against six measurements that
produced 2/95/417/44, 1/86/375/39, 0/0/0/0, 1/38/167/17, 0/29/125/13 and
0/19/84/9 against a ground truth of 3/191/838/87.

**Actual:** every one of those six measurements was taken with
`chrome --headless --dump-dom --virtual-time-budget=N`. The tiles are painted
by `animateNumber()` in `public/app.js`, which tweens across 20
`requestAnimationFrame` steps and assigns the exact target only on the final
step. **`--virtual-time-budget` does not drive `requestAnimationFrame`**, so
the tween stalls part-way and the dumped DOM holds a frozen intermediate
value. Every number I recorded was a frame of an animation, not a total.

**Control that settled it:** the same page, loaded in a real browser through
Playwright, read at 0, 250, 500, 1000, 2000 and 4000ms of wall-clock time.
Correct at every single sample, including t=0 after `networkidle`:

```
ground truth: 3/191/838/87
  t=   0ms  3/191/838/87  MATCHES truth
  t= 250ms  3/191/838/87  MATCHES truth
  t= 500ms  3/191/838/87  MATCHES truth
  t=1000ms  3/191/838/87  MATCHES truth
  t=2000ms  3/191/838/87  MATCHES truth
  t=4000ms  3/191/838/87  MATCHES truth
```

`renderStats()` reads `this.repos`, the same store the sidebar reads, and
sums it correctly. There was never a race.

## The lesson, which is the actual deliverable

**A value produced by a `requestAnimationFrame` animation cannot be measured
by a DOM dump.** `--virtual-time-budget` advances timers and network, not the
frame clock, so any tweened number, progress bar, count-up or eased transform
will be captured mid-flight. Drive a real browser and wait real wall-clock
time.

This is the same shape as the `readPixels` false negative recorded in the
Sightglass notes, where a WebGL scene was reported as "0 lit pixels" while
rendering perfectly, because the measurement was wrong rather than the thing
being measured. Both are **false negatives from an instrument that cannot
observe what it claims to observe**, and both cost more than the bug would
have.

The residue kept from this: `mcp-servers/dashboard/tests/tile-totals.mjs`, a
real regression check that drives Chrome through Playwright, compares the
tiles against `/api/repos`, and fails if any load disagrees or if loads
disagree with each other. It passes 5/5 with a single distinct result.

## Tickets

| Ticket | Title | Status |
|--------|-------|--------|
| [[TKT-k0j9-001_reproduce_with_a_scripted_n_load_harness_and_recor|TKT-k0j9-001]] | Reproduce with a scripted N-load harness and record the spread, so the fix has a before number | completed |
| [[TKT-k0j9-002_find_where_the_counters_are_computed_and_whether_t|TKT-k0j9-002]] | Find where the counters are computed and whether they subscribe to the same store the sidebar uses | completed |
| [[TKT-k0j9-003_recompute_the_tiles_from_the_full_repo_set_after_e|TKT-k0j9-003]] | Recompute the tiles from the full repo set after every WebSocket frame, not once per partial load | completed |
| [[TKT-k0j9-004_add_a_check_that_asserts_tile_totals_equal_the_sum|TKT-k0j9-004]] | Add a check that asserts tile totals equal the sum over /api/repos, run against a fixed fixture | completed |

## Progress

- Work effort created with 4 tickets
- The Tickets table above is the single record of per-ticket status

## Next Steps

1. Work the tickets above in order
2. Flip each ticket's `status` to completed as it lands
3. Set this work effort's `status` to completed when every ticket is done
