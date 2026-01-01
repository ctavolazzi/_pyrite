#!/usr/bin/env python3
"""
Todoist Plugin Tests

Tests for Todoist integration including:
- API client functionality
- Plugin configuration and validation
- Task processing workflow
- Mock tests (no real API calls)
- Integration tests (with real API - optional)
"""

import os
import sys
import tempfile
import shutil
from pathlib import Path
from datetime import datetime
from unittest.mock import Mock, patch, MagicMock

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from plugins.todoist import TodoistPlugin
from plugins.todoist.api import TodoistAPI, TodoistAPIError
from plugins.base import ExternalTask, WorkEffort


# Test configuration
MOCK_CONFIG = {
    'api_token': 'test-token-12345',
    'trigger_label': 'pyrite',
    'work_efforts_dir': '_test_work_efforts'
}

MOCK_TASK_DATA = {
    'id': 'task-123',
    'content': 'Build User Authentication System',
    'description': 'Implement login and signup functionality',
    'created_at': '2026-01-01T10:00:00Z',
    'labels': ['pyrite', 'backend', 'urgent'],
    'url': 'https://todoist.com/showTask?id=task-123',
    'due': {
        'datetime': '2026-01-15T17:00:00Z'
    }
}


def print_test_header(title: str):
    """Print formatted test section header"""
    print(f"\n{'='*60}")
    print(f"{title}")
    print(f"{'-'*60}")


def test_api_client():
    """Test Todoist API client initialization and methods"""
    print_test_header("Test 1: API Client")

    # Test initialization
    api = TodoistAPI('test-token')
    assert api.api_token == 'test-token'
    assert 'Bearer test-token' in api.session.headers['Authorization']
    print("✓ API client initialized")

    # Test URL construction
    assert api.BASE_URL == "https://api.todoist.com/rest/v2"
    print("✓ API base URL correct")

    return True


def test_plugin_initialization():
    """Test TodoistPlugin initialization"""
    print_test_header("Test 2: Plugin Initialization")

    plugin = TodoistPlugin(MOCK_CONFIG)

    # Test properties
    assert plugin.name == "todoist"
    print(f"✓ Plugin name: {plugin.name}")

    assert plugin.config['trigger_label'] == 'pyrite'
    print(f"✓ Trigger label: {plugin.config['trigger_label']}")

    assert plugin.config['work_efforts_dir'] == '_test_work_efforts'
    print(f"✓ Work efforts dir: {plugin.config['work_efforts_dir']}")

    return True


def test_config_validation():
    """Test configuration validation"""
    print_test_header("Test 3: Configuration Validation")

    # Test missing api_token
    try:
        plugin = TodoistPlugin({})
        plugin.validate_config()
        print("✗ Should have raised ValueError for missing api_token")
        return False
    except ValueError as e:
        print(f"✓ Correctly rejects missing api_token: {str(e)}")

    # Test empty api_token
    try:
        plugin = TodoistPlugin({'api_token': ''})
        plugin.validate_config()
        print("✗ Should have raised ValueError for empty api_token")
        return False
    except ValueError as e:
        print(f"✓ Correctly rejects empty api_token: {str(e)}")

    # Test invalid trigger_label
    try:
        plugin = TodoistPlugin({'api_token': 'test', 'trigger_label': ''})
        plugin.validate_config()
        print("✗ Should have raised ValueError for empty trigger_label")
        return False
    except ValueError as e:
        print(f"✓ Correctly rejects empty trigger_label: {str(e)}")

    return True


def test_task_conversion():
    """Test converting Todoist API response to ExternalTask"""
    print_test_header("Test 4: Task Conversion")

    plugin = TodoistPlugin(MOCK_CONFIG)

    # Convert mock task data
    task = plugin._convert_to_external_task(MOCK_TASK_DATA)

    # Verify fields
    assert task.id == 'task-123'
    print(f"✓ Task ID: {task.id}")

    assert task.title == 'Build User Authentication System'
    print(f"✓ Task title: {task.title}")

    assert task.description == 'Implement login and signup functionality'
    print(f"✓ Task description: {task.description[:30]}...")

    assert 'pyrite' in task.labels
    print(f"✓ Task labels: {', '.join(task.labels)}")

    assert task.url == 'https://todoist.com/showTask?id=task-123'
    print(f"✓ Task URL: {task.url}")

    assert isinstance(task.created, datetime)
    print(f"✓ Created date: {task.created.isoformat()}")

    assert isinstance(task.due_date, datetime)
    print(f"✓ Due date: {task.due_date.isoformat()}")

    return True


def test_work_effort_creation():
    """Test work effort creation from task"""
    print_test_header("Test 5: Work Effort Creation")

    # Create temp directory for testing
    temp_dir = tempfile.mkdtemp()
    test_config = MOCK_CONFIG.copy()
    test_config['work_efforts_dir'] = temp_dir

    try:
        plugin = TodoistPlugin(test_config)

        # Create mock task
        task = plugin._convert_to_external_task(MOCK_TASK_DATA)

        # Create work effort
        work_effort = plugin.create_work_effort(task)

        # Verify WorkEffort object
        assert work_effort.we_id.startswith('WE-')
        print(f"✓ Work effort ID: {work_effort.we_id}")

        assert work_effort.folder_path.exists()
        print(f"✓ Folder created: {work_effort.folder_path.name}")

        assert work_effort.index_path.exists()
        print(f"✓ Index file created: {work_effort.index_path.name}")

        assert work_effort.tickets_dir.exists()
        print(f"✓ Tickets directory created: {work_effort.tickets_dir.name}")

        # Verify index file content
        content = work_effort.index_path.read_text()
        assert 'Build User Authentication System' in content
        assert 'todoist' in content
        print(f"✓ Index file contains task metadata")

        # Verify naming convention
        folder_name = work_effort.folder_path.name
        assert folder_name.startswith('WE-')
        assert 'build_user_authentication_system' in folder_name
        print(f"✓ Folder name follows convention: {folder_name}")

        return True

    finally:
        # Cleanup
        shutil.rmtree(temp_dir, ignore_errors=True)


def test_feedback_message_formatting():
    """Test feedback message formatting"""
    print_test_header("Test 6: Feedback Message Formatting")

    plugin = TodoistPlugin(MOCK_CONFIG)

    # Create mock work effort
    mock_we = WorkEffort(
        we_id='WE-260101-test',
        folder_path=Path('_work_efforts/WE-260101-test_my_task'),
        index_path=Path('_work_efforts/WE-260101-test_my_task/WE-260101-test_index.md'),
        tickets_dir=Path('_work_efforts/WE-260101-test_my_task/tickets'),
        source_task=None
    )

    # Format message
    message = plugin._format_feedback_message(mock_we)

    # Verify message content
    assert 'Work Effort Created' in message
    assert 'WE-260101-test_my_task' in message
    assert 'WE-260101-test_index.md' in message
    assert 'tickets/' in message
    print(f"✓ Feedback message formatted correctly")

    return True


def test_event_system():
    """Test event emission"""
    print_test_header("Test 7: Event System")

    plugin = TodoistPlugin(MOCK_CONFIG)

    # Track events
    events = []

    def event_handler(event):
        events.append(event)

    plugin.on_event(event_handler)

    # Emit test event
    plugin.emit_event('plugin.test', {'foo': 'bar'})

    # Verify event
    assert len(events) == 1
    print(f"✓ Event emitted: {events[0]['type']}")

    assert events[0]['plugin'] == 'todoist'
    print(f"✓ Event plugin: {events[0]['plugin']}")

    assert events[0]['data']['foo'] == 'bar'
    print(f"✓ Event data: {events[0]['data']}")

    assert 'timestamp' in events[0]
    print(f"✓ Event timestamp: {events[0]['timestamp']}")

    return True


def test_mocked_workflow():
    """Test complete workflow with mocked API"""
    print_test_header("Test 8: Mocked Workflow")

    temp_dir = tempfile.mkdtemp()
    test_config = MOCK_CONFIG.copy()
    test_config['work_efforts_dir'] = temp_dir

    try:
        plugin = TodoistPlugin(test_config)

        # Mock API methods
        plugin.api = Mock()
        plugin.api.validate_token = Mock(return_value=True)
        plugin.api.get_tasks = Mock(return_value=[MOCK_TASK_DATA])
        plugin.api.add_comment = Mock(return_value={'id': 'comment-123'})
        plugin.api.remove_label_from_task = Mock(return_value={})

        # 1. Fetch tasks
        tasks = plugin.fetch_tasks()
        assert len(tasks) == 1
        print(f"✓ Fetched {len(tasks)} task(s)")

        # 2. Create work effort
        task = tasks[0]
        work_effort = plugin.create_work_effort(task)
        assert work_effort.folder_path.exists()
        print(f"✓ Created work effort: {work_effort.we_id}")

        # 3. Post feedback
        success = plugin.post_feedback(task, work_effort)
        assert success
        plugin.api.add_comment.assert_called_once()
        print(f"✓ Posted feedback to Todoist")

        # 4. Cleanup
        success = plugin.cleanup(task)
        assert success
        plugin.api.remove_label_from_task.assert_called_once_with('task-123', 'pyrite')
        print(f"✓ Removed trigger label")

        print(f"\n✓ Complete workflow successful!")

        return True

    finally:
        # Cleanup
        shutil.rmtree(temp_dir, ignore_errors=True)


def run_all_tests():
    """Run all tests and report results"""
    print("="*60)
    print("Todoist Plugin Tests")
    print("="*60)

    tests = [
        ("API Client", test_api_client),
        ("Plugin Initialization", test_plugin_initialization),
        ("Configuration Validation", test_config_validation),
        ("Task Conversion", test_task_conversion),
        ("Work Effort Creation", test_work_effort_creation),
        ("Feedback Message Formatting", test_feedback_message_formatting),
        ("Event System", test_event_system),
        ("Mocked Workflow", test_mocked_workflow),
    ]

    passed = 0
    failed = 0
    errors = []

    for name, test_func in tests:
        try:
            result = test_func()
            if result:
                passed += 1
            else:
                failed += 1
                errors.append(f"{name}: Test returned False")
        except Exception as e:
            failed += 1
            errors.append(f"{name}: {str(e)}")
            import traceback
            print(f"\n✗ Exception in {name}:")
            traceback.print_exc()

    # Print summary
    print("\n" + "="*60)
    print("Test Results")
    print("="*60)
    print(f"Passed: {passed}/{len(tests)}")
    print(f"Failed: {failed}/{len(tests)}")

    if errors:
        print("\nErrors:")
        for error in errors:
            print(f"  ✗ {error}")
    else:
        print("\n✓ All tests passed!")

    return failed == 0


if __name__ == '__main__':
    success = run_all_tests()
    sys.exit(0 if success else 1)
