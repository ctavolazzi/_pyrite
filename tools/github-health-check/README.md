# GitHub Health Check

Comprehensive GitHub integration verification tool for AI coding sessions.

## Purpose

Verifies GitHub features are working correctly before starting development work in Claude Code, Cursor, or other AI coding assistants.

## What It Checks

- ✅ **Authentication** - GitHub token is valid
- ✅ **Rate Limits** - Sufficient API quota remaining
- ✅ **Repository Access** - Can read repository metadata
- ✅ **Permissions** - Write access verification
- ✅ **Branch Operations** - Can list/access branches
- ✅ **Pull Requests** - Can read PRs
- ✅ **Issues** - Can read issues

## Usage

### Standalone

```bash
# Basic check
./tools/github-health-check/check.py

# Specify token manually
./tools/github-health-check/check.py --token ghp_xxxxx

# Check different repository
./tools/github-health-check/check.py --repo-path /path/to/repo

# Quiet mode (only output on failure)
./tools/github-health-check/check.py --quiet
```

### From Python

```python
from tools.github_health_check.check import GitHubHealthCheck

checker = GitHubHealthCheck()
success = checker.run_all_checks()
```

## Authentication

The tool tries to find a GitHub token in this order:

1. `--token` command line argument
2. `GITHUB_TOKEN` environment variable
3. `GH_TOKEN` environment variable
4. GitHub CLI (`gh auth status`)

## Exit Codes

- `0` - All checks passed
- `1` - One or more checks failed

## Integration

### Claude Code Session Start Hook

This tool is automatically run when starting a new Claude Code session via `.claude/skills/session-start.md`.

### Manual Integration

Add to your startup scripts:

```bash
# In your shell profile or startup script
if [ -d ".git" ] && [ -f "tools/github-health-check/check.py" ]; then
    python3 tools/github-health-check/check.py --quiet || echo "⚠️  GitHub health check failed"
fi
```

## Output Example

```
🏥 GitHub Health Check
==================================================
🔐 Checking authentication... ✅ OK (authenticated as username)
⏱️  Checking rate limits... ✅ OK (4999/5000 remaining)
📦 Checking repository access... ✅ OK (owner/repo)
🔑 Checking repository permissions... ✅ OK (admin, write)
🌿 Checking branch access... ✅ OK
🔀 Checking PR access... ✅ OK
🐛 Checking issue access... ✅ OK

==================================================
✅ Passed: 7
❌ Failed: 0

✨ GitHub integration is healthy!
```

## Security

- Never logs or exposes tokens
- Uses HTTPS for all API calls
- Follows GitHub API best practices
- Safe for use in CI/CD environments

## Requirements

- Python 3.6+
- No external dependencies (uses stdlib only)
- Git command line tool
- GitHub token (personal access token or gh CLI)

## License

MIT (same as parent project)
