"""
Common utilities and pattern matching for naming validation
"""

import re
from typing import Optional, Dict


# Naming patterns
WE_FOLDER_PATTERN = re.compile(r'^WE-\d{6}-[a-z0-9]{4}_[a-z0-9_]+$')
WE_INDEX_PATTERN = re.compile(r'^WE-\d{6}-[a-z0-9]{4}_index\.md$')
WE_ID_PATTERN = re.compile(r'^WE-\d{6}-[a-z0-9]{4}$')
TICKET_PATTERN = re.compile(r'^TKT-\d{6}-\d{3}_[a-z0-9_]+\.md$')
TICKET_ID_PATTERN = re.compile(r'^TKT-\d{6}-\d{3}$')


def validate_we_folder_name(folder_name: str) -> Optional[str]:
    """
    Validate work effort folder name matches pattern: WE-YYMMDD-xxxx_description/

    Args:
        folder_name: Folder name to validate (without path)

    Returns:
        Error message if invalid, None if valid
    """
    if not WE_FOLDER_PATTERN.match(folder_name):
        return f"Folder name must match pattern: WE-YYMMDD-xxxx_description (lowercase, underscores)"
    return None


def validate_we_index_name(filename: str) -> Optional[str]:
    """
    Validate index file name matches pattern: WE-YYMMDD-xxxx_index.md

    Args:
        filename: File name to validate (without path)

    Returns:
        Error message if invalid, None if valid
    """
    if not WE_INDEX_PATTERN.match(filename):
        return f"Index file must match pattern: WE-YYMMDD-xxxx_index.md"
    return None


def validate_we_id(we_id: str) -> Optional[str]:
    """
    Validate work effort ID matches pattern: WE-YYMMDD-xxxx

    Args:
        we_id: Work effort ID to validate

    Returns:
        Error message if invalid, None if valid
    """
    if not WE_ID_PATTERN.match(we_id):
        return f"Work effort ID must match pattern: WE-YYMMDD-xxxx (6 digits, 4 lowercase hex)"
    return None


def validate_ticket_name(filename: str) -> Optional[str]:
    """
    Validate ticket file name matches pattern: TKT-YYMMDD-NNN_description.md

    Args:
        filename: File name to validate (without path)

    Returns:
        Error message if invalid, None if valid
    """
    if not TICKET_PATTERN.match(filename):
        return f"Ticket file must match pattern: TKT-YYMMDD-NNN_description.md"
    return None


def validate_ticket_id(ticket_id: str) -> Optional[str]:
    """
    Validate ticket ID matches pattern: TKT-YYMMDD-NNN

    Args:
        ticket_id: Ticket ID to validate

    Returns:
        Error message if invalid, None if valid
    """
    if not TICKET_ID_PATTERN.match(ticket_id):
        return f"Ticket ID must match pattern: TKT-YYMMDD-NNN"
    return None


def extract_we_id_from_folder(folder_name: str) -> Optional[str]:
    """
    Extract work effort ID from folder name

    Args:
        folder_name: Folder name (e.g., "WE-260101-a1b2_test_feature")

    Returns:
        Work effort ID (e.g., "WE-260101-a1b2") or None if invalid
    """
    match = re.match(r'^(WE-\d{6}-[a-z0-9]{4})_', folder_name)
    return match.group(1) if match else None


def extract_we_id_from_index(filename: str) -> Optional[str]:
    """
    Extract work effort ID from index filename

    Args:
        filename: Index filename (e.g., "WE-260101-a1b2_index.md")

    Returns:
        Work effort ID (e.g., "WE-260101-a1b2") or None if invalid
    """
    match = re.match(r'^(WE-\d{6}-[a-z0-9]{4})_index\.md$', filename)
    return match.group(1) if match else None


def sanitize_description(text: str) -> str:
    """
    Convert text to safe filename description (lowercase, underscores)

    Args:
        text: Text to sanitize

    Returns:
        Sanitized string safe for filenames
    """
    # Remove special characters
    clean = re.sub(r'[^\w\s-]', '', text.lower())
    # Replace spaces/hyphens with underscores
    clean = re.sub(r'[-\s]+', '_', clean)
    # Remove leading/trailing underscores
    return clean.strip('_')


def generate_expected_folder_name(we_id: str, title: str) -> str:
    """
    Generate expected folder name from WE ID and title

    Args:
        we_id: Work effort ID (e.g., "WE-260101-a1b2")
        title: Work effort title

    Returns:
        Expected folder name (e.g., "WE-260101-a1b2_build_authentication")
    """
    description = sanitize_description(title)
    return f"{we_id}_{description}"


def generate_expected_index_name(we_id: str) -> str:
    """
    Generate expected index filename from WE ID

    Args:
        we_id: Work effort ID (e.g., "WE-260101-a1b2")

    Returns:
        Expected index filename (e.g., "WE-260101-a1b2_index.md")
    """
    return f"{we_id}_index.md"
