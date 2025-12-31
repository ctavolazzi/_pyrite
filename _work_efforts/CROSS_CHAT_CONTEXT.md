# Cross-Chat Context Document

**Last Updated:** 2025-12-31 13:15 PST
**Active Cursor Session:** Yes (local)
**Purpose:** Provide context for new Claude Code sessions

---

## Current State

### Repository
- **Branch:** `main` (clean)
- **Latest Commit:** `66d620d` - Cross-chat context document
- **Remote:** Synced with `origin/main`

### Completed Work Effort
**WE-251231-25qq** - GitHub Health Check Tool - Foundation ✅ COMPLETE

| Ticket | Status | Notes |
|--------|--------|-------|
| TKT-25qq-001 | ✅ Complete | Architecture done |
| TKT-25qq-002 | ✅ Complete | 7 health checks implemented |
| TKT-25qq-003 | ✅ Complete | Secure token handling |
| TKT-25qq-004 | ✅ Complete | CLI interface |
| TKT-25qq-005 | ✅ Complete | Claude skills hook (full MCP server deemed unnecessary) |
| TKT-25qq-006 | ✅ Complete | Documentation |
| TKT-25qq-007 | 📋 Deferred | Future modular refactor (low priority) |

### What Was Just Accomplished
1. First cross-chat coordinated feature delivery
2. GitHub health check tool merged (PR #9)
3. Session start hook for Claude Code
4. Work effort tracking demonstrated
5. WE-251231-25qq marked COMPLETE

---

## DECISION MADE: Option B - Formalize Work Efforts + Forker Docs

**Cursor decided.** Reasoning:

1. **Meta-validation** - Building work effort tools using work efforts proves the system
2. **Enables feedback** - Can't iterate without users; can't get users without docs
3. **Lower risk** - CLI tools + docs are well-understood problems
4. **Quick wins** - Visible progress in 1-2 sessions

**NOT Option A** because: Claude skills hook IS sufficient AI integration. Full MCP server is over-engineering.

**NOT Option C** because: Infrastructure before validation is premature.

---

## NEXT TASK (Semi-Ambiguous - You Must Clarify)

**User Request:**
> "I want Obsidian-style markdown formatting using the Obsidian docs. Build an Obsidian Markdown linter tool in addition to the git tools we have."

**This is a test of the _pyrite workflow system.**

Your job is NOT to immediately start coding. Your job is to:

1. **FIRST: Clearly identify the goal** - What problem are we solving? Who is it for?
2. **Research** - What does Obsidian markdown formatting entail? (wikilinks, callouts, frontmatter, etc.)
3. **Scope** - What should the linter check? What's MVP vs future?
4. **Create Work Effort** - Only after goal is clear
5. **Propose tickets** - Get Cursor's feedback before implementing

**Reference Material:**
- Obsidian Help Docs: https://help.obsidian.md/
- Existing _pyrite markdown: `_work_efforts/` folder has examples
- Existing tool pattern: `tools/github-health-check/`

**DO NOT:**
- Jump straight to implementation
- Assume you know what the user wants
- Create tickets before identifying the goal

**DO:**
- Ask clarifying questions if needed
- State your understanding of the goal explicitly
- Explain your reasoning
- Propose a scope before creating work effort

---

## Coordination Protocol

### For New Claude Code Session

1. **Pull latest:** `git pull origin main`
2. **Read this file:** `_work_efforts/CROSS_CHAT_CONTEXT.md`
3. **Check devlog:** `_work_efforts/devlog.md` (latest entry)
4. **Run health check:** `python3 tools/github-health-check/check.py`
5. **Coordinate with Cursor** via commit messages and this file

### For Cursor (Local)

- I (Cursor) will monitor for commits from Claude Code
- I'll update this file when context changes
- I'll track work effort progress locally

---

## Next Steps (WORKFLOW TEST)

**Claude Code should:**
1. Pull latest from main
2. Read this file
3. **STOP and think** - What is the actual goal?
4. State understanding of the goal explicitly
5. Research Obsidian markdown features if needed
6. Propose scope and get feedback (commit to this file or ask)
7. Only THEN create work effort and tickets

**Cursor will:**
1. Monitor for Claude Code's goal statement
2. Provide feedback on scope
3. Approve/adjust before implementation begins
4. Track progress and review PRs

**This tests:**
- Can AI handle ambiguous requests?
- Does the workflow force proper planning?
- Can cross-chat coordination handle back-and-forth?

---

## Communication

When Claude Code starts a new session:
1. Read this file first
2. Acknowledge the context in your response
3. State which option you're proceeding with (or ask for clarification)
4. Create work effort if starting new work
5. Commit updates to this file as work progresses

**Cursor will update this file after each significant local change.**

