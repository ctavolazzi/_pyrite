"""
Daily Note Bridge — pushes _pyrite work effort summaries into the Obsidian daily note.

Uses daily_note.py from SimpleAgentOS as the write target. That module stays
zero-dependency; this plugin imports it via sys.path insertion.

Features:
    - Scans _pyrite/_work_efforts/ and formats wiki-linked markdown tables
    - Full sync: frontmatter + work_efforts + focus_snapshot + in_the_lab
    - Graceful handling of missing notes, missing sections, corrupt frontmatter
    - Creates notes from template when they don't exist (tomorrow, any date)
    - Logs bridge-level operations to trail_log via harness_log
    - Session tracking with operation IDs

Usage:
    from plugins.daily_note.plugin import DailyNoteBridge
    bridge = DailyNoteBridge({"work_efforts_dir": "...", "simpleagentos_dir": "..."})
    result = bridge.sync()              # work_efforts section only
    result = bridge.full_sync()         # frontmatter + all sections
    result = bridge.ensure_note("2026-04-08")  # create tomorrow's note
"""

import re
import sys
import uuid
from datetime import datetime, timedelta
from pathlib import Path


_DEFAULT_SIMPLEAGENTOS = "/Users/ctavolazzi/Code/_experiments/SimpleAgentOS"
_VAULT_DIR = Path.home() / "Documents" / "Personal-Remote-Vault"
_TEMPLATE_PATH = _VAULT_DIR / "System" / "00-09_system_meta" / "02_templates" / "Daily_Note_Template.md"


class DailyNoteBridge:
    """Bridge between _pyrite work efforts and the daily note harness.

    Every public method returns a dict with at least a 'status' key.
    Operations are logged to trail_log if harness_log is available.
    """

    def __init__(self, config: dict):
        self.we_dir = Path(config.get(
            "work_efforts_dir",
            Path(__file__).resolve().parents[2] / "_work_efforts",
        ))
        self.sao_dir = config.get("simpleagentos_dir", _DEFAULT_SIMPLEAGENTOS)
        self.actor = config.get("actor", "claude")
        self.include_git_health = config.get("include_git_health", True)
        self._session_id = uuid.uuid4().hex[:12]
        self._op_count = 0

    # ------------------------------------------------------------------
    # Note lifecycle
    # ------------------------------------------------------------------

    def ensure_note(self, date: str | None = None) -> dict:
        """Ensure a daily note exists for the given date. Create from template if missing.

        Args:
            date: YYYY-MM-DD string, defaults to today.

        Returns:
            dict with status ("exists", "created", or "error").
        """
        self._ensure_daily_note_importable()
        import daily_note as dn

        target_date = date or datetime.now().strftime("%Y-%m-%d")
        if dn.exists(target_date):
            return {"status": "exists", "date": target_date}

        return self._create_note_from_template(target_date)

    def ensure_tomorrow(self) -> dict:
        """Create tomorrow's daily note from template if it doesn't exist."""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        return self.ensure_note(tomorrow)

    # ------------------------------------------------------------------
    # Scan
    # ------------------------------------------------------------------

    def scan_work_efforts(self) -> list[dict]:
        """Parse YAML frontmatter from every WE-*/WE-*_index.md file."""
        efforts = []
        for we_dir in sorted(self.we_dir.glob("WE-*")):
            if not we_dir.is_dir():
                continue
            indexes = list(we_dir.glob("WE-*_index.md"))
            if not indexes:
                continue
            fm = self._parse_frontmatter(indexes[0])
            if fm:
                fm["folder"] = we_dir.name
                efforts.append(fm)
        return efforts

    # ------------------------------------------------------------------
    # Format
    # ------------------------------------------------------------------

    def format_section(self, efforts: list[dict], git_health: str = "") -> str:
        """Render the complete ## Work Efforts section body."""
        ts = datetime.now().strftime("%H:%M")
        lines = [f"**_pyrite Work Efforts** -- synced {ts}", ""]

        by_status: dict[str, int] = {}
        for e in efforts:
            s = e.get("status", "unknown")
            by_status[s] = by_status.get(s, 0) + 1

        total = len(efforts)
        active = [e for e in efforts if e.get("status") in ("active", "in_progress")]
        completed_count = by_status.get("completed", 0)
        paused_count = by_status.get("paused", 0)

        if active:
            lines.append("| Status | ID | Title | Last Updated |")
            lines.append("|--------|----|-------|--------------|")
            for e in active:
                we_id = e.get("id", "?")
                title = e.get("title", "Untitled")
                updated = self._short_date(
                    e.get("last_updated") or e.get("created") or ""
                )
                lines.append(
                    f"| active | [[{we_id}]] "
                    f"| [[{we_id}|{title}]] | {updated} |"
                )
            lines.append("")

        parts = []
        if active:
            parts.append(f"{len(active)} active")
        if completed_count:
            parts.append(f"{completed_count} completed")
        if paused_count:
            parts.append(f"{paused_count} paused")
        lines.append(f"**Summary:** {total} total -- {', '.join(parts)}")
        lines.append("")

        if git_health:
            lines.append("---")
            lines.append("")
            lines.append(git_health)

        return "\n".join(lines)

    # ------------------------------------------------------------------
    # Sync (work_efforts section only)
    # ------------------------------------------------------------------

    def sync(self, date: str | None = None, dry_run: bool = False) -> dict:
        """Scan WEs, optionally fetch git health, write to daily note."""
        op_id = self._next_op_id("sync")
        efforts = self.scan_work_efforts()

        git_health = ""
        if self.include_git_health:
            git_health = self._get_git_health()

        content = self.format_section(efforts, git_health)

        if dry_run:
            return {"status": "dry_run", "op_id": op_id, "content": content}

        self.ensure_note(date)
        result = self._safe_write("work_efforts", content, "replace", date, op_id)
        result["op_id"] = op_id
        return result

    # ------------------------------------------------------------------
    # Full sync — frontmatter + sections + session log
    # ------------------------------------------------------------------

    def full_sync(self, date: str | None = None, dry_run: bool = False) -> dict:
        """Comprehensive daily note update: frontmatter, work_efforts, focus, in_the_lab.

        Handles missing notes (creates from template), missing section headers
        (skips gracefully), and logs every operation to trail_log.
        """
        op_id = self._next_op_id("full_sync")
        self._ensure_daily_note_importable()
        import daily_note as dn

        # Ensure note exists
        self.ensure_note(date)

        efforts = self.scan_work_efforts()
        active = [e for e in efforts if e.get("status") in ("active", "in_progress")]
        active_ids = [e.get("id", "?") for e in active]
        active_titles = [e.get("title", "Untitled") for e in active]

        results = {"op_id": op_id, "session_id": self._session_id}

        # 1. Frontmatter
        fm_fields = {"work_efforts": active_ids}
        if active_titles:
            fm_fields["focus"] = active_titles[0]
        results["frontmatter"] = self._safe_update_frontmatter(fm_fields, date, dry_run)

        # 2. Work efforts section
        git_health = self._get_git_health() if self.include_git_health else ""
        we_content = self.format_section(efforts, git_health)
        results["work_efforts"] = self._safe_write(
            "work_efforts", we_content, "replace", date, op_id
        ) if not dry_run else {"status": "dry_run", "content": we_content}

        # 3. Focus snapshot (only if header exists in note)
        if active:
            focus_lines = [f"**Active _pyrite Work Efforts:** {len(active)}"]
            for e in active:
                focus_lines.append(f"- [[{e.get('id')}|{e.get('title', '?')}]]")
            focus_content = "\n".join(focus_lines)
        else:
            focus_content = "No active _pyrite work efforts."

        if self._section_header_exists("focus_snapshot", date):
            results["focus_snapshot"] = self._safe_write(
                "focus_snapshot", focus_content, "replace", date, op_id
            ) if not dry_run else {"status": "dry_run", "content": focus_content}
        else:
            results["focus_snapshot"] = {"status": "skipped", "reason": "header not in note"}

        # 4. In the Lab — log this sync
        ts = datetime.now().strftime("%H:%M")
        lab_entry = (
            f"- **Decision:** _pyrite daily-note sync ran at {ts} "
            f"-- {len(active)} active WEs, {len(efforts)} total "
            f"-- **Reason:** automated bridge keeps daily note current"
        )
        if self._section_header_exists("in_the_lab", date):
            results["in_the_lab"] = self._safe_write(
                "in_the_lab", lab_entry, "append", date, op_id
            ) if not dry_run else {"status": "dry_run", "content": lab_entry}
        else:
            results["in_the_lab"] = {"status": "skipped", "reason": "header not in note"}

        # 5. Create Obsidian note files for active WEs (so [[links]] resolve)
        if not dry_run:
            note_result = self.create_obsidian_notes(efforts)
            results["obsidian_notes"] = note_result
        else:
            results["obsidian_notes"] = {"status": "dry_run",
                                         "would_create": len(efforts)}

        # Log the full_sync operation itself
        self._log_bridge_op("full_sync", f"sections={len(results)-2}", "ok", op_id)

        return results

    # ------------------------------------------------------------------
    # Obsidian note files — make [[wiki-links]] resolve to real content
    # ------------------------------------------------------------------

    _WE_NOTES_DIR = _VAULT_DIR / "_work_efforts_" / "pyrite"

    def create_obsidian_note(self, effort: dict, overwrite: bool = False) -> dict:
        """Create a single Obsidian .md file for a work effort.

        This is the atomic unit. Checks existence, creates if missing,
        logs the operation. The plural `create_obsidian_notes` composes this.

        Args:
            effort: WE dict with at least 'id' and 'title' keys.
            overwrite: If True, regenerate even if file exists.

        Returns:
            dict with status ("created", "exists", or "error") and path.
        """
        we_id = effort.get("id", "")
        if not we_id:
            return {"status": "error", "error": "no id in effort dict"}

        self._WE_NOTES_DIR.mkdir(parents=True, exist_ok=True)
        note_path = self._WE_NOTES_DIR / f"{we_id}.md"

        if note_path.exists() and not overwrite:
            return {"status": "exists", "id": we_id, "path": str(note_path)}

        content = self._format_obsidian_note(effort)
        try:
            note_path.write_text(content, encoding="utf-8")
        except OSError as e:
            self._log_bridge_op("create_obsidian_note", we_id, "error",
                                self._next_op_id("note"), str(e))
            return {"status": "error", "id": we_id, "error": str(e)}

        self._log_bridge_op("create_obsidian_note", we_id, "ok",
                            self._next_op_id("note"))
        return {"status": "created", "id": we_id, "path": str(note_path)}

    def create_obsidian_notes(self, efforts: list[dict] | None = None,
                              overwrite: bool = False) -> dict:
        """Create Obsidian note files for all WEs. Composes create_obsidian_note().

        Args:
            efforts: List of WE dicts. If None, scans fresh.
            overwrite: If True, regenerate existing files.

        Returns:
            dict with created/exists/error counts.
        """
        if efforts is None:
            efforts = self.scan_work_efforts()

        results = [self.create_obsidian_note(e, overwrite=overwrite) for e in efforts]

        created = [r for r in results if r["status"] == "created"]
        existed = [r for r in results if r["status"] == "exists"]
        errors = [r for r in results if r["status"] == "error"]

        return {
            "status": "ok",
            "created": len(created),
            "existed": len(existed),
            "errors": len(errors),
            "total": len(efforts),
            "created_ids": [r["id"] for r in created],
            "dir": str(self._WE_NOTES_DIR),
        }

    def _format_obsidian_note(self, effort: dict) -> str:
        """Format a single WE as an Obsidian-compatible markdown note."""
        we_id = effort.get("id", "?")
        title = effort.get("title", "Untitled")
        status = effort.get("status", "unknown")
        created = effort.get("created", "")
        updated = effort.get("last_updated") or created
        objective = effort.get("objective", "")
        folder = effort.get("folder", "")
        today = datetime.now().strftime("%Y-%m-%d")

        lines = [
            "---",
            f"id: {we_id}",
            f"title: \"{title}\"",
            f"status: {status}",
            f"created: {created}",
            f"last_updated: {updated}",
            f"source: _pyrite",
            "tags:",
            "  - work-effort",
            f"  - {status}",
            "---",
            "",
            f"# {title}",
            "",
            f"**ID:** `{we_id}`  ",
            f"**Status:** {status}  ",
            f"**Created:** {self._short_date(created)}  ",
            f"**Last Updated:** {self._short_date(updated)}",
            "",
        ]

        if objective:
            lines.extend([
                "## Objective",
                "",
                objective,
                "",
            ])

        lines.extend([
            "## Links",
            "",
            f"- **Daily Note:** [[{today}]]",
            f"- **_pyrite folder:** `active/_pyrite/_work_efforts/{folder}/`",
            "",
            "## Progress",
            "",
            "- [ ] Review and update status",
            "",
            "---",
            f"*Generated by _pyrite DailyNoteBridge on {today}*",
            "",
        ])

        return "\n".join(lines)

    # ------------------------------------------------------------------
    # Session helpers
    # ------------------------------------------------------------------

    def log_session(self, focus: str, changes: list[str], next_steps: str,
                    date: str | None = None) -> dict:
        """Append a structured session log entry to the daily note."""
        self._ensure_daily_note_importable()
        from daily_note import append_session_log
        self.ensure_note(date)
        return append_session_log(focus, changes, next_steps, actor=self.actor, date=date)

    def read_yesterday_handoff(self) -> dict:
        """Read yesterday's handoff data for carry-forward context."""
        self._ensure_daily_note_importable()
        from daily_note import last_handoff
        return last_handoff()

    def get_section_status(self, date: str | None = None) -> dict:
        """Return fill status for all daily note sections."""
        self._ensure_daily_note_importable()
        from daily_note import section_status
        try:
            return section_status(date)
        except FileNotFoundError:
            return {"error": f"No daily note for {date or 'today'}"}

    # ------------------------------------------------------------------
    # Safe writers — wrap every write with error handling + logging
    # ------------------------------------------------------------------

    def _safe_write(self, section: str, content: str, mode: str,
                    date: str | None, op_id: str) -> dict:
        """Write to a section with full error handling and logging."""
        self._ensure_daily_note_importable()
        from daily_note import write_section

        if not self._section_header_exists(section, date):
            self._log_bridge_op(f"write_{section}", "header_missing", "skipped", op_id)
            return {"status": "skipped", "reason": "header not in note"}

        try:
            result = write_section(section, content, actor=self.actor, mode=mode, date=date)
            self._log_bridge_op(f"write_{section}", mode, "ok", op_id)
            return result
        except PermissionError as e:
            self._log_bridge_op(f"write_{section}", mode, "permission_error", op_id, str(e))
            return {"status": "error", "error": str(e)}
        except (OSError, ValueError) as e:
            self._log_bridge_op(f"write_{section}", mode, "error", op_id, str(e))
            return {"status": "error", "error": str(e)}

    def _safe_update_frontmatter(self, fields: dict, date: str | None,
                                 dry_run: bool) -> dict:
        """Update frontmatter with error handling."""
        if dry_run:
            return {"status": "dry_run", "fields": fields}

        self._ensure_daily_note_importable()
        from daily_note import update_frontmatter_fields

        try:
            return update_frontmatter_fields(fields, date=date)
        except (ValueError, OSError) as e:
            self._log_bridge_op("update_frontmatter", str(fields.keys()), "error",
                                self._next_op_id("fm"), str(e))
            return {"status": "error", "error": str(e)}

    # ------------------------------------------------------------------
    # Note creation from template
    # ------------------------------------------------------------------

    def _create_note_from_template(self, date: str) -> dict:
        """Create a daily note from the Obsidian template, resolving Templater tags."""
        try:
            dt = datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            return {"status": "error", "error": f"Invalid date format: {date}"}

        if not _TEMPLATE_PATH.exists():
            return {"status": "error", "error": f"Template not found: {_TEMPLATE_PATH}"}

        template = _TEMPLATE_PATH.read_text(encoding="utf-8")

        # Resolve Templater expressions
        yesterday = (dt - timedelta(days=1)).strftime("%Y-%m-%d")
        tomorrow = (dt + timedelta(days=1)).strftime("%Y-%m-%d")
        replacements = {
            '<% tp.date.now("YYYY-MM-DD") %>': date,
            '<% tp.date.now("YYYY-MM-DD HH:mm") %>': dt.strftime("%Y-%m-%d %H:%M"),
            '<% tp.date.now("dddd, MMMM Do") %>': dt.strftime("%A, %B ") + _ordinal(dt.day),
            '<% tp.date.now("YYYY-MM-DD", -1) %>': yesterday,
            '<% tp.date.now("YYYY-MM-DD", 1) %>': tomorrow,
            '<% tp.date.now("MMMM D, YYYY") %>': dt.strftime("%B %-d, %Y"),
            "{{qotd}}": "",  # no quote plugin available outside Obsidian
        }
        content = template
        for tag, value in replacements.items():
            content = content.replace(tag, value)

        note_path = _VAULT_DIR / "Daily Notes" / f"{date}.md"
        note_path.parent.mkdir(parents=True, exist_ok=True)
        note_path.write_text(content, encoding="utf-8")

        self._log_bridge_op("create_note", date, "ok", self._next_op_id("create"))
        return {"status": "created", "date": date, "path": str(note_path)}

    # ------------------------------------------------------------------
    # Operations logging
    # ------------------------------------------------------------------

    def _log_bridge_op(self, action: str, target: str, result: str,
                       op_id: str, error: str | None = None):
        """Log a bridge-level operation to trail_log via harness_log."""
        try:
            self._ensure_daily_note_importable()
            from harness_log import log_op
            log_op(
                action=f"bridge.{action}",
                actor=self.actor,
                target=target,
                result=result,
                command=f"pyrite-daily-note/{op_id}",
                error=error,
            )
        except (ImportError, Exception):
            pass  # logging is best-effort

    def _next_op_id(self, prefix: str = "op") -> str:
        """Generate a sequential operation ID for this session."""
        self._op_count += 1
        return f"{self._session_id}-{prefix}-{self._op_count:03d}"

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    def _ensure_daily_note_importable(self):
        """Add SimpleAgentOS to sys.path if not already there."""
        if self.sao_dir not in sys.path:
            sys.path.insert(0, self.sao_dir)

    def _section_header_exists(self, section: str, date: str | None = None) -> bool:
        """Check whether a section's markdown header exists in the daily note."""
        self._ensure_daily_note_importable()
        import daily_note as dn
        if section not in dn.SECTIONS or dn.SECTIONS[section] is None:
            return section == "frontmatter"
        try:
            text = dn.read_full(date)
            return dn.SECTIONS[section] in text
        except (FileNotFoundError, OSError):
            return False

    def _parse_frontmatter(self, path: Path) -> dict | None:
        """Extract flat YAML frontmatter from a WE index file."""
        try:
            text = path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            return None

        m = re.match(r"^---\s*\n(.*?)\n---", text, re.DOTALL)
        if not m:
            return None

        data: dict[str, str] = {}
        for line in m.group(1).splitlines():
            kv = re.match(r"^(\w[\w_]*)\s*:\s*(.+)$", line)
            if kv:
                key = kv.group(1).strip()
                val = kv.group(2).strip().strip("'\"")
                data[key] = val
        return data if data else None

    def _get_git_health(self) -> str:
        """Run git_scanner and return markdown report, or empty string."""
        try:
            self._ensure_daily_note_importable()
            from git_scanner import scan_workspace, format_report_md
            results = scan_workspace()
            return format_report_md(results)
        except Exception:
            return ""

    @staticmethod
    def _short_date(iso: str) -> str:
        """Convert ISO timestamp to short 'Mon DD' format."""
        if not iso:
            return "?"
        try:
            dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
            return dt.strftime("%b %d")
        except (ValueError, TypeError):
            return iso[:10] if len(iso) >= 10 else iso


def _ordinal(n: int) -> str:
    """Return day number with ordinal suffix: 1st, 2nd, 3rd, etc."""
    if 11 <= n <= 13:
        return f"{n}th"
    return f"{n}{['th','st','nd','rd','th','th','th','th','th','th'][n % 10]}"
