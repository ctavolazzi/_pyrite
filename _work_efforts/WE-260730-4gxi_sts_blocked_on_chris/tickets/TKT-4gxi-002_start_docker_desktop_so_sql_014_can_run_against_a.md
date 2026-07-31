---
id: TKT-4gxi-002
title: "RETRACTED. Docker was never required. sql/014 runs in the Supabase SQL Editor and check-sql.py already validates it without a daemon"
status: completed
created: 2026-07-30T12:45:36.508Z
parent: WE-260730-4gxi
labels: ['sts', 'blocked']
---

# RETRACTED. Docker was never required. sql/014 runs in the Supabase SQL Editor and check-sql.py already validates it without a daemon

Part of [[WE-260730-4gxi_index|WE-260730-4gxi]]

## Status

- [x] Retracted 2026-07-30. Closed with zero Docker involvement.

## Notes

### This ticket was wrong: it asked Chris to start a daemon nothing needed

Filed on the assumption that `sql/014` had to be applied to a local Postgres
before it could be trusted, and that a local Postgres meant Docker. Three
measurements, any one of which would have killed the ticket before it was
written:

**1. The migration says how to run it, in its own header.**

```
-- Run in the Supabase SQL Editor. Idempotent: safe to run more than once.
-- Purely additive, one new table, so it can be applied before the code that
-- uses it ships without breaking the deployment currently serving traffic.
```

Every statement is `create table if not exists`, `create index if not exists`,
or `create or replace view`. It is designed to be pasted into a browser.

**2. There is no local database setup to start.**

`sts-v0.7.3` has no `supabase/` directory, so there is no `supabase start`
stack configured. Docker would have meant building a new local rig from
nothing, not restarting an existing one. There is also no `psql`, `postgres`,
`pg_ctl`, or `initdb` on this machine.

**3. The Docker-free validator already existed, written by a previous session.**

`scripts/check-sql.py` says so in its own docstring:

```
There is no local Postgres on this machine and the Docker daemon is usually off,
```

It parses every migration with `pglast`, a binding to libpg_query, which is
Postgres's actual grammar. The only thing wrong was that `pglast` was not
installed, and the tool correctly refused to report a pass it had not earned:

```
check-sql: pglast is not installed, so NOTHING WAS CHECKED.
           pip install pglast
           Exiting 3 rather than reporting a pass it did not earn.
```

### What running it actually showed

After `pip install pglast` (pglast 8.4):

- All 14 migrations parse, `sql/014` among them, 11 statements.
- The `unreconciled_paid_sessions` view's 12 qualified column references all
  exist on `checkout_transactions`, `fulfilled_sessions`, and `webhook_events`.
- All 11 fields the JavaScript reads are emitted by the view.
- Exit code 0.

### The green check was verified by negative control

Per the standing rule that a passing check is worth nothing until it has been
made to fail on purpose: a deliberately broken `sql/999_negative_control.sql`
containing `create tabl public.oops (id text primary key;` was added, and the
checker reported

```
FAIL  sql/999_negative_control.sql
      syntax error at or near "tabl", at index 7
```

and exited 1. The control file was removed and `git status sql/` came back
clean. The instrument can observe the thing it claims to observe.

### What this does NOT prove

`check-sql.py` says it plainly and so does this note: syntax and column names
only. **None of this proves the migration applies.** Applying it is still a
real step, and it is still Chris's to take, but it takes a browser and about a
minute, not Docker Desktop.

### Where the real dependency moved

Applying `sql/014` is now tracked as its own item rather than hiding behind a
daemon that was never in the path. Until it runs, `webhook_events` does not
exist, and the event idempotency built in `36c0edb` ships inert and degrades
open on every webhook event.

### Lesson

Same shape as the retracted stat-tile report in WE-260730-k0j9: a conclusion
committed before asking whether the premise was load bearing. There the
instrument could not observe the value. Here the obstacle was never in the
path. Both were answerable by reading the thing itself. The migration's own
header had the answer in line 4 the entire time.
