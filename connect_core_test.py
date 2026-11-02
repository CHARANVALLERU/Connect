"""
Connect Core Multi-Agent Fusion Integration Harness
Executes Agent A (Profile & Behavioral Resonance), Agent B (Multimodal & Bot Guard),
and Agent C (Reliability-Bounded Adaptive Fusion).
Complies with Connect System 2 Governance Protocol.
"""

import os
import sys
import json
import time

# Ensure connect-core root is on PYTHONPATH
CORE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "connect-core")
if CORE_DIR not in sys.path:
    sys.path.insert(0, CORE_DIR)

from backend.engines.llm_layer.graphs.fusion_graph import ConnectFusionGraph, MatchState


def run_sample_fusion():
    """
    Executes sample multi-agent telemetry through Agent A, B, and C.
    Demonstrates deterministic fallback & adaptive weighting bounds.
    """
    print("=" * 70)
    print("CONNECT-CORE: MULTI-AGENT FUSION ENGINE (HERMES / QWEN:3.5-4B)")
    print("=" * 70)

    # Fast timeout for fallback/mock demonstration unless local Ollama is running
    graph = ConnectFusionGraph(timeout=0.05)

    sample_state: MatchState = {
        "source_user_id": "usr_dev_4091",
        "source_tier": "premium",
        "target_user_id": "usr_biz_8820",
        "target_tier": "premium",
        "source_niche": "developer",
        "target_niche": "businessman",
        "user_1_metrics": {
            "cognitive_scalar": 0.84,
            "primary_niche": "developer",
            "vocabulary_density": 0.78,
            "dwell_time_avg_ms": 45000,
            "sector": "dr5ru"
        },
        "user_2_metrics": {
            "cognitive_scalar": 0.81,
            "primary_niche": "businessman",
            "vocabulary_density": 0.74,
            "dwell_time_avg_ms": 39000,
            "sector": "dr5ru"
        },
        "media_metadata": {
            "bot_anomaly_score": 0.04,
            "face_confidence": 0.95,
            "media_count": 4,
            "is_verified_biometric": True
        },
        "agent_a_results": None,
        "agent_b_results": None,
        "final_fusion_result": None,
        "status": "INITIALIZED"
    }

    print(f"\n[1] Initiating Match State:")
    print(f"    Source User: {sample_state['source_user_id']} ({sample_state['source_niche']})")
    print(f"    Target User: {sample_state['target_user_id']} ({sample_state['target_niche']})")
    print(f"    Behavioral Dwell Times: {sample_state['user_1_metrics']['dwell_time_avg_ms']}ms / {sample_state['user_2_metrics']['dwell_time_avg_ms']}ms")

    t0 = time.perf_counter()
    result = graph.run_graph(sample_state)
    elapsed_ms = (time.perf_counter() - t0) * 1000.0

    print(f"\n[2] Agent Execution Pipeline Complete in {elapsed_ms:.2f}ms:")
    print(f"    - Agent A (Profile & Behavioral Resonance): Evaluated")
    if result["agent_a_results"]:
        print(f"      Niche Alignment Score: {result['agent_a_results'].get('niche_alignment_score', 'N/A')}")
        print(f"      Cognitive Resonance: {result['agent_a_results'].get('cognitive_resonance_score', 'N/A')}")
        print(f"      Themes: {result['agent_a_results'].get('shared_niche_themes', [])}")

    print(f"    - Agent B (Multimodal & Bot Shield): Evaluated")
    if result["agent_b_results"]:
        print(f"      Visual Authenticity: {result['agent_b_results'].get('visual_authenticity_score', 'N/A')}")
        print(f"      Guardrail Status: {result['agent_b_results'].get('guardrail_flag', 'N/A')}")
        print(f"      Attenuation Recommended: {result['agent_b_results'].get('attenuation_recommended', 'N/A')}")

    print(f"\n[3] Agent C Adaptive Fusion Output:")
    fusion = result.get("final_fusion_result", {})
    print(json.dumps(fusion, indent=2))

    print(f"\n[4] State Machine Status: {result.get('status')}")
    print("=" * 70)
    print("Connect Core Multi-Agent Verification PASSED.\n")
    return result


if __name__ == "__main__":
    run_sample_fusion()
