# Claude Code Continuation Prompt - _pyrite Repository

**Date**: January 7, 2026
**Repository**: `_pyrite`
**Location**: `/Users/ctavolazzi/Code/active/_pyrite`
**Current Version**: v0.7.0

---

## 🎯 Project Overview

**Pyrite** ("Fool's gold") is an AI-powered repository management toolkit for AI-assisted development. It provides:

- 📋 **Work tracking** — MCP-based work efforts with tickets, checkpoints, devlog
- 💬 **Chat interface** — Natural language work effort management (Console)
- 📊 **Real-time dashboard** — Mission Control monitoring across repositories
- 🔍 **Code quality tools** — Obsidian linter, GitHub health check, structure validation
- 🤖 **AI coordination** — Session hooks, context sharing, MCP servers
- 🔧 **Health checks** — GitHub integration verification

**Philosophy**: Configurable, incremental, AI-first, documented.

---

## 📊 Current Repository State

### Git Status
- **Branch**: `main`
- **Status**: Behind `origin/main` by 3 commits (NovaSystem/NovaProcess work)
- **Staged Changes**: 280 files (~28,692 insertions, 848 deletions)
- **Unstaged Changes**: 5 files (dashboard improvements)

### Uncommitted Work

**Staged (Ready to Commit)**:
- ✅ Dashboard migration: `dashboard-v3/` → `dashboard-legacy-20260105/`
- ✅ Active dashboard updated with V3 improvements
- ✅ TheOracle system: Complete testing/debugging infrastructure
- ✅ Testing infrastructure: Test helpers, experiments, data flow tests
- ✅ Work effort tickets: Many new ticket files across multiple WEs
- ✅ Documentation: Development process guides, architecture docs
- ✅ Tools: Project scaffolding, blend validation tests
- ✅ Package config: `pyproject.toml`, `uv.lock`

**Unstaged (Needs Review)**:
- `mcp-servers/dashboard/config.json` (+4 lines)
- `mcp-servers/dashboard/public/app.js` (+180 lines)
- `mcp-servers/dashboard/public/responsive.js` (+19 lines)
- `mcp-servers/dashboard/public/styles/detail-view-improvements.css` (minor)
- `mcp-servers/dashboard/public/styles/layout.css` (+9 lines)

### Missing from Origin
3 commits on `origin/main`:
- PR #33: Quality advisor review
- NovaProcess orchestrator implementation
- NovaSystem multi-agent architecture foundation

**Action Required**: Pull latest, review unstaged changes, commit staged work.

---

## 🚀 Active Work Efforts

### 1. **WE-260104-wppd: TheOracle Phase 2 Core Infrastructure** (ACTIVE)
**Status**: Active | **Branch**: `feature/WE-260104-wppd-theoracle_phase_2_core_infrastructure_implementation`

**Objective**: Implement missing core infrastructure classes to make TheOracle functional.

**Current State**:
- ✅ Phase 1 Complete: Architecture, docs, base TheOracle.js class
- ❌ Phase 2 Not Started: 11 core classes missing (blocking execution)

**Missing Classes** (Priority Order):
1. `ResultRepository` - PocketBase integration
2. `ComponentDiscovery` - DOM traversal
3. `TestQueue` - FIFO execution
4. `CSSAnalyzer` - CSS analysis
5. `ComponentAgent` - First agent
6. Remaining 5 agents (Layout, Style, Interaction, Accessibility, Performance)
7. `PatternLearner` - Pattern recognition

**Key Files**:
- `mcp-servers/dashboard/tests/debugger/TheOracle.js` - Base class
- `mcp-servers/dashboard/tests/debugger/PRODUCTION_STATE_ANALYSIS.md` - Analysis
- `mcp-servers/dashboard/tests/debugger/NOVASYSTEM_CONTINUATION_PROMPT.md` - Continuation guide
- `mcp-servers/dashboard/tests/debugger/DEVELOPMENT_PROCESS.md` - Complete dev guide (2,700+ lines)

**Next Step**: Implement `ResultRepository` class (TKT-wppd-001)

---

### 2. **WE-251231-un7r: Mission Control V3 Responsive Rewrite** (ACTIVE)
**Status**: Active | **Branch**: `feature/WE-251231-un7r-mission_control_v3_responsive_rewrite`

**Objective**: Ground-up CSS architecture rewrite with mobile-first responsive design.

**Current State**:
- ✅ Phase 1 Complete: V3 running on port 3848
- ✅ Modular CSS architecture (tokens, reset, typography, layout, components)
- ✅ Responsive breakpoints (320-1440px)
- ✅ Mobile drawer with touch gestures
- ✅ Accessibility (skip link, keyboard nav)

**Next Phase**: Component migration (WE-251231-sdc6)

---

### 3. **WE-251231-sdc6: Mission Control V3 Phase 2 Component Migration** (ACTIVE)
**Status**: Active

**Objective**: Migrate remaining V2 components to V3 modular CSS system.

**Tickets** (9 total):
- Migrate form components (search, filters, buttons)
- Migrate detail view layout and components
- Migrate queue item cards and status badges
- Migrate overlay components (modals, toasts, dropdowns)
- JavaScript view switching integration
- Sidebar tree interaction polish
- Full breakpoint regression test
- Accessibility audit and fixes
- Remove legacy styles.css dependency

---

### 4. **WE-260102-ph4e: Todoist Plugin Enhancements** (PAUSED)
**Status**: Paused | **Labels**: plugin-system, v0.9.0, phase-4, todoist

**Objective**: Phase 4 enhancements - work effort linking, subtask parsing, ticket creation.

**Features**:
- WE lookup by WE-ID
- Subtask → ticket mapping
- Multi-task work effort linking
- Enhanced feedback messages

---

## 📁 Key Directory Structure

```
_pyrite/
├── tools/                     # Standalone utilities
│   ├── obsidian-linter/       # Markdown validation & fixing (v0.6.0)
│   ├── github-health-check/   # GitHub integration verification
│   ├── structure-check/       # Repository structure validation
│   └── scaffold_new_project.py # Project scaffolding
├── mcp-servers/               # Web interfaces and MCP servers
│   ├── console/               # Chat interface for work efforts
│   ├── dashboard/             # Active Mission Control (port 3847)
│   ├── dashboard-legacy-20260105/  # Legacy V3 backup
│   ├── work-efforts/          # MCP server for work effort operations
│   └── docs-maintainer/       # Documentation management
├── _work_efforts/             # Work tracking (MCP v0.3.0)
│   ├── WE-*/                  # Work effort folders
│   ├── checkpoints/           # Session journals
│   └── devlog.md              # Rolling activity log
├── _docs/                      # Plans, decisions (Johnny Decimal)
├── plugins/                   # Plugin system (v0.9.0)
│   └── todoist/               # Todoist integration
├── .claude/                    # Claude Code configuration
│   └── skills/                # Session start hooks
├── .cursor/                    # Cursor IDE configuration
└── pyrite                      # Unified CLI wrapper
```

---

## 🔧 Development Workflow

### Work Effort System (MCP v0.3.0)
- **Work Effort ID**: `WE-YYMMDD-xxxx` (e.g., `WE-251227-1gku`)
- **Ticket ID**: `TKT-xxxx-NNN` (e.g., `TKT-1gku-001`)
- **Checkpoint ID**: `CKPT-YYMMDD-HHMM`

### MCP Tools Available
- `mcp_work-efforts_create_work_effort` — New initiative
- `mcp_work-efforts_create_ticket` — Add task to work effort
- `mcp_work-efforts_update_ticket` — Change status
- `mcp_work-efforts_search_work_efforts` — Find related work
- `mcp_memory_*` — Knowledge persistence
- `mcp_sequential-thinking_sequentialthinking` — Problem breakdown

### CLI Commands
```bash
# Unified CLI
./pyrite lint --scope _work_efforts --fix
./pyrite health
./pyrite structure --fix

# Direct tools
python3 tools/obsidian-linter/lint.py --scope _work_efforts --fix
python3 tools/github-health-check/check.py
python3 tools/structure-check/check.py --fix
```

### Dashboard
```bash
cd mcp-servers/dashboard
npm install
npm start
# Open http://localhost:3847
```

---

## 📚 Key Documentation Files

### Essential Reading
1. **`README.md`** - Main project documentation
2. **`AGENTS.md`** - AI agent instructions and workflow
3. **`_work_efforts/devlog.md`** - Recent activity and context
4. **`mcp-servers/dashboard/tests/debugger/DEVELOPMENT_PROCESS.md`** - Complete dev guide (2,700+ lines)
5. **`mcp-servers/dashboard/tests/debugger/PRODUCTION_STATE_ANALYSIS.md`** - TheOracle analysis

### Work Effort Files
- `_work_efforts/WE-260104-wppd_*/WE-260104-wppd_index.md` - TheOracle work effort
- `_work_efforts/WE-251231-un7r_*/WE-251231-un7r_index.md` - V3 responsive rewrite
- `_work_efforts/WE-251231-sdc6_*/WE-251231-sdc6_index.md` - Component migration

### Architecture Docs
- `mcp-servers/dashboard/docs/ARCHITECTURE.md` - System architecture
- `mcp-servers/dashboard/tests/debugger/ARCHITECTURE.md` - TheOracle architecture
- `_docs/20-29_development/architecture_category/` - Core data structures

---

## 🎯 Immediate Next Steps

### Priority 1: Git State Cleanup
1. **Pull latest from origin**:
   ```bash
   git pull origin main
   ```

2. **Review unstaged changes**:
   ```bash
   git diff mcp-servers/dashboard/
   ```

3. **Stage unstaged changes** (if good):
   ```bash
   git add mcp-servers/dashboard/
   ```

4. **Commit staged work**:
   ```bash
   git commit -m "feat: Dashboard V3 migration, TheOracle infrastructure, testing framework

   - Migrate dashboard-v3 to dashboard-legacy-20260105
   - Update active dashboard with V3 improvements
   - Add TheOracle testing/debugging system
   - Add comprehensive test infrastructure
   - Add project scaffolding tools
   - Update documentation and work effort tickets"
   ```

5. **Push to origin**:
   ```bash
   git push origin main
   ```

### Priority 2: Continue TheOracle Implementation
**Work Effort**: WE-260104-wppd

**Start with**: TKT-wppd-001 - Implement ResultRepository class

**Reference Files**:
- `mcp-servers/dashboard/tests/debugger/TheOracle.js` - Base class structure
- `mcp-servers/dashboard/tests/debugger/PRODUCTION_STATE_ANALYSIS.md` - Technical specs
- `mcp-servers/dashboard/tests/debugger/DEVELOPMENT_PROCESS.md` - Implementation guide
- `mcp-servers/dashboard/tests/debugger/oracle.config.example.js` - Configuration example

**Implementation Order**:
1. ResultRepository (PocketBase integration)
2. ComponentDiscovery (DOM traversal)
3. TestQueue (FIFO execution)
4. CSSAnalyzer (CSS analysis)
5. ComponentAgent (first agent)
6. Remaining 5 agents
7. PatternLearner (pattern recognition)
8. Integration testing

### Priority 3: Dashboard Component Migration
**Work Effort**: WE-251231-sdc6

**Focus**: Migrate remaining components from legacy styles to modular CSS system.

---

## 🛠️ Development Environment

### Prerequisites
- Python 3.10+
- Node.js 18.x+
- Git
- GitHub CLI (`gh`) for health checks

### Setup
```bash
# Python dependencies (if needed)
pip install -e .

# Dashboard dependencies
cd mcp-servers/dashboard
npm install

# Console dependencies
cd mcp-servers/console
npm install
```

### Testing
```bash
# Run data flow tests
cd mcp-servers/dashboard
npm test

# Run linter
./pyrite lint --scope _work_efforts --fix

# Health check
./pyrite health
```

---

## 📝 Important Conventions

### Code Style
- **Direct & Minimal**: No unnecessary abstractions
- **Inline logic** until 3+ uses
- **Single file** until 500+ lines
- **Let exceptions bubble up**

### Git Conventions
- **Branch**: `feature/WE-YYMMDD-xxxx-slug`
- **Commit**: `WE-YYMMDD-xxxx/TKT-xxxx-NNN: Description`
- **Comment**: `// TKT-xxxx-NNN: reason`

### Work Effort Management
- Create work effort for non-trivial tasks (2+ tickets)
- Update devlog with progress
- Use MCP tools for work effort operations
- Follow ID formats: `WE-YYMMDD-xxxx`, `TKT-xxxx-NNN`

---

## 🔍 Quick Reference

### Key Commands
```bash
# Check work efforts
cat _work_efforts/devlog.md

# List active work efforts
ls _work_efforts/WE-*/

# Run tools
./pyrite lint --scope _work_efforts --fix
./pyrite health
./pyrite structure --fix

# Start dashboard
cd mcp-servers/dashboard && npm start
```

### Important Paths
- Work efforts: `_work_efforts/`
- Dashboard: `mcp-servers/dashboard/`
- Tools: `tools/`
- Documentation: `_docs/` and `mcp-servers/dashboard/docs/`
- TheOracle: `mcp-servers/dashboard/tests/debugger/`

---

## 🚨 Known Issues / Notes

1. **Dashboard Migration**: `dashboard-v3/` has been renamed to `dashboard-legacy-20260105/`. Active dashboard is now `dashboard/` with V3 improvements merged.

2. **TheOracle**: Phase 1 complete, Phase 2 not started. System cannot run until core classes are implemented.

3. **Unstaged Changes**: 5 dashboard files have uncommitted changes. Review before committing.

4. **Behind Origin**: Local branch is 3 commits behind. Pull before starting new work.

5. **Package Dependencies**: `pyproject.toml` references local paths for `novasystem` and `empirica`. Ensure these repos exist at expected locations.

---

## 📞 Getting Help

- **Devlog**: `_work_efforts/devlog.md` - Recent activity and context
- **Work Efforts**: Check `_work_efforts/WE-*/` for detailed progress
- **Documentation**: `_docs/` and `mcp-servers/dashboard/docs/`
- **MCP Tools**: Use `mcp_work-efforts_*` tools to query work efforts

---

## ✅ Session Startup Checklist

1. ✅ Run `date` to verify current date/time
2. ✅ Check `_work_efforts/devlog.md` for recent context
3. ✅ List active work efforts: `ls _work_efforts/WE-*/`
4. ✅ Check git status: `git status`
5. ✅ Pull latest: `git pull origin main`
6. ✅ Review unstaged changes
7. ✅ Decide on work focus (TheOracle, Dashboard, or other)

---

**Ready to continue development!** 🚀

Focus areas:
- **TheOracle Phase 2** (highest priority - blocking)
- **Dashboard component migration** (active work)
- **Git state cleanup** (immediate action)

Choose your focus and reference the appropriate work effort files and documentation.

