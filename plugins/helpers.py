"""
Helper functions for plugin implementations

Common utilities for generating work effort IDs, sanitizing titles,
and validating folder names using the naming linter.
"""

import re
import random
import string
from datetime import datetime
from pathlib import Path
from typing import Optional


def generate_we_id() -> str:
    """
    Generate a work effort ID in WE-YYMMDD-xxxx format

    Returns:
        Work effort ID string (e.g., 'WE-260101-a7b3')

    Example:
        >>> we_id = generate_we_id()
        >>> print(we_id)  # WE-260101-a7b3
    """
    date_str = datetime.now().strftime('%y%m%d')
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
    return f"WE-{date_str}-{random_str}"


def sanitize_title(title: str, max_length: int = 50) -> str:
    """
    Convert task title to a valid folder name component

    Args:
        title: The task title to sanitize
        max_length: Maximum length for sanitized title (default: 50)

    Returns:
        Sanitized title safe for use in folder names

    Example:
        >>> sanitize_title("Build User Authentication System!")
        'build_user_authentication_system'
        >>> sanitize_title("Fix Bug #123: Login Error")
        'fix_bug_123_login_error'
    """
    # Convert to lowercase
    title = title.lower()

    # Replace spaces and special chars with underscores
    title = re.sub(r'[^a-z0-9]+', '_', title)

    # Remove leading/trailing underscores
    title = title.strip('_')

    # Collapse multiple consecutive underscores
    title = re.sub(r'_+', '_', title)

    # Truncate if too long
    if len(title) > max_length:
        title = title[:max_length].rstrip('_')

    return title


def validate_folder_name(folder_name: str) -> Optional[str]:
    """
    Validate work effort folder name using naming linter

    Args:
        folder_name: Folder name to validate (e.g., 'WE-260101-abcd_title')

    Returns:
        None if valid, error message string if invalid

    Example:
        >>> error = validate_folder_name('WE-260101-abcd_my_task')
        >>> if error:
        ...     print(f"Invalid: {error}")
    """
    try:
        from tools.naming_linter.rules.common import validate_we_folder_name
        return validate_we_folder_name(folder_name)
    except ImportError:
        # Naming linter not available - skip validation
        return None


def create_work_effort_structure(
    base_path: Path,
    we_id: str,
    title: str,
    validate: bool = True
) -> tuple[Path, Path, Path]:
    """
    Create work effort folder structure

    Args:
        base_path: Base directory for work efforts (e.g., Path('_work_efforts'))
        we_id: Work effort ID (e.g., 'WE-260101-abcd')
        title: Task title (will be sanitized)
        validate: Whether to validate folder name (default: True)

    Returns:
        Tuple of (folder_path, index_path, tickets_dir)

    Raises:
        ValueError: If folder name is invalid

    Example:
        >>> base = Path('_work_efforts')
        >>> folder, index, tickets = create_work_effort_structure(
        ...     base, 'WE-260101-abcd', 'My Task'
        ... )
    """
    # Sanitize title and create folder name
    sanitized_title = sanitize_title(title)
    folder_name = f"{we_id}_{sanitized_title}"

    # Validate folder name if requested
    if validate:
        error = validate_folder_name(folder_name)
        if error:
            raise ValueError(f"Invalid folder name '{folder_name}': {error}")

    # Create directory structure
    folder_path = base_path / folder_name
    folder_path.mkdir(parents=True, exist_ok=True)

    tickets_dir = folder_path / "tickets"
    tickets_dir.mkdir(exist_ok=True)

    index_path = folder_path / f"{we_id}_index.md"

    return folder_path, index_path, tickets_dir


def find_work_effort_by_id(base_path: Path, we_id: str) -> Optional[Path]:
    """
    Find an existing work effort by its WE-ID

    Searches through the work efforts directory for a folder matching the WE-ID.

    Args:
        base_path: Base directory for work efforts (e.g., Path('_work_efforts'))
        we_id: Work effort ID to search for (e.g., 'WE-260101-abcd')

    Returns:
        Path to work effort folder if found, None otherwise

    Example:
        >>> base = Path('_work_efforts')
        >>> we_path = find_work_effort_by_id(base, 'WE-260101-abcd')
        >>> if we_path:
        ...     print(f"Found: {we_path}")
    """
    if not base_path.exists():
        return None

    # Search for directories starting with the WE-ID
    for entry in base_path.iterdir():
        if entry.is_dir() and entry.name.startswith(we_id):
            return entry

    return None


def generate_ticket_id(we_id: str, sequence: int) -> str:
    """
    Generate a ticket ID in TKT-xxxx-NNN format

    Uses the short ID from the work effort (e.g., 'abcd' from 'WE-260101-abcd')
    and appends a zero-padded sequence number.

    Args:
        we_id: Work effort ID (e.g., 'WE-260101-abcd')
        sequence: Ticket sequence number (e.g., 1, 2, 3)

    Returns:
        Ticket ID string (e.g., 'TKT-abcd-001')

    Example:
        >>> ticket_id = generate_ticket_id('WE-260101-abcd', 1)
        >>> print(ticket_id)  # TKT-abcd-001
    """
    # Extract short ID from WE-ID (last 4 characters)
    short_id = we_id.split('-')[-1]
    return f"TKT-{short_id}-{sequence:03d}"


def create_ticket_file(
    tickets_dir: Path,
    ticket_id: str,
    title: str,
    description: Optional[str] = None,
    source_task_id: Optional[str] = None,
    source_url: Optional[str] = None,
    labels: Optional[list[str]] = None
) -> Path:
    """
    Create a ticket file in the tickets directory

    Args:
        tickets_dir: Path to tickets directory
        ticket_id: Ticket ID (e.g., 'TKT-abcd-001')
        title: Ticket title
        description: Ticket description (optional)
        source_task_id: ID of source task (optional)
        source_url: URL to source task (optional)
        labels: List of labels/tags (optional)

    Returns:
        Path to created ticket file

    Example:
        >>> tickets_dir = Path('_work_efforts/WE-260101-abcd_my_task/tickets')
        >>> ticket_path = create_ticket_file(
        ...     tickets_dir,
        ...     'TKT-abcd-001',
        ...     'Create login form',
        ...     description='Build the login UI component',
        ...     source_task_id='12345',
        ...     labels=['frontend', 'ui']
        ... )
    """
    # Sanitize title for filename
    sanitized_title = sanitize_title(title)
    filename = f"{ticket_id}_{sanitized_title}.md"
    ticket_path = tickets_dir / filename

    # Build YAML frontmatter
    created_iso = datetime.now().isoformat()
    frontmatter = f"""---
id: {ticket_id}
title: "{title}"
status: pending
created: {created_iso}
"""

    if source_task_id:
        frontmatter += f"source_task_id: {source_task_id}\n"
    if source_url:
        frontmatter += f"source_url: {source_url}\n"
    if labels:
        frontmatter += f"labels: {labels}\n"

    frontmatter += "---\n"

    # Build markdown content
    content = f"{frontmatter}\n# {title}\n\n"

    if description:
        content += f"## Description\n\n{description}\n\n"

    content += """## Status

- [ ] Not started

## Notes

Add implementation notes here.
"""

    # Write ticket file
    ticket_path.write_text(content)
    return ticket_path


def format_index_file(
    we_id: str,
    title: str,
    description: Optional[str] = None,
    source: Optional[str] = None,
    source_url: Optional[str] = None,
    labels: Optional[list[str]] = None,
    created: Optional[datetime] = None
) -> str:
    """
    Generate content for work effort index file

    Args:
        we_id: Work effort ID
        title: Task title
        description: Task description (optional)
        source: Source service name (e.g., 'todoist')
        source_url: URL to original task
        labels: List of labels/tags
        created: Creation timestamp

    Returns:
        Markdown content with YAML frontmatter

    Example:
        >>> content = format_index_file(
        ...     'WE-260101-abcd',
        ...     'My Task',
        ...     description='Do the thing',
        ...     source='todoist',
        ...     labels=['urgent', 'backend']
        ... )
    """
    created_iso = (created or datetime.now()).isoformat()
    labels_str = labels or []

    # Build YAML frontmatter
    frontmatter = f"""---
id: {we_id}
title: "{title}"
status: in_progress
created: {created_iso}
"""

    if source:
        frontmatter += f"source: {source}\n"
    if source_url:
        frontmatter += f"source_url: {source_url}\n"
    if labels_str:
        frontmatter += f"labels: {labels_str}\n"

    frontmatter += "---\n"

    # Build markdown content
    content = f"{frontmatter}\n# {title}\n\n"

    if description:
        content += f"## Description\n\n{description}\n\n"

    if source and source_url:
        content += f"""## Source Task

- **Service**: {source}
- **URL**: {source_url}
"""
        if labels_str:
            content += f"- **Labels**: {', '.join(labels_str)}\n"

        content += "\n"

    content += """## Progress

- Work effort created
- Ready for implementation

## Next Steps

1. Review task requirements
2. Create tickets in `tickets/` directory
3. Begin implementation
"""

    return content
