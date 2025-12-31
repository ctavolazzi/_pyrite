# Claude Code Configuration

This directory contains Claude Code configuration for the _pyrite project.

## Structure

```
.claude/
├── README.md           # This file
└── skills/             # Session start hooks and skills
    └── SessionStart.md # Runs on session start
```

## Skills

### SessionStart

**Trigger**: Automatically runs when a new Claude Code session begins

**Purpose**: Verify the development environment is ready before starting work

**What it does**:
1. Runs GitHub health check (`tools/github-health-check/check.py`)
2. Verifies authentication, permissions, and API access
3. Reports any issues or warnings
4. Provides context about current repository state

**Configuration**: See [`skills/SessionStart.md`](skills/SessionStart.md)

## How Session Start Works

When you start a new Claude Code session in this repository:

1. Claude Code loads the `.claude/skills/SessionStart.md` file
2. The skill instructs Claude to run startup checks
3. GitHub health check verifies integration is working
4. Claude reports status and is ready to work

## Adding Custom Session Checks

To add more checks to session start:

1. Edit `.claude/skills/SessionStart.md`
2. Add new check steps under "Instructions for Claude"
3. Keep checks fast (< 5 seconds total)
4. Report concisely - users want to start working quickly

## Environment Setup

For the GitHub health check to work, you need a GitHub token:

```bash
# Option 1: Environment variable
export GITHUB_TOKEN="ghp_xxxxxxxxxxxx"

# Option 2: Use gh CLI
gh auth login
```

## Troubleshooting

### "No GitHub token found"

Set `GITHUB_TOKEN` environment variable or run `gh auth login`

### "Cannot access repository"

Check you have permissions on the repo and the token has correct scopes

### Session start is slow

Keep total checks under 5 seconds - remove or optimize slow checks

## Related Documentation

- [GitHub Health Check Tool](../tools/github-health-check/README.md)
- [Claude Code Skills Documentation](https://github.com/anthropics/claude-code)

## Notes

- Skills run in the Claude Code session context
- They're instructions to Claude, not executable code
- Keep session start fast and focused
- Don't block on non-critical checks
