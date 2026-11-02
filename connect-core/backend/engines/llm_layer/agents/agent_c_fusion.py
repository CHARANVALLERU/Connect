"""
Agent C: Adaptive Fusion Engine
Combines Agent A and Agent B metrics via reliability-bounded adaptive weighting.
Routes compatible profiles to WhatsApp-style 1:1 direct communications.
"""

import json
import urllib.request
from typing import Dict, Any
from ..hermes_qwen_prompts import AGENT_C_SYSTEM_PROMPT, format_hermes_prompt

class AgentCAdaptiveFusion:
    def __init__(self, hermes_endpoint: str = "http://localhost:11434/api/generate", model_name: str = "qwen2.5:3b", timeout: float = 0.5):
        self.endpoint = hermes_endpoint
        self.model_name = model_name
        self.timeout = timeout

    def fuse_and_generate_match(
        self,
        agent_a_output: Dict[str, Any],
        agent_b_output: Dict[str, Any],
        source_user_niche: str,
        target_user_niche: str
    ) -> Dict[str, Any]:
        """
        Executes bounded adaptive fusion and generates introductory communication hook.
        """
        # Determine adaptive weights
        b_conf = agent_b_output.get("confidence", 0.5)
        attenuate_visual = agent_b_output.get("attenuation_recommended", False) or (b_conf < 0.65)

        if attenuate_visual:
            w_vector = 0.80
            w_visual = 0.20
        else:
            w_vector = 0.60
            w_visual = 0.40

        score_a = (
            agent_a_output.get("niche_alignment_score", 0.5) * 0.5 +
            agent_a_output.get("cognitive_resonance_score", 0.5) * 0.5
        )
        score_b = agent_b_output.get("visual_authenticity_score", 0.5)

        composite_score = round((w_vector * score_a) + (w_visual * score_b), 3)

        payload = json.dumps({
            "agent_a_profile": agent_a_output,
            "agent_b_guard": agent_b_output,
            "computed_composite": composite_score,
            "assigned_weights": {"w_vector": w_vector, "w_visual": w_visual},
            "source_niche": source_user_niche,
            "target_niche": target_user_niche
        })
        prompt = format_hermes_prompt(AGENT_C_SYSTEM_PROMPT, payload)

        try:
            req = urllib.request.Request(
                self.endpoint,
                data=json.dumps({
                    "model": self.model_name,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.2, "num_predict": 256}
                }).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                response_text = data.get("response", "{}")
                start = response_text.find("{")
                end = response_text.rfind("}") + 1
                if start != -1 and end != 0:
                    return json.loads(response_text[start:end])
        except Exception:
            pass

        # Robust programmatic fallback
        status = "APPROVED_FOR_DM" if composite_score >= 0.70 else "PENDING_MUTUAL_INTEREST"
        icebreaker = f"Noticed your recent perspectives in the {source_user_niche} sphere—would love to exchange thoughts on distributed scalability."

        return {
            "composite_compatibility_score": composite_score,
            "weights_applied": {"w_vector": w_vector, "w_visual": w_visual},
            "connection_status": status,
            "icebreaker_hook": icebreaker,
            "connection_synergy_reason": f"High cognitive resonance across {source_user_niche} and {target_user_niche} domains."
        }
