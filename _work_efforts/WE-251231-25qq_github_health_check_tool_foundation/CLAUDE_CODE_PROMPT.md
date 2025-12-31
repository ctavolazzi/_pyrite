# Claude Code Prompt - GitHub Health Check Tool

## Context

Work Effort `WE-251231-25qq` has been created locally in Cursor. We're coordinating work between:
- **Cursor (local)**: Architecture decisions, file structure, local testing
- **Claude Code (cloud)**: GitHub API implementation, PR creation

## Your Task

Create a feature branch and implement **TKT-25qq-001: Define tool architecture and file structure** and **TKT-25qq-002: Implement core GitHub API health checks**.

### Branch to Create
```
feature/WE-251231-25qq-github_health_check_tool_foundation
```

### File Structure to Create
```
tools/
└── github-health/
    ├── __init__.py
    ├── health_check.py      # Core health check logic
    ├── github_client.py     # GitHub API wrapper
    ├── checks/
    │   ├── __init__.py
    │   ├── auth.py          # Authentication verification
    │   ├── repo.py          # Repository access checks
    │   ├── permissions.py   # Permission validation
    │   └── rate_limit.py    # Rate limit status
    ├── cli.py               # Command-line interface
    └── README.md            # Tool documentation
```

### Health Checks to Implement

```python
# health_check.py should run these checks:

class GitHubHealthCheck:
    """
    Validates GitHub API access and permissions.
    Run at start of AI chat sessions.
    """

    def check_authentication(self) -> CheckResult:
        """Verify token is valid, get authenticated user."""

    def check_repo_access(self, owner: str, repo: str) -> CheckResult:
        """Verify read access to specified repo."""

    def check_write_permissions(self, owner: str, repo: str) -> CheckResult:
        """Verify can create branches, push commits."""

    def check_pr_permissions(self, owner: str, repo: str) -> CheckResult:
        """Verify can create/update PRs."""

    def check_rate_limits(self) -> CheckResult:
        """Check remaining API calls."""

    def run_all(self, owner: str, repo: str) -> HealthReport:
        """Run full health check suite."""
```

### Security Requirements
- NEVER log or print tokens
- Use environment variable `GITHUB_TOKEN` or `GH_TOKEN`
- Fail gracefully with clear error messages
- No hardcoded credentials anywhere

### Output Format
```
🔍 GitHub Health Check - ctavolazzi/_pyrite
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Authentication     │ Valid (user: ctavolazzi)
✅ Repository Access  │ Read access confirmed
✅ Write Permissions  │ Can push to branches
✅ PR Permissions     │ Can create pull requests
✅ Rate Limits        │ 4,892/5,000 remaining

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status: HEALTHY ✅ Ready for development
```

### Dependencies
- `PyGithub` or use GitHub's REST API directly with `requests`
- Prefer minimal dependencies for portability

### When Ready
1. Create the branch
2. Implement the structure and core checks
3. Use "Create PR" to open a PR back to main
4. Include in PR description:
   - Reference: `WE-251231-25qq`
   - Tickets: `TKT-25qq-001`, `TKT-25qq-002`

## Feedback Loop

After creating the PR, share the PR number/URL. I'll:
1. Review in Cursor
2. Pull the branch locally
3. Test and provide feedback
4. We iterate until ready to merge

---

**Copy this entire prompt to Claude Code to get started.**

