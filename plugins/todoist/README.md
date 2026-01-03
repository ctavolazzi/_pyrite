# Todoist Plugin

Automatically create work efforts from Todoist tasks labeled with `pyrite`.

## Overview

The Todoist plugin monitors your Todoist account for tasks with a specific trigger label (default: `pyrite`). When found, it:

1. **Fetches** the task from Todoist
2. **Creates** a properly formatted work effort structure
3. **Posts** a feedback comment to the Todoist task
4. **Removes** the trigger label (cleanup)

This creates a seamless bridge between Todoist task tracking and the local _pyrite work effort system.

## Features

### Phase 3 (Core Integration)
- ✅ Automatic work effort creation from labeled tasks
- ✅ Feedback comments posted to Todoist
- ✅ Label-based triggering (customizable)
- ✅ Event system for monitoring
- ✅ Polling script for continuous monitoring
- ✅ Full validation using naming linter
- ✅ Comprehensive error handling

### Phase 4 (Enhancements)
- ✅ **Work Effort Linking** - Reference existing WE-IDs instead of always creating new
- ✅ **Subtask Parsing** - Automatically convert Todoist subtasks into tickets
- ✅ **Multi-Task WE** - Multiple Todoist tasks can contribute to the same work effort
- ✅ **Enhanced Feedback** - Detailed feedback showing created tickets and linking status

## Prerequisites

1. **Todoist Account** - You need an active Todoist account
2. **API Token** - Get yours from Todoist Settings → Integrations → Developer

### Getting Your API Token

1. Log in to [Todoist](https://todoist.com)
2. Go to Settings (⚙️)
3. Navigate to Integrations → Developer
4. Copy your API token

## Installation

1. **Install dependencies**:
   ```bash
   pip install requests
   ```

2. **Set up environment variable**:
   ```bash
   export TODOIST_API_TOKEN='your-todoist-api-token'
   ```

   Or create a config file (see Configuration section).

## Quick Start

### 1. Basic Usage (Python)

```python
from plugins.todoist import TodoistPlugin

# Configure plugin
config = {
    'api_token': 'your-todoist-token',
    'trigger_label': 'pyrite'
}

plugin = TodoistPlugin(config)
plugin.validate_config()

# Fetch and process tasks
tasks = plugin.fetch_tasks()
for task in tasks:
    # Create work effort
    work_effort = plugin.create_work_effort(task)

    # Post feedback to Todoist
    plugin.post_feedback(task, work_effort)

    # Remove label
    plugin.cleanup(task)
```

### 2. Using the Polling Script

**One-time check**:
```bash
python plugins/todoist/poll.py --once
```

**Continuous monitoring** (checks every 5 minutes):
```bash
python plugins/todoist/poll.py --interval 300
```

**With custom config file**:
```bash
python plugins/todoist/poll.py --config todoist_config.json
```

**Background monitoring** (recommended for production):
```bash
nohup python plugins/todoist/poll.py --interval 300 > todoist.log 2>&1 &
```

## Configuration

### Environment Variables

```bash
# Required
export TODOIST_API_TOKEN='your-todoist-api-token'

# Optional
export TODOIST_TRIGGER_LABEL='pyrite'  # Default: 'pyrite'
```

### Config File (JSON)

Create `todoist_config.json`:

```json
{
  "api_token": "your-todoist-api-token",
  "trigger_label": "pyrite",
  "work_efforts_dir": "_work_efforts",
  "poll_interval": 300
}
```

Then run:
```bash
python plugins/todoist/poll.py --config todoist_config.json
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `api_token` | string | *required* | Todoist API token |
| `trigger_label` | string | `'pyrite'` | Label that triggers WE creation |
| `work_efforts_dir` | string | `'_work_efforts'` | Directory for work efforts |
| `poll_interval` | int | `300` | Polling interval in seconds |

## Usage Workflows

### Basic Workflow (Phase 3)

#### Step 1: Label a Task in Todoist

In Todoist, add the `pyrite` label to any task you want to convert to a work effort:

```
Task: "Build User Authentication System"
Labels: pyrite, backend, urgent
Description: Implement login and signup functionality
```

#### Step 2: Run the Plugin

**Option A: Manual (one-time)**
```bash
python plugins/todoist/poll.py --once
```

**Option B: Automated (continuous)**
```bash
python plugins/todoist/poll.py --interval 300
```

#### Step 3: Work Effort Created

The plugin creates:

```
_work_efforts/
└── WE-260103-abcd_build_user_authentication_system/
    ├── WE-260103-abcd_index.md    # Task metadata
    └── tickets/                    # Directory for tickets
```

#### Step 4: Feedback Posted to Todoist

The task receives a comment:

```markdown
✅ **Work Effort Created: WE-260103-abcd**

📁 **Folder**: `WE-260103-abcd_build_user_authentication_system`
📋 **Index**: `WE-260103-abcd_index.md`

🎫 **Tickets**: `tickets/` (ready for tickets)

You can now track progress in the _pyrite system!
```

#### Step 5: Label Removed

The `pyrite` label is automatically removed from the task.

---

### Advanced Workflows (Phase 4)

#### Workflow 1: Link to Existing Work Effort

Instead of creating a new work effort, reference an existing one:

**In Todoist:**
```
Task: "Frontend for Auth System WE-260103-abcd"
Labels: pyrite
Description: Build login UI components
```

**Result:**
- Plugin finds existing `WE-260103-abcd`
- Links to that work effort instead of creating new
- Feedback shows: "✅ **Linked to Existing Work Effort: WE-260103-abcd**"

**Use Case:** Multiple tasks contributing to the same project

#### Workflow 2: Subtasks → Tickets

Add subtasks to your Todoist task using markdown checkboxes:

**In Todoist:**
```
Task: "Build Auth System WE-260103-auth"
Labels: pyrite
Description:
Build authentication system

- [ ] Create login form
- [ ] Add password reset
- [ ] Implement OAuth
- [ ] Setup JWT middleware
```

**Result:**
```
_work_efforts/WE-260103-auth_build_auth_system/
├── WE-260103-auth_index.md
└── tickets/
    ├── TKT-auth-001_create_login_form.md
    ├── TKT-auth-002_add_password_reset.md
    ├── TKT-auth-003_implement_oauth.md
    └── TKT-auth-004_setup_jwt_middleware.md
```

**Enhanced Feedback:**
```markdown
✅ **Linked to Existing Work Effort: WE-260103-auth**

📁 **Folder**: `WE-260103-auth_build_auth_system`
📋 **Index**: `WE-260103-auth_index.md`

🎫 **Tickets Created** (4):
- `TKT-auth-001`: Create Login Form
- `TKT-auth-002`: Add Password Reset
- `TKT-auth-003`: Implement OAuth
- `TKT-auth-004`: Setup Jwt Middleware

You can now track progress in the _pyrite system!
```

#### Workflow 3: Multi-Task Work Effort

Multiple Todoist tasks can contribute to the same work effort:

**Task 1 (Todoist):**
```
Task: "Auth Frontend WE-260103-auth"
Labels: pyrite
Description:
- [ ] Login form UI
- [ ] Signup form UI
```

**Task 2 (Todoist):**
```
Task: "Auth Backend WE-260103-auth"
Labels: pyrite
Description:
- [ ] JWT middleware
- [ ] Password hashing
```

**Result:**
Both tasks add tickets to the same `WE-260103-auth` work effort:
```
_work_efforts/WE-260103-auth_auth_frontend/
└── tickets/
    ├── TKT-auth-001_login_form_ui.md          (from Task 1)
    ├── TKT-auth-002_signup_form_ui.md         (from Task 1)
    ├── TKT-auth-003_jwt_middleware.md         (from Task 2)
    └── TKT-auth-004_password_hashing.md       (from Task 2)
```

**Use Case:** Breaking down a large project into multiple Todoist tasks while keeping everything organized under one work effort

## File Structure

```
plugins/todoist/
├── __init__.py          # Package exports
├── api.py               # Todoist API v2 client
├── plugin.py            # TodoistPlugin implementation
├── poll.py              # Polling script
└── README.md            # This file
```

## API Client

The `TodoistAPI` class provides methods for interacting with Todoist:

```python
from plugins.todoist.api import TodoistAPI

api = TodoistAPI('your-token')

# Fetch tasks with label
tasks = api.get_tasks(label='pyrite')

# Get single task
task = api.get_task('task-id')

# Add comment
api.add_comment('task-id', 'Work effort created!')

# Remove label
api.remove_label_from_task('task-id', 'pyrite')

# Validate token
is_valid = api.validate_token()
```

See `api.py` for full API documentation.

## Plugin Class

The `TodoistPlugin` class implements the `BasePlugin` interface:

```python
class TodoistPlugin(BasePlugin):
    @property
    def name(self) -> str

    def validate_config(self) -> bool
    def fetch_tasks(self) -> List[ExternalTask]
    def create_work_effort(self, task: ExternalTask) -> WorkEffort
    def post_feedback(self, task: ExternalTask, work_effort: WorkEffort) -> bool
    def cleanup(self, task: ExternalTask) -> bool
```

See `plugins/base.py` for the base interface.

## Event System

The plugin emits events for dashboard integration:

```python
plugin = TodoistPlugin(config)

# Add event handler
def log_events(event):
    print(f"[{event['timestamp']}] {event['type']}: {event['data']}")

plugin.on_event(log_events)

# Process tasks (events will be emitted)
tasks = plugin.fetch_tasks()
# ... process tasks
```

### Event Types

#### Phase 3 Events
- `plugin.task.fetched` - Task fetched from Todoist
- `plugin.work_effort.created` - Work effort created
- `plugin.feedback.posted` - Feedback posted to Todoist
- `plugin.cleanup.completed` - Label removed
- `plugin.error` - Error occurred

#### Phase 4 Events
- `plugin.work_effort.linked` - Linked to existing work effort
- `plugin.ticket.created` - Ticket created from subtask

### Event Structure

```python
{
    'plugin': 'todoist',
    'type': 'plugin.work_effort.created',
    'timestamp': '2026-01-01T10:30:00.000000',
    'data': {
        'task_id': 'task-123',
        'we_id': 'WE-260101-abcd',
        'folder_path': '_work_efforts/WE-260101-abcd_my_task'
    }
}
```

## Testing

### Run Unit Tests

```bash
python test_todoist.py
```

The test suite includes:
- ✓ API client initialization
- ✓ Plugin configuration validation
- ✓ Task conversion (Todoist → ExternalTask)
- ✓ Work effort creation
- ✓ Feedback message formatting
- ✓ Event system
- ✓ Complete mocked workflow

### Manual Testing with Real API

1. Set up your API token:
   ```bash
   export TODOIST_API_TOKEN='your-real-token'
   ```

2. Create a test task in Todoist with the `pyrite` label

3. Run the plugin:
   ```bash
   python plugins/todoist/poll.py --once
   ```

4. Verify:
   - Work effort folder created in `_work_efforts/`
   - Comment posted to Todoist task
   - Label removed from task

## Troubleshooting

### "Invalid Todoist API token"

- Verify your token from Todoist Settings → Integrations → Developer
- Check that `TODOIST_API_TOKEN` is set correctly
- Try validating manually:
  ```python
  from plugins.todoist.api import TodoistAPI
  api = TodoistAPI('your-token')
  print(api.validate_token())
  ```

### "No tasks to process"

- Ensure you have tasks labeled with `pyrite` in Todoist
- Check that the trigger label matches your config
- Verify API token has access to your tasks

### "Invalid folder name" Error

- The naming linter validates folder names
- Task titles with special characters are automatically sanitized
- Very long titles are truncated to 50 characters
- See `tools/naming-linter/` for validation rules

### Network Errors

- Check internet connection
- Verify Todoist API is accessible: https://api.todoist.com/rest/v2
- Check for rate limiting (Todoist allows 450 requests per 15 minutes)

## Production Deployment

### Systemd Service (Linux)

Create `/etc/systemd/system/todoist-monitor.service`:

```ini
[Unit]
Description=Todoist Work Effort Monitor
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/_pyrite
Environment="TODOIST_API_TOKEN=your-token"
ExecStart=/usr/bin/python3 plugins/todoist/poll.py --interval 300
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable todoist-monitor
sudo systemctl start todoist-monitor
sudo systemctl status todoist-monitor
```

### Docker Container

Create `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY . /app

RUN pip install requests

ENV TODOIST_API_TOKEN=""
ENV POLL_INTERVAL=300

CMD ["python", "plugins/todoist/poll.py", "--interval", "${POLL_INTERVAL}"]
```

Build and run:
```bash
docker build -t pyrite-todoist .
docker run -d \
  -e TODOIST_API_TOKEN='your-token' \
  -v $(pwd)/_work_efforts:/app/_work_efforts \
  pyrite-todoist
```

### Cron Job

Add to crontab (`crontab -e`):

```bash
# Run every 5 minutes
*/5 * * * * cd /path/to/_pyrite && python plugins/todoist/poll.py --once >> todoist.log 2>&1
```

## Examples

### Example 1: Basic Integration

```python
from plugins.todoist import TodoistPlugin

config = {'api_token': 'your-token'}
plugin = TodoistPlugin(config)
plugin.validate_config()

# Process all labeled tasks
tasks = plugin.fetch_tasks()
print(f"Found {len(tasks)} tasks to process")

for task in tasks:
    we = plugin.create_work_effort(task)
    plugin.post_feedback(task, we)
    plugin.cleanup(task)
```

### Example 2: With Event Logging

```python
from plugins.todoist import TodoistPlugin
from datetime import datetime

config = {'api_token': 'your-token'}
plugin = TodoistPlugin(config)

# Log all events
def log_event(event):
    timestamp = datetime.fromisoformat(event['timestamp'])
    print(f"[{timestamp:%H:%M:%S}] {event['type']}")
    if event['type'] == 'plugin.error':
        print(f"  Error: {event['data']}")

plugin.on_event(log_event)

# Process tasks with logging
tasks = plugin.fetch_tasks()
for task in tasks:
    we = plugin.create_work_effort(task)
    plugin.post_feedback(task, we)
    plugin.cleanup(task)
```

### Example 3: Custom Label and Directory

```python
from plugins.todoist import TodoistPlugin

config = {
    'api_token': 'your-token',
    'trigger_label': 'work-effort',  # Custom label
    'work_efforts_dir': 'my_custom_dir'  # Custom directory
}

plugin = TodoistPlugin(config)
plugin.validate_config()

# Process tasks (same as before)
tasks = plugin.fetch_tasks()
for task in tasks:
    we = plugin.create_work_effort(task)
    plugin.post_feedback(task, we)
    plugin.cleanup(task)
```

## Integration with Other Systems

### Dashboard Integration

The event system allows integration with the Mission Control dashboard:

```python
# In your dashboard code
from plugins.todoist import TodoistPlugin

plugin = TodoistPlugin(config)

# Forward events to dashboard
plugin.on_event(dashboard.handle_plugin_event)

# Run in background thread
import threading
def monitor_todoist():
    while True:
        tasks = plugin.fetch_tasks()
        for task in tasks:
            # ... process
        time.sleep(300)

thread = threading.Thread(target=monitor_todoist, daemon=True)
thread.start()
```

### GitHub Issues Integration

Combine with GitHub Issues plugin to sync across services:

```python
from plugins.todoist import TodoistPlugin
from plugins.github_issues import GitHubIssuesPlugin

todoist = TodoistPlugin(todoist_config)
github = GitHubIssuesPlugin(github_config)

# Process Todoist tasks
todoist_tasks = todoist.fetch_tasks()
for task in todoist_tasks:
    we = todoist.create_work_effort(task)

    # Also create GitHub issue
    github.create_issue_from_work_effort(we)
```

## API Reference

See the following files for detailed API documentation:

- **Base Classes**: `plugins/base.py`
- **Helper Functions**: `plugins/helpers.py`
- **Todoist API Client**: `plugins/todoist/api.py`
- **TodoistPlugin**: `plugins/todoist/plugin.py`

## Development

### Running Tests

```bash
# Run all tests
python test_todoist.py

# Run with verbose output
python -v test_todoist.py
```

### Contributing

When modifying the plugin:

1. Update tests in `test_todoist.py`
2. Run test suite to verify changes
3. Update documentation
4. Submit PR with changes

### Adding Features

To add new features:

1. Implement in `plugin.py` or `api.py`
2. Add tests to `test_todoist.py`
3. Update this README
4. Emit appropriate events for monitoring

## Resources

- **Todoist API Docs**: https://developer.todoist.com/rest/v2/
- **Plugin Base Classes**: `plugins/base.py`
- **Naming Linter**: `tools/naming-linter/`
- **Phase 2 Spec**: `plugins/README.md`

## License

Part of the _pyrite work effort management system.

## Support

For issues or questions:

1. Check the Troubleshooting section above
2. Review test suite for examples
3. See `plugins/README.md` for general plugin documentation
4. Check Todoist API documentation

## Changelog

### v0.9.0 (2026-01-01) - Phase 3

- ✅ Initial Todoist plugin implementation
- ✅ API v2 client
- ✅ Polling script
- ✅ Event system integration
- ✅ Comprehensive test suite
- ✅ Documentation
