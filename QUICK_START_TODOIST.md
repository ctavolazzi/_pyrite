# Quick Start: Test Todoist Integration NOW

## Step 1: Get Your Todoist API Token

1. Go to https://todoist.com/app/settings/integrations/developer
2. Copy your API token (looks like: `1234567890abcdef1234567890abcdef12345678`)

## Step 2: Set Environment Variable

```bash
export TODOIST_API_TOKEN='paste-your-token-here'
```

## Step 3: Run the Plugin (One-Time Test)

```bash
python plugins/todoist/poll.py --once
```

## Step 4: In Todoist, Create a Test Task

**Basic Test:**
```
Task: "Test Phase 4 Integration"
Labels: pyrite
Description: This is a test
```

**Advanced Test (with subtasks):**
```
Task: "Build Cool Feature"
Labels: pyrite
Description:
Let's build something cool!

- [ ] Design the UI
- [ ] Write the backend
- [ ] Add tests
- [ ] Deploy to production
```

## Step 5: Run the Plugin Again

```bash
python plugins/todoist/poll.py --once
```

## What You Should See

1. **Terminal output** showing task processing
2. **New work effort** created in `_work_efforts/`
3. **Comment on Todoist task** with feedback
4. **'pyrite' label removed** from task
5. **Ticket files created** (if you used subtasks)

## Verify It Worked

```bash
# List newly created work efforts
ls -lt _work_efforts/ | head -5

# Check for tickets
ls _work_efforts/WE-*/tickets/
```

---

**Ready to try it? I can walk you through each step.**
