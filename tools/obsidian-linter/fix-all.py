#!/usr/bin/env python3
"""
Comprehensive Obsidian Markdown Auto-Fixer

Fixes all fixable issues detected by the linter:
- Formatting: trailing whitespace, missing final newline
- Unlinked references: ticket/work effort IDs → wikilinks
- Heading consistency: skipped levels (warns only, doesn't auto-fix)
"""

import re
import argparse
from pathlib import Path
from typing import List, Tuple, Optional, Dict


class ObsidianFixer:
    """Fixes all fixable Obsidian markdown issues."""

    # Regex patterns
    WIKILINK_PATTERN = re.compile(r'\[\[([^\]]+?)\]\]')
    FRONTMATTER_PATTERN = re.compile(r'^---\s*\n(.*?)\n---\s*\n', re.DOTALL | re.MULTILINE)
    TRAILING_WHITESPACE_PATTERN = re.compile(r' +$', re.MULTILINE)
    TICKET_ID_PATTERN = re.compile(r'\bTKT-([a-z0-9]{4})-(\d{3})\b')
    WORK_EFFORT_ID_PATTERN = re.compile(r'\bWE-(\d{6})-([a-z0-9]{4})\b')

    def __init__(self, root_path: str = ".", scope: Optional[str] = None, dry_run: bool = False):
        """
        Initialize the fixer.

        Args:
            root_path: Root directory to search for markdown files
            scope: Limit fixing to specific directory (e.g., "_work_efforts")
            dry_run: Preview fixes without applying them
        """
        self.root_path = Path(root_path).resolve()
        self.scope = scope
        self.dry_run = dry_run
        self.stats = {
            'files_processed': 0,
            'files_fixed': 0,
            'formatting_fixes': 0,
            'links_added': 0,
            'total_changes': 0
        }

        # Build index of all markdown files for link validation
        self.markdown_files: Dict[str, Path] = {}
        self._index_markdown_files()

    def _index_markdown_files(self):
        """Build an index of all markdown files for validation."""
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

    def _fix_formatting(self, content: str) -> Tuple[str, int]:
        """
        Fix formatting issues: trailing whitespace, missing final newline.
        Returns (fixed_content, number_of_fixes).
        """
        fixed = content
        fixes = 0

        # Remove trailing whitespace
        if self.TRAILING_WHITESPACE_PATTERN.search(fixed):
            fixed = self.TRAILING_WHITESPACE_PATTERN.sub('', fixed)
            fixes += 1

        # Add final newline if missing
        if fixed and not fixed.endswith('\n'):
            fixed += '\n'
            fixes += 1

        return fixed, fixes

    def _fix_unlinked_references(self, file_path: Path, content: str) -> Tuple[str, int]:
        """
        Fix unlinked ticket/work effort references.
        Returns (fixed_content, number_of_links_added).
        """
        fixed = content
        links_added = 0
        replacements = []

        # Find all existing wikilinks to exclude them
        wikilink_ranges = []
        for match in self.WIKILINK_PATTERN.finditer(content):
            wikilink_ranges.append((match.start(), match.end()))

        # Find frontmatter range
        frontmatter_end = 0
        frontmatter_match = self.FRONTMATTER_PATTERN.match(content)
        if frontmatter_match:
            frontmatter_end = frontmatter_match.end()

        def is_inside_wikilink(pos: int) -> bool:
            return any(start <= pos < end for start, end in wikilink_ranges)

        def is_in_frontmatter(pos: int) -> bool:
            return pos < frontmatter_end

        # Get the file's own ID to skip self-references
        file_stem = file_path.stem
        own_ticket_id = None
        own_we_id = None

        if file_stem.startswith("TKT-"):
            own_ticket_id = file_stem.split("_")[0]
        elif file_stem.endswith("_index") or "WE-" in file_stem:
            we_match = self.WORK_EFFORT_ID_PATTERN.search(str(file_path))
            if we_match:
                own_we_id = we_match.group(0)

        # Fix ticket IDs
        for match in self.TICKET_ID_PATTERN.finditer(content):
            if is_inside_wikilink(match.start()):
                continue
            if is_in_frontmatter(match.start()):
                continue

            ticket_id = match.group(0)

            if own_ticket_id and ticket_id == own_ticket_id:
                continue

            # Check if ticket file exists
            found = False
            for file_key, indexed_path in self.markdown_files.items():
                if indexed_path.stem.startswith(ticket_id) or file_key.startswith(ticket_id):
                    found = True
                    break

            if found:
                replacements.append((match.start(), match.end(), f"[[{ticket_id}]]"))
                links_added += 1

        # Fix work effort IDs
        for match in self.WORK_EFFORT_ID_PATTERN.finditer(content):
            if is_inside_wikilink(match.start()):
                continue
            if is_in_frontmatter(match.start()):
                continue

            we_id = match.group(0)

            if own_we_id and we_id == own_we_id:
                continue

            # Check if work effort file exists
            found = False
            for file_key, indexed_path in self.markdown_files.items():
                if we_id in file_key or indexed_path.stem.startswith(we_id):
                    found = True
                    break

            if found:
                replacements.append((match.start(), match.end(), f"[[{we_id}]]"))
                links_added += 1

        # Apply replacements in reverse order to preserve positions
        if replacements:
            for start, end, replacement in sorted(replacements, reverse=True):
                fixed = fixed[:start] + replacement + fixed[end:]

        return fixed, links_added

    def _fix_file(self, file_path: Path) -> Tuple[bool, Dict[str, int]]:
        """
        Fix all issues in a single file.
        Returns (was_modified, fix_stats).
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"❌ Error reading {file_path}: {e}")
            return False, {}

        original_content = content
        fix_stats = {
            'formatting': 0,
            'links': 0
        }

        # Fix formatting
        content, formatting_fixes = self._fix_formatting(content)
        fix_stats['formatting'] = formatting_fixes

        # Fix unlinked references
        content, links_added = self._fix_unlinked_references(file_path, content)
        fix_stats['links'] = links_added

        # Apply fixes if file was modified
        if content != original_content:
            if not self.dry_run:
                try:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                except Exception as e:
                    print(f"❌ Error writing {file_path}: {e}")
                    return False, {}

            return True, fix_stats

        return False, fix_stats

    def fix_all(self):
        """Fix all markdown files in scope."""
        files = self._find_markdown_files()

        print(f"\n🔧 Obsidian Markdown Auto-Fixer")
        print("=" * 60)
        print(f"Scope: {self.scope or 'entire repository'}")
        print(f"Files found: {len(files)}")
        if self.dry_run:
            print("Mode: DRY RUN (no changes will be made)")
        print("=" * 60 + "\n")

        for file_path in files:
            self.stats['files_processed'] += 1
            was_modified, fix_stats = self._fix_file(file_path)

            if was_modified or fix_stats['formatting'] > 0 or fix_stats['links'] > 0:
                rel_path = str(file_path.relative_to(self.root_path))
                action = "Would fix" if self.dry_run else "Fixed"

                changes = []
                if fix_stats['formatting'] > 0:
                    changes.append(f"{fix_stats['formatting']} formatting")
                if fix_stats['links'] > 0:
                    changes.append(f"{fix_stats['links']} links")

                change_str = ", ".join(changes) if changes else "no changes"
                print(f"✅ {action}: {rel_path} ({change_str})")

                if was_modified:
                    self.stats['files_fixed'] += 1
                self.stats['formatting_fixes'] += fix_stats['formatting']
                self.stats['links_added'] += fix_stats['links']
                self.stats['total_changes'] += fix_stats['formatting'] + fix_stats['links']

        print("\n" + "=" * 60)
        print("Summary")
        print("=" * 60)
        print(f"Files processed: {self.stats['files_processed']}")
        print(f"Files {'would be ' if self.dry_run else ''}fixed: {self.stats['files_fixed']}")
        print(f"Formatting fixes: {self.stats['formatting_fixes']}")
        print(f"Links added: {self.stats['links_added']}")
        print(f"Total changes: {self.stats['total_changes']}")
        print("=" * 60)

        if self.dry_run and self.stats['files_fixed'] > 0:
            print("\n💡 Run without --dry-run to apply fixes")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Auto-fix all Obsidian markdown issues",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Preview fixes (dry run)
  python3 tools/obsidian-linter/fix-all.py --scope _work_efforts --dry-run

  # Apply all fixes
  python3 tools/obsidian-linter/fix-all.py --scope _work_efforts

  # Fix entire repository
  python3 tools/obsidian-linter/fix-all.py

  # Fix specific directory
  python3 tools/obsidian-linter/fix-all.py --scope _docs
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
        "--dry-run",
        action="store_true",
        help="Preview fixes without applying them"
    )

    args = parser.parse_args()

    fixer = ObsidianFixer(
        root_path=args.path,
        scope=args.scope,
        dry_run=args.dry_run
    )

    fixer.fix_all()


if __name__ == "__main__":
    main()

