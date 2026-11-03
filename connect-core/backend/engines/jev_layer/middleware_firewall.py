"""
Elite Protection Middleware — System 1 ingress gate (<100ms).
Premium requests targeting Elite paths are null-routed immediately.
"""

from __future__ import annotations

import time
from typing import Any, Dict, Tuple

from .engine_core import TypeSafeJevEngine
from .firewall.tier_guard import EliteFirewallGuard
from .models.types import TierRoutingDecision, UserTier


class MiddlewareTierFirewall:
    def __init__(self, jev_engine_instance: TypeSafeJevEngine | None = None):
        self.jev = jev_engine_instance or TypeSafeJevEngine({"env": "runtime"})

    def process_request_authorization(
        self, request_metadata: Dict[str, Any]
    ) -> Tuple[bool, str]:
        start_time = time.perf_counter()

        safety_check = self.jev.evaluate_safety_noul(
            request_metadata.get("payload_body", "") or ""
        )
        if safety_check.content_clearance == "VIOLATION":
            return False, "BLOCKED_BY_SAFETY_CONSTRAINT"

        raw_tier = str(request_metadata.get("user_tier", "PREMIUM")).upper()
        user_tier = UserTier.ELITE if raw_tier == "ELITE" else UserTier.PREMIUM
        target_resource = str(request_metadata.get("target_resource_path", ""))

        is_elite_path = "/v1/elite/" in target_resource or "/api/v1/elite/" in target_resource
        if is_elite_path:
            decision = EliteFirewallGuard.evaluate_resource_access(
                requester_tier=user_tier,
                target_resource_id=target_resource.split("/")[-1] or "c/angel-syndicate",
                is_target_community=True,
            )
            if decision.selected == TierRoutingDecision.BLOCK or user_tier != UserTier.ELITE:
                _ = (time.perf_counter() - start_time) * 1000
                return False, "NULL_ROUTING_INTERCEPTION_ENGAGED"

        return True, "AUTHORIZED"
