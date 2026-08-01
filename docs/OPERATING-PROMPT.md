# Operating prompt: how to actually get work done with this stack

Paste this into a new chat. It is written as instructions to whoever picks up
the work, human or model.

Every rule below has a receipt from a session where breaking it cost real time.
The receipts are the point. A rule without one is someone's preference.

---

## 1. THE THREE TOOLS, AND WHEN EACH EARNS ITS KEEP

**pyrite work efforts** (`~/Code/active/_pyrite`) turn a pile of intentions into
a folder of linked markdown you can close. Use it the moment a task has more
than two steps or will outlive one sitting.

**sightglass** (`~/Code/active/sightglass`) is a test runner that reports what
your tests MEASURED, not just whether they passed. Use it when you need to trust
a green check.

**The daily note** (`~/Documents/Personal-Remote-Vault/Daily Notes/`) is where a
session's narrative lives so the next one can find it.

They compose: the work effort says what to do, sightglass says whether it is
actually done, the daily note says what happened.

---

## 2. THE LOOP

    pyrite we create --title "..." --objective "..." --todos-file todos.md
    # ...work one ticket...
    verify by BREAKING it
    git commit                                  # one ticket, one commit
    pyrite ticket status --id TKT-xxxx-NNN --status completed
    pyrite we sync --we WE-YYMMDD-xxxx
    # ...repeat...
    pyrite we close --we WE-YYMMDD-xxxx          # refuses while anything is open

Decompose BEFORE you start. A ticket written after the work is done is a
self-graded checkbox. The tool cannot tell the difference; you can.

Commit per ticket, not per session. Uncommitted work in a repo that other
sessions or bots also touch is work you are gambling with. During one session
`sts-v0.7.3` went from 47 to 50 commits ahead on its own, because a scheduled
job commits there too.

---

## 3. THE COMMANDS THAT MATTER

    # from anywhere
    python3 ~/Code/active/_pyrite/tools/work-effort/create.py list
    python3 ~/Code/active/_pyrite/tools/work-effort/create.py list --filter-status active
    python3 ~/Code/active/_pyrite/tools/work-effort/create.py sync  --we WE-260730-tfxo
    python3 ~/Code/active/_pyrite/tools/work-effort/create.py close --we WE-260730-tfxo
    python3 ~/Code/active/_pyrite/tools/ticket/create.py list   --we WE-260730-tfxo
    python3 ~/Code/active/_pyrite/tools/ticket/create.py create --we WE-260730-tfxo --title "..." --desc "..."
    python3 ~/Code/active/_pyrite/tools/ticket/create.py status --id TKT-tfxo-009 --status completed

    # before believing the tooling
    python3 ~/Code/active/_pyrite/tools/work-effort/verify.py            # 25 checks
    python3 ~/Code/active/_pyrite/tools/work-effort/verify_cli.py        # 59 checks
    python3 ~/Code/active/_pyrite/tools/work-effort/verify_edge_cases.py # 57 checks
    python3 ~/Code/active/_pyrite/tools/obsidian-linter/verify_readonly.py

    # before believing your own tests
    cd ~/Code/active/sightglass && npm test
    sightglass run tests --strict-hollow      # exit 3 if anything measured nothing
    sightglass import pw.json                 # an existing Playwright suite
    sightglass explore http://localhost:3000  # grow an e2e suite, one round at a time

There is no `pyrite` on PATH. Call the scripts directly.

---

## 4. THE ONE DISCIPLINE THAT PAYS FOR ITSELF

**Never report a green check you have not watched go red.**

Concretely, for every guarantee you add:

1. Write the check.
2. Break the thing it checks, on purpose.
3. Confirm the check fails, and fails for the RIGHT REASON.
4. Restore, confirm green.

And when you mutate source to do step 2, **grep to confirm the mutation actually
landed** before trusting the result. Two mutation tests in this project's history
reported "survived" because the substitution never matched anything, and a third
patched the wrong one of two identical-looking lines.

Receipts from one session of applying this:

- A hollow-test exemption looked correct. Pasting it on a healthy test was
  supposed to fail. Tested it: it did. Then mutated the expiry rule out and
  confirmed exactly two guarding tests went red.
- An assertion sink was documented as "fine until concurrency". Ran the runner
  inside a test: **4 assertions made, 2 recorded, still green.** The bug was
  already live, sequentially, and the comment had been wrong for months.
- A test claimed the old design "misfiles" assertions. Measured it: it **loses**
  one outright. The claim was corrected by the measurement, not by review.

Corollary, and the more expensive half: **ask whether your instrument can observe
the thing at all.** A previous session filed a bug report on six readings of an
animated counter taken with `--dump-dom`, which cannot advance a frame clock. All
six were mid-tween. The report was committed, then retracted, with zero product
code changed.

---

## 5. HOW TO CHECK YOURSELF

Four questions, in order of how often they catch something:

1. **What is the denominator?** "0 failures" is meaningless without "out of how
   many". This is the entire thesis of sightglass. A real example: an axe-core
   scan reports 91 rules evaluated, but 73 of them found no matching elements.
   The honest number is 18.
2. **Could this check have failed?** If no input reaches the other verdict, you
   have not tested it, you have visited it.
3. **Did I measure this, or remember it?** Re-measure. In this session the
   inherited handoff was wrong about the commit count, the work-effort count, the
   production deploy SHA, and the single action it called highest-value.
4. **Is "not measured" being reported as zero?** This is the recurring bug in
   this whole codebase family. Playwright's JSON reporter cannot report assertion
   counts, so importing a suite and recording 0 would flag every passing test as
   hollow. `0 hollow of 0 judgeable` is unhelpful and true; `0% hollow` is helpful
   and a lie.

---

## 6. HOUSE RULES, ENFORCED BY A SCRIPT

    ~/.claude/skills/mvp-spinup/scripts/houserules.sh <paths>

Run it as its own step before committing. It checks: no em dashes, no
`!important`, no banned vocabulary, versions start at 0.0.1, no false live-data
claims.

The ones a script cannot check:

- Never claim a payment pipeline works from code review. Run a real transaction
  and confirm every downstream effect.
- Stage files by name in `sts-v0.7.3`. Its worktree carries dirty paths from
  other sessions and from a scheduled job.
- Commit locally as you go. Ask before pushing.
- Edits go through the editor, one at a time, against a live todo list. No
  batch `sed`/`python` rewrites of source files.
- Ship each ask before starting the next.

---

## 7. WHEN YOU FIND SOMETHING OUT OF SCOPE

File it, do not fix it. Scope creep dressed as helpfulness is how a two-ticket
session becomes an unreviewable diff.

    python3 ~/Code/active/_pyrite/tools/ticket/create.py create \
      --we WE-260730-tfxo \
      --title "explore silently ignores unknown CLI flags, unlike run" \
      --desc "Found by passing --dir to explore: accepted, ignored, no message."

That is a real ticket filed exactly that way, mid-session, instead of being
fixed inside an unrelated commit.

---

## 8. STARTING A SESSION

    python3 ~/Code/active/_pyrite/tools/work-effort/create.py list --filter-status active
    git -C <repo> status -sb
    git -C <repo> log --oneline -10

Then pick ONE work effort. Ask which, if more than one is live and they pull in
different directions. Only one thread in this workspace has revenue attached
(`sts`), and knowing that changes what "most valuable" means.

Read any handoff you are given, then verify it before acting on it. Including
this one.
