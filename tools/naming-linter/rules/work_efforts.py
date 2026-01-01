"""
Work Effort validation rules
"""

import re
import yaml
from pathlib import Path
from typing import List, Dict, Optional
from .common import (
    validate_we_folder_name,
    validate_we_index_name,
    validate_we_id,
    validate_ticket_name,
    validate_ticket_id,
    extract_we_id_from_folder,
    extract_we_id_from_index,
    generate_expected_folder_name,
    generate_expected_index_name,
)


class WorkEffortValidator:
    """
    Validates work effort naming conventions and structure
    """

    def __init__(self, root_path: str = "_work_efforts", verbose: bool = False):
        self.root_path = Path(root_path)
        self.verbose = verbose
        self.violations = []

    def validate(self) -> List[Dict]:
        """
        Validate all work efforts in root path

        Returns:
            List of violation dictionaries
        """
        self.violations = []

        if not self.root_path.exists():
            self.violations.append({
                'type': 'PATH_NOT_FOUND',
                'path': str(self.root_path),
                'message': f'Path does not exist: {self.root_path}'
            })
            return self.violations

        # Check if it's a single WE folder or the root directory
        if self.root_path.name.startswith('WE-'):
            self._validate_work_effort(self.root_path)
        else:
            # Validate all WE folders in directory
            for we_dir in self.root_path.iterdir():
                if we_dir.is_dir() and we_dir.name.startswith('WE-'):
                    self._validate_work_effort(we_dir)

        return self.violations

    def _validate_work_effort(self, we_dir: Path):
        """Validate a single work effort directory"""
        folder_name = we_dir.name

        if self.verbose:
            print(f"  Checking: {folder_name}")

        # 1. Validate folder name format
        error = validate_we_folder_name(folder_name)
        if error:
            self.violations.append({
                'type': 'INVALID_FOLDER_NAME',
                'path': str(we_dir),
                'message': error,
                'actual': folder_name
            })
            return  # Can't continue if folder name is completely invalid

        # 2. Extract WE ID from folder name
        we_id = extract_we_id_from_folder(folder_name)
        if not we_id:
            self.violations.append({
                'type': 'CANNOT_EXTRACT_WE_ID',
                'path': str(we_dir),
                'message': 'Cannot extract WE ID from folder name'
            })
            return

        # 3. Check for index file
        expected_index = we_dir / generate_expected_index_name(we_id)

        if not expected_index.exists():
            # Check if there's any index file with wrong name
            index_files = list(we_dir.glob("*_index.md"))

            if index_files:
                self.violations.append({
                    'type': 'INCORRECT_INDEX_NAME',
                    'path': str(index_files[0]),
                    'message': 'Index file has incorrect name',
                    'actual': index_files[0].name,
                    'expected': expected_index.name
                })
            else:
                self.violations.append({
                    'type': 'MISSING_INDEX_FILE',
                    'path': str(we_dir),
                    'message': 'Index file not found',
                    'expected': expected_index.name
                })
        else:
            # 4. Validate index file content
            self._validate_index_file(expected_index, we_id)

        # 5. Check for tickets directory
        tickets_dir = we_dir / 'tickets'
        if tickets_dir.exists() and tickets_dir.is_dir():
            self._validate_tickets_dir(tickets_dir, we_id)

    def _validate_index_file(self, index_path: Path, we_id: str):
        """Validate index file frontmatter and content"""
        try:
            with open(index_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Extract frontmatter
            frontmatter_match = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)

            if not frontmatter_match:
                self.violations.append({
                    'type': 'MISSING_FRONTMATTER',
                    'path': str(index_path),
                    'message': 'Index file missing YAML frontmatter'
                })
                return

            # Parse frontmatter
            try:
                frontmatter = yaml.safe_load(frontmatter_match.group(1))
            except yaml.YAMLError as e:
                self.violations.append({
                    'type': 'INVALID_YAML',
                    'path': str(index_path),
                    'message': f'Invalid YAML frontmatter: {e}'
                })
                return

            # Validate required fields
            required_fields = ['id', 'title', 'status', 'created']
            for field in required_fields:
                if field not in frontmatter:
                    self.violations.append({
                        'type': 'MISSING_FRONTMATTER_FIELD',
                        'path': str(index_path),
                        'message': f'Missing required frontmatter field: {field}'
                    })

            # Validate ID matches
            if 'id' in frontmatter and frontmatter['id'] != we_id:
                self.violations.append({
                    'type': 'ID_MISMATCH',
                    'path': str(index_path),
                    'message': 'Frontmatter ID does not match folder name',
                    'actual': frontmatter['id'],
                    'expected': we_id
                })

        except Exception as e:
            self.violations.append({
                'type': 'FILE_READ_ERROR',
                'path': str(index_path),
                'message': f'Error reading index file: {e}'
            })

    def _validate_tickets_dir(self, tickets_dir: Path, we_id: str):
        """Validate ticket files in tickets directory"""
        # Extract date part from WE ID (e.g., "260101" from "WE-260101-a1b2")
        date_part = we_id.split('-')[1]

        for ticket_file in tickets_dir.glob("*.md"):
            filename = ticket_file.name

            # Validate ticket filename
            error = validate_ticket_name(filename)
            if error:
                self.violations.append({
                    'type': 'INVALID_TICKET_NAME',
                    'path': str(ticket_file),
                    'message': error,
                    'actual': filename
                })
                continue

            # Extract ticket ID and validate it matches parent WE
            match = re.match(r'^(TKT-\d{6}-\d{3})_', filename)
            if match:
                ticket_id = match.group(1)
                ticket_date = ticket_id.split('-')[1]

                if ticket_date != date_part:
                    self.violations.append({
                        'type': 'TICKET_DATE_MISMATCH',
                        'path': str(ticket_file),
                        'message': f'Ticket date ({ticket_date}) does not match WE date ({date_part})',
                        'actual': ticket_id,
                        'expected': f'TKT-{date_part}-XXX'
                    })

    def preview_fixes(self, violations: List[Dict]):
        """Preview what fixes would be applied"""
        for violation in violations:
            vtype = violation['type']

            if vtype == 'INCORRECT_INDEX_NAME':
                print(f"  Would rename: {violation['actual']} → {violation['expected']}")
            elif vtype == 'ID_MISMATCH':
                print(f"  Would update frontmatter ID: {violation['actual']} → {violation['expected']}")
            elif vtype == 'MISSING_FRONTMATTER_FIELD':
                print(f"  Would add missing field to {violation['path']}")
            else:
                print(f"  Cannot auto-fix: {vtype} - {violation['message']}")

    def apply_fixes(self, violations: List[Dict]) -> int:
        """
        Apply fixes to violations

        Returns:
            Number of fixes applied
        """
        fixed_count = 0

        for violation in violations:
            vtype = violation['type']

            try:
                if vtype == 'INCORRECT_INDEX_NAME':
                    # Rename index file
                    old_path = Path(violation['path'])
                    new_path = old_path.parent / violation['expected']
                    old_path.rename(new_path)
                    print(f"  ✓ Renamed: {old_path.name} → {new_path.name}")
                    fixed_count += 1

                elif vtype == 'ID_MISMATCH':
                    # Update frontmatter ID
                    self._fix_frontmatter_id(Path(violation['path']), violation['expected'])
                    print(f"  ✓ Updated ID in: {violation['path']}")
                    fixed_count += 1

                # Some violations cannot be auto-fixed
                # (e.g., missing files, invalid folder names require manual intervention)

            except Exception as e:
                print(f"  ✗ Failed to fix {vtype}: {e}")

        return fixed_count

    def _fix_frontmatter_id(self, index_path: Path, correct_id: str):
        """Update frontmatter ID in index file"""
        with open(index_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Extract and update frontmatter
        frontmatter_match = re.match(r'^(---\s*\n)(.*?)(\n---)', content, re.DOTALL)
        if frontmatter_match:
            frontmatter_str = frontmatter_match.group(2)
            frontmatter = yaml.safe_load(frontmatter_str)
            frontmatter['id'] = correct_id

            # Rebuild content
            new_frontmatter = yaml.dump(frontmatter, default_flow_style=False, sort_keys=False)
            new_content = f"---\n{new_frontmatter}---" + content[frontmatter_match.end():]

            with open(index_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
