# Spin-Up

Get oriented to the codebase quickly.

## Steps

1. **Date check:** Run `date`

2. **Disk space:** Run `du -sh /Users/ctavolazzi/Code`

3. **MCP health:** Run `python3 /Users/ctavolazzi/Code/.mcp-servers/mcp_diagnostic.py`

4. **Git status:** Find uncommitted changes across repos:
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

5. **Active work:** Call `list_work_efforts` (status: "active")

6. **Recent history:** Read last 50 lines of `_work_efforts/devlog.md`

7. **Previous state:** Read latest `_spin_up/understanding_*.txt` file

8. **Summarize:** Report what changed, what's active, what's next

## Output

Provide a concise summary:
- Environment status (disk, date)
- MCP health (X/11 servers)
- Git issues (uncommitted repos)
- Active work efforts
- What changed since last understanding
- Recommended next step

---

**Full procedure:** See `_spin_up/SPIN_UP_PROCEDURE.md` for deep diagnostics.
