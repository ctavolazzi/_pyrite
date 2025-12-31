---
id: WE-251231-25qq
title: "GitHub Health Check Tool - Foundation"
status: active
created: 2025-12-31T20:34:34.994Z
created_by: ctavolazzi
last_updated: 2025-12-31T20:47:41.574Z
branch: feature/WE-251231-25qq-github_health_check_tool_foundation
repository: ctavolazzi/_pyrite
---

# WE-251231-25qq: GitHub Health Check Tool - Foundation

## Metadata
- **Created**: Wednesday, December 31, 2025 at 12:34:34 PM PST
- **Author**: ctavolazzi
- **Repository**: ctavolazzi/_pyrite
- **Branch**: feature/WE-251231-25qq-github_health_check_tool_foundation

## Objective
Create the first foundational tool for the _pyrite ecosystem: a GitHub health check/verification tool that validates GitHub API access, permissions, and readiness at the start of AI chat sessions. This is the first building block toward _pyrite becoming a cross-chat AI context management platform.

## Tickets

| ID | Title | Status |
|----|-------|--------|
| TKT-25qq-001 | Define tool architecture and file structure | pending |
| TKT-25qq-002 | Implement core GitHub API health checks | pending |
| TKT-25qq-003 | Add security layer for token handling | pending |
| TKT-25qq-004 | Create CLI interface for manual runs | pending |
| TKT-25qq-005 | Add MCP server integration for AI tools | pending |
| TKT-25qq-006 | Write documentation for forkers | pending |

## Progress
- 12/31/2025: PR #9 merged - GitHub health check tool now in main. 5/6 tickets complete. Remaining: MCP server integration (partial via Claude skills).

## Commits
- `372353e`
- (populated as work progresses)

## Related
- Docs: (to be linked)
- PRs: (to be added)

## Cross-Chat Coordination

This work effort is being coordinated between:
- **Cursor (local)**: Architecture, review, local testing
- **Claude Code (cloud)**: GitHub API implementation, PR creation

See `CLAUDE_CODE_PROMPT.md` for the Claude Code handoff instructions.

## Vision Context

This tool is the **first foundational piece** of _pyrite's larger goal:
- _pyrite = forkable cross-chat AI context management platform
- GitHub repo = central data store across AI sessions
- This health check = session initialization tool
- Future: multi-repo management, PocketBase integration, work effort syncing
