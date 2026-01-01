#!/usr/bin/env python3
"""
Obsidian Markdown Linter

Validates Obsidian-flavored markdown files for syntax and consistency.
Checks frontmatter, wikilinks, and basic formatting.
"""

import os
import sys
import re
import argparse
from pathlib import Path
from typing import List, Dict, Tuple, Optional, Set
from dataclasses import dataclass, field


@dataclass
class LintIssue:
    """Represents a linting issue found in a file."""
    file_path: str
    line_num: Optional[int]
    severity: str  # "error", "warning", "info"
    category: str  # "frontmatter", "wikilink", "formatting"
    message: str
    fix_available: bool = False

    def __str__(self) -> str:
        severity_icon = {
            "error": "❌",
            "warning": "⚠️ ",
            "info": "ℹ️ "
        }
        icon = severity_icon.get(self.severity, "•")
        line_info = f":{self.line_num}" if self.line_num else ""
        return f"{icon} {self.file_path}{line_info} - {self.message}"


@dataclass
class LintStats:
    """Statistics from linting run."""
    files_checked: int = 0
    files_with_issues: int = 0
    errors: int = 0
    warnings: int = 0
    infos: int = 0
    fixes_applied: int = 0
    issues: List[LintIssue] = field(default_factory=list)


class ObsidianLinter:
    """Lints Obsidian-flavored markdown files."""

    # Regex patterns
    FRONTMATTER_PATTERN = re.compile(r'^---\s*\n(.*?)\n---\s*\n', re.DOTALL | re.MULTILINE)
    WIKILINK_PATTERN = re.compile(r'\[\[([^\]]+?)\]\]')
    HEADING_PATTERN = re.compile(r'^(#{1,6})\s+(.+)$', re.MULTILINE)
    TRAILING_WHITESPACE_PATTERN = re.compile(r' +$', re.MULTILINE)
    # Patterns for ticket/work effort IDs that should be linked
    TICKET_ID_PATTERN = re.compile(r'\bTKT-([a-z0-9]{4})-(\d{3})\b')
    WORK_EFFORT_ID_PATTERN = re.compile(r'\bWE-(\d{6})-([a-z0-9]{4})\b')
    # Task list patterns
    TASK_LIST_PATTERN = re.compile(r'^(\s*)- \[([ xX])\](.*)$', re.MULTILINE)
    CODE_FENCE_PATTERN = re.compile(r'^```', re.MULTILINE)

    # Required frontmatter fields (warnings only)
    STANDARD_FRONTMATTER_FIELDS = {'id', 'title', 'status', 'created'}

    def __init__(self, root_path: str = ".", scope: Optional[str] = None,
                 strict: bool = False, dry_run: bool = False):
        """
        Initialize the linter.

        Args:
            root_path: Root directory to search for markdown files
            scope: Limit checking to specific directory (e.g., "_work_efforts")
            strict: Enable stricter checking
            dry_run: Preview fixes without applying them
        """
        self.root_path = Path(root_path).resolve()
        self.scope = scope
        self.strict = strict
        self.dry_run = dry_run
        self.stats = LintStats()

        # Build index of all markdown files for wikilink resolution
        self.markdown_files: Dict[str, Path] = {}
        self._index_markdown_files()

    def _index_markdown_files(self):
        """Build an index of all markdown files for wikilink validation."""
        search_path = self.root_path / self.scope if self.scope else self.root_path

        for md_file in search_path.rglob("*.md"):
            # Skip hidden directories and files
            if any(part.startswith('.') for part in md_file.parts):
                continue

            # Store both with and without .md extension
            name = md_file.stem
            rel_path = md_file.relative_to(self.root_path)

            self.markdown_files[name] = md_file
            self.markdown_files[str(rel_path)] = md_file
            self.markdown_files[str(rel_path.with_suffix(''))] = md_file

    def _find_markdown_files(self) -> List[Path]:
        """Find all markdown files in scope."""
        search_path = self.root_path / self.scope if self.scope else self.root_path
        files = []

        for md_file in search_path.rglob("*.md"):
            # Skip hidden directories and files
            if any(part.startswith('.') for part in md_file.parts):
                continue
            files.append(md_file)

        return sorted(files)

    def _check_frontmatter(self, file_path: Path, content: str) -> List[LintIssue]:
        """Check YAML frontmatter validity and structure."""
        issues = []
        rel_path = str(file_path.relative_to(self.root_path))

        # Check if file starts with frontmatter
        if not content.startswith('---\n'):
            if self.strict:
                issues.append(LintIssue(
                    file_path=rel_path,
                    line_num=1,
                    severity="warning",
                    category="frontmatter",
                    message="No YAML frontmatter found"
                ))
            return issues

        # Extract frontmatter
        match = self.FRONTMATTER_PATTERN.match(content)
        if not match:
            issues.append(LintIssue(
                file_path=rel_path,
                line_num=1,
                severity="error",
                category="frontmatter",
                message="Malformed frontmatter (missing closing ---)"
            ))
            return issues

        frontmatter_text = match.group(1)

        # Parse YAML manually (stdlib only - no yaml module)
        try:
            fields = self._parse_simple_yaml(frontmatter_text)
        except ValueError as e:
            issues.append(LintIssue(
                file_path=rel_path,
                line_num=1,
                severity="error",
                category="frontmatter",
                message=f"Invalid YAML syntax: {e}"
            ))
            return issues

        # Check for standard fields
        missing_fields = self.STANDARD_FRONTMATTER_FIELDS - fields.keys()
        if missing_fields:
            issues.append(LintIssue(
                file_path=rel_path,
                line_num=1,
                severity="warning",
                category="frontmatter",
                message=f"Missing standard fields: {', '.join(sorted(missing_fields))}"
            ))

        # Validate ID format
        if 'id' in fields:
            id_value = fields['id']
            file_stem = file_path.stem
            
            # Check if ID matches file naming pattern
            if file_stem.startswith('WE-') or file_stem.endswith('_index'):
                # Work effort ID: WE-YYMMDD-xxxx
                if not re.match(r'^WE-\d{6}-[a-z0-9]{4}$', id_value):
                    issues.append(LintIssue(
                        file_path=rel_path,
                        line_num=1,
                        severity="error",
                        category="frontmatter",
                        message=f"Invalid work effort ID format: {id_value} (expected WE-YYMMDD-xxxx)"
                    ))
            elif file_stem.startswith('TKT-'):
                # Ticket ID: TKT-xxxx-NNN
                if not re.match(r'^TKT-[a-z0-9]{4}-\d{3}$', id_value):
                    issues.append(LintIssue(
                        file_path=rel_path,
                        line_num=1,
                        severity="error",
                        category="frontmatter",
                        message=f"Invalid ticket ID format: {id_value} (expected TKT-xxxx-NNN)"
                    ))

        # Validate status values
        if 'status' in fields:
            status = fields['status'].lower()
            file_stem = file_path.stem
            
            if file_stem.startswith('WE-') or file_stem.endswith('_index'):
                valid_statuses = {'active', 'paused', 'completed'}
                if status not in valid_statuses:
                    issues.append(LintIssue(
                        file_path=rel_path,
                        line_num=1,
                        severity="warning",
                        category="frontmatter",
                        message=f"Invalid work effort status: {status} (expected: {', '.join(sorted(valid_statuses))})"
                    ))
            elif file_stem.startswith('TKT-'):
                valid_statuses = {'pending', 'in_progress', 'completed', 'blocked'}
                if status not in valid_statuses:
                    issues.append(LintIssue(
                        file_path=rel_path,
                        line_num=1,
                        severity="warning",
                        category="frontmatter",
                        message=f"Invalid ticket status: {status} (expected: {', '.join(sorted(valid_statuses))})"
                    ))

        # Validate date formats
        if 'created' in fields:
            created = fields['created']
            # Check ISO 8601 format (basic validation)
            if not re.match(r'^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$', created):
                issues.append(LintIssue(
                    file_path=rel_path,
                    line_num=1,
                    severity="warning",
                    category="frontmatter",
                    message=f"Invalid date format: {created} (expected ISO 8601: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)"
                ))

        # Validate ticket parent relationship
        if file_stem.startswith('TKT-') and 'parent' in fields:
            parent_id = fields['parent']
            # Check if parent ID format is valid
            if not re.match(r'^WE-\d{6}-[a-z0-9]{4}$', parent_id):
                issues.append(LintIssue(
                    file_path=rel_path,
                    line_num=1,
                    severity="error",
                    category="frontmatter",
                    message=f"Invalid parent ID format: {parent_id} (expected WE-YYMMDD-xxxx)"
                ))
            else:
                # Check if parent work effort exists
                parent_found = False
                for file_key, indexed_path in self.markdown_files.items():
                    if parent_id in file_key or indexed_path.stem.startswith(parent_id):
                        parent_found = True
                        break
                
                if not parent_found:
                    issues.append(LintIssue(
                        file_path=rel_path,
                        line_num=1,
                        severity="warning",
                        category="frontmatter",
                        message=f"Parent work effort not found: {parent_id}"
                    ))

        # Validate ID matches filename pattern
        if 'id' in fields:
            id_value = fields['id']
            if file_stem.startswith('WE-') or file_stem.endswith('_index'):
                # Check if ID matches folder/file name
                expected_prefix = id_value.replace('WE-', 'WE-')
                if not file_stem.startswith(expected_prefix) and not str(file_path.parent).endswith(id_value):
                    issues.append(LintIssue(
                        file_path=rel_path,
                        line_num=1,
                        severity="info",
                        category="frontmatter",
                        message=f"ID '{id_value}' may not match file/folder naming pattern"
                    ))
            elif file_stem.startswith('TKT-'):
                # Check if ticket ID matches parent work effort suffix
                ticket_suffix = id_value.split('-')[1]  # TKT-xxxx-NNN -> xxxx
                if 'parent' in fields:
                    parent_suffix = fields['parent'].split('-')[-1]  # WE-YYMMDD-xxxx -> xxxx
                    if ticket_suffix != parent_suffix:
                        issues.append(LintIssue(
                            file_path=rel_path,
                            line_num=1,
                            severity="warning",
                            category="frontmatter",
                            message=f"Ticket ID suffix '{ticket_suffix}' doesn't match parent work effort suffix '{parent_suffix}'"
                        ))

        return issues

    def _parse_simple_yaml(self, yaml_text: str) -> Dict[str, str]:
        """
        Parse simple YAML (key: value pairs).
        Not a full YAML parser - just enough for frontmatter.
        """
        fields = {}
        for line in yaml_text.split('\n'):
            line = line.strip()
            if not line or line.startswith('#'):
                continue

            if ':' in line:
                key, value = line.split(':', 1)
                key = key.strip()
                value = value.strip()

                # Remove quotes if present
                if value.startswith('"') and value.endswith('"'):
                    value = value[1:-1]
                elif value.startswith("'") and value.endswith("'"):
                    value = value[1:-1]

                fields[key] = value

        return fields

    def _check_wikilinks(self, file_path: Path, content: str) -> List[LintIssue]:
        """Check wikilink syntax and validate targets exist."""
        issues = []
        rel_path = str(file_path.relative_to(self.root_path))

        # Find all wikilinks
        for match in self.WIKILINK_PATTERN.finditer(content):
            link_text = match.group(1)

            # Handle [[page|alias]] format
            if '|' in link_text:
                target, alias = link_text.split('|', 1)
            else:
                target = link_text

            target = target.strip()

            # Check if target exists in our index
            if target not in self.markdown_files:
                # Calculate line number
                line_num = content[:match.start()].count('\n') + 1

                issues.append(LintIssue(
                    file_path=rel_path,
                    line_num=line_num,
                    severity="warning",
                    category="wikilink",
                    message=f"Broken wikilink: [[{link_text}]] - target not found"
                ))

        return issues

    def _check_unlinked_references(self, file_path: Path, content: str) -> List[LintIssue]:
        """
        Check for ticket/work effort IDs that should be wikilinks but aren't.
        Finds patterns like TKT-xxxx-NNN or WE-YYMMDD-xxxx that exist as files
        but aren't linked in the text.
        """
        issues = []
        rel_path = str(file_path.relative_to(self.root_path))

        # Find all existing wikilinks to exclude them from checking
        wikilink_ranges = []
        for match in self.WIKILINK_PATTERN.finditer(content):
            wikilink_ranges.append((match.start(), match.end()))

        # Find frontmatter range to exclude IDs in frontmatter
        frontmatter_end = 0
        frontmatter_match = self.FRONTMATTER_PATTERN.match(content)
        if frontmatter_match:
            frontmatter_end = frontmatter_match.end()

        def is_inside_wikilink(pos: int) -> bool:
            """Check if position is inside any wikilink."""
            return any(start <= pos < end for start, end in wikilink_ranges)

        def is_in_frontmatter(pos: int) -> bool:
            """Check if position is in frontmatter."""
            return pos < frontmatter_end

        # Get the file's own ID to skip self-references
        file_stem = file_path.stem
        own_ticket_id = None
        own_we_id = None

        # Check if this file is a ticket or work effort index
        if file_stem.startswith("TKT-"):
            own_ticket_id = file_stem.split("_")[0]  # Get TKT-xxxx-NNN part
        elif file_stem.endswith("_index") or "WE-" in file_stem:
            # Try to extract WE ID from filename or folder
            we_match = self.WORK_EFFORT_ID_PATTERN.search(str(file_path))
            if we_match:
                own_we_id = we_match.group(0)

        # Check for ticket IDs (TKT-xxxx-NNN)
        for match in self.TICKET_ID_PATTERN.finditer(content):
            if is_inside_wikilink(match.start()):
                continue  # Already linked
            if is_in_frontmatter(match.start()):
                continue  # Skip frontmatter (ID field, parent field, etc.)

            ticket_id = match.group(0)  # Full match like "TKT-25qq-001"

            # Skip if this is the file's own ticket ID
            if own_ticket_id and ticket_id == own_ticket_id:
                continue

            # Look for ticket file - files are named like TKT-xxxx-NNN_title.md
            # Check if any markdown file starts with this ticket ID
            found = False
            for file_key, file_path in self.markdown_files.items():
                # Check if file stem starts with ticket ID
                if file_path.stem.startswith(ticket_id):
                    found = True
                    break
                # Also check if the key itself matches
                if file_key.startswith(ticket_id):
                    found = True
                    break

            if found:
                line_num = content[:match.start()].count('\n') + 1
                issues.append(LintIssue(
                    file_path=rel_path,
                    line_num=line_num,
                    severity="info",
                    category="wikilink",
                    message=f"Unlinked ticket reference: {ticket_id} (should be [[{ticket_id}]] or [[{ticket_id}|...]])"
                ))

        # Check for work effort IDs (WE-YYMMDD-xxxx)
        for match in self.WORK_EFFORT_ID_PATTERN.finditer(content):
            if is_inside_wikilink(match.start()):
                continue  # Already linked
            if is_in_frontmatter(match.start()):
                continue  # Skip frontmatter (ID field, parent field, etc.)

            we_id = match.group(0)  # Full match like "WE-251231-25qq"

            # Skip if this is the file's own work effort ID
            if own_we_id and we_id == own_we_id:
                continue

            # Check if work effort file exists
            # Try multiple possible names
            possible_paths = [
                we_id,  # Just the ID
                f"{we_id}_index",  # With _index suffix
                f"{we_id}/{we_id}_index",  # In folder
                f"{we_id}/{we_id}_index.md",  # With extension
            ]

            found = False
            for path_key in possible_paths:
                if path_key in self.markdown_files:
                    found = True
                    break

            if found:
                line_num = content[:match.start()].count('\n') + 1
                issues.append(LintIssue(
                    file_path=rel_path,
                    line_num=line_num,
                    severity="info",
                    category="wikilink",
                    message=f"Unlinked work effort reference: {we_id} (should be [[{we_id}]] or [[{we_id}_index|...]])"
                ))

        return issues

    def _check_task_lists(self, file_path: Path, content: str) -> List[LintIssue]:
        """Check task list syntax and consistency."""
        issues = []
        rel_path = str(file_path.relative_to(self.root_path))

        # Find code fence ranges to skip task lists in code blocks
        code_fence_positions = [m.start() for m in self.CODE_FENCE_PATTERN.finditer(content)]
        code_ranges = []
        for i in range(0, len(code_fence_positions) - 1, 2):
            code_ranges.append((code_fence_positions[i], code_fence_positions[i + 1]))

        def is_in_code_block(pos: int) -> bool:
            """Check if position is inside a code block."""
            return any(start <= pos <= end for start, end in code_ranges)

        # Track checkbox styles for consistency checking
        checkbox_styles = set()

        # Find all task lists
        for match in self.TASK_LIST_PATTERN.finditer(content):
            # Skip if in code block
            if is_in_code_block(match.start()):
                continue

            indent = match.group(1)
            checkbox = match.group(2)
            text_after = match.group(3)
            line_num = content[:match.start()].count('\n') + 1

            # Track checkbox style (x vs X)
            if checkbox in ('x', 'X'):
                checkbox_styles.add(checkbox)

            # Check for uppercase X (should be lowercase)
            if checkbox == 'X':
                issues.append(LintIssue(
                    file_path=rel_path,
                    line_num=line_num,
                    severity="info",
                    category="task_list",
                    message="Task list uses uppercase [X], lowercase [x] is recommended",
                    fix_available=True
                ))

            # Check for missing space after checkbox
            if text_after and not text_after.startswith(' '):
                issues.append(LintIssue(
                    file_path=rel_path,
                    line_num=line_num,
                    severity="info",
                    category="task_list",
                    message="Task list missing space after checkbox",
                    fix_available=True
                ))

        # Warn on mixed checkbox styles if both X and x are used
        if len(checkbox_styles) > 1:
            issues.append(LintIssue(
                file_path=rel_path,
                line_num=None,
                severity="info",
                category="task_list",
                message=f"Inconsistent checkbox styles: both {' and '.join(checkbox_styles)} used"
            ))

        return issues

    def _check_formatting(self, file_path: Path, content: str,
                         original_content: str) -> Tuple[List[LintIssue], Optional[str]]:
        """
        Check basic formatting issues.
        Returns (issues, fixed_content) where fixed_content is None if no fixes.
        """
        issues = []
        rel_path = str(file_path.relative_to(self.root_path))
        fixed_content = content
        has_fixes = False

        # Check trailing whitespace
        trailing_ws_lines = []
        for i, line in enumerate(content.split('\n'), 1):
            if line.endswith(' ') or line.endswith('\t'):
                trailing_ws_lines.append(i)

        if trailing_ws_lines:
            issues.append(LintIssue(
                file_path=rel_path,
                line_num=trailing_ws_lines[0],
                severity="info",
                category="formatting",
                message=f"Trailing whitespace on {len(trailing_ws_lines)} line(s)",
                fix_available=True
            ))
            # Fix: remove trailing whitespace
            fixed_content = self.TRAILING_WHITESPACE_PATTERN.sub('', fixed_content)
            has_fixes = True

        # Check final newline
        if not content.endswith('\n'):
            issues.append(LintIssue(
                file_path=rel_path,
                line_num=None,
                severity="info",
                category="formatting",
                message="Missing final newline",
                fix_available=True
            ))
            fixed_content += '\n'
            has_fixes = True

        # Check heading consistency
        headings = self.HEADING_PATTERN.findall(content)
        if headings:
            prev_level = 0
            for i, (hashes, text) in enumerate(headings, 1):
                level = len(hashes)

                # Check for skipped levels (e.g., # then ###)
                if prev_level > 0 and level > prev_level + 1:
                    # Find line number
                    pattern = re.escape(hashes + ' ' + text)
                    match = re.search(pattern, content)
                    line_num = content[:match.start()].count('\n') + 1 if match else None

                    issues.append(LintIssue(
                        file_path=rel_path,
                        line_num=line_num,
                        severity="warning",
                        category="formatting",
                        message=f"Heading level skipped: {prev_level} -> {level}"
                    ))

                prev_level = level

            # Check for multiple H1s
            h1_count = sum(1 for h, _ in headings if len(h) == 1)
            if h1_count > 1:
                issues.append(LintIssue(
                    file_path=rel_path,
                    line_num=None,
                    severity="warning",
                    category="formatting",
                    message=f"Multiple H1 headings ({h1_count}) - should have only one"
                ))

        return issues, (fixed_content if has_fixes else None)

    def lint_file(self, file_path: Path) -> List[LintIssue]:
        """Lint a single markdown file."""
        issues = []

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                original_content = f.read()
                content = original_content
        except Exception as e:
            rel_path = str(file_path.relative_to(self.root_path))
            issues.append(LintIssue(
                file_path=rel_path,
                line_num=None,
                severity="error",
                category="file",
                message=f"Cannot read file: {e}"
            ))
            return issues

        # Run all checks
        issues.extend(self._check_frontmatter(file_path, content))
        issues.extend(self._check_wikilinks(file_path, content))
        issues.extend(self._check_unlinked_references(file_path, content))
        issues.extend(self._check_task_lists(file_path, content))

        formatting_issues, fixed_content = self._check_formatting(
            file_path, content, original_content
        )
        issues.extend(formatting_issues)

        # Apply fixes if requested and available
        if fixed_content and not self.dry_run:
            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(fixed_content)
                self.stats.fixes_applied += sum(
                    1 for issue in formatting_issues if issue.fix_available
                )
            except Exception as e:
                rel_path = str(file_path.relative_to(self.root_path))
                issues.append(LintIssue(
                    file_path=rel_path,
                    line_num=None,
                    severity="error",
                    category="file",
                    message=f"Cannot write fixes: {e}"
                ))

        return issues

    def lint_all(self) -> LintStats:
        """Lint all markdown files in scope."""
        files = self._find_markdown_files()

        print(f"\n📝 Obsidian Markdown Linter")
        print("=" * 50)
        print(f"Scope: {self.scope or 'entire repository'}")
        print(f"Files found: {len(files)}")
        if self.dry_run:
            print("Mode: DRY RUN (no changes will be made)")
        print("=" * 50 + "\n")

        files_with_issues_set: Set[str] = set()

        for file_path in files:
            self.stats.files_checked += 1
            issues = self.lint_file(file_path)

            if issues:
                rel_path = str(file_path.relative_to(self.root_path))
                files_with_issues_set.add(rel_path)

                for issue in issues:
                    self.stats.issues.append(issue)

                    if issue.severity == "error":
                        self.stats.errors += 1
                    elif issue.severity == "warning":
                        self.stats.warnings += 1
                    else:
                        self.stats.infos += 1

        self.stats.files_with_issues = len(files_with_issues_set)

        return self.stats

    def print_results(self):
        """Print linting results."""
        stats = self.stats

        # Print issues grouped by file
        if stats.issues:
            print("Issues found:\n")

            issues_by_file: Dict[str, List[LintIssue]] = {}
            for issue in stats.issues:
                if issue.file_path not in issues_by_file:
                    issues_by_file[issue.file_path] = []
                issues_by_file[issue.file_path].append(issue)

            for file_path in sorted(issues_by_file.keys()):
                print(f"\n📄 {file_path}")
                for issue in issues_by_file[file_path]:
                    line_info = f"  Line {issue.line_num}: " if issue.line_num else "  "
                    print(f"  {line_info}{issue.message}")

        # Print summary
        print("\n" + "=" * 50)
        print(f"Files checked: {stats.files_checked}")
        print(f"Files with issues: {stats.files_with_issues}")
        print(f"❌ Errors: {stats.errors}")
        print(f"⚠️  Warnings: {stats.warnings}")
        print(f"ℹ️  Info: {stats.infos}")

        if stats.fixes_applied > 0:
            print(f"✅ Fixes applied: {stats.fixes_applied}")

        print("=" * 50)

        if stats.errors == 0 and stats.warnings == 0:
            print("\n✨ All markdown files look good!")
        elif stats.errors == 0:
            print(f"\n⚠️  {stats.warnings} warning(s) found")
        else:
            print(f"\n❌ {stats.errors} error(s) found")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Lint Obsidian-flavored markdown files",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Lint entire repository
  python3 tools/obsidian-linter/check.py

  # Lint specific directory
  python3 tools/obsidian-linter/check.py --scope _work_efforts

  # Preview fixes without applying
  python3 tools/obsidian-linter/check.py --dry-run

  # Apply fixes automatically
  python3 tools/obsidian-linter/check.py --fix

  # Strict mode with all checks
  python3 tools/obsidian-linter/check.py --strict
        """
    )

    parser.add_argument(
        "path",
        nargs="?",
        default=".",
        help="Root path to check (default: current directory)"
    )
    parser.add_argument(
        "--scope",
        help="Limit to specific directory (e.g., '_work_efforts', '_docs')"
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Enable stricter checking"
    )
    parser.add_argument(
        "--fix",
        action="store_true",
        help="Automatically fix issues (safe fixes only)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview fixes without applying (implies --fix)"
    )

    args = parser.parse_args()

    # If dry-run is specified, treat it as --fix but don't apply
    if args.dry_run:
        args.fix = True

    # Create linter
    linter = ObsidianLinter(
        root_path=args.path,
        scope=args.scope,
        strict=args.strict,
        dry_run=args.dry_run
    )

    # Run linting
    stats = linter.lint_all()
    linter.print_results()

    # Exit with appropriate code
    sys.exit(1 if stats.errors > 0 else 0)


if __name__ == "__main__":
    main()
