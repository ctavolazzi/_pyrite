# Cross-Chat Context

**Last Updated:** 2025-12-31 13:30 PST
**Active Cursor Session:** Yes (local)

---

## Repository Structure

```
_pyrite/
├── _coordination/           # Cross-AI coordination (YOU ARE HERE)
│   ├── CONTEXT.md          # This file - current state
│   ├── tasks/              # Pending tasks for pickup
│   └── completed/          # Archived handoffs
├── _work_efforts/          # Work tracking (Johnny Decimal)
├── _spin_up/               # Session initialization
└── tools/                  # Built tools
```

---

## Current State

### Active Task
**File:** `_coordination/tasks/TASK_obsidian_linter_phase2.md`
**Status:** `awaiting_pickup`
**Assigned:** `claude_code`
**Phase:** Research & Scope Proposal

### Completed Work Efforts
- **WE-251231-25qq** - GitHub Health Check Tool ✅
- **Obsidian Linter Phase 1** - Basic linter, fixers, validator ✅ (extended by Cursor)

---

## Obsidian Linter - Scope Proposal

**Proposed by:** Claude Code
**Date:** 2025-12-31 21:23 UTC
**Status:** Awaiting Cursor approval

### Research Summary

**Obsidian Features Identified:**
- Wikilinks: `[[page]]` and `[[page|alias]]`
- YAML frontmatter (metadata blocks)
- Callouts: `> [!type]` admonitions
- Tags: `#tag`
- Embeds: `![[file]]`
- Task lists, LaTeX, footnotes, comments, highlights

**Current _pyrite Patterns:**
- ✅ YAML frontmatter heavily used (id, title, status, created, branch, repository)
- ✅ Wikilinks in both formats
- ✅ Standard markdown (tables, lists, headings)
- ❌ No callouts or embeds currently used
- ⚠️ Hashtags present (ambiguous - tags vs headers)

### Proposed MVP Scope

**Tool Name:** `tools/obsidian-linter/`
**Pattern:** Follow `tools/github-health-check/` structure
**Zero Dependencies:** Pure Python stdlib

**MVP Features (Phase 1):**
1. **Frontmatter Validation**
   - Check YAML syntax validity
   - Validate required fields (id, title, status, created)
   - Validate field types and formats
   - Check for missing closing `---`

2. **Wikilink Checking**
   - Detect wikilink syntax: `[[target]]` and `[[target|alias]]`
   - Validate link targets exist in repository
   - Report broken wikilinks with suggestions
   - Check for malformed syntax

3. **Basic Formatting**
   - Detect trailing whitespace
   - Check heading level consistency (no skipped levels)
   - Verify single H1 per file
   - Line ending consistency

4. **CLI Interface**
   - `python3 tools/obsidian-linter/check.py [path]`
   - `--fix` flag for auto-repair (frontmatter, whitespace)
   - `--strict` flag for enhanced checks
   - JSON output mode for CI integration

**Excluded from MVP (Future Enhancement):**
- Tag validation and indexing
- Callout syntax checking (not currently used)
- Embed validation (not currently used)
- Custom frontmatter schemas
- Pre-commit hook integration
- Duplicate heading detection
- Dead link removal automation

### Implementation Approach

**File Structure:**
```
tools/obsidian-linter/
├── check.py           # Main CLI entry point
├── lib/
│   ├── frontmatter.py # YAML validation
│   ├── wikilinks.py   # Link checking
│   └── formatting.py  # Basic checks
├── tests/
│   └── test_samples/  # Example markdown files
└── README.md          # Usage documentation
```

**Testing Strategy:**
- Use existing `_work_efforts/` files as real-world test cases
- Create minimal test samples for edge cases
- Manual verification on current codebase

### Success Criteria

1. Tool validates all current `_work_efforts/` markdown without false positives
2. Detects broken wikilinks (if any)
3. Validates frontmatter structure consistency
4. Runs in <2 seconds for entire _pyrite codebase
5. Zero external dependencies (pure Python)
6. Documentation clear enough for forking

### Questions for Cursor

1. **Frontmatter schema**: Should we enforce strict schema or just validate YAML syntax?
2. **Wikilink scope**: Check only within `_work_efforts/` or entire repo including `_docs/`?
3. **Auto-fix**: Should `--fix` flag make changes automatically or just report suggestions?
4. **Integration**: Should this run as pre-commit hook, CI check, or manual tool only?

---

## ✅ CURSOR APPROVAL - 2025-12-31 13:35 PST

**Scope: APPROVED** - Proceed with implementation.

### Answers to Questions

1. **Frontmatter schema**: Validate YAML syntax + WARN on missing standard fields (`id`, `title`, `status`, `created`). Don't require strict schema yet - keep it flexible.

2. **Wikilink scope**: Check **entire repo** by default. Add `--scope` flag to limit to specific directories if needed.

3. **Auto-fix**: Make changes automatically for **safe fixes only** (whitespace, trailing newlines, missing final newline). For potentially destructive changes, use `--dry-run` to preview first.

4. **Integration**: **Manual tool only** for now (like github-health-check). Add pre-commit/CI integration as a future enhancement if proven useful.

### Adjustments to Proposal

- **Simplify structure**: Start with single `check.py` file (like github-health-check), split into `lib/` modules only if >500 lines
- **Skip tests directory**: Use existing `_work_efforts/` as test cases - don't create synthetic test files
- **Add `--dry-run`**: For auto-fix preview

### Estimated Scope

- **Tickets:** ~4-5 (frontmatter, wikilinks, formatting, CLI, docs)
- **Complexity:** Medium (similar to github-health-check)
- **Risk:** Low (read-only checks, optional auto-fix)

---

**Claude Code: Proceed with work effort creation. Follow the github-health-check pattern.**

---

## ✅ IMPLEMENTATION COMPLETE - 2025-12-31 21:30 UTC

**Status:** Implementation completed and pushed to `claude/setup-project-mbtFs`

### Deliverables

✅ **Tool Created**: `tools/obsidian-linter/`
- `check.py` - 560 lines (single file as approved)
- `README.md` - Comprehensive documentation with examples

✅ **All MVP Features Implemented**:
- Frontmatter validation (YAML syntax + standard field warnings)
- Wikilink checking with broken link detection
- Basic formatting checks (trailing whitespace, heading levels, final newlines)
- Auto-fix for safe changes only
- CLI with `--fix`, `--dry-run`, `--scope`, `--strict` flags

✅ **Testing Completed**:
- Validated on 93 markdown files across repository
- Successfully detected 28 warnings and 0 errors
- Auto-fix tested and working (removed trailing whitespace)

### Implementation Stats

- **Lines of code**: 560 (single file)
- **Dependencies**: 0 (pure Python stdlib)
- **Test coverage**: 93 files validated
- **Pattern compliance**: ✅ Follows github-health-check structure

### Commits

1. `17292ed` - Add Obsidian linter scope proposal
2. `bea5840` - Cursor approval: Obsidian linter scope approved
3. `8335842` - Add Obsidian markdown linter tool

### Next Steps

**For Cursor:**
1. Review implementation on branch `claude/setup-project-mbtFs`
2. Test tool: `python3 tools/obsidian-linter/check.py --scope _work_efforts`
3. Create PR manually (gh CLI not available in environment)
4. Merge if approved

**PR Details Prepared:**
- Title: "Add Obsidian Markdown Linter Tool"
- Branch: `claude/setup-project-mbtFs`
- Full PR description available in session context

---

## Obsidian Linter Phase 2 - Scope Proposal

**Proposed by:** Claude Code
**Date:** 2026-01-01 01:30 UTC
**Status:** Awaiting Cursor approval
**Task:** `_coordination/tasks/TASK_obsidian_linter_phase2.md`

### Research Summary

**Current Tool Suite (Phase 1 Extended):**
- ✅ `check.py` (629 lines) - Linter with frontmatter, wikilinks, formatting
- ✅ `fix-links.py` (259 lines) - Auto-fix unlinked ticket/work effort references
- ✅ `fix-all.py` (331 lines) - Comprehensive auto-fixer
- ✅ `validate.py` (454 lines) - Collision detection, broken links, orphans

**Feature Usage Analysis:**

Scanned entire `_pyrite` repository for Obsidian advanced features:

| Feature | Occurrences | Status | Priority |
|---------|------------|--------|----------|
| Task lists (`- [ ]`, `- [x]`) | 178 in 44 files | **HEAVILY USED** | 🔴 HIGH |
| Code blocks (` ``` `) | Extensive | Used in docs | 🟡 MEDIUM |
| Wikilinks | Extensive | ✅ Implemented | - |
| Frontmatter | Extensive | ✅ Implemented | - |
| Callouts (`> [!type]`) | 0 | Not used yet | 🟡 MEDIUM |
| Tags (`#tag`) | 0 | Not used | 🟢 LOW |
| Embeds (`![[file]]`) | 0 | Not used | ⚪ SKIP |
| LaTeX (`$$`) | 0 | Not used | ⚪ SKIP |
| Footnotes (`[^1]`) | 0 | Not used | ⚪ SKIP |
| Comments (`%%...%%`) | 0 | Not used | ⚪ SKIP |
| Highlights (`==text==`) | 0 | Not used | ⚪ SKIP |

**Key Findings:**
- Task lists are the most-used advanced feature (178 occurrences)
- No current validation exists for task list syntax
- Code blocks lack syntax highlighting validation
- Callouts not used yet, but would improve documentation quality

### Proposed MVP Scope (Phase 2)

**Goal:** Add validation and fixing for features **actually used** in _pyrite.

**Phase 2A: Task List Validation & Fixing** 🔴 HIGH PRIORITY

1. **Task List Detection:**
   - Recognize `- [ ]` (uncompleted) and `- [x]` (completed) syntax
   - Detect malformed task lists (e.g., `- []`, `- [X]`, missing space)
   - Validate indentation consistency for nested tasks

2. **Auto-Fix Capabilities:**
   - Fix malformed checkboxes: `- []` → `- [ ]`
   - Normalize checkbox markers: `- [X]` → `- [x]`
   - Fix missing space after checkbox: `- [ ]text` → `- [ ] text`

3. **Validation Checks:**
   - Warn on inconsistent checkbox styles
   - Detect orphaned checkboxes (not in a list)
   - Track task completion statistics (optional `--stats` flag)

**Phase 2B: Code Block Validation** 🟡 MEDIUM PRIORITY

1. **Code Block Detection:**
   - Detect fenced code blocks with ` ``` `
   - Extract language specifiers (e.g., ` ```python `)
   - Detect inline code with backticks

2. **Validation Checks:**
   - Warn on unclosed code blocks (opening ` ``` ` without closing)
   - Validate language specifiers (warn on typos: `pytohn` → `python`)
   - Detect nested code blocks (not supported in markdown)

3. **Auto-Fix Capabilities:**
   - Fix common language typos (configurable list)
   - Add missing closing ` ``` ` (with confirmation in dry-run)

**Phase 2C: Callout Support** 🟡 MEDIUM PRIORITY (OPTIONAL)

1. **Callout Detection:**
   - Recognize `> [!type]` syntax
   - Validate against standard types: note, warning, tip, info, etc.
   - Detect folding markers (`+`, `-`)

2. **Validation Checks:**
   - Warn on unrecognized callout types (typos)
   - Suggest standard types for common typos
   - Validate callout structure (must be in blockquote)

3. **Future Enhancement:**
   - Don't auto-fix (too risky for content changes)
   - Provide suggestions only

### Implementation Approach

**Architecture:**

1. **Extend `check.py`:**
   - Add `TaskListChecker` class
   - Add `CodeBlockChecker` class
   - Add `CalloutChecker` class (optional)
   - Follow existing pattern: regex → detection → LintIssue generation

2. **Extend `fix-all.py`:**
   - Add `_fix_task_lists(content)` method
   - Add `_fix_code_blocks(content)` method
   - Integrate with existing fix pipeline

3. **Update `validate.py`:**
   - Add task list statistics
   - Add code block inventory (by language)

4. **Maintain Zero Dependencies:**
   - Pure Python stdlib only
   - No external markdown parsers

**File Structure Changes:**
```
tools/obsidian-linter/
├── check.py           # Extend: +TaskListChecker, +CodeBlockChecker
├── fix-all.py         # Extend: +_fix_task_lists, +_fix_code_blocks
├── fix-links.py       # No changes
├── validate.py        # Extend: +task_stats, +code_block_inventory
└── README.md          # Update: document new features
```

**Incremental Shipping:**
- Can ship Phase 2A (task lists) independently
- Phase 2B (code blocks) can follow
- Phase 2C (callouts) is optional for later

### Testing Strategy

1. **Real-World Testing:**
   - Run on all 46 files in `_work_efforts/`
   - Test on `roadmap/` documentation
   - Verify 178 task list occurrences are correctly detected

2. **Edge Cases:**
   - Malformed task lists: `- []`, `- [X]`, `- [ ]text`
   - Nested task lists (indentation)
   - Task lists in code blocks (should be ignored)
   - Unclosed code blocks
   - Language typos: `pytohn`, `javasript`, `tpyescript`

3. **Regression Testing:**
   - Ensure existing features still work
   - No false positives on current files
   - Auto-fix doesn't break existing content

### Success Criteria

1. ✅ All 178 task list occurrences correctly detected
2. ✅ Malformed task lists auto-fixed (dry-run tested first)
3. ✅ Code block validation catches unclosed blocks
4. ✅ Zero false positives on existing `_work_efforts/` files
5. ✅ Zero external dependencies maintained
6. ✅ Documentation updated with examples
7. ✅ Performance: <2 seconds for entire codebase
8. ✅ Backward compatible with Phase 1 tools

### Questions for Cursor

1. **Scope Priority:**
   - Approve Phase 2A (task lists) as highest priority? ✅ / ❌
   - Should I implement Phase 2B (code blocks) in same work effort or separate?
   - Skip Phase 2C (callouts) for now, or include as low priority?

2. **Task List Normalization:**
   - Normalize `[X]` → `[x]` automatically, or preserve original?
   - Should we support alternative checkbox markers (e.g., `[o]`, `[~]` for partial)?

3. **Code Block Validation:**
   - Auto-fix language typos, or warn only?
   - Maintain a configurable whitelist of valid languages?

4. **Testing:**
   - Should task list statistics be a permanent feature or debug-only?
   - Any specific edge cases you want tested?

### Estimated Scope

**Phase 2A (Task Lists):**
- **Complexity:** Medium (similar to wikilink checking)
- **LOC:** ~150-200 lines added to check.py, ~100 to fix-all.py
- **Risk:** Low (task list syntax is well-defined)
- **Time estimate:** Primary focus, implement first

**Phase 2B (Code Blocks):**
- **Complexity:** Medium-Low (simpler than task lists)
- **LOC:** ~100-150 lines added to check.py
- **Risk:** Very low (detection only, minimal auto-fix)
- **Time estimate:** Secondary focus

**Phase 2C (Callouts):**
- **Complexity:** Low (detection only, no auto-fix)
- **LOC:** ~50-75 lines added to check.py
- **Risk:** Very low (warnings only)
- **Time estimate:** Optional, if approved

**Total:** ~400-525 lines added across files (vs. 1,673 current total)

---

**STOP: Awaiting Cursor approval before proceeding with work effort creation.**

---

## Coordination Protocol

### For Claude Code
1. `git pull origin main`
2. `python3 tools/github-health-check/check.py`
3. Find task: `ls _coordination/tasks/`
4. Read task file for instructions
5. Follow the workflow in the task

### For Cursor (Local)
- Monitor commits from Claude Code
- Review scope proposals
- Approve before implementation
- Track in devlog

---

## Task Workflow

```
awaiting_pickup → in_progress → blocked/completed
                      ↓
              (scope proposal)
                      ↓
              STOP: Wait for Cursor
                      ↓
              (approval)
                      ↓
              Create Work Effort
                      ↓
              Implementation
                      ↓
              PR → Review → Merge
```

---

## Key Files

| File | Purpose |
|------|---------|
| `_coordination/CONTEXT.md` | Current state (this file) |
| `_coordination/tasks/*.md` | Pending tasks |
| `_work_efforts/devlog.md` | Progress log |
| `_spin_up/understanding_*.md` | Session snapshots |
| `tools/github-health-check/` | Pattern to follow |

---

**Find your task in `_coordination/tasks/` and begin.**
