# Plugin System

External service integration architecture for the _pyrite work effort system.

## Overview

The plugin system enables automatic creation of work efforts from external task management services (Todoist, GitHub Issues, Jira, etc.). When a task in an external service is labeled with a trigger tag, the plugin:

1. Fetches the task from the external API
2. Creates a properly formatted work effort structure
3. Posts feedback (comment) back to the external task
4. Removes the trigger label

This creates a seamless bridge between external task tracking and the local work effort system.

## Architecture

### Core Components

```
plugins/
├── __init__.py          # Package exports
├── base.py              # Abstract base classes
├── helpers.py           # Common utilities
├── _template/           # Template for new plugins
│   ├── __init__.py
│   ├── plugin.py        # Example implementation
│   └── README.md        # Developer guide
└── {service}/           # Service-specific plugins
    ├── __init__.py
    ├── plugin.py        # Plugin implementation
    ├── api.py           # API client (optional)
    └── README.md        # Service documentation
```

### Base Classes

#### ExternalTask

Dataclass representing a task from an external service:

```python
@dataclass
class ExternalTask:
    id: str                      # External task ID
    title: str                   # Task title
    description: Optional[str]   # Task description
    created: datetime            # Creation timestamp
    due_date: Optional[datetime] # Due date
    labels: List[str]            # Labels/tags
    url: str                     # Link to task
    raw_data: Dict              # Original API response
```

#### WorkEffort

Dataclass representing a created work effort:

```python
@dataclass
class WorkEffort:
    we_id: str              # Work effort ID (WE-YYMMDD-xxxx)
    folder_path: Path       # Path to WE folder
    index_path: Path        # Path to index file
    tickets_dir: Path       # Path to tickets directory
    source_task: ExternalTask  # Original external task
```

#### BasePlugin

Abstract base class that all plugins must implement:

```python
class BasePlugin(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        """Plugin name (e.g., 'todoist', 'github-issues')"""

    @abstractmethod
    def validate_config(self) -> bool:
        """Validate plugin configuration"""

    @abstractmethod
    def fetch_tasks(self) -> List[ExternalTask]:
        """Fetch tasks that need processing"""

    @abstractmethod
    def create_work_effort(self, task: ExternalTask) -> WorkEffort:
        """Create work effort from external task"""

    @abstractmethod
    def post_feedback(self, task: ExternalTask, work_effort: WorkEffort) -> bool:
        """Post feedback to external service"""

    @abstractmethod
    def cleanup(self, task: ExternalTask) -> bool:
        """Clean up external task (remove label)"""
```

### Helper Functions

Common utilities available in `plugins.helpers`:

- **`generate_we_id()`** - Generate WE-YYMMDD-xxxx format IDs
- **`sanitize_title(title)`** - Convert titles to valid folder names
- **`validate_folder_name(name)`** - Validate using naming linter
- **`create_work_effort_structure()`** - Create folder structure
- **`format_index_file()`** - Generate index markdown content

## Creating a New Plugin

### 1. Copy the Template

```bash
cp -r plugins/_template plugins/your-service-name
```

### 2. Implement the Plugin Class

Edit `plugins/your-service-name/plugin.py`:

```python
from plugins.base import BasePlugin, ExternalTask, WorkEffort
from plugins.helpers import generate_we_id, sanitize_title, create_work_effort_structure
from typing import List, Dict

class YourServicePlugin(BasePlugin):
    @property
    def name(self) -> str:
        return "your-service"

    def validate_config(self) -> bool:
        required = ['api_key', 'service_url']
        for key in required:
            if key not in self.config:
                raise ValueError(f"Missing required config: {key}")
        return True

    def fetch_tasks(self) -> List[ExternalTask]:
        # Implement API call to fetch tasks
        # Return list of ExternalTask objects
        pass

    def create_work_effort(self, task: ExternalTask) -> WorkEffort:
        # Generate WE ID and create folder structure
        we_id = generate_we_id()
        base_path = Path("_work_efforts")

        folder_path, index_path, tickets_dir = create_work_effort_structure(
            base_path, we_id, task.title
        )

        # Create index file content
        from plugins.helpers import format_index_file
        content = format_index_file(
            we_id=we_id,
            title=task.title,
            description=task.description,
            source=self.name,
            source_url=task.url,
            labels=task.labels,
            created=task.created
        )
        index_path.write_text(content)

        return WorkEffort(
            we_id=we_id,
            folder_path=folder_path,
            index_path=index_path,
            tickets_dir=tickets_dir,
            source_task=task
        )

    def post_feedback(self, task: ExternalTask, work_effort: WorkEffort) -> bool:
        # Post comment back to external service
        pass

    def cleanup(self, task: ExternalTask) -> bool:
        # Remove trigger label from task
        pass
```

### 3. Test Your Plugin

```python
from plugins.your_service import YourServicePlugin

# Configure plugin
plugin = YourServicePlugin({
    'api_key': 'your-api-key',
    'service_url': 'https://api.example.com'
})

# Validate configuration
plugin.validate_config()

# Fetch tasks with trigger label
tasks = plugin.fetch_tasks()

# Process each task
for task in tasks:
    # Create work effort
    work_effort = plugin.create_work_effort(task)

    # Post feedback
    if plugin.post_feedback(task, work_effort):
        # Clean up (remove label)
        plugin.cleanup(task)
```

## Event System

Plugins emit events for dashboard monitoring and logging:

### Event Types

- `plugin.task.fetched` - Task fetched from external service
- `plugin.work_effort.created` - Work effort created
- `plugin.feedback.posted` - Feedback posted to external task
- `plugin.cleanup.completed` - Cleanup completed
- `plugin.error` - Error occurred

### Emitting Events

```python
self.emit_event('plugin.work_effort.created', {
    'task_id': task.id,
    'we_id': work_effort.we_id,
    'folder_path': str(work_effort.folder_path)
})
```

### Listening to Events

```python
def handle_event(event):
    print(f"[{event['plugin']}] {event['type']}: {event['data']}")

plugin.on_event(handle_event)
```

## Integration Points

### Naming Linter

All work effort folder names are validated using the Phase 1 naming linter:

```python
from plugins.helpers import validate_folder_name

folder_name = f"{we_id}_{sanitized_title}"
error = validate_folder_name(folder_name)
if error:
    raise ValueError(f"Invalid folder name: {error}")
```

This ensures all work efforts follow the `WE-YYMMDD-xxxx_description` format.

### Work Effort Structure

Standard structure created by plugins:

```
_work_efforts/
└── WE-260101-abcd_task_title/
    ├── WE-260101-abcd_index.md    # Index file with metadata
    └── tickets/                    # Directory for tickets
```

## Configuration

Each plugin requires service-specific configuration:

```python
config = {
    'api_key': 'your-api-key',      # API authentication
    'service_url': 'https://...',   # Service endpoint
    # ... plugin-specific settings
}

plugin = YourServicePlugin(config)
```

## Available Plugins

### Template Plugin

- **Location**: `plugins/_template/`
- **Purpose**: Reference implementation for creating new plugins
- **Status**: Template only (not functional)

### Todoist Plugin (Phase 3)

- **Location**: `plugins/todoist/` _(coming soon)_
- **Purpose**: Integration with Todoist task manager
- **Status**: Planned for Phase 3

## Examples

### Basic Usage

```python
from plugins.todoist import TodoistPlugin

# Configure
plugin = TodoistPlugin({
    'api_token': 'your-todoist-token',
    'trigger_label': 'create-we'
})

# Validate config
plugin.validate_config()

# Process tasks
tasks = plugin.fetch_tasks()
for task in tasks:
    we = plugin.create_work_effort(task)
    plugin.post_feedback(task, we)
    plugin.cleanup(task)
```

### With Event Monitoring

```python
from plugins.todoist import TodoistPlugin

plugin = TodoistPlugin(config)

# Add event handler
def log_events(event):
    timestamp = event['timestamp']
    event_type = event['type']
    data = event['data']
    print(f"[{timestamp}] {event_type}: {data}")

plugin.on_event(log_events)

# Process tasks (events will be logged)
tasks = plugin.fetch_tasks()
# ... process tasks
```

## Development Workflow

1. **Phase 1**: ✅ Naming linter (completed)
2. **Phase 2**: ✅ Plugin base classes (current)
3. **Phase 3**: Todoist plugin implementation
4. **Phase 4**: Automated monitoring service
5. **Phase 5**: Dashboard integration
6. **Phase 6**: Additional plugins (GitHub, Jira, etc.)

## Resources

- **Template Plugin**: See `plugins/_template/README.md` for detailed guide
- **Naming Linter**: See `tools/naming-linter/README.md` for validation rules
- **Base Classes**: See `plugins/base.py` for API documentation
- **Helpers**: See `plugins/helpers.py` for utility functions
- **Phase 2 Spec**: See `V0.9.0_PHASE2_CONTINUATION.md` for requirements

## Next Steps

To implement your first plugin:

1. Read the template documentation: `plugins/_template/README.md`
2. Review the base classes: `plugins/base.py`
3. Copy the template: `cp -r plugins/_template plugins/my-service`
4. Implement the abstract methods
5. Test with real API calls
6. Submit PR with your plugin

## License

Part of the _pyrite work effort management system.
