# Spin-Up

Get oriented to the codebase quickly.

## Steps

1. **Date check:** Run `date`

2. **Disk space:** Run `du -sh /Users/ctavolazzi/Code`

3. **Structure check:** Run `python3 tools/structure-check/check.py --quiet`

4. **MCP health:** Run `python3 /Users/ctavolazzi/Code/.mcp-servers/mcp_diagnostic.py`

5. **Git status:** Find uncommitted changes across repos:
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

6. **Active work:** Call `list_work_efforts` (status: "active")

7. **Pending tasks:** Run `ls _coordination/tasks/`

8. **Recent history:** Read last 50 lines of `_work_efforts/devlog.md`

9. **Previous state:** Read latest `_spin_up/understanding_*.md` file

10. **Summarize:** Report what changed, what's active, what's next

## Output

Provide a concise summary:
- Environment status (disk, date)
- Structure health (tools/structure-check)
- MCP health (X/12 servers)
- Git issues (uncommitted repos)
- Active work efforts
- Pending tasks (in _coordination/tasks/)
- What changed since last understanding
- Recommended next step

---

**Full procedure:** See `_spin_up/SPIN_UP_PROCEDURE.md` for deep diagnostics.
