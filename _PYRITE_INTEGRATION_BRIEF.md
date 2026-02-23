# _pyrite + Empirica + NovaSystem Integration

**Date:** 2026-01-04
**Version:** 1.0.0
**Goal:** Unified Cognitive Architecture for AI-Assisted Repository Management

---

## Executive Summary

Integrate three cognitive architectures into one unified framework:

1. **_pyrite** (v0.7.0) - Repository management with work tracking, linting, health checks
2. **Empirica** - Epistemic self-awareness with 13D vectors, CASCADE workflow, loop control
3. **NovaSystem** - Multi-agent orchestration with DCE/CAE/Domain Experts

**Result:** AI that knows what it knows, regulates its own investigation depth, and collaborates via turn-based multi-persona conversations.

---

## Current State

### _pyrite (v0.7.0) ✅
**Location:** `/home/user/_pyrite`
**Branch:** `claude/quality-advisor-review-wzKWa`

**Has:**
- Work effort tracking (WE-YYMMDD-xxxx format)
- Ticket management (TKT-xxxx-NNN)
- Session checkpoints (CKPT-YYMMDD-HHMM)
- Markdown linting (Obsidian-compatible)
- GitHub health checks
- Real-time dashboard (WebSocket-based)

**Missing:**
- Epistemic metadata schema
- CASCADE workflow gates
- EpistemicLoopTracker integration
- Multi-agent orchestration
- NovaProcess implementation

### Empirica 🔄
**Source:** https://github.com/empirica-ai/empirica (MIT License)

**Core Components to Integrate:**
```
empirica/
├── core/
│   ├── vectors/              # 13D epistemic tracking
│   ├── cascade/              # PREFLIGHT→CHECK→POSTFLIGHT
│   ├── sentinel/             # Safety gates + loop control
│   │   └── EpistemicLoopTracker  # ⭐ Currently unused but excellent
│   ├── bootstrap/            # Session continuity (~800 tokens)
│   └── canonical/            # Checkpoint storage (Git + SQLite)
```

**Key Capabilities:**
- **13D Epistemic Vectors:** know, do, context, clarity, coherence, signal, density, state, change, completion, impact, uncertainty, engagement
- **CASCADE Workflow:**
  - PREFLIGHT: Assess baseline knowledge before starting
  - CHECK: Validate readiness (gate: proceed vs. investigate)
  - POSTFLIGHT: Measure learning delta
- **EpistemicLoopTracker:**
  - Scope-based max loops (breadth * duration → 2-10 loops)
  - Convergence detection (learning plateau)
  - Multiple exit conditions (max loops, low uncertainty, convergence)
- **Bootstrap Context:** Load prior knowledge (~800 tokens vs. 200k conversation)

### NovaSystem 🆕
**Source:** https://github.com/ctavolazzi/NovaSystem (Process methodology)

**Core Roles:**
- **DCE (Discussion Continuity Expert):** Synthesizes, coordinates, maintains context
- **CAE (Critical Analysis Expert):** Challenges assumptions, finds flaws, stress-tests
- **Domain Experts:** Specialized knowledge (security, performance, architecture, etc.)

**Process Flow:**
```
1. DCE: Unpack question
2. Experts: Analyze in parallel (each from their domain)
3. DCE: Synthesize expert input
4. CAE: Critique synthesis (find flaws, assumptions, edge cases)
5. DCE: Final recommendation (incorporating critique)
```

---

## Integration Architecture

### Three-Layer Stack

```
┌─────────────────────────────────────────────┐
│ LAYER 3: NovaSystem (Orchestration)        │
│ • Multi-agent coordination (DCE, CAE, etc) │
│ • Turn-based conversations                 │
│ • Critical analysis gates                  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ LAYER 2: Empirica (Epistemic Awareness)    │
│ • 13D epistemic vectors                    │
│ • CASCADE workflow gates                   │
│ • EpistemicLoopTracker                     │
│ • Bootstrap context loading                │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ LAYER 1: _pyrite (Repository Management)   │
│ • Work effort tracking                     │
│ • Markdown linting & validation            │
│ • GitHub health checks                     │
│ • Real-time dashboard                      │
└─────────────────────────────────────────────┘
```

### File Structure (Target)

```
_pyrite/
├── empirica/                    # Embedded Empirica (MIT attributed)
│   ├── core/
│   │   ├── vectors/
│   │   ├── cascade/
│   │   ├── sentinel/
│   │   └── bootstrap/
│   ├── ATTRIBUTION.md          # Full MIT license + credits
│   └── __init__.py
│
├── tools/
│   ├── epistemic-linter/       # Phase 1 (epistemic metadata validator)
│   ├── nova-process/           # Phase 2 (multi-agent orchestrator)
│   │   ├── orchestrate.py
│   │   ├── conversation.py
│   │   └── personas/
│   │       ├── core/
│   │       │   ├── DCE.md
│   │       │   ├── CAE.md
│   │       │   └── Facilitator.md
│   │       └── experts/
│   │           ├── security.md
│   │           ├── performance.md
│   │           └── architecture.md
│
├── .pyrite/
│   ├── config/
│   │   ├── epistemic.yaml
│   │   ├── sentinel.yaml
│   │   └── agents.yaml
│   ├── sessions.db             # Empirica epistemic state
│   └── agents/                 # Multi-agent workspaces
│
└── pyrite                      # Enhanced CLI
    # Existing: lint, health, structure
    # New: epistemic, cascade, nova, session
```

---

## Implementation Phases

### Phase 1: Epistemic Foundation ✅
**Status:** Complete (if coming from /tmp/_pyrite work)
**Deliverables:**
- ✅ tools/epistemic-linter/check.py (280 lines, zero deps)
- ✅ Epistemic metadata schema in work effort frontmatter
- ✅ `pyrite epistemic check` command

**Schema:**
```yaml
---
id: WE-260104-test
epistemic:
  know: 0.75
  uncertainty: 0.30
  context: 0.85
  findings:
    - "Discovery 1"
  unknowns:
    - "Question 1"
  dead_ends:
    - "Failed approach 1"
---
```

### Phase 2: Empirica Integration 🔄
**Status:** In progress
**Tasks:**
1. Install Empirica modules with MIT attribution
2. Create .pyrite/sessions.db (SQLite epistemic store)
3. Integrate CASCADE workflow:
   - `pyrite cascade preflight` - Assess baseline
   - `pyrite cascade check` - Validate readiness
   - `pyrite cascade postflight` - Measure learning
4. Integrate EpistemicLoopTracker (fix unused code!)
5. Implement bootstrap context loader

### Phase 3: NovaProcess Integration 🆕
**Status:** Planned
**Tasks:**
1. Create persona definitions (DCE.md, CAE.md, experts/*.md)
2. Build turn-based conversation orchestrator
3. Integrate with LLM API (Claude, local model, etc.)
4. Add `pyrite nova process <question>` command
5. Integrate with CASCADE (NovaProcess uses CHECK gates)

---

## Key Design Decisions

### 1. Embedded vs. Dependency
**Decision:** Embed Empirica code directly into _pyrite
**Reasoning:**
- Full control over integration
- No version conflicts
- Proper MIT attribution maintained
- Can modify for _pyrite-specific needs

### 2. Personas as Markdown
**Decision:** Store persona prompts in .md files
**Reasoning:**
- Human-editable (users can customize)
- Version-controllable
- Self-documenting
- Aligns with _pyrite's markdown-first philosophy

### 3. Turn-Based Conversation
**Decision:** Synchronous turn-based dialogue (not async event streams)
**Reasoning:**
- Simpler to reason about
- Deterministic flow (DCE → Experts → DCE → CAE → DCE)
- Easier debugging
- Clear epistemic state at each turn

### 4. Scope-Based Loop Limits
**Decision:** Auto-derive max_loops from work effort scope
**Reasoning:**
- Adaptive to task complexity
- Prevents infinite loops
- Converges naturally (learning plateau detection)
- Already implemented in EpistemicLoopTracker

---

## Success Criteria

### Phase 1 Success
- [ ] All work efforts have valid epistemic metadata
- [ ] `pyrite epistemic check` validates 100% of work efforts
- [ ] Epistemic linter catches all schema violations

### Phase 2 Success
- [ ] CASCADE CHECK gate prevents premature work completion
- [ ] Bootstrap context reduces session startup time by 90%
- [ ] EpistemicLoopTracker terminates within configured max_loops
- [ ] Learning delta measured and logged for all completed work

### Phase 3 Success
- [ ] NovaProcess produces higher-quality decisions than single-agent
- [ ] CAE finds at least 1 critical flaw in 80% of proposals
- [ ] Multi-agent spawn completes in < 5 minutes
- [ ] Turn-based conversations are coherent and goal-directed

---

## Migration Strategy

### Existing Work Efforts
**Problem:** 28 existing work efforts have no epistemic metadata
**Solution:**
1. Make epistemic metadata **optional** initially
2. Add `pyrite epistemic init <WE-ID>` to bootstrap metadata
3. Auto-suggest epistemic values based on WE content
4. Gradual migration as work efforts are touched

### Existing Checkpoints
**Problem:** CKPT files are plain markdown
**Solution:**
1. Extend CKPT format with epistemic data (backward compatible)
2. New CKPTs include epistemic state
3. Old CKPTs work as-is (graceful degradation)

---

## License & Attribution

### Empirica (MIT License)
All Empirica code will be copied with full MIT license attribution:

```markdown
# empirica/ATTRIBUTION.md

This directory contains code from the Empirica project:
https://github.com/empirica-ai/empirica

Copyright (c) Empirica Team
Licensed under the MIT License (see LICENSE file)

Modified for integration with _pyrite by Chris Tavolazzi
```

### NovaSystem (Check License)
Confirm NovaSystem license before embedding code.
If process-only (not code), document methodology reference.

---

## Next Steps

**Immediate (This Session):**
1. Install Empirica with MIT attribution
2. Create persona definitions (DCE, CAE)
3. Build basic NovaProcess orchestrator skeleton
4. Add `pyrite nova` command stub

**Short-Term (Next Session):**
1. Implement CASCADE commands (preflight, check, postflight)
2. Integrate EpistemicLoopTracker
3. Complete NovaProcess orchestrator (LLM integration)

**Medium-Term:**
1. Bootstrap context loader
2. Session management (create, resume, end)
3. Multi-agent spawning
4. Dashboard integration (show epistemic state, agent activity)

---

## Resources

- **Empirica Docs:** (Include if available)
- **NovaSystem:** https://github.com/ctavolazzi/NovaSystem
- **Multi-Agent Frameworks:**
  - CrewAI: https://docs.crewai.com
  - AutoGen: https://microsoft.github.io/autogen
  - LangGraph: https://langchain-ai.github.io/langgraph

---

**End of Integration Brief**

*Ready to build a badass AI-first repository management system with full cognitive architecture.*
