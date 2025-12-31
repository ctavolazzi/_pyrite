# Spin-Up Procedure

Full diagnostic procedure for orienting to the _pyrite codebase.

## Quick Start

Run the Cursor command: `/spin-up`

Or manually:
```bash
cd /Users/ctavolazzi/Code/active/_pyrite
date
du -sh /Users/ctavolazzi/Code
python3 /Users/ctavolazzi/Code/.mcp-servers/mcp_diagnostic.py
```

## Full Procedure

### 1. Environment Check
```bash
# Current date/time
date

# Disk usage
du -sh /Users/ctavolazzi/Code

# MCP server health
python3 /Users/ctavolazzi/Code/.mcp-servers/mcp_diagnostic.py
```

### 2. Git Status Across Repos
```bash
for dir in /Users/ctavolazzi/Code/*/; do
  if [ -d "$dir/.git" ]; then
    name=$(basename "$dir")
    changes=$(cd "$dir" && git status -s 2>/dev/null | wc -l | tr -d ' ')
    if [ "$changes" -gt 0 ]; then
      echo "⚠️  $name: $changes uncommitted"
    fi
  fi
done
```

### 3. Work Effort Status
Use MCP tool: `mcp_work-efforts_list_work_efforts`
- Filter by status: "active"
- Check for stale/blocked efforts

### 4. Recent History
```bash
# Last 50 lines of devlog
tail -50 _work_efforts/devlog.md

# Recent commits
git log --oneline -10
```

### 5. Previous Understanding
Read the most recent understanding snapshot:
```bash
ls -t _spin_up/understanding_*.md | head -1 | xargs cat
```

### 6. Cross-Chat Context
If coordinating with Claude Code:
```bash
cat _work_efforts/CROSS_CHAT_CONTEXT.md
```

## Understanding Snapshots

After each significant session, save understanding:

```bash
# Generate filename with timestamp
filename="_spin_up/understanding_$(date +%Y%m%d_%H%M).md"
```

Template:
```markdown
# Understanding Snapshot - YYYY-MM-DD HH:MM

## Session Summary
- What was accomplished
- Decisions made
- Issues encountered

## Current State
- Active work efforts
- Pending PRs
- Uncommitted changes

## Next Steps
- Immediate priorities
- Blocked items
- Questions to resolve

## Context for Next Session
- Key files to review
- Important decisions
- Coordination notes
```

## Output Format

Provide concise summary:
- Environment status (disk, date)
- MCP health (X/12 servers)
- Git issues (uncommitted repos)
- Active work efforts
- What changed since last understanding
- Recommended next step

