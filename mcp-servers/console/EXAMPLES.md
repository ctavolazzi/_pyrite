# Pyrite Console - Usage Examples

Real-world examples of using the chat interface to manage work efforts.

## Getting Started

**First time setup:**
1. Start the console: `npm start`
2. Open http://localhost:3000
3. Click ⚙️ settings
4. Enter your Anthropic API key
5. Start chatting!

## Example Conversations

### List Work Efforts

**You:**
> What work efforts do I have?

**AI:**
> You have 13 work efforts in the repository. Here's the summary:
>
> **Active:**
> - WE-251227-1gku: Mission Control Dashboard (4 tickets)
> - WE-251231-25qq: GitHub Health Check Tool Foundation (3 tickets)
>
> **Completed:**
> - WE-251227-8w5z: Bulletproof Event System
> - WE-251227-hldk: Mission Control V2 Command Center
>
> Would you like details on any specific work effort?

---

### Get Work Effort Details

**You:**
> Tell me about WE-251227-1gku

**AI:**
> **WE-251227-1gku: Mission Control Dashboard**
>
> Status: Completed
> Created: December 27, 2025
> Branch: feature/WE-251227-1gku-mission_control_dashboard
>
> **Tickets:**
> 1. TKT-1gku-001: Fix MCP server folder path bug (pending)
> 2. TKT-1gku-002: Build dashboard server (pending)
> 3. TKT-1gku-003: Build dashboard UI (pending)
> 4. TKT-1gku-004: Create documentation (pending)
>
> This work effort built the real-time visual dashboard for monitoring work efforts.

---

### Create a Ticket

**You:**
> Create a ticket to add dark mode toggle to the console in WE-251227-1gku

**AI:**
> I've created ticket TKT-1gku-005: "Add dark mode toggle to console"
>
> Status: pending
> Parent: WE-251227-1gku
> Path: `_work_efforts/WE-251227-1gku_mission_control_dashboard/tickets/TKT-1gku-005_add_dark_mode_toggle_to_console.md`
>
> The ticket has been added to the work effort with auto-generated ID.

---

### Update Ticket Status

**You:**
> Mark TKT-1gku-001 as completed

**AI:**
> ✓ Updated ticket TKT-1gku-001 status to **completed**
>
> The ticket file has been updated with the new status and timestamp.

---

### Search Work Efforts

**You:**
> Find all tickets related to authentication

**AI:**
> Found 3 results for "authentication":
>
> **Tickets:**
> 1. TKT-2abc-003: Fix authentication flow (in_progress)
> 2. TKT-5xyz-001: Add OAuth authentication (pending)
> 3. TKT-7def-008: Update authentication docs (completed)
>
> Would you like details on any of these?

---

### Complex Multi-Step Task

**You:**
> I need to start work on improving the console's streaming performance. Create a new work effort and add tickets for profiling, optimization, and testing.

**AI:**
> I can help with that, but I currently can only create tickets within existing work efforts.
>
> However, I can create these tickets in an existing work effort if you'd like. Which work effort should I add them to? Or would you prefer to create a new work effort manually first?
>
> For reference, here are your active work efforts:
> - WE-251227-1gku: Mission Control Dashboard
> - WE-251231-25qq: GitHub Health Check Tool Foundation

**You:**
> Let's add them to WE-251227-1gku

**AI:**
> Perfect! I'll create three tickets for streaming performance improvements:
>
> ✓ Created TKT-1gku-006: Profile streaming performance bottlenecks (pending)
> ✓ Created TKT-1gku-007: Optimize AI SDK streaming implementation (pending)
> ✓ Created TKT-1gku-008: Add performance tests for streaming (pending)
>
> All three tickets have been added to WE-251227-1gku. Ready to start profiling!

---

## Pro Tips

### Use Natural Language

The AI understands context. You can say:
- "Show me what's active"
- "Create a bug fix ticket"
- "Mark ticket 001 as done"
- "What needs attention?"

### Be Specific with IDs

When working with tickets, use the full ID:
- ✓ "Update TKT-1gku-001 to in_progress"
- ✗ "Update ticket 1 to in progress"

### Check Stats

Click 📊 to see:
- Total work efforts and tickets
- Status breakdown
- Repository health

### Keyboard Shortcuts

- `Escape` — Close modals
- Focus stays on input for fast chatting

## Common Workflows

### Daily Standup

```
You: What work efforts are active?
AI: [Lists active work with ticket counts]

You: Show details for WE-251227-1gku
AI: [Shows all tickets and status]

You: Mark TKT-1gku-003 as in_progress
AI: [Updates status]

You: Create a ticket for fixing the auth bug
AI: [Creates new ticket]
```

### Weekly Review

```
You: Search for "completed"
AI: [Shows all completed work]

You: What's blocked?
AI: [Lists blocked tickets]

You: Update TKT-2abc-005 to pending
AI: [Unblocks ticket]
```

### Planning New Feature

```
You: List work efforts for dashboard
AI: [Shows dashboard-related work]

You: Create tickets for:
     - Add user preferences
     - Build settings panel
     - Add keyboard shortcuts
AI: [Creates all three tickets with auto-IDs]
```

## Error Handling

**If the AI can't find a work effort:**
> "I couldn't find work effort WE-123456-abcd. Here are the available work efforts: [list]"

**If a ticket ID is ambiguous:**
> "I found multiple tickets matching that description. Please use the full ID like TKT-1gku-001"

**If the file system operation fails:**
> "Error creating ticket: [specific error message]. The file system may be read-only or the path doesn't exist."

## Next Steps

- Try the examples above in your console
- Experiment with natural language variations
- Check `README.md` for architecture details
- Report issues or suggestions

---

Built with care for the _pyrite ecosystem.
