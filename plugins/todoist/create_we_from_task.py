#!/usr/bin/env python3
"""
Create Work Effort from Todoist Task ID

Called by webhook server when task with 'pyrite' label is created.

Usage:
    python create_we_from_task.py --task-id <todoist-task-id>
"""

import os
import sys
import argparse
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from plugins.todoist import TodoistPlugin
from plugins.todoist.api import TodoistAPI

def main():
    parser = argparse.ArgumentParser(description='Create work effort from Todoist task')
    parser.add_argument('--task-id', required=True, help='Todoist task ID')
    args = parser.parse_args()

    # Get API token from environment
    api_token = os.environ.get('TODOIST_API_TOKEN')
    if not api_token:
        print("Error: TODOIST_API_TOKEN not set", file=sys.stderr)
        sys.exit(1)

    try:
        # Initialize plugin
        config = {
            'api_token': api_token,
            'trigger_label': 'pyrite',
            'work_efforts_dir': '_work_efforts'
        }

        plugin = TodoistPlugin(config)
        api = TodoistAPI(api_token)

        # Fetch task
        task_data = api.get_task(args.task_id)

        # Convert to ExternalTask
        from plugins.base import ExternalTask
        from datetime import datetime

        task = ExternalTask(
            id=task_data['id'],
            title=task_data['content'],
            description=task_data.get('description', ''),
            created=datetime.fromisoformat(task_data['created_at'].replace('Z', '+00:00')),
            labels=task_data.get('labels', []),
            url=task_data.get('url', f"https://todoist.com/showTask?id={task_data['id']}"),
            raw_data=task_data
        )

        # Create work effort
        work_effort = plugin.create_work_effort(task)
        print(f"✓ Created: {work_effort.we_id}")
        print(f"  Path: {work_effort.folder_path}")

        # Post feedback
        plugin.post_feedback(task, work_effort)
        print(f"✓ Posted feedback to Todoist")

        # Remove label
        plugin.cleanup(task)
        print(f"✓ Removed 'pyrite' label")

        sys.exit(0)

    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
