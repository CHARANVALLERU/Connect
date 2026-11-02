"""
Jev System 1 UGC Shielding Framework
App Store & Play Store mandatory real-time safety gate.
Screening executes in sub-15ms before transactions land in persistent objects.
"""

import time
import re
from ..models.types import Noul

VIOLATION_PATTERNS = [
    # Severe policy / harassment / hate markers
    r"\b(kill\s+yourself|die\s+in\s+a|bomb\s+threat|terrorist\s+attack|doxx|swatting)\b",
    # Prompt injection / jailbreak attempts
    r"(ignore\s+(all\s+)?previous\s+instructions|system\s+prompt|reveal\s+(api\s+)?key|as\s+an\s+unfiltered\s+ai|dan\s+mode)",
    # Raw financial harvesting scams
    r"\b(send\s+me\s+your\s+(seed\s+phrase|private\s+key|credit\s+card|cvv|bank\s+password))\b"
]

COMPILED_PATTERNS = [re.compile(p, re.IGNORECASE) for p in VIOLATION_PATTERNS]

class UGCShieldEngine:
    """
    Sub-15ms deterministic UGC safety guard.
    Returns a Jev Noul indicating whether the content is safe or violates policy.
    """

    @classmethod
    def evaluate_content_safety(cls, text: str) -> Noul:
        t0 = time.perf_counter()
        clean_text = text.strip()

        matched_violation = None
        for pattern in COMPILED_PATTERNS:
            match = pattern.search(clean_text)
            if match:
                matched_violation = match.group(0)
                break

        elapsed_ms = (time.perf_counter() - t0) * 1000.0

        if matched_violation:
            return Noul(
                assertion="is_ugc_policy_compliant",
                verdict=False,
                probability=0.98,
                threshold=0.50,
                latency_ms=round(elapsed_ms, 3),
                reasoning_code=f"VIOLATION_TRIGGERED: {matched_violation[:20]}"
            )

        return Noul(
            assertion="is_ugc_policy_compliant",
            verdict=True,
            probability=0.01,
            threshold=0.50,
            latency_ms=round(elapsed_ms, 3),
            reasoning_code="UGC_INSPECTION_PASS"
        )
