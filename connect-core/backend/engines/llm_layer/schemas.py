"""
Pydantic schemas for Hermes Agent A / B / C JSON outputs.
Enforces prompts.txt contracts and fusion weight invariants:
  W_vec ∈ [0.20, 0.80], W_vis ∈ [0.20, 0.80]
"""

from __future__ import annotations

from typing import List, Literal

from pydantic import BaseModel, Field, field_validator, model_validator

WEIGHT_MIN = 0.20
WEIGHT_MAX = 0.80
APPROVED_COMPOSITE_THRESHOLD = 0.75
MAX_INFERENCE_TEMPERATURE = 0.10


class AgentAProfileResult(BaseModel):
    niche_alignment_score: float = Field(ge=0.0, le=1.0)
    cognitive_resonance_score: float = Field(ge=0.0, le=1.0)
    interaction_velocity_ratio: float = Field(ge=0.0, le=1.0)
    shared_niche_themes: List[str] = Field(default_factory=list)
    drift_indicator: Literal["STABLE", "EXPANDING", "DIVERGING"]
    confidence: float = Field(ge=0.0, le=1.0)


class AgentBGuardResult(BaseModel):
    visual_authenticity_score: float = Field(ge=0.0, le=1.0)
    bot_anomaly_detected: bool
    guardrail_flag: Literal["CLEAN", "SUSPICIOUS", "POLICY_VIOLATION"]
    confidence: float = Field(ge=0.0, le=1.0)
    attenuation_recommended: bool


class FusionWeights(BaseModel):
    w_vector: float
    w_visual: float

    @field_validator("w_vector", "w_visual")
    @classmethod
    def weight_in_bounds(cls, v: float) -> float:
        if not (WEIGHT_MIN <= v <= WEIGHT_MAX):
            raise ValueError(
                f"Fusion weight {v} outside hard invariant [{WEIGHT_MIN}, {WEIGHT_MAX}]"
            )
        return round(v, 3)

    @model_validator(mode="after")
    def weights_sum_near_one(self) -> "FusionWeights":
        total = self.w_vector + self.w_visual
        if abs(total - 1.0) > 0.02:
            raise ValueError(f"w_vector + w_visual must ≈ 1.0 (got {total})")
        return self


class AgentCFusionResult(BaseModel):
    composite_compatibility_score: float = Field(ge=0.0, le=1.0)
    weights_applied: FusionWeights
    connection_status: Literal[
        "APPROVED_FOR_DM", "PENDING_MUTUAL_INTEREST", "SUPPRESSED"
    ]
    icebreaker_hook: str = Field(min_length=1)
    connection_synergy_reason: str = Field(min_length=1)


def validate_agent_a(payload: dict) -> AgentAProfileResult:
    return AgentAProfileResult.model_validate(payload)


def validate_agent_b(payload: dict) -> AgentBGuardResult:
    # Strip optional extension keys (e.g. external_validation) before schema check
    core = {
        k: payload[k]
        for k in (
            "visual_authenticity_score",
            "bot_anomaly_detected",
            "guardrail_flag",
            "confidence",
            "attenuation_recommended",
        )
        if k in payload
    }
    return AgentBGuardResult.model_validate(core)


def validate_agent_c(payload: dict) -> AgentCFusionResult:
    return AgentCFusionResult.model_validate(payload)


def weights_within_bounds(w_vector: float, w_visual: float) -> bool:
    return (
        WEIGHT_MIN <= w_vector <= WEIGHT_MAX
        and WEIGHT_MIN <= w_visual <= WEIGHT_MAX
    )
