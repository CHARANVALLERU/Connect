"""
Hermes Desktop / Ollama generate client.

Mirrors prompt/prompts.txt USAGE NOTES:
  POST {endpoint}  model=qwen2.5:3b  stream=false
  options.temperature ≤ 0.10 (default 0.05)
  options.num_predict = 200
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any, Dict, Optional

from .schemas import MAX_INFERENCE_TEMPERATURE

DEFAULT_ENDPOINT = os.environ.get(
    "HERMES_ENDPOINT", "http://localhost:11434/api/generate"
)
DEFAULT_MODEL = os.environ.get("HERMES_MODEL", "qwen2.5:3b")
DEFAULT_TEMPERATURE = 0.05
DEFAULT_NUM_PREDICT = 200


@dataclass
class HermesResponse:
    raw_text: str
    parsed_json: Optional[Dict[str, Any]]
    ok: bool
    error: Optional[str] = None


def _extract_json_object(text: str) -> Optional[Dict[str, Any]]:
    start = text.find("{")
    end = text.rfind("}") + 1
    if start == -1 or end == 0:
        return None
    try:
        return json.loads(text[start:end])
    except json.JSONDecodeError:
        return None


class HermesClient:
    """Thin HTTP client for local Hermes / Ollama generate API."""

    def __init__(
        self,
        endpoint: str = DEFAULT_ENDPOINT,
        model_name: str = DEFAULT_MODEL,
        timeout: float = 1.5,
        temperature: float = DEFAULT_TEMPERATURE,
        num_predict: int = DEFAULT_NUM_PREDICT,
    ):
        if temperature > MAX_INFERENCE_TEMPERATURE:
            raise ValueError(
                f"temperature {temperature} exceeds prompts.txt max "
                f"{MAX_INFERENCE_TEMPERATURE}"
            )
        self.endpoint = endpoint
        self.model_name = model_name
        self.timeout = timeout
        self.temperature = temperature
        self.num_predict = num_predict

    def generate(self, prompt: str) -> HermesResponse:
        body = {
            "model": self.model_name,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": self.temperature,
                "num_predict": self.num_predict,
            },
        }
        try:
            req = urllib.request.Request(
                self.endpoint,
                data=json.dumps(body).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
            text = payload.get("response", "") or ""
            parsed = _extract_json_object(text)
            return HermesResponse(
                raw_text=text,
                parsed_json=parsed,
                ok=parsed is not None,
                error=None if parsed is not None else "No JSON object in model response",
            )
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError) as exc:
            return HermesResponse(
                raw_text="",
                parsed_json=None,
                ok=False,
                error=str(exc),
            )
