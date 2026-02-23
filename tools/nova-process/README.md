# NovaProcess - Multi-Persona Cognitive Architecture

**Version:** 1.0.0
**Status:** ✅ Working (placeholder LLM integration)
**Part of:** _pyrite Unified Cognitive Architecture

---

## Overview

NovaProcess is a **turn-based multi-persona conversation orchestrator** that enables AI agents to collaborate through structured dialogue. It combines design patterns from:

- **CrewAI:** Role-based personas with clear expertise
- **AutoGen:** Turn-based conversation flow
- **LangGraph:** State machine workflow with deterministic transitions
- **Empirica:** Epistemic gates for self-regulation

## Architecture

### Three-Layer Cognitive Stack

```
NovaSystem (Orchestration)     ← You are here
    ↓
Empirica (Epistemic Awareness)
    ↓
_pyrite (Repository Management)
```

### Conversation Flow

```
Question → DCE (Unpack) → Experts (Analyze) → DCE (Synthesize)
         → CHECK GATE → CAE (Critique) → DCE (Final) → Decision
```

### Personas

**Core Roles:**
- **DCE (Discussion Continuity Expert):** Coordinates, synthesizes, maintains context
- **CAE (Critical Analysis Expert):** Challenges assumptions, finds flaws, stress-tests

**Domain Experts:**
- Security Expert (OWASP, threat modeling, crypto)
- Performance Expert (coming soon)
- Architecture Expert (coming soon)

Each persona is defined in a `.md` file with YAML frontmatter.

---

## Installation

### 1. Verify Persona Files

```bash
ls -la tools/nova-process/personas/
```

You should see:

```
personas/
├── core/
│   ├── DCE.md
│   └── CAE.md
└── experts/
    └── security.md
```

### 2. Install Dependencies

```bash
pip install pyyaml
```

That's it! NovaProcess has minimal dependencies.

---

## Usage

### Command Line

```bash
# Basic usage
python tools/nova-process/orchestrate.py "Should we use OAuth2 or custom JWT?"

# With custom personas directory
python tools/nova-process/orchestrate.py \
  --personas-dir ./custom-personas \
  "Should we refactor this module?"

# JSON output
python tools/nova-process/orchestrate.py \
  --output json \
  "Should we migrate to microservices?" > decision.json

# YAML output
python tools/nova-process/orchestrate.py \
  --output yaml \
  "What database should we use?"

# With custom config
python tools/nova-process/orchestrate.py \
  --config nova-config.yaml \
  "How do we handle auth?"
```

### Python API

```python
from pathlib import Path
from tools.nova_process.orchestrate import NovaProcess

# Create orchestrator
nova = NovaProcess(
    personas_dir=Path("tools/nova-process/personas"),
    config={
        "max_rounds": 5,
        "check_gate_threshold": 0.35,
        "expert_limit": 3
    }
)

# Run conversation
result = nova.run("Should we implement caching?")

# Access decision
print(result["decision"])
print(f"Confidence: {result['confidence']:.2f}")

# Inspect conversation turns
for turn in result["turns"]:
    print(f"[Turn {turn['turn']}] {turn['persona']}: {turn['response']}")
```

---

## Configuration

### Config File Format (`nova-config.yaml`)

```yaml
# Maximum conversation rounds before termination
max_rounds: 5

# Uncertainty threshold for CHECK gate (0.0-1.0)
# If synthesis uncertainty > threshold, gate fails (investigate more)
check_gate_threshold: 0.35

# Maximum number of domain experts to consult (limits turn count)
expert_limit: 3

# Enable/disable CHECK gate (epistemic validation)
enable_check_gate: true

# Require CAE approval before finalizing decision
require_cae_approval: true
```

### Default Configuration

If no config provided, uses these defaults:

```python
{
    "max_rounds": 5,
    "check_gate_threshold": 0.35,
    "expert_limit": 3,
    "enable_check_gate": True,
    "require_cae_approval": True
}
```

---

## How It Works

### Round-by-Round Breakdown

#### Round 1: DCE Unpacks Question
**Goal:** Clarify the question and identify key considerations

```yaml
Input: "Should we use OAuth2 or custom JWT?"
Output:
  - Context: [What we know]
  - Key Considerations: [Security, performance, complexity, etc.]
  - Experts Needed: [Security, Performance, Architecture]
  - Success Criteria: [What defines a good answer]
  - Epistemic: {know: 0.5, uncertainty: 0.6, ...}
```

#### Round 2: Experts Analyze
**Goal:** Each expert provides domain-specific analysis

```yaml
Security Expert:
  - OAuth2 is more secure (industry standard)
  - Custom JWT has CVE risks
  - Recommendation: OAuth2 with PKCE

Performance Expert:
  - OAuth2 adds latency (redirect flows)
  - Custom JWT is faster (direct token issuance)
  - Recommendation: Measure actual latency impact

Architecture Expert:
  - OAuth2 integrates with existing SSO
  - Custom JWT requires building infrastructure
  - Recommendation: OAuth2 (less custom code)
```

#### Round 3: DCE Synthesizes
**Goal:** Combine expert input into coherent proposal

```yaml
Synthesis:
  - Common themes: [All experts acknowledge trade-offs]
  - Conflicts: [Security vs performance]
  - Proposed resolution: "Use OAuth2 (security priority)"
  - Epistemic: {know: 0.75, uncertainty: 0.30, coherence: 0.80}
```

#### CHECK GATE: Epistemic Validation
**Goal:** Validate readiness before critique

```yaml
Check:
  - uncertainty: 0.30 ≤ 0.35 (threshold)
  - Result: PASS → Proceed to critique
```

*If uncertainty > 0.35, process returns "INVESTIGATE_MORE" (loop back)*

#### Round 4: CAE Critiques
**Goal:** Challenge assumptions and find flaws

```yaml
Critique:
  - Assumptions: [Users can handle OAuth redirects - what about API clients?]
  - Blind spots: [Mobile app PKCE flow not addressed]
  - Edge cases: [Token refresh during deployment]
  - Verdict: REVISE (address mobile PKCE)
```

*Possible verdicts: APPROVE | REVISE | REJECT*

#### Round 5: DCE Final Recommendation
**Goal:** Provide actionable decision

```yaml
Decision: "Use OAuth2 with PKCE (including mobile support)"
Reasoning: [Security priority, existing SSO, mobile addressed]
Trade-offs: [Accept +50ms latency for security gain]
Confidence: 0.90
```

---

## Epistemic States

Each conversation turn includes an **epistemic self-assessment**:

```python
@dataclass
class EpistemicState:
    know: float = 0.5         # How much is known (0.0-1.0)
    uncertainty: float = 0.5  # How much is uncertain (0.0-1.0)
    coherence: float = 0.5    # Logical consistency (0.0-1.0)
    context: float = 0.5      # Information completeness (0.0-1.0)

    def readiness(self) -> float:
        """Overall readiness to make decision."""
        return (know + context + (1.0 - uncertainty)) / 3.0
```

**CHECK GATE Logic:**

```python
if synthesis.uncertainty > 0.35:
    return "INVESTIGATE_MORE"  # Not ready
else:
    proceed_to_critique()  # Ready
```

---

## Creating Custom Personas

### Persona File Format

Personas are markdown files with YAML frontmatter:

```markdown
---
role: Performance Expert
short_name: performance
expertise:
  - latency optimization
  - caching strategies
  - database query optimization
tools:
  - profiling
  - load testing
  - benchmarking
responsibility: analyze performance implications
pattern: domain_expert
---

# Performance Expert

You are the Performance Expert. Your role is to...

## When You Analyze
[Instructions for this persona]

## Output Format
[Expected response structure]
```

### Creating a New Domain Expert

1. Create file in `personas/experts/`:

```bash
touch tools/nova-process/personas/experts/devops.md
```

2. Add frontmatter + prompt:

```markdown
---
role: DevOps Expert
short_name: devops
expertise:
  - CI/CD pipelines
  - container orchestration
  - infrastructure as code
responsibility: evaluate deployment and operations impact
pattern: domain_expert
---

# DevOps Expert

You evaluate proposals for deployment complexity, scalability, and operational overhead.

## When You Analyze

Look for:
- **Deployment complexity:** How hard is it to deploy?
- **Scalability:** Can it handle 10x traffic?
- **Monitoring:** Can we observe it in production?
- **Rollback:** Can we undo this change?

## Output Format

\`\`\`yaml
---
persona: DevOps Expert
turn: X
deployment_risk: [ LOW | MEDIUM | HIGH ]
---

## DevOps Analysis
...
\`\`\`
```

3. The orchestrator auto-loads it!

```bash
python tools/nova-process/orchestrate.py "Should we use Kubernetes?"
# DevOps Expert will now participate
```

---

## Integration with pyrite CLI

**(Coming Soon)**

```bash
# Integrated into pyrite
pyrite nova process "Should we refactor auth?"

# With work effort context
pyrite nova process --we WE-260105-auth

# Save decision to work effort
pyrite nova process \
  --we WE-260105-auth \
  --save-decision \
  "How should we implement OAuth2?"
```

This will:
1. Load work effort context (findings, unknowns, git state)
2. Run NovaProcess with that context
3. Save decision to `_work_efforts/WE-*/decisions/DEC-YYMMDD-HHMM.md`
4. Update work effort metadata

---

## LLM Integration (TODO)

**Current State:** Placeholder responses (no real LLM calls)

**To Enable Real LLM:**

1. Choose LLM provider:
   - **Claude API** (Anthropic) - Recommended
   - **OpenAI API** (GPT-4)
   - **Local model** (Ollama, LM Studio)

2. Update `Persona.speak()` method:

```python
def speak(self, context: str, turn: int) -> ConversationTurn:
    """Generate response using LLM."""

    # Build full prompt
    full_prompt = f"{self.prompt}\n\n## Context\n{context}"

    # Call LLM API
    response = anthropic.Client(api_key=os.getenv("ANTHROPIC_API_KEY")).messages.create(
        model="claude-sonnet-4",
        max_tokens=2000,
        messages=[{
            "role": "user",
            "content": full_prompt
        }]
    )

    response_text = response.content[0].text

    # Parse epistemic state from YAML frontmatter
    epistemic = self._parse_epistemic(response_text)

    return ConversationTurn(...)
```

3. Set API key:

```bash
export ANTHROPIC_API_KEY="your-key-here"
```

4. Run:

```bash
python tools/nova-process/orchestrate.py "Your question"
```

---

## Design Patterns

### 1. Supervisor Pattern (from LangGraph)
- **DCE acts as supervisor**, coordinating expert involvement

### 2. Role-Based Agents (from CrewAI)
- Each persona has **clear expertise** defined in frontmatter

### 3. Turn-Based Conversation (from AutoGen)
- **Deterministic flow:** DCE → Experts → DCE → CAE → DCE
- Not async (simplicity over performance)

### 4. Epistemic Gates (from Empirica)
- **CHECK GATE:** Validates readiness before critique
- Prevents confident ignorance

### 5. Map-Reduce (from LangGraph)
- **Map:** Experts analyze independently
- **Reduce:** DCE synthesizes their input

---

## Troubleshooting

### Error: "Personas directory not found"

```bash
# Check personas exist
ls tools/nova-process/personas/

# If missing, you need at least DCE and CAE
cp /path/to/empirica/empirica/personas/core/*.md \
   tools/nova-process/personas/core/
```

### Error: "No experts available"

This is a warning, not an error. It means:
- No files in `personas/experts/`
- Conversation will use DCE + CAE only (no domain experts)

To add experts:

```bash
# Create security expert
cp /path/to/empirica/empirica/personas/experts/security.md \
   tools/nova-process/personas/experts/
```

### Placeholder Responses

If you see `[PLACEHOLDER: ...]` responses:
- This is expected (LLM integration not done yet)
- To enable real responses, see "LLM Integration" section above

### High Uncertainty Warnings

If you see:

```
⚠️  CHECK GATE FAILED - High uncertainty detected
Recommendation: Investigate further before deciding
```

This means:
- Synthesis epistemic state has `uncertainty > 0.35`
- More investigation needed before proceeding
- **This is working as designed!** (preventing premature decisions)

---

## Roadmap

### Phase 1: Foundation ✅
- [x] Orchestrator skeleton
- [x] Persona loading
- [x] Turn-based conversation flow
- [x] Epistemic state tracking
- [x] CHECK gate logic
- [x] CAE verdict handling

### Phase 2: LLM Integration 🔄
- [ ] Claude API integration
- [ ] Response parsing (extract epistemic state from YAML)
- [ ] Error handling (API failures, rate limits)
- [ ] Streaming responses (for UI)

### Phase 3: pyrite CLI Integration 🔜
- [ ] `pyrite nova process` command
- [ ] Work effort context loading
- [ ] Decision persistence (save to WE)
- [ ] Dashboard integration (show agent activity)

### Phase 4: Advanced Features 🔮
- [ ] Multi-model support (Claude, GPT-4, local models)
- [ ] Parallel expert processing (async)
- [ ] Loop-back for revisions (CAE → DCE → Experts)
- [ ] Tool-calling (personas can run `pyrite` commands)

---

## Contributing

### Adding New Personas

1. Create `.md` file in `personas/experts/`
2. Follow format (YAML frontmatter + markdown prompt)
3. Test with orchestrator
4. Submit PR

### Improving Orchestrator

1. Fork repo
2. Make changes to `orchestrate.py`
3. Test with `python -m pytest tests/test_nova_process.py`
4. Submit PR

---

## License

MIT License (same as _pyrite)

**Attribution:**
- NovaSystem process: https://github.com/ctavolazzi/NovaSystem
- Design patterns: CrewAI, AutoGen, LangGraph, Empirica
- Implementation: Chris Tavolazzi (_pyrite)

---

## Resources

- **NovaSystem:** https://github.com/ctavolazzi/NovaSystem
- **CrewAI:** https://docs.crewai.com
- **AutoGen:** https://microsoft.github.io/autogen
- **LangGraph:** https://langchain-ai.github.io/langgraph
- **Empirica:** (Internal)

---

**End of README**

*NovaProcess: Turn-based cognitive architecture for collaborative AI decision-making.*
