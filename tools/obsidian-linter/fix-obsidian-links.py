#!/usr/bin/env python3
"""
Comprehensive Obsidian Link Fixer

Fixes all Obsidian wikilink issues in work effort files:
- Ensures work effort links use full paths
- Ensures ticket links use full paths
- Fixes ticket tables to link to correct tickets
- Removes links from frontmatter (should be plain values)
- Converts unlinked references to wikilinks
- Ensures bidirectional linking (tickets <-> work efforts)

Usage:
    python3 tools/obsidian-linter/fix-obsidian-links.py --scope _work_efforts
    python3 tools/obsidian-linter/fix-obsidian-links.py --scope _work_efforts --dry-run
"""

import re
import sys
from pathlib import Path
from collections import defaultdict
from typing import Dict, Tuple, List, Optional
import argparse


class ObsidianLinkFixer:
    """Comprehensive Obsidian link fixer for work efforts and tickets."""

    def __init__(self, root_path: str = ".", scope: Optional[str] = None, dry_run: bool = False):
        self.root_path = Path(root_path).resolve()
        self.scope = scope
        self.dry_run = dry_run
        self.stats = {
            'files_fixed': 0,
            'we_links_fixed': 0,
            'ticket_links_fixed': 0,
            'frontmatter_cleaned': 0,
            'tables_fixed': 0,
            'unlinked_converted': 0
        }

        # Build indexes
        self.we_index_map: Dict[str, str] = {}
        self.ticket_map: Dict[str, str] = {}
        self.we_tickets: Dict[str, List[str]] = defaultdict(list)
        self._build_indexes()

    def _build_indexes(self):
        """Build indexes of all work efforts and tickets."""
        search_path = self.root_path / self.scope if self.scope else self.root_path
        work_efforts_dir = search_path if self.scope else search_path / '_work_efforts'

        if not work_efforts_dir.exists():
            return

        for we_dir in work_efforts_dir.glob('WE-*'):
            if not we_dir.is_dir():
                continue

            # Extract WE ID
            we_id_match = re.match(r'(WE-\d{6}-[a-z0-9]{4})', we_dir.name)
            if not we_id_match:
                continue
            we_id = we_id_match.group(1)

            # Find index file
            for index_file in we_dir.glob('*_index.md'):
                if index_file.name.startswith('WE-'):
                    rel_to_repo = index_file.relative_to(self.root_path)
                    obsidian_path = str(rel_to_repo.with_suffix('')).replace('\\', '/')
                    self.we_index_map[we_id] = obsidian_path
                    break

            # Index tickets
            tickets_dir = we_dir / 'tickets'
            if tickets_dir.exists():
                for ticket_file in tickets_dir.glob('TKT-*.md'):
                    match = re.match(r'TKT-(\d{6})-(\d{3})_(.+)\.md', ticket_file.name)
                    if match:
                        ticket_id = f"TKT-{match.group(1)}-{match.group(2)}"
                        rel_to_repo = ticket_file.relative_to(self.root_path)
                        obsidian_path = str(rel_to_repo.with_suffix('')).replace('\\', '/')
                        self.ticket_map[ticket_id] = obsidian_path
                        self.we_tickets[we_id].append(ticket_id)

    def fix_frontmatter(self, content: str) -> str:
        """Remove wikilinks from frontmatter (should be plain values)."""
        frontmatter_match = re.match(r'^(---\s*\n)(.*?)(\n---\s*\n)', content, re.DOTALL)
        if not frontmatter_match:
            return content

        frontmatter_content = frontmatter_match.group(2)
        fixed_frontmatter = frontmatter_content

        # Remove wikilinks, keep just the value
        fixed_frontmatter = re.sub(r'\[\[[^\]]+\|([^\]]+)\]\]', r'\1', fixed_frontmatter)
        fixed_frontmatter = re.sub(r'\[\[([^\]]+)\]\]', r'\1', fixed_frontmatter)

        if fixed_frontmatter != frontmatter_content:
            self.stats['frontmatter_cleaned'] += 1
            return (frontmatter_match.group(1) +
                   fixed_frontmatter +
                   frontmatter_match.group(3) +
                   content[frontmatter_match.end():])

        return content

    def fix_work_effort_links(self, content: str) -> str:
        """Fix work effort links to use correct Obsidian paths."""
        original = content

        for we_id, obsidian_path in self.we_index_map.items():
            # Fix various incorrect formats
            patterns = [
                # Fix links with wrong path
                (rf'\[\[[^\]]*{re.escape(we_id)}[^\]]*\|{re.escape(we_id)}\]\]',
                 f'[[{obsidian_path}|{we_id}]]'),
                # Fix links without alias
                (rf'\[\[[^\]]*{re.escape(we_id)}_index\]\]',
                 f'[[{obsidian_path}|{we_id}]]'),
                # Fix links with just ID
                (rf'\[\[{re.escape(we_id)}\]\]',
                 f'[[{obsidian_path}|{we_id}]]'),
            ]

            for pattern, replacement in patterns:
                content = re.sub(pattern, replacement, content)

        if content != original:
            self.stats['we_links_fixed'] += 1

        return content

    def fix_ticket_links(self, content: str) -> str:
        """Fix ticket links to use correct Obsidian paths."""
        original = content

        for ticket_id, obsidian_path in self.ticket_map.items():
            # Fix ticket links
            patterns = [
                (rf'\[\[[^\]]*{re.escape(ticket_id)}[^\]]*\|{re.escape(ticket_id)}\]\]',
                 f'[[{obsidian_path}|{ticket_id}]]'),
                (rf'\[\[{re.escape(ticket_id)}\]\]',
                 f'[[{obsidian_path}|{ticket_id}]]'),
            ]

            for pattern, replacement in patterns:
                content = re.sub(pattern, replacement, content)

        if content != original:
            self.stats['ticket_links_fixed'] += 1

        return content

    def fix_ticket_tables(self, content: str, we_id: str) -> str:
        """
        Fix ticket tables to link to correct tickets for this work effort.
        Uses HTML links in tables (to avoid pipe conflicts) and wikilinks elsewhere.
        """
        # Only get tickets that belong to THIS work effort
        tickets = {tid: self.ticket_map[tid] for tid in self.we_tickets.get(we_id, [])}

        if not tickets:
            return content

        original = content

        # Find table boundaries
        lines = content.split('\n')
        fixed_lines = []
        in_table = False

        for i, line in enumerate(lines):
            # Detect table separator row (contains ---)
            if '|' in line and '---' in line:
                in_table = True
                fixed_lines.append(line)
                continue

            # Detect table end (empty line or non-table line)
            if in_table and line.strip() and '|' not in line:
                in_table = False
                fixed_lines.append(line)
                continue

            if in_table and '|' in line:
                # We're in a table row - use HTML links instead of wikilinks
                fixed_line = line

                # First pass: Aggressively clean up ALL malformed link patterns
                # Remove any triple bracket patterns (malformed wikilinks)
                while re.search(r'\[\[\[[^\]]+\]\]\]', fixed_line):
                    fixed_line = re.sub(r'\[\[\[[^\]]+\]\]\]', '', fixed_line)

                # Remove any remaining malformed combinations
                fixed_line = re.sub(r'\[\[\[[^\]]+\]\]\]\([^\)]+\)\]\([^\)]+\)', '', fixed_line)
                fixed_line = re.sub(r'\[\[\[[^\]]+\]\]\]\([^\)]+\)', '', fixed_line)

                # Remove any double wikilink patterns that might be malformed
                fixed_line = re.sub(r'\[\[[^\]]+\]\]\([^\)]+\)', '', fixed_line)

                # Split row into cells (remove empty first/last from leading/trailing |)
                cells = [cell.strip() for cell in fixed_line.split('|')]
                # Remove empty first and last cells if they exist (from leading/trailing |)
                if cells and not cells[0]:
                    cells = cells[1:]
                if cells and not cells[-1]:
                    cells = cells[:-1]

                if len(cells) < 2:
                    fixed_lines.append(fixed_line)
                    continue

                # Process each ticket for THIS work effort only
                for ticket_id, obsidian_path in tickets.items():
                    html_link = f'[{ticket_id}]({obsidian_path})'

                    # Only process if this ticket ID appears in the row
                    row_text = ' '.join(cells)
                    if ticket_id not in row_text:
                        continue

                    # ID column is typically the first cell (index 0)
                    if len(cells) > 0:
                        id_cell = cells[0]

                        # Clean up any malformed or incorrect links in ID cell
                        # Remove any wikilink format
                        id_cell = re.sub(r'\[\[[^\]]+\|' + re.escape(ticket_id) + r'\]\]', '', id_cell)
                        # Remove any HTML link (we'll add correct one)
                        id_cell = re.sub(r'\[' + re.escape(ticket_id) + r'\]\([^\)]+\)', '', id_cell)
                        # Remove any malformed patterns
                        id_cell = re.sub(r'\[\[\[[^\]]+\]\]\]', '', id_cell)
                        id_cell = id_cell.strip()

                        # If ID cell is empty, contains just the ticket ID, or contains the ticket ID, replace with link
                        if not id_cell or id_cell == ticket_id or ticket_id in id_cell:
                            cells[0] = html_link

                    # Clean up links to this ticket in other cells (shouldn't be there, but clean up if present)
                    for i in range(1, len(cells)):
                        cell = cells[i]
                        # Replace any wikilink or HTML link to this ticket
                        cell = re.sub(rf'\[\[[^\]]+\|{re.escape(ticket_id)}\]\]', '', cell)
                        cell = re.sub(rf'\[{re.escape(ticket_id)}\]\([^\)]+\)', '', cell)
                        cells[i] = cell.strip()

                # Reconstruct the row with proper spacing
                fixed_line = '| ' + ' | '.join(cells) + ' |'
                fixed_lines.append(fixed_line)
            else:
                fixed_lines.append(line)

        content = '\n'.join(fixed_lines)

        # Also fix ticket lists (bullet points) - use wikilinks here
        for ticket_id, obsidian_path in tickets.items():
            pattern = rf'^(\s*[-*])\s*({re.escape(ticket_id)})(\s*)$'
            replacement = rf'\1 [[{obsidian_path}|\2]]\3'
            content = re.sub(pattern, replacement, content, flags=re.MULTILINE)

        if content != original:
            self.stats['tables_fixed'] += 1

        return content

    def convert_unlinked_references(self, content: str) -> str:
        """Convert unlinked WE/TKT references to wikilinks (outside frontmatter)."""
        # Extract body (skip frontmatter)
        frontmatter_match = re.match(r'^---\s*\n.*?\n---\s*\n', content, re.DOTALL)
        body_start = frontmatter_match.end() if frontmatter_match else 0
        body = content[body_start:]
        frontmatter = content[:body_start] if frontmatter_match else ""

        original_body = body

        # Fix unlinked work effort references
        for we_id, obsidian_path in self.we_index_map.items():
            def replace_unlinked_we(match):
                # Check if already in a link
                pos = match.start()
                before = body[:pos]
                link_start = before.rfind('[[')
                if link_start >= 0:
                    link_end = before.rfind(']]', link_start)
                    if link_end < 0 or pos < link_end:
                        return match.group(0)
                return f"[[{obsidian_path}|{we_id}]]"

            pattern = rf'\b({re.escape(we_id)})\b'
            body = re.sub(pattern, replace_unlinked_we, body)

        # Fix unlinked ticket references
        for ticket_id, obsidian_path in self.ticket_map.items():
            def replace_unlinked_ticket(match):
                pos = match.start()
                before = body[:pos]
                link_start = before.rfind('[[')
                if link_start >= 0:
                    link_end = before.rfind(']]', link_start)
                    if link_end < 0 or pos < link_end:
                        return match.group(0)
                return f"[[{obsidian_path}|{ticket_id}]]"

            pattern = rf'\b({re.escape(ticket_id)})\b'
            body = re.sub(pattern, replace_unlinked_ticket, body)

        if body != original_body:
            self.stats['unlinked_converted'] += 1

        return frontmatter + body

    def ensure_ticket_parent_links(self, content: str, ticket_id: str, parent_we_id: str) -> str:
        """Ensure ticket has link to parent work effort."""
        we_path = self.we_index_map.get(parent_we_id)
        if not we_path:
            return content

        # Check if parent is linked
        if f"[[{we_path}" not in content and f"**Parent Work Effort**" not in content:
            # Add parent link
            if '## Description' in content:
                content = content.replace('## Description',
                    f'**Parent Work Effort**: [[{we_path}|{parent_we_id}]]\n\n## Description')
            else:
                # Add after frontmatter
                frontmatter_end = content.find('---', 3)
                if frontmatter_end > 0:
                    insert_pos = content.find('\n', frontmatter_end) + 1
                    content = (content[:insert_pos] +
                              f'\n**Parent Work Effort**: [[{we_path}|{parent_we_id}]]\n' +
                              content[insert_pos:])

        return content

    def fix_file(self, file_path: Path) -> bool:
        """Fix all link issues in a single file."""
        try:
            content = file_path.read_text()
            original = content

            # Determine file type
            is_index = file_path.name.endswith('_index.md') and file_path.name.startswith('WE-')
            is_ticket = file_path.name.startswith('TKT-')

            # Extract IDs
            we_id = None
            ticket_id = None
            parent_we_id = None

            if is_index:
                we_id_match = re.match(r'(WE-\d{6}-[a-z0-9]{4})_index\.md', file_path.name)
                if we_id_match:
                    we_id = we_id_match.group(1)
            elif is_ticket:
                ticket_match = re.match(r'TKT-(\d{6})-(\d{3})_(.+)\.md', file_path.name)
                if ticket_match:
                    ticket_id = f"TKT-{ticket_match.group(1)}-{ticket_match.group(2)}"
                    # Get parent from frontmatter
                    frontmatter_match = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
                    if frontmatter_match:
                        parent_match = re.search(r'parent:\s*(WE-\d{6}-[a-z0-9]{4})', frontmatter_match.group(1))
                        if parent_match:
                            parent_we_id = parent_match.group(1)

            # Apply fixes
            content = self.fix_frontmatter(content)
            content = self.fix_work_effort_links(content)
            content = self.fix_ticket_links(content)

            if is_index and we_id:
                content = self.fix_ticket_tables(content, we_id)

            if is_ticket and ticket_id and parent_we_id:
                content = self.ensure_ticket_parent_links(content, ticket_id, parent_we_id)

            content = self.convert_unlinked_references(content)

            # Write if changed
            if content != original:
                if not self.dry_run:
                    file_path.write_text(content)
                self.stats['files_fixed'] += 1
                return True

            return False

        except Exception as e:
            print(f"Error fixing {file_path}: {e}", file=sys.stderr)
            return False

    def run(self):
        """Run the fixer on all files in scope."""
        search_path = self.root_path / self.scope if self.scope else self.root_path
        work_efforts_dir = search_path if self.scope else search_path / '_work_efforts'

        if not work_efforts_dir.exists():
            print(f"Error: Directory not found: {work_efforts_dir}", file=sys.stderr)
            return

        print("🔗 Obsidian Link Fixer")
        print("=" * 60)
        if self.dry_run:
            print("🔍 DRY RUN MODE - No files will be modified")
        print(f"Scope: {self.scope or 'entire repository'}")
        print(f"Files found: {len(list(work_efforts_dir.rglob('*.md')))}")
        print()

        # Fix all markdown files
        for md_file in sorted(work_efforts_dir.rglob('*.md')):
            if self.fix_file(md_file):
                print(f"{'[DRY RUN] ' if self.dry_run else ''}Fixed: {md_file.relative_to(self.root_path)}")

        # Print stats
        print()
        print("=" * 60)
        print("📊 Fix Statistics")
        print("=" * 60)
        print(f"Files fixed: {self.stats['files_fixed']}")
        print(f"Work effort links fixed: {self.stats['we_links_fixed']}")
        print(f"Ticket links fixed: {self.stats['ticket_links_fixed']}")
        print(f"Frontmatter cleaned: {self.stats['frontmatter_cleaned']}")
        print(f"Ticket tables fixed: {self.stats['tables_fixed']}")
        print(f"Unlinked references converted: {self.stats['unlinked_converted']}")

        if self.dry_run:
            print("\n💡 Run without --dry-run to apply fixes")


def main():
    parser = argparse.ArgumentParser(
        description='Comprehensive Obsidian link fixer for work efforts and tickets'
    )
    parser.add_argument(
        '--scope',
        type=str,
        default='_work_efforts',
        help='Directory scope to fix (default: _work_efforts)'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Preview fixes without applying them'
    )
    parser.add_argument(
        '--root',
        type=str,
        default='.',
        help='Root directory (default: current directory)'
    )

    args = parser.parse_args()

    fixer = ObsidianLinkFixer(
        root_path=args.root,
        scope=args.scope,
        dry_run=args.dry_run
    )
    fixer.run()


if __name__ == '__main__':
    main()

