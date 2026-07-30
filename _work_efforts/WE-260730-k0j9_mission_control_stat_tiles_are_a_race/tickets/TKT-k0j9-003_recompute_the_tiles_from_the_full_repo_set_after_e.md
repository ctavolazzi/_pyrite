---
id: TKT-k0j9-003
title: "Recompute the tiles from the full repo set after every WebSocket frame, not once per partial load"
status: completed
created: 2026-07-30T13:45:22.096Z
parent: WE-260730-k0j9
labels: ['dashboard', 'bug']
---

# Recompute the tiles from the full repo set after every WebSocket frame, not once per partial load

Part of [[WE-260730-k0j9_index|WE-260730-k0j9]]

## Status

- [x] Resolved with no code change. The premise was wrong.

## Notes

Nothing to fix. `renderStats()` in `public/app.js` already computes from
`this.repos`, the same store the sidebar reads, and already runs inside
`render()`, which is called on initial load and after every update. It was
correct before this ticket existed.

The apparent staleness was `animateNumber()`'s `requestAnimationFrame` tween
being frozen mid-flight by `chrome --dump-dom --virtual-time-budget`, which
does not advance the frame clock. See the retraction in the work effort index.

**Zero lines of `app.js` were changed to close this.** Recorded that way
deliberately: a ticket closed with no diff is the honest outcome when the bug
was in the measurement, and quietly rewriting working code to "fix" it would
have buried the real lesson.
