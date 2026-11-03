"""
Multi-Agent Fusion Graph Validation Test
Verifies Agent A / B / C against prompt/prompts.txt invariants:
  - temperature-safe deterministic fallbacks
  - W_vec / W_vis ∈ [0.20, 0.80]
  - APPROVED_FOR_DM requires composite ≥ 0.75
"""

import unittest

from ..graphs.fusion_graph import ConnectFusionGraph, MatchState
from ..schemas import APPROVED_COMPOSITE_THRESHOLD, validate_agent_c, weights_within_bounds


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
                "dwell_time_avg_ms": 42000,
            },
            "user_2_metrics": {
                "cognitive_scalar": 0.79,
                "niche": "businessman",
                "dwell_time_avg_ms": 38000,
            },
            "media_metadata": {
                "bot_anomaly_score": 0.05,
                "face_confidence": 0.94,
            },
            "agent_a_results": None,
            "agent_b_results": None,
            "final_fusion_result": None,
            "status": "INITIALIZED",
        }

        result_state = self.graph.run_graph(initial_state)

        self.assertIsNotNone(result_state["agent_a_results"])
        self.assertIsNotNone(result_state["agent_b_results"])
        self.assertIsNotNone(result_state["final_fusion_result"])

        fusion = result_state["final_fusion_result"]
        validated = validate_agent_c(fusion)
        self.assertIn(
            validated.connection_status,
            {"APPROVED_FOR_DM", "PENDING_MUTUAL_INTEREST", "SUPPRESSED"},
        )
        self.assertTrue(
            weights_within_bounds(
                validated.weights_applied.w_vector,
                validated.weights_applied.w_visual,
            )
        )
        self.assertGreater(validated.composite_compatibility_score, 0.6)

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
                "bot_anomaly_score": 0.95,
                "face_confidence": 0.20,
            },
            "agent_a_results": None,
            "agent_b_results": None,
            "final_fusion_result": None,
            "status": "INITIALIZED",
        }

        result_state = self.graph.run_graph(initial_state)
        fusion = result_state["final_fusion_result"]

        weights = fusion.get("weights_applied", {})
        self.assertEqual(weights.get("w_visual"), 0.20)
        self.assertEqual(weights.get("w_vector"), 0.80)

    def test_premium_to_elite_dm_is_suppressed(self):
        initial_state: MatchState = {
            "source_user_id": "usr_prem_1",
            "source_tier": "premium",
            "target_user_id": "usr_elite_9",
            "target_tier": "elite",
            "source_niche": "investor",
            "target_niche": "investor",
            "user_1_metrics": {"cognitive_scalar": 0.90, "primary_niche": "investor"},
            "user_2_metrics": {"cognitive_scalar": 0.91, "primary_niche": "investor"},
            "media_metadata": {"bot_anomaly_score": 0.01, "face_confidence": 0.99},
            "agent_a_results": None,
            "agent_b_results": None,
            "final_fusion_result": None,
            "status": "INITIALIZED",
        }
        result = self.graph.run_graph(initial_state)
        self.assertEqual(
            result["final_fusion_result"]["connection_status"], "SUPPRESSED"
        )

    def test_approved_threshold_is_075(self):
        self.assertEqual(APPROVED_COMPOSITE_THRESHOLD, 0.75)


if __name__ == "__main__":
    unittest.main()
