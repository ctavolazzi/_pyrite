#!/usr/bin/env python3
"""
Auto-fix unlinked ticket and work effort references in Obsidian markdown files.

Converts unlinked IDs like TKT-xxxx-NNN and WE-YYMMDD-xxxx to wikilinks [[...]].
"""

import re
import argparse
from pathlib import Path
from typing import List, Tuple, Optional


class LinkFixer:
    """Fixes unlinked ticket and work effort references."""

    # Patterns for ticket/work effort IDs
    TICKET_ID_PATTERN = re.compile(r'\bTKT-([a-z0-9]{4})-(\d{3})\b')
    WORK_EFFORT_ID_PATTERN = re.compile(r'\bWE-(\d{6})-([a-z0-9]{4})\b')
    WIKILINK_PATTERN = re.compile(r'\[\[([^\]]+?)\]\]')
    FRONTMATTER_PATTERN = re.compile(r'^---\s*\n(.*?)\n---\s*\n', re.DOTALL | re.MULTILINE)

    def __init__(self, root_path: str = ".", scope: Optional[str] = None, dry_run: bool = False):
        """
        Initialize the link fixer.

        Args:
            root_path: Root directory to search for markdown files
            scope: Limit fixing to specific directory (e.g., "_work_efforts")
            dry_run: Preview fixes without applying them
        """
        self.root_path = Path(root_path).resolve()
        self.scope = scope
        self.dry_run = dry_run
        self.files_fixed = 0
        self.links_added = 0

        # Build index of all markdown files for validation
        self.markdown_files: dict = {}
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

    def _is_in_table(self, pos: int, content: str) -> bool:
        """Check if position is inside a markdown table."""
        # Find the line containing this position
        lines = content[:pos].split('\n')
        if not lines:
            return False
        
        current_line = lines[-1]
        # Check if we're in a table (has | characters and not a header separator)
        if '|' in current_line and not current_line.strip().startswith('|') and '---' not in current_line:
            # Check if there's a table header above
            for i in range(len(lines) - 1, max(0, len(lines) - 10), -1):
                if '|' in lines[i] and '---' in lines[i]:
                    return True
        return False

    def _fix_file(self, file_path: Path) -> Tuple[bool, int]:
        """
        Fix unlinked references in a single file.
        Returns (was_modified, links_added_count).
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"❌ Error reading {file_path}: {e}")
            return False, 0

        original_content = content
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
            """Check if position is inside any wikilink."""
            return any(start <= pos < end for start, end in wikilink_ranges)

        def is_in_frontmatter(pos: int) -> bool:
            """Check if position is in frontmatter."""
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

        # Fix ticket IDs (both unlinked and broken links)
        for match in self.TICKET_ID_PATTERN.finditer(content):
            if is_in_frontmatter(match.start()):
                continue

            ticket_id = match.group(0)
            match_start = match.start()
            match_end = match.end()

            if own_ticket_id and ticket_id == own_ticket_id:
                continue

            # Check if we're inside a wikilink
            inside_wikilink = is_inside_wikilink(match_start)

            # Find the ticket file
            found_file = None
            for file_key, indexed_path in self.markdown_files.items():
                if indexed_path.stem.startswith(ticket_id) or file_key.startswith(ticket_id):
                    found_file = indexed_path
                    break

            if found_file:
                full_name = found_file.stem
                in_table = self._is_in_table(match_start, content)

                if inside_wikilink:
                    # We're inside a wikilink - check if it needs fixing
                    # Find the wikilink range
                    for wl_start, wl_end in wikilink_ranges:
                        if wl_start <= match_start < wl_end:
                            # Extract the current link text
                            link_text = content[wl_start+2:wl_end-2]  # Remove [[ and ]]

                            # Check if it's just the ID (needs alias) or already has alias
                            if link_text == ticket_id:
                                # Broken link - use full filename only in tables, alias elsewhere
                                if in_table:
                                    replacements.append((wl_start, wl_end, f"[[{full_name}]]"))
                                else:
                                    replacements.append((wl_start, wl_end, f"[[{full_name}|{ticket_id}]]"))
                            elif link_text.startswith(ticket_id + "_") and "|" not in link_text:
                                # Has full filename but no alias - add alias only if not in table
                                if not in_table:
                                    replacements.append((wl_start, wl_end, f"[[{link_text}|{ticket_id}]]"))
                            break
                else:
                    # Not linked - use full filename only in tables, alias elsewhere
                    if in_table:
                        replacements.append((match_start, match_end, f"[[{full_name}]]"))
                    else:
                        replacements.append((match_start, match_end, f"[[{full_name}|{ticket_id}]]"))

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

        # Apply replacements in reverse order to preserve positions
        if replacements:
            fixed_content = content
            for start, end, replacement in sorted(replacements, reverse=True):
                fixed_content = fixed_content[:start] + replacement + fixed_content[end:]

            if fixed_content != original_content:
                if not self.dry_run:
                    try:
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(fixed_content)
                    except Exception as e:
                        print(f"❌ Error writing {file_path}: {e}")
                        return False, 0

                return True, len(replacements)

        return False, 0

    def fix_all(self):
        """Fix all markdown files in scope."""
        files = self._find_markdown_files()

        print(f"\n🔧 Obsidian Link Fixer")
        print("=" * 50)
        print(f"Scope: {self.scope or 'entire repository'}")
        print(f"Files found: {len(files)}")
        if self.dry_run:
            print("Mode: DRY RUN (no changes will be made)")
        print("=" * 50 + "\n")

        for file_path in files:
            was_modified, links_added = self._fix_file(file_path)
            if was_modified:
                self.files_fixed += 1
                self.links_added += links_added
                rel_path = str(file_path.relative_to(self.root_path))
                action = "Would fix" if self.dry_run else "Fixed"
                print(f"✅ {action}: {rel_path} (+{links_added} links)")

        print("\n" + "=" * 50)
        print(f"Files processed: {len(files)}")
        print(f"Files {'would be ' if self.dry_run else ''}fixed: {self.files_fixed}")
        print(f"Links {'would be ' if self.dry_run else ''}added: {self.links_added}")
        print("=" * 50)

        if self.dry_run and self.files_fixed > 0:
            print("\n💡 Run without --dry-run to apply fixes")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Auto-fix unlinked ticket and work effort references",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Preview fixes (dry run)
  python3 tools/obsidian-linter/fix-links.py --scope _work_efforts --dry-run

  # Apply fixes
  python3 tools/obsidian-linter/fix-links.py --scope _work_efforts

  # Fix entire repository
  python3 tools/obsidian-linter/fix-links.py
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

    fixer = LinkFixer(
        root_path=args.path,
        scope=args.scope,
        dry_run=args.dry_run
    )

    fixer.fix_all()


if __name__ == "__main__":
    main()

