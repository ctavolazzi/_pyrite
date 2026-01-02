"""
Template Plugin - Copy this to create new integrations

Steps to create a new plugin:
1. Copy this directory to plugins/{service_name}/
2. Rename plugin.py to match your service
3. Implement all abstract methods
4. Add service-specific API client
5. Test with real API
"""

from plugins.base import BasePlugin, ExternalTask, WorkEffort
from typing import List, Dict
from datetime import datetime
from pathlib import Path


class TemplatePlugin(BasePlugin):
    """
    Template plugin showing required implementation

    Replace with your service name (e.g., GitHubIssuesPlugin, JiraPlugin)
    """

    @property
    def name(self) -> str:
        """Return the plugin name"""
        return "template"

    def validate_config(self) -> bool:
        """
        Validate plugin configuration

        Check that all required configuration keys are present
        and have valid values.
        """
        # Check required config keys
        required = ['api_key', 'service_url']
        for key in required:
            if key not in self.config:
                raise ValueError(f"Missing required config: {key}")

        # Add validation for specific values
        if not self.config['api_key']:
            raise ValueError("api_key cannot be empty")

        if not self.config['service_url'].startswith('http'):
            raise ValueError("service_url must be a valid HTTP(S) URL")

        return True

    def fetch_tasks(self) -> List[ExternalTask]:
        """
        Fetch tasks from external service that need processing

        This method should:
        1. Connect to your external service API
        2. Query for tasks with your trigger label/tag
        3. Parse each task into ExternalTask format
        4. Return the list
        """
        # TODO: Implement API call to fetch tasks
        # Example:
        # response = requests.get(
        #     f"{self.config['service_url']}/tasks",
        #     headers={'Authorization': f"Bearer {self.config['api_key']}"}
        # )
        # tasks = []
        # for task_data in response.json():
        #     task = ExternalTask(
        #         id=task_data['id'],
        #         title=task_data['title'],
        #         description=task_data.get('description'),
        #         created=datetime.fromisoformat(task_data['created_at']),
        #         due_date=datetime.fromisoformat(task_data['due']) if task_data.get('due') else None,
        #         labels=task_data.get('labels', []),
        #         url=task_data['url'],
        #         raw_data=task_data
        #     )
        #     tasks.append(task)
        # return tasks

        raise NotImplementedError("Implement fetch_tasks()")

    def create_work_effort(self, task: ExternalTask) -> WorkEffort:
        """
        Create work effort from external task

        This method should:
        1. Generate a work effort ID (WE-YYMMDD-xxxx format)
        2. Create folder structure
        3. Create index file with task metadata
        4. Validate naming using the naming linter
        5. Return WorkEffort object
        """
        # TODO: Implement WE creation logic
        # Example:
        # from tools.naming_linter.rules.common import validate_we_folder_name
        #
        # # Generate WE ID
        # we_id = self._generate_we_id()
        # folder_name = f"{we_id}_{self._sanitize_title(task.title)}"
        #
        # # Validate before creating
        # error = validate_we_folder_name(folder_name)
        # if error:
        #     raise ValueError(f"Invalid folder name: {error}")
        #
        # # Create structure
        # folder_path = Path("_work_efforts") / folder_name
        # folder_path.mkdir(parents=True, exist_ok=True)
        #
        # tickets_dir = folder_path / "tickets"
        # tickets_dir.mkdir(exist_ok=True)
        #
        # index_path = folder_path / f"{we_id}_index.md"
        # self._create_index_file(index_path, task)
        #
        # return WorkEffort(
        #     we_id=we_id,
        #     folder_path=folder_path,
        #     index_path=index_path,
        #     tickets_dir=tickets_dir,
        #     source_task=task
        # )

        raise NotImplementedError("Implement create_work_effort()")

    def post_feedback(self, task: ExternalTask, work_effort: WorkEffort) -> bool:
        """
        Post feedback to external service (comment with link)

        This method should:
        1. Format a message with link to work effort
        2. Post comment/note to the external task
        3. Handle API errors gracefully
        4. Return success status
        """
        # TODO: Post comment back to service
        # Example:
        # message = f"Work effort created: {work_effort.folder_path.name}\n"
        # message += f"Index: {work_effort.index_path}\n"
        # message += f"Tickets: {work_effort.tickets_dir}"
        #
        # response = requests.post(
        #     f"{self.config['service_url']}/tasks/{task.id}/comments",
        #     headers={'Authorization': f"Bearer {self.config['api_key']}"},
        #     json={'content': message}
        # )
        # return response.status_code == 200

        raise NotImplementedError("Implement post_feedback()")

    def cleanup(self, task: ExternalTask) -> bool:
        """
        Clean up external task (remove trigger label, mark processed)

        This method should:
        1. Remove your trigger label from the task
        2. Optionally close/complete the task
        3. Handle API errors gracefully
        4. Return success status
        """
        # TODO: Remove trigger label or mark processed
        # Example:
        # response = requests.delete(
        #     f"{self.config['service_url']}/tasks/{task.id}/labels/trigger-label",
        #     headers={'Authorization': f"Bearer {self.config['api_key']}"}
        # )
        # return response.status_code == 200

        raise NotImplementedError("Implement cleanup()")

    # Helper methods (optional but recommended)

    def _generate_we_id(self) -> str:
        """Generate work effort ID in WE-YYMMDD-xxxx format"""
        # TODO: Implement ID generation
        # Can reference tools/work-effort-migrator/migrate.py for logic
        pass

    def _sanitize_title(self, title: str) -> str:
        """Convert task title to valid folder name component"""
        # TODO: Implement title sanitization
        # - Convert to lowercase
        # - Replace spaces with underscores
        # - Remove special characters
        # - Truncate if too long
        pass

    def _create_index_file(self, path: Path, task: ExternalTask):
        """Create index markdown file with task metadata"""
        # TODO: Generate index file with YAML frontmatter
        pass
