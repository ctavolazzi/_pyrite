---
id: TKT-k0j9-002
title: "Find where the counters are computed and whether they subscribe to the same store the sidebar uses"
status: completed
created: 2026-07-30T13:45:22.095Z
parent: WE-260730-k0j9
labels: ['dashboard', 'bug']
---

# Find where the counters are computed and whether they subscribe to the same store the sidebar uses

Part of [[WE-260730-k0j9_index|WE-260730-k0j9]]

## Status

- [x] Found. They subscribe to the same store the sidebar uses.

## Notes

`renderStats()` at `public/app.js:977` iterates `Object.values(this.repos)`
and sums `workEfforts.length`, `tickets.length` and the active count. That is
the identical store `renderTree()` reads for the sidebar, and both are called
from `render()`. So the answer to the ticket's question is yes, and it is
exactly why the sidebar and the tiles could never actually disagree.

That finding is what killed the bug report. If the tiles read the same data
as a surface that was demonstrably correct, then either both were wrong or
the measurement was. It was the measurement.

The one genuine wrinkle: `animateNumber()` at `app.js:1003` tweens over 20
`requestAnimationFrame` steps and assigns the exact target only on the final
step. That is fine in a browser and fatal to a DOM dump.
