"""
Agent C: Adaptive Fusion Engine
Combines Agent A and Agent B metrics via reliability-bounded adaptive weighting.
Routes compatible profiles to WhatsApp-style 1:1 direct communications.
Aligned with prompt/prompts.txt:
  - temperature ≤ 0.10
  - W_vec / W_vis ∈ [0.20, 0.80]
  - APPROVED_FOR_DM requires composite ≥ 0.75 AND tier access
"""

import json
import urllib.request
from typing import Any, Dict, Optional

from ..hermes_qwen_prompts import AGENT_C_SYSTEM_PROMPT, format_hermes_prompt
from ..schemas import (
    APPROVED_COMPOSITE_THRESHOLD,
    MAX_INFERENCE_TEMPERATURE,
    validate_agent_c,
    weights_within_bounds,
)


class AgentCAdaptiveFusion:
    def __init__(
        self,
        hermes_endpoint: str = "http://localhost:11434/api/generate",
        model_name: str = "qwen2.5:3b",
        timeout: float = 0.5,
    ):
        self.endpoint = hermes_endpoint
        self.model_name = model_name
        self.timeout = timeout

    @staticmethod
    def compute_adaptive_weights(agent_b_output: Dict[str, Any]) -> Dict[str, float]:
        b_conf = float(agent_b_output.get("confidence", 0.5))
        attenuate_visual = bool(agent_b_output.get("attenuation_recommended", False)) or (
            b_conf < 0.65
        )
        if attenuate_visual:
            return {"w_vector": 0.80, "w_visual": 0.20}
        return {"w_vector": 0.60, "w_visual": 0.40}

    @staticmethod
    def compute_composite(
        agent_a_output: Dict[str, Any],
        agent_b_output: Dict[str, Any],
        w_vector: float,
        w_visual: float,
    ) -> float:
        score_a = (
            float(agent_a_output.get("niche_alignment_score", 0.5)) * 0.5
            + float(agent_a_output.get("cognitive_resonance_score", 0.5)) * 0.5
        )
        score_b = float(agent_b_output.get("visual_authenticity_score", 0.5))
        return round((w_vector * score_a) + (w_visual * score_b), 3)

    @staticmethod
    def tier_permits_dm(
        source_tier: Optional[str],
        target_tier: Optional[str],
        elite_initiated: bool = False,
    ) -> bool:
        """Elite isolation: Premium may not DM Elite unless Elite initiated."""
        src = (source_tier or "premium").lower()
        tgt = (target_tier or "premium").lower()
        if src == "premium" and tgt == "elite":
            return elite_initiated
        return True

    def _programmatic_result(
        self,
        agent_a_output: Dict[str, Any],
        agent_b_output: Dict[str, Any],
        source_user_niche: str,
        target_user_niche: str,
        source_tier: Optional[str] = None,
        target_tier: Optional[str] = None,
        elite_initiated: bool = False,
    ) -> Dict[str, Any]:
        weights = self.compute_adaptive_weights(agent_b_output)
        w_vector, w_visual = weights["w_vector"], weights["w_visual"]
        composite_score = self.compute_composite(
            agent_a_output, agent_b_output, w_vector, w_visual
        )

        tier_ok = self.tier_permits_dm(source_tier, target_tier, elite_initiated)
        guard_flag = agent_b_output.get("guardrail_flag", "CLEAN")

        if guard_flag == "POLICY_VIOLATION" or not tier_ok:
            status = "SUPPRESSED"
        elif (
            composite_score >= APPROVED_COMPOSITE_THRESHOLD
            and tier_ok
            and guard_flag != "SUSPICIOUS"
        ):
            status = "APPROVED_FOR_DM"
        else:
            status = "PENDING_MUTUAL_INTEREST"

        themes = agent_a_output.get("shared_niche_themes") or []
        theme_hint = themes[0] if themes else f"{source_user_niche} ↔ {target_user_niche}"
        icebreaker = (
            f"Noticed your depth in {theme_hint} — would love to swap notes from the "
            f"{source_user_niche} side."
        )
        reason = (
            f"High cognitive resonance across {source_user_niche} and "
            f"{target_user_niche} domains."
        )

        result = {
            "composite_compatibility_score": composite_score,
            "weights_applied": {"w_vector": w_vector, "w_visual": w_visual},
            "connection_status": status,
            "icebreaker_hook": icebreaker,
            "connection_synergy_reason": reason[:120],
        }
        return validate_agent_c(result).model_dump()

    def fuse_and_generate_match(
        self,
        agent_a_output: Dict[str, Any],
        agent_b_output: Dict[str, Any],
        source_user_niche: str,
        target_user_niche: str,
        source_tier: Optional[str] = None,
        target_tier: Optional[str] = None,
        elite_initiated: bool = False,
    ) -> Dict[str, Any]:
        weights = self.compute_adaptive_weights(agent_b_output)
        w_vector, w_visual = weights["w_vector"], weights["w_visual"]
        composite_score = self.compute_composite(
            agent_a_output, agent_b_output, w_vector, w_visual
        )

        payload = json.dumps(
            {
                "agent_a_profile": agent_a_output,
                "agent_b_guard": agent_b_output,
                "computed_composite": composite_score,
                "assigned_weights": {"w_vector": w_vector, "w_visual": w_visual},
                "source_niche": source_user_niche,
                "target_niche": target_user_niche,
                "source_tier": source_tier,
                "target_tier": target_tier,
                "tier_dm_permitted": self.tier_permits_dm(
                    source_tier, target_tier, elite_initiated
                ),
                "approved_threshold": APPROVED_COMPOSITE_THRESHOLD,
            }
        )
        prompt = format_hermes_prompt(AGENT_C_SYSTEM_PROMPT, payload)

        try:
            req = urllib.request.Request(
                self.endpoint,
                data=json.dumps(
                    {
                        "model": self.model_name,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": min(0.05, MAX_INFERENCE_TEMPERATURE),
                            "num_predict": 200,
                        },
                    }
                ).encode("utf-8"),
                headers={"Content-Type": "application/json"},
            )
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                response_text = data.get("response", "{}")
                start = response_text.find("{")
                end = response_text.rfind("}") + 1
                if start != -1 and end != 0:
                    parsed = json.loads(response_text[start:end])
                    # Hard reject out-of-bounds weights from the model (prompts.txt invariant)
                    applied = parsed.get("weights_applied") or {}
                    wv = float(applied.get("w_vector", -1))
                    wi = float(applied.get("w_visual", -1))
                    if not weights_within_bounds(wv, wi):
                        raise ValueError("LLM fusion weights outside [0.20, 0.80]")
                    validated = validate_agent_c(parsed).model_dump()
                    # Caller-side tier enforcement even if LLM approved
                    if not self.tier_permits_dm(
                        source_tier, target_tier, elite_initiated
                    ):
                        validated["connection_status"] = "SUPPRESSED"
                    return validated
        except Exception:
            pass

        return self._programmatic_result(
            agent_a_output,
            agent_b_output,
            source_user_niche,
            target_user_niche,
            source_tier=source_tier,
            target_tier=target_tier,
            elite_initiated=elite_initiated,
        )
