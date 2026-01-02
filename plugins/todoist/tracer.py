"""
Request Tracing System for Todoist Plugin

Provides comprehensive tracing of request flow from Todoist API
through plugin processing and back to Todoist.

This allows us to track the entire lifecycle of a task and ensure
there's no spaghetti code - we can trace every step.
"""

import json
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field, asdict
from enum import Enum


class TraceLevel(Enum):
    """Trace event levels"""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    SUCCESS = "SUCCESS"


@dataclass
class TraceEvent:
    """A single trace event in the request lifecycle"""
    timestamp: str
    level: TraceLevel
    component: str  # Which component emitted this (API, Plugin, Helper, etc.)
    operation: str  # What operation was performed
    data: Dict[str, Any] = field(default_factory=dict)
    duration_ms: Optional[float] = None
    parent_trace_id: Optional[str] = None
    error: Optional[str] = None

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization"""
        return {
            'timestamp': self.timestamp,
            'level': self.level.value,
            'component': self.component,
            'operation': self.operation,
            'data': self.data,
            'duration_ms': self.duration_ms,
            'parent_trace_id': self.parent_trace_id,
            'error': self.error
        }


@dataclass
class RequestTrace:
    """Complete trace of a request from start to finish"""
    trace_id: str
    task_id: str
    started_at: str
    completed_at: Optional[str] = None
    status: str = "in_progress"  # in_progress, success, failed
    events: List[TraceEvent] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def add_event(
        self,
        level: TraceLevel,
        component: str,
        operation: str,
        data: Dict[str, Any] = None,
        duration_ms: float = None,
        error: str = None
    ):
        """Add a trace event"""
        event = TraceEvent(
            timestamp=datetime.utcnow().isoformat(),
            level=level,
            component=component,
            operation=operation,
            data=data or {},
            duration_ms=duration_ms,
            parent_trace_id=self.trace_id,
            error=error
        )
        self.events.append(event)

    def complete(self, status: str = "success"):
        """Mark trace as complete"""
        self.completed_at = datetime.utcnow().isoformat()
        self.status = status

    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            'trace_id': self.trace_id,
            'task_id': self.task_id,
            'started_at': self.started_at,
            'completed_at': self.completed_at,
            'status': self.status,
            'events': [e.to_dict() for e in self.events],
            'metadata': self.metadata
        }

    def print_trace(self):
        """Print formatted trace to console"""
        print("\n" + "="*80)
        print(f"TRACE: {self.trace_id}")
        print(f"Task ID: {self.task_id}")
        print(f"Status: {self.status}")
        print(f"Started: {self.started_at}")
        if self.completed_at:
            print(f"Completed: {self.completed_at}")
        print("="*80)

        for i, event in enumerate(self.events, 1):
            # Format timestamp
            ts = datetime.fromisoformat(event.timestamp).strftime('%H:%M:%S.%f')[:-3]

            # Level icon
            level_icons = {
                TraceLevel.DEBUG: "🔍",
                TraceLevel.INFO: "ℹ️ ",
                TraceLevel.WARNING: "⚠️ ",
                TraceLevel.ERROR: "❌",
                TraceLevel.SUCCESS: "✅"
            }
            icon = level_icons.get(event.level, "•")

            # Format component and operation
            component = f"[{event.component}]".ljust(15)

            # Print event
            print(f"\n{i:2d}. {icon} {ts} {component} {event.operation}")

            # Print data if present
            if event.data:
                for key, value in event.data.items():
                    # Truncate long values
                    if isinstance(value, str) and len(value) > 60:
                        value = value[:57] + "..."
                    print(f"    {key}: {value}")

            # Print duration if present
            if event.duration_ms is not None:
                print(f"    ⏱️  Duration: {event.duration_ms:.2f}ms")

            # Print error if present
            if event.error:
                print(f"    ❌ Error: {event.error}")

        print("\n" + "="*80)

    def save_to_file(self, directory: str = "_traces"):
        """Save trace to JSON file"""
        trace_dir = Path(directory)
        trace_dir.mkdir(exist_ok=True)

        filename = f"trace_{self.trace_id}_{self.task_id}.json"
        filepath = trace_dir / filename

        with open(filepath, 'w') as f:
            json.dump(self.to_dict(), f, indent=2)

        return filepath


class RequestTracer:
    """
    Central request tracer for tracking request lifecycle

    Usage:
        >>> tracer = RequestTracer()
        >>> trace = tracer.start_trace(task_id='task-123')
        >>> trace.add_event(TraceLevel.INFO, 'API', 'Fetching task')
        >>> trace.complete('success')
        >>> trace.print_trace()
    """

    def __init__(self):
        self.active_traces: Dict[str, RequestTrace] = {}
        self.completed_traces: List[RequestTrace] = []

    def start_trace(self, task_id: str, metadata: Dict[str, Any] = None) -> RequestTrace:
        """Start a new request trace"""
        trace_id = f"trace-{int(time.time() * 1000)}-{task_id[:8]}"

        trace = RequestTrace(
            trace_id=trace_id,
            task_id=task_id,
            started_at=datetime.utcnow().isoformat(),
            metadata=metadata or {}
        )

        self.active_traces[trace_id] = trace

        trace.add_event(
            TraceLevel.INFO,
            'Tracer',
            'Trace started',
            {'task_id': task_id}
        )

        return trace

    def get_trace(self, trace_id: str) -> Optional[RequestTrace]:
        """Get active trace by ID"""
        return self.active_traces.get(trace_id)

    def complete_trace(self, trace_id: str, status: str = "success"):
        """Complete and archive a trace"""
        if trace_id in self.active_traces:
            trace = self.active_traces[trace_id]
            trace.complete(status)

            trace.add_event(
                TraceLevel.SUCCESS if status == "success" else TraceLevel.ERROR,
                'Tracer',
                'Trace completed',
                {'status': status}
            )

            self.completed_traces.append(trace)
            del self.active_traces[trace_id]

            return trace

        return None

    def get_all_traces(self) -> List[RequestTrace]:
        """Get all traces (active and completed)"""
        return list(self.active_traces.values()) + self.completed_traces

    def print_summary(self):
        """Print summary of all traces"""
        print("\n" + "="*80)
        print("TRACE SUMMARY")
        print("="*80)
        print(f"Active traces: {len(self.active_traces)}")
        print(f"Completed traces: {len(self.completed_traces)}")

        if self.completed_traces:
            print("\nCompleted Traces:")
            for trace in self.completed_traces:
                status_icon = "✅" if trace.status == "success" else "❌"
                event_count = len(trace.events)
                print(f"  {status_icon} {trace.trace_id} ({trace.task_id}) - {event_count} events")

        print("="*80)


# Global tracer instance
_global_tracer = RequestTracer()


def get_tracer() -> RequestTracer:
    """Get the global tracer instance"""
    return _global_tracer


def trace_operation(component: str, operation: str):
    """
    Decorator to automatically trace function calls

    Usage:
        @trace_operation('API', 'fetch_tasks')
        def fetch_tasks(self):
            ...
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Try to get trace from context if available
            # For now, just execute the function
            # (Could be enhanced to automatically detect trace context)
            return func(*args, **kwargs)
        return wrapper
    return decorator
