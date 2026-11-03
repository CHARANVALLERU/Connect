"""
LangGraph Multi-Agent Fusion State Machine
Orchestrates Agent A, Agent B, and Agent C under strict System 1 guardrails.
Caller rejects fusion weight outputs outside [0.20, 0.80] (prompts.txt invariant).
"""

from typing import Any, Dict, Optional, TypedDict

from ..agents.agent_a_profile import AgentAProfileEngine
from ..agents.agent_b_guard import AgentBMultimodalGuard
from ..agents.agent_c_fusion import AgentCAdaptiveFusion
from ..schemas import validate_agent_c, weights_within_bounds


class MatchState(TypedDict):
    source_user_id: str
    source_tier: str
    target_user_id: str
    target_tier: str
    source_niche: str
    target_niche: str
    user_1_metrics: Dict[str, Any]
    user_2_metrics: Dict[str, Any]
    media_metadata: Dict[str, Any]
    agent_a_results: Optional[Dict[str, Any]]
    agent_b_results: Optional[Dict[str, Any]]
    final_fusion_result: Optional[Dict[str, Any]]
    status: str


class ConnectFusionGraph:
    def __init__(
        self,
        hermes_endpoint: str = "http://localhost:11434/api/generate",
        model_name: str = "qwen2.5:3b",
        timeout: float = 0.5,
    ):
        self.agent_a = AgentAProfileEngine(hermes_endpoint, model_name, timeout=timeout)
        self.agent_b = AgentBMultimodalGuard(hermes_endpoint, model_name, timeout=timeout)
        self.agent_c = AgentCAdaptiveFusion(hermes_endpoint, model_name, timeout=timeout)

    def run_graph(self, initial_state: MatchState) -> MatchState:
        state = dict(initial_state)

        state["agent_a_results"] = self.agent_a.evaluate_profile_alignment(
            state["user_1_metrics"],
            state["user_2_metrics"],
        )

        state["agent_b_results"] = self.agent_b.evaluate_media_safety(
            state["media_metadata"],
            source_niche=state.get("source_niche"),
        )

        fusion = self.agent_c.fuse_and_generate_match(
            state["agent_a_results"],
            state["agent_b_results"],
            state["source_niche"],
            state["target_niche"],
            source_tier=state.get("source_tier"),
            target_tier=state.get("target_tier"),
        )

        # Caller-side hard reject of out-of-bounds weights (prompts.txt usage note #4)
        applied = (fusion or {}).get("weights_applied") or {}
        if not weights_within_bounds(
            float(applied.get("w_vector", -1)),
            float(applied.get("w_visual", -1)),
        ):
            fusion = self.agent_c._programmatic_result(
                state["agent_a_results"],
                state["agent_b_results"],
                state["source_niche"],
                state["target_niche"],
                source_tier=state.get("source_tier"),
                target_tier=state.get("target_tier"),
            )

        state["final_fusion_result"] = validate_agent_c(fusion).model_dump()
        state["status"] = state["final_fusion_result"].get(
            "connection_status", "PENDING_MUTUAL_INTEREST"
        )
        return state
