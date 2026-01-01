# Todoist Integration MVP - v0.9.0 Requirements

## Context

You're building v0.9.0 of _pyrite - the **Todoist Integration Update**. The codebase has just been cleaned and standardized (all work efforts migrated to MCP v0.3.0 format). You're starting fresh on branch `main` after the cleanup PR is merged.

## Mission

Integrate _pyrite with Todoist so that creating a task with the `pyrite` label automatically creates or matches a work effort in the repository.

---

## Current State (What's Done)

✅ **Codebase Cleanup Complete**
- All work efforts migrated to `WE-YYMMDD-xxxx/` format
- Migration tool built and tested (`tools/work-effort-migrator/`)
- No legacy `XX.XX_*.md` files remain
- Clean, DRY, modular structure

✅ **Work Effort System**
- Standardized format: `WE-YYMMDD-xxxx_description/`
- Index files: `WE-YYMMDD-xxxx_index.md`
- Ticket system: `tickets/TKT-xxxx-NNN_description.md`
- Full YAML frontmatter metadata

✅ **Repository Structure**
- `_work_efforts/` contains all work efforts
- `tools/` contains utilities
- GitHub Actions workflows in `.github/workflows/`

---

## MVP Requirements

### Feature Overview

**User Flow:**
1. User creates Todoist task: "Build authentication system"
2. User adds label: `pyrite`
3. GitHub Action triggers (every 15 min OR manual)
4. Python script runs:
   - Fetches tasks with `pyrite` label
   - Creates work effort: `WE-260101-xxxx_build_authentication_system/`
   - Posts comment back to Todoist with link to work effort
   - Removes `pyrite` label (prevent re-processing)
5. User sees comment in Todoist with GitHub link
6. Work effort appears in repository

---

## Technical Specifications

### 1. Directory Structure

```
_pyrite/
├── scripts/
│   └── todoist_sync.py              # Main sync logic
├── .github/
│   └── workflows/
│       └── todoist_sync.yml         # GitHub Action
├── _work_efforts/
│   └── WE-YYMMDD-xxxx_*/            # Auto-created work efforts
└── .env.example                     # Template for secrets
```

### 2. Core Script: `scripts/todoist_sync.py`

**Functionality:**
- Connect to Todoist REST API v2
- Fetch tasks with label `pyrite`
- Parse task metadata (title, description, due date)
- Generate `WE-YYMMDD-xxxx` ID from creation timestamp
- Create work effort folder structure
- Write `WE-YYMMDD-xxxx_index.md` with frontmatter
- Post comment to Todoist with GitHub link
- Remove `pyrite` label from task

**API Endpoints:**
```python
GET  https://api.todoist.com/rest/v2/tasks
POST https://api.todoist.com/rest/v2/comments
POST https://api.todoist.com/rest/v2/tasks/{task_id}  # Update to remove label
```

**Headers:**
```python
Authorization: Bearer {TODOIST_API_KEY}
Content-Type: application/json
```

**Security:**
- NEVER hardcode API keys
- Use `os.environ.get("TODOIST_API_KEY")`
- Exit gracefully if token missing
- Validate all inputs
- Sanitize filenames (no path traversal)

**Work Effort Creation:**
```python
def create_work_effort(task):
    """
    Creates WE-YYMMDD-xxxx_description/ folder structure

    Args:
        task: Todoist task object

    Returns:
        Path to created work effort

    Creates:
        WE-YYMMDD-xxxx_description/
        ├── WE-YYMMDD-xxxx_index.md
        └── tickets/  (empty initially)
    """
```

**Frontmatter Template:**
```yaml
---
id: WE-260101-xxxx
title: "Task title from Todoist"
status: new
created: 2026-01-01T12:00:00.000Z
source: todoist
todoist_id: 7654321
todoist_url: https://todoist.com/app/task/7654321
last_updated: 2026-01-01T12:00:00.000Z
---
```

### 3. GitHub Action: `.github/workflows/todoist_sync.yml`

**Triggers:**
- Schedule: Every 15 minutes (`cron: '*/15 * * * *'`)
- Manual: `workflow_dispatch`

**Environment Variables:**
```yaml
env:
  TODOIST_API_KEY: ${{ secrets.TODOIST_API_KEY }}
  GITHUB_REPOSITORY: ${{ github.repository }}
  GITHUB_REF_NAME: ${{ github.ref_name }}
```

**Steps:**
1. Checkout repo
2. Setup Python 3.10+
3. Install dependencies (`pip install -r requirements.txt`)
4. Run sync script
5. Commit and push changes (if any)

**Git Configuration:**
```yaml
git config --global user.name 'Pyrite Bot'
git config --global user.email 'bot@pyrite.local'
```

### 4. Dependencies: `requirements.txt`

```
requests==2.31.0
PyYAML==6.0.1
```

### 5. Security & Configuration

**GitHub Secrets Required:**
- `TODOIST_API_KEY` - User's Todoist API token

**`.gitignore` Additions:**
```
.env
*.pyc
__pycache__/
```

**`.env.example` Template:**
```bash
# Todoist Integration
TODOIST_API_KEY=your_api_token_here

# Get your API token from:
# https://todoist.com/app/settings/integrations/developer
```

---

## Implementation Checklist

### Phase 1: Setup & Structure
- [ ] Create `scripts/todoist_sync.py`
- [ ] Add `requests` to `requirements.txt` (PyYAML already exists)
- [ ] Create `.env.example` with token template
- [ ] Update `.gitignore` with security entries

### Phase 2: Core Logic
- [ ] Implement Todoist API connection
- [ ] Write `get_tasks_with_label(label_name)` function
- [ ] Write `create_work_effort(task)` function
- [ ] Write `sanitize_filename(title)` function
- [ ] Write `generate_we_id(timestamp)` function
- [ ] Implement error handling and logging

### Phase 3: Todoist Feedback Loop
- [ ] Write `add_comment(task_id, content)` function
- [ ] Write `remove_label(task_id, label_name)` function
- [ ] Format GitHub links in comments
- [ ] Test feedback loop locally

### Phase 4: GitHub Action
- [ ] Create `.github/workflows/todoist_sync.yml`
- [ ] Configure schedule trigger (15 min)
- [ ] Configure manual trigger
- [ ] Setup Python environment
- [ ] Configure git commits
- [ ] Test workflow_dispatch manually

### Phase 5: Testing & Documentation
- [ ] Create test Todoist task with `pyrite` label
- [ ] Verify work effort creation
- [ ] Verify Todoist comment appears
- [ ] Verify label removal
- [ ] Write usage documentation
- [ ] Document setup process for users

### Phase 6: Safety & Edge Cases
- [ ] Handle duplicate tasks (check existing WE IDs)
- [ ] Handle API rate limits
- [ ] Handle network failures gracefully
- [ ] Validate all user inputs
- [ ] Test with empty/malformed tasks
- [ ] Test with special characters in titles

---

## Code Quality Standards

Apply these principles throughout:

✅ **Clean Code**
- Single responsibility per function
- Descriptive variable names
- No magic numbers or strings
- DRY - Don't Repeat Yourself

✅ **Defensive Programming**
- Validate all inputs
- Handle all error cases
- Never trust external data
- Fail gracefully with clear messages

✅ **Security First**
- No hardcoded secrets
- Sanitize all file paths
- Validate API responses
- Use environment variables

✅ **Testable**
- Pure functions where possible
- Separate I/O from logic
- Mock external APIs in tests
- Edge cases covered

---

## Example Usage

### User Creates Task in Todoist

```
Title: Implement user authentication
Description: Add JWT-based auth with refresh tokens
Labels: pyrite, backend
Due Date: Jan 15
```

### Script Execution

```bash
$ python3 scripts/todoist_sync.py

🔍 Connecting to Todoist API...
✓ Found 1 task with label 'pyrite'

📁 Creating work effort: WE-260101-a1b2_implement_user_authentication
  ✓ Created: _work_efforts/WE-260101-a1b2_implement_user_authentication/
  ✓ Wrote: WE-260101-a1b2_index.md

💬 Posting comment to Todoist task #7654321
  ✓ Comment posted with GitHub link

🏷️  Removing 'pyrite' label from task
  ✓ Label removed

✅ Sync complete: 1 work effort created
```

### Todoist Comment (Auto-Posted)

```markdown
💎 **Pyrite Work Effort Created**

Your task has been synced to the _pyrite repository!

🔗 View Work Effort: https://github.com/ctavolazzi/_pyrite/blob/main/_work_efforts/WE-260101-a1b2_implement_user_authentication/WE-260101-a1b2_index.md

The work effort is ready for planning and ticket breakdown.
```

### Created Work Effort Structure

```
_work_efforts/WE-260101-a1b2_implement_user_authentication/
├── WE-260101-a1b2_index.md
└── tickets/  (empty, ready for TKT files)
```

### Work Effort Content

```yaml
---
id: WE-260101-a1b2
title: "Implement user authentication"
status: new
created: 2026-01-01T12:34:56.000Z
source: todoist
todoist_id: 7654321
todoist_url: https://todoist.com/app/task/7654321
due_date: 2026-01-15
last_updated: 2026-01-01T12:34:56.000Z
---

# WE-260101-a1b2: Implement user authentication

**Source:** Todoist
**Created:** 2026-01-01 12:34 UTC
**Status:** New

## Original Description

Add JWT-based auth with refresh tokens

## Tasks

This work effort was created from Todoist and is ready for ticket breakdown.

To add tickets, create files in the `tickets/` directory following the pattern:
- `tickets/TKT-260101-001_description.md`

## Next Steps

1. Break down into actionable tickets
2. Assign tickets to milestones
3. Begin implementation
```

---

## Testing Strategy

### Manual Testing Checklist

**Local Testing:**
```bash
# 1. Set environment variable
export TODOIST_API_KEY="your_token_here"

# 2. Create test task in Todoist with 'pyrite' label

# 3. Run script manually
python3 scripts/todoist_sync.py

# 4. Verify outputs:
#    - Work effort folder created
#    - Index file has correct frontmatter
#    - Comment posted to Todoist
#    - Label removed from task
```

**GitHub Action Testing:**
```bash
# 1. Push code to feature branch
# 2. Add TODOIST_API_KEY secret to GitHub
# 3. Manually trigger workflow
# 4. Check Action logs
# 5. Verify commit created
```

### Edge Cases to Test

1. **Empty task title** → Use "Untitled Todoist Task"
2. **Special characters** → Sanitize to safe filenames
3. **Duplicate task** → Check if WE already exists, skip
4. **API failure** → Log error, don't crash
5. **No tasks found** → Log "No tasks to process", exit cleanly
6. **Missing API key** → Exit with clear error message

---

## Error Handling Examples

```python
# Bad (DON'T DO THIS)
response = requests.get(url)
tasks = response.json()

# Good (DO THIS)
try:
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    tasks = response.json()
except requests.exceptions.Timeout:
    print("ERROR: Todoist API timeout after 10 seconds")
    sys.exit(1)
except requests.exceptions.HTTPError as e:
    print(f"ERROR: Todoist API returned {e.response.status_code}")
    sys.exit(1)
except requests.exceptions.RequestException as e:
    print(f"ERROR: Network error: {e}")
    sys.exit(1)
```

---

## Success Criteria

The MVP is complete when:

✅ **Core Functionality**
- [ ] Tasks with `pyrite` label create work efforts
- [ ] Work effort IDs are deterministic and unique
- [ ] Frontmatter includes all required fields
- [ ] Folder structure matches MCP v0.3.0 standard

✅ **User Experience**
- [ ] Comments appear in Todoist with working GitHub links
- [ ] Labels are removed after processing
- [ ] No duplicate work efforts created
- [ ] Clear error messages on failures

✅ **Automation**
- [ ] GitHub Action runs every 15 minutes
- [ ] Manual trigger works
- [ ] Commits only when changes exist
- [ ] Bot commits have clear messages

✅ **Security**
- [ ] No hardcoded secrets
- [ ] API token from GitHub Secrets
- [ ] Input sanitization prevents path traversal
- [ ] Rate limiting respected

✅ **Documentation**
- [ ] README updated with setup instructions
- [ ] `.env.example` provided
- [ ] API token acquisition documented
- [ ] Example workflow documented

---

## Non-Goals (Out of Scope for MVP)

❌ **NOT included in v0.9.0:**
- Bi-directional sync (updating Todoist from GitHub)
- Ticket creation from Todoist sub-tasks
- Multiple label support (only `pyrite` for now)
- Webhook-based real-time sync
- Task assignment/delegation
- Custom label configuration
- Task priority mapping
- Plugin architecture for other services

These may be considered for v0.10.0 or later.

---

## Architecture Decisions

### Why GitHub Actions (not webhooks)?

**Pros:**
- No server infrastructure needed
- Secure secret management built-in
- Version controlled automation
- Easy manual triggering
- Free for public repos

**Cons:**
- 15-minute latency (acceptable for MVP)
- Limited to 2,000 API requests/month for free tier

**Decision:** Use Actions for MVP. Can migrate to webhooks later if needed.

### Why Remove Label After Processing?

**Prevents infinite loops:**
- Task processed → label removed → won't be fetched again
- Idempotent operation (safe to run multiple times)
- Clear signal to user: "This task is synced"

**User can re-add label to re-sync if needed.**

---

## File Locations Reference

```
_pyrite/
├── scripts/
│   └── todoist_sync.py              # YOU WILL CREATE THIS
├── .github/
│   └── workflows/
│       └── todoist_sync.yml         # YOU WILL CREATE THIS
├── requirements.txt                 # ADD requests==2.31.0
├── .gitignore                       # ADD .env, __pycache__
├── .env.example                     # YOU WILL CREATE THIS
├── README.md                        # UPDATE with Todoist setup
└── TODOIST_INTEGRATION_MVP.md       # THIS FILE (reference)
```

---

## Getting Started (For Next Session)

1. **Read this entire document** - understand the full scope
2. **Check current branch** - should be on `main` after cleanup PR merged
3. **Create feature branch** - `git checkout -b feature/todoist-integration-v0.9.0`
4. **Start with Phase 1** - Setup & Structure
5. **Test each component** - Don't wait until the end
6. **Commit frequently** - Small, atomic commits
7. **Follow clean code principles** - DRY, testable, secure

---

## Questions to Ask User

Before starting implementation, clarify:

1. Do you have a Todoist account and API token?
2. Which Todoist label should trigger sync? (`pyrite` or custom?)
3. Should the script create tickets from Todoist sub-tasks? (Recommended: NO for MVP)
4. Preferred sync frequency? (Recommended: 15 minutes)
5. Should completed Todoist tasks update work effort status? (Recommended: NO for MVP)

---

## Reference Documentation

- **Todoist REST API v2**: https://developer.todoist.com/rest/v2/
- **GitHub Actions**: https://docs.github.com/en/actions
- **Python Requests**: https://requests.readthedocs.io/
- **MCP v0.3.0 Spec**: See existing `WE-*` folders for examples

---

## Final Notes

This is an **MVP** - get it working, then iterate. Focus on:
- ✅ Core functionality (create work efforts)
- ✅ Security (no leaked secrets)
- ✅ User feedback (Todoist comments)
- ❌ Don't over-engineer
- ❌ Don't add features not in requirements

**Ship it, test it, improve it.**

Good luck! 🚀
