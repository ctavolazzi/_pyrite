"""
Base plugin architecture for external task integrations

This module provides the abstract base classes and data structures for
integrating external task management services with the work effort system.
"""

from abc import ABC, abstractmethod
from pathlib import Path
from typing import List, Dict, Optional
from dataclasses import dataclass
from datetime import datetime


@dataclass
class ExternalTask:
    """Represents a task from an external service"""
    id: str
    title: str
    description: Optional[str]
    created: datetime
    due_date: Optional[datetime]
    labels: List[str]
    url: str
    raw_data: Dict  # Original API response


@dataclass
class WorkEffort:
    """Represents a created work effort"""
    we_id: str
    folder_path: Path
    index_path: Path
    tickets_dir: Path
    source_task: ExternalTask
    created_tickets: List[Path] = None  # Paths to created ticket files (Phase 4)
    linked_to_existing: bool = False  # Whether this was linked to existing WE (Phase 4)

    def __post_init__(self):
        """Initialize created_tickets as empty list if None"""
        if self.created_tickets is None:
            self.created_tickets = []


class BasePlugin(ABC):
    """
    Abstract base class for external service integrations

    Subclasses must implement all abstract methods to integrate
    a new task management service (Todoist, GitHub Issues, Jira, etc.)

    Example usage:
        >>> class MyPlugin(BasePlugin):
        ...     @property
        ...     def name(self) -> str:
        ...         return "my-service"
        ...
        ...     def validate_config(self) -> bool:
        ...         # Validate configuration
        ...         return True
        ...
        ...     # ... implement other abstract methods
    """

    def __init__(self, config: Dict):
        """
        Initialize plugin with configuration

        Args:
            config: Plugin-specific configuration (API keys, etc.)
        """
        self.config = config
        self.event_handlers = []

    @property
    @abstractmethod
    def name(self) -> str:
        """Plugin name (e.g., 'todoist', 'github-issues')"""
        pass

    @abstractmethod
    def validate_config(self) -> bool:
        """
        Validate plugin configuration

        Returns:
            True if config is valid

        Raises:
            ValueError: If config is invalid with helpful message
        """
        pass

    @abstractmethod
    def fetch_tasks(self) -> List[ExternalTask]:
        """
        Fetch tasks from external service that need processing

        Returns:
            List of ExternalTask objects
        """
        pass

    @abstractmethod
    def create_work_effort(self, task: ExternalTask) -> WorkEffort:
        """
        Create work effort from external task

        Args:
            task: External task to convert

        Returns:
            WorkEffort object with paths to created files

        Raises:
            ValueError: If work effort creation fails validation
        """
        pass

    @abstractmethod
    def post_feedback(self, task: ExternalTask, work_effort: WorkEffort) -> bool:
        """
        Post feedback to external service (comment with link)

        Args:
            task: Original external task
            work_effort: Created work effort

        Returns:
            True if feedback posted successfully
        """
        pass

    @abstractmethod
    def cleanup(self, task: ExternalTask) -> bool:
        """
        Clean up external task (remove trigger label, mark processed)

        Args:
            task: External task to clean up

        Returns:
            True if cleanup successful
        """
        pass

    # Event system (for dashboard integration)
    def emit_event(self, event_type: str, data: Dict):
        """
        Emit event for dashboard visualization

        Event types:
        - plugin.task.fetched
        - plugin.work_effort.created
        - plugin.feedback.posted
        - plugin.cleanup.completed
        - plugin.error

        Args:
            event_type: Type of event being emitted
            data: Event-specific data payload
        """
        event = {
            'plugin': self.name,
            'type': event_type,
            'timestamp': datetime.utcnow().isoformat(),
            'data': data
        }

        for handler in self.event_handlers:
            handler(event)

    def on_event(self, handler):
        """
        Register event handler for dashboard updates

        Args:
            handler: Callable that accepts event dict
        """
        self.event_handlers.append(handler)
