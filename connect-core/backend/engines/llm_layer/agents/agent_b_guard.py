"""
Agent B: Multimodal Guard Engine
Vets user media, detects bot anomalies, and leverages Lexical RAG rules to prevent false-positives.
Also dispatches niche-appropriate third-party validation hooks (GitHub / corporate registry)
to cross-reference identity signals before computing the final trust score.
Aligned with prompt/prompts.txt — temperature ≤ 0.10, strict JSON schema.
"""

import json
import urllib.request
from typing import Any, Dict, Optional

from ..hermes_qwen_prompts import AGENT_B_SYSTEM_PROMPT, format_hermes_prompt
from ..schemas import MAX_INFERENCE_TEMPERATURE, validate_agent_b
from ..tools.validation_hooks import VALIDATION_TOOL_REGISTRY

_NICHE_TOOL_MAP: Dict[str, str] = {
    "developer": "github_developer",
    "businessman": "corporate_registry",
    "investor": "corporate_registry",
}


class AgentBMultimodalGuard:
    def __init__(
        self,
        hermes_endpoint: str = "http://localhost:11434/api/generate",
        model_name: str = "qwen2.5:3b",
        timeout: float = 0.5,
    ):
        self.endpoint = hermes_endpoint
        self.model_name = model_name
        self.timeout = timeout

    def _run_external_validation(
        self, niche: Optional[str], external_id: Optional[str]
    ) -> Dict[str, Any]:
        if not niche or not external_id:
            return {"verification_status": "UNVERIFIED", "latency_ms": 0.0}

        tool_key = _NICHE_TOOL_MAP.get(niche.lower())
        if not tool_key:
            return {"verification_status": "UNVERIFIED", "latency_ms": 0.0}

        tool_fn = VALIDATION_TOOL_REGISTRY.get(tool_key)
        if not tool_fn:
            return {"verification_status": "UNVERIFIED", "latency_ms": 0.0}

        try:
            signal = tool_fn(external_id)
            return signal.model_dump()
        except Exception:
            return {"verification_status": "UNVERIFIED", "latency_ms": 0.0}

    def _fallback(
        self,
        media_metadata: Dict[str, Any],
        ext_signal: Dict[str, Any],
        ext_verified: bool,
        ext_partial: bool,
    ) -> Dict[str, Any]:
        is_bot = media_metadata.get("bot_anomaly_score", 0.1) > 0.8

        base_authenticity = 0.92 if not is_bot else 0.30
        if not ext_verified and not ext_partial:
            base_authenticity = min(base_authenticity, 0.65)
        elif ext_partial:
            base_authenticity = min(base_authenticity, 0.80)

        result = {
            "visual_authenticity_score": base_authenticity,
            "bot_anomaly_detected": is_bot,
            "guardrail_flag": "CLEAN" if not is_bot else "SUSPICIOUS",
            "confidence": 0.88 if not is_bot else 0.50,
            "attenuation_recommended": is_bot or (not ext_verified),
        }
        validated = validate_agent_b(result).model_dump()
        validated["external_validation"] = ext_signal
        return validated

    def evaluate_media_safety(
        self,
        media_metadata: Dict[str, Any],
        source_niche: Optional[str] = None,
        external_identity_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        ext_signal = self._run_external_validation(source_niche, external_identity_id)
        ext_verified = ext_signal.get("verification_status") == "VERIFIED"
        ext_partial = ext_signal.get("verification_status") == "PARTIAL"

        payload = json.dumps(
            {
                "target": "evaluate_media_integrity",
                "metadata": media_metadata,
                "external_validation": ext_signal,
            }
        )
        prompt = format_hermes_prompt(AGENT_B_SYSTEM_PROMPT, payload)

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
                    validated = validate_agent_b(parsed).model_dump()
                    validated["external_validation"] = ext_signal
                    return validated
        except Exception:
            pass

        return self._fallback(media_metadata, ext_signal, ext_verified, ext_partial)
