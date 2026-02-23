# TheOracle Development Process

**Document Version:** 1.0
**Last Updated:** 2026-01-04
**Status:** Phase 2 Implementation In Progress
**Next Step:** Implement ResultRepository class

**Purpose:** This document provides comprehensive, legally-structured guidance for developing TheOracle using NovaSystem, _pyrite, empirica, and standard development tools. It serves as both a reference manual and operational guide.

---

## Table of Contents

### Part I: Methodology and Integration
- [1. NovaSystem Methodology](#1-novasystem-methodology)
  - [1.1 Definition and Purpose](#11-definition-and-purpose)
  - [1.2 Application in TheOracle Development](#12-application-in-theoracle-development)
  - [1.3 Expert Roles and Responsibilities](#13-expert-roles-and-responsibilities)
- [2. _pyrite Integration](#2-_pyrite-integration)
  - [2.1 Work Effort Tracking System](#21-work-effort-tracking-system)
  - [2.2 MCP Servers](#22-mcp-servers)
  - [2.3 Development Tools](#23-development-tools)
  - [2.4 Devlog System](#24-devlog-system)
- [3. empirica Integration](#3-empirica-integration)
  - [3.1 Repository Overview](#31-repository-overview)
  - [3.2 Integration Patterns](#32-integration-patterns)

### Part II: Development Workflow
- [4. Development Workflow](#4-development-workflow)
  - [4.1 Phase-Based Development Structure](#41-phase-based-development-structure)
  - [4.2 Implementation Process](#42-implementation-process)
  - [4.3 Code Style Guidelines](#43-code-style-guidelines)
  - [4.4 Error Handling Strategy](#44-error-handling-strategy)
- [5. Tool Integration](#5-tool-integration)
  - [5.1 PocketBase](#51-pocketbase)
  - [5.2 Playwright](#52-playwright)
  - [5.3 Testing Library](#53-testing-library)
  - [5.4 axe-core](#54-axe-core)

### Part III: Quality and Operations
- [6. Documentation Strategy](#6-documentation-strategy)
- [7. Testing Strategy](#7-testing-strategy)
- [8. Git Workflow](#8-git-workflow)
- [9. Continuation Across Sessions](#9-continuation-across-sessions)
- [10. Problem-Solving Process](#10-problem-solving-process)
- [11. Success Metrics](#11-success-metrics)

### Part IV: Reference and Resources
- [12. Resources](#12-resources)
- [13. Quick Reference](#13-quick-reference)
- [14. Conclusion](#14-conclusion)

### Part V: Operational Guides
- [15. Troubleshooting](#15-troubleshooting)
- [16. Development Environment](#16-development-environment)
- [17. Real-World Workflow Example](#17-real-world-workflow-example)
- [18. TheOracle and Dashboard-v3 Integration](#18-theoracle-and-dashboard-v3-integration)
- [19. Running TheOracle (Complete Guide)](#19-running-theoracle-complete-guide)
- [20. Extending TheOracle](#20-extending-theoracle)
- [21. Security Considerations](#21-security-considerations)
- [22. Performance Considerations](#22-performance-considerations)
- [23. CI/CD Integration](#23-cicd-integration)
- [24. TheOracle in _pyrite Ecosystem](#24-theoracle-in-_pyrite-ecosystem)

### Quick Reference Tables
- [Table A: MCP Server Quick Reference](#table-a-mcp-server-quick-reference)
- [Table B: Tool Installation Commands](#table-b-tool-installation-commands)
- [Table C: File Locations Reference](#table-c-file-locations-reference)
- [Table D: Common Commands Reference](#table-d-common-commands-reference)
- [Table E: Dependency Chain Reference](#table-e-dependency-chain-reference)
- [Table F: Phase Status Reference](#table-f-phase-status-reference)

---

## Overview

TheOracle is being developed using a multi-tool, multi-methodology approach that combines:
- **NovaSystem** - Problem-solving framework and iterative analysis
- **_pyrite** - Work tracking, MCP servers, and development tools
- **empirica** - Related repository with testing/experimentation patterns
- **Standard Development Tools** - Git, npm, Playwright, PocketBase

This document explains how all these pieces work together to build TheOracle.

**Document Structure:** This document is organized into five parts: Methodology and Integration (Parts I), Development Workflow (Part II), Quality and Operations (Part III), Reference and Resources (Part IV), and Operational Guides (Part V). Each section uses hierarchical numbering (1.1, 1.1.1, etc.) for precise reference.

---

## 1. NovaSystem Methodology

### 1.1 Definition and Purpose

**1.1.1 What NovaSystem Is**

NovaSystem is a problem-solving framework that uses a "Predict-Break-Fix" iterative loop to eliminate ambiguity in data structures and algorithms. It simulates a team of virtual experts working together.

**1.1.2 Core Methodology**

The "Predict-Break-Fix" loop consists of three phases:
1. **Predict:** Design the logic/schema/workflow for the current task
2. **Break:** Actively identify failure points (race conditions, desync, contention, human error)
3. **Fix:** Patch the logic to handle these failures (queues, checksums, transactions)
4. **Repeat:** Iterate until achieving High Confidence (99%)

**1.1.3 Key Documents**

| Document | Purpose | Location |
|----------|---------|----------|
| `NOVASYSTEM_BREAKDOWN.md` | Complete analysis breakdown | `tests/debugger/` |
| `NOVASYSTEM_CONTINUATION_PROMPT.md` | Resume work in new chats | `tests/debugger/` |
| `PRODUCTION_STATE_ANALYSIS.md` | Original NovaSystem analysis | `tests/debugger/` |

### 1.2 Application in TheOracle Development

**1.2.1 For Analysis**

NovaSystem is used to:
- Analyze current state of TheOracle implementation
- Identify blockers, dependencies, and risks
- Create comprehensive breakdowns (see Section 1.1.3, Table: Key Documents)
- Generate continuation prompts for new chat sessions

**1.2.2 For Implementation**

For each class implementation:
1. **Predict:** Design the class structure, interfaces, and methods
2. **Break:** Identify failure points:
   - Import errors (missing dependencies)
   - Runtime errors (undefined methods)
   - PocketBase connection failures
   - Test execution failures
3. **Fix:** Implement with:
   - Error handling
   - Graceful degradation
   - Fallback mechanisms
   - Comprehensive logging
4. **Repeat:** Until high confidence (99%) in implementation

**1.2.3 Cross-Reference**

- Implementation process: See Section 4.2
- Error handling: See Section 4.4
- Troubleshooting: See Section 15

### 1.3 Expert Roles and Responsibilities

**1.3.1 Role Definitions**

| Role | Abbreviation | Primary Responsibility | Cross-Reference |
|------|--------------|------------------------|-----------------|
| Discussion Continuity Expert | DCE | Coordinates development process, maintains focus | Section 4.2.1 |
| Critical Analysis Expert | CAE | Identifies risks, validates code quality | Section 4.4, Section 21 |
| Systems Architect | SA | Designs class structures, defines interfaces | Section 4.2.2 |
| Backend Developer | BD | Implements PocketBase integration, data persistence | Section 5.1 |
| Frontend Testing Expert | FTE | Implements Playwright tests, DOM manipulation | Section 5.2, Section 7 |
| Algorithm Specialist | AS | Tree traversal, queue management, pattern recognition | Section 4.2.3 |

**1.3.2 Role Interactions**

- **DCE** coordinates all other roles and maintains process continuity (see Section 9)
- **CAE** reviews all implementations for safety and quality (see Section 21)
- **SA** designs architecture that **BD** and **FTE** implement (see Section 4)
- **AS** provides algorithms used by all agents (see Section 20)

---

## 2. _pyrite Integration

### 2.1 Work Effort Tracking System

**2.1.1 Work Effort Identification Format**

| Element | Format | Example | Description |
|---------|--------|---------|-------------|
| Work Effort ID | `WE-YYMMDD-xxxx` | `WE-260104-wppd` | Date-based unique identifier |
| Date Component | `YYMMDD` | `260104` | Jan 4, 2026 |
| Unique Suffix | `xxxx` | `wppd` | 4-char alphanumeric (a-z, 0-9) |
| Ticket ID | `TKT-xxxx-NNN` | `TKT-wppd-001` | Parent WE suffix + sequential number |
| Ticket Number | `NNN` | `001` | Sequential (001, 002, 003...) |

**2.1.2 Status Lifecycle**

```
pending → in_progress → completed
```

**2.1.3 Current Work Effort**

| Property | Value |
|----------|-------|
| **ID** | WE-260104-wppd |
| **Title** | TheOracle Phase 2 Core Infrastructure Implementation |
| **Status** | active |
| **Ticket Count** | 8 |
| **Path** | `_work_efforts/WE-260104-wppd_theoracle_phase_2_core_infrastructure_implementation/` |
| **Update Method** | MCP `work-efforts` server (see Section 2.2.1) |

**2.1.4 Directory Structure**

```
_work_efforts/
└── WE-260104-wppd_theoracle_phase_2_core_infrastructure_implementation/
    ├── WE-260104-wppd_index.md      # Main work effort file (see Section 2.1.5)
    └── tickets/                      # Ticket subdirectory
        ├── TKT-wppd-001_implement_result_repository.md
        ├── TKT-wppd-002_implement_component_discovery.md
        ├── TKT-wppd-003_implement_test_queue.md
        └── ...
```

**2.1.5 Work Effort Operations**

**2.1.5.1 Create Work Effort**

**Method:** MCP tool call
**Tool:** `mcp_work-efforts_create_work_effort`
**Reference:** See Section 2.2.1 for MCP server details

**Example:**
```javascript
mcp_work-efforts_create_work_effort({
  repo_path: "/Users/ctavolazzi/Code/active/_pyrite",
  title: "TheOracle Phase 2 Core Infrastructure Implementation",
  objective: "Implement missing core infrastructure classes",
  repository: "_pyrite",
  tickets: [
    "Implement ResultRepository class",
    "Implement ComponentDiscovery class",
    "Implement TestQueue class"
  ]
})
```

**2.1.5.2 Update Ticket**

**Method:** MCP tool call
**Tool:** `mcp_work-efforts_update_ticket`
**When to Use:** During class implementation (see Section 4.2)

**Example:**
```javascript
mcp_work-efforts_update_ticket({
  ticket_path: "_work_efforts/WE-260104-wppd_.../tickets/TKT-wppd-001_*.md",
  status: "in_progress",
  files_changed: ["mcp-servers/dashboard-v3/tests/debugger/storage/ResultRepository.js"],
  notes: "Implemented PocketBase connection and session management"
})
```

**2.1.5.3 Update Work Effort**

**Method:** MCP tool call
**Tool:** `mcp_work-efforts_update_work_effort`
**When to Use:** When completing phases or adding progress notes

**Example:**
```javascript
mcp_work-efforts_update_work_effort({
  work_effort_path: "_work_efforts/WE-260104-wppd_...",
  status: "active", // or "completed" when done
  progress: "ResultRepository implemented, ComponentDiscovery in progress",
  commit: "abc1234"
})
```

**2.1.5.4 Search Work Efforts**

**Method:** MCP tool call
**Tool:** `mcp_work-efforts_search_work_efforts`
**Purpose:** Find related work efforts and tickets

**Example:**
```javascript
mcp_work-efforts_search_work_efforts({
  repo_path: "/Users/ctavolazzi/Code/active/_pyrite",
  query: "Oracle testing",
  include_tickets: true
})
```

### 2.2 MCP Servers

**2.2.1 MCP Server Registry**

| Server | Type | Location | Configuration | Cross-Reference |
|--------|------|----------|--------------|-----------------|
| work-efforts | Local | `/Users/ctavolazzi/Code/.mcp-servers/work-efforts/` | `~/.cursor/mcp.json` | Section 2.1 |
| docs-maintainer | Local | `/Users/ctavolazzi/Code/.mcp-servers/docs-maintainer/` | `~/.cursor/mcp.json` | Section 6 |
| dev-log | NPX | `@modelcontextprotocol/server-dev-log` | `~/.cursor/mcp.json` | Section 2.4 |
| memory | NPX | `@modelcontextprotocol/server-memory` | `~/.cursor/mcp.json` | Section 2.2.2 |
| sequential-thinking | NPX | `@modelcontextprotocol/server-sequential-thinking` | `~/.cursor/mcp.json` | Section 10.1 |

**2.2.2 MCP Server Tool Reference**

| Server | Primary Tool | Purpose | Storage Location | Cross-Reference |
|--------|-------------|---------|------------------|-----------------|
| work-efforts | `create_work_effort` | Track tasks and progress | `_work_efforts/WE-*/` | Section 2.1 |
| docs-maintainer | `create_doc` | Manage documentation | `_docs/` | Section 6 |
| dev-log | `write_to_dev_log` | Activity logging | `_work_efforts/devlog.md` | Section 2.4 |
| memory | `create_entities` | Knowledge persistence | `~/.cursor/memory.jsonl` | Section 9.3 |
| sequential-thinking | `sequentialthinking` | Complex problem breakdown | N/A (in-memory) | Section 10.1 |

**2.2.3 MCP Server Configuration**

**2.2.3.1 Configuration File Location**

**File:** `~/.cursor/mcp.json`
**Format:** JSON
**Purpose:** Defines all MCP server connections and settings

**2.2.3.2 Configuration Schema**

```json
{
  "mcpServers": {
    "work-efforts": {
      "command": "node",
      "args": ["/Users/ctavolazzi/Code/.mcp-servers/work-efforts/server.js"]
    },
    "docs-maintainer": {
      "command": "python",
      "args": ["/Users/ctavolazzi/Code/.mcp-servers/docs-maintainer/server.py"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": { "MEMORY_FILE_PATH": "/Users/ctavolazzi/.cursor/memory.jsonl" }
    }
  }
}
```

**2.2.4 Usage Patterns in TheOracle Development**

**2.2.4.1 Starting a New Class Implementation**

**Workflow:** Create ticket → Log start → Store knowledge
**Cross-Reference:** See Section 4.2 for full implementation process

**Example: Starting a new class implementation**
```javascript
// 1. Create ticket for the class
mcp_work-efforts_create_ticket({
  work_effort_path: "_work_efforts/WE-260104-wppd_...",
  title: "Implement ResultRepository class",
  description: "Create PocketBase integration for storing test results",
  acceptance_criteria: [
    "Can connect to PocketBase",
    "Can create/read/update sessions",
    "Can store test results",
    "Handles errors gracefully"
  ]
})

// 2. Log start of work
mcp_dev-log_write_to_dev_log({
  repo_path: "/Users/ctavolazzi/Code/active/_pyrite",
  text: "Starting ResultRepository implementation - PocketBase integration"
})

// 3. Store knowledge about PocketBase patterns
mcp_memory_create_entities({
  entities: [{
    name: "ResultRepository",
    entityType: "class",
    observations: [
      "Handles PocketBase connection and authentication",
      "Manages debug_sessions, component_tests, bug_reports collections",
      "Implements graceful degradation when PocketBase unavailable"
    ]
  }]
})
```

**Example: Completing a class**
```javascript
// 1. Update ticket status
mcp_work-efforts_update_ticket({
  ticket_path: "_work_efforts/WE-260104-wppd_.../tickets/TKT-wppd-001_*.md",
  status: "completed",
  files_changed: [
    "mcp-servers/dashboard-v3/tests/debugger/storage/ResultRepository.js",
    "mcp-servers/dashboard-v3/tests/debugger/storage/ResultRepository.test.js"
  ],
  notes: "Implemented full PocketBase integration with error handling",
  commit: "abc1234"
})

// 2. Log completion
mcp_dev-log_write_to_dev_log({
  repo_path: "/Users/ctavolazzi/Code/active/_pyrite",
  text: "✅ ResultRepository complete - Can create sessions, store results, handles errors"
})

// 3. Update documentation
mcp_docs-maintainer_update_doc({
  file_path: "_docs/20-29_development/theoracle/...",
  content: "ResultRepository implementation complete...",
  add_links: ["storage/ResultRepository.js"]
})
```

### 2.3 Development Tools

**2.3.1 Available Tools**
- `tools/obsidian-linter/` - Markdown validation and fixing
- `tools/github-health-check/` - GitHub integration verification
- `tools/structure-check/` - Repository structure validation
- `tools/work-effort-migrator/` - Migrate work efforts between formats
- `tools/id-generator/` - Generate work effort IDs

**2.3.2 Obsidian Linter**

**Command:** `python3 tools/obsidian-linter/lint.py`
**Cross-Reference:** See Table D for command reference

```bash
# Lint documentation
python3 tools/obsidian-linter/lint.py --scope _work_efforts --fix

# Check specific files
python3 tools/obsidian-linter/lint.py --scope mcp-servers/dashboard-v3/tests/debugger --fix

# Validate without fixing
python3 tools/obsidian-linter/lint.py --scope _work_efforts
```

**2.3.2.1 What It Checks**

| Check | Purpose |
|-------|---------|
| Markdown syntax errors | Validate markdown format |
| Broken internal links | Verify link integrity |
| Missing frontmatter | Ensure proper metadata |
| Invalid YAML | Validate YAML syntax |
| File naming conventions | Ensure naming compliance |

**2.3.3 GitHub Health Check**

**Command:** `python3 tools/github-health-check/check.py`
**Cross-Reference:** See Table D for command reference

```bash
# Check GitHub integration
python3 tools/github-health-check/check.py
```

**Output Includes:**
- Repository access
- Branch status
- Remote configuration
- Authentication status

**2.3.4 Structure Check**

**Command:** `python3 tools/structure-check/check.py --fix`
**Cross-Reference:** See Table D for command reference

```bash
# Validate repository structure
python3 tools/structure-check/check.py --fix
```

**Checks:**
- Required directories exist
- Work effort format compliance
- File naming conventions
- Directory structure

**2.3.5 Unified CLI**

**Command:** `./pyrite`
**Purpose:** Wrapper for all tools

```bash
# Use pyrite CLI wrapper
./pyrite lint --scope _work_efforts --fix
./pyrite health
./pyrite structure --fix
```

**2.3.6 When to Run**

| Trigger | Action | Section Reference |
|---------|--------|-------------------|
| Before committing docs | Run linter | Section 6.2 |
| After creating work efforts | Run structure check | Section 2.1 |
| After restructuring | Run all checks | Section 2.3 |
| CI/CD pipeline | Automated checks | Section 23 |

### 2.4 Devlog System

**2.4.1 Location and Purpose**

| Property | Value | Section Reference |
|----------|-------|-------------------|
| Location | `_work_efforts/devlog.md` | Table C |
| Purpose | Track progress, document decisions, record learnings | Section 2.4.2 |

**2.4.1.1 Primary Functions**

| Function | Purpose |
|----------|---------|
| Track daily progress | Record what was accomplished |
| Document decisions | Capture rationale |
| Record learnings | Persist knowledge |
| Maintain context | Continuity across sessions |
| Provide continuity | Between chat sessions |
| Record implementation details | Technical specifics |

**2.4.2 Structure**
```markdown
**Date:** YYYY-MM-DD

**Work Effort:** WE-260104-wppd
**Ticket:** TKT-wppd-001

**What Was Done:**
- Implemented ResultRepository class
- Added PocketBase connection logic
- Created session management methods

**What Was Built:**
1. ResultRepository.js - 200 lines
2. ResultRepository.test.js - 50 lines

**Test Results:**
- All 5 unit tests passing
- Integration test passing
- PocketBase connection verified

**Files Created/Modified:**
- storage/ResultRepository.js (NEW)
- storage/ResultRepository.test.js (NEW)
- TheOracle.js (UPDATED - imports ResultRepository)

**Status:** ✅ Ticket complete, moving to next
```

**2.4.3 MCP Operations**

**2.4.3.1 Add Entry**

**Tool:** `mcp_dev-log_write_to_dev_log`
**Cross-Reference:** See Section 9.3.2 for usage

```javascript
mcp_dev-log_write_to_dev_log({
  repo_path: "/Users/ctavolazzi/Code/active/_pyrite",
  text: "✅ ResultRepository implementation complete - All tests passing"
})
```

**2.4.3.2 Read Recent Entries**

**Tool:** `mcp_dev-log_tail_dev_log`
**Cross-Reference:** See Section 9.3.1 for usage

```javascript
mcp_dev-log_tail_dev_log({
  repo_path: "/Users/ctavolazzi/Code/active/_pyrite",
  lines: 50
})
```

**2.4.3.3 Search Devlog**

**Tool:** `mcp_dev-log_search_dev_log`
**Cross-Reference:** See Section 9.3.3 for usage

```javascript
mcp_dev-log_search_dev_log({
  repo_path: "/Users/ctavolazzi/Code/active/_pyrite",
  query: "ResultRepository"
})
```

**2.4.4 Manual Operations**

| Operation | Command | Section Reference |
|-----------|---------|-------------------|
| Read devlog | `cat _work_efforts/devlog.md` | Table D |
| Read last 50 lines | `tail -50 _work_efforts/devlog.md` | Table D |
| Search devlog | `grep -i "ResultRepository" _work_efforts/devlog.md` | Table D |
| Edit manually | `vim _work_efforts/devlog.md` | N/A |

**2.4.5 Best Practices**

| Practice | Purpose | Section Reference |
|----------|---------|-------------------|
| Update after milestones | Track progress | Section 4.2.6 |
| Include file paths and line counts | Detailed record | Section 17.1 |
| Document test results | Validation tracking | Section 7 |
| Note blockers or issues | Problem tracking | Section 15 |
| Record decisions and rationale | Context preservation | Section 10.2.3 |

---

## 3. empirica Integration

### 3.1 Repository Overview

**3.1.1 Definition**

empirica is a related repository (https://github.com/ctavolazzi/empirica) that contains:
- Testing patterns and methodologies
- Experimentation frameworks
- Research tools and utilities
- Statistical analysis tools
- Data collection patterns
- Hypothesis testing frameworks

**3.1.2 Repository Structure**

```
empirica/
├── experiments/          # Experimental testing patterns
├── patterns/             # Reusable testing patterns
├── tools/                # Research utilities
└── docs/                 # Methodology documentation
```

**3.1.3 Access Methods**

| Method | Command | Purpose | Cross-Reference |
|--------|---------|---------|-----------------|
| Clone | `git clone https://github.com/ctavolazzi/empirica.git` | Get local copy | Section 3.2.1 |
| Reference | Code comments | Document pattern usage | Section 3.2.2 |
| Import | `import { ... } from 'empirica/...'` | Use utilities | Section 3.2.3 |

### 3.2 Integration Patterns

**3.2.1 For Testing Patterns**

empirica provides:
- Testing methodologies for TheOracle agents
- Experimentation approaches for test design
- Proven testing patterns for component testing
- Statistical analysis for pattern recognition (see Section 7.3)
- Hypothesis testing for bug detection (see Section 11.2)

**3.2.2 For Research**

empirica supports:
- Pattern learning algorithms (see Section 4.2.7)
- Research methodologies for bug detection
- Experimentation frameworks for test design
- Data collection patterns for test results
- Statistical methods for performance analysis (see Section 22.2)

**3.2.3 For PatternLearner**

**Cross-Reference:** See Section 4.2.7 for PatternLearner implementation

empirica provides:
- Pattern recognition algorithms
- Statistical methods for anomaly detection
- Confidence scoring methodologies
- Hypothesis testing for regression detection

**3.2.4 Integration Points**

| Integration Area | How Used | Section Reference |
|------------------|----------|-------------------|
| PatternLearner | Reference empirica patterns | Section 4.2.7 |
| Testing Methodologies | Share patterns across projects | Section 7 |
| Research Findings | Inform TheOracle development | Section 10.2 |
| Statistical Analysis | Enhance bug detection | Section 11.2 |
| Experimentation Frameworks | Guide test design | Section 7.2 |

**3.2.5 Code Example**

**File:** `learning/PatternLearner.js`
**Purpose:** Demonstrate empirica integration
**Cross-Reference:** See Section 20.2 for extending PatternLearner

```javascript
// PatternLearner might use empirica's statistical methods
import { statisticalAnalysis } from 'empirica/patterns/statistics';

class PatternLearner {
  async analyze(testResults) {
    // Use empirica's statistical analysis
    const patterns = await statisticalAnalysis.identifyPatterns(testResults, {
      minOccurrences: 3,
      confidenceThreshold: 0.7
    });

    // Apply empirica's anomaly detection
    const anomalies = await statisticalAnalysis.detectAnomalies(testResults);

    return { patterns, anomalies };
  }
}
```

---

## 4. Development Workflow

### 4.1 Phase-Based Development Structure

**4.1.1 Phase 1: Foundation**

**Status:** ✅ Complete
**Completion:** 100%
**Cross-Reference:** See Table F for phase status

| Deliverable | Status | Location |
|-------------|--------|----------|
| Architecture documentation | ✅ Complete | `ARCHITECTURE.md` |
| Base TheOracle.js class | ✅ Complete | `TheOracle.js` |
| Configuration system | ✅ Complete | `oracle.config.example.js` |
| Dependencies installed | ✅ Complete | `package.json` |

**4.1.2 Phase 2: Core Infrastructure**

**Status:** ❌ Not Started
**Completion:** 0%
**Priority:** Current focus
**Cross-Reference:** See Table E for dependency chain

| Deliverable | Priority | Dependencies | Section Reference |
|-------------|----------|--------------|-------------------|
| ResultRepository | 1 | None | Section 4.2.1 |
| ComponentDiscovery | 2 | None | Section 4.2.2 |
| TestQueue | 3 | None | Section 4.2.3 |
| CSSAnalyzer | 4 | None | Section 4.2.4 |

**4.1.3 Phase 3: Agents**

**Status:** ❌ Not Started
**Completion:** 0%
**Prerequisite:** Phase 2 complete

| Agent | Purpose | Framework | Section Reference |
|-------|---------|-----------|-------------------|
| ComponentAgent | Component existence/structure | Playwright | Section 4.2.5 |
| LayoutAgent | Layout and positioning | Playwright | Section 4.2.6 |
| StyleAgent | CSS and styling | Playwright | Section 4.2.6 |
| InteractionAgent | User interactions | Testing Library | Section 4.2.6 |
| AccessibilityAgent | A11y compliance | axe-core | Section 4.2.6 |
| PerformanceAgent | Performance metrics | Playwright | Section 4.2.6 |

**4.1.4 Phase 4: Advanced Features**

**Status:** ❌ Not Started
**Completion:** 0%
**Prerequisite:** Phase 3 complete

| Feature | Purpose | Section Reference |
|---------|---------|-------------------|
| PatternLearner | Pattern recognition | Section 4.2.7 |
| Visual regression | Screenshot comparison | Section 20.3 |
| Anomaly detection | Statistical analysis | Section 22.2 |

**4.1.5 Phase 5: Reporting**

**Status:** ❌ Not Started
**Completion:** 0%
**Prerequisite:** Phase 4 complete

| Deliverable | Format | Section Reference |
|-------------|--------|-------------------|
| Report generation | HTML, JSON, JUnit | Section 19.3 |
| Bug tracking | PocketBase integration | Section 5.1 |
| Dashboard integration | Real-time display | Section 18.3 |

### 4.2 Implementation Process

**4.2.1 Standard Implementation Workflow**

**For Each Class:** Follow this 6-step process

| Step | Action | Tool/Method | Section Reference |
|------|--------|-------------|-------------------|
| 1 | NovaSystem Analysis | Predict-Break-Fix loop | Section 1.2.2 |
| 2 | Create Ticket | MCP work-efforts | Section 2.1.5.1 |
| 3 | Implementation | Code following style guide | Section 4.3 |
| 4 | Testing | Unit + integration tests | Section 7 |
| 5 | Documentation | Update docs and devlog | Section 6, Section 2.4 |
| 6 | Complete Ticket | Update status and progress | Section 2.1.5.2 |

**4.2.2 Step 1: NovaSystem Analysis**

**Process:**
1. **Predict:** Design class structure, interfaces, methods
2. **Break:** Identify failure points (see Section 15.1 for common issues)
3. **Fix:** Implement with error handling (see Section 4.4)
4. **Repeat:** Until high confidence (99%)

**Cross-Reference:** See Section 1.2.2 for detailed methodology

**4.2.3 Step 2: Create Ticket**

**Method:** MCP tool call
**Tool:** `mcp_work-efforts_create_ticket`
**Work Effort:** WE-260104-wppd (see Section 2.1.3)

**Required Information:**
- Title: Class name and purpose
- Description: What the class does
- Acceptance criteria: Success conditions (see Section 11)

**4.2.4 Step 3: Implementation**

**Requirements:**
- Follow dependency order (see Table E)
- Write code following style guide (see Section 4.3)
- Add error handling (see Section 4.4)
- Add logging (see Section 2.4)

**4.2.5 Step 4: Testing**

**Test Types:**
- Unit tests: Test class independently (see Section 7.1)
- Integration tests: Test with TheOracle (see Section 7.2)
- PocketBase verification: If applicable (see Section 5.1.6)

**4.2.6 Step 5: Documentation**

**Update:**
- Class documentation (JSDoc comments)
- SBU.md if usage changes (see Section 6.1)
- Devlog with progress (see Section 2.4)

**4.2.7 Step 6: Complete Ticket**

**Actions:**
- Mark ticket status: completed
- Update work effort progress (see Section 2.1.5.3)
- Move to next class in dependency chain (see Table E)

### 4.3 Code Style Guidelines

**4.3.1 Core Principles**

| Principle | Rule | Rationale | Cross-Reference |
|-----------|------|-----------|-----------------|
| Direct and minimal | No unnecessary abstractions | Reduce complexity | Section 4.2.4 |
| Inline logic | Until 3+ uses | Avoid premature abstraction | Section 4.2.4 |
| Single file | Until 500+ lines | Maintain readability | Section 4.2.4 |
| Exception handling | Let exceptions bubble up | Clear error propagation | Section 4.4 |

**4.3.2 JavaScript Style Example**

**File:** `storage/ResultRepository.js`
**Purpose:** Demonstrate direct, minimal style

```javascript
// Good: Direct and minimal
export class ResultRepository {
  constructor(oracle) {
    this.oracle = oracle;
    this.pb = oracle.getPocketBase();
  }

  async createSession(data) {
    try {
      return await this.pb.collection('debug_sessions').create(data);
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }
}
```

**4.3.3 Style Enforcement**

**Tools:**
- ESLint (if configured)
- Code review process
- Self-validation against principles

**Cross-Reference:** See Section 4.2.4 for implementation requirements

### 4.4 Error Handling Strategy

**4.4.1 Error Handling Principles**

| Principle | Implementation | Example | Section Reference |
|-----------|----------------|---------|-------------------|
| Graceful degradation | Continue without optional services | PocketBase unavailable | Section 5.1.8 |
| Comprehensive logging | Log all errors with context | Console.error with details | Section 2.4 |
| Fallback mechanisms | Provide defaults where possible | Continue without storage | Section 4.4.2 |
| Clear error messages | User-friendly error descriptions | Descriptive error text | Section 15.1 |

**4.4.2 Error Handling Example**

**Scenario:** PocketBase connection failure
**File:** `TheOracle.js`
**Method:** `initialize()`

```javascript
async initialize() {
  try {
    await this.pb.admins.authWithPassword(email, password);
  } catch (error) {
    console.error('PocketBase connection failed:', error);
    // Graceful degradation: continue without PocketBase
    this.pb = null;
    console.warn('Continuing without PocketBase storage');
  }
}
```

**4.4.3 Error Types and Handling**

| Error Type | Handling Strategy | Section Reference |
|------------|-------------------|-------------------|
| Import errors | Comment out temporarily or implement | Section 15.1.1 |
| PocketBase connection | Graceful degradation | Section 4.4.2 |
| Runtime errors | Try-catch with logging | Section 4.4.1 |
| Test failures | Log and continue | Section 7.1.3 |
| Timeout errors | Increase timeout or retry | Section 15.1.5 |

**Cross-Reference:** See Section 15 for troubleshooting specific errors

---

## 5. Tool Integration

### 5.1 PocketBase

**5.1.1 Definition and Capabilities**

| Capability | Description | Use Case |
|------------|-------------|----------|
| Backend-as-a-Service | Self-hosted BaaS | Test result storage |
| SQLite Database | Embedded database | Local data persistence |
| REST API | HTTP-based API | Programmatic access |
| Admin UI | Web-based interface | Data management |
| Real-time Subscriptions | WebSocket updates | Live data sync |
| File Storage | Binary file handling | Screenshot storage |
| Authentication | User/admin auth | Secure access |

**5.1.2 Setup and Installation**

**Platform:** macOS (darwin_amd64)
**Version:** v0.20.0
**Cross-Reference:** See Table B for installation commands

**5.1.2.1 Download and Install**

```bash
# Download from https://pocketbase.io/docs/
# For macOS:
wget https://github.com/pocketbase/pocketbase/releases/download/v0.20.0/pocketbase_darwin_amd64.zip
unzip pocketbase_darwin_amd64.zip
chmod +x pocketbase
```

**5.1.2.2 Start Server**

```bash
./pocketbase serve
# Runs at http://127.0.0.1:8090
# Admin UI: http://127.0.0.1:8090/_/
```

**5.1.3 Initial Setup Procedure**

| Step | Action | Location | Cross-Reference |
|------|--------|----------|-----------------|
| 1 | Create admin user | First run via web UI | Section 19.1.2 |
| 2 | Create collections | Admin UI or API | Section 5.1.4 |
| 3 | Set collection rules | Admin UI → Collections → Rules | Section 21.1.2 |
| 4 | Configure indexes | Admin UI → Collections → Indexes | Section 22.1.3 |

**5.1.4 Required Collections**

| Collection | Purpose | Schema Reference | Section Reference |
|------------|---------|------------------|-------------------|
| `debug_sessions` | Session metadata | Section 5.1.5.1 | Section 4.2.1 |
| `component_tests` | Test results | Section 5.1.5.2 | Section 7.1 |
| `css_analysis` | CSS property data | Section 5.1.5.3 | Section 4.2.4 |
| `dom_snapshots` | DOM structure | N/A | Section 4.2.2 |
| `event_traces` | Event flow data | N/A | Section 4.2.6 |
| `performance_metrics` | Performance data | N/A | Section 22 |
| `bug_reports` | Discovered bugs | Section 5.1.5.4 | Section 11.2 |
| `learned_patterns` | ML pattern data | Section 5.1.5.5 | Section 4.2.7 |
| `test_artifacts` | Screenshots, logs, reports | N/A | Section 19.3 |

**5.1.5 Collection Schema Definitions**

**5.1.5.1 debug_sessions Schema**

**Cross-Reference:** See Section 2.2.4.1 for usage example

**Collection Schema Example:**
```javascript
// debug_sessions collection
{
  id: "string (auto)",
  name: "text",
  started: "date",
  ended: "date (nullable)",
  status: "select (running|completed|failed)",
  targetUrl: "url",
  components_tested: "number",
  bugs_found: "number",
  config: "json",
  created: "date (auto)",
  updated: "date (auto)"
}
```

**Usage in TheOracle:**
**5.1.6.1 Connection Example**

```javascript
// Connect to PocketBase
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

// Authenticate as admin
await pb.admins.authWithPassword(email, password);
```

**5.1.6.2 CRUD Operations**

| Operation | Method | Example | Section Reference |
|-----------|--------|---------|-------------------|
| Create | `collection().create()` | Create session | Section 4.2.1 |
| Read | `collection().getList()` | List sessions | Section 19.3 |
| Update | `collection().update()` | Update session status | Section 4.2.6 |
| Delete | `collection().delete()` | Remove session | N/A |

**5.1.6.3 Code Examples**

**Create Record:**
```javascript
const session = await pb.collection('debug_sessions').create({
  name: 'Test Session',
  status: 'running',
  targetUrl: 'http://localhost:3848'
});
```

**Read Records:**
```javascript
const sessions = await pb.collection('debug_sessions').getList(1, 50);
```

**Update Record:**
```javascript
await pb.collection('debug_sessions').update(session.id, {
  status: 'completed',
  ended: new Date()
});
```

**5.1.7 Admin UI**

**Access:** http://127.0.0.1:8090/_/
**Cross-Reference:** See Section 19.3 for viewing results

| Feature | Purpose | Section Reference |
|---------|---------|-------------------|
| Create/edit collections | Schema management | Section 5.1.4 |
| View records | Data inspection | Section 19.3 |
| Manage users | Authentication | Section 21.1.1 |
| Configure settings | System configuration | Section 5.1.3 |
| View logs | Debugging | Section 15.2.1 |

**5.1.8 Data Storage**

| Item | Location | Purpose | Cross-Reference |
|------|----------|---------|-----------------|
| Database | `./pb_data/data.db` | SQLite database | Section 5.1.1 |
| Files | `./pb_data/storage/` | Uploaded files | Section 19.3 |
| Logs | Console output | Runtime logs | Section 15.2.1 |

**5.1.9 Backup Procedures**

**5.1.9.1 Database Backup**

```bash
# Backup database
cp ./pb_data/data.db ./backups/data_$(date +%Y%m%d).db
```

**5.1.9.2 Full Backup**

```bash
# Backup entire data directory
tar -czf pocketbase_backup_$(date +%Y%m%d).tar.gz ./pb_data/
```

**5.1.10 Troubleshooting**

| Issue | Solution | Section Reference |
|-------|----------|-------------------|
| Connection refused | Check if server is running | Section 5.1.2.2 |
| Authentication failed | Verify admin credentials | Section 5.1.3 |
| Collection not found | Create collection via admin UI | Section 5.1.4 |
| Permission denied | Check collection rules | Section 21.1.2 |

**Cross-Reference:** See Section 15.1.2 for PocketBase connection errors

### 5.2 Playwright

**5.2.1 Installation**

**Command:** `npm install --save-dev @playwright/test`
**Browser Setup:** `npx playwright install`
**Cross-Reference:** See Table B for installation commands

**5.2.2 Capabilities**

| Capability | Purpose | Section Reference |
|------------|---------|-------------------|
| Browser automation | Navigate and interact | Section 4.2.2 |
| Screenshot capture | Visual regression | Section 20.3 |
| Performance metrics | Performance testing | Section 22.2 |
| Network interception | Request monitoring | Section 4.2.6 |

**5.2.3 Usage Context**

**Primary Use:** Component testing and browser automation
**Integration:** Used by all agents (see Section 4.1.3)
**Configuration:** See `oracle.config.example.js`

### 5.3 Testing Library

**5.3.1 Installation**

**Command:** `npm install --save-dev @testing-library/dom`
**Cross-Reference:** See Table B for installation commands

**5.3.2 Capabilities**

| Capability | Purpose | Section Reference |
|------------|---------|-------------------|
| Component querying | Find DOM elements | Section 4.2.2 |
| User interaction simulation | Click, type, etc. | Section 4.2.6 |
| Accessibility testing | A11y validation | Section 5.4 |

**5.3.3 Usage Context**

**Primary Use:** DOM manipulation and interaction testing
**Integration:** Used by InteractionAgent (see Section 4.1.3)

### 5.4 axe-core

**5.4.1 Installation**

**Command:** `npm install --save-dev axe-core`
**Cross-Reference:** See Table B for installation commands

**5.4.2 Capabilities**

| Capability | Purpose | Section Reference |
|------------|---------|-------------------|
| WCAG compliance testing | Accessibility standards | Section 11.2 |
| Accessibility auditing | A11y violations | Section 4.1.3 |
| ARIA validation | ARIA attribute checking | Section 4.2.6 |

**5.4.3 Usage Context**

**Primary Use:** Accessibility testing
**Integration:** Used by AccessibilityAgent (see Section 4.1.3)
**Standards:** WCAG 2.1 Level AA compliance

---

## 6. Documentation Strategy

### 6.1 Documentation Files

**6.1.1 Core Documentation**

| File | Purpose | Location | Section Reference |
|------|---------|----------|-------------------|
| `README.md` | Main documentation | `tests/debugger/` | Section 12.1.1 |
| `ARCHITECTURE.md` | System architecture | `tests/debugger/` | Section 12.1.1 |
| `SBU.md` | Safety and Basic Use | `tests/debugger/` | Section 19.1 |
| `DEVELOPMENT_PROCESS.md` | This file | `tests/debugger/` | N/A |

**6.1.2 Analysis Documentation**

| File | Purpose | Section Reference |
|------|---------|-------------------|
| `PRODUCTION_STATE_ANALYSIS.md` | NovaSystem analysis | Section 1.1.3 |
| `NOVASYSTEM_BREAKDOWN.md` | Complete breakdown | Section 1.1.3 |
| `NOVASYSTEM_CONTINUATION_PROMPT.md` | Continuation prompt | Section 9.1 |

**6.1.3 Planning Documentation**

| File | Purpose | Section Reference |
|------|---------|-------------------|
| `IMPLEMENTATION_PLAN.md` | 5-phase roadmap | Section 4.1 |
| `MISSING_ITEMS_CHECKLIST.md` | Missing items tracking | Section 4.1.2 |
| `COMPLETE_CHECKLIST.md` | Completion status | Section 11.1 |

### 6.2 Documentation Updates

**6.2.1 When to Update**

| Trigger | Action Required | Section Reference |
|---------|----------------|-------------------|
| New class implemented | Update class docs, SBU if needed | Section 4.2.6 |
| Architecture changed | Update ARCHITECTURE.md | Section 4.1 |
| New patterns discovered | Update pattern docs | Section 3.2 |
| Critical bugs fixed | Update SBU, troubleshooting | Section 15 |

**6.2.2 How to Update**

| Method | Tool | Command | Section Reference |
|--------|------|---------|-------------------|
| MCP Server | `docs-maintainer` | `mcp_docs-maintainer_update_doc` | Section 2.2.1 |
| Manual Edit | Text editor | Edit markdown files | N/A |
| Validation | obsidian-linter | `python3 tools/obsidian-linter/lint.py` | Section 2.3.2 |

---

## 7. Testing Strategy

### 7.1 Unit Testing

**7.1.1 Test Requirements**

**For Each Class:** Test the following

| Requirement | Purpose | Section Reference |
|-------------|---------|-------------------|
| Initialization | Constructor and setup | Section 4.2.3 |
| Core methods | Primary functionality | Section 4.2.4 |
| Error handling | Failure scenarios | Section 4.4 |
| Edge cases | Boundary conditions | Section 4.2.4 |

**7.1.2 Test Example**

**File:** `tests/debugger/storage/ResultRepository.test.js`
**Purpose:** Demonstrate unit testing pattern
**Cross-Reference:** See Section 4.2.5 for testing workflow

```javascript
// tests/debugger/storage/ResultRepository.test.js
import { ResultRepository } from './ResultRepository.js';
import { TheOracle } from '../TheOracle.js';

test('creates session', async () => {
  const oracle = new TheOracle(config);
  await oracle.initialize();
  const repo = new ResultRepository(oracle);
  const session = await repo.createSession({ name: 'Test' });
  expect(session).toBeDefined();
});
```

**7.1.3 Test Execution**

**Command:** `npm test`
**Location:** `mcp-servers/dashboard-v3/`
**Coverage:** Aim for 80%+ code coverage

### 7.2 Integration Testing

**7.2.1 Integration Points**

| Integration | Components | Purpose | Section Reference |
|-------------|------------|---------|-------------------|
| TheOracle → ResultRepository | Main → Storage | Data persistence | Section 4.2.1 |
| TheOracle → ComponentDiscovery | Main → Discovery | Component finding | Section 4.2.2 |
| TheOracle → Agents | Main → Agents | Test execution | Section 4.2.6 |
| PocketBase → File system | Database → Files | Artifact storage | Section 5.1.8 |

**7.2.2 Test Strategy**

**Approach:** Test each integration point independently
**Tools:** Jest, Playwright
**Location:** `tests/debugger/integration/`

### 7.3 End-to-End Testing

**7.3.1 Full Flow Test**

**File:** `tests/debugger/e2e/full-run.test.js`
**Purpose:** Test complete TheOracle execution
**Cross-Reference:** See Section 17 for real-world workflow example

```javascript
// tests/debugger/e2e/full-run.test.js
test('full oracle run', async () => {
  const oracle = new TheOracle(config);
  await oracle.initialize();
  const results = await oracle.run();
  expect(results.components.length).toBeGreaterThan(0);
  expect(results.testResults.length).toBeGreaterThan(0);
});
```

**7.3.2 E2E Test Requirements**

| Requirement | Validation | Section Reference |
|-------------|-----------|-------------------|
| Component discovery | Components found | Section 4.2.2 |
| Test execution | Tests run successfully | Section 4.2.6 |
| Result storage | Results saved to PocketBase | Section 5.1.6 |
| Report generation | Reports created | Section 19.3 |

---

## 8. Git Workflow

### 8.1 Branch Strategy

**8.1.1 Branch Naming Convention**

| Format | Example | Purpose |
|--------|---------|---------|
| `feature/WE-YYMMDD-xxxx-slug` | `feature/WE-260104-wppd-result-repository` | Feature branches |
| `fix/WE-YYMMDD-xxxx-slug` | `fix/WE-260104-wppd-bug-fix` | Bug fix branches |
| `main` | `main` | Production branch |
| `develop` | `develop` | Development branch |

**8.1.2 Branch Lifecycle**

```
feature/WE-* → develop → main
```

**Cross-Reference:** See Section 4.2.7 for completion workflow

### 8.2 Commit Message Format

**8.2.1 Commit Message Structure**

| Component | Format | Example |
|-----------|--------|---------|
| Work Effort | `WE-YYMMDD-xxxx` | `WE-260104-wppd` |
| Ticket | `TKT-xxxx-NNN` | `TKT-wppd-001` |
| Description | Brief summary | `Implement ResultRepository class` |

**8.2.2 Full Format**

```
WE-YYMMDD-xxxx/TKT-xxxx-NNN: Description
```

**Example:**
```
WE-260104-wppd/TKT-wppd-001: Implement ResultRepository class
```

**8.2.3 Commit Best Practices**

| Practice | Rule | Section Reference |
|----------|------|-------------------|
| Atomic commits | One logical change per commit | Section 4.2.7 |
| Reference tickets | Always include ticket ID | Section 2.1.5.2 |
| Clear descriptions | What and why | Section 4.2.4 |

### 8.3 Git Integration Patterns

**8.3.1 File Storage Strategy**

| Item | Storage Location | Git Tracked | Purpose |
|------|------------------|------------|---------|
| Test results | `component-results/` | Yes | Version-controlled artifacts |
| PocketBase metadata | PocketBase database | No | Runtime data |
| Test sessions | PocketBase + files | Partial | Atomic session tracking |
| Screenshots | `component-results/screenshots/` | Yes | Visual regression |

**8.3.2 NovaSystem Pattern**

| Pattern | Implementation | Benefit |
|---------|----------------|---------|
| Atomic sessions | Each test run creates separate session | Clear history |
| FIFO queue | Sequential test execution | Prevents Git lock contention |
| File-based results | Git-tracked result files | Version control integration |

**Cross-Reference:** See Section 4.2.3 for TestQueue implementation

---

## 9. Continuation Across Sessions

### 9.1 Using NovaSystem Continuation

**9.1.1 Process**

| Step | Action | Location | Section Reference |
|------|--------|----------|-------------------|
| 1 | Open continuation prompt | `NOVASYSTEM_CONTINUATION_PROMPT.md` | Section 1.1.3 |
| 2 | Copy entire prompt | File contents | N/A |
| 3 | Paste into new chat | ChatGPT/Claude/GPT-4 | N/A |
| 4 | AI continues work | From last state | Section 1.2.2 |

**9.1.2 Prompt Contents**

| Component | Purpose | Section Reference |
|-----------|---------|-------------------|
| Complete context | Full project understanding | Section 1.1 |
| Current state | Where we are now | Section 4.1.2 |
| Dependency chain | Implementation order | Table E |
| Technical specs | Architecture details | Section 4.1 |
| Team roles | Expert responsibilities | Section 1.3 |
| Current goals | Next steps | Section 4.1.2 |

**Cross-Reference:** See Section 1.1.3 for document location

### 9.2 Using _pyrite Work Efforts

**9.2.1 Check Work Effort Status**

**Method 1: Read Files**
```bash
# Read work effort index
cat _work_efforts/WE-260104-wppd/WE-260104-wppd_index.md

# Check ticket status
cat _work_efforts/WE-260104-wppd/tickets/TKT-wppd-001_*.md
```

**Method 2: MCP Server**
```javascript
mcp_work-efforts_list_work_efforts({
  repo_path: "/Users/ctavolazzi/Code/active/_pyrite",
  status: "active"
})
```

**9.2.2 Update Progress**

| Method | Tool | Section Reference |
|--------|------|-------------------|
| MCP Server | `mcp_work-efforts_update_ticket` | Section 2.1.5.2 |
| Manual Edit | Text editor | Section 2.1.4 |
| Devlog Update | `mcp_dev-log_write_to_dev_log` | Section 2.4 |

**Cross-Reference:** See Section 2.1 for work effort details

### 9.3 Using Devlog

**9.3.1 Read Recent Context**

**Command:**
```bash
# Last 50 lines
tail -50 _work_efforts/devlog.md
```

**MCP Method:**
```javascript
mcp_dev-log_tail_dev_log({
  repo_path: "/Users/ctavolazzi/Code/active/_pyrite",
  lines: 50
})
```

**9.3.2 Add Entry**

| Method | Tool | Section Reference |
|--------|------|-------------------|
| MCP Server | `mcp_dev-log_write_to_dev_log` | Section 2.4.2 |
| Manual | Text editor append | Section 2.4.3 |

**9.3.3 Search Devlog**

**Command:**
```bash
grep -i "ResultRepository" _work_efforts/devlog.md
```

**MCP Method:**
```javascript
mcp_dev-log_search_dev_log({
  repo_path: "/Users/ctavolazzi/Code/active/_pyrite",
  query: "ResultRepository"
})
```

**Cross-Reference:** See Section 2.4 for devlog structure and best practices

---

## 10. Problem-Solving Process

### 10.1 When Stuck

**10.1.1 Step 1: Use NovaSystem**

**Process:** Apply "Predict-Break-Fix" loop

| Step | Action | Section Reference |
|------|--------|-------------------|
| Predict | Identify the problem clearly | Section 1.2.2 |
| Break | Break it down into components | Section 1.2.2 |
| Fix | Fix systematically | Section 1.2.2 |
| Repeat | Until high confidence | Section 1.2.2 |

**10.1.2 Step 2: Check Documentation**

| Document | Purpose | Section Reference |
|----------|---------|-------------------|
| ARCHITECTURE.md | System design | Section 12.1 |
| IMPLEMENTATION_PLAN.md | Roadmap | Section 4.1 |
| Related work efforts | Past solutions | Section 2.1 |

**10.1.3 Step 3: Use MCP Tools**

| Tool | Purpose | Section Reference |
|------|---------|-------------------|
| `sequential-thinking` | Complex problem breakdown | Section 2.2.1 |
| `memory` | Recall past solutions | Section 9.3 |
| `work-efforts` | Track blockers | Section 2.1 |

**10.1.4 Step 4: Reference empirica**

| Resource | Purpose | Section Reference |
|----------|---------|-------------------|
| Similar patterns | Find solutions | Section 3.2 |
| Testing methodologies | Learn approaches | Section 7 |
| Experiments | Research findings | Section 3.2 |

### 10.2 When Implementing

**10.2.1 Follow Dependency Order**

**Order:** See Table E for complete dependency chain

| Priority | Class | Dependencies | Section Reference |
|----------|-------|-------------|-------------------|
| 1 | ResultRepository | None | Section 4.2.1 |
| 2 | ComponentDiscovery | None | Section 4.2.2 |
| 3 | TestQueue | None | Section 4.2.3 |
| 4 | CSSAnalyzer | None | Section 4.2.4 |
| 5 | Agents | ResultRepository, ComponentDiscovery | Section 4.2.6 |
| 6 | PatternLearner | ResultRepository, test results | Section 4.2.7 |

**10.2.2 Test As You Go**

| Test Type | When | Section Reference |
|-----------|------|-------------------|
| Unit tests | After each class | Section 7.1 |
| Integration tests | After integration points | Section 7.2 |
| PocketBase verification | After storage operations | Section 5.1.6 |

**10.2.3 Document Decisions**

| Action | Location | Section Reference |
|--------|----------|-------------------|
| Update devlog | `_work_efforts/devlog.md` | Section 2.4 |
| Update work effort | `_work_efforts/WE-*/` | Section 2.1 |
| Update documentation | `tests/debugger/` | Section 6 |

---

## 11. Success Metrics

### 11.1 Phase 2 Success Criteria

**11.1.1 ResultRepository**

| Criterion | Status | Validation Method | Section Reference |
|----------|--------|-------------------|-------------------|
| Can connect to PocketBase | ❌ | Unit test | Section 7.1 |
| Can create/read/update sessions | ❌ | Integration test | Section 7.2 |
| Can store test results | ❌ | E2E test | Section 7.3 |
| Handles errors gracefully | ❌ | Error test | Section 4.4 |

**11.1.2 ComponentDiscovery**

| Criterion | Status | Validation Method | Section Reference |
|----------|--------|-------------------|-------------------|
| Can traverse DOM | ❌ | Unit test | Section 7.1 |
| Can identify components | ❌ | Integration test | Section 7.2 |
| Can build component tree | ❌ | E2E test | Section 7.3 |
| Handles dynamic components | ❌ | Edge case test | Section 7.1 |

**11.1.3 TestQueue**

| Criterion | Status | Validation Method | Section Reference |
|----------|--------|-------------------|-------------------|
| Implements FIFO pattern | ❌ | Unit test | Section 7.1 |
| Manages job queue | ❌ | Integration test | Section 7.2 |
| Executes sequentially | ❌ | Concurrency test | Section 7.1 |
| Handles errors | ❌ | Error test | Section 4.4 |

**11.1.4 CSSAnalyzer**

| Criterion | Status | Validation Method | Section Reference |
|----------|--------|-------------------|-------------------|
| Extracts CSS properties | ❌ | Unit test | Section 7.1 |
| Calculates specificity | ❌ | Unit test | Section 7.1 |
| Detects conflicts | ❌ | Integration test | Section 7.2 |
| Analyzes computed styles | ❌ | E2E test | Section 7.3 |

**11.1.5 Agents**

| Criterion | Status | Validation Method | Section Reference |
|----------|--------|-------------------|-------------------|
| Each agent can run tests | ❌ | Unit test per agent | Section 7.1 |
| Tests integrate with Playwright | ❌ | Integration test | Section 7.2 |
| Results stored in PocketBase | ❌ | E2E test | Section 7.3 |
| Errors handled gracefully | ❌ | Error test | Section 4.4 |

**11.1.6 PatternLearner**

| Criterion | Status | Validation Method | Section Reference |
|----------|--------|-------------------|-------------------|
| Recognizes patterns | ❌ | Unit test | Section 7.1 |
| Detects anomalies | ❌ | Integration test | Section 7.2 |
| Stores patterns in PocketBase | ❌ | E2E test | Section 7.3 |
| Calculates confidence scores | ❌ | Unit test | Section 7.1 |

**11.1.7 Overall Phase 2 Status**

**Completion:** 0% (0/24 criteria met)
**Next Action:** Implement ResultRepository (see Table E, Priority 1)
**Cross-Reference:** See Section 4.1.2 for phase details

### 11.2 Bug Detection Metrics

| Metric | Target | Measurement | Section Reference |
|--------|--------|-------------|-------------------|
| False positive rate | < 5% | Manual review | Section 11.2.1 |
| Detection accuracy | > 90% | Validation tests | Section 7.3 |
| Pattern confidence | > 0.7 | Statistical analysis | Section 3.2.3 |
| Regression detection | 100% | Historical comparison | Section 4.2.7 |

**11.2.1 Validation Process**

| Step | Action | Section Reference |
|------|--------|-------------------|
| 1 | Run TheOracle | Section 19.2 |
| 2 | Review bug reports | Section 19.3 |
| 3 | Validate findings | Manual review |
| 4 | Calculate metrics | Statistical analysis |

---

## 12. Resources

### 12.1 Internal Resources

**12.1.1 Documentation Files**

| File | Purpose | Location | Section Reference |
|------|---------|----------|-------------------|
| `README.md` | Main documentation | `tests/debugger/` | Section 6.1.1 |
| `ARCHITECTURE.md` | System architecture | `tests/debugger/` | Section 6.1.1 |
| `SBU.md` | Safety guide | `tests/debugger/` | Section 6.1.1 |
| `DEVELOPMENT_PROCESS.md` | This file | `tests/debugger/` | N/A |

**12.1.2 Analysis Documents**

| File | Purpose | Section Reference |
|------|---------|-------------------|
| `PRODUCTION_STATE_ANALYSIS.md` | NovaSystem analysis | Section 1.1.3 |
| `NOVASYSTEM_BREAKDOWN.md` | Complete breakdown | Section 1.1.3 |
| `NOVASYSTEM_CONTINUATION_PROMPT.md` | Continuation prompt | Section 9.1 |

**12.1.3 Planning Documents**

| File | Purpose | Section Reference |
|------|---------|-------------------|
| `IMPLEMENTATION_PLAN.md` | 5-phase roadmap | Section 4.1 |
| `MISSING_ITEMS_CHECKLIST.md` | Missing items tracking | Section 4.1.2 |
| `COMPLETE_CHECKLIST.md` | Completion status | Section 11.1 |

### 12.2 External Resources

**12.2.1 Repositories**

| Repository | Location | Purpose | Section Reference |
|------------|----------|---------|-------------------|
| _pyrite | `/Users/ctavolazzi/Code/active/_pyrite` | Main project | Section 2 |
| empirica | https://github.com/ctavolazzi/empirica | Testing patterns | Section 3 |

**12.2.2 Tools**

| Tool | URL | Purpose | Section Reference |
|------|-----|---------|-------------------|
| PocketBase | https://pocketbase.io/docs/ | Data storage | Section 5.1 |
| Playwright | https://playwright.dev/ | Browser automation | Section 5.2 |
| Testing Library | https://testing-library.com/ | DOM testing | Section 5.3 |
| axe-core | https://github.com/dequelabs/axe-core | Accessibility | Section 5.4 |

**12.2.3 MCP Servers**

| Server | Location | Purpose | Section Reference |
|--------|----------|---------|-------------------|
| work-efforts | `mcp-servers/work-efforts/` | Task tracking | Section 2.2.1 |
| docs-maintainer | `mcp-servers/docs-maintainer/` | Documentation | Section 2.2.1 |
| dev-log | (via MCP) | Activity logging | Section 2.2.1 |

---

## 13. Quick Reference

### 13.1 Starting Development Session

**13.1.1 Step 1: Check Current State**

**Commands:**
```bash
# Read devlog
tail -50 _work_efforts/devlog.md

# Check work effort
cat _work_efforts/WE-260104-wppd/WE-260104-wppd_index.md
```

**MCP Method:**
```javascript
mcp_dev-log_tail_dev_log({ repo_path: "...", lines: 50 });
mcp_work-efforts_list_work_efforts({ repo_path: "...", status: "active" });
```

**13.1.2 Step 2: Use Continuation Prompt**

| Action | Location | Section Reference |
|--------|----------|-------------------|
| Open prompt | `NOVASYSTEM_CONTINUATION_PROMPT.md` | Section 9.1 |
| Copy prompt | File contents | Section 9.1.2 |
| Paste to new chat | ChatGPT/Claude/GPT-4 | Section 9.1.1 |
| Continue development | From last state | Section 4.2 |

**13.1.3 Step 3: Begin Implementation**

| Action | Reference | Section |
|--------|-----------|---------|
| Follow dependency order | Table E | Section 4.2 |
| Test as you go | Testing strategy | Section 7 |
| Update documentation | Documentation process | Section 6 |

### 13.2 Daily Workflow

**13.2.1 Morning Routine**

| Task | Method | Section Reference |
|------|--------|-------------------|
| Check devlog | `tail -50 _work_efforts/devlog.md` | Section 2.4 |
| Review work effort status | MCP or file read | Section 2.1 |
| Identify next task | Table E dependency order | Section 4.2 |

**13.2.2 Development Session**

| Task | Method | Section Reference |
|------|--------|-------------------|
| Use NovaSystem for analysis | Predict-Break-Fix loop | Section 1.2.2 |
| Implement following process | 6-step workflow | Section 4.2.1 |
| Test thoroughly | Unit + integration | Section 7 |

**13.2.3 End of Day Routine**

| Task | Method | Section Reference |
|------|--------|-------------------|
| Update devlog | MCP or manual | Section 2.4 |
| Update work effort | MCP or manual | Section 2.1 |
| Commit changes | Git workflow | Section 8 |

---

## 14. Conclusion

TheOracle development uses a multi-tool, multi-methodology approach:

- **NovaSystem** provides problem-solving framework
- **_pyrite** provides work tracking and tools
- **empirica** provides testing patterns
- **Standard tools** provide implementation foundation

By combining these approaches, we build TheOracle systematically, with clear tracking, comprehensive analysis, and robust implementation.

**"I need to consult The Oracle"** - And we're building it right! 🔴

---

---

## 15. Troubleshooting

### 15.1 Common Issues

**15.1.1 Import Errors**

**Error:**
```javascript
// Error: Cannot find module './agents/ComponentAgent.js'
```

**Solution:**
- Class doesn't exist yet - implement it (see Section 4.2)
- Or comment out import temporarily
- Check file path and extension

**Cross-Reference:** See Section 4.2 for implementation process

**15.1.2 PocketBase Connection**

**Error:**
```javascript
// Error: Failed to connect to PocketBase
```

**Solution Steps:**

| Step | Action | Command | Section Reference |
|------|--------|---------|-------------------|
| 1 | Check if PocketBase is running | `./pocketbase serve` | Section 5.1.2.2 |
| 2 | Verify URL | `http://127.0.0.1:8090` | Section 5.1.2.2 |
| 3 | Check credentials in config | `oracle.config.js` | Section 19.1.3 |
| 4 | Implement graceful degradation | Error handling | Section 4.4.2 |

**Cross-Reference:** See Section 5.1.10 for troubleshooting table

**15.1.3 MCP Server Not Working**

**Error:**
```bash
# Error: MCP server not responding
```

**Solution Steps:**

| Step | Action | Command | Section Reference |
|------|--------|---------|-------------------|
| 1 | Check config syntax | `~/.cursor/mcp.json` | Section 2.2.3 |
| 2 | Restart Cursor | Cmd+Q, reopen | N/A |
| 3 | Verify server path exists | `ls /path/to/server` | Section 2.2.1 |
| 4 | Check Node.js version | `node --version` (v18+) | Section 16.1 |

**15.1.4 Work Effort Not Found**

**Error:**
```bash
# Error: Work effort path not found
```

**Solution Steps:**

| Step | Action | Command | Section Reference |
|------|--------|---------|-------------------|
| 1 | Check path format | `_work_efforts/WE-260104-wppd_*/` | Section 2.1.1 |
| 2 | Verify work effort exists | `ls _work_efforts/` | Section 2.1.4 |
| 3 | Use full path | `/Users/ctavolazzi/Code/active/_pyrite/_work_efforts/...` | Section 2.1.4 |

**15.1.5 Test Failures**

**Error:**
```javascript
// Error: Test timeout
```

**Solution Steps:**

| Step | Action | Section Reference |
|------|--------|-------------------|
| 1 | Increase timeout in config | Section 19.1.3 |
| 2 | Check if page is slow to load | Section 22.2 |
| 3 | Verify network connectivity | Section 15.2.3 |
| 4 | Check browser console for errors | Section 15.2.1 |

### 15.2 Debugging Workflow

**15.2.1 Step 1: Check Logs**

**Locations:**

| Log Type | Location | Command | Section Reference |
|----------|----------|---------|-------------------|
| Devlog | `_work_efforts/devlog.md` | `tail -50 _work_efforts/devlog.md` | Section 2.4 |
| PocketBase logs | Console output | Check terminal | Section 5.1.2.2 |
| Browser console | Browser DevTools | F12 → Console | Section 15.1.5 |
| Node.js console | Terminal output | Check terminal | Section 15.2.1 |

**15.2.2 Step 2: Verify State**

**Commands:**
```bash
# Check work effort status
cat _work_efforts/WE-260104-wppd/WE-260104-wppd_index.md

# Check ticket status
ls _work_efforts/WE-260104-wppd/tickets/

# Check file existence
ls -la mcp-servers/dashboard-v3/tests/debugger/storage/
```

**15.2.3 Step 3: Test Components**

**Commands:**
```bash
# Test PocketBase connection
curl http://127.0.0.1:8090/api/health

# Test dashboard
curl http://localhost:3848

# Test Node.js
node --version
```

**15.2.4 Step 4: Use NovaSystem**

**Process:** Apply "Predict-Break-Fix" loop

| Step | Action | Section Reference |
|------|--------|-------------------|
| Predict | Identify the problem clearly | Section 1.2.2 |
| Break | Break it down into steps | Section 1.2.2 |
| Fix | Fix systematically | Section 1.2.2 |

**Cross-Reference:** See Section 10.1 for detailed problem-solving process

---

## 16. Development Environment

### 16.1 Required Software

**16.1.1 Software Requirements**

| Software | Version | Check Command | Install | Purpose | Section Reference |
|----------|---------|---------------|---------|---------|-------------------|
| Node.js | v18+ | `node --version` | https://nodejs.org/ | Runtime environment | Section 5.2 |
| Python | 3.8+ | `python3 --version` | System package manager | _pyrite tools | Section 2.3 |
| Git | Latest | `git --version` | System package manager | Version control | Section 8 |
| Docker | Latest (optional) | `docker --version` | https://docker.com/ | Isolated testing | Section 7.2 |

**16.1.2 Verification**

**Quick Check:**
```bash
node --version    # Should be v18 or higher
python3 --version # Should be 3.8 or higher
git --version     # Any recent version
```

### 16.2 Project Structure

**16.2.1 Directory Tree**

```
_pyrite/
├── mcp-servers/
│   └── dashboard-v3/
│       └── tests/
│           └── debugger/          # TheOracle location (see Table C)
│               ├── TheOracle.js
│               ├── agents/
│               ├── discovery/
│               ├── storage/
│               ├── queue/
│               ├── analysis/
│               └── learning/
├── _work_efforts/                 # Work tracking (see Section 2.1)
│   ├── WE-260104-wppd_*/          # Current work effort
│   └── devlog.md
├── tools/                         # Development tools (see Section 2.3)
│   ├── obsidian-linter/
│   ├── github-health-check/
│   └── structure-check/
└── docs/                          # Documentation (see Section 6)
```

**16.2.2 Key Locations**

| Location | Purpose | Section Reference |
|----------|---------|-------------------|
| `tests/debugger/` | TheOracle source code | Section 4.1 |
| `_work_efforts/` | Work effort tracking | Section 2.1 |
| `tools/` | Development utilities | Section 2.3 |

### 16.3 Environment Variables

**16.3.1 PocketBase Variables**

| Variable | Default | Purpose | Section Reference |
|----------|---------|---------|-------------------|
| `POCKETBASE_DATA_DIR` | `./pb_data` | Data directory | Section 5.1.8 |
| `POCKETBASE_PORT` | `8090` | Server port | Section 5.1.2.2 |

**Set Variables:**
```bash
export POCKETBASE_DATA_DIR="./pb_data"
export POCKETBASE_PORT=8090
```

**16.3.2 TheOracle Variables**

| Variable | Default | Purpose |
|----------|---------|---------|
| `ORACLE_DEBUG` | `false` | Enable debug mode |
| `ORACLE_LOG_LEVEL` | `info` | Logging level |

**Set Variables:**
```bash
export ORACLE_DEBUG=true
export ORACLE_LOG_LEVEL=info
```

### 16.4 IDE Configuration

**16.4.1 Cursor IDE**

| Config File | Purpose | Section Reference |
|-------------|---------|-------------------|
| `~/.cursor/mcp.json` | MCP server configuration | Section 2.2.3 |
| `.cursorrules` | Project rules | Section 4.3 |
| `.cursor/settings.json` | IDE settings | N/A |

**16.4.2 VS Code (Alternative)**

| Component | Purpose |
|-----------|---------|
| Extensions | ESLint, Prettier, Markdown All in One |
| Settings | `.vscode/settings.json` |

### 16.5 Running Services

**16.5.1 Service Startup Order**

| Service | Terminal | Command | URL | Section Reference |
|---------|----------|---------|-----|-------------------|
| PocketBase | Terminal 1 | `./pocketbase serve` | http://127.0.0.1:8090 | Section 5.1.2.2 |
| Dashboard | Terminal 2 | `npm start` | http://localhost:3848 | Section 18.2 |
| TheOracle | Terminal 3 | `npm run test:oracle` | N/A | Section 19.2.1 |

**16.5.2 Startup Commands**

**PocketBase:**
```bash
cd /path/to/pocketbase
./pocketbase serve
```

**Dashboard:**
```bash
cd mcp-servers/dashboard-v3
npm start
```

**TheOracle:**
```bash
cd mcp-servers/dashboard-v3
npm run test:oracle
```

---

## 17. Real-World Workflow Example

### 17.1 Complete Implementation Cycle

**17.1.1 Scenario**

**Task:** Implementing ResultRepository class
**Cross-Reference:** See Section 4.2.1 for standard workflow, Table E for dependency chain

**17.1.2 Step 1: Analysis (NovaSystem)**

**Method:** Use sequential-thinking MCP
**Cross-Reference:** See Section 1.2.2 for NovaSystem methodology, Section 10.1.3 for MCP tools

```javascript
// Use sequential-thinking MCP
mcp_sequential-thinking_sequentialthinking({
  thought: "I need to design ResultRepository. It should handle PocketBase connection, session management, and test result storage.",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
// ... continue analysis
```

**17.1.3 Step 2: Create Ticket**
```javascript
mcp_work-efforts_create_ticket({
  work_effort_path: "_work_efforts/WE-260104-wppd_...",
  title: "Implement ResultRepository class",
  description: "Create PocketBase integration for storing test results",
  acceptance_criteria: [
    "Can connect to PocketBase",
    "Can create/read/update sessions",
    "Can store test results",
    "Handles errors gracefully"
  ]
})
```

**17.1.4 Step 3: Log Start**

**Method:** MCP dev-log tool
**Cross-Reference:** See Section 2.4.2 for devlog usage

```javascript
mcp_dev-log_write_to_dev_log({
  repo_path: "/Users/ctavolazzi/Code/active/_pyrite",
  text: "Starting ResultRepository implementation - PocketBase integration"
})
```

**17.1.5 Step 4: Implement Class**
```javascript
// storage/ResultRepository.js
export class ResultRepository {
  constructor(oracle) {
    this.oracle = oracle;
    this.pb = oracle.getPocketBase();
  }

  async createSession(data) {
    try {
      return await this.pb.collection('debug_sessions').create(data);
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }
  // ... more methods
}
```

**17.1.6 Step 5: Write Tests**

**File:** `storage/ResultRepository.test.js`
**Cross-Reference:** See Section 7.1 for unit testing strategy

```javascript
// storage/ResultRepository.test.js
import { ResultRepository } from './ResultRepository.js';

test('creates session', async () => {
  const repo = new ResultRepository(oracle);
  const session = await repo.createSession({ name: 'Test' });
  expect(session).toBeDefined();
});
```

**17.1.7 Step 6: Test**

**Command:** `npm test storage/ResultRepository.test.js`
**Cross-Reference:** See Section 7.1.3 for test execution

**17.1.8 Step 7: Update Ticket**
```javascript
mcp_work-efforts_update_ticket({
  ticket_path: "_work_efforts/WE-260104-wppd_.../tickets/TKT-wppd-001_*.md",
  status: "completed",
  files_changed: [
    "mcp-servers/dashboard-v3/tests/debugger/storage/ResultRepository.js",
    "mcp-servers/dashboard-v3/tests/debugger/storage/ResultRepository.test.js"
  ],
  notes: "Implemented full PocketBase integration with error handling",
  commit: "abc1234"
})
```

**17.1.9 Step 8: Log Completion**

**Method:** MCP dev-log tool
**Cross-Reference:** See Section 2.4.2 for devlog usage

```javascript
mcp_dev-log_write_to_dev_log({
  repo_path: "/Users/ctavolazzi/Code/active/_pyrite",
  text: "✅ ResultRepository complete - All tests passing, PocketBase integration working"
})
```

**17.1.10 Step 9: Store Knowledge**
```javascript
mcp_memory_create_entities({
  entities: [{
    name: "ResultRepository",
    entityType: "class",
    observations: [
      "Handles PocketBase connection and authentication",
      "Manages debug_sessions, component_tests, bug_reports collections",
      "Implements graceful degradation when PocketBase unavailable",
      "All tests passing, ready for integration"
    ]
  }]
})
```

**17.1.11 Step 10: Commit**

**Method:** Git commit
**Cross-Reference:** See Section 8.2 for commit message format

```bash
git add mcp-servers/dashboard-v3/tests/debugger/storage/
git commit -m "WE-260104-wppd/TKT-wppd-001: Implement ResultRepository class"
```

---

## 18. TheOracle and Dashboard-v3 Integration

### 18.1 How TheOracle Fits Into dashboard-v3

**18.1.1 Project Context**

| Aspect | Description | Section Reference |
|--------|-------------|-------------------|
| Project | `dashboard-v3` MCP server project | Section 18.1.2 |
| Purpose | Real-time Mission Control dashboard | Section 18.1.3 |
| TheOracle Role | Tests the dashboard (meta-testing) | Section 18.3 |
| Location | `mcp-servers/dashboard-v3/tests/debugger/` | Table C |

**18.1.2 Project Relationship**
```
dashboard-v3/
├── server.js              # Express server + WebSocket
├── public/                # Dashboard UI (HTML/CSS/JS)
├── tests/
│   ├── data-flow/         # Data flow tests
│   ├── helpers/           # Test utilities
│   └── debugger/          # TheOracle (this project)
│       ├── TheOracle.js
│       ├── agents/
│       └── ...
└── package.json
```

**18.1.3 What TheOracle Tests**

| Component Type | Examples | Section Reference |
|----------------|----------|-------------------|
| UI Components | Mission Control dashboard components | Section 18.3.1 |
| Work Effort Display | Work effort list, ticket cards | Section 2.1 |
| Real-time Updates | WebSocket message handling | Section 18.3.2 |
| File System | File watching functionality | Section 18.3.2 |
| Multi-repo Support | Repository switching | Section 18.3.3 |
| Responsive Design | Mobile/tablet/desktop layouts | Section 18.3.1 |

**18.1.4 Target URL**

| Environment | URL | Purpose |
|-------------|-----|---------|
| Default | `http://localhost:3848` | dashboard-v3 server |
| TheOracle Navigation | Same URL | Test all components |

**Cross-Reference:** See Section 19.2.1 for running TheOracle

### 18.2 Running TheOracle Against Dashboard

**18.2.1 Setup Procedure**

| Step | Terminal | Command | URL | Section Reference |
|------|----------|---------|-----|-------------------|
| 1 | Terminal 1 | `npm start` | http://localhost:3848 | Section 16.5.2 |
| 2 | Terminal 2 | `./pocketbase serve` | http://127.0.0.1:8090 | Section 5.1.2.2 |
| 3 | Terminal 3 | `npm run test:oracle` | N/A | Section 19.2.1 |

**18.2.2 Execution Flow**

| Step | Action | Section Reference |
|------|--------|-------------------|
| 1 | TheOracle connects to PocketBase | Section 5.1.6 |
| 2 | TheOracle navigates to http://localhost:3848 | Section 4.2.2 |
| 3 | TheOracle discovers all components | Section 4.2.2 |
| 4 | TheOracle runs tests on each component | Section 4.2.6 |
| 5 | TheOracle stores results in PocketBase | Section 5.1.6 |
| 6 | TheOracle generates reports | Section 19.3 |

### 18.3 Integration Points

**18.3.1 Testing Dashboard Components**
```javascript
// TheOracle tests these dashboard components:
- Work effort list items
- Ticket cards
- Status badges
- Progress rings
- Navigation tree
- Detail view panels
- Toast notifications
- Notification bell
```

**18.3.2 WebSocket Testing**

| Test Type | Purpose | Section Reference |
|-----------|---------|-------------------|
| Real-time updates | Test WebSocket message handling | Section 18.1.3 |
| File system watching | Test file change detection | Section 18.1.3 |
| Event bus functionality | Verify event propagation | Section 18.1.3 |

**18.3.3 Multi-Repo Testing**

| Test Scenario | Purpose | Section Reference |
|---------------|---------|-------------------|
| Multiple repositories | Test dashboard with multiple repos | Section 18.1.3 |
| Repo switching | Verify repository switching | Section 18.1.3 |
| Cross-repo display | Test work effort display across repos | Section 18.1.3 |

---

## 19. Running TheOracle (Complete Guide)

### 19.1 First-Time Setup

**19.1.1 Step 1: Install Dependencies**
```bash
cd mcp-servers/dashboard-v3
npm install
```

**19.1.2 Step 2: Set Up PocketBase**

**Cross-Reference:** See Section 5.1.2 for detailed setup

```bash
# Download PocketBase
wget https://github.com/pocketbase/pocketbase/releases/download/v0.20.0/pocketbase_darwin_amd64.zip
unzip pocketbase_darwin_amd64.zip
chmod +x pocketbase

# Start PocketBase
./pocketbase serve
# First run: Create admin user via web UI at http://127.0.0.1:8090/_/
```

**19.1.3 Step 3: Create Configuration**

**File:** `oracle.config.js`
**Template:** `oracle.config.example.js`
**Cross-Reference:** See Table C for file locations

```bash
# Copy example config
cp mcp-servers/dashboard-v3/tests/debugger/oracle.config.example.js \
   mcp-servers/dashboard-v3/tests/debugger/oracle.config.js

# Edit oracle.config.js with your PocketBase credentials
```

**19.1.4 Step 4: Start Dashboard (Optional)**

**Required:** Only if testing dashboard
**Cross-Reference:** See Section 18.2 for dashboard testing

```bash
cd mcp-servers/dashboard-v3
npm start
# Dashboard runs at http://localhost:3848
```

### 19.2 Running TheOracle

**19.2.1 Basic Run**
```bash
cd mcp-servers/dashboard-v3
npm run test:oracle
```

**19.2.2 Watch Mode**

**Command:** `npm run test:oracle:watch`
**Purpose:** Re-runs on file changes
**Cross-Reference:** See Table D for command reference

**19.2.3 Test Specific Component**

**Command:** `npm run test:oracle:component`
**Purpose:** Tests single component
**Cross-Reference:** See Table D for command reference

**19.2.4 Programmatic Usage**
```javascript
import { TheOracle } from './tests/debugger/TheOracle.js';
import oracleConfig from './tests/debugger/oracle.config.js';

const oracle = new TheOracle({
  pocketbaseUrl: oracleConfig.pocketbase.url,
  pocketbaseAdminEmail: oracleConfig.pocketbase.adminEmail,
  pocketbaseAdminPassword: oracleConfig.pocketbase.adminPassword,
  targetUrl: oracleConfig.target.url
});

await oracle.initialize();
const results = await oracle.run();

console.log(`Found ${results.bugs.length} bugs`);
console.log(`Tested ${results.components.length} components`);
```

### 19.3 Viewing Results

**19.3.1 PocketBase Admin UI**

| Feature | Details | Section Reference |
|---------|---------|-------------------|
| URL | http://127.0.0.1:8090/_/ | Section 5.1.7 |
| Collections | `debug_sessions`, `component_tests`, `bug_reports` | Section 5.1.4 |
| Filter/Search | Built-in admin UI features | Section 5.1.7 |
| Export | Data export functionality | Section 5.1.7 |

**19.3.2 File Artifacts**

| Artifact Type | Location | Command | Section Reference |
|---------------|----------|--------|-------------------|
| Screenshots | `tests/component-results/screenshots/` | `ls tests/component-results/screenshots/` | Table C |
| Logs | `tests/component-results/logs/oracle.log` | `cat tests/component-results/logs/oracle.log` | Table C |
| Reports | `tests/component-results/reports/` | `ls tests/component-results/reports/` | Table C |

**19.3.3 Report Formats**

| Format | Location | Purpose |
|--------|----------|---------|
| HTML | `tests/component-results/reports/session-{id}.html` | Human-readable |
| JSON | `tests/component-results/reports/session-{id}.json` | Programmatic access |
| JUnit | `tests/component-results/reports/session-{id}.xml` | CI/CD integration |

---

## 20. Extending TheOracle

### 20.1 Adding a New Agent

**20.1.1 Step 1: Create Agent File**
```javascript
// agents/CustomAgent.js
export class CustomAgent {
  constructor(oracle) {
    this.oracle = oracle;
  }

  async testAll(components) {
    const results = [];
    for (const component of components) {
      const result = await this.test(component);
      results.push(result);
    }
    return results;
  }

  async test(component) {
    // Your test logic here
    return {
      componentId: component.id,
      testType: 'custom',
      status: 'pass',
      duration: 100,
      assertions: []
    };
  }
}
```

**20.1.2 Step 2: Register in TheOracle.js**

**File:** `TheOracle.js`
**Method:** Constructor
**Cross-Reference:** See Section 4.1.3 for agent structure

```javascript
import { CustomAgent } from './agents/CustomAgent.js';

export class TheOracle {
  constructor(config) {
    // ... existing code ...
    this.agents = {
      // ... existing agents ...
      custom: new CustomAgent(this)
    };
  }
}
```

**20.1.3 Step 3: Add to Run Method**
```javascript
async run() {
  // ... existing phases ...

  // Phase 3: Run all agent tests
  for (const [agentName, agent] of Object.entries(this.agents)) {
    console.log(`   ${agentName} agent running...`);
    const results = await agent.testAll(components);
    this.testResults.push(...results);
  }

  // ... rest of method ...
}
```

### 20.2 Adding a New Analysis Type

**20.2.1 Step 1: Create Analyzer**
```javascript
// analysis/CustomAnalyzer.js
export class CustomAnalyzer {
  constructor(oracle) {
    this.oracle = oracle;
  }

  async analyze(component) {
    // Your analysis logic
    return {
      componentId: component.id,
      analysisType: 'custom',
      data: {}
    };
  }
}
```

**20.2.2 Step 2: Integrate**

**File:** `TheOracle.js`
**Cross-Reference:** See Section 4.2.4 for implementation process

```javascript
// In TheOracle.js
import { CustomAnalyzer } from './analysis/CustomAnalyzer.js';

this.customAnalyzer = new CustomAnalyzer(this);

// In run() method
const customAnalysis = await this.customAnalyzer.analyze(component);
```

### 20.3 Configuration Extensions

**Add to oracle.config.js:**
```javascript
export const oracleConfig = {
  // ... existing config ...
  custom: {
    enabled: true,
    options: {}
  }
};
```

**Use in Code:**
```javascript
if (this.config.custom?.enabled) {
  // Use custom feature
}
```

---

## 21. Security Considerations

### 21.1 PocketBase Security

**21.1.1 Admin Credentials**

| Practice | Implementation | Section Reference |
|----------|----------------|-------------------|
| Never commit credentials | Use `.env` file (gitignored) | Section 16.3 |
| Use environment variables | `process.env` | Section 19.1.3 |
| Store in `.env` | Add to `.gitignore` | Section 8.3.1 |
| Rotate credentials regularly | Periodic updates | Section 21.1.1 |

**21.1.2 Collection Rules**

| Rule Type | Purpose | Implementation |
|-----------|---------|----------------|
| Read rules | Control data access | PocketBase admin UI |
| Write rules | Control data modification | PocketBase admin UI |
| Admin access | Restrict to necessary collections | Section 5.1.3 |
| API keys | Production authentication | Not admin auth |

**21.1.3 Data Privacy**

| Concern | Mitigation | Section Reference |
|---------|------------|-------------------|
| Sensitive test results | Store securely | Section 5.1.8 |
| Screenshot data | Encrypt if needed | Section 19.3 |
| Data retention | Follow policies | Section 5.1.9 |

### 21.2 Code Security

**21.2.1 Input Validation**

| Input Type | Validation | Section Reference |
|------------|------------|-------------------|
| User inputs | Validate all inputs | Section 4.4 |
| URLs | Sanitize before navigation | Section 4.2.2 |
| Configuration files | Validate schema | Section 19.1.3 |
| File paths | Check for directory traversal | Section 4.4 |

**21.2.2 Error Handling**

| Practice | Implementation | Section Reference |
|----------|----------------|-------------------|
| Don't expose internal errors | Generic error messages | Section 4.4.1 |
| Log errors securely | Console.error with context | Section 2.4 |
| Don't leak credentials | Sanitize error messages | Section 4.4.1 |
| Handle timeouts gracefully | Retry or fallback | Section 15.1.5 |

**21.2.3 Dependencies**

| Practice | Command | Purpose |
|----------|---------|---------|
| Keep updated | `npm update` | Security patches |
| Audit vulnerabilities | `npm audit` | Find issues |
| Use lock files | `package-lock.json` | Version pinning |
| Review licenses | `npm licenses` | Compliance |

---

## 22. Performance Considerations

### 22.1 Optimization Strategies

**22.1.1 Parallel Execution**

| Strategy | Implementation | Benefit | Section Reference |
|----------|----------------|--------|-------------------|
| Parallel tests | Run independent tests concurrently | Faster execution | Section 7.1 |
| Worker threads | CPU-intensive tasks | Better resource use | Section 4.2.6 |
| Batch operations | Group PocketBase operations | Reduced overhead | Section 5.1.6 |
| Cache results | Component discovery cache | Avoid re-computation | Section 4.2.2 |

**22.1.2 Resource Management**

| Resource | Management Strategy | Section Reference |
|----------|---------------------|-------------------|
| Browser instances | Limit concurrent instances | Section 5.2 |
| Browser contexts | Reuse contexts | Section 5.2 |
| Connections | Close unused connections | Section 5.1.6 |
| Memory | Monitor usage | Section 22.2 |

**22.1.3 Caching**

| Cache Type | Location | Purpose | Section Reference |
|------------|----------|---------|-------------------|
| Component discovery | Memory | Avoid re-traversal | Section 4.2.2 |
| CSS analysis | Memory | Avoid re-analysis | Section 4.2.4 |
| Patterns | Memory + PocketBase | Quick access | Section 4.2.7 |
| PocketBase indexes | Database | Query optimization | Section 5.1.3 |

### 22.2 Performance Monitoring

**22.2.1 Metrics to Track**

| Metric | Measurement | Tool | Section Reference |
|--------|-------------|------|-------------------|
| Test execution time | Duration per test | Date.now() | Section 22.2.3 |
| Component discovery | Time to discover | Performance API | Section 4.2.2 |
| PocketBase query time | Database latency | PocketBase logs | Section 5.1.7 |
| Memory usage | Heap size | process.memoryUsage() | Section 22.2.2 |
| CPU usage | Process CPU | process.cpuUsage() | Section 22.2.2 |

**22.2.2 Performance Thresholds**

| Metric | Target | Measurement | Section Reference |
|--------|--------|-------------|-------------------|
| Component discovery | < 30s | Time to complete | Section 4.2.2 |
| Individual test | < 10s | Test duration | Section 7.1 |
| Full suite | < 5min | Total execution | Section 7.3 |
| Memory usage | < 500MB | Heap size | Section 22.2.1 |

**22.2.3 Profiling Example**

**File:** `TheOracle.js`
**Method:** `run()`

```javascript
// Add performance monitoring
const startTime = Date.now();
await oracle.run();
const duration = Date.now() - startTime;
console.log(`Total time: ${duration}ms`);
```

**Cross-Reference:** See Section 19.2 for running TheOracle

---

## 23. CI/CD Integration

### 23.1 GitHub Actions

**23.1.1 Workflow Example**
```yaml
# .github/workflows/theoracle.yml
name: TheOracle Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 0 * * *'  # Daily

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd mcp-servers/dashboard-v3
          npm install

      - name: Start PocketBase
        run: |
          wget https://github.com/pocketbase/pocketbase/releases/download/v0.20.0/pocketbase_linux_amd64.zip
          unzip pocketbase_linux_amd64.zip
          chmod +x pocketbase
          ./pocketbase serve &

      - name: Run TheOracle
        run: |
          cd mcp-servers/dashboard-v3
          npm run test:oracle

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: oracle-results
          path: mcp-servers/dashboard-v3/tests/component-results/
```

### 23.2 Pre-commit Hooks

**23.2.1 Setup**

**Tool:** husky
**Purpose:** Run tests before commit
**Cross-Reference:** See Section 8.2 for commit workflow

```bash
# Install husky
npm install --save-dev husky

# Create pre-commit hook
npx husky add .husky/pre-commit "npm run test:oracle:quick"
```

**23.2.2 Quick Test Script**
```json
// package.json
{
  "scripts": {
    "test:oracle:quick": "node tests/debugger/examples/basic-usage.js --quick"
  }
}
```

---

## 24. TheOracle in _pyrite Ecosystem

### 24.1 Relationship to Other Tools

**24.1.1 Work Efforts System**

| Integration | Purpose | Section Reference |
|-------------|---------|-------------------|
| Test work effort components | Validate UI components | Section 18.3.1 |
| Validate file structure | Ensure compliance | Section 2.1.4 |
| Test MCP server | Verify functionality | Section 2.2.1 |
| Verify dashboard display | UI validation | Section 18.3.1 |

**24.1.2 Mission Control Dashboard**

| Integration | Purpose | Section Reference |
|-------------|---------|-------------------|
| Test dashboard itself | Meta-testing | Section 18.1 |
| Validate real-time updates | WebSocket testing | Section 18.3.2 |
| Test multi-repo support | Repository switching | Section 18.3.3 |
| Verify responsive design | Layout testing | Section 18.3.1 |

**24.1.3 Development Tools**

| Tool | Integration | Section Reference |
|------|-------------|-------------------|
| obsidian-linter | Test output validation | Section 2.3.1 |
| structure-check | Validate results | Section 2.3.3 |
| github-health-check | Test functionality | Section 2.3.2 |

### 24.2 Integration Opportunities

**24.2.1 Test Results → Work Efforts**

| Opportunity | Implementation | Section Reference |
|-------------|----------------|-------------------|
| Link test results | Associate results with work efforts | Section 2.1 |
| Create tickets for bugs | Auto-create tickets from bugs | Section 2.1.5.1 |
| Update work effort status | Status based on test results | Section 2.1.5.3 |

**24.2.2 Dashboard Integration**

| Opportunity | Implementation | Section Reference |
|-------------|----------------|-------------------|
| Display TheOracle results | Show in dashboard UI | Section 18.1 |
| Show test status | Work effort test status | Section 18.3.1 |
| Visualize bug trends | Charts and graphs | Section 11.2 |

**24.2.3 MCP Integration**

| MCP Server | Usage | Section Reference |
|------------|-------|-------------------|
| work-efforts | Track TheOracle development | Section 2.1 |
| docs-maintainer | Document TheOracle | Section 6 |
| memory | Persist learnings | Section 9.3 |

---

## Quick Reference Tables

### Table A: MCP Server Quick Reference

| Server | Command Prefix | Tools Available | Primary Use Case | Section Reference |
|--------|----------------|-----------------|------------------|-------------------|
| work-efforts | `mcp_work-efforts_*` | create_work_effort, create_ticket, update_ticket, list_work_efforts, search_work_efforts | Track implementation progress | Section 2.1 |
| docs-maintainer | `mcp_docs-maintainer_*` | create_doc, update_doc, rebuild_indices, search_docs | Update documentation | Section 6 |
| dev-log | `mcp_dev-log_*` | write_to_dev_log, tail_dev_log, search_dev_log | Log daily progress | Section 2.4 |
| memory | `mcp_memory_*` | create_entities, create_relations, search_nodes, open_nodes | Persist learnings | Section 9.3 |
| sequential-thinking | `mcp_sequential-thinking_*` | sequentialthinking | Complex problem analysis | Section 10.1 |

### Table B: Tool Installation Commands

| Tool | Installation Command | Verification | Section Reference |
|------|---------------------|--------------|-------------------|
| PocketBase | Download from https://pocketbase.io/docs/ | `./pocketbase serve` | Section 5.1 |
| Playwright | `npm install --save-dev @playwright/test` | `npx playwright install` | Section 5.2 |
| Testing Library | `npm install --save-dev @testing-library/dom` | `npm list @testing-library/dom` | Section 5.3 |
| axe-core | `npm install --save-dev axe-core` | `npm list axe-core` | Section 5.4 |
| Node.js | https://nodejs.org/ | `node --version` (v18+) | Section 16.1 |
| Python | System package manager | `python3 --version` (3.8+) | Section 16.1 |

### Table C: File Locations Reference

| Item | Path | Purpose | Section Reference |
|------|------|---------|-------------------|
| TheOracle.js | `mcp-servers/dashboard-v3/tests/debugger/TheOracle.js` | Main orchestrator class | Section 4.1 |
| Work Effort | `_work_efforts/WE-260104-wppd_*/` | Current work effort | Section 2.1.3 |
| Devlog | `_work_efforts/devlog.md` | Activity log | Section 2.4 |
| Config Example | `tests/debugger/oracle.config.example.js` | Configuration template | Section 19.1.3 |
| PocketBase Data | `./pb_data/data.db` | Database storage | Section 5.1.7 |
| Test Results | `tests/component-results/` | Test artifacts | Section 19.3 |

### Table D: Common Commands Reference

| Task | Command | Section Reference |
|------|---------|-------------------|
| Run TheOracle | `npm run test:oracle` | Section 19.2.1 |
| Watch mode | `npm run test:oracle:watch` | Section 19.2.2 |
| Lint docs | `python3 tools/obsidian-linter/lint.py --scope _work_efforts --fix` | Section 2.3.1 |
| Check GitHub | `python3 tools/github-health-check/check.py` | Section 2.3.2 |
| Validate structure | `python3 tools/structure-check/check.py --fix` | Section 2.3.3 |
| Read devlog | `tail -50 _work_efforts/devlog.md` | Section 2.4.3 |
| Start PocketBase | `./pocketbase serve` | Section 5.1.2 |
| Start Dashboard | `cd mcp-servers/dashboard-v3 && npm start` | Section 16.5.2 |

### Table E: Dependency Chain Reference

| Priority | Class | Dependencies | Section Reference |
|----------|-------|-------------|-------------------|
| 1 | ResultRepository | None (needed for initialize) | Section 4.2.1 |
| 2 | ComponentDiscovery | None (needed for run phase 1) | Section 4.2.2 |
| 3 | TestQueue | None (needed for execution) | Section 4.2.3 |
| 4 | CSSAnalyzer | None (needed for run phase 2) | Section 4.2.4 |
| 5 | ComponentAgent | ResultRepository, ComponentDiscovery | Section 4.2.5 |
| 6 | Remaining Agents | ResultRepository, ComponentDiscovery | Section 4.2.6 |
| 7 | PatternLearner | ResultRepository, test results | Section 4.2.7 |

### Table F: Phase Status Reference

| Phase | Status | Completion | Next Action | Section Reference |
|-------|--------|------------|-------------|-------------------|
| Phase 1: Foundation | ✅ Complete | 100% | N/A | Section 4.1.1 |
| Phase 2: Core Infrastructure | ❌ Not Started | 0% | Implement ResultRepository | Section 4.1.2 |
| Phase 3: Agents | ❌ Not Started | 0% | Wait for Phase 2 | Section 4.1.3 |
| Phase 4: Advanced Features | ❌ Not Started | 0% | Wait for Phase 3 | Section 4.1.4 |
| Phase 5: Reporting | ❌ Not Started | 0% | Wait for Phase 4 | Section 4.1.5 |

---

## Document Metadata

**Document Version:** 1.0
**Last Updated:** 2026-01-04
**Status:** Phase 2 Implementation In Progress
**Next Step:** Implement ResultRepository class
**Work Effort:** WE-260104-wppd
**Related Documents:** See Section 1.1.3, Table: Key Documents

---

**End of Document**

