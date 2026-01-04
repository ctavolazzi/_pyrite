# NovaSystem Unified Design - Multi-Agent Cognitive Architecture

**Date:** 2026-01-04
**Version:** 1.0.0
**Status:** Design Complete

---

## Framework Analysis Summary

We analyzed four leading multi-agent frameworks to extract unified design patterns for NovaSystem:

### CrewAI - Role-Based Teams
**Strengths:**
- Clear role definition (agents have specific jobs)
- Deterministic backbone with intelligence where needed
- Task delegation built into framework
- Tools directly connected to agents
- Production-ready, fast execution

**Patterns:**
- **Coordinator-Worker:** Planner breaks tasks for specialists
- **Hierarchical:** Manager assigns tasks to workers
- **Sequential:** Tasks flow in defined order
- **Tool-Agent Binding:** Each agent has specific capabilities

**Key Insight:** Roles give structure. A "Security Expert" agent always thinks about security.

### AutoGen / AG2 - Conversation-Based
**Strengths:**
- Natural turn-based dialogue
- Event-driven architecture (message passing)
- Flexible conversation patterns
- Human-in-the-loop integration
- Supports multi-turn negotiation

**Patterns:**
- **GroupChat:** Agents converse until consensus
- **Two-Agent:** Simple back-and-forth (e.g., critic ↔ generator)
- **Event-Driven:** Agents respond to messages asynchronously
- **Human Escalation:** Pause for human input when needed

**Key Insight:** Conversations emerge naturally. Let agents talk until they solve the problem.

### LangGraph - State Machines
**Strengths:**
- Explicit state management (graph nodes = states)
- Deterministic flows (edges define transitions)
- Easy to visualize (literally a graph)
- Conditional routing (IF-THEN logic)
- Cycles allowed (iterative refinement)

**Patterns:**
- **Supervisor:** Central node routes to specialist nodes
- **Map-Reduce:** Parallel processing → aggregation
- **Reflection:** Agent critiques its own output in loop
- **Tool-Calling:** Nodes can invoke external tools

**Key Insight:** Make the workflow explicit. A graph shows exactly what happens.

### Common Threads (What We Keep)

All frameworks share these principles:

1. **Role Specialization:** Different agents = different expertise
2. **Turn-Based Dialogue:** Agents speak in sequence (even if async under the hood)
3. **State Tracking:** Someone remembers the conversation (DCE role)
4. **Conditional Logic:** "IF uncertain, THEN investigate more"
5. **Tool Access:** Agents can call functions/APIs
6. **Human Oversight:** Ability to pause for approval

---

## NovaSystem Unified Architecture

We're taking the best from each framework:

### Layer 1: Role-Based Personas (from CrewAI)
Each agent has a **clear job** defined in a markdown file:

- **DCE (Discussion Continuity Expert):** Synthesize, coordinate, maintain context
- **CAE (Critical Analysis Expert):** Challenge, critique, find flaws
- **Domain Experts:** Specialized knowledge (security, performance, architecture, etc.)

**Why:** Roles provide cognitive scaffolding. A security expert naturally thinks "is this secure?"

### Layer 2: Turn-Based Conversation (from AutoGen)
Agents speak in **rounds**, not all at once:

```
Round 1: DCE unpacks the question
Round 2: Experts analyze (parallel, but ordered)
Round 3: DCE synthesizes expert input
Round 4: CAE critiques the synthesis
Round 5: DCE final recommendation
```

**Why:** Turn-taking prevents chaos. Conversations have structure.

### Layer 3: State Machine Workflow (from LangGraph)
The conversation follows a **deterministic graph**:

```
[Question] → [DCE: Unpack] → [Experts: Analyze] → [DCE: Synthesize]
           → [CAE: Critique] → {Decision Gate} → [DCE: Final] → [Done]
                                    ↓
                         (If flaws found) → [Loop Back to Experts]
```

**Why:** Explicit flow is debuggable. You know where you are and what's next.

### Layer 4: Epistemic Gates (from Empirica)
Before proceeding, check **knowledge readiness**:

```python
if uncertainty > 0.35:
    # HIGH UNCERTAINTY → Investigate more
    return "NOETIC (investigation mode)"
else:
    # LOW UNCERTAINTY → Ready to act
    return "PRAXIC (execution mode)"
```

**Why:** Prevents premature conclusions. AI investigates until confident.

---

## NovaSystem Conversation Flow

### Complete Workflow

```
┌─────────────────────────────────────────────┐
│ 1. Question Input                           │
│    "Should we use OAuth2 or custom JWT?"    │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 2. DCE: Unpack Question                     │
│    • Clarify requirements                   │
│    • Identify key considerations            │
│    • Determine which experts needed         │
│    Epistemic: know=0.4, uncertainty=0.7     │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 3. Expert Analysis (Parallel)               │
│    ┌─────────────────────────────────┐     │
│    │ Security Expert:                │     │
│    │ "OAuth2 is more secure..."      │     │
│    └─────────────────────────────────┘     │
│    ┌─────────────────────────────────┐     │
│    │ Performance Expert:             │     │
│    │ "Custom JWT is faster..."       │     │
│    └─────────────────────────────────┘     │
│    ┌─────────────────────────────────┐     │
│    │ Integration Expert:             │     │
│    │ "OAuth2 easier to integrate..." │     │
│    └─────────────────────────────────┘     │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 4. DCE: Synthesize                          │
│    • Combine expert insights                │
│    • Find consensus                         │
│    • Identify trade-offs                    │
│    Proposal: "Use OAuth2 with PKCE"         │
│    Epistemic: know=0.75, uncertainty=0.35   │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 5. CHECK GATE (Epistemic Validation)        │
│    if uncertainty > 0.35:                   │
│        return "INVESTIGATE MORE"            │
│    else:                                    │
│        return "PROCEED TO CRITIQUE"         │
└─────────────────────────────────────────────┘
                    ↓ (uncertainty borderline)
┌─────────────────────────────────────────────┐
│ 6. CAE: Critical Analysis                   │
│    • Challenge assumptions                  │
│    • Find edge cases                        │
│    • Stress test proposal                   │
│    Critique: "What about mobile apps?"      │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 7. Decision: Loop or Conclude?              │
│    Critical flaw found? → Loop to Step 3    │
│    Minor adjustments? → DCE revises         │
│    Solid proposal? → Final recommendation   │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 8. DCE: Final Recommendation                │
│    Decision: OAuth2 with PKCE + mobile PKCE │
│    Epistemic: know=0.90, uncertainty=0.15   │
│    Confidence: 0.92                         │
└─────────────────────────────────────────────┘
```

### Loop Control

**Max Rounds:** 5 (configurable)
**Convergence Detection:** If epistemic state doesn't change significantly across 2 rounds, exit
**Escalation:** If no consensus after max rounds, flag for human decision

---

## Persona Definition Format

Each persona is a `.md` file with YAML frontmatter:

```markdown
---
role: Security Expert
short_name: security
expertise:
  - authentication & authorization
  - cryptography
  - OWASP Top 10
tools:
  - threat modeling
  - penetration testing
responsibility: Evaluate security implications
pattern: domain_expert
---

# Security Expert

You are the Security Expert. Your role is to evaluate proposals for security risks.

## When You Analyze

Look for:
1. **Injection risks** (SQL, XSS, command injection)
2. **Authentication issues** (weak passwords, no MFA)
3. **Authorization bypasses** (privilege escalation)
...

## Output Format

```yaml
---
persona: Security Expert
turn: 2
risk_level: [ LOW | MEDIUM | HIGH | CRITICAL ]
---

## Security Analysis
...
```
```

**Why Markdown:**
- Human-editable (users can customize)
- Version-controllable
- Self-documenting
- Aligns with _pyrite philosophy

---

## Orchestrator Design

### Core Components

```python
class Persona:
    """A conversational agent with specific expertise"""
    def __init__(self, name: str, prompt_file: Path):
        self.name = name
        self.prompt = load_markdown_prompt(prompt_file)

    def speak(self, context: str, turn: int) -> dict:
        """Generate response using LLM"""
        response = call_llm(self.prompt + context)
        return {
            "persona": self.name,
            "turn": turn,
            "response": response,
            "epistemic": extract_epistemic_state(response)
        }


class NovaProcess:
    """Orchestrates multi-persona conversations"""
    def __init__(self, personas_dir: Path):
        self.dce = Persona("DCE", personas_dir / "core" / "DCE.md")
        self.cae = Persona("CAE", personas_dir / "core" / "CAE.md")
        self.experts = load_experts(personas_dir / "experts")
        self.conversation_history = []
        self.max_rounds = 5

    def run(self, question: str) -> dict:
        """Run NovaProcess on a question"""
        # Round 1: DCE unpacks
        self._turn(self.dce, question)

        # Round 2: Experts analyze
        for expert in self.experts:
            self._turn(expert, self._build_context())

        # Round 3: DCE synthesizes
        synthesis = self._turn(self.dce, self._build_context())

        # Round 4: CHECK gate
        if synthesis['epistemic']['uncertainty'] > 0.35:
            return self._investigate_more()

        # Round 5: CAE critiques
        critique = self._turn(self.cae, self._build_context())

        # Round 6: DCE final recommendation
        final = self._turn(self.dce, self._build_context())

        return {
            "decision": final,
            "confidence": final['epistemic']['know'],
            "turns": self.conversation_history
        }

    def _turn(self, persona: Persona, context: str) -> dict:
        """Execute one conversational turn"""
        turn_num = len(self.conversation_history) + 1
        response = persona.speak(context, turn_num)
        self.conversation_history.append(response)
        return response

    def _build_context(self) -> str:
        """Build conversation context from history"""
        return "\n\n".join([
            f"[{turn['persona']}]: {turn['response']}"
            for turn in self.conversation_history
        ])
```

---

## Design Patterns Used

### 1. Supervisor Pattern (from LangGraph)
**DCE acts as supervisor:**
- Coordinates expert involvement
- Synthesizes their input
- Makes final decision

**Why:** Central coordination prevents chaos.

### 2. Role-Based Agents (from CrewAI)
**Each persona has a job:**
- Security Expert → security
- Performance Expert → performance
- CAE → critique
- DCE → synthesize

**Why:** Clear responsibilities = clear thinking.

### 3. Turn-Based Conversation (from AutoGen)
**Agents speak in sequence:**
- Not all at once (async)
- Deterministic order
- Context builds incrementally

**Why:** Conversations have flow.

### 4. Epistemic Gates (from Empirica)
**Before proceeding, check readiness:**
```python
if uncertainty > threshold:
    investigate_more()
else:
    proceed()
```

**Why:** Prevents confident ignorance.

### 5. Map-Reduce (from LangGraph)
**Expert phase is map-reduce:**
- **Map:** Each expert analyzes independently
- **Reduce:** DCE synthesizes their input

**Why:** Parallel processing, then integration.

---

## What We're NOT Doing (Deliberate Choices)

### ❌ Async Event Streams
**Why not:** Too complex for initial implementation. Synchronous is easier to debug.

**Future:** Could add async later for performance.

### ❌ Full Graph Visualization
**Why not:** NovaProcess flow is simple enough to document in markdown.

**Future:** Could generate graph diagrams later.

### ❌ Tool-Calling Infrastructure
**Why not:** Start with conversation only. Tools add complexity.

**Future:** Personas can call `pyrite` commands as tools.

### ❌ Multi-Model Support
**Why not:** Start with one LLM (Claude). Adding model switching is premature.

**Future:** Could add model selection per persona.

---

## Integration with _pyrite + Empirica

### How They Work Together

```
User asks: "Should I refactor this module?"
    ↓
pyrite nova process "Should I refactor..."
    ↓
NovaProcess orchestrator starts:
    ↓
DCE (using Empirica bootstrap):
    • Load project context (~800 tokens)
    • Load recent findings/unknowns
    • Assess baseline epistemic state
    ↓
Experts analyze:
    • Security Expert: Check for vulnerabilities
    • Performance Expert: Check for bottlenecks
    • Architecture Expert: Check for design issues
    ↓
DCE synthesizes
    ↓
CASCADE CHECK gate (Empirica):
    • If uncertainty > 0.35: Loop back to investigation
    • Else: Proceed to critique
    ↓
CAE critiques
    ↓
DCE final recommendation
    ↓
Result stored in:
    • .pyrite/sessions.db (Empirica epistemic state)
    • _work_efforts/WE-*/decisions.md (decision log)
    • Checkpoint created (CKPT-YYMMDD-HHMM)
```

### Data Flow

```
_pyrite provides:
    • Work effort context
    • Git state
    • Previous decisions
        ↓
Empirica provides:
    • Epistemic vectors (what we know)
    • Bootstrap context (session continuity)
    • CASCADE gates (when to investigate)
        ↓
NovaSystem provides:
    • Multi-perspective analysis
    • Critical review
    • Consensus building
        ↓
Result: High-confidence, well-analyzed decisions
```

---

## Success Metrics

### Quality Metrics
- **Consensus Rate:** % of times all agents agree
- **Critique Rate:** % of times CAE finds issues
- **Revision Rate:** % of times synthesis is revised after critique
- **Confidence:** Average epistemic know at final recommendation

**Target:** 80% consensus, 60% critique (healthy skepticism), 90% confidence

### Performance Metrics
- **Time to Decision:** Median time for NovaProcess to complete
- **Turns per Decision:** Average number of conversational turns
- **Expert Utilization:** % of experts contributing vs. silent

**Target:** < 5 minutes, < 10 turns, > 70% expert contribution

### Epistemic Metrics
- **Learning Delta:** How much knowledge increased during process
- **Uncertainty Reduction:** How much uncertainty decreased
- **Finding Yield:** Number of new findings per process run

**Target:** +0.20 know, -0.30 uncertainty, 3+ findings per complex decision

---

## Next Steps

### Immediate (This Session)
1. ✅ Create this design document
2. Create persona files (DCE.md, CAE.md)
3. Build orchestrator skeleton
4. Add `pyrite nova` command

### Short-Term
1. Integrate with LLM API (Claude)
2. Implement conversation loop
3. Add epistemic state tracking
4. Test with sample questions

### Medium-Term
1. Add domain expert personas (security, performance, etc.)
2. Integrate with CASCADE gates
3. Integrate with bootstrap context
4. Dashboard visualization (show agent turns)

---

## References

- **CrewAI:** https://docs.crewai.com
- **AutoGen:** https://microsoft.github.io/autogen
- **AG2:** (AutoGen Gen 2) - https://ag2ai.github.io/ag2/
- **LangGraph:** https://langchain-ai.github.io/langgraph
- **Empirica:** (Include docs if available)
- **NovaSystem:** https://github.com/ctavolazzi/NovaSystem

---

**End of Unified Design**

*We're building a cognitive architecture that combines the best patterns from all major frameworks, grounded in epistemic self-awareness.*
