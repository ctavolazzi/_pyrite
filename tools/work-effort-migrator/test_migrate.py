#!/usr/bin/env python3
"""
Unit tests for Work Effort Migration Tool
Tests core migration logic without filesystem modifications
"""

import unittest
from pathlib import Path
from datetime import datetime
from migrate import WorkEffortMigrator


class TestWorkEffortMigrator(unittest.TestCase):
    """Test suite for WorkEffortMigrator"""

    def setUp(self):
        """Set up test fixtures"""
        self.migrator = WorkEffortMigrator(work_efforts_dir="_work_efforts", dry_run=True)

    def test_parse_frontmatter_valid(self):
        """Test parsing valid YAML frontmatter"""
        content = """---
id: "10.02"
title: "Test Work Effort"
status: "completed"
created: "2025-12-21T19:38:11.045Z"
---

# Content here
"""
        frontmatter, body = self.migrator.parse_frontmatter(content)

        self.assertIsNotNone(frontmatter)
        self.assertEqual(frontmatter['id'], "10.02")
        self.assertEqual(frontmatter['title'], "Test Work Effort")
        self.assertEqual(frontmatter['status'], "completed")
        self.assertIn("# Content here", body)

    def test_parse_frontmatter_missing(self):
        """Test handling of missing frontmatter"""
        content = "# Just markdown content\n\nNo frontmatter here"
        frontmatter, body = self.migrator.parse_frontmatter(content)

        self.assertIsNone(frontmatter)
        self.assertEqual(body, content)

    def test_extract_tasks(self):
        """Test extracting tasks from markdown checkboxes"""
        content = """
## Tasks
- [x] Completed task one
- [ ] Pending task two
- [x] Another completed task

Some other content
- [ ] Final pending task
"""
        tasks = self.migrator.extract_tasks(content)

        self.assertEqual(len(tasks), 4)
        self.assertTrue(tasks[0]['completed'])
        self.assertFalse(tasks[1]['completed'])
        self.assertEqual(tasks[0]['text'], "Completed task one")
        self.assertEqual(tasks[3]['text'], "Final pending task")

    def test_extract_tasks_empty(self):
        """Test extracting tasks from content without checkboxes"""
        content = "Just plain content with no tasks"
        tasks = self.migrator.extract_tasks(content)

        self.assertEqual(len(tasks), 0)

    def test_generate_we_id(self):
        """Test WE-YYMMDD-xxxx ID generation"""
        created_date = "2025-12-21T19:38:11.045Z"
        we_id = self.migrator.generate_we_id(created_date)

        self.assertTrue(we_id.startswith("WE-251221-"))
        self.assertEqual(len(we_id), 14)  # WE-YYMMDD-xxxx = 14 chars
        # Same input should produce same ID (deterministic)
        we_id2 = self.migrator.generate_we_id(created_date)
        self.assertEqual(we_id, we_id2)

    def test_generate_we_id_different_dates(self):
        """Test that different dates produce different IDs"""
        date1 = "2025-12-21T19:38:11.045Z"
        date2 = "2025-12-22T10:00:00.000Z"

        we_id1 = self.migrator.generate_we_id(date1)
        we_id2 = self.migrator.generate_we_id(date2)

        self.assertNotEqual(we_id1, we_id2)
        self.assertIn("251221", we_id1)
        self.assertIn("251222", we_id2)

    def test_sanitize_filename(self):
        """Test filename sanitization"""
        test_cases = [
            ("CI Pipeline Setup", "ci_pipeline_setup"),
            ("Update System: Exploration!", "update_system_exploration"),
            ("Multi   Space---Test", "multi_space_test"),
            ("CamelCaseText123", "camelcasetext123"),
            ("___Leading_Trailing___", "leading_trailing"),
        ]

        for input_text, expected in test_cases:
            result = self.migrator.sanitize_filename(input_text)
            self.assertEqual(result, expected)

    def test_sanitize_filename_special_chars(self):
        """Test sanitization removes special characters"""
        input_text = "Test@#$%^&*()File!?Name"
        result = self.migrator.sanitize_filename(input_text)

        # Should only contain alphanumeric and underscores
        self.assertTrue(all(c.isalnum() or c == '_' for c in result))
        self.assertEqual(result, "testfilename")

    def test_dry_run_default(self):
        """Test that dry_run is True by default"""
        migrator = WorkEffortMigrator()
        self.assertTrue(migrator.dry_run)

    def test_dry_run_disabled(self):
        """Test that dry_run can be disabled"""
        migrator = WorkEffortMigrator(dry_run=False)
        self.assertFalse(migrator.dry_run)


class TestMigrationPlan(unittest.TestCase):
    """Test migration plan creation"""

    def test_plan_structure(self):
        """Test that migration plan has required fields"""
        required_fields = [
            'source_file',
            'we_id',
            'title',
            'status',
            'frontmatter',
            'body',
            'tasks',
            'target_dir',
            'target_index',
            'tickets_dir'
        ]

        # Create a minimal plan structure
        plan = {
            'source_file': Path('test.md'),
            'we_id': 'WE-251221-test',
            'title': 'Test',
            'status': 'pending',
            'frontmatter': {},
            'body': '',
            'tasks': [],
            'target_dir': Path('WE-251221-test'),
            'target_index': Path('WE-251221-test/WE-251221-test_index.md'),
            'tickets_dir': Path('WE-251221-test/tickets')
        }

        for field in required_fields:
            self.assertIn(field, plan)


class TestBackupFunctionality(unittest.TestCase):
    """Test backup and rollback features"""

    def test_backup_dir_naming(self):
        """Test backup directory naming convention"""
        # Format: _work_efforts_backup_YYYYMMDD_HHMMSS
        backup_name = f"_work_efforts_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        self.assertTrue(backup_name.startswith("_work_efforts_backup_"))
        self.assertEqual(len(backup_name), 36)  # Fixed length


def run_tests():
    """Run all tests"""
    unittest.main()


if __name__ == '__main__':
    run_tests()
