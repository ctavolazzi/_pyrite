"""
Todoist Plugin for Work Effort Integration

Automatically creates work efforts from Todoist tasks labeled with 'pyrite'.
When a task is labeled, the plugin:
1. Fetches the task from Todoist
2. Creates a work effort structure
3. Posts a feedback comment to Todoist
4. Removes the 'pyrite' label
"""

from plugins.base import BasePlugin, ExternalTask, WorkEffort
from plugins.helpers import (
    generate_we_id,
    sanitize_title,
    validate_folder_name,
    create_work_effort_structure,
    format_index_file
)
from plugins.todoist.api import TodoistAPI, TodoistAPIError
from typing import List, Dict, Optional
from datetime import datetime
from pathlib import Path


class TodoistPlugin(BasePlugin):
    """
    Todoist integration plugin

    Creates work efforts from Todoist tasks labeled with a trigger label.

    Configuration:
        - api_token: Todoist API token (required)
        - trigger_label: Label that triggers WE creation (default: 'pyrite')
        - work_efforts_dir: Base directory for work efforts (default: '_work_efforts')

    Example:
        >>> config = {
        ...     'api_token': 'your-todoist-token',
        ...     'trigger_label': 'pyrite'
        ... }
        >>> plugin = TodoistPlugin(config)
        >>> plugin.validate_config()
        >>> tasks = plugin.fetch_tasks()
        >>> for task in tasks:
        ...     we = plugin.create_work_effort(task)
        ...     plugin.post_feedback(task, we)
        ...     plugin.cleanup(task)
    """

    @property
    def name(self) -> str:
        """Return plugin name"""
        return "todoist"

    def __init__(self, config: Dict):
        """
        Initialize Todoist plugin

        Args:
            config: Plugin configuration dictionary
        """
        super().__init__(config)

        # Set defaults
        self.config.setdefault('trigger_label', 'pyrite')
        self.config.setdefault('work_efforts_dir', '_work_efforts')

        # Initialize API client
        self.api = None
        if 'api_token' in config:
            self.api = TodoistAPI(config['api_token'])

    def validate_config(self) -> bool:
        """
        Validate plugin configuration

        Returns:
            True if config is valid

        Raises:
            ValueError: If config is missing required fields or invalid
        """
        # Check required fields
        if 'api_token' not in self.config:
            raise ValueError("Missing required config: api_token")

        if not self.config['api_token']:
            raise ValueError("api_token cannot be empty")

        # Validate trigger label
        trigger_label = self.config.get('trigger_label', 'pyrite')
        if not trigger_label or not isinstance(trigger_label, str):
            raise ValueError("trigger_label must be a non-empty string")

        # Validate work efforts directory
        work_efforts_dir = self.config.get('work_efforts_dir', '_work_efforts')
        if not work_efforts_dir:
            raise ValueError("work_efforts_dir cannot be empty")

        # Initialize API if not already done
        if not self.api:
            self.api = TodoistAPI(self.config['api_token'])

        # Validate API token by making test request
        try:
            if not self.api.validate_token():
                raise ValueError("Invalid Todoist API token")
        except TodoistAPIError as e:
            raise ValueError(f"Failed to validate API token: {str(e)}")

        return True

    def fetch_tasks(self) -> List[ExternalTask]:
        """
        Fetch tasks from Todoist with trigger label

        Returns:
            List of ExternalTask objects

        Raises:
            TodoistAPIError: If API request fails
        """
        trigger_label = self.config['trigger_label']

        try:
            # Fetch tasks with trigger label
            tasks_data = self.api.get_tasks(label=trigger_label)

            # Convert to ExternalTask objects
            tasks = []
            for task_data in tasks_data:
                task = self._convert_to_external_task(task_data)
                tasks.append(task)

                # Emit event
                self.emit_event('plugin.task.fetched', {
                    'task_id': task.id,
                    'title': task.title,
                    'labels': task.labels
                })

            return tasks

        except TodoistAPIError as e:
            self.emit_event('plugin.error', {
                'operation': 'fetch_tasks',
                'error': str(e)
            })
            raise

    def create_work_effort(self, task: ExternalTask) -> WorkEffort:
        """
        Create work effort from Todoist task

        Args:
            task: ExternalTask to convert

        Returns:
            WorkEffort object with paths

        Raises:
            ValueError: If work effort creation fails validation
        """
        try:
            # Generate WE ID
            we_id = generate_we_id()

            # Create folder structure (validates with naming linter)
            base_path = Path(self.config['work_efforts_dir'])
            folder_path, index_path, tickets_dir = create_work_effort_structure(
                base_path=base_path,
                we_id=we_id,
                title=task.title,
                validate=True
            )

            # Create index file
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

            # Create WorkEffort object
            work_effort = WorkEffort(
                we_id=we_id,
                folder_path=folder_path,
                index_path=index_path,
                tickets_dir=tickets_dir,
                source_task=task
            )

            # Emit event
            self.emit_event('plugin.work_effort.created', {
                'task_id': task.id,
                'we_id': we_id,
                'folder_path': str(folder_path),
                'index_path': str(index_path)
            })

            return work_effort

        except Exception as e:
            self.emit_event('plugin.error', {
                'operation': 'create_work_effort',
                'task_id': task.id,
                'error': str(e)
            })
            raise

    def post_feedback(self, task: ExternalTask, work_effort: WorkEffort) -> bool:
        """
        Post feedback comment to Todoist task

        Args:
            task: Original Todoist task
            work_effort: Created work effort

        Returns:
            True if feedback posted successfully
        """
        try:
            # Format feedback message
            message = self._format_feedback_message(work_effort)

            # Post comment to Todoist
            self.api.add_comment(task.id, message)

            # Emit event
            self.emit_event('plugin.feedback.posted', {
                'task_id': task.id,
                'we_id': work_effort.we_id
            })

            return True

        except TodoistAPIError as e:
            self.emit_event('plugin.error', {
                'operation': 'post_feedback',
                'task_id': task.id,
                'error': str(e)
            })
            return False

    def cleanup(self, task: ExternalTask) -> bool:
        """
        Remove trigger label from Todoist task

        Args:
            task: Todoist task to clean up

        Returns:
            True if cleanup successful
        """
        try:
            trigger_label = self.config['trigger_label']

            # Remove trigger label
            self.api.remove_label_from_task(task.id, trigger_label)

            # Emit event
            self.emit_event('plugin.cleanup.completed', {
                'task_id': task.id,
                'label_removed': trigger_label
            })

            return True

        except TodoistAPIError as e:
            self.emit_event('plugin.error', {
                'operation': 'cleanup',
                'task_id': task.id,
                'error': str(e)
            })
            return False

    # Helper methods

    def _convert_to_external_task(self, task_data: Dict) -> ExternalTask:
        """
        Convert Todoist API response to ExternalTask

        Args:
            task_data: Task dictionary from Todoist API

        Returns:
            ExternalTask object
        """
        # Parse created date
        created = datetime.fromisoformat(task_data['created_at'].replace('Z', '+00:00'))

        # Parse due date if present
        due_date = None
        if task_data.get('due') and task_data['due'].get('datetime'):
            due_date = datetime.fromisoformat(task_data['due']['datetime'].replace('Z', '+00:00'))
        elif task_data.get('due') and task_data['due'].get('date'):
            # Date only (no time)
            due_date = datetime.fromisoformat(task_data['due']['date'] + 'T00:00:00')

        # Task URL
        task_url = task_data.get('url', f"https://todoist.com/showTask?id={task_data['id']}")

        return ExternalTask(
            id=task_data['id'],
            title=task_data['content'],
            description=task_data.get('description', ''),
            created=created,
            due_date=due_date,
            labels=task_data.get('labels', []),
            url=task_url,
            raw_data=task_data
        )

    def _format_feedback_message(self, work_effort: WorkEffort) -> str:
        """
        Format feedback message for Todoist comment

        Args:
            work_effort: Created work effort

        Returns:
            Markdown-formatted message
        """
        message = f"""✅ **Work Effort Created!**

📁 **Folder**: `{work_effort.folder_path.name}`
📋 **Index**: `{work_effort.index_path.name}`
🎫 **Tickets**: `{work_effort.tickets_dir.name}/`

The work effort has been created in the _pyrite system. You can now create tickets and track progress.
"""
        return message
