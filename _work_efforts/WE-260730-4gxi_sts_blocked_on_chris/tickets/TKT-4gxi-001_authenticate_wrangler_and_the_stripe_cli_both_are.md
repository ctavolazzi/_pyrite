---
id: TKT-4gxi-001
title: "Authenticate the stripe CLI. Half this ticket was wrong: wrangler was already authenticated the whole time"
status: in_progress
created: 2026-07-30T12:45:36.508Z
parent: WE-260730-4gxi
labels: ['sts', 'blocked']
---

# Authenticate the stripe CLI. Half this ticket was wrong: wrangler was already authenticated the whole time

Part of [[WE-260730-4gxi_index|WE-260730-4gxi]]

## Status

- [x] wrangler: already authenticated, verified 2026-07-30. Nothing to do.
- [ ] stripe CLI: still unauthenticated. `stripe login`. This half is real.

## Notes

### wrangler was never blocked

`npx wrangler whoami` from `sts-v0.7.3`:

```
You are logged in with an OAuth Token, associated with the email ctavolazzi@gmail.com.
Account Name: ctavolazzi
Account ID:   57c4a9e23c2d33763040f3020ce1dcda
```

Token scopes include `pages (write)`, `workers (write)`, `d1 (write)`,
`workers_scripts (write)`, and `zone (read)`. That is everything the STS
go-live path needs from Cloudflare.

The claim that wrangler was unauthenticated appears to have come from reading
a truncated `whoami` output, where the tail of the scope list was mistaken for
an error. Nobody ran the command and read the top of what it printed.

### What the working wrangler auth already answered, with no help from Chris

Three questions that were previously parked as blocked got settled by using
the CLI that was working the whole time:

1. **Which branch production builds from.** Every Production deployment on the
   `survivingthesingularity` Pages project builds from `main`. This is why
   TKT-4gxi-009 needed rewriting: pushing to `origin/v0.7.3` would deploy
   nothing at all.

2. **What is actually deployed.** The newest Production deployment is
   `3600400`, not `332fdfd` as previously recorded. `3600400` turns out to be
   `chore: daily signals sweep 2026-07-30`, committed by `github-actions[bot]`
   from `signals-sweep.yml` on a 13:00 UTC cron. So no unknown human work is
   live, but `main` is a live wire that redeploys daily on its own.

3. **B-05, confirmed rather than assumed.** `wrangler pages secret list`
   returns exactly `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`,
   `STRIPE_PRICE_ID`, `STRIPE_PRICE_ID_STANDARD`, `STRIPE_SECRET_KEY`,
   `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_KEY`.
   **`STRIPE_PRICE_ID_AUTHORS` is missing.** B-05 is real.

This also demotes TKT-4gxi-010, the MCP authorization ticket, from blocking to
optional. The authed wrangler CLI supplied all of the above without any
Cloudflare MCP server.

### What is still genuinely blocked

The stripe CLI. `~/.config/stripe/config.toml` does not exist:

```
stripe config --list
open /Users/ctavolazzi/.config/stripe/config.toml: no such file or directory
```

Run `stripe login`. Needed for B-03, creating the live-mode webhook endpoint
pointing at `/api/webhooks/stripe`.

### Order that is not negotiable

B-03 before B-04. Create the live webhook endpoint first, switch
`STRIPE_SECRET_KEY` to the live key second. Reversed, production accepts real
payments and records none of them.

### Lesson

A blocker was asserted for two tools at once because they were mentally
grouped as "the unauthed CLIs". They were never checked separately. One had
been working all along, and it held the answers to three other open questions.
Check each claim on its own, and read the whole output, not the tail.
