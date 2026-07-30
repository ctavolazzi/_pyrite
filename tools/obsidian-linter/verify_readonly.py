#!/usr/bin/env python3
"""
Regression check: the linter must not write to disk unless --fix is passed.

WE-260730-0h84. `--fix` was parsed by check.py but never reached the
ObsidianLinter constructor, so the only write guard was `dry_run`. Every
invocation without --dry-run rewrote files while lint.py printed
"Mode: CHECK ONLY (read-only)".

The check builds a fixture with formatting the linter wants to change,
hashes it, runs each mode, and compares hashes. Assert-based, so a
regression exits non-zero.

    python3 tools/obsidian-linter/verify_readonly.py
"""

import hashlib
import subprocess
import sys
import tempfile
from pathlib import Path

CHECK_PY = Path(__file__).resolve().parent / "check.py"

# Trailing spaces on line 2 and no newline at end of file are exactly the two
# formatting fixes that were silently applied to three tracked files.
FIXTURE = (
    "---\n"
    "id: WE-260730-fix0\n"
    'title: "Fixture"\n'
    "status: active\n"
    "created: 2026-07-30T00:00:00.000Z\n"
    "---\n"
    "\n"
    "# Fixture\n"
    "\n"
    "Trailing spaces follow this sentence.   \n"
    "\n"
    "No newline at the end of this file"
)

checks = 0


def check(condition, label):
    global checks
    checks += 1
    assert condition, f"FAILED: {label}"
    print(f"  ok  {label}")


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(workdir, *args):
    return subprocess.run(
        [sys.executable, str(CHECK_PY), str(workdir), *args],
        capture_output=True,
        text=True,
    )


def fresh_fixture(root):
    """Write the fixture into a work effort folder shape and return its path."""
    folder = root / "_work_efforts" / "WE-260730-fix0_fixture"
    folder.mkdir(parents=True, exist_ok=True)
    target = folder / "WE-260730-fix0_index.md"
    target.write_text(FIXTURE)
    return target


with tempfile.TemporaryDirectory() as tmp:
    root = Path(tmp)

    # Control first. If --fix does not change the file, the fixture contains
    # nothing the linter wants to touch and every other result below is
    # vacuous.
    target = fresh_fixture(root)
    before = digest(target)
    run(root, "--scope", "_work_efforts", "--fix")
    after_fix = digest(target)
    check(
        after_fix != before,
        "CONTROL: --fix does rewrite the fixture, so the file is genuinely fixable",
    )

    # The regression itself: no flags must not write.
    target = fresh_fixture(root)
    before = digest(target)
    result = run(root, "--scope", "_work_efforts")
    check(
        digest(target) == before,
        "no flags leaves the file byte-identical",
    )
    check(result.returncode in (0, 1), "no-flag run still completes and reports")

    # --dry-run must not write either.
    target = fresh_fixture(root)
    before = digest(target)
    run(root, "--scope", "_work_efforts", "--dry-run")
    check(
        digest(target) == before,
        "--dry-run leaves the file byte-identical",
    )

    # --strict is a read flag and must not imply writing.
    target = fresh_fixture(root)
    before = digest(target)
    run(root, "--scope", "_work_efforts", "--strict")
    check(
        digest(target) == before,
        "--strict alone leaves the file byte-identical",
    )

print(f"\n{checks} checks passed, all assert-based")
