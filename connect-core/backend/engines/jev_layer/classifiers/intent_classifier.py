"""
Jev High-Speed Deterministic Mapping Classifiers
Executes in under 20ms using lexical token hashes, fast heuristics, and bounded regex matrices.
"""

import time
import math
import re
from typing import List, Dict, Set
from ..models.types import (
    Choice, Score, NicheCategory, FocusComplexityLevel, BehavioralTelemetryPacket
)

NICHE_KEYWORD_BANK: Dict[NicheCategory, Set[str]] = {
    NicheCategory.DEVELOPER: {
        "code", "repo", "rust", "typescript", "kubernetes", "docker", "frontend",
        "backend", "compiler", "algorithm", "git", "latency", "distributed", "api"
    },
    NicheCategory.BUSINESSMAN: {
        "revenue", "ebitda", "cac", "ltv", "margins", "runway", "seed", "series",
        "equity", "merger", "acquisition", "cashflow", "valuation", "b2b", "arr"
    },
    NicheCategory.TRAVELLER: {
        "nomad", "flight", "passport", "visa", "kyoto", "lisbon", "bali", "remote",
        "hostel", "lounge", "timezone", "expats", "hiking", "carryon"
    },
    NicheCategory.CONSPIRACY: {
        "psyop", "cia", "blackrock", "deepstate", "agenda", "matrix", "simulation",
        "redpill", "classified", "whistleblower", "rabbit", "surveillance"
    },
    NicheCategory.GAMER: {
        "fps", "steam", "multiplayer", "discord", "mmorpg", "raid", "esports",
        "gpu", "speedrun", "unreal", "modding", "hitbox", "ping"
    },
    NicheCategory.INVESTOR: {
        "portfolio", "angel", "syndicate", "liquidity", "hedge", "allocator",
        "cap-table", "lp", "gp", "alpha", "yield", "crypto", "dividend"
    }
}

class FastDeterministicClassifier:
    """
    Sub-50ms deterministic mapping engine.
    """

    @staticmethod
    def classify_niche(text: str) -> Choice[NicheCategory]:
        t0 = time.perf_counter()
        tokens = re.findall(r"\b[a-zA-Z-]{3,}\b", text.lower())
        token_set = set(tokens)

        scores: Dict[NicheCategory, int] = {cat: 0 for cat in NICHE_KEYWORD_BANK}
        for cat, keywords in NICHE_KEYWORD_BANK.items():
            scores[cat] = len(token_set.intersection(keywords))

        best_cat = NicheCategory.NONE
        max_score = 0
        total_hits = sum(scores.values())

        for cat, count in scores.items():
            if count > max_score:
                max_score = count
                best_cat = cat

        confidence = (max_score / total_hits) if total_hits > 0 else 0.15
        confidence = min(0.99, max(0.10, confidence))

        elapsed_ms = (time.perf_counter() - t0) * 1000.0

        return Choice[NicheCategory](
            selected=best_cat,
            candidates=list(NICHE_KEYWORD_BANK.keys()) + [NicheCategory.NONE],
            confidence=confidence,
            latency_ms=round(elapsed_ms, 3)
        )

    @staticmethod
    def evaluate_cognitive_complexity(packet: BehavioralTelemetryPacket) -> Score:
        """
        Maps implicit behavioral metrics into an ordered cognitive complexity metric.
        Never uses raw IQ or political tags.
        Derived from:
        - Vocabulary richness (Type-Token Ratio)
        - Syntactic depth (clause lengths, word length)
        - Focus dwell time
        """
        t0 = time.perf_counter()
        text = packet.text_sample.strip()
        words = re.findall(r"\b\w+\b", text)
        word_count = len(words)

        if word_count == 0:
            return Score(
                metric_name="cognitive_complexity",
                raw_value=10.0,
                normalized_scalar=0.10,
                discrete_level=FocusComplexityLevel.LOW,
                latency_ms=0.01
            )

        unique_words = len(set(w.lower() for w in words))
        ttr = unique_words / word_count

        avg_word_len = sum(len(w) for w in words) / word_count
        dwell_factor = min(1.0, packet.dwell_time_ms / 60000.0)  # capped at 60s
        
        # Weighted composite score [0-100]
        # 40% lexical richness (TTR), 30% average word complexity, 30% sustained dwell/focus
        raw_score = (
            (ttr * 40.0) +
            (min(1.0, avg_word_len / 7.0) * 30.0) +
            (dwell_factor * 30.0)
        )
        raw_score = min(99.0, max(5.0, raw_score))
        scalar = raw_score / 100.0

        if scalar < 0.35:
            discrete = FocusComplexityLevel.LOW
        elif scalar < 0.65:
            discrete = FocusComplexityLevel.MEDIUM
        elif scalar < 0.85:
            discrete = FocusComplexityLevel.HIGH
        else:
            discrete = FocusComplexityLevel.ADVANCED

        elapsed_ms = (time.perf_counter() - t0) * 1000.0

        return Score(
            metric_name="cognitive_complexity",
            raw_value=round(raw_score, 2),
            normalized_scalar=round(scalar, 3),
            discrete_level=discrete,
            percentile_rank=round(scalar * 100.0, 1),
            latency_ms=round(elapsed_ms, 3)
        )
