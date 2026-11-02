"""
LangGraph Multi-Agent Fusion State Machine
Orchestrates Agent A, Agent B, and Agent C under strict System 1 guardrails.
"""

from typing import Dict, Any, TypedDict, Optional
from ..agents.agent_a_profile import AgentAProfileEngine
from ..agents.agent_b_guard import AgentBMultimodalGuard
from ..agents.agent_c_fusion import AgentCAdaptiveFusion

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
    def __init__(self, hermes_endpoint: str = "http://localhost:11434/api/generate", model_name: str = "qwen2.5:3b", timeout: float = 0.5):
        self.agent_a = AgentAProfileEngine(hermes_endpoint, model_name, timeout=timeout)
        self.agent_b = AgentBMultimodalGuard(hermes_endpoint, model_name, timeout=timeout)
        self.agent_c = AgentCAdaptiveFusion(hermes_endpoint, model_name, timeout=timeout)

    def run_graph(self, initial_state: MatchState) -> MatchState:
        state = dict(initial_state)

        # Step 1: Agent A executes vector and behavioral resonance evaluation
        state["agent_a_results"] = self.agent_a.evaluate_profile_alignment(
            state["user_1_metrics"],
            state["user_2_metrics"]
        )

        # Step 2: Agent B vets visual media and bot anomaly metrics
        state["agent_b_results"] = self.agent_b.evaluate_media_safety(
            state["media_metadata"]
        )

        # Step 3: Agent C performs reliability-bounded adaptive fusion
        state["final_fusion_result"] = self.agent_c.fuse_and_generate_match(
            state["agent_a_results"],
            state["agent_b_results"],
            state["source_niche"],
            state["target_niche"]
        )

        state["status"] = state["final_fusion_result"].get("connection_status", "PENDING_MUTUAL_INTEREST")
        return state
