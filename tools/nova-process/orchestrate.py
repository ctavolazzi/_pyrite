#!/usr/bin/env python3
"""
NovaProcess Orchestrator - Turn-Based Multi-Persona Conversations

Implements the unified cognitive architecture combining:
- Role-based personas (from CrewAI)
- Turn-based dialogue (from AutoGen)
- State machine workflow (from LangGraph)
- Epistemic gates (from Empirica)

Usage:
    python orchestrate.py "Should we use OAuth2 or custom JWT?"
    python orchestrate.py --config custom_config.yaml

Author: Chris Tavolazzi (_pyrite)
Based on: NovaSystem process (https://github.com/ctavolazzi/NovaSystem)
Inspired by: CrewAI, AutoGen, LangGraph, Empirica

License: MIT
"""

import sys
import json
import yaml
from pathlib import Path
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field


@dataclass
class EpistemicState:
    """Epistemic awareness state for a persona or conversation."""
    know: float = 0.5  # 0.0-1.0: How much is known
    uncertainty: float = 0.5  # 0.0-1.0: How much is uncertain
    coherence: float = 0.5  # 0.0-1.0: How logically consistent
    context: float = 0.5  # 0.0-1.0: How complete is the information

    def readiness(self) -> float:
        """Calculate overall epistemic readiness."""
        return (self.know + self.context + (1.0 - self.uncertainty)) / 3.0

    def to_dict(self) -> Dict[str, float]:
        return {
            "know": self.know,
            "uncertainty": self.uncertainty,
            "coherence": self.coherence,
            "context": self.context,
            "readiness": self.readiness()
        }


@dataclass
class ConversationTurn:
    """A single turn in the conversation."""
    turn_number: int
    persona_name: str
    persona_role: str
    input_context: str
    response: str
    epistemic: EpistemicState
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "turn": self.turn_number,
            "persona": self.persona_name,
            "role": self.persona_role,
            "response": self.response,
            "epistemic": self.epistemic.to_dict(),
            "metadata": self.metadata
        }


class Persona:
    """A conversational agent with specific expertise defined by a markdown prompt."""

    def __init__(self, name: str, prompt_file: Path):
        self.name = name
        self.prompt_file = prompt_file
        self.frontmatter, self.prompt = self._load_prompt()
        self.role = self.frontmatter.get("role", name)
        self.short_name = self.frontmatter.get("short_name", name.lower())
        self.expertise = self.frontmatter.get("expertise", [])

    def _load_prompt(self) -> tuple[Dict[str, Any], str]:
        """Load markdown file with YAML frontmatter."""
        content = self.prompt_file.read_text()

        if not content.startswith("---"):
            return {}, content

        # Split frontmatter from content
        parts = content.split("---", 2)
        if len(parts) < 3:
            return {}, content

        frontmatter = yaml.safe_load(parts[1]) or {}
        prompt_content = parts[2].strip()

        return frontmatter, prompt_content

    def speak(self, context: str, turn: int) -> ConversationTurn:
        """
        Generate response from this persona.

        For now, this is a placeholder that returns a structured response.
        In production, this would call an LLM API (Claude, GPT, local model, etc.)
        """

        # Build full prompt
        full_prompt = f"""
{self.prompt}

## Current Context

{context}

---

You are **{self.name}** (role: {self.role}) on turn {turn}.
Respond following your persona's guidelines and output format.

Include epistemic self-assessment in YAML frontmatter.
"""

        # TODO: Call LLM API here
        # response = call_llm_api(full_prompt)

        # For now, return a placeholder
        response = self._placeholder_response(context, turn)

        return response

    def _placeholder_response(self, context: str, turn: int) -> ConversationTurn:
        """Placeholder response until LLM integration is added."""

        epistemic = EpistemicState(
            know=0.6,
            uncertainty=0.4,
            coherence=0.7,
            context=0.8
        )

        response_text = f"""
[PLACEHOLDER: {self.name} would analyze the context and respond here]

This is a placeholder response. To enable real responses:
1. Add LLM API integration (Claude API, OpenAI, local model)
2. Update the speak() method to call the API
3. Parse epistemic state from response

Persona: {self.name}
Role: {self.role}
Turn: {turn}
"""

        return ConversationTurn(
            turn_number=turn,
            persona_name=self.name,
            persona_role=self.role,
            input_context=context,
            response=response_text.strip(),
            epistemic=epistemic,
            metadata={"placeholder": True}
        )


class NovaProcess:
    """
    Orchestrates multi-persona conversations using the NovaSystem process.

    Conversation Flow:
    1. DCE: Unpack the question
    2. Experts: Analyze in parallel (security, performance, etc.)
    3. DCE: Synthesize expert input
    4. CHECK GATE: Validate epistemic readiness
    5. CAE: Critique synthesis (if CHECK passes)
    6. DCE: Final recommendation
    """

    def __init__(self, personas_dir: Path, config: Optional[Dict] = None):
        self.personas_dir = personas_dir
        self.config = config or self._default_config()

        # Load core personas
        self.dce = Persona("DCE", personas_dir / "core" / "DCE.md")
        self.cae = Persona("CAE", personas_dir / "core" / "CAE.md")

        # Load domain experts
        self.experts = self._load_experts()

        # Conversation state
        self.conversation_history: List[ConversationTurn] = []
        self.max_rounds = self.config.get("max_rounds", 5)
        self.check_gate_threshold = self.config.get("check_gate_threshold", 0.35)

    def _default_config(self) -> Dict[str, Any]:
        """Default configuration for NovaProcess."""
        return {
            "max_rounds": 5,
            "check_gate_threshold": 0.35,  # uncertainty threshold for CHECK gate
            "expert_limit": 3,  # Maximum experts to consult
            "enable_check_gate": True,
            "require_cae_approval": True
        }

    def _load_experts(self) -> List[Persona]:
        """Load all domain expert personas from experts/ directory."""
        experts_dir = self.personas_dir / "experts"
        if not experts_dir.exists():
            return []

        experts = []
        for expert_file in sorted(experts_dir.glob("*.md")):
            name = expert_file.stem.title() + " Expert"
            try:
                expert = Persona(name, expert_file)
                experts.append(expert)
            except Exception as e:
                print(f"Warning: Failed to load expert {expert_file}: {e}")

        return experts

    def run(self, question: str) -> Dict[str, Any]:
        """
        Run NovaProcess on a question.

        Returns a decision dict with:
        - question: Original question
        - decision: Final recommendation
        - confidence: Epistemic confidence (0.0-1.0)
        - turns: List of all conversation turns
        - metadata: Additional info
        """

        print(f"\n🌟 NovaProcess Starting\n")
        print(f"Question: {question}\n")
        print("=" * 60)

        # Round 1: DCE unpacks question
        self._round_unpack(question)

        # Round 2: Experts analyze (parallel in concept, sequential in implementation)
        self._round_experts()

        # Round 3: DCE synthesizes
        synthesis_turn = self._round_synthesize()

        # Round 4: CHECK GATE (epistemic validation)
        if self.config.get("enable_check_gate", True):
            gate_passed = self._check_gate(synthesis_turn.epistemic)
            if not gate_passed:
                print("\n⚠️  CHECK GATE FAILED - High uncertainty detected")
                print("   Recommendation: Investigate further before deciding\n")
                return self._build_result(
                    decision="INVESTIGATE_MORE",
                    confidence=synthesis_turn.epistemic.readiness(),
                    metadata={"check_gate_passed": False}
                )

        # Round 5: CAE critiques
        if self.config.get("require_cae_approval", True):
            critique_turn = self._round_critique()

            # Check CAE verdict
            cae_verdict = critique_turn.metadata.get("verdict", "APPROVE")
            if cae_verdict == "REJECT":
                print("\n❌ CAE REJECTED - Critical flaws found")
                return self._build_result(
                    decision="REJECTED",
                    confidence=critique_turn.epistemic.readiness(),
                    metadata={"cae_verdict": "REJECT", "critique": critique_turn.response}
                )
            elif cae_verdict == "REVISE":
                print("\n🔄 CAE REQUESTED REVISIONS")
                # In production, loop back to synthesis
                # For now, proceed with note about revisions needed

        # Round 6: DCE final recommendation
        final_turn = self._round_final()

        print("\n✅ NovaProcess Complete\n")

        return self._build_result(
            decision=final_turn.response,
            confidence=final_turn.epistemic.readiness(),
            metadata={"check_gate_passed": True}
        )

    def _round_unpack(self, question: str):
        """Round 1: DCE unpacks the question."""
        print(f"\n[Turn 1] DCE: Unpacking question...\n")

        context = f"Question: {question}"
        turn = self.dce.speak(context, 1)
        self._record_turn(turn)

        print(f"  Know: {turn.epistemic.know:.2f}")
        print(f"  Uncertainty: {turn.epistemic.uncertainty:.2f}")
        print(f"  Readiness: {turn.epistemic.readiness():.2f}")

    def _round_experts(self):
        """Round 2: Domain experts analyze."""
        print(f"\n[Turn 2] Experts: Analyzing...\n")

        # Limit number of experts (configurable)
        expert_limit = self.config.get("expert_limit", 3)
        active_experts = self.experts[:expert_limit]

        if not active_experts:
            print("  No experts available (create .md files in personas/experts/)")
            return

        context = self._build_context()
        turn_num = len(self.conversation_history) + 1

        for expert in active_experts:
            print(f"  {expert.name}...")
            turn = expert.speak(context, turn_num)
            self._record_turn(turn)
            turn_num += 1

    def _round_synthesize(self) -> ConversationTurn:
        """Round 3: DCE synthesizes expert input."""
        print(f"\n[Turn {len(self.conversation_history) + 1}] DCE: Synthesizing expert input...\n")

        context = self._build_context()
        turn_num = len(self.conversation_history) + 1
        turn = self.dce.speak(context, turn_num)
        self._record_turn(turn)

        print(f"  Know: {turn.epistemic.know:.2f}")
        print(f"  Uncertainty: {turn.epistemic.uncertainty:.2f}")
        print(f"  Coherence: {turn.epistemic.coherence:.2f}")

        return turn

    def _check_gate(self, epistemic: EpistemicState) -> bool:
        """
        CHECK GATE: Validate epistemic readiness before proceeding to critique.

        Returns:
            True if ready to proceed (uncertainty low enough)
            False if more investigation needed (uncertainty too high)
        """
        threshold = self.check_gate_threshold

        print(f"\n[CHECK GATE] Validating epistemic state...\n")
        print(f"  Uncertainty: {epistemic.uncertainty:.2f} (threshold: {threshold})")
        print(f"  Readiness: {epistemic.readiness():.2f}")

        if epistemic.uncertainty > threshold:
            print(f"  Result: FAIL (uncertainty {epistemic.uncertainty:.2f} > {threshold})")
            return False
        else:
            print(f"  Result: PASS (uncertainty {epistemic.uncertainty:.2f} ≤ {threshold})")
            return True

    def _round_critique(self) -> ConversationTurn:
        """Round 4/5: CAE critiques the synthesis."""
        print(f"\n[Turn {len(self.conversation_history) + 1}] CAE: Critiquing synthesis...\n")

        context = self._build_context()
        turn_num = len(self.conversation_history) + 1
        turn = self.cae.speak(context, turn_num)
        self._record_turn(turn)

        # In production, parse CAE response to extract verdict
        # For now, default to APPROVE
        turn.metadata["verdict"] = "APPROVE"

        print(f"  Verdict: {turn.metadata['verdict']}")
        print(f"  Critique Strength: {turn.metadata.get('critique_strength', 'UNKNOWN')}")

        return turn

    def _round_final(self) -> ConversationTurn:
        """Round 5/6: DCE final recommendation."""
        print(f"\n[Turn {len(self.conversation_history) + 1}] DCE: Final recommendation...\n")

        context = self._build_context()
        turn_num = len(self.conversation_history) + 1
        turn = self.dce.speak(context, turn_num)
        self._record_turn(turn)

        print(f"  Confidence: {turn.epistemic.readiness():.2f}")

        return turn

    def _record_turn(self, turn: ConversationTurn):
        """Record a conversation turn in history."""
        self.conversation_history.append(turn)

    def _build_context(self) -> str:
        """Build conversation context from history."""
        lines = []
        for turn in self.conversation_history:
            lines.append(f"[Turn {turn.turn_number}] {turn.persona_name}:")
            lines.append(turn.response)
            lines.append("")  # Blank line between turns

        return "\n".join(lines)

    def _build_result(self, decision: str, confidence: float, metadata: Dict = None) -> Dict[str, Any]:
        """Build final result dict."""
        return {
            "decision": decision,
            "confidence": confidence,
            "turns": [turn.to_dict() for turn in self.conversation_history],
            "metadata": metadata or {},
            "summary": {
                "total_turns": len(self.conversation_history),
                "personas_involved": list(set(t.persona_name for t in self.conversation_history)),
                "final_epistemic": self.conversation_history[-1].epistemic.to_dict() if self.conversation_history else None
            }
        }


def main():
    """CLI entry point for NovaProcess orchestrator."""
    import argparse

    parser = argparse.ArgumentParser(
        description="NovaProcess: Multi-persona cognitive architecture for decision-making"
    )
    parser.add_argument("question", nargs="?", help="Question to process")
    parser.add_argument(
        "--personas-dir",
        type=Path,
        help="Path to personas directory (default: ./tools/nova-process/personas)"
    )
    parser.add_argument(
        "--config",
        type=Path,
        help="Path to config YAML file"
    )
    parser.add_argument(
        "--output",
        choices=["json", "yaml", "text"],
        default="text",
        help="Output format (default: text)"
    )

    args = parser.parse_args()

    # Get question
    if not args.question:
        print("Error: Question required")
        print("Usage: python orchestrate.py 'Should we refactor this module?'")
        sys.exit(1)

    # Find personas directory
    if args.personas_dir:
        personas_dir = args.personas_dir
    else:
        # Default: look relative to this script
        script_dir = Path(__file__).parent
        personas_dir = script_dir / "personas"

    if not personas_dir.exists():
        print(f"Error: Personas directory not found: {personas_dir}")
        print("Create personas directory with:")
        print(f"  mkdir -p {personas_dir}/{{core,experts}}")
        sys.exit(1)

    # Load config if provided
    config = None
    if args.config:
        with open(args.config) as f:
            config = yaml.safe_load(f)

    # Run NovaProcess
    nova = NovaProcess(personas_dir, config)
    result = nova.run(args.question)

    # Output result
    if args.output == "json":
        print(json.dumps(result, indent=2))
    elif args.output == "yaml":
        print(yaml.dump(result, default_flow_style=False))
    else:
        # Text output (human-readable)
        print("\n" + "=" * 60)
        print("DECISION")
        print("=" * 60)
        print(result["decision"])
        print(f"\nConfidence: {result['confidence']:.2f}")
        print(f"Total Turns: {result['summary']['total_turns']}")
        print(f"Personas: {', '.join(result['summary']['personas_involved'])}")


if __name__ == "__main__":
    main()
