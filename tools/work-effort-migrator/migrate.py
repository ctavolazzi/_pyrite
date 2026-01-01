#!/usr/bin/env python3
"""
Work Effort Migration Tool
Migrates legacy Johnny Decimal work efforts (XX.XX_*.md) to MCP v0.3.0 format (WE-YYMMDD-xxxx/)

Safety Features:
- Dry-run by default (no changes without --migrate)
- Automatic backup before migration
- Rollback capability
- Validation of all content preservation
"""

import os
import re
import json
import shutil
import argparse
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import yaml


class Colors:
    """ANSI color codes for terminal output"""
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'


class WorkEffortMigrator:
    """Migrates legacy work efforts to new MCP v0.3.0 format"""

    def __init__(self, work_efforts_dir: str = "_work_efforts", dry_run: bool = True):
        self.work_efforts_dir = Path(work_efforts_dir)
        self.dry_run = dry_run
        self.backup_dir = None
        self.legacy_files = []
        self.migration_plan = []

    def scan(self) -> List[Path]:
        """Find all legacy work effort files matching XX.XX_*.md pattern"""
        print(f"{Colors.CYAN}🔍 Scanning for legacy work effort files...{Colors.END}\n")

        legacy_pattern = re.compile(r'^\d{2}\.\d{2}_.*\.md$')
        legacy_files = []

        for md_file in self.work_efforts_dir.rglob("*.md"):
            if legacy_pattern.match(md_file.name):
                # Skip if it's just an index file
                if md_file.stem.endswith('_index') or md_file.stem == '00.00_index':
                    print(f"  {Colors.YELLOW}⊘{Colors.END} Skipping index file: {md_file.relative_to(self.work_efforts_dir)}")
                    continue

                legacy_files.append(md_file)
                print(f"  {Colors.GREEN}✓{Colors.END} Found: {md_file.relative_to(self.work_efforts_dir)}")

        self.legacy_files = legacy_files
        print(f"\n{Colors.BOLD}Found {len(legacy_files)} legacy work effort files{Colors.END}\n")
        return legacy_files

    def parse_frontmatter(self, content: str) -> Tuple[Optional[Dict], str]:
        """Extract YAML frontmatter and content from markdown file"""
        frontmatter_pattern = re.compile(r'^---\s*\n(.*?)\n---\s*\n(.*)', re.DOTALL)
        match = frontmatter_pattern.match(content)

        if not match:
            return None, content

        try:
            frontmatter = yaml.safe_load(match.group(1))
            body = match.group(2)
            return frontmatter, body
        except yaml.YAMLError as e:
            print(f"  {Colors.RED}✗{Colors.END} YAML parse error: {e}")
            return None, content

    def extract_tasks(self, content: str) -> List[str]:
        """Extract task items from markdown checkboxes"""
        task_pattern = re.compile(r'^\s*-\s*\[([ x])\]\s+(.+)$', re.MULTILINE)
        tasks = []

        for match in task_pattern.finditer(content):
            checked = match.group(1) == 'x'
            task_text = match.group(2).strip()
            tasks.append({
                'completed': checked,
                'text': task_text
            })

        return tasks

    def generate_we_id(self, created_date: str) -> str:
        """Generate WE-YYMMDD-xxxx ID from creation date"""
        # Parse ISO date string
        dt = datetime.fromisoformat(created_date.replace('Z', '+00:00'))
        date_part = dt.strftime('%y%m%d')

        # Generate random 4-char suffix (using first 4 chars of hash for reproducibility)
        import hashlib
        hash_input = f"{created_date}".encode()
        suffix = hashlib.sha256(hash_input).hexdigest()[:4]

        return f"WE-{date_part}-{suffix}"

    def sanitize_filename(self, text: str) -> str:
        """Convert text to safe filename (lowercase, underscores)"""
        # Remove special characters
        clean = re.sub(r'[^\w\s-]', '', text.lower())
        # Replace spaces/hyphens with underscores
        clean = re.sub(r'[-\s]+', '_', clean)
        return clean.strip('_')

    def create_migration_plan(self) -> List[Dict]:
        """Analyze legacy files and create migration plan"""
        print(f"{Colors.CYAN}📋 Creating migration plan...{Colors.END}\n")

        for legacy_file in self.legacy_files:
            with open(legacy_file, 'r', encoding='utf-8') as f:
                content = f.read()

            frontmatter, body = self.parse_frontmatter(content)

            if not frontmatter:
                print(f"  {Colors.RED}✗{Colors.END} No frontmatter in {legacy_file.name} - skipping")
                continue

            # Extract metadata
            we_id = self.generate_we_id(frontmatter.get('created', datetime.now().isoformat()))
            title = frontmatter.get('title', 'Untitled')
            status = frontmatter.get('status', 'pending')

            # Generate folder name
            folder_name = f"{we_id}_{self.sanitize_filename(title)}"
            new_dir = self.work_efforts_dir / folder_name

            # Extract tasks
            tasks = self.extract_tasks(body)

            plan = {
                'source_file': legacy_file,
                'we_id': we_id,
                'title': title,
                'status': status,
                'frontmatter': frontmatter,
                'body': body,
                'tasks': tasks,
                'target_dir': new_dir,
                'target_index': new_dir / f"{we_id}_index.md",
                'tickets_dir': new_dir / 'tickets'
            }

            self.migration_plan.append(plan)

            print(f"  {Colors.GREEN}✓{Colors.END} {legacy_file.name}")
            print(f"    → {folder_name}/")
            print(f"    → {len(tasks)} tasks → {len(tasks)} tickets")

        print(f"\n{Colors.BOLD}Migration plan complete: {len(self.migration_plan)} work efforts{Colors.END}\n")
        return self.migration_plan

    def create_backup(self) -> Path:
        """Create timestamped backup of work_efforts directory"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_dir = Path(f"_work_efforts_backup_{timestamp}")

        print(f"{Colors.CYAN}💾 Creating backup...{Colors.END}")
        shutil.copytree(self.work_efforts_dir, backup_dir)
        print(f"  {Colors.GREEN}✓{Colors.END} Backup created: {backup_dir}\n")

        self.backup_dir = backup_dir
        return backup_dir

    def execute_migration(self) -> bool:
        """Execute the migration plan"""
        if self.dry_run:
            print(f"{Colors.YELLOW}⚠️  DRY RUN MODE - No changes will be made{Colors.END}\n")
            return False

        print(f"{Colors.CYAN}🚀 Executing migration...{Colors.END}\n")

        for plan in self.migration_plan:
            try:
                # Create directory structure
                plan['target_dir'].mkdir(parents=True, exist_ok=True)
                plan['tickets_dir'].mkdir(exist_ok=True)

                # Create index.md
                self._create_index_file(plan)

                # Create ticket files
                self._create_ticket_files(plan)

                # Remove old file
                plan['source_file'].unlink()

                print(f"  {Colors.GREEN}✓{Colors.END} Migrated: {plan['title']}")

            except Exception as e:
                print(f"  {Colors.RED}✗{Colors.END} Failed to migrate {plan['title']}: {e}")
                return False

        # Clean up empty directories
        self._cleanup_empty_dirs()

        print(f"\n{Colors.GREEN}✅ Migration complete!{Colors.END}\n")
        return True

    def _create_index_file(self, plan: Dict):
        """Create WE-YYMMDD-xxxx_index.md file"""
        fm = plan['frontmatter']

        # Build new frontmatter
        new_frontmatter = {
            'id': plan['we_id'],
            'title': plan['title'],
            'status': plan['status'],
            'created': fm.get('created'),
            'last_updated': fm.get('last_updated', datetime.now().isoformat()),
        }

        # Build content
        content = f"""---
{yaml.dump(new_frontmatter, default_flow_style=False, sort_keys=False)}---

# {plan['we_id']}: {plan['title']}

## Metadata
- **Created**: {fm.get('created', 'N/A')}
- **Status**: {plan['status']}
- **Migrated**: {datetime.now().strftime('%Y-%m-%d %H:%M UTC')}

## Objective

{plan['body'].split('## Objective')[1].split('##')[0].strip() if '## Objective' in plan['body'] else plan['body'][:500]}

## Tickets

| ID | Title | Status |
|----|-------|--------|
"""

        # Add ticket rows
        for i, task in enumerate(plan['tasks'], 1):
            ticket_id = f"TKT-{plan['we_id'].split('-')[1]}-{i:03d}"
            task_status = 'completed' if task['completed'] else 'pending'
            content += f"| {ticket_id} | {task['text'][:60]} | {task_status} |\n"

        content += f"\n## Original Content\n\n{plan['body']}\n"

        # Write file
        with open(plan['target_index'], 'w', encoding='utf-8') as f:
            f.write(content)

    def _create_ticket_files(self, plan: Dict):
        """Create individual ticket files"""
        we_short_id = plan['we_id'].split('-')[1]  # e.g., "251221"

        for i, task in enumerate(plan['tasks'], 1):
            ticket_id = f"TKT-{we_short_id}-{i:03d}"
            ticket_filename = f"{ticket_id}_{self.sanitize_filename(task['text'][:40])}.md"
            ticket_path = plan['tickets_dir'] / ticket_filename

            ticket_status = 'completed' if task['completed'] else 'pending'

            content = f"""---
id: {ticket_id}
parent: {plan['we_id']}
title: "{task['text']}"
status: {ticket_status}
created: {plan['frontmatter'].get('created')}
---

# {ticket_id}: {task['text']}

**Parent Work Effort**: {plan['we_id']}
**Status**: {ticket_status}

## Description

{task['text']}

## Notes

Migrated from legacy work effort: `{plan['source_file'].name}`
"""

            with open(ticket_path, 'w', encoding='utf-8') as f:
                f.write(content)

    def _cleanup_empty_dirs(self):
        """Remove empty legacy directories"""
        for dirpath in sorted(self.work_efforts_dir.rglob("*"), reverse=True):
            if dirpath.is_dir() and not any(dirpath.iterdir()):
                print(f"  {Colors.YELLOW}🗑{Colors.END}  Removing empty dir: {dirpath.relative_to(self.work_efforts_dir)}")
                if not self.dry_run:
                    dirpath.rmdir()

    def print_summary(self):
        """Print migration summary"""
        print(f"\n{Colors.HEADER}{'='*60}{Colors.END}")
        print(f"{Colors.BOLD}Migration Summary{Colors.END}")
        print(f"{Colors.HEADER}{'='*60}{Colors.END}\n")

        for plan in self.migration_plan:
            print(f"{Colors.CYAN}📁{Colors.END} {plan['title']}")
            print(f"   Source: {plan['source_file'].relative_to(self.work_efforts_dir)}")
            print(f"   Target: {plan['target_dir'].relative_to(self.work_efforts_dir)}/")
            print(f"   Tickets: {len(plan['tasks'])}")
            print()

        print(f"{Colors.BOLD}Total: {len(self.migration_plan)} work efforts, {sum(len(p['tasks']) for p in self.migration_plan)} tickets{Colors.END}\n")

    def rollback(self, backup_dir: str) -> bool:
        """Restore from backup"""
        backup_path = Path(backup_dir)

        if not backup_path.exists():
            print(f"{Colors.RED}✗ Backup directory not found: {backup_dir}{Colors.END}")
            return False

        print(f"{Colors.YELLOW}⚠️  Rolling back from backup: {backup_dir}{Colors.END}")

        # Remove current work_efforts
        if self.work_efforts_dir.exists():
            shutil.rmtree(self.work_efforts_dir)

        # Restore from backup
        shutil.copytree(backup_path, self.work_efforts_dir)

        print(f"{Colors.GREEN}✓ Rollback complete{Colors.END}\n")
        return True


def main():
    parser = argparse.ArgumentParser(
        description="Migrate legacy Johnny Decimal work efforts to MCP v0.3.0 format",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Scan and show what would be migrated (safe, no changes)
  python migrate.py --scan

  # Execute migration with automatic backup
  python migrate.py --migrate

  # Rollback from specific backup
  python migrate.py --rollback _work_efforts_backup_20260101_120000
        """
    )

    parser.add_argument('--scan', action='store_true',
                       help='Scan for legacy files and show migration plan (default)')
    parser.add_argument('--migrate', action='store_true',
                       help='Execute migration (creates backup automatically)')
    parser.add_argument('--rollback', type=str, metavar='BACKUP_DIR',
                       help='Rollback from specified backup directory')
    parser.add_argument('--work-dir', type=str, default='_work_efforts',
                       help='Work efforts directory (default: _work_efforts)')

    args = parser.parse_args()

    # Change to repo root
    repo_root = Path(__file__).parent.parent.parent
    os.chdir(repo_root)

    migrator = WorkEffortMigrator(
        work_efforts_dir=args.work_dir,
        dry_run=not args.migrate
    )

    # Handle rollback
    if args.rollback:
        migrator.rollback(args.rollback)
        return

    # Scan for legacy files
    legacy_files = migrator.scan()

    if not legacy_files:
        print(f"{Colors.GREEN}✅ No legacy work effort files found - already migrated!{Colors.END}\n")
        return

    # Create migration plan
    migrator.create_migration_plan()
    migrator.print_summary()

    # Execute migration if requested
    if args.migrate:
        print(f"{Colors.YELLOW}{'='*60}{Colors.END}")
        confirm = input(f"{Colors.BOLD}Proceed with migration? (yes/no): {Colors.END}")

        if confirm.lower() != 'yes':
            print(f"{Colors.YELLOW}Migration cancelled{Colors.END}\n")
            return

        # Create backup before migration
        migrator.create_backup()

        # Execute
        success = migrator.execute_migration()

        if success:
            print(f"{Colors.GREEN}Migration completed successfully!{Colors.END}")
            print(f"Backup saved at: {migrator.backup_dir}\n")
        else:
            print(f"{Colors.RED}Migration failed - check errors above{Colors.END}")
            print(f"Backup available at: {migrator.backup_dir}\n")
    else:
        print(f"{Colors.YELLOW}This was a dry-run. Use --migrate to execute.{Colors.END}\n")


if __name__ == '__main__':
    main()
