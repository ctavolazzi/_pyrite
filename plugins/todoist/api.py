"""
Todoist API v2 client

Handles authentication and API calls to Todoist REST API v2.
Documentation: https://developer.todoist.com/rest/v2/
"""

import requests
from typing import List, Dict, Optional
from datetime import datetime


class TodoistAPIError(Exception):
    """Raised when Todoist API returns an error"""
    pass


class TodoistAPI:
    """
    Todoist REST API v2 client

    Handles task fetching, commenting, and label management.

    Example:
        >>> api = TodoistAPI(api_token='your-token')
        >>> tasks = api.get_tasks(label='pyrite')
        >>> api.add_comment(task_id='123', content='Work effort created!')
    """

    BASE_URL = "https://api.todoist.com/rest/v2"

    def __init__(self, api_token: str):
        """
        Initialize Todoist API client

        Args:
            api_token: Todoist API token (from Settings -> Integrations -> Developer)
        """
        self.api_token = api_token
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_token}',
            'Content-Type': 'application/json'
        })

    def _request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """
        Make authenticated request to Todoist API

        Args:
            method: HTTP method (GET, POST, DELETE)
            endpoint: API endpoint (e.g., '/tasks')
            **kwargs: Additional arguments for requests

        Returns:
            Response object

        Raises:
            TodoistAPIError: If API returns error status
        """
        url = f"{self.BASE_URL}{endpoint}"

        try:
            response = self.session.request(method, url, **kwargs)
            response.raise_for_status()
            return response
        except requests.exceptions.HTTPError as e:
            error_msg = f"Todoist API error: {e.response.status_code}"
            try:
                error_data = e.response.json()
                error_msg += f" - {error_data}"
            except:
                error_msg += f" - {e.response.text}"
            raise TodoistAPIError(error_msg) from e
        except requests.exceptions.RequestException as e:
            raise TodoistAPIError(f"Network error: {str(e)}") from e

    def get_tasks(self, label: Optional[str] = None) -> List[Dict]:
        """
        Fetch tasks, optionally filtered by label

        Args:
            label: Filter tasks by label name (optional)

        Returns:
            List of task dictionaries

        Example:
            >>> tasks = api.get_tasks(label='pyrite')
            >>> for task in tasks:
            ...     print(task['content'])
        """
        params = {}
        if label:
            params['filter'] = f'@{label}'

        response = self._request('GET', '/tasks', params=params)
        return response.json()

    def get_task(self, task_id: str) -> Dict:
        """
        Fetch a single task by ID

        Args:
            task_id: Todoist task ID

        Returns:
            Task dictionary
        """
        response = self._request('GET', f'/tasks/{task_id}')
        return response.json()

    def add_comment(self, task_id: str, content: str) -> Dict:
        """
        Add a comment to a task

        Args:
            task_id: Todoist task ID
            content: Comment text (markdown supported)

        Returns:
            Comment dictionary

        Example:
            >>> api.add_comment('123', 'Work effort created!')
        """
        data = {
            'task_id': task_id,
            'content': content
        }

        response = self._request('POST', '/comments', json=data)
        return response.json()

    def get_labels(self) -> List[Dict]:
        """
        Fetch all labels for the user

        Returns:
            List of label dictionaries
        """
        response = self._request('GET', '/labels')
        return response.json()

    def update_task(self, task_id: str, **kwargs) -> Dict:
        """
        Update a task

        Args:
            task_id: Todoist task ID
            **kwargs: Fields to update (labels, content, description, etc.)

        Returns:
            Updated task dictionary

        Example:
            >>> api.update_task('123', labels=['work', 'urgent'])
        """
        response = self._request('POST', f'/tasks/{task_id}', json=kwargs)
        return response.json()

    def remove_label_from_task(self, task_id: str, label_name: str) -> Dict:
        """
        Remove a specific label from a task

        Args:
            task_id: Todoist task ID
            label_name: Name of label to remove

        Returns:
            Updated task dictionary

        Note:
            This fetches the task, removes the label from the list,
            and updates the task with the new label list.
        """
        # Get current task
        task = self.get_task(task_id)

        # Get current labels
        current_labels = task.get('labels', [])

        # Remove the specified label
        updated_labels = [label for label in current_labels if label != label_name]

        # Update task with new labels
        return self.update_task(task_id, labels=updated_labels)

    def close_task(self, task_id: str) -> bool:
        """
        Close (complete) a task

        Args:
            task_id: Todoist task ID

        Returns:
            True if successful
        """
        self._request('POST', f'/tasks/{task_id}/close')
        return True

    def validate_token(self) -> bool:
        """
        Validate API token by making a test request

        Returns:
            True if token is valid

        Raises:
            TodoistAPIError: If token is invalid
        """
        try:
            self.get_labels()
            return True
        except TodoistAPIError:
            return False
