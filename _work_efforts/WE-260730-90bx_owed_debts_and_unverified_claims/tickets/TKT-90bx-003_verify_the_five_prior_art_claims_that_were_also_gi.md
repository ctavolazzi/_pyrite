---
id: TKT-90bx-003
title: "Verify the five prior-art claims that were also given from memory: Stagehand, browser-use, Skyvern, Gremlins.js, GraphWalker"
status: completed
created: 2026-07-30T12:45:37.281Z
parent: WE-260730-90bx
labels: ['debt']
---

# Verify the five prior-art claims that were also given from memory: Stagehand, browser-use, Skyvern, Gremlins.js, GraphWalker

Part of [[WE-260730-90bx_index|WE-260730-90bx]]

## Status

- [x] All five exist and are described correctly.

## Notes

Checked 2026-07-30. Nothing was invented, which was the actual worry.

| Claim | Verdict | What it actually is |
|-------|---------|---------------------|
| Stagehand | stands | Browserbase's open-source TypeScript library that wraps Playwright and adds AI-assisted actions. Hybrid: coded flow, AI only where flexibility is needed |
| browser-use | stands | Gives an LLM full browser control, multi-tab, memory, parallel agents. 50k+ GitHub stars |
| Skyvern | stands | Computer vision plus live page reasoning, so new layouts and unexpected modals need no code change. 85.85% on WebVoyager |
| Gremlins.js | stands | marmelab's monkey-testing library. Five species (clicker, form filler, scroller, typer, toucher) plus mogwais that watch console errors and frame rate |
| GraphWalker | stands | Model-based testing. Parses finite state machines and extended FSMs authored in yEd, generates offline and online test sequences |

### The two worth actually stealing from

**Gremlins.js separates the actors from the observers.** Species perform the
chaos; mogwais watch console errors and frames per second and decide whether
something broke. Sightglass currently conflates those: a probe both acts and
asserts. Splitting them would let one observer watch every probe without each
probe having to remember to check.

**GraphWalker's generator/stop-condition split** is the closer parallel to
the explore loop. It separates how you walk the model from when you stop
walking, and its stated aim is long unpredictable sequences with variation
rather than the same path every run. That is the same problem prune.mjs
solves heuristically, and it is prior art worth reading before the next
iteration of the pruning rules.

Neither is a dependency to adopt. Both are designs to borrow.
