---
id: TKT-90bx-002
title: "Verify the six library recommendations by actually searching, since they were given from memory: Playwright, V8 coverage via page.coverage, axe-core/playwright, fast-check, pixelmatch with pngjs, Crawlee"
status: completed
created: 2026-07-30T12:45:37.281Z
parent: WE-260730-90bx
labels: ['debt']
---

# Verify the six library recommendations by actually searching, since they were given from memory: Playwright, V8 coverage via page.coverage, axe-core/playwright, fast-check, pixelmatch with pngjs, Crawlee

Part of [[WE-260730-90bx_index|WE-260730-90bx]]

## Status

- [x] All six verified. Two carry caveats I had not stated.

## Notes

Checked 2026-07-30. The V8 coverage claim was verified by running it, not by
reading about it, because it is the one the Sightglass plan depends on.

| Claim | Verdict | Evidence |
|-------|---------|----------|
| Playwright as the driver | stands | 1.58.2 in sts-v0.7.3, 1.62.1 in the dashboard, both drive the installed Chrome via `channel: 'chrome'` |
| V8 coverage via `page.coverage` | stands, with caveats | Ran it against a live page: 8 entries, per-function ranges present, 194,971 source bytes, app.js with 198 functions |
| `@axe-core/playwright` | stands, with a correction | Deque's official scoped package on npm, WCAG 2.0/2.1/2.2, AxeBuilder pattern |
| `fast-check` | stands | dubzzz/fast-check, ~10M weekly downloads, integrated shrinking to a minimal counterexample |
| `pixelmatch` + `pngjs` | stands | mapbox/pixelmatch, ~150 lines, zero dependencies, built for screenshot comparison; pngjs is required to decode and encode the PNG |
| `Crawlee` | stands | Exists in both JavaScript and Python |

### Caveat 1: coverage is Chromium only

`page.coverage` is unavailable in Firefox and WebKit. Fine today, since
Sightglass drives Chromium, but it means coverage-based pruning can never be
part of a cross-engine run. That constraint was not in the original
recommendation.

### Caveat 2: two things it will not measure

Running it surfaced two failure modes that would have wasted a session:

- Inline scripts injected via `setContent` produce **zero entries**. Coverage
  is reported per script URL, so a probe must load real script resources.
- `startJSCoverage()` defaults to resetting on navigation. Sightglass probes
  navigate constantly, so it needs `{ resetOnNavigation: false }` or every
  probe's coverage is discarded the moment it moves.

### Correction

`axe-playwright` and `@axe-core/playwright` are different packages. The
official Deque one is the scoped `@axe-core/playwright`. Getting that wrong
installs an unofficial wrapper.
