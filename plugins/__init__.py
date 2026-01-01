"""
Plugin system for external task integrations

This package provides the base architecture for integrating external
task management services (Todoist, GitHub Issues, Jira, etc.) with
the work effort system.
"""

from plugins.base import BasePlugin, ExternalTask, WorkEffort
from plugins.helpers import (
    generate_we_id,
    sanitize_title,
    validate_folder_name,
    create_work_effort_structure,
    format_index_file
)

__all__ = [
    'BasePlugin',
    'ExternalTask',
    'WorkEffort',
    'generate_we_id',
    'sanitize_title',
    'validate_folder_name',
    'create_work_effort_structure',
    'format_index_file'
]
