"""
TypeSafe Jev Engine Core — System 1 bounded decision layer (<100ms).
Returns typed Choice / Noul / Score outcomes instead of open text.
"""

from __future__ import annotations

from typing import Any, Dict

from .behavior_models import JevCognitiveScore, JevNicheCategorization, JevSafetyNoul
from .classifiers.intent_classifier import FastDeterministicClassifier
from .moderation.ugc_shield import UGCShieldEngine
from .models.types import (
    BehavioralTelemetryPacket,
    FocusComplexityLevel,
    NicheCategory,
    UserTier,
)


class TypeSafeJevEngine:
    def __init__(self, runtime_config: Dict[str, Any] | None = None):
        self.runtime_config = runtime_config or {}
        self.latency_ceiling_ms = 100

    def evaluate_behavior_niche(self, telemetry_payload: Dict[str, Any]) -> JevNicheCategorization:
        text = telemetry_payload.get("interaction_text", "") or ""
        choice = FastDeterministicClassifier.classify_niche(text)
        affinity = choice.selected.value.upper() if choice.selected != NicheCategory.NONE else "NONE"
        # Map NicheCategory enum value → behavior_models literal
        allowed = {"DEVELOPER", "BUSINESSMAN", "TRAVELLER", "CONSPIRACY", "GAMER", "NONE"}
        if affinity not in allowed:
            affinity = "NONE"
        return JevNicheCategorization(
            primary_affinity=affinity,  # type: ignore[arg-type]
            confidence_score=round(float(choice.confidence), 3),
        )

    def evaluate_safety_noul(self, raw_input_string: str) -> JevSafetyNoul:
        noul = UGCShieldEngine.evaluate_content_safety(raw_input_string or "")
        if not noul.verdict:
            return JevSafetyNoul(
                content_clearance="VIOLATION",
                applied_rules=[noul.reasoning_code] if noul.reasoning_code else ["UGC_VIOLATION"],
            )
        # Lightweight secondary markers from blueprint
        lowered = (raw_input_string or "").lower()
        soft_flags = [
            v
            for v in ("bypass_tier", "exploit_coordinates", "inject_malicious_script")
            if v in lowered
        ]
        if soft_flags:
            return JevSafetyNoul(content_clearance="VIOLATION", applied_rules=soft_flags)
        return JevSafetyNoul(content_clearance="SAFE", applied_rules=[])

    def compute_cognitive_score(self, behavioral_metrics: Dict[str, Any]) -> JevCognitiveScore:
        packet = BehavioralTelemetryPacket(
            user_id=str(behavioral_metrics.get("user_id", "anonymous")),
            tier=UserTier.PREMIUM,
            session_id=str(behavioral_metrics.get("session_id", "sess_local")),
            dwell_time_ms=int(behavioral_metrics.get("dwell_time_ms", 0)),
            text_sample=str(behavioral_metrics.get("interaction_text", "")),
        )
        score = FastDeterministicClassifier.evaluate_cognitive_complexity(packet)
        level_map = {
            FocusComplexityLevel.LOW: "LOW",
            FocusComplexityLevel.MEDIUM: "MEDIUM",
            FocusComplexityLevel.HIGH: "HIGH",
            FocusComplexityLevel.ADVANCED: "ADVANCED",
        }
        return JevCognitiveScore(
            fluid_intelligence_tier=level_map[score.discrete_level],  # type: ignore[arg-type]
            attention_span_weight=float(score.normalized_scalar),
        )
