---
id: TKT-4gxi-009
title: "Decide how to land 11 hardening commits on origin/main, which is what production builds. The old framing of pushing to origin/v0.7.3 would have deployed nothing"
status: pending
created: 2026-07-30T12:45:36.510Z
parent: WE-260730-4gxi
labels: ['sts', 'blocked']
---

# Decide how to land 11 hardening commits on origin/main, which is what production builds. The old framing of pushing to origin/v0.7.3 would have deployed nothing

Part of [[WE-260730-4gxi_index|WE-260730-4gxi]]

## Status

- [ ] Not started. Still Chris's decision, but the decision is a different one
      than this ticket originally described.

## Notes

### The original framing was wrong in a way that would have wasted the push

This ticket used to ask whether to push `sts-v0.7.3` to `origin/v0.7.3`.
Doing that would have changed nothing about what customers see.

`wrangler pages deployment list --project-name survivingthesingularity` shows
**every Production deployment builds from branch `main`.** `origin/v0.7.3` is
not a deploy target. It is 28 commits behind what is already live.

The repo confirms it from the other side: `origin/HEAD` points at
`origin/main`, and the project uses `@sveltejs/adapter-auto` with no
`wrangler.toml` and no deploy script, which is the Cloudflare Pages
git-integration pattern where the push is the deploy.

### The real state, measured 2026-07-30 evening

- Local branch `v0.7.3` is **11 ahead, 1 behind** `origin/main`.
- The 1 behind is `3600400 chore: daily signals sweep 2026-07-30`, authored by
  `github-actions[bot]` from `.github/workflows/signals-sweep.yml`, cron
  `0 13 * * *`.
- So this is **no longer a fast-forward.** Landing the 11 needs a merge or a
  rebase over that bot commit, not a straight push.

### What the 11 commits are, and why this matters more than a branch decision

They contain every piece of webhook hardening. Production is currently running
none of it:

- `e0cd238` offer: one object every surface reads, and fix the buy button that did nothing
- `297543b` offer: assert the facts derive, not just the sentence
- `36c0edb` webhooks: event idempotency and a reconciliation report, both measured
- `1b4a7cc` docs: architecture page for the money path
- `2ce87e5` scripts: keep the verification harnesses that proved B-08 and B-06
- `23c3f3b` consent banner: stop trapping page-end content, and un-break the test suite
- `81aa440` legal copy: the four audit items that were real. UNREVIEWED BY A LAWYER.
- `0b1d5b5` webhooks: the financial ledger now fails closed, the audit trail still does not
- `f7d8653` transactions: reword a comment that failed the house-rules lint
- `6899e43` webhooks: bound the signature window on the future side (B-09)
- `a9bf245` webhooks: close the malformed-timestamp bypass in my own B-09 fix

**Taking one real dollar against production today exercises none of this.**

### Two things that make this decision heavier than it looks

1. **`81aa440` is legal copy and is still unreviewed by a lawyer.** Landing
   the 11 puts that copy in front of customers. See TKT-4gxi-008. This is the
   strongest argument for not pushing the whole stack as one unit.

2. **`main` auto-deploys daily.** The signals sweep bot commits to `main` every
   morning at 13:00 UTC and each commit triggers a Production build. Anything
   sitting on `main` ships on its own schedule whether or not anyone pushes.
   There is no staging gate between `main` and customers.

### The dependency this ticket does not own but is entangled with

`sql/014` has never been applied, so `webhook_events` does not exist. If the
11 land before that migration runs, the idempotency in `36c0edb` deploys inert
and degrades open on every webhook event. The migration is purely additive and
safe to run first, and it is designed to be run before the code that uses it.
Run the migration, then land the commits.

### Options, none of which have been chosen

- Land all 11 on `main` and accept that unreviewed legal copy goes live.
- Land 10 and hold `81aa440` back until a lawyer clears it.
- Hold everything until the lawyer clears `81aa440`, and accept that production
  keeps running with no webhook hardening for that whole window.

Chris decides. Nothing will be pushed without an explicit instruction.
