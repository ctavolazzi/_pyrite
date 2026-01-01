#!/usr/bin/env python3
"""
Test script for plugin base classes

Verifies that the plugin architecture works as expected.
"""

import sys
from datetime import datetime
from pathlib import Path


def test_imports():
    """Test that all imports work correctly"""
    print("Test 1: Imports")
    print("-" * 50)

    try:
        from plugins import (
            BasePlugin,
            ExternalTask,
            WorkEffort,
            generate_we_id,
            sanitize_title,
            validate_folder_name
        )
        print("✓ All imports successful")
        return True
    except ImportError as e:
        print(f"✗ Import failed: {e}")
        return False


def test_abstract_class():
    """Test that BasePlugin cannot be instantiated directly"""
    print("\nTest 2: Abstract Class")
    print("-" * 50)

    from plugins import BasePlugin

    try:
        # This should fail
        plugin = BasePlugin({})
        print("✗ BasePlugin should not be instantiable")
        return False
    except TypeError as e:
        if "abstract" in str(e).lower():
            print("✓ BasePlugin correctly prevents direct instantiation")
            return True
        else:
            print(f"✗ Unexpected error: {e}")
            return False


def test_template_plugin():
    """Test that template plugin can be imported and raises NotImplementedError"""
    print("\nTest 3: Template Plugin")
    print("-" * 50)

    from plugins._template import TemplatePlugin

    try:
        # Create instance
        plugin = TemplatePlugin({'api_key': 'test', 'service_url': 'http://test.com'})
        print(f"✓ Template plugin instantiated: {plugin.name}")

        # Test config validation
        is_valid = plugin.validate_config()
        print(f"✓ Config validation works: {is_valid}")

        # Test that abstract methods raise NotImplementedError
        try:
            plugin.fetch_tasks()
            print("✗ fetch_tasks() should raise NotImplementedError")
            return False
        except NotImplementedError:
            print("✓ fetch_tasks() raises NotImplementedError")

        return True
    except Exception as e:
        print(f"✗ Template plugin failed: {e}")
        return False


def test_event_system():
    """Test that event system works correctly"""
    print("\nTest 4: Event System")
    print("-" * 50)

    from plugins._template import TemplatePlugin

    events_received = []

    def event_handler(event):
        events_received.append(event)

    try:
        plugin = TemplatePlugin({'api_key': 'test', 'service_url': 'http://test.com'})
        plugin.on_event(event_handler)

        # Emit test event
        plugin.emit_event('test.event', {'message': 'hello'})

        if len(events_received) == 1:
            event = events_received[0]
            if (event['plugin'] == 'template' and
                event['type'] == 'test.event' and
                event['data']['message'] == 'hello' and
                'timestamp' in event):
                print("✓ Event system works correctly")
                return True
            else:
                print(f"✗ Event format incorrect: {event}")
                return False
        else:
            print(f"✗ Expected 1 event, got {len(events_received)}")
            return False
    except Exception as e:
        print(f"✗ Event system failed: {e}")
        return False


def test_helpers():
    """Test helper functions"""
    print("\nTest 5: Helper Functions")
    print("-" * 50)

    from plugins import generate_we_id, sanitize_title, validate_folder_name

    try:
        # Test generate_we_id
        we_id = generate_we_id()
        if we_id.startswith('WE-') and len(we_id) == 14:
            print(f"✓ generate_we_id() works: {we_id}")
        else:
            print(f"✗ Invalid WE ID format: {we_id}")
            return False

        # Test sanitize_title
        title = sanitize_title("Build User Authentication System!")
        if title == "build_user_authentication_system":
            print(f"✓ sanitize_title() works: {title}")
        else:
            print(f"✗ Unexpected sanitized title: {title}")
            return False

        # Test validate_folder_name
        folder_name = f"{we_id}_test_task"
        error = validate_folder_name(folder_name)
        if error is None:
            print(f"✓ validate_folder_name() works: {folder_name}")
        else:
            print(f"✗ Validation failed: {error}")
            return False

        return True
    except Exception as e:
        print(f"✗ Helper functions failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_dataclasses():
    """Test that dataclasses can be instantiated"""
    print("\nTest 6: Dataclasses")
    print("-" * 50)

    from plugins import ExternalTask, WorkEffort

    try:
        # Create ExternalTask
        task = ExternalTask(
            id='test-123',
            title='Test Task',
            description='Test description',
            created=datetime.now(),
            due_date=None,
            labels=['test', 'demo'],
            url='https://example.com/task/123',
            raw_data={'id': 'test-123'}
        )
        print(f"✓ ExternalTask created: {task.id}")

        # Create WorkEffort
        we = WorkEffort(
            we_id='WE-260101-test',
            folder_path=Path('_work_efforts/WE-260101-test_task'),
            index_path=Path('_work_efforts/WE-260101-test_task/WE-260101-test_index.md'),
            tickets_dir=Path('_work_efforts/WE-260101-test_task/tickets'),
            source_task=task
        )
        print(f"✓ WorkEffort created: {we.we_id}")

        return True
    except Exception as e:
        print(f"✗ Dataclasses failed: {e}")
        return False


def main():
    """Run all tests"""
    print("=" * 50)
    print("Plugin System Tests")
    print("=" * 50)

    tests = [
        test_imports,
        test_dataclasses,
        test_abstract_class,
        test_template_plugin,
        test_event_system,
        test_helpers
    ]

    results = [test() for test in tests]

    print("\n" + "=" * 50)
    print("Test Results")
    print("=" * 50)
    passed = sum(results)
    total = len(results)
    print(f"Passed: {passed}/{total}")

    if passed == total:
        print("✓ All tests passed!")
        return 0
    else:
        print(f"✗ {total - passed} test(s) failed")
        return 1


if __name__ == '__main__':
    sys.exit(main())
