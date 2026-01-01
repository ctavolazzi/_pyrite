# Plugin Template

This directory contains a template for creating new external service integrations.

## Quick Start

To create a new plugin:

1. **Copy this directory**:
   ```bash
   cp -r plugins/_template plugins/your-service-name
   ```

2. **Rename the plugin class**:
   - Edit `plugin.py`
   - Change `TemplatePlugin` to `YourServicePlugin`
   - Update the `name` property

3. **Implement abstract methods**:
   - `validate_config()` - Validate API credentials
   - `fetch_tasks()` - Get tasks from external API
   - `create_work_effort()` - Convert task to work effort
   - `post_feedback()` - Comment back to external task
   - `cleanup()` - Remove trigger label

4. **Add API client** (if needed):
   - Create `api.py` for service-specific API calls
   - Handle authentication, rate limiting, etc.

5. **Test your plugin**:
   ```python
   from plugins.your_service import YourServicePlugin

   plugin = YourServicePlugin({
       'api_key': 'your-key',
       'service_url': 'https://api.service.com'
   })

   # Validate config
   plugin.validate_config()

   # Fetch tasks
   tasks = plugin.fetch_tasks()

   # Process each task
   for task in tasks:
       we = plugin.create_work_effort(task)
       plugin.post_feedback(task, we)
       plugin.cleanup(task)
   ```

## Configuration

Each plugin requires a configuration dictionary passed to `__init__`. Common keys:

- `api_key` - API authentication token
- `service_url` - Base URL for API
- Plugin-specific settings (project ID, workspace, etc.)

## Implementation Guide

### 1. validate_config()

Check that all required configuration is present and valid:

```python
def validate_config(self) -> bool:
    required = ['api_key', 'workspace_id']
    for key in required:
        if key not in self.config:
            raise ValueError(f"Missing required config: {key}")
    return True
```

### 2. fetch_tasks()

Query your external service for tasks that need processing:

```python
def fetch_tasks(self) -> List[ExternalTask]:
    # 1. Make API request
    response = self.api_client.get_tasks(label='create-we')

    # 2. Convert to ExternalTask objects
    tasks = []
    for item in response:
        task = ExternalTask(
            id=item['id'],
            title=item['title'],
            description=item.get('description'),
            created=datetime.fromisoformat(item['created_at']),
            due_date=parse_due_date(item.get('due')),
            labels=item.get('labels', []),
            url=item['url'],
            raw_data=item
        )
        tasks.append(task)

    return tasks
```

### 3. create_work_effort()

Convert external task to work effort structure:

```python
def create_work_effort(self, task: ExternalTask) -> WorkEffort:
    from tools.naming_linter.rules.common import validate_we_folder_name

    # Generate WE ID (WE-YYMMDD-xxxx)
    we_id = self._generate_we_id()

    # Create folder name
    sanitized_title = self._sanitize_title(task.title)
    folder_name = f"{we_id}_{sanitized_title}"

    # Validate BEFORE creating (uses naming linter!)
    error = validate_we_folder_name(folder_name)
    if error:
        raise ValueError(f"Invalid folder name: {error}")

    # Create directory structure
    folder_path = Path("_work_efforts") / folder_name
    folder_path.mkdir(parents=True, exist_ok=True)

    tickets_dir = folder_path / "tickets"
    tickets_dir.mkdir(exist_ok=True)

    # Create index file
    index_path = folder_path / f"{we_id}_index.md"
    self._create_index_file(index_path, task)

    return WorkEffort(
        we_id=we_id,
        folder_path=folder_path,
        index_path=index_path,
        tickets_dir=tickets_dir,
        source_task=task
    )
```

### 4. post_feedback()

Post a comment back to the external task:

```python
def post_feedback(self, task: ExternalTask, work_effort: WorkEffort) -> bool:
    message = (
        f"Work effort created!\n\n"
        f"📁 Folder: `{work_effort.folder_path.name}`\n"
        f"📋 Index: `{work_effort.index_path.name}`\n"
        f"🎫 Tickets: `{work_effort.tickets_dir.name}/`"
    )

    try:
        self.api_client.add_comment(task.id, message)
        return True
    except Exception as e:
        self.emit_event('plugin.error', {
            'task_id': task.id,
            'error': str(e)
        })
        return False
```

### 5. cleanup()

Remove trigger label or mark task as processed:

```python
def cleanup(self, task: ExternalTask) -> bool:
    try:
        # Remove trigger label
        self.api_client.remove_label(task.id, 'create-we')
        return True
    except Exception as e:
        self.emit_event('plugin.error', {
            'task_id': task.id,
            'error': str(e)
        })
        return False
```

## Event System

Plugins can emit events for dashboard monitoring:

```python
# Emit events at key points
self.emit_event('plugin.task.fetched', {
    'task_id': task.id,
    'title': task.title
})

self.emit_event('plugin.work_effort.created', {
    'task_id': task.id,
    'we_id': work_effort.we_id
})

self.emit_event('plugin.feedback.posted', {
    'task_id': task.id
})

self.emit_event('plugin.cleanup.completed', {
    'task_id': task.id
})
```

## Helper Methods

Recommended helper methods to implement:

### Generate Work Effort ID

```python
def _generate_we_id(self) -> str:
    """Generate WE-YYMMDD-xxxx format ID"""
    import random
    import string
    from datetime import datetime

    date_str = datetime.now().strftime('%y%m%d')
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
    return f"WE-{date_str}-{random_str}"
```

### Sanitize Title

```python
def _sanitize_title(self, title: str) -> str:
    """Convert title to valid folder name"""
    import re

    # Convert to lowercase
    title = title.lower()

    # Replace spaces and special chars with underscores
    title = re.sub(r'[^a-z0-9]+', '_', title)

    # Remove leading/trailing underscores
    title = title.strip('_')

    # Truncate if too long
    max_length = 50
    if len(title) > max_length:
        title = title[:max_length].rstrip('_')

    return title
```

### Create Index File

```python
def _create_index_file(self, path: Path, task: ExternalTask):
    """Create index markdown with YAML frontmatter"""
    content = f"""---
id: {path.stem}
title: "{task.title}"
created: {task.created.isoformat()}
source: {self.name}
source_url: {task.url}
labels: {task.labels}
---

# {task.title}

## Description

{task.description or 'No description provided'}

## Source Task

- **Service**: {self.name}
- **ID**: {task.id}
- **URL**: {task.url}
- **Created**: {task.created.strftime('%Y-%m-%d %H:%M')}
- **Labels**: {', '.join(task.labels)}

## Next Steps

1. Review task requirements
2. Create tickets in `tickets/` directory
3. Begin implementation
"""

    path.write_text(content)
```

## Integration with Naming Linter

**CRITICAL**: Always use the naming linter to validate folder names before creating:

```python
from tools.naming_linter.rules.common import validate_we_folder_name

folder_name = f"{we_id}_{sanitized_title}"
error = validate_we_folder_name(folder_name)
if error:
    raise ValueError(f"Invalid folder name: {error}")
```

This ensures all work efforts follow the WE-YYMMDD-xxxx naming convention.

## Testing

Create a test script for your plugin:

```python
# test_your_plugin.py
from plugins.your_service import YourServicePlugin

def test_plugin():
    config = {
        'api_key': 'test-key',
        'service_url': 'https://api.test.com'
    }

    plugin = YourServicePlugin(config)

    # Test config validation
    assert plugin.validate_config()

    # Test fetch (with mocked API)
    tasks = plugin.fetch_tasks()
    assert len(tasks) > 0

    # Test work effort creation
    we = plugin.create_work_effort(tasks[0])
    assert we.folder_path.exists()

if __name__ == '__main__':
    test_plugin()
```

## Next Steps

1. Review the base classes in `plugins/base.py`
2. Study the Todoist plugin implementation (when available)
3. Read the naming linter docs: `tools/naming-linter/README.md`
4. Implement your service integration
5. Test thoroughly with real API calls
6. Submit PR with your new plugin!

## Resources

- Base classes: `plugins/base.py`
- Naming linter: `tools/naming-linter/`
- Work effort migrator (ID generation): `tools/work-effort-migrator/migrate.py`
- Todoist example: `plugins/todoist/` (Phase 3)
