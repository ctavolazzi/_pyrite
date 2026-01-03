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
    format_index_file,
    find_work_effort_by_id,
    generate_ticket_id,
    create_ticket_file
)
from plugins.todoist.api import TodoistAPI, TodoistAPIError
from typing import List, Dict, Optional
from datetime import datetime
from pathlib import Path
import re


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
        Create work effort from Todoist task (or link to existing WE)

        Phase 4 enhancements:
        - Checks for WE-ID in task title/description
        - Links to existing WE if found (instead of creating new)
        - Parses subtasks from description
        - Creates tickets for each subtask

        Args:
            task: ExternalTask to convert

        Returns:
            WorkEffort object with paths and created tickets

        Raises:
            ValueError: If work effort creation fails validation
        """
        try:
            base_path = Path(self.config['work_efforts_dir'])
            linked_to_existing = False
            created_tickets = []

            # Phase 4: Check for WE-ID in task title or description
            # Pattern: WE-YYMMDD-xxxx
            we_id_pattern = r'WE-\d{6}-[a-z0-9]{4}'

            # Search in title first, then description
            search_text = f"{task.title}\n{task.description or ''}"
            we_match = re.search(we_id_pattern, search_text, re.IGNORECASE)

            if we_match:
                # Found WE-ID reference - try to link to existing WE
                # Keep original case from the match
                we_id = we_match.group(0)
                we_path = self.find_work_effort(we_id)

                if we_path:
                    # Link to existing work effort
                    linked_to_existing = True
                    folder_path = we_path
                    index_path = we_path / f"{we_id}_index.md"
                    tickets_dir = we_path / "tickets"

                    # Emit event
                    self.emit_event('plugin.work_effort.linked', {
                        'task_id': task.id,
                        'we_id': we_id,
                        'folder_path': str(folder_path)
                    })
                else:
                    # WE-ID referenced but doesn't exist - create new with that ID
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

                    # Emit event
                    self.emit_event('plugin.work_effort.created', {
                        'task_id': task.id,
                        'we_id': we_id,
                        'folder_path': str(folder_path),
                        'index_path': str(index_path)
                    })
            else:
                # No WE-ID found - create new WE (original behavior)
                we_id = generate_we_id()

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

                # Emit event
                self.emit_event('plugin.work_effort.created', {
                    'task_id': task.id,
                    'we_id': we_id,
                    'folder_path': str(folder_path),
                    'index_path': str(index_path)
                })

            # Phase 4: Parse subtasks and create tickets
            subtasks = self.parse_subtasks(task)
            for subtask_title in subtasks:
                ticket_path = self.create_ticket(
                    we_path=folder_path,
                    we_id=we_id,
                    title=subtask_title,
                    description=f"From Todoist task: {task.title}",
                    source_task_id=task.id,
                    source_url=task.url
                )
                created_tickets.append(ticket_path)

            # Create WorkEffort object with Phase 4 enhancements
            work_effort = WorkEffort(
                we_id=we_id,
                folder_path=folder_path,
                index_path=index_path,
                tickets_dir=tickets_dir,
                source_task=task,
                created_tickets=created_tickets,
                linked_to_existing=linked_to_existing
            )

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

    # Phase 4: WE Lookup and Subtask Methods

    def find_work_effort(self, we_id: str) -> Optional[Path]:
        """
        Find an existing work effort by WE-ID

        Args:
            we_id: Work effort ID to search for (e.g., 'WE-260102-auth')

        Returns:
            Path to work effort folder if found, None otherwise
        """
        base_path = Path(self.config['work_efforts_dir'])
        return find_work_effort_by_id(base_path, we_id)

    def parse_subtasks(self, task: ExternalTask) -> List[str]:
        """
        Parse subtasks from Todoist task description

        Extracts markdown checklist items from the task description:
        - [ ] Subtask 1
        - [ ] Subtask 2

        Args:
            task: ExternalTask to parse

        Returns:
            List of subtask titles (without checkbox formatting)
        """
        if not task.description:
            return []

        subtasks = []
        lines = task.description.split('\n')

        for line in lines:
            # Match markdown checklist: - [ ] Title or - [x] Title
            match = re.match(r'^\s*-\s*\[[ xX]\]\s*(.+)$', line.strip())
            if match:
                subtask_title = match.group(1).strip()
                if subtask_title:
                    subtasks.append(subtask_title)

        return subtasks

    def create_ticket(
        self,
        we_path: Path,
        we_id: str,
        title: str,
        description: str = "",
        source_task_id: str = None,
        source_url: str = None
    ) -> Path:
        """
        Create a ticket file in the work effort's tickets directory

        Args:
            we_path: Path to work effort folder
            we_id: Work effort ID (for generating ticket ID)
            title: Ticket title
            description: Ticket description (optional)
            source_task_id: Todoist task ID (optional)
            source_url: URL to Todoist task (optional)

        Returns:
            Path to created ticket file
        """
        tickets_dir = we_path / "tickets"
        tickets_dir.mkdir(exist_ok=True)

        # Count existing tickets to determine sequence number
        existing_tickets = list(tickets_dir.glob('TKT-*.md'))
        sequence = len(existing_tickets) + 1

        # Generate ticket ID
        ticket_id = generate_ticket_id(we_id, sequence)

        # Create ticket file
        ticket_path = create_ticket_file(
            tickets_dir=tickets_dir,
            ticket_id=ticket_id,
            title=title,
            description=description,
            source_task_id=source_task_id,
            source_url=source_url,
            labels=['todoist']
        )

        # Emit event
        self.emit_event('plugin.ticket.created', {
            'ticket_id': ticket_id,
            'title': title,
            'we_id': we_id,
            'path': str(ticket_path)
        })

        return ticket_path

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
        Format feedback message for Todoist comment (Phase 4 enhanced)

        Args:
            work_effort: Created/linked work effort

        Returns:
            Markdown-formatted message with ticket details
        """
        # Phase 4: Enhanced feedback with WE linking and ticket info
        if work_effort.linked_to_existing:
            header = f"✅ **Linked to Existing Work Effort: {work_effort.we_id}**"
        else:
            header = f"✅ **Work Effort Created: {work_effort.we_id}**"

        message = f"""{header}

📁 **Folder**: `{work_effort.folder_path.name}`
📋 **Index**: `{work_effort.index_path.name}`
"""

        # Add ticket information if any were created
        if work_effort.created_tickets:
            message += f"\n🎫 **Tickets Created** ({len(work_effort.created_tickets)}):\n"
            for ticket_path in work_effort.created_tickets:
                ticket_name = ticket_path.stem  # Filename without .md extension
                # Extract ticket ID and title from filename (TKT-xxxx-NNN_title)
                parts = ticket_name.split('_', 1)
                ticket_id = parts[0] if parts else ticket_name
                ticket_title = parts[1].replace('_', ' ').title() if len(parts) > 1 else ''
                message += f"- `{ticket_id}`: {ticket_title}\n"
        else:
            message += f"\n🎫 **Tickets**: `{work_effort.tickets_dir.name}/` (ready for tickets)\n"

        message += "\nYou can now track progress in the _pyrite system!\n"

        return message
