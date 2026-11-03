"""
Agent A: Structured Profile Engine
Interprets behavioral coordinates, vector drift, and niche alignment.
Aligned with prompt/prompts.txt — temperature ≤ 0.10, strict JSON schema.
"""

import json
import urllib.request
from typing import Any, Dict

from ..hermes_qwen_prompts import AGENT_A_SYSTEM_PROMPT, format_hermes_prompt
from ..schemas import MAX_INFERENCE_TEMPERATURE, validate_agent_a


class AgentAProfileEngine:
    def __init__(
        self,
        hermes_endpoint: str = "http://localhost:11434/api/generate",
        model_name: str = "qwen2.5:3b",
        timeout: float = 0.5,
    ):
        self.endpoint = hermes_endpoint
        self.model_name = model_name
        self.timeout = timeout

    def _fallback(
        self, user_1_metrics: Dict[str, Any], user_2_metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        v1 = user_1_metrics.get("cognitive_scalar", 0.5)
        v2 = user_2_metrics.get("cognitive_scalar", 0.5)
        resonance = 1.0 - abs(float(v1) - float(v2))

        niche_1 = str(user_1_metrics.get("primary_niche") or user_1_metrics.get("niche") or "")
        niche_2 = str(user_2_metrics.get("primary_niche") or user_2_metrics.get("niche") or "")
        niche_align = 0.85 if niche_1 and niche_2 else 0.70

        dwell_1 = float(user_1_metrics.get("dwell_time_avg_ms", 30000))
        dwell_2 = float(user_2_metrics.get("dwell_time_avg_ms", 30000))
        velocity = 1.0 - min(1.0, abs(dwell_1 - dwell_2) / max(dwell_1, dwell_2, 1.0))

        themes = []
        if niche_1 and niche_2:
            themes = [f"{niche_1}/{niche_2} crossover", "professional depth"]
        else:
            themes = ["general interest overlap"]

        result = {
            "niche_alignment_score": round(niche_align, 3),
            "cognitive_resonance_score": round(resonance, 3),
            "interaction_velocity_ratio": round(velocity, 3),
            "shared_niche_themes": themes,
            "drift_indicator": "STABLE",
            "confidence": 0.90,
        }
        return validate_agent_a(result).model_dump()

    def evaluate_profile_alignment(
        self, user_1_metrics: Dict[str, Any], user_2_metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Runs local inference via Hermes desktop harness or provides bounded deterministic fallback.
        """
        payload = json.dumps(
            {
                "target": "evaluate_behavioral_alignment",
                "user_source": user_1_metrics,
                "user_candidate": user_2_metrics,
            }
        )
        prompt = format_hermes_prompt(AGENT_A_SYSTEM_PROMPT, payload)

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
                    return validate_agent_a(parsed).model_dump()
        except Exception:
            pass

        return self._fallback(user_1_metrics, user_2_metrics)
