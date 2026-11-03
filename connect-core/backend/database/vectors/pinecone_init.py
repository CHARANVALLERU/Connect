"""
Pinecone vector space bootstrap for ideology_vector + intellect_vector matching.
Falls back gracefully when PINECONE_API_KEY is unset (local / CI).
"""

from __future__ import annotations

import os
from typing import Any, Dict


INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "connect-behavioral-matrix")
VECTOR_DIMENSION = int(os.getenv("PINECONE_DIMENSION", "384"))


def get_index_spec() -> Dict[str, Any]:
    return {
        "name": INDEX_NAME,
        "dimension": VECTOR_DIMENSION,
        "metric": "cosine",
        "metadata_indexed": [
            "user_id",
            "tier",
            "primary_niche",
            "cognitive_level",
            "geohash_prefix",
            "vector_kind",  # ideology_vector | intellect_vector
        ],
    }


def initialize_connect_vector_space() -> Dict[str, Any]:
    api_key = os.getenv("PINECONE_API_KEY", "")
    spec = get_index_spec()

    if not api_key or api_key.startswith("mock"):
        print(
            f"[pinecone_init] Skipping live create (no API key). "
            f"Planned index={spec['name']} dim={spec['dimension']}"
        )
        return {"status": "SKIPPED_LOCAL", "spec": spec}

    try:
        from pinecone import Pinecone, ServerlessSpec

        pc = Pinecone(api_key=api_key)
        existing = pc.list_indexes().names()
        if INDEX_NAME not in existing:
            print(f"Creating vector space: {INDEX_NAME}")
            pc.create_index(
                name=INDEX_NAME,
                dimension=VECTOR_DIMENSION,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1"),
            )
            return {"status": "CREATED", "spec": spec}
        print("Vector engine database mapping active and verified.")
        return {"status": "EXISTS", "spec": spec}
    except Exception as exc:
        print(f"[pinecone_init] Provider error: {exc}")
        return {"status": "ERROR", "error": str(exc), "spec": spec}


if __name__ == "__main__":
    print(initialize_connect_vector_space())
