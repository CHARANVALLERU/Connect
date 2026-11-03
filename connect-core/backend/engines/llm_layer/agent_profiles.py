"""
System 2 agent output contracts used by the fusion orchestrator.
Aligned with Agent A / B / C roles in prompt/prompts.txt.
"""

from __future__ import annotations

from typing import Dict, List

from pydantic import BaseModel, Field


class AgentASignalOutput(BaseModel):
    zone_risk_matrix: Dict[str, float] = Field(
        description="Calculated vector mapping of target node affinity levels."
    )
    structural_anomalies_detected: List[str] = Field(
        default_factory=list,
        description="Identified pattern breaks inside behavioral inputs.",
    )
    niche_alignment_score: float = Field(default=0.0, ge=0.0, le=1.0)
    cognitive_resonance_score: float = Field(default=0.0, ge=0.0, le=1.0)
    confidence: float = Field(default=0.5, ge=0.0, le=1.0)


class AgentBVisualOutput(BaseModel):
    media_authenticity_clearance: bool = Field(
        description="Verification of user file asset identity markers."
    )
    classification_confidence: float = Field(ge=0.0, le=1.0)
    visual_signature_flags: List[str] = Field(
        default_factory=list,
        description="Safety indicators matching platform imagery filters.",
    )
    visual_authenticity_score: float = Field(default=0.0, ge=0.0, le=1.0)
    attenuation_recommended: bool = False


class AgentCFusionReport(BaseModel):
    global_compatibility_index: float = Field(ge=0.0, le=1.0)
    resolved_match_action: str = Field(
        description="Actionable decision routing execution text path."
    )
    gating_override_triggered: bool = Field(
        description="Security rule execution log variable."
    )
    weights_applied: Dict[str, float] = Field(default_factory=dict)
    icebreaker_hook: str = ""
    connection_status: str = "PENDING_MUTUAL_INTEREST"
