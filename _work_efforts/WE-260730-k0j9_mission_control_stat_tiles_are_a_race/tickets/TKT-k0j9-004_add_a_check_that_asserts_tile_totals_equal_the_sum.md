---
id: TKT-k0j9-004
title: "Add a check that asserts tile totals equal the sum over /api/repos, run against a fixed fixture"
status: completed
created: 2026-07-30T13:45:22.096Z
parent: WE-260730-k0j9
labels: ['dashboard', 'bug']
---

# Add a check that asserts tile totals equal the sum over /api/repos, run against a fixed fixture

Part of [[WE-260730-k0j9_index|WE-260730-k0j9]]

## Status

- [x] Shipped as `mcp-servers/dashboard/tests/tile-totals.mjs`.

## Notes

```bash
node tests/tile-totals.mjs        # 5 loads
node tests/tile-totals.mjs 10     # 10 loads
```

Computes ground truth from `/api/repos`, loads the dashboard N times through
Playwright driving the installed Chrome (`channel: 'chrome'`, so it needs no
`npx playwright install`), and fails if any load disagrees with the API **or
if loads disagree with each other**. The second condition matters: a check
that only compared against truth would have passed on a lucky sample.

Current result: 5/5 matching, 1 distinct result across loads.

It carries a comment block explaining why it does not use `chrome --dump-dom`,
including the six wrong readings that method produced. That comment is the
point of the file as much as the assertion is, because the next person
reaching for `--dump-dom` on an animated value will make the same mistake.
