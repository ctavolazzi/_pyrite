#!/usr/bin/env python3
"""
Todoist Polling Script

Monitors Todoist for tasks with the trigger label and automatically
creates work efforts.

Usage:
    # One-time check
    python plugins/todoist/poll.py --once

    # Continuous monitoring (every 5 minutes)
    python plugins/todoist/poll.py --interval 300

    # With custom config
    python plugins/todoist/poll.py --config todoist_config.json

Configuration:
    Set TODOIST_API_TOKEN environment variable or provide config file:
    {
        "api_token": "your-todoist-token",
        "trigger_label": "pyrite",
        "work_efforts_dir": "_work_efforts",
        "poll_interval": 300
    }
"""

import os
import sys
import json
import time
import argparse
from pathlib import Path
from datetime import datetime

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from plugins.todoist import TodoistPlugin
from plugins.todoist.api import TodoistAPIError


def load_config(config_path: str = None) -> dict:
    """
    Load configuration from file or environment

    Args:
        config_path: Path to JSON config file (optional)

    Returns:
        Configuration dictionary
    """
    config = {}

    # Load from file if provided
    if config_path and Path(config_path).exists():
        with open(config_path) as f:
            config = json.load(f)

    # Override with environment variables
    if 'TODOIST_API_TOKEN' in os.environ:
        config['api_token'] = os.environ['TODOIST_API_TOKEN']

    if 'TODOIST_TRIGGER_LABEL' in os.environ:
        config['trigger_label'] = os.environ['TODOIST_TRIGGER_LABEL']

    # Set defaults
    config.setdefault('trigger_label', 'pyrite')
    config.setdefault('work_efforts_dir', '_work_efforts')
    config.setdefault('poll_interval', 300)

    return config


def process_tasks(plugin: TodoistPlugin, verbose: bool = True):
    """
    Fetch and process all tasks with trigger label

    Args:
        plugin: Initialized TodoistPlugin
        verbose: Print detailed output

    Returns:
        Number of tasks processed
    """
    try:
        # Fetch tasks
        tasks = plugin.fetch_tasks()

        if verbose:
            if tasks:
                print(f"📥 Found {len(tasks)} task(s) to process")
            else:
                print("✓ No tasks to process")

        # Process each task
        processed = 0
        for task in tasks:
            try:
                if verbose:
                    print(f"\n{'='*60}")
                    print(f"Processing: {task.title}")
                    print(f"Task ID: {task.id}")
                    print(f"Labels: {', '.join(task.labels)}")

                # Create work effort
                work_effort = plugin.create_work_effort(task)
                if verbose:
                    print(f"✓ Created: {work_effort.folder_path.name}")

                # Post feedback
                feedback_success = plugin.post_feedback(task, work_effort)
                if verbose:
                    if feedback_success:
                        print(f"✓ Posted feedback to Todoist")
                    else:
                        print(f"⚠ Failed to post feedback")

                # Cleanup (remove label)
                cleanup_success = plugin.cleanup(task)
                if verbose:
                    if cleanup_success:
                        print(f"✓ Removed '{plugin.config['trigger_label']}' label")
                    else:
                        print(f"⚠ Failed to remove label")

                processed += 1

            except Exception as e:
                if verbose:
                    print(f"✗ Error processing task {task.id}: {str(e)}")
                continue

        if verbose and processed > 0:
            print(f"\n{'='*60}")
            print(f"✓ Processed {processed}/{len(tasks)} task(s) successfully")

        return processed

    except TodoistAPIError as e:
        if verbose:
            print(f"✗ API Error: {str(e)}")
        return 0
    except Exception as e:
        if verbose:
            print(f"✗ Unexpected error: {str(e)}")
        return 0


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Monitor Todoist for tasks and create work efforts',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )

    parser.add_argument(
        '--config',
        help='Path to JSON config file',
        type=str
    )

    parser.add_argument(
        '--once',
        action='store_true',
        help='Run once and exit (no continuous polling)'
    )

    parser.add_argument(
        '--interval',
        type=int,
        help='Poll interval in seconds (default: 300)',
        default=None
    )

    parser.add_argument(
        '--quiet',
        action='store_true',
        help='Suppress output (only show errors)'
    )

    args = parser.parse_args()

    # Load configuration
    try:
        config = load_config(args.config)
    except Exception as e:
        print(f"✗ Failed to load config: {str(e)}", file=sys.stderr)
        sys.exit(1)

    # Override interval if specified
    if args.interval:
        config['poll_interval'] = args.interval

    # Validate required config
    if 'api_token' not in config or not config['api_token']:
        print("✗ Error: TODOIST_API_TOKEN not set", file=sys.stderr)
        print("\nSet environment variable or provide config file:", file=sys.stderr)
        print("  export TODOIST_API_TOKEN='your-token'", file=sys.stderr)
        print("  OR", file=sys.stderr)
        print("  python poll.py --config config.json", file=sys.stderr)
        sys.exit(1)

    # Initialize plugin
    try:
        plugin = TodoistPlugin(config)
        plugin.validate_config()

        if not args.quiet:
            print(f"✓ Todoist plugin initialized")
            print(f"  Trigger label: {config['trigger_label']}")
            print(f"  Work efforts dir: {config['work_efforts_dir']}")

    except Exception as e:
        print(f"✗ Failed to initialize plugin: {str(e)}", file=sys.stderr)
        sys.exit(1)

    # Add event handler for monitoring
    def log_event(event):
        if not args.quiet and event['type'] == 'plugin.error':
            timestamp = datetime.fromisoformat(event['timestamp']).strftime('%H:%M:%S')
            print(f"[{timestamp}] Error: {event['data']}")

    plugin.on_event(log_event)

    # Run polling loop
    try:
        if args.once:
            # Run once and exit
            if not args.quiet:
                print(f"\n{'='*60}")
                print(f"Checking for tasks...")
            process_tasks(plugin, verbose=not args.quiet)

        else:
            # Continuous polling
            if not args.quiet:
                print(f"\n{'='*60}")
                print(f"Starting continuous monitoring")
                print(f"Poll interval: {config['poll_interval']} seconds")
                print(f"Press Ctrl+C to stop")
                print(f"{'='*60}\n")

            while True:
                if not args.quiet:
                    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    print(f"\n[{timestamp}] Checking for tasks...")

                process_tasks(plugin, verbose=not args.quiet)

                if not args.quiet:
                    print(f"Sleeping for {config['poll_interval']} seconds...")

                time.sleep(config['poll_interval'])

    except KeyboardInterrupt:
        if not args.quiet:
            print("\n\n✓ Stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n✗ Fatal error: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
