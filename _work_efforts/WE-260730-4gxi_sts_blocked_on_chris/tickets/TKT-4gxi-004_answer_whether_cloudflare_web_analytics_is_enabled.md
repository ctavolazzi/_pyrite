---
id: TKT-4gxi-004
title: "ANSWERED by measurement. Cloudflare Web Analytics is not enabled (G-06). The RUM beacon is not served on any route and no snippet exists in source"
status: completed
created: 2026-07-30T12:45:36.508Z
parent: WE-260730-4gxi
labels: ['sts', 'blocked']
---

# ANSWERED by measurement. Cloudflare Web Analytics is not enabled (G-06). The RUM beacon is not served on any route and no snippet exists in source

Part of [[WE-260730-4gxi_index|WE-260730-4gxi]]

## Status

- [x] Answered 2026-07-30 without needing Chris. Beacon is absent.

## Notes

### The premise was wrong: this was measurable from outside

The ticket claimed Web Analytics is "edge-injected and invisible from the
repo", so only the dashboard could answer. The first half is right and the
second half does not follow. Edge injection is invisible **from the repo** but
it is not invisible **from the response**, because injection puts a script tag
into the HTML that anyone can fetch. It was never a dashboard-only question.

### Two-sided probe

**Side A, source.** Nothing in `src/` or `static/` installs a beacon. The only
matches for `cloudflareinsights` are Content-Security-Policy allowlists in
`static/_headers` and `svelte.config.js`, plus a prose mention on
`src/routes/policies/+page.svelte` describing that CSP. So there is no manual
setup.

**Side B, served HTML.** Three routes fetched over the live domain, all
returning 200 and all served by Cloudflare:

| Route | HTTP | `beacon` references |
| ----- | ---- | ------------------- |
| `/` | 200 | 0 |
| `/policies` | 200 | 0 |
| `/book` | 200 | 0 |

The homepage contains exactly 2 occurrences of `cloudflareinsights`, and both
are inside the CSP directive (`script-src static.cloudflareinsights.com` and
`connect-src cloudflareinsights.com`). There is no `beacon.min.js` script tag
and no `data-cf-beacon` attribute anywhere.

Three routes were used deliberately rather than one, because prerendered
static pages get their CSP from `static/_headers` via the Pages CDN while SSR
routes get it from `svelte.config.js` via the Worker. Those are different
serving paths and a beacon could in principle appear on one and not the other.
It appears on neither.

### Conclusion

**Cloudflare Web Analytics is not enabled.** The CSP was pre-authorized for it,
so someone intended to turn it on at some point, but the beacon itself has
never shipped.

### The precise claim, and what it does not cover

What is proven: the Web Analytics RUM beacon is not being served.

What is not covered: Cloudflare also reports zone-level traffic analytics
derived from HTTP logs in the dashboard. That requires no beacon and exists for
any proxied zone. So "there are no analytics at all" would be an overclaim.
The correct statement is that the client-side RUM product is off.

### What would falsify this

A beacon appearing on a route not tested here, or Web Analytics enabled with
the beacon blocked by CSP so it loads and fails rather than never loading. The
second is worth a glance at the browser console if Chris turns it on, since the
CSP already allows `static.cloudflareinsights.com` and would not block it.

### If Chris wants it on

Cloudflare dashboard, Web Analytics, add a site, choose automatic setup for the
zone. The CSP already permits both the script and its connect-back, so no code
change is needed. That would be a new task, not this one.
