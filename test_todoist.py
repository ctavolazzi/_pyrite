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


def test_parse_subtasks():
    """Test Phase 4: Subtask parsing from task description"""
    print_test_header("Test 8: Parse Subtasks (Phase 4)")

    plugin = TodoistPlugin(MOCK_CONFIG)

    # Test task with subtasks
    task_with_subtasks = ExternalTask(
        id='task-456',
        title='Build Auth System',
        description="""Build authentication system

- [ ] Create login form
- [ ] Add password reset
- [ ] Implement OAuth
- [x] Setup database

Additional notes here
""",
        created=datetime.now(),
        due_date=None,
        labels=['pyrite'],
        url='https://todoist.com/task-456',
        raw_data={}
    )

    subtasks = plugin.parse_subtasks(task_with_subtasks)

    assert len(subtasks) == 4, f"Expected 4 subtasks, got {len(subtasks)}"
    print(f"✓ Parsed {len(subtasks)} subtasks")

    assert 'Create login form' in subtasks
    assert 'Add password reset' in subtasks
    assert 'Implement OAuth' in subtasks
    assert 'Setup database' in subtasks
    print(f"✓ All subtask titles extracted correctly")

    # Test task with no subtasks
    task_no_subtasks = ExternalTask(
        id='task-789',
        title='Simple task',
        description='Just a description without checkboxes',
        created=datetime.now(),
        due_date=None,
        labels=['pyrite'],
        url='https://todoist.com/task-789',
        raw_data={}
    )

    no_subtasks = plugin.parse_subtasks(task_no_subtasks)
    assert len(no_subtasks) == 0
    print(f"✓ Correctly returns empty list for no subtasks")

    return True


def test_find_work_effort():
    """Test Phase 4: Finding existing work efforts"""
    print_test_header("Test 9: Find Work Effort (Phase 4)")

    temp_dir = tempfile.mkdtemp()
    test_config = MOCK_CONFIG.copy()
    test_config['work_efforts_dir'] = temp_dir

    try:
        plugin = TodoistPlugin(test_config)

        # Create a work effort first
        task = plugin._convert_to_external_task(MOCK_TASK_DATA)
        we = plugin.create_work_effort(task)
        we_id = we.we_id

        print(f"✓ Created test work effort: {we_id}")

        # Try to find it
        found_path = plugin.find_work_effort(we_id)

        assert found_path is not None, "Should find existing work effort"
        assert found_path.exists(), "Found path should exist"
        assert str(we_id) in str(found_path), "Path should contain WE-ID"
        print(f"✓ Successfully found work effort: {found_path.name}")

        # Try to find non-existent WE
        not_found = plugin.find_work_effort('WE-999999-none')
        assert not_found is None, "Should return None for non-existent WE"
        print(f"✓ Correctly returns None for non-existent WE")

        return True

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


def test_ticket_creation():
    """Test Phase 4: Creating tickets from subtasks"""
    print_test_header("Test 10: Ticket Creation (Phase 4)")

    temp_dir = tempfile.mkdtemp()
    test_config = MOCK_CONFIG.copy()
    test_config['work_efforts_dir'] = temp_dir

    try:
        plugin = TodoistPlugin(test_config)

        # Create a work effort first
        task = plugin._convert_to_external_task(MOCK_TASK_DATA)
        we = plugin.create_work_effort(task)

        # Create tickets
        ticket1 = plugin.create_ticket(
            we_path=we.folder_path,
            we_id=we.we_id,
            title='Create login form',
            description='Build the login UI',
            source_task_id='task-123',
            source_url='https://todoist.com/task-123'
        )

        ticket2 = plugin.create_ticket(
            we_path=we.folder_path,
            we_id=we.we_id,
            title='Add password reset',
            description='Implement password reset flow',
            source_task_id='task-123',
            source_url='https://todoist.com/task-123'
        )

        # Verify tickets were created
        assert ticket1.exists(), "First ticket should exist"
        assert ticket2.exists(), "Second ticket should exist"
        print(f"✓ Created 2 tickets: {ticket1.name}, {ticket2.name}")

        # Verify ticket naming
        assert 'TKT-' in ticket1.name
        assert '001' in ticket1.name
        assert '002' in ticket2.name
        print(f"✓ Ticket IDs follow TKT-xxxx-NNN format")

        # Verify ticket content
        content1 = ticket1.read_text()
        assert 'Create login form' in content1
        assert 'task-123' in content1
        print(f"✓ Ticket contains correct metadata")

        return True

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


def test_we_linking():
    """Test Phase 4: Linking to existing work efforts"""
    print_test_header("Test 11: WE Linking (Phase 4)")

    temp_dir = tempfile.mkdtemp()
    test_config = MOCK_CONFIG.copy()
    test_config['work_efforts_dir'] = temp_dir

    try:
        plugin = TodoistPlugin(test_config)

        # Create initial work effort
        task1_data = MOCK_TASK_DATA.copy()
        task1_data['id'] = 'task-001'
        task1_data['content'] = 'Build Auth System'
        task1_data['description'] = 'Initial task'
        task1 = plugin._convert_to_external_task(task1_data)
        we1 = plugin.create_work_effort(task1)

        print(f"✓ Created initial work effort: {we1.we_id}")
        assert not we1.linked_to_existing, "First WE should not be linked"

        # Create second task that references the first WE
        task2_data = MOCK_TASK_DATA.copy()
        task2_data['id'] = 'task-002'
        task2_data['content'] = f'Frontend Auth UI {we1.we_id}'
        task2_data['description'] = 'Build login form'
        task2 = plugin._convert_to_external_task(task2_data)
        we2 = plugin.create_work_effort(task2)

        print(f"✓ Created second task referencing {we1.we_id}")

        # Verify linking
        assert we2.linked_to_existing, "Second WE should be linked"
        assert we2.we_id == we1.we_id, "Should use same WE-ID"
        assert we2.folder_path == we1.folder_path, "Should use same folder"
        print(f"✓ Successfully linked to existing WE")

        return True

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


def test_case_insensitive_we_linking():
    """Test Phase 4: Case-insensitive WE-ID linking (Bug Fix)"""
    print_test_header("Test 11b: Case-Insensitive WE Linking (Bug Fix)")

    temp_dir = tempfile.mkdtemp()
    test_config = MOCK_CONFIG.copy()
    test_config['work_efforts_dir'] = temp_dir

    try:
        plugin = TodoistPlugin(test_config)

        # Create initial work effort with uppercase WE-ID
        task1_data = MOCK_TASK_DATA.copy()
        task1_data['id'] = 'task-001'
        task1_data['content'] = 'Build Auth System'
        task1 = plugin._convert_to_external_task(task1_data)
        we1 = plugin.create_work_effort(task1)

        print(f"✓ Created work effort: {we1.we_id}")

        # Test 1: Lowercase WE-ID reference
        task2_data = MOCK_TASK_DATA.copy()
        task2_data['id'] = 'task-002'
        task2_data['content'] = f'Frontend work {we1.we_id.lower()}'  # lowercase!
        task2 = plugin._convert_to_external_task(task2_data)
        we2 = plugin.create_work_effort(task2)

        assert we2.linked_to_existing, "Should link despite lowercase WE-ID"
        assert we2.we_id == we1.we_id, "Should normalize to correct WE-ID"
        print(f"✓ Linked successfully with lowercase: {we1.we_id.lower()}")

        # Test 2: Mixed case WE-ID reference
        task3_data = MOCK_TASK_DATA.copy()
        task3_data['id'] = 'task-003'
        # Mix case: "We" instead of "WE", uppercase suffix
        mixed_case = f"We-{we1.we_id.split('-')[1]}-{we1.we_id.split('-')[2].upper()}"
        task3_data['content'] = f'Backend work {mixed_case}'
        task3 = plugin._convert_to_external_task(task3_data)
        we3 = plugin.create_work_effort(task3)

        assert we3.linked_to_existing, "Should link despite mixed case WE-ID"
        assert we3.we_id == we1.we_id, "Should normalize to correct WE-ID"
        print(f"✓ Linked successfully with mixed case: {mixed_case}")

        return True

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


def test_subtasks_to_tickets_workflow():
    """Test Phase 4: Complete workflow with subtasks → tickets"""
    print_test_header("Test 12: Subtasks → Tickets Workflow (Phase 4)")

    temp_dir = tempfile.mkdtemp()
    test_config = MOCK_CONFIG.copy()
    test_config['work_efforts_dir'] = temp_dir

    try:
        plugin = TodoistPlugin(test_config)

        # Create task with subtasks
        task_data = MOCK_TASK_DATA.copy()
        task_data['description'] = """Build authentication system

- [ ] Create login form
- [ ] Add password reset
- [ ] Implement OAuth"""

        task = plugin._convert_to_external_task(task_data)

        # Create work effort (should parse subtasks and create tickets)
        we = plugin.create_work_effort(task)

        # Verify tickets were created
        assert len(we.created_tickets) == 3, f"Expected 3 tickets, got {len(we.created_tickets)}"
        print(f"✓ Created {len(we.created_tickets)} tickets from subtasks")

        # Verify ticket files exist
        for ticket_path in we.created_tickets:
            assert ticket_path.exists(), f"Ticket {ticket_path.name} should exist"
        print(f"✓ All ticket files exist")

        # Verify ticket content
        ticket_names = [t.name for t in we.created_tickets]
        assert any('create_login_form' in name for name in ticket_names)
        assert any('add_password_reset' in name for name in ticket_names)
        assert any('implement_oauth' in name for name in ticket_names)
        print(f"✓ Ticket names match subtask titles")

        return True

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


def test_enhanced_feedback():
    """Test Phase 4: Enhanced feedback messages"""
    print_test_header("Test 13: Enhanced Feedback (Phase 4)")

    plugin = TodoistPlugin(MOCK_CONFIG)

    # Test feedback for new WE with tickets
    mock_we_with_tickets = WorkEffort(
        we_id='WE-260102-auth',
        folder_path=Path('_work_efforts/WE-260102-auth_authentication'),
        index_path=Path('_work_efforts/WE-260102-auth_authentication/WE-260102-auth_index.md'),
        tickets_dir=Path('_work_efforts/WE-260102-auth_authentication/tickets'),
        source_task=None,
        created_tickets=[
            Path('tickets/TKT-auth-001_create_login_form.md'),
            Path('tickets/TKT-auth-002_add_password_reset.md'),
        ],
        linked_to_existing=False
    )

    message = plugin._format_feedback_message(mock_we_with_tickets)

    assert 'Work Effort Created: WE-260102-auth' in message
    assert 'Tickets Created' in message and '(2)' in message
    assert 'TKT-auth-001' in message
    assert 'TKT-auth-002' in message
    print(f"✓ Enhanced feedback includes ticket list")

    # Test feedback for linked WE
    mock_we_linked = WorkEffort(
        we_id='WE-260102-auth',
        folder_path=Path('_work_efforts/WE-260102-auth_authentication'),
        index_path=Path('_work_efforts/WE-260102-auth_authentication/WE-260102-auth_index.md'),
        tickets_dir=Path('_work_efforts/WE-260102-auth_authentication/tickets'),
        source_task=None,
        created_tickets=[],
        linked_to_existing=True
    )

    linked_message = plugin._format_feedback_message(mock_we_linked)

    assert 'Linked to Existing Work Effort: WE-260102-auth' in linked_message
    print(f"✓ Linked WE shows correct header")

    return True


def test_mocked_workflow():
    """Test complete workflow with mocked API"""
    print_test_header("Test 14: Mocked Workflow")

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
    print("Todoist Plugin Tests (Phase 3 + Phase 4)")
    print("="*60)

    tests = [
        # Phase 3 tests
        ("API Client", test_api_client),
        ("Plugin Initialization", test_plugin_initialization),
        ("Configuration Validation", test_config_validation),
        ("Task Conversion", test_task_conversion),
        ("Work Effort Creation", test_work_effort_creation),
        ("Feedback Message Formatting", test_feedback_message_formatting),
        ("Event System", test_event_system),
        # Phase 4 tests
        ("Parse Subtasks", test_parse_subtasks),
        ("Find Work Effort", test_find_work_effort),
        ("Ticket Creation", test_ticket_creation),
        ("WE Linking", test_we_linking),
        ("Case-Insensitive WE Linking", test_case_insensitive_we_linking),
        ("Subtasks → Tickets Workflow", test_subtasks_to_tickets_workflow),
        ("Enhanced Feedback", test_enhanced_feedback),
        # Integration test
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
