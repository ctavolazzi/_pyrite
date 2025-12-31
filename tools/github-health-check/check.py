#!/usr/bin/env python3
"""
GitHub Health Check Tool

Verifies GitHub integration is working before starting development work.
Designed to run at session start in Claude Code, Cursor, and other AI coding tools.
"""

import os
import sys
import json
import subprocess
from typing import Dict, Optional, Tuple
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError


class GitHubHealthCheck:
    """Performs comprehensive GitHub API health checks."""

    def __init__(self, token: Optional[str] = None, repo_path: str = "."):
        """
        Initialize the health checker.

        Args:
            token: GitHub token (if None, will try to detect from environment)
            repo_path: Path to git repository (default: current directory)
        """
        self.token = token or self._get_token()
        self.repo_path = repo_path
        self.repo_info = self._get_repo_info()
        self.checks_passed = 0
        self.checks_failed = 0
        self.warnings = []

    def _get_token(self) -> Optional[str]:
        """Try to get GitHub token from environment or git credentials."""
        # Try environment variable first
        token = os.getenv("GITHUB_TOKEN") or os.getenv("GH_TOKEN")
        if token:
            return token

        # Try gh CLI
        try:
            result = subprocess.run(
                ["gh", "auth", "status", "-t"],
                capture_output=True,
                text=True,
                timeout=5
            )
            for line in result.stderr.split('\n'):
                if 'Token:' in line:
                    return line.split('Token:')[1].strip()
        except (subprocess.TimeoutExpired, FileNotFoundError):
            pass

        return None

    def _get_repo_info(self) -> Optional[Dict[str, str]]:
        """Extract repository owner and name from git remote."""
        try:
            result = subprocess.run(
                ["git", "-C", self.repo_path, "remote", "get-url", "origin"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode != 0:
                return None

            url = result.stdout.strip()

            # Parse GitHub URL (handle both HTTPS and SSH)
            if "github.com" in url:
                # Remove .git suffix
                url = url.rstrip(".git")

                if url.startswith("git@github.com:"):
                    parts = url.replace("git@github.com:", "").split("/")
                elif "github.com/" in url:
                    parts = url.split("github.com/")[1].split("/")
                else:
                    return None

                if len(parts) >= 2:
                    return {"owner": parts[0], "repo": parts[1]}

            return None
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return None

    def _api_request(self, endpoint: str) -> Tuple[Optional[Dict], Optional[str]]:
        """
        Make a GitHub API request.

        Returns:
            Tuple of (response_data, error_message)
        """
        if not self.token:
            return None, "No GitHub token available"

        url = f"https://api.github.com/{endpoint.lstrip('/')}"

        try:
            req = Request(url)
            req.add_header("Authorization", f"token {self.token}")
            req.add_header("Accept", "application/vnd.github.v3+json")

            with urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())
                return data, None
        except HTTPError as e:
            return None, f"HTTP {e.code}: {e.reason}"
        except URLError as e:
            return None, f"Network error: {e.reason}"
        except Exception as e:
            return None, f"Error: {str(e)}"

    def check_authentication(self) -> bool:
        """Verify GitHub authentication is working."""
        print("🔐 Checking authentication...", end=" ", flush=True)

        if not self.token:
            print("❌ FAIL")
            print("   No GitHub token found in GITHUB_TOKEN, GH_TOKEN, or gh CLI")
            self.checks_failed += 1
            return False

        data, error = self._api_request("/user")

        if error:
            print("❌ FAIL")
            print(f"   {error}")
            self.checks_failed += 1
            return False

        username = data.get("login", "unknown")
        print(f"✅ OK (authenticated as {username})")
        self.checks_passed += 1
        return True

    def check_rate_limit(self) -> bool:
        """Check GitHub API rate limits."""
        print("⏱️  Checking rate limits...", end=" ", flush=True)

        data, error = self._api_request("/rate_limit")

        if error:
            print("⚠️  WARNING")
            print(f"   Could not check rate limit: {error}")
            self.warnings.append("Rate limit check failed")
            return True  # Don't fail the check, just warn

        core = data.get("resources", {}).get("core", {})
        remaining = core.get("remaining", 0)
        limit = core.get("limit", 0)

        if remaining < 100:
            print(f"⚠️  WARNING ({remaining}/{limit} remaining)")
            self.warnings.append(f"Low rate limit: {remaining}/{limit}")
        else:
            print(f"✅ OK ({remaining}/{limit} remaining)")

        self.checks_passed += 1
        return True

    def check_repository_access(self) -> bool:
        """Verify access to the current repository."""
        print("📦 Checking repository access...", end=" ", flush=True)

        if not self.repo_info:
            print("⚠️  SKIP")
            print("   Not in a GitHub repository")
            self.warnings.append("Not in a GitHub repository")
            return True  # Not a failure, just not applicable

        owner = self.repo_info["owner"]
        repo = self.repo_info["repo"]

        data, error = self._api_request(f"/repos/{owner}/{repo}")

        if error:
            print("❌ FAIL")
            print(f"   Cannot access {owner}/{repo}: {error}")
            self.checks_failed += 1
            return False

        print(f"✅ OK ({owner}/{repo})")
        self.checks_passed += 1
        return True

    def check_repository_permissions(self) -> bool:
        """Check what permissions we have on the repository."""
        print("🔑 Checking repository permissions...", end=" ", flush=True)

        if not self.repo_info:
            print("⚠️  SKIP")
            return True

        owner = self.repo_info["owner"]
        repo = self.repo_info["repo"]

        data, error = self._api_request(f"/repos/{owner}/{repo}")

        if error:
            print("⚠️  SKIP")
            return True

        permissions = data.get("permissions", {})
        can_push = permissions.get("push", False)
        can_admin = permissions.get("admin", False)

        perms = []
        if can_admin:
            perms.append("admin")
        if can_push:
            perms.append("write")
        else:
            perms.append("read")

        if not can_push:
            print(f"⚠️  WARNING (read-only)")
            self.warnings.append("Repository is read-only")
        else:
            print(f"✅ OK ({', '.join(perms)})")

        self.checks_passed += 1
        return True

    def check_branches_access(self) -> bool:
        """Verify we can list branches."""
        print("🌿 Checking branch access...", end=" ", flush=True)

        if not self.repo_info:
            print("⚠️  SKIP")
            return True

        owner = self.repo_info["owner"]
        repo = self.repo_info["repo"]

        data, error = self._api_request(f"/repos/{owner}/{repo}/branches?per_page=1")

        if error:
            print("❌ FAIL")
            print(f"   {error}")
            self.checks_failed += 1
            return False

        print("✅ OK")
        self.checks_passed += 1
        return True

    def check_prs_access(self) -> bool:
        """Verify we can list pull requests."""
        print("🔀 Checking PR access...", end=" ", flush=True)

        if not self.repo_info:
            print("⚠️  SKIP")
            return True

        owner = self.repo_info["owner"]
        repo = self.repo_info["repo"]

        data, error = self._api_request(f"/repos/{owner}/{repo}/pulls?per_page=1&state=all")

        if error:
            print("❌ FAIL")
            print(f"   {error}")
            self.checks_failed += 1
            return False

        print("✅ OK")
        self.checks_passed += 1
        return True

    def check_issues_access(self) -> bool:
        """Verify we can list issues."""
        print("🐛 Checking issue access...", end=" ", flush=True)

        if not self.repo_info:
            print("⚠️  SKIP")
            return True

        owner = self.repo_info["owner"]
        repo = self.repo_info["repo"]

        data, error = self._api_request(f"/repos/{owner}/{repo}/issues?per_page=1&state=all")

        if error:
            print("❌ FAIL")
            print(f"   {error}")
            self.checks_failed += 1
            return False

        print("✅ OK")
        self.checks_passed += 1
        return True

    def run_all_checks(self) -> bool:
        """
        Run all health checks.

        Returns:
            True if all critical checks passed, False otherwise
        """
        print("\n🏥 GitHub Health Check\n" + "=" * 50)

        # Critical checks
        auth_ok = self.check_authentication()

        if not auth_ok:
            print("\n" + "=" * 50)
            print("❌ Critical checks failed - cannot proceed")
            return False

        # Other checks
        self.check_rate_limit()
        self.check_repository_access()
        self.check_repository_permissions()
        self.check_branches_access()
        self.check_prs_access()
        self.check_issues_access()

        # Summary
        print("\n" + "=" * 50)
        print(f"✅ Passed: {self.checks_passed}")
        print(f"❌ Failed: {self.checks_failed}")
        if self.warnings:
            print(f"⚠️  Warnings: {len(self.warnings)}")
            for warning in self.warnings:
                print(f"   - {warning}")

        if self.checks_failed == 0:
            print("\n✨ GitHub integration is healthy!")
            return True
        else:
            print(f"\n⚠️  {self.checks_failed} check(s) failed")
            return False


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Verify GitHub integration health"
    )
    parser.add_argument(
        "--token",
        help="GitHub token (default: from GITHUB_TOKEN env var or gh CLI)"
    )
    parser.add_argument(
        "--repo-path",
        default=".",
        help="Path to git repository (default: current directory)"
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Only output on failure"
    )

    args = parser.parse_args()

    checker = GitHubHealthCheck(token=args.token, repo_path=args.repo_path)
    success = checker.run_all_checks()

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
