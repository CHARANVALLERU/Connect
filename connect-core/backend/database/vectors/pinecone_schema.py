"""
Pinecone Vector Persistence Layer for Behavioral & Ideological Embeddings
Enforces metadata filtering to lock out Elite vectors from Premium searches.
"""

from typing import List, Dict, Any, Optional
import numpy as np

INDEX_NAME = "connect-behavioral-vectors"
VECTOR_DIMENSION = 384  # Optimized for local fast embedders (e.g. BAAI/bge-small-en-v1.5 or Qwen embed)
METRIC = "cosine"

class PineconeBehavioralIndexManager:
    """
    Manages vector embeddings representing implicit behavioral patterns,
    niche interest trajectories, and vocabulary complexity.
    """

    @staticmethod
    def get_index_configuration() -> Dict[str, Any]:
        return {
            "name": INDEX_NAME,
            "dimension": VECTOR_DIMENSION,
            "metric": METRIC,
            "spec": {
                "serverless": {
                    "cloud": "aws",
                    "region": "us-east-1"
                }
            },
            "metadata_config": {
                "indexed": [
                    "user_id",
                    "tier",
                    "primary_niche",
                    "cognitive_level",
                    "geohash_prefix"
                ]
            }
        }

    @staticmethod
    def construct_tier_gated_filter(
        requester_tier: str,
        geohash_prefix: str,
        target_niche: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Builds Pinecone metadata filter.
        CRITICAL INVARIANT: Premium requesters are mathematically prevented from
        matching Elite vector embeddings.
        """
        filter_dict: Dict[str, Any] = {
            "geohash_prefix": {"$eq": geohash_prefix}
        }

        if requester_tier.lower() == "premium":
            # Exclude all Elite profiles completely from vector distance calculation
            filter_dict["tier"] = {"$eq": "premium"}

        if target_niche and target_niche.lower() != "none":
            filter_dict["primary_niche"] = {"$eq": target_niche.lower()}

        return filter_dict

    @staticmethod
    def format_upsert_payload(
        user_id: str,
        tier: str,
        primary_niche: str,
        cognitive_level: str,
        geohash_prefix: str,
        behavior_vector: List[float]
    ) -> Dict[str, Any]:
        """
        Formats a vector record for upserting into the index.
        """
        assert len(behavior_vector) == VECTOR_DIMENSION, f"Vector dimension must be {VECTOR_DIMENSION}"
        return {
            "id": f"vec_{user_id}",
            "values": behavior_vector,
            "metadata": {
                "user_id": user_id,
                "tier": tier.lower(),
                "primary_niche": primary_niche.lower(),
                "cognitive_level": cognitive_level,
                "geohash_prefix": geohash_prefix
            }
        }
