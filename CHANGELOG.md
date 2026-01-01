# Changelog

All notable changes to this project will be documented in this file.

## [0.6.1] - 2025-12-31

### Added
- **ID Generator Tool** (`tools/id-generator/generate.py`)
  - Generate work effort IDs (`WE-YYMMDD-xxxx`)
  - Generate ticket IDs (`TKT-xxxx-NNN`) with parent linking
  - Generate checkpoint IDs (`CKPT-YYMMDD-HHMM`)
  - Validate and parse any ID format
  - Batch generation for complex workflows
  - Switch statement pattern for extensibility

### Documentation
- Updated `AGENTS.md` with accurate directory structure and tools
- Updated `_coordination/CONTEXT.md` to reflect v0.6.0 state
- Clarified work tracking system (MCP Work Efforts vs Johnny Decimal)

### Session
- **Checkpoint**: `CKPT-251231-1800` - Full session journal saved

## [0.6.0] - 2025-12-31

### Added
- **Unified Obsidian Linter Command** (`lint.py`)
  - Single command runs check → validate → (optional) fix in sequence
  - Supports `--scope`, `--fix`, `--dry-run`, `--strict` flags
  - Clear step-by-step output with summary

- **Link Fixing Tools**
  - `fix-links.py` - Auto-converts ticket/work effort IDs to wikilinks
  - `fix-all.py` - Comprehensive auto-fixer for all fixable issues
  - Table-aware linking (no aliases in tables to prevent markdown breakage)
  - Fixed 105 unlinked references across 40 files

- **Enhanced Validation**
  - `validate.py` - Duplicate IDs, broken links, orphaned files, naming consistency
  - ID format validation (WE-YYMMDD-xxxx, TKT-xxxx-NNN)
  - Status value validation (active/paused/completed, etc.)
  - Date format validation (ISO 8601)
  - Parent relationship validation (ticket → work effort)

- **Task List Support** (Phase 2A - via Claude Code PR #14)
  - Task list syntax validation (`- [ ]`, `- [x]`)
  - Auto-fixes `[X]` → `[x]`, adds missing spaces
  - Skips task lists in code blocks

- **Documentation**
  - `FEATURES.md` - Coverage matrix of checked vs. not checked features
  - `FRONTMATTER.md` - Frontmatter validation guide

### Changed
- Enhanced `check.py` with unlinked reference detection and frontmatter validation
- Updated `README.md` with unified command as recommended approach

### Workflow
- **Cross-chat coordination**: Cursor (local) + Claude Code (cloud) working together
- PR #11: Frontmatter validation (merged)
- PR #12: Link fixers and table handling (merged)
- PR #14: Phase 2A task list support (Claude Code, merged)

### Session Checkpoint
- **ID**: CKPT-251231-1800
- **Status**: Complete - Obsidian Linter System v1.0 delivered

## [0.5.0] - 2025-12-31

### Added
- **Obsidian Markdown Linter**: Validates Obsidian-flavored markdown files
  - YAML frontmatter validation (syntax + standard field warnings)
  - Wikilink checking with broken link detection
  - Basic formatting checks (whitespace, headings, newlines)
  - CLI with `--fix`, `--dry-run`, `--scope`, `--strict` flags
  - Auto-fix for safe changes only
  - Zero dependencies (507 lines, pure Python stdlib)

### Changed
- Task workflow validated: Semi-ambiguous request → Research → Scope proposal → Approval → Implementation
- Tasks now archived to `_coordination/completed/` after completion

### Workflow Milestone
- **First successful cross-chat coordinated feature development**
- Claude Code proposed scope, stopped and waited for approval
- Cursor reviewed, adjusted, and approved before implementation
- Tool quality exceeded expectations

## [0.4.0] - 2025-12-31

### Added
- **GitHub Health Check Tool**: Session startup verification for GitHub integration
  - 7 health checks (auth, rate limits, repo access, permissions, branches, PRs, issues)
  - Zero external dependencies (stdlib only)
  - CLI with `--token`, `--repo-path`, `--quiet` flags
  - Claude Code session hook (`.claude/skills/SessionStart.md`)
- **Cross-Chat Coordination System**: AI tool collaboration infrastructure
  - `_coordination/CONTEXT.md` - state sharing between AI tools
  - `_coordination/tasks/` - pending task queue with frontmatter status
  - `_coordination/completed/` - archived handoffs
- **Structure Check Tool**: Repository structure verification
  - Composable individual checks (no spaghetti code)
  - Configurable expected structure via Python dict
  - Auto-fix for missing directories (`--fix`)
  - Checks: coordination, work_efforts, spin_up, tools
- **Spin-Up Infrastructure**: Session initialization system
  - `_spin_up/SPIN_UP_PROCEDURE.md` - full diagnostic procedure
  - Understanding snapshots for session continuity
  - `.cursor/commands/spin-up.md` - quick orientation command

### Changed
- Reorganized coordination files from `_work_efforts/` to `_coordination/`
- Updated spin-up command to include structure and task checks
- Task files now use YAML frontmatter for status tracking

### Documentation
- Added tool READMEs (github-health-check, structure-check)
- Added `.claude/README.md` for Claude Code configuration
- Updated main README with new structure

## [0.3.0] - 2025-12-28

### Added
- **Structured Logging**: pino for JSON logs, pino-pretty for dev output, chalk for colored CLI
- **Documentation**: ARCHITECTURE.md, USER-GUIDE.md, expanded README with screenshots
- **Shared Components**: Reusable nav.js and footer.js with mobile support
- **Logger Module**: lib/logger.js with configurable LOG_LEVEL
- **Decision Document**: DECISION-logging-cli-graphics.md

### Changed
- Refactored server.js to use pino logger (~20 console.log calls replaced)
- Refactored lib/watcher.js to use pino logger
- Added JSDoc comments to server.js, app.js, events.js, parser.js
- Updated package.json with pino, pino-pretty, chalk dependencies

### Fixed
- Work effort status inconsistencies (g6nh, hldk marked completed)

### Removed
- Demo work efforts (test data cleanup)
- BACKUP_diamond_animations.css (deprecated)

## [0.2.0] - 2025-12-27

### Added
- Mission Control Dashboard v2
- Real-time WebSocket updates
- Multi-repository support
- Dual format parsing (Johnny Decimal + MCP v0.3.0)
- Event system with EventBus, ToastManager, AnimationController
- Live Demo walkthrough
- Notification center with activity tracking

## [0.1.0] - 2025-12-20

### Added
- Initial project setup
- Johnny Decimal work efforts structure
- Basic documentation
