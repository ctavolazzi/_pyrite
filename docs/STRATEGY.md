# Pyrite: strategy brief

*A git-native work ledger for developers who run AI coding agents: plans, tickets and checkpoints as files the agent and the human can both read.*

Strategy brief, October 18, 2026 · Stage: personal tool, unpublished · MIT, 1 star · Idle since August 1

> **Positioning.** For solo developers running AI coding agents across several repos who need an honest record of what was asked and what is really finished, Pyrite is the git-native work ledger (markdown work efforts and tickets, a CLI and an MCP server) that will not close work while anything is open, unlike Taskmaster or Backlog.md, which plan tasks but do not audit closure.

**The call.** Ship Pyrite as a free, open-source ledger for solo agent-heavy developers: the CLI and the MCP server only. Fix CI and portability first, move the owner’s cross-project tickets into a private ledger repo, and rename before publishing, because “pyrite” is taken on PyPI and npm. In year one, any revenue comes from setup sessions, not software.

## Where it stands today

| Area | Today | Source |
|---|---|---|
| Core | A stdlib-only Python CLI for work efforts and tickets; closing refuses while tickets are open. Not installable yet: no package or console script. | tools/work-effort/create.py:282, pyproject.toml |
| Tests | Self-tests pass (25, 59, 57 and 5 checks); dashboard 44 tests, one flaky. | tools/work-effort/verify\*.py, mcp-servers/dashboard/tests/ |
| MCP server | 7 tools, pinned to MCP SDK ^0.5.0; the latest is 1.32.1. | mcp-servers/work-efforts/server.js |
| Console | Console chat is broken and names a retired model. | mcp-servers/console/server.js:63 |
| Data quality | Hub tables break on an unescaped pipe; 82 of 273 ticket files are duplicates; 12.9 MB of screenshots are tracked. | tools/work-effort/create.py:225, .playwright-mcp/ |
| Activity | Main CI last green January 1; all 22 runs since failed lint and link checks. Last commit August 1. | GitHub Actions, git log |

## Market

Local-first task memory for AI coding agents: developer tooling that keeps an agent’s plan, progress and proof of completion in the repo.

- **$1B**: Claude Code run-rate revenue, November 2025, six months after launch. Source: [Anthropic](https://www.anthropic.com/news/anthropic-acquires-bun-as-claude-code-reaches-usd1b-milestone)
- **225M+**: Developers on GitHub, in 4M+ organizations. Source: [GitHub](https://github.com/about)
- **45,894**: Servers in the official MCP registry, counted through its API on October 18. Source: [MCP registry](https://registry.modelcontextprotocol.io/v0/servers?version=latest)

Demand for this niche is visible in comparable open-source tools: Taskmaster has 28.2K GitHub stars, Beads 28.0K and Backlog.md 7.1K. Stack Overflow and Cursor usage figures could not be reached.

## Audience segments

Four segments. Solo builders running agents across several repos are the beachhead: the product already fits them, and distribution to them is free.

### Solo agent-heavy builders (beachhead), fit 4 of 5

- **Who:** Indie developers running Claude Code, Cursor or Codex on 3 or more repos.
- **Size:** Unknown; the Claude Code repo has 152.2K stars as a proxy.
- **Job to be done:** A durable, checkable done-list across sessions.
- **Pains:** Agents forget, “done” goes unverified, notes scatter.
- **Uses today:** CLAUDE.md and built-in memory, Backlog.md, Taskmaster, Beads.
- **Will pay:** Low, since alternatives are free; Basic Memory Cloud sells at $15 a month.
- **Reach them:** GitHub, the MCP registry, Claude Code plugin listings, r/ClaudeAI, Show HN.

Built in exactly this workflow, though another of the owner’s projects rejected its ticket CLI as too heavy for one person.

### Obsidian developers, fit 3 of 5

- **Who:** Developers who keep dev logs in a vault.
- **Size:** Unknown.
- **Job to be done:** Agent work appears as linked notes and in the daily note.
- **Pains:** Copying by hand; broken links.
- **Uses today:** Hand-written notes, Basic Memory (4.3K stars).
- **Will pay:** Low to medium; $15 a month benchmark.
- **Reach them:** The Obsidian forum and plugin directory.

A link linter exists; the daily-note plugin is hardwired to the owner’s vault.

### Small teams and agencies, fit 2 of 5

- **Who:** Teams of 2 to 15 running agents on client repos.
- **Size:** Unknown; GitHub has 4M+ organizations.
- **Job to be done:** A shared view of agent work.
- **Pains:** Handoffs; trackers that aren’t agent-native.
- **Uses today:** GitHub Issues and Projects, Linear.
- **Will pay:** Medium; GitHub Team is $4 per user a month.
- **Reach them:** Agency communities.

No auth and no multi-user support yet.

### MCP tool builders, fit 2 of 5

- **Who:** Builders who want a drop-in task store.
- **Size:** 45,894 registry servers.
- **Job to be done:** A task store any agent can use.
- **Pains:** Building one themselves.
- **Uses today:** Taskmaster and Backlog.md MCP servers.
- **Will pay:** None.
- **Reach them:** The MCP registry.

The SDK is a major version behind and the server is unlisted.

**Why this beachhead:** The product already fits this workflow, distribution through registries and Show HN is free, and comparable tools with 28K stars show this segment adopts free tools fast.

## Competitive landscape

| Alternative | Price | Strength | Weakness | How we differ |
|---|---|---|---|---|
| Taskmaster AI | 28.2K stars; MIT with Commons Clause | Turns a PRD into tasks; MCP. | Planning-first; resale restricted. | Audits closure; verify suites. |
| Beads | 28.0K stars; MIT | Dependency graph with Dolt sync. | Database storage. | Plain markdown and Obsidian links. |
| Backlog.md | 7.1K stars; MIT | Markdown tasks, Kanban, MCP, web UI. | None verified; the closest overlap. | Effort, ticket and checkpoint hierarchy; a multi-repo dashboard. |
| Claude Code memory | Built in, free | Zero setup. | Holds instructions, not a task ledger. | The ledger that memory points to. |
| GitHub Issues and Projects | Free | The team standard. | Remote, outside the agent’s files. | Local files the agent edits. |

## Value proposition and offer

- **For solo agent-heavy builders:** Your agent’s plan and progress live in a folder you can read, grep and commit. Close refuses while anything is open. Stdlib Python, no account, any agent through MCP, with verify suites that check the ledger.
- **For Obsidian developers:** Agent work lands in your vault as wikilinked notes and today’s daily note, with every link checked. A read-only linter already exists.

### Pricing ladder

| Step | Tier | Price | What | Benchmark | Status |
|---|---|---|---|---|---|
| 1 | Core CLI and MCP server | Free (MIT) | Work efforts, tickets, checkpoints, verify suites. | All three main competitors are free; MIT is cleaner than Taskmaster’s Commons Clause. | Proposed |
| 2 | Setup sessions | $125 a session | Agent-workflow setup for a developer or a small team. | Matches the owner’s published AI training rate. | Proposed |
| 3 | Hosted dashboard | $8 to $12 a month | Only after 500 stars. | Basic Memory Cloud: $15 a month. | Proposed |
| 4 | Team tier | $6 per user a month | With auth and multi-user views. | GitHub Team $4 per user; Copilot Pro $10. | Proposed |

## Go to market

1. **Registries.** The MCP registry, Claude Code plugins and PyPI are free and where solo builders look. **First move:** List the MCP server on registry.modelcontextprotocol.io.
2. **Essay, then Show HN and r/ClaudeAI.** The verification receipts (“4 assertions made, 2 recorded, still green”) are a distinctive story. **First move:** Publish that post with a 60-second demo.
3. **The owner’s video audience.** An existing AI audience can try it on day one. **First move:** One recorded build tracked by Pyrite.

## Plan

### Next 90 days

| Date | Milestone | Target |
|---|---|---|
| 2026-11-08 | Clean house | CI green on 3 of 3 jobs; pipe bug fixed; 82 duplicates and 12.9 MB of screenshots removed |
| 2026-11-30 | Portable | 0 sibling-repo dependencies and 0 hardcoded home paths in shipped code; pipx install works on 2 operating systems |
| 2026-12-15 | Listed | SDK on 1.x; console fixed or removed; 1 registry listing |
| 2027-01-15 | Launch | 1 essay, 1 video, 1 Show HN; 100 stars |
| 2027-01-31 | Listen | 5 user interviews, then a go or no-go on hosting |

### 12-month goals

- 1,000 GitHub stars by October 31, 2027.
- 300 PyPI downloads a week.
- 10 external contributors.

## KPIs

| Metric | How to measure | Target |
|---|---|---|
| Stars per week | GitHub API. | 100 by January 15 |
| Installs | Weekly downloads on pypistats.org. | 300 a week in 12 months |
| Activation | Share of users closing a work effort within 7 days (opt-in survey). | Baseline after launch |
| Quality | Days main CI is green; the verify-suite check count never falls. | Green every day |
| Community | External issues and PRs a month; median time to first reply. | Reply within 2 days |

## Risks

| Risk | Level | Mitigation |
|---|---|---|
| Crowded field of free incumbents | High | Own “verification-first”; import and export with Backlog.md and Beads. |
| Platform absorption: agents build their own memory | Medium | Stay agent-agnostic through MCP and AGENTS.md. |
| Owner time: no commits since August 1 | High | 4 hours a week, CLI and MCP only. |

## Untangling

Pyrite grew up as the owner’s own operating system, so it carries his paths, his other projects’ tickets and his sibling repos. A stranger can’t install it until those come out.

### What ties it to other projects today

- pyproject.toml depends on sibling folders ../NovaSystem-Codex and ../empirica; only one test file imports them.
- Hardcoded paths to the owner’s own machine and folders (plugins/daily\_note/plugin.py:30, pyrite:92).
- The dashboard config lists FogSift and other repos and limits browsing to the owner’s Code folder.
- \_work\_efforts/ tracks other projects: the book’s checkout (3 efforts, 28 tickets), sightglass (9), cross-repo push blockers (4), an empirica fix.
- OPERATING-PROMPT.md binds Pyrite to sightglass, the daily note and a personal skills script; NovaSystem files live in tools/nova-process/.
- The revision-loop skill on a \_workbench branch names CT 19 times and Pyrite 0 times.

### Steps to stand alone

1. Move non-Pyrite work efforts to a private ledger repo that installs Pyrite.
2. Remove the sibling-repo sources, the blend-validation files and nova-process.
3. Replace hardcoded paths with a pyrite.config.json and environment overrides.
4. Split OPERATING-PROMPT.md: the general discipline stays; the owner’s stack moves to \_workbench.
5. Archive the 24 root status docs and the two backup folders.
6. Keep the revision-loop skill out of Pyrite; merge it into \_workbench main.

## Decisions for the owner

1. A product, or a personal tool? How many hours a week?
2. Keep the name (taken on PyPI and npm) or rename?
3. Ship the dashboard and console, or only the CLI and MCP server?
4. Where do the cross-project tickets go?
5. A hosted tier, ever?
6. Retire the Johnny Decimal layout now?

## Sources

1. [Anthropic: Claude Code reaches $1B](https://www.anthropic.com/news/anthropic-acquires-bun-as-claude-code-reaches-usd1b-milestone): $1B run-rate
2. [Anthropic: Series F](https://www.anthropic.com/news/anthropic-raises-series-f-at-usd183b-post-money-valuation): $500M run-rate and 10x usage
3. [GitHub: about](https://github.com/about): Developers and organizations
4. [GitHub pricing](https://github.com/pricing): GitHub Team price
5. [GitHub Copilot plans](https://github.com/features/copilot/plans): Copilot prices
6. [MCP registry API](https://registry.modelcontextprotocol.io/v0/servers?version=latest): 45,894 servers
7. [Taskmaster AI](https://github.com/eyaltoledano/claude-task-master): Stars and license
8. [Beads](https://github.com/steveyegge/beads): Stars and license
9. [Backlog.md](https://github.com/MrLesk/Backlog.md): Stars and features
10. [Basic Memory](https://github.com/basicmachines-co/basic-memory): Stars and cloud price
11. [Claude Code memory docs](https://code.claude.com/docs/en/memory): Built-in memory
12. [Model deprecations](https://platform.claude.com/docs/en/about-claude/model-deprecations): Retired model date
13. [PyPI: pyrite](https://pypi.org/pypi/pyrite/json): Name taken
14. [npm: pyrite](https://registry.npmjs.org/pyrite): Name taken
15. [npm: MCP SDK](https://registry.npmjs.org/@modelcontextprotocol/sdk/latest): SDK 1.32.1

---

*Prepared October 18, 2026 from the \_pyrite repo and web sources. Unlike most of these briefs, this research could open several pages directly (Anthropic, GitHub, PyPI, npm, the MCP registry); Stack Overflow, Cursor, Linear and the Cline docs were unreachable. Positioning, prices and the plan are recommendations. This is the public edition: internal operational detail is kept in a private copy.*
