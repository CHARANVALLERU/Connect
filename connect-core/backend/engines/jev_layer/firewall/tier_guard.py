"""
The Elite Protection Firewall Middleware (System 1 Gate)
Executes in under 10ms. Prevents unauthorized Premium users from discovering, querying,
or messaging Elite users or exclusive Elite communities (/c/angel-syndicate, /c/yacht-charters).
"""

import time
from typing import Optional, Dict, Any, List
from ..models.types import UserTier, TierRoutingDecision, Choice, Noul

ELITE_EXCLUSIVE_COMMUNITIES = {
    "c/angel-syndicate",
    "c/yacht-charters",
    "c/private-equity",
    "c/family-offices",
    "c/hyper-scale"
}

class EliteFirewallGuard:
    """
    Sub-10ms deterministic firewall protecting Elite tier resources.
    """

    @classmethod
    def evaluate_resource_access(
        cls,
        requester_tier: UserTier,
        target_resource_id: str,
        is_target_community: bool = False,
        is_target_user_elite: bool = False,
        elite_has_initiated_contact: bool = False
    ) -> Choice[TierRoutingDecision]:
        t0 = time.perf_counter()

        candidates = [
            TierRoutingDecision.ALLOW,
            TierRoutingDecision.BLOCK,
            TierRoutingDecision.ROUTE_TO_PREMIUM
        ]

        # Case 1: Requester is Elite -> Full access everywhere
        if requester_tier == UserTier.ELITE:
            elapsed_ms = (time.perf_counter() - t0) * 1000.0
            return Choice[TierRoutingDecision](
                selected=TierRoutingDecision.ALLOW,
                candidates=candidates,
                confidence=1.0,
                latency_ms=round(elapsed_ms, 3)
            )

        # Case 2: Requester is Premium trying to access Elite Community
        if is_target_community and any(target_resource_id.endswith(e) or target_resource_id == e for e in ELITE_EXCLUSIVE_COMMUNITIES):
            elapsed_ms = (time.perf_counter() - t0) * 1000.0
            return Choice[TierRoutingDecision](
                selected=TierRoutingDecision.BLOCK,
                candidates=candidates,
                confidence=1.0,
                latency_ms=round(elapsed_ms, 3)
            )

        # Case 3: Requester is Premium trying to access or direct message an Elite user
        if is_target_user_elite:
            # Premium users cannot initiate contact or view Elite profiles unless Elite initiated contact
            if elite_has_initiated_contact:
                decision = TierRoutingDecision.ALLOW
            else:
                decision = TierRoutingDecision.BLOCK
            
            elapsed_ms = (time.perf_counter() - t0) * 1000.0
            return Choice[TierRoutingDecision](
                selected=decision,
                candidates=candidates,
                confidence=1.0,
                latency_ms=round(elapsed_ms, 3)
            )

        # Case 4: Standard public community or Premium user interaction
        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        return Choice[TierRoutingDecision](
            selected=TierRoutingDecision.ALLOW,
            candidates=candidates,
            confidence=0.99,
            latency_ms=round(elapsed_ms, 3)
        )

    @classmethod
    def sanitize_discovery_feed(
        cls,
        requester_tier: UserTier,
        raw_candidate_profiles: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Fast memory filter stripping out any Elite profiles or ghost-mode identities
        from a discovery query executed by a Premium user.
        """
        if requester_tier == UserTier.ELITE:
            return raw_candidate_profiles

        # For Premium tier: completely purge any profile flagged as ELITE or ghost_mode
        sanitized = []
        for profile in raw_candidate_profiles:
            if profile.get("tier") == UserTier.ELITE or profile.get("ghost_mode", False):
                continue
            sanitized.append(profile)

        return sanitized

    @classmethod
    def verify_message_dispatch(
        cls,
        sender_tier: UserTier,
        recipient_tier: UserTier,
        conversation_initiated_by: UserTier
    ) -> Noul:
        """
        Determines whether 1:1 direct message is permitted under platform gating rules.
        """
        t0 = time.perf_counter()

        permitted = True
        reason = "ALLOWED_STANDARD"

        if sender_tier == UserTier.PREMIUM and recipient_tier == UserTier.ELITE:
            if conversation_initiated_by != UserTier.ELITE:
                permitted = False
                reason = "PREMIUM_CANNOT_INITIATE_TO_ELITE"
            else:
                permitted = True
                reason = "ELITE_INITIATED_CONVERSATION_OPEN"

        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        return Noul(
            assertion="is_dm_dispatch_permitted",
            verdict=permitted,
            probability=1.0 if permitted else 0.0,
            threshold=0.50,
            latency_ms=round(elapsed_ms, 3),
            reasoning_code=reason
        )
