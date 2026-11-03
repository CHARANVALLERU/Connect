"""
System 2 Adaptive Fusion Engine (Agent C orchestration).
Reliability-bounded weighting per prompt/prompts.txt:
  If Agent B confidence < 0.65 OR attenuation recommended → W_vis=0.20, W_vec=0.80
  Composite >= 0.75 AND tier permits → APPROVED_FOR_DM / WhatsApp-style routing
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from .agent_profiles import AgentASignalOutput, AgentBVisualOutput, AgentCFusionReport
from .schemas import APPROVED_COMPOSITE_THRESHOLD, WEIGHT_MAX, WEIGHT_MIN


class SystemTwoAdaptiveFusionEngine:
    def __init__(self, rag_context_provider: Optional[Dict[str, Any]] = None):
        self.rag_context = rag_context_provider or {}
        self.min_visual_weight = WEIGHT_MIN  # 0.20
        self.max_visual_weight = WEIGHT_MAX  # 0.80

    def execute_cross_modal_synthesis(
        self,
        agent_a_data: AgentASignalOutput,
        agent_b_data: AgentBVisualOutput,
        tier_dm_permitted: bool = True,
    ) -> AgentCFusionReport:
        visual_confidence = agent_b_data.classification_confidence
        attenuate = (
            agent_b_data.attenuation_recommended
            or visual_confidence < 0.65
            or not agent_b_data.media_authenticity_clearance
        )

        if attenuate:
            beta = self.min_visual_weight
            alpha = 1.0 - beta
        else:
            beta = min(max(visual_confidence, self.min_visual_weight), 0.40)
            alpha = 1.0 - beta

        # Clamp to hard invariant [0.20, 0.80]
        alpha = min(max(alpha, WEIGHT_MIN), WEIGHT_MAX)
        beta = min(max(beta, WEIGHT_MIN), WEIGHT_MAX)

        score_a = (
            agent_a_data.niche_alignment_score * 0.5
            + agent_a_data.cognitive_resonance_score * 0.5
        )
        if agent_a_data.zone_risk_matrix:
            zone_avg = sum(agent_a_data.zone_risk_matrix.values()) / max(
                len(agent_a_data.zone_risk_matrix), 1
            )
            score_a = (score_a + zone_avg) / 2.0

        score_b = agent_b_data.visual_authenticity_score or visual_confidence
        composite = round((alpha * score_a) + (beta * score_b), 4)

        if not agent_b_data.media_authenticity_clearance:
            return AgentCFusionReport(
                global_compatibility_index=0.0,
                resolved_match_action="ISOLATE_AND_DROP_PROFILE",
                gating_override_triggered=True,
                weights_applied={"w_vector": alpha, "w_visual": beta},
                connection_status="SUPPRESSED",
                icebreaker_hook="",
            )

        if not tier_dm_permitted:
            return AgentCFusionReport(
                global_compatibility_index=composite,
                resolved_match_action="SUPPRESS_CROSS_TIER_DM",
                gating_override_triggered=True,
                weights_applied={"w_vector": alpha, "w_visual": beta},
                connection_status="SUPPRESSED",
                icebreaker_hook="",
            )

        if composite >= APPROVED_COMPOSITE_THRESHOLD:
            action = "GENERATE_1TO1_WHATSAPP_ROUTING_CHANNEL"
            status = "APPROVED_FOR_DM"
            icebreaker = (
                "You both show strong overlap in niche depth — "
                "start with the thread that sparked your shared focus."
            )
        else:
            action = "RETAIN_IN_GENERIC_FEED"
            status = "PENDING_MUTUAL_INTEREST"
            icebreaker = ""

        return AgentCFusionReport(
            global_compatibility_index=composite,
            resolved_match_action=action,
            gating_override_triggered=False,
            weights_applied={"w_vector": round(alpha, 3), "w_visual": round(beta, 3)},
            connection_status=status,
            icebreaker_hook=icebreaker,
        )
