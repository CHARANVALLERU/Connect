"""
Canonical loader for prompt/prompts.txt (Hermes / Qwen:3.5-4B ChatML blocks).

Resolves the repo-root prompt file first, then falls back to the in-package
copy at llm_layer/prompts.txt. Extracts Agent A / B / C system messages and
builds full ChatML prompts with telemetry payloads substituted.
"""

from __future__ import annotations

import re
from functools import lru_cache
from pathlib import Path
from typing import Dict, Literal, Optional

AgentId = Literal["A", "B", "C"]

_PLACEHOLDERS = {
    "A": "{INSERT USER TELEMETRY PAYLOAD HERE}",
    "B": "{INSERT MEDIA METADATA PAYLOAD HERE}",
    "C": "{INSERT AGENT A + AGENT B RESULTS PAYLOAD HERE}",
}

_AGENT_HEADERS = {
    "A": "AGENT A — STRUCTURED PROFILE ENGINE",
    "B": "AGENT B — MULTIMODAL GUARD ENGINE",
    "C": "AGENT C — ADAPTIVE FUSION ENGINE",
}


def _candidate_prompt_paths() -> list[Path]:
    here = Path(__file__).resolve()
    # connect-core/backend/engines/llm_layer/prompt_loader.py → repo root
    repo_root = here.parents[4]
    connect_core = here.parents[3]
    return [
        repo_root / "prompt" / "prompts.txt",
        connect_core / "backend" / "engines" / "llm_layer" / "prompts.txt",
        here.parent / "prompts.txt",
    ]


@lru_cache(maxsize=1)
def resolve_prompts_file() -> Path:
    for path in _candidate_prompt_paths():
        if path.is_file():
            return path
    raise FileNotFoundError(
        "Could not locate prompts.txt. Expected at prompt/prompts.txt or "
        "connect-core/backend/engines/llm_layer/prompts.txt"
    )


@lru_cache(maxsize=1)
def load_prompts_raw() -> str:
    return resolve_prompts_file().read_text(encoding="utf-8")


def _extract_agent_block(raw: str, agent_id: AgentId) -> str:
    header = _AGENT_HEADERS[agent_id]
    # Split on agent section banners; keep content until next agent or USAGE NOTES
    pattern = re.compile(
        rf"─+\n{re.escape(header)}\n─+\n(.*?)(?=\n─+\nAGENT |\n={10,}|\nUSAGE NOTES)",
        re.DOTALL,
    )
    match = pattern.search(raw)
    if not match:
        raise ValueError(f"Agent {agent_id} block not found in prompts.txt")
    return match.group(1).strip()


def extract_system_prompt(agent_id: AgentId) -> str:
    """Return the system message body (between ChatML system tags) for an agent."""
    block = _extract_agent_block(load_prompts_raw(), agent_id)
    sys_match = re.search(
        r"<\|im_start\|>system\n(.*?)<\|im_end\|>",
        block,
        re.DOTALL,
    )
    if not sys_match:
        raise ValueError(f"System prompt missing for Agent {agent_id}")
    return sys_match.group(1).strip()


def build_chatml_prompt(agent_id: AgentId, user_payload: str) -> str:
    """
    Build the full ChatML prompt for Hermes/Ollama as specified in prompts.txt:
      system → user (payload) → assistant prefix
    """
    block = _extract_agent_block(load_prompts_raw(), agent_id)
    placeholder = _PLACEHOLDERS[agent_id]
    if placeholder not in block:
        raise ValueError(f"Placeholder {placeholder} missing for Agent {agent_id}")
    filled = block.replace(placeholder, user_payload.strip())
    # Ensure trailing assistant turn is present for generation continuation
    if not filled.rstrip().endswith("<|im_start|>assistant"):
        filled = filled.rstrip() + "\n<|im_start|>assistant\n"
    else:
        filled = filled.rstrip() + "\n"
    return filled


def get_all_system_prompts() -> Dict[str, str]:
    return {
        "A": extract_system_prompt("A"),
        "B": extract_system_prompt("B"),
        "C": extract_system_prompt("C"),
    }


def clear_prompt_cache() -> None:
    load_prompts_raw.cache_clear()
    resolve_prompts_file.cache_clear()
