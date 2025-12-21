# AGENTS.md

## Project overview
This document provides AI agent instructions for working with this project. It defines:
- Workspace structure and organization
- Development workflows and protocols
- Cleanup schedules and maintenance procedures
- Tool configuration and usage guidelines

**Purpose:** Ensure AI assistants understand your project structure, workflows, and preferences for consistent, high-quality assistance across all development sessions.

## Critical safety rules
⚠️ **ALWAYS follow this sequence for any deletion operation:**

1. **VERIFY BACKUP FIRST:** Check GitHub before deleting anything
   ```bash
   gh repo view ctavolazzi/[repo-name]
   ```
2. **GET EXPLICIT CONFIRMATION:** Never delete without user saying "yes" or "delete"
3. **CREATE MANIFEST:** Log what will be deleted
   ```bash
   ls -la [directory] > ~/deletion_manifest_$(date +%Y%m%d_%H%M%S).txt
   ```
4. **SYSTEMATIC DELETION:** Remove systematically, not all at once
5. **VERIFY COMPLETION:** Confirm space freed and directory empty

**NEVER:**
- Delete without backup verification
- Skip user confirmation
- Delete without creating a manifest
- Assume something is safe to delete

## Setup commands
```bash
# Navigate to project root
cd /path/to/your/project

# Clone a backed-up repository
gh repo clone [your-username]/[repo-name]

# List all your repositories on GitHub
gh repo list [your-username] --limit 100

# Check disk usage
du -sh .

# Check disk usage by directory
du -sh */ | sort -hr | head -20
```

## MCP server integration

**Model Context Protocol (MCP)** servers are configured to provide AI agents with enhanced capabilities for working with this codebase.

### Configured servers
Located in `.cursor/mcp.json`:

#### 1. Filesystem MCP Server
**Purpose:** File operations scoped to the project root directory
**Capabilities:**
- Read and write files
- Search directory structure
- Navigate project hierarchy
- File and directory operations

**Scope:** Limited to `${workspaceFolder}` for security

**Example operations:**
- "Search for files containing X"
- "Read the README from project Y"
- "List all markdown files"

#### 2. Work Efforts MCP Server ⭐
**Purpose:** Automated work efforts management with Johnny Decimal system
**Capabilities:**
- Create work efforts with automatic numbering
- List and search existing work efforts
- Update status (active/paused/completed)
- Add progress notes
- Maintain Johnny Decimal structure

**Location:** `.mcp-servers/work-efforts/` (custom internal tool)

**Example operations:**
- "Create a work effort for implementing user auth"
- "List all active work efforts"
- "Mark work effort 00.01 as completed"
- "Add progress: finished API integration"

#### 3. Simple Tools MCP Server ⭐
**Purpose:** Utility functions for development workflow
**Capabilities:**
- Generate random names (e.g., "HappyPanda123")
- Create unique IDs with timestamps
- Format dates (ISO, human, filename, devlog)

**Location:** `.mcp-servers/simple-tools/` (custom internal tool)

**Example operations:**
- "Generate a random project name"
- "Create a unique identifier"
- "Format today's date for a filename"

#### 4. Docs Maintainer MCP Server ⭐
**Purpose:** Johnny Decimal documentation management in `_docs` folder
**Capabilities:**
- Initialize `_docs` structure with default areas
- Create docs with auto-numbering (e.g., 20.01, 20.02)
- Update content and links with timestamp tracking
- Rebuild indexes and clean broken links
- Bidirectional linking between docs and work efforts
- Health checks (missing metadata, broken links, orphaned docs)

**Location:** `.mcp-servers/docs-maintainer/` (Python/FastMCP)

**Example operations:**
- "Initialize docs in this repo"
- "Create a doc about API design in development area"
- "Check documentation health"
- "Link this doc to work effort 00.01"
- "Search docs for 'authentication'"

#### 5. BrowserTools MCP Server ⭐ (NEW)
**Purpose:** Browser monitoring and interaction for AI-powered debugging
**Capabilities:**
- Capture console logs and errors
- Monitor XHR network requests/responses
- Take screenshots (with optional auto-paste to Cursor)
- Analyze selected DOM elements
- Run Lighthouse audits (SEO, Performance, Accessibility, Best Practices)
- Debugger Mode - comprehensive bug investigation
- Audit Mode - full web app audit

**Location:** `.mcp-servers/browser-tools/` (npx-based, requires middleware server)

**Requirements:**
1. Chrome extension installed (from GitHub releases)
2. Middleware server running: `npx @agentdeskai/browser-tools-server@1.2.1`
3. Chrome DevTools open with BrowserToolsMCP panel

**Example operations:**
- "Enter debugger mode" - Run all debugging tools with prompts
- "Enter audit mode" - Run comprehensive audits
- "Take a screenshot of this page"
- "Check console and network logs for errors"
- "Run an SEO audit on this page"
- "Analyze the currently selected element"

**Available tools:**
| Tool | Description |
|------|-------------|
| `getConsoleLogs` | Capture browser console output |
| `getNetworkLogs` | Monitor network traffic |
| `takeScreenshot` | Capture page screenshots |
| `getSelectedElement` | Analyze selected DOM elements |
| `wipeLogs` | Clear stored logs |
| `runAccessibilityAudit` | WCAG compliance checks |
| `runPerformanceAudit` | Lighthouse performance analysis |
| `runSEOAudit` | Search engine optimization checks |
| `runBestPracticesAudit` | Web development best practices |
| `runNextJSAudit` | NextJS-specific SEO audit |
| `runDebuggerMode` | Run all debugging tools in sequence |
| `runAuditMode` | Run all audits in sequence |

**Links:**
- [Documentation](https://browsertools.agentdesk.ai/)
- [GitHub](https://github.com/AgentDeskAI/browser-tools-mcp)
- [Forked Repo](https://github.com/ctavolazzi/browser-tools-mcp)

#### 6. Memory MCP Server
**Purpose:** Persistent knowledge graph for storing information across sessions
**Capabilities:**
- Create and manage entities (people, concepts, projects)
- Build relationships between entities
- Add observations and notes to entities
- Search and query stored knowledge
- Maintain context across conversations

**Location:** npx-based (`@modelcontextprotocol/server-memory`)

**Storage:** `~/.cursor/memory.jsonl`

**Available tools:**
| Tool | Description |
|------|-------------|
| `create_entities` | Create new entities in the knowledge graph |
| `create_relations` | Build relationships between entities |
| `add_observations` | Add notes/observations to existing entities |
| `delete_entities` | Remove entities from the graph |
| `delete_observations` | Remove specific observations |
| `delete_relations` | Remove relationships |
| `read_graph` | Read the entire knowledge graph |
| `search_nodes` | Search for entities by query |
| `open_nodes` | Retrieve specific entities by name |

**Example operations:**
- "Remember that Project X uses React and TypeScript"
- "What do you know about my authentication system?"
- "Create a relationship between User service and Auth service"

#### 7. GitHub MCP Server (API)
**Purpose:** Direct GitHub API access via MCP (complements `gh` CLI)
**Capabilities:**
- Repository operations via API
- Issue and PR management
- GitHub Copilot integration

**Location:** Remote API (`https://api.githubcopilot.com/mcp/`)

**Note:** This is different from the `gh` CLI - it provides MCP-native GitHub access.

**Example operations:**
- Direct API calls to GitHub
- Integration with GitHub Copilot features

#### 8. PixelLab MCP Server
**Purpose:** AI-powered pixel art generation for game development
**Capabilities:**
- Generate characters with multiple directional views (4 or 8 directions)
- Create character animations (walk, run, attack, etc.)
- Generate isometric tiles for maps
- Create top-down tilesets with terrain transitions
- Create sidescroller tilesets for platformers
- Generate map objects with transparent backgrounds

**Location:** Remote API (`https://api.pixellab.ai/mcp`)

**Available tools:**
| Tool | Description |
|------|-------------|
| `create_character` | Generate character with directional sprites |
| `animate_character` | Add animations to existing characters |
| `get_character` | Retrieve character data and images |
| `list_characters` | List all created characters |
| `delete_character` | Remove a character |
| `create_isometric_tile` | Generate isometric game tiles |
| `get_isometric_tile` | Retrieve tile data |
| `list_isometric_tiles` | List all tiles |
| `delete_isometric_tile` | Remove a tile |
| `create_map_object` | Generate objects for game maps |
| `get_map_object` | Retrieve map object data |
| `create_topdown_tileset` | Generate top-down tilesets |
| `get_topdown_tileset` | Retrieve tileset data |
| `list_topdown_tilesets` | List all tilesets |
| `delete_topdown_tileset` | Remove a tileset |
| `create_sidescroller_tileset` | Generate platformer tilesets |
| `get_sidescroller_tileset` | Retrieve sidescroller tileset |
| `list_sidescroller_tilesets` | List sidescroller tilesets |
| `delete_sidescroller_tileset` | Remove sidescroller tileset |

**Example operations:**
- "Create a wizard character with 8 directional views"
- "Add a walking animation to my character"
- "Generate grass-to-water transition tiles"
- "Create a wooden barrel map object"

#### 9. Nano-Banana MCP Server
**Purpose:** AI image generation and editing using Google Gemini
**Capabilities:**
- Generate new images from text prompts
- Edit existing images with text instructions
- Continue editing the last generated image
- Use reference images for style transfer

**Location:** npx-based (`nano-banana-mcp`)

**Requirements:** Gemini API key (configured in environment)

**Available tools:**
| Tool | Description |
|------|-------------|
| `configure_gemini_token` | Set up Gemini API authentication |
| `generate_image` | Create new image from text prompt |
| `edit_image` | Modify existing image with instructions |
| `continue_editing` | Iteratively edit the last image |
| `get_last_image_info` | Get info about current working image |
| `get_configuration_status` | Check if API is configured |

**Example operations:**
- "Generate an image of a sunset over mountains"
- "Edit this image to add a rainbow"
- "Continue editing - make the colors more vibrant"
- "Use this image as a style reference"

#### 10. WebDev MCP Server
**Purpose:** Screen capture utilities for development
**Capabilities:**
- List available screens/displays
- Capture screenshots of any screen
- Return screenshots as base64 for AI analysis

**Location:** npx-based (`webdev-mcp`)

**Available tools:**
| Tool | Description |
|------|-------------|
| `listScreens` | Get list of available displays |
| `takeScreenshot` | Capture screenshot of specified screen |

**Example operations:**
- "List my available screens"
- "Take a screenshot of screen 1"
- "Capture my current display"

**Note:** May require screen recording permissions on macOS (System Preferences → Privacy & Security → Screen Recording).

### Git & GitHub Operations

**Note:** Git and GitHub operations are handled through standard CLI tools, not MCP servers.

#### GitHub CLI (`gh`)
Use the GitHub CLI for all GitHub operations:
```bash
# Verify authentication
gh auth status

# Repository operations
gh repo view ctavolazzi/[repo-name]
gh repo list ctavolazzi --limit 100
gh repo clone ctavolazzi/[repo-name]
gh repo create [repo-name] --private

# Issues and PRs
gh issue list
gh pr create --title "Feature X"
```

**Authentication:** Run `gh auth login` to authenticate with GitHub.

#### Git CLI
Use standard git commands for version control:
```bash
# Status and changes
git status
git diff
git log --oneline

# Committing
git add .
git commit -m "Your message"
git push

# Branching
git branch feature-x
git checkout -b feature-y
git merge feature-x
```

**Why separate?** Git and GitHub operations are universal developer tools with well-established CLIs. Using them directly:
- ✅ Works everywhere (not just in Cursor)
- ✅ Documented extensively
- ✅ Muscle memory transfers across projects
- ✅ No dependency on MCP server availability

### Using MCP servers
MCP servers are automatically available to AI agents in Cursor. They will:
1. Auto-install on first use via `npx` (no manual setup)
2. Run in the background when needed
3. Provide enhanced context and capabilities
4. Respect authentication and scope limitations

### Verification
```bash
# Check that MCP config exists
cat .cursor/mcp.json

# Verify MCP servers are configured
node .mcp-servers/work-efforts/server.js --help 2>/dev/null || echo "Work efforts server ready"

# Verify GitHub CLI (for GitHub operations)
gh auth status

# Verify git (for version control)
git --version
```

### Troubleshooting MCP
- **Server not starting:** Check that `npx` is available: `which npx`
- **Work efforts server fails:** Run `cd .mcp-servers/work-efforts && npm install`
- **Filesystem access denied:** Ensure operations are within allowed directory
- **GitHub operations fail:** Run `gh auth login` to authenticate
- **Git operations fail:** Check git config: `git config --list`
- **Browser-tools not working:**
  1. Ensure middleware is running: `npx @agentdeskai/browser-tools-server@1.2.1`
  2. Check Chrome DevTools is open with BrowserToolsMCP panel
  3. Only one DevTools panel should be open at a time
  4. Restart Chrome completely if issues persist

## Common workflows

### Starting new work
```bash
# Clone the relevant repo
cd /path/to/your/projects
gh repo clone [your-username]/[repo-name]

# Check for uncommitted changes before starting
cd [repo-name]
git status

# Check if _work_efforts/ system exists
ls -la _work_efforts/ 2>/dev/null
```

### Regular maintenance
```bash
# Check all git repos for uncommitted changes
for dir in */; do
  cd "$dir"
  if [ -d .git ]; then
    echo "=== $dir ==="
    git status -s
  fi
  cd ..
done

# Push all repos with changes
for dir in */; do
  cd "$dir"
  if [ -d .git ]; then
    echo "=== Pushing $dir ==="
    git add -A
    git commit -m "Backup $(date +%Y-%m-%d)"
    git push
  fi
  cd ..
done
```

### Cleanup operations
```bash
# Find and delete node_modules
find . -name "node_modules" -type d -prune -exec rm -rf {} +

# Find and delete Python virtual environments
find . -name "venv" -type d -prune -exec rm -rf {} +
find . -name ".venv" -type d -prune -exec rm -rf {} +

# Find large files (>100MB)
find . -type f -size +100M 2>/dev/null
```

## Directory structure
```
project-root/
├── .cursor/
│   ├── mcp.json     # MCP server configuration (project-level, can be empty)
│   └── rules/       # Cursor-specific AI rules (.mdc files)
├── .mcp-servers/
│   ├── browser-tools/   # Browser monitoring (npx-based) ⭐
│   ├── docs-maintainer/ # Documentation management (Python/FastMCP) ⭐
│   ├── work-efforts/    # Work efforts management (Node.js) ⭐
│   └── simple-tools/    # Utility functions (Node.js) ⭐
├── _docs/           # Johnny Decimal documentation (managed by docs-maintainer)
├── _work_efforts/   # Johnny Decimal work tracking (managed by work-efforts)
├── README.md        # Project documentation
├── AGENTS.md        # This file - AI agent instructions
└── [your-files]/    # Your project files and directories
```

**MCP Server Configuration:**
- User-level config: `~/.cursor/mcp.json` (10 servers: memory, filesystem, work-efforts, simple-tools, docs-maintainer, github, pixellab, nano-banana, webdev, browser-tools)
- Project-level config: `.cursor/mcp.json` (empty by default, use for project-specific overrides)

**Optional organization patterns:**
```
project-root/
├── src/             # Source code
├── docs/            # Documentation
├── tests/           # Test files
├── _docs/           # Johnny Decimal docs (MCP-managed)
├── _work_efforts/   # Johnny Decimal work tracking (MCP-managed)
└── scripts/         # Build and utility scripts
```

## Code style & conventions

### Work Efforts System
Many repos use the `work_efforts/` system with Johnny Decimal organization:
- **Structure:** `XX-XX_category/XX_subcategory/XX.XX_document.md`
- **Categories:** 00-09 (meta), 10-19 (development), 20-29 (features), etc.
- **Index files:** Each subcategory has `00.00_index.md` with links
- **Status folders:** `active/`, `completed/`, `paused/`

**When creating work efforts:**
1. Search for existing work efforts before creating new ones
2. Follow Johnny Decimal numbering (00.00 to 99.99)
3. Use descriptive names with underscores
4. Update the subcategory index file
5. Update devlog with progress

### Commit messages
- Use clear, descriptive messages
- Format: "Action: description" (e.g., "feat: add user auth")
- Include "Backup [date]" for routine backups
- Reference work effort numbers when applicable

### Git practices
- Commit frequently
- Push at end of work session
- Never commit `node_modules/`, `venv/`, `.env`, or build artifacts
- Use `.gitignore` appropriately

## Testing instructions
```bash
# Check if tests exist in a repo
cd [repo-name]
ls -la | grep -E "test|spec|__tests__"

# Run tests (varies by project)
npm test          # Node.js projects
pnpm test        # pnpm projects
pytest           # Python projects
cargo test       # Rust projects
```

**Before committing:**
1. Run linter if available (`npm run lint`, `eslint`, `ruff`, etc.)
2. Run tests if they exist
3. Check for TypeScript errors (`tsc --noEmit`)

## Cleanup schedules

### Weekly (Every Friday)
- Commit all work in progress
- Push all changes to GitHub
- Delete `node_modules/` in inactive projects
- Remove temporary test files

### Monthly (Last day of month)
- Review all repos for uncommitted changes
- Push all pending commits
- Delete build artifacts (`dist/`, `build/`, `.next/`, etc.)
- Remove unused virtual environments
- Archive completed projects

### Quarterly (End of quarter)
- **Full backup verification:** `gh repo list [your-username] --limit 100`
- **Disk space audit:** `du -sh .`
- Archive projects untouched for 6+ months
- Delete local copies of archived projects

### Annually (December 31st)
- Major cleanup day (like September 30, 2025)
- Full backup of all repos
- Complete deletion of non-essential files
- Fresh start for new year

## Disk space targets

| Status | Disk Usage | Action |
|--------|------------|--------|
| 🟢 Healthy | < 10GB | None |
| 🟡 Monitor | 10-20GB | Review large projects |
| 🟠 Warning | 20-30GB | Monthly cleanup needed |
| 🔴 Critical | > 30GB | **Immediate cleanup required** |

**When disk usage is critical:**
1. Identify largest directories: `du -sh */ | sort -hr | head -10`
2. Check for node_modules: `find . -name "node_modules" -type d`
3. Check for build artifacts: `find . -type d -name "dist" -o -name "build"`
4. Verify backups before deleting
5. Execute systematic cleanup

## Security considerations

### Before cloning repos
- Verify repo ownership: `gh repo view [your-username]/[repo-name]`
- Check for sensitive files in .gitignore
- Never clone unverified third-party repos without review

### Environment variables
- Never commit `.env` files
- Use `.env.example` for templates
- Store secrets in system keychain or password manager

### API keys and tokens
- GitHub CLI is authenticated for this user
- Check auth status: `gh auth status`
- Tokens are stored securely by gh CLI

## User preferences

### Communication style
- Direct and efficient
- Confirm destructive operations explicitly
- Provide summaries with verification steps
- Use structured markdown for clarity

### Work style
- Follows structured work effort system
- Values comprehensive documentation
- Prefers systematic approaches over ad-hoc
- Regular cleanup and maintenance advocate
- Backs up everything before deletion

### File organization
- Uses Johnny Decimal for work efforts
- Prefers clear directory structures
- Documents processes and decisions
- Maintains devlogs for project tracking

## Key files & references

- **GitHub Profile:** Configure in your setup
- **Deletion Manifests:** `~/deletion_manifest_*.txt`
- **This README:** `README.md` (project documentation)
- **AGENTS.md:** This file - AI agent instructions

## Troubleshooting

### "Permission denied" errors
```bash
# Fix permissions on a directory
chmod -R u+w [directory]

# If sudo required, ask user first
echo "This requires sudo. Please run: sudo rm -rf [directory]"
```

### "Repository not found" on GitHub
```bash
# List all repos to verify name
gh repo list [your-username]

# Check if repo is private
gh repo view [your-username]/[repo-name]
```

### Disk space not freeing up
```bash
# Empty trash (macOS)
# Note: Ask user first
echo "Run: rm -rf ~/.Trash/*"

# Check for Docker images/containers
docker system df
```

## Notes for AI agents

1. **Always verify before destroying:** Check GitHub backups before any deletion
2. **Create paper trails:** Generate manifest files for all major operations
3. **Respect the schedules:** Follow cleanup cadence defined above
4. **Update documentation:** Modify README.md and this file after significant changes
5. **Check for work_efforts:** Many repos have structured task tracking
6. **User expects confirmation:** For deletions, get explicit "yes" or "delete" confirmation
7. **Systematic over bulk:** Process directories one at a time during cleanup
8. **Document everything:** Update devlogs and work efforts during development
9. **⭐ PREFER MCP SERVERS:** Always use MCP server tools instead of direct file/git operations when available (see `.cursor/rules/prefer-mcp-servers.mdc`)

## Project history

Track your project's major milestones and changes here:

**[Date] - [Event Description]:**
- List key changes
- Document major decisions
- Record configuration updates

**2025-12-21 - Added BrowserTools MCP Server:**
- Added browser-tools MCP server for browser monitoring and debugging
- Created startup script at `.mcp-servers/browser-tools/start-server.sh`
- Enables console logs, network monitoring, screenshots, DOM analysis
- Includes Lighthouse audits (SEO, Performance, Accessibility)
- Forked repo: https://github.com/ctavolazzi/browser-tools-mcp

**2025-12-20 - Added docs-maintainer MCP Server:**
- Added docs-maintainer MCP server (Python/FastMCP, 7 tools)
- Initialized `_docs/` folder with Johnny Decimal structure
- Fixed duplicate MCP server configs (consolidated to user-level)
- Updated README.md and AGENTS.md documentation

**2025-10-01 - Initial Setup:**
- Installed cursor-coding-protocols toolkit
- Configured 3 MCP servers (Filesystem, Work Efforts, Simple Tools)
- Set up Johnny Decimal work efforts system
- Established cleanup schedules

**Next scheduled maintenance:** December 31, 2025 (Annual cleanup)

