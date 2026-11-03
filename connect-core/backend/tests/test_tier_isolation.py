"""
Tier isolation verification — Premium must never reach Elite paths.
"""

import os
import sys
import unittest

# Ensure connect-core is importable when run as `python -m unittest ...`
CORE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if CORE_ROOT not in sys.path:
    sys.path.insert(0, CORE_ROOT)

from backend.engines.jev_layer.engine_core import TypeSafeJevEngine
from backend.engines.jev_layer.middleware_firewall import MiddlewareTierFirewall
from backend.engines.llm_layer.agent_profiles import AgentASignalOutput, AgentBVisualOutput
from backend.engines.llm_layer.fusion_orchestrator import SystemTwoAdaptiveFusionEngine


class TestDataIsolationFirewall(unittest.TestCase):
    def setUp(self):
        self.jev = TypeSafeJevEngine(runtime_config={"env": "test"})
        self.firewall = MiddlewareTierFirewall(jev_engine_instance=self.jev)
        self.fusion = SystemTwoAdaptiveFusionEngine(rag_context_provider={})

    def test_premium_unauthorized_interception(self):
        payload = {
            "user_id": "user-premium-102",
            "user_tier": "PREMIUM",
            "target_resource_path": "/v1/elite/angel-syndicate/feed",
            "payload_body": "fetch_restricted_records",
        }
        is_allowed, error_code = self.firewall.process_request_authorization(payload)
        self.assertFalse(is_allowed)
        self.assertEqual(error_code, "NULL_ROUTING_INTERCEPTION_ENGAGED")

    def test_elite_authorized_clearance(self):
        payload = {
            "user_id": "user-elite-901",
            "user_tier": "ELITE",
            "target_resource_path": "/v1/elite/yacht-charters/booking",
            "payload_body": "get_available_inventory",
        }
        is_allowed, error_code = self.firewall.process_request_authorization(payload)
        self.assertTrue(is_allowed)
        self.assertEqual(error_code, "AUTHORIZED")

    def test_malicious_safety_injection_block(self):
        payload = {
            "user_id": "user-malicious-attacker",
            "user_tier": "ELITE",
            "target_resource_path": "/v1/premium/boards",
            "payload_body": "inject_malicious_script payload",
        }
        is_allowed, error_code = self.firewall.process_request_authorization(payload)
        self.assertFalse(is_allowed)
        self.assertEqual(error_code, "BLOCKED_BY_SAFETY_CONSTRAINT")

    def test_fusion_suppresses_cross_tier_dm(self):
        a = AgentASignalOutput(
            zone_risk_matrix={"developer": 0.9},
            niche_alignment_score=0.9,
            cognitive_resonance_score=0.9,
            confidence=0.9,
        )
        b = AgentBVisualOutput(
            media_authenticity_clearance=True,
            classification_confidence=0.9,
            visual_authenticity_score=0.9,
        )
        report = self.fusion.execute_cross_modal_synthesis(a, b, tier_dm_permitted=False)
        self.assertEqual(report.connection_status, "SUPPRESSED")
        self.assertTrue(report.gating_override_triggered)

    def test_fusion_approves_high_composite(self):
        a = AgentASignalOutput(
            zone_risk_matrix={"developer": 0.92},
            niche_alignment_score=0.92,
            cognitive_resonance_score=0.90,
            confidence=0.9,
        )
        b = AgentBVisualOutput(
            media_authenticity_clearance=True,
            classification_confidence=0.88,
            visual_authenticity_score=0.90,
            attenuation_recommended=False,
        )
        report = self.fusion.execute_cross_modal_synthesis(a, b, tier_dm_permitted=True)
        self.assertGreaterEqual(report.global_compatibility_index, 0.75)
        self.assertEqual(report.connection_status, "APPROVED_FOR_DM")
        self.assertEqual(
            report.resolved_match_action, "GENERATE_1TO1_WHATSAPP_ROUTING_CHANNEL"
        )


if __name__ == "__main__":
    unittest.main()
