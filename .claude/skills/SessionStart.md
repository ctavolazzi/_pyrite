---
skill: session-start
description: Run startup checks and initialization when beginning a new Claude Code session
trigger: on-session-start
---

# Session Start Hook

This skill runs automatically when a new Claude Code session starts. It performs critical health checks to ensure the development environment is ready.

## Checks Performed

1. **GitHub Integration** - Verify GitHub API access is working
2. **Repository Status** - Confirm we're in a valid git repository
3. **Environment** - Check critical environment variables

## Instructions for Claude

When this session starts, please:

1. **Run GitHub Health Check**
   ```bash
   python3 tools/github-health-check/check.py
   ```

2. **Report Status**
   - If all checks pass: Briefly confirm "✅ Session initialized, GitHub integration healthy"
   - If checks fail: Report what failed and suggest fixes
   - Keep output concise - full details are in the health check output

3. **Context Awareness**
   - Note the current branch
   - Be aware of any warnings from the health check
   - Ready to work on GitHub operations (PRs, issues, commits)

## Error Handling

If the health check fails:
- Don't block the session
- Report the issue clearly
- Suggest common fixes:
  - Set `GITHUB_TOKEN` environment variable
  - Run `gh auth login`
  - Check repository permissions

## Example Session Start

```
🏥 Running startup checks...

🏥 GitHub Health Check
==================================================
🔐 Checking authentication... ✅ OK (authenticated as username)
⏱️  Checking rate limits... ✅ OK (4999/5000 remaining)
📦 Checking repository access... ✅ OK (ctavolazzi/_pyrite)
🔑 Checking repository permissions... ✅ OK (admin, write)
🌿 Checking branch access... ✅ OK
🔀 Checking PR access... ✅ OK
🐛 Checking issue access... ✅ OK

==================================================
✅ Passed: 7
❌ Failed: 0

✨ GitHub integration is healthy!

✅ Session initialized - ready to work on _pyrite
📍 Current branch: main
```

## Notes

- This is a **skill**, not a slash command
- Runs automatically on session start
- Designed to be fast (< 3 seconds)
- Safe to run multiple times
- No side effects (read-only checks)
