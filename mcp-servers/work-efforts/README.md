# Work Efforts MCP Server

Simple MCP server for managing Johnny Decimal work efforts across repositories.

## Tools

### `create_work_effort`
Create a new work effort with automatic numbering.

**Parameters:**
- `repo_path` - Full path to repository
- `title` - Work effort title
- `category` - Category like "00-09", "10-19"
- `subcategory` - Subcategory like "00", "01"
- `objective` - What needs to be done
- `tasks` - Array of task strings (optional)

**Example:**
```
Create a work effort for "User Authentication" in category 10-19, subcategory 00
```

### `list_work_efforts`
List all work efforts in a repository.

**Parameters:**
- `repo_path` - Full path to repository
- `status` - Filter by status: "active", "paused", "completed", "all" (default: "all")

**Example:**
```
List all active work efforts
```

### `update_work_effort`
Update status or add progress to a work effort.

**Parameters:**
- `file_path` - Full path to work effort markdown file
- `status` - New status: "active", "paused", or "completed" (optional)
- `progress` - Progress note to add (optional)

**Example:**
```
Update work effort 00.01 to completed
Add progress note "Finished implementing login flow"
```

## Usage

AI agents can use these tools automatically. Just ask naturally:
- "Create a work effort for implementing the payment flow"
- "List all my active work efforts"
- "Mark work effort 00.01 as completed"
- "Add progress to work effort: finished the API integration"

## Structure Created

```
repo/_work_efforts/
├── 00-09_category/
│   └── 00_subcategory/
│       └── 00.01_20250930_descriptive_title.md
```

## Internal Tool

This is an internal development tool. Modify as needed.

