from pydantic import BaseModel, Field
from typing import Literal, List

class JevNicheCategorization(BaseModel):
    primary_affinity: Literal["DEVELOPER", "BUSINESSMAN", "TRAVELLER", "CONSPIRACY", "GAMER", "NONE"] = Field(
        description="Assigned interest domain partition cluster matching interaction data."
    )
    confidence_score: float = Field(ge=0.0, le=1.0, description="Mathematical reliability index.")

class JevSafetyNoul(BaseModel):
    content_clearance: Literal["SAFE", "FLAGGED", "VIOLATION"] = Field(
        description="Real-time execution classification boundary tracker."
    )
    applied_rules: List[str] = Field(default_factory=list, description="List of matched platform constraint keys.")

class JevCognitiveScore(BaseModel):
    fluid_intelligence_tier: Literal["LOW", "MEDIUM", "HIGH", "ADVANCED"] = Field(
        description="Ordered metric score evaluation computed via vocabulary and depth logs."
    )
    attention_span_weight: float = Field(description="Normalized tracking matrix metrics calculation variable.")
