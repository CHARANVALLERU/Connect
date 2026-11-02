"""
Multi-Agent Fusion Graph Validation Test
Verifies Agent A (profile), Agent B (multimodal guard), and Agent C (adaptive fusion) execution.
"""

import unittest
from ..graphs.fusion_graph import ConnectFusionGraph, MatchState

class TestConnectFusionGraph(unittest.TestCase):

    def setUp(self):
        self.graph = ConnectFusionGraph(timeout=0.01)

    def test_full_fusion_flow_with_adaptive_weighting(self):
        initial_state: MatchState = {
            "source_user_id": "usr_dev_101",
            "source_tier": "premium",
            "target_user_id": "usr_biz_202",
            "target_tier": "premium",
            "source_niche": "developer",
            "target_niche": "businessman",
            "user_1_metrics": {
                "cognitive_scalar": 0.82,
                "niche": "developer",
                "dwell_time_avg_ms": 42000
            },
            "user_2_metrics": {
                "cognitive_scalar": 0.79,
                "niche": "businessman",
                "dwell_time_avg_ms": 38000
            },
            "media_metadata": {
                "bot_anomaly_score": 0.05,
                "face_confidence": 0.94
            },
            "agent_a_results": None,
            "agent_b_results": None,
            "final_fusion_result": None,
            "status": "INITIALIZED"
        }

        result_state = self.graph.run_graph(initial_state)

        # Invariant Assertions
        self.assertIsNotNone(result_state["agent_a_results"])
        self.assertIsNotNone(result_state["agent_b_results"])
        self.assertIsNotNone(result_state["final_fusion_result"])

        fusion = result_state["final_fusion_result"]
        self.assertIn("composite_compatibility_score", fusion)
        self.assertIn("connection_status", fusion)
        self.assertIn("icebreaker_hook", fusion)
        self.assertGreater(fusion["composite_compatibility_score"], 0.6)

    def test_adaptive_weighting_attenuation_on_suspicious_media(self):
        initial_state: MatchState = {
            "source_user_id": "usr_dev_101",
            "source_tier": "premium",
            "target_user_id": "usr_bot_303",
            "target_tier": "premium",
            "source_niche": "developer",
            "target_niche": "developer",
            "user_1_metrics": {"cognitive_scalar": 0.80},
            "user_2_metrics": {"cognitive_scalar": 0.75},
            "media_metadata": {
                "bot_anomaly_score": 0.95,  # Heavy bot anomaly
                "face_confidence": 0.20
            },
            "agent_a_results": None,
            "agent_b_results": None,
            "final_fusion_result": None,
            "status": "INITIALIZED"
        }

        result_state = self.graph.run_graph(initial_state)
        fusion = result_state["final_fusion_result"]

        # When media is suspicious, visual weight MUST drop to 0.20 and vector weight scale to 0.80
        weights = fusion.get("weights_applied", {})
        self.assertEqual(weights.get("w_visual"), 0.20)
        self.assertEqual(weights.get("w_vector"), 0.80)

if __name__ == "__main__":
    unittest.main()
