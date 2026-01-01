#!/usr/bin/env python3
"""
Obsidian Markdown Validator

Validates markdown files for accuracy, collisions, aliases, and potential errors:
- Duplicate IDs (collisions)
- Broken wikilinks
- Alias mismatches
- Case sensitivity issues
- File naming inconsistencies
- Orphaned files
- Missing index files
"""

import re
import argparse
from pathlib import Path
from typing import List, Dict, Set, Tuple, Optional
from collections import defaultdict
from dataclasses import dataclass


@dataclass
class ValidationIssue:
    """Represents a validation issue."""
    severity: str  # "error", "warning", "info"
    category: str
    file_path: str
    line_num: Optional[int]
    message: str
    suggestion: Optional[str] = None

    def __str__(self) -> str:
        severity_icon = {
            "error": "❌",
            "warning": "⚠️ ",
            "info": "ℹ️ "
        }
        icon = severity_icon.get(self.severity, "•")
        line_info = f":{self.line_num}" if self.line_num else ""
        msg = f"{icon} {self.file_path}{line_info} - {self.message}"
        if self.suggestion:
            msg += f"\n   💡 Suggestion: {self.suggestion}"
        return msg


class ObsidianValidator:
    """Validates Obsidian markdown files for accuracy and consistency."""

    # Regex patterns
    FRONTMATTER_PATTERN = re.compile(r'^---\s*\n(.*?)\n---\s*\n', re.DOTALL | re.MULTILINE)
    WIKILINK_PATTERN = re.compile(r'\[\[([^\]]+?)\]\]')
    TICKET_ID_PATTERN = re.compile(r'\bTKT-([a-z0-9]{4})-(\d{3})\b')
    WORK_EFFORT_ID_PATTERN = re.compile(r'\bWE-(\d{6})-([a-z0-9]{4})\b')

    def __init__(self, root_path: str = ".", scope: Optional[str] = None):
        """
        Initialize the validator.

        Args:
            root_path: Root directory to search for markdown files
            scope: Limit validation to specific directory (e.g., "_work_efforts")
        """
        self.root_path = Path(root_path).resolve()
        self.scope = scope
        self.issues: List[ValidationIssue] = []

        # Indexes
        self.markdown_files: Dict[str, Path] = {}
        self.file_by_id: Dict[str, Path] = {}  # ID -> file path
        self.id_occurrences: Dict[str, List[Tuple[Path, int]]] = defaultdict(list)  # ID -> [(file, line)]
        self.wikilink_targets: Dict[Path, Set[str]] = defaultdict(set)  # file -> set of link targets
        self.file_references: Dict[Path, Set[Path]] = defaultdict(set)  # file -> set of files that link to it

        self._index_markdown_files()
        self._index_ids()

    def _index_markdown_files(self):
        """Build an index of all markdown files."""
        search_path = self.root_path / self.scope if self.scope else self.root_path

        for md_file in search_path.rglob("*.md"):
            # Skip hidden directories and files
            if any(part.startswith('.') for part in md_file.parts):
                continue

            # Store multiple keys for lookup
            name = md_file.stem
            rel_path = md_file.relative_to(self.root_path)
            rel_path_str = str(rel_path)
            rel_path_no_ext = str(rel_path.with_suffix(''))

            self.markdown_files[name] = md_file
            self.markdown_files[rel_path_str] = md_file
            self.markdown_files[rel_path_no_ext] = md_file
            self.markdown_files[rel_path_str.replace('/', '_')] = md_file

    def _index_ids(self):
        """Index all IDs found in files."""
        for file_path, rel_path in self._get_all_files():
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
            except Exception:
                continue

            # Extract IDs from frontmatter
            match = self.FRONTMATTER_PATTERN.match(content)
            if match:
                frontmatter = match.group(1)
                # Look for id: field
                for line in frontmatter.split('\n'):
                    if ':' in line:
                        key, value = line.split(':', 1)
                        key = key.strip()
                        value = value.strip().strip('"').strip("'")
                        if key == 'id':
                            self.file_by_id[value] = file_path
                            self.id_occurrences[value].append((file_path, 1))

            # Extract IDs from content
            for match in self.TICKET_ID_PATTERN.finditer(content):
                ticket_id = match.group(0)
                line_num = content[:match.start()].count('\n') + 1
                self.id_occurrences[ticket_id].append((file_path, line_num))

            for match in self.WORK_EFFORT_ID_PATTERN.finditer(content):
                we_id = match.group(0)
                line_num = content[:match.start()].count('\n') + 1
                self.id_occurrences[we_id].append((file_path, line_num))

    def _get_all_files(self) -> List[Tuple[Path, str]]:
        """Get all markdown files with their relative paths."""
        search_path = self.root_path / self.scope if self.scope else self.root_path
        files = []

        for md_file in search_path.rglob("*.md"):
            if any(part.startswith('.') for part in md_file.parts):
                continue
            rel_path = str(md_file.relative_to(self.root_path))
            files.append((md_file, rel_path))

        return sorted(files, key=lambda x: x[1])

    def _check_duplicate_ids(self):
        """Check for duplicate IDs (collisions) - only in frontmatter, not references."""
        # Check for IDs defined in frontmatter of multiple files
        frontmatter_ids: Dict[str, List[Path]] = defaultdict(list)

        for file_path, rel_path in self._get_all_files():
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
            except Exception:
                continue

            # Extract ID from frontmatter only
            match = self.FRONTMATTER_PATTERN.match(content)
            if match:
                frontmatter = match.group(1)
                for line in frontmatter.split('\n'):
                    if ':' in line:
                        key, value = line.split(':', 1)
                        key = key.strip()
                        value = value.strip().strip('"').strip("'")
                        if key == 'id':
                            frontmatter_ids[value].append(file_path)
                            break  # Only one ID per file in frontmatter

        # Flag actual collisions (same ID in multiple files' frontmatter)
        for id_value, files in frontmatter_ids.items():
            if len(files) > 1:
                file_list = ", ".join(str(f.relative_to(self.root_path)) for f in files)
                self.issues.append(ValidationIssue(
                    severity="error",
                    category="collision",
                    file_path=str(files[0].relative_to(self.root_path)),
                    line_num=1,
                    message=f"Duplicate ID '{id_value}' defined in frontmatter of multiple files",
                    suggestion=f"Each ID must be unique. Found in: {file_list}. Ensure only one file uses this ID as its primary identifier."
                ))

    def _check_broken_wikilinks(self):
        """Check for broken wikilinks."""
        for file_path, rel_path in self._get_all_files():
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
            except Exception:
                continue

            for match in self.WIKILINK_PATTERN.finditer(content):
                link_text = match.group(1)
                line_num = content[:match.start()].count('\n') + 1

                # Handle [[page|alias]] format
                if '|' in link_text:
                    target, alias = link_text.split('|', 1)
                    target = target.strip()
                    alias = alias.strip()
                else:
                    target = link_text.strip()
                    alias = None

                # Check if target exists
                found = False
                possible_paths = [
                    target,
                    f"{target}.md",
                    f"{target}_index",
                    f"{target}_index.md",
                ]

                # Also try relative paths
                if '/' in str(file_path):
                    parent_dir = file_path.parent
                    possible_paths.extend([
                        parent_dir / target,
                        parent_dir / f"{target}.md",
                    ])

                for path_key in possible_paths:
                    if path_key in self.markdown_files:
                        found = True
                        # Track reference
                        target_file = self.markdown_files[path_key]
                        self.file_references[target_file].add(file_path)
                        self.wikilink_targets[file_path].add(target)
                        break

                if not found:
                    self.issues.append(ValidationIssue(
                        severity="warning",
                        category="broken_link",
                        file_path=rel_path,
                        line_num=line_num,
                        message=f"Broken wikilink: [[{link_text}]] - target not found",
                        suggestion=f"Check if '{target}' exists or if the path is correct. Consider creating the file or fixing the link."
                    ))

    def _check_file_naming_consistency(self):
        """Check for file naming inconsistencies."""
        for file_path, rel_path in self._get_all_files():
            file_stem = file_path.stem

            # Check work effort index files
            if file_stem.endswith("_index"):
                we_id = file_stem.replace("_index", "")
                if self.WORK_EFFORT_ID_PATTERN.match(we_id):
                    # Check if folder name matches
                    folder_name = file_path.parent.name
                    if not folder_name.startswith(we_id):
                        self.issues.append(ValidationIssue(
                            severity="warning",
                            category="naming",
                            file_path=rel_path,
                            line_num=None,
                            message=f"Index file '{file_stem}' may not match folder structure",
                            suggestion=f"Ensure folder name matches WE ID '{we_id}'"
                        ))

            # Check ticket files
            if file_stem.startswith("TKT-"):
                ticket_id = file_stem.split("_")[0]  # Get TKT-xxxx-NNN part
                # Check if ticket is in correct folder
                if "tickets" not in str(file_path.parent):
                    self.issues.append(ValidationIssue(
                        severity="info",
                        category="naming",
                        file_path=rel_path,
                        line_num=None,
                        message=f"Ticket file '{file_stem}' not in 'tickets/' folder",
                        suggestion="Consider moving ticket files to a 'tickets/' subfolder"
                    ))

    def _check_orphaned_files(self):
        """Check for files that aren't linked from anywhere."""
        all_files = set(path for path, _ in self._get_all_files())
        linked_files = set(self.file_references.keys())

        # Exclude index files and devlog from orphan check (they're entry points)
        entry_points = {"devlog.md", "README.md", "index.md", "00.00_index.md"}

        for file_path in all_files:
            if file_path in linked_files:
                continue

            file_name = file_path.name
            if any(entry in file_name for entry in entry_points):
                continue

            # Check if it's an index file (these are often entry points)
            if file_path.stem.endswith("_index") or file_path.stem.endswith("index"):
                continue

            rel_path = str(file_path.relative_to(self.root_path))
            self.issues.append(ValidationIssue(
                severity="info",
                category="orphan",
                file_path=rel_path,
                line_num=None,
                message=f"File appears to be orphaned (not linked from anywhere)",
                suggestion="Consider adding links to this file from index pages or related documents"
            ))

    def _check_case_sensitivity(self):
        """Check for case sensitivity issues in wikilinks."""
        # Build case-insensitive index
        case_index: Dict[str, List[Path]] = defaultdict(list)
        for key, path in self.markdown_files.items():
            case_key = key.lower()
            case_index[case_key].append(path)

        # Check for case conflicts
        for case_key, paths in case_index.items():
            if len(paths) > 1:
                unique_paths = set(paths)
                if len(unique_paths) > 1:
                    path_list = ", ".join(str(p.relative_to(self.root_path)) for p in unique_paths)
                    self.issues.append(ValidationIssue(
                        severity="warning",
                        category="case",
                        file_path=str(unique_paths[0].relative_to(self.root_path)),
                        line_num=None,
                        message=f"Case-sensitive collision: multiple files match '{case_key}' (case-insensitive)",
                        suggestion=f"Files: {path_list}. Ensure wikilinks use correct case."
                    ))

    def _check_missing_index_files(self):
        """Check for work effort folders missing index files."""
        search_path = self.root_path / self.scope if self.scope else self.root_path

        for item in search_path.rglob("*"):
            if not item.is_dir():
                continue

            # Check if it looks like a work effort folder
            if "WE-" in item.name:
                # Look for index file
                index_files = list(item.glob("*_index.md")) + list(item.glob("WE-*_index.md"))
                if not index_files:
                    rel_path = str(item.relative_to(self.root_path))
                    self.issues.append(ValidationIssue(
                        severity="warning",
                        category="structure",
                        file_path=rel_path,
                        line_num=None,
                        message=f"Work effort folder missing index file",
                        suggestion=f"Create an index file like '{item.name}_index.md' in this folder"
                    ))

    def validate_all(self):
        """Run all validation checks."""
        print(f"\n🔍 Obsidian Markdown Validator")
        print("=" * 60)
        print(f"Scope: {self.scope or 'entire repository'}")
        print(f"Files indexed: {len(self.markdown_files)}")
        print("=" * 60 + "\n")

        self._check_duplicate_ids()
        self._check_broken_wikilinks()
        self._check_file_naming_consistency()
        self._check_orphaned_files()
        self._check_case_sensitivity()
        self._check_missing_index_files()

        return self.issues

    def print_results(self):
        """Print validation results."""
        if not self.issues:
            print("✨ No validation issues found!")
            return

        # Group by category
        by_category: Dict[str, List[ValidationIssue]] = defaultdict(list)
        by_severity: Dict[str, List[ValidationIssue]] = defaultdict(list)

        for issue in self.issues:
            by_category[issue.category].append(issue)
            by_severity[issue.severity].append(issue)

        # Print by severity
        for severity in ["error", "warning", "info"]:
            if severity in by_severity:
                print(f"\n{severity.upper()}S ({len(by_severity[severity])}):")
                print("-" * 60)
                for issue in by_severity[severity]:
                    print(f"  {issue}")

        # Summary
        print("\n" + "=" * 60)
        print("Summary")
        print("=" * 60)
        print(f"Total issues: {len(self.issues)}")
        print(f"❌ Errors: {len(by_severity.get('error', []))}")
        print(f"⚠️  Warnings: {len(by_severity.get('warning', []))}")
        print(f"ℹ️  Info: {len(by_severity.get('info', []))}")
        print("=" * 60)

        # Category breakdown
        if len(by_category) > 1:
            print("\nBy Category:")
            for category, issues in sorted(by_category.items()):
                print(f"  {category}: {len(issues)}")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Validate Obsidian markdown files for accuracy and consistency",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Validate entire repository
  python3 tools/obsidian-linter/validate.py

  # Validate specific directory
  python3 tools/obsidian-linter/validate.py --scope _work_efforts

  # Validate docs
  python3 tools/obsidian-linter/validate.py --scope _docs
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

    args = parser.parse_args()

    validator = ObsidianValidator(
        root_path=args.path,
        scope=args.scope
    )

    issues = validator.validate_all()
    validator.print_results()

    # Exit with error code if there are errors
    error_count = sum(1 for issue in issues if issue.severity == "error")
    exit(1 if error_count > 0 else 0)


if __name__ == "__main__":
    main()

