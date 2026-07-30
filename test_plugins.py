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

    # No try/except: an ImportError here IS the failure, and swallowing it
    # was what let this test report success while returning False.
    from plugins import (  # noqa: F401
        BasePlugin,
        ExternalTask,
        WorkEffort,
        generate_we_id,
        sanitize_title,
        validate_folder_name
    )
    print("✓ All imports successful")


def test_abstract_class():
    """Test that BasePlugin cannot be instantiated directly"""
    print("\nTest 2: Abstract Class")
    print("-" * 50)

    from plugins import BasePlugin

    try:
        BasePlugin({})
    except TypeError as e:
        assert "abstract" in str(e).lower(), \
            f"BasePlugin raised TypeError but not about abstractness: {e}"
        print("✓ BasePlugin correctly prevents direct instantiation")
    else:
        raise AssertionError("BasePlugin should not be instantiable, but was")


def test_template_plugin():
    """Test that template plugin can be imported and raises NotImplementedError"""
    print("\nTest 3: Template Plugin")
    print("-" * 50)

    from plugins._template import TemplatePlugin

    plugin = TemplatePlugin({'api_key': 'test', 'service_url': 'http://test.com'})
    print(f"✓ Template plugin instantiated: {plugin.name}")

    is_valid = plugin.validate_config()
    assert is_valid is True, f"validate_config() returned {is_valid!r}, expected True"
    print(f"✓ Config validation works: {is_valid}")

    try:
        plugin.fetch_tasks()
    except NotImplementedError:
        print("✓ fetch_tasks() raises NotImplementedError")
    else:
        raise AssertionError("fetch_tasks() should raise NotImplementedError")


def test_event_system():
    """Test that event system works correctly"""
    print("\nTest 4: Event System")
    print("-" * 50)

    from plugins._template import TemplatePlugin

    events_received = []

    def event_handler(event):
        events_received.append(event)

    plugin = TemplatePlugin({'api_key': 'test', 'service_url': 'http://test.com'})
    plugin.on_event(event_handler)
    plugin.emit_event('test.event', {'message': 'hello'})

    assert len(events_received) == 1, \
        f"expected exactly 1 event, got {len(events_received)}"
    event = events_received[0]
    assert event['plugin'] == 'template', f"wrong plugin: {event['plugin']}"
    assert event['type'] == 'test.event', f"wrong type: {event['type']}"
    assert event['data']['message'] == 'hello', f"wrong payload: {event['data']}"
    assert 'timestamp' in event, "event carries no timestamp"
    print("✓ Event system works correctly")


def test_helpers():
    """Test helper functions"""
    print("\nTest 5: Helper Functions")
    print("-" * 50)

    from plugins import generate_we_id, sanitize_title, validate_folder_name

    we_id = generate_we_id()
    assert we_id.startswith('WE-'), f"WE ID has no WE- prefix: {we_id}"
    assert len(we_id) == 14, f"WE ID is {len(we_id)} chars, expected 14: {we_id}"
    print(f"✓ generate_we_id() works: {we_id}")

    title = sanitize_title("Build User Authentication System!")
    assert title == "build_user_authentication_system", \
        f"unexpected sanitized title: {title}"
    print(f"✓ sanitize_title() works: {title}")

    folder_name = f"{we_id}_test_task"
    error = validate_folder_name(folder_name)
    assert error is None, f"a valid folder name was rejected: {error}"
    print(f"✓ validate_folder_name() accepts a good name: {folder_name}")

    # The negative half. Without this, the assertion above passes just as
    # happily against a validator that returns None for everything, which is
    # exactly what this one did until the naming-linter import was repaired.
    bad = validate_folder_name("WE-260730-abcd_Has_Capitals")
    assert bad is not None, \
        "validate_folder_name accepted an invalid name, so it is not validating"
    print("✓ validate_folder_name() rejects a bad name")


def test_dataclasses():
    """Test that dataclasses can be instantiated"""
    print("\nTest 6: Dataclasses")
    print("-" * 50)

    from plugins import ExternalTask, WorkEffort

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
    assert task.id == 'test-123', f"ExternalTask lost its id: {task.id}"
    assert task.labels == ['test', 'demo'], f"ExternalTask lost labels: {task.labels}"
    print(f"✓ ExternalTask created: {task.id}")

    we = WorkEffort(
        we_id='WE-260101-test',
        folder_path=Path('_work_efforts/WE-260101-test_task'),
        index_path=Path('_work_efforts/WE-260101-test_task/WE-260101-test_index.md'),
        tickets_dir=Path('_work_efforts/WE-260101-test_task/tickets'),
        source_task=task
    )
    assert we.we_id == 'WE-260101-test', f"WorkEffort lost its id: {we.we_id}"
    assert we.source_task is task, "WorkEffort did not keep its source task"
    print(f"✓ WorkEffort created: {we.we_id}")


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

    # The tests assert rather than returning a bool, so failure arrives as an
    # exception. That is the point: pytest ignores a returned False and
    # reported this whole file as passing no matter what it found.
    failures = []
    for test in tests:
        try:
            test()
        except Exception as e:
            failures.append((test.__name__, e))
            print(f"✗ {test.__name__} FAILED: {e}")

    print("\n" + "=" * 50)
    print("Test Results")
    print("=" * 50)
    total = len(tests)
    passed = total - len(failures)
    print(f"Passed: {passed}/{total}")

    if not failures:
        print("✓ All tests passed!")
        return 0

    print(f"✗ {len(failures)} test(s) failed")
    for name, error in failures:
        print(f"  {name}: {error}")
    return 1


if __name__ == '__main__':
    sys.exit(main())
