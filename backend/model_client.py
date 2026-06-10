from __future__ import annotations

import json
from typing import Any

import httpx
from fastapi import HTTPException

from backend.settings_store import Settings

REQUEST_TIMEOUT = 60.0
EMBEDDING_BATCH_SIZE = 10


def parse_model_json(content: str) -> Any:
    cleaned = content.strip().lstrip("\ufeff")
    if cleaned.startswith("```"):
        parts = [segment for segment in cleaned.split("```") if segment.strip()]
        if parts:
            cleaned = parts[0]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:].strip()
    if not cleaned.startswith("{"):
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            cleaned = cleaned[start : end + 1]
    return json.loads(cleaned)


def call_chat_json(settings: Settings, system_prompt: str, user_prompt: str) -> Any:
    last_json_error: json.JSONDecodeError | None = None
    prompt_attempts = [
        user_prompt,
        f"{user_prompt}\n\n补充要求：只返回一个 JSON 对象，不要返回任何额外说明。",
    ]
    temperatures = [0.45, 0.15]

    try:
        with httpx.Client(timeout=REQUEST_TIMEOUT) as client:
            for prompt, temperature in zip(prompt_attempts, temperatures):
                response = client.post(
                    f"{settings.deepseek_base_url.rstrip('/')}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.deepseek_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": settings.deepseek_chat_model,
                        "temperature": temperature,
                        "response_format": {"type": "json_object"},
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": prompt},
                        ],
                    },
                )
                response.raise_for_status()
                payload = response.json()
                content = payload["choices"][0]["message"]["content"]
                try:
                    return parse_model_json(content)
                except json.JSONDecodeError as exc:
                    last_json_error = exc
                    continue
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=f"DeepSeek API 调用失败：{exc.response.text}") from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"DeepSeek API 网络错误：{exc}") from exc

    raise HTTPException(status_code=502, detail=f"模型输出不是合法 JSON：{last_json_error}")


def embed_texts(settings: Settings, texts: list[str]) -> list[list[float]]:
    embeddings: list[list[float]] = []
    try:
        with httpx.Client(timeout=REQUEST_TIMEOUT) as client:
            for start in range(0, len(texts), EMBEDDING_BATCH_SIZE):
                batch = texts[start : start + EMBEDDING_BATCH_SIZE]
                response = client.post(
                    f"{settings.dashscope_base_url.rstrip('/')}/embeddings",
                    headers={
                        "Authorization": f"Bearer {settings.dashscope_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": settings.dashscope_embedding_model,
                        "input": batch,
                        "encoding_format": "float",
                    },
                )
                response.raise_for_status()
                payload = response.json()
                embeddings.extend(item["embedding"] for item in payload.get("data", []))
        return embeddings
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=f"Embedding API 调用失败：{exc.response.text}") from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Embedding API 网络错误：{exc}") from exc
