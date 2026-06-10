from __future__ import annotations

import json
from typing import Any, Iterator

import httpx
from fastapi import HTTPException

from backend.providers import CHAT_PROVIDER_OPTIONS, EMBEDDING_PROVIDER_OPTIONS, provider_label
from backend.settings_store import Settings

REQUEST_TIMEOUT = httpx.Timeout(180.0, connect=10.0, read=180.0, write=30.0, pool=10.0)
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


def chat_runtime_label(settings: Settings) -> str:
    model = settings.deepseek_chat_model.strip() or "未选择模型"
    return f"所选对话服务 {provider_label(CHAT_PROVIDER_OPTIONS, settings.chat_provider)} / {model}"


def embedding_runtime_label(settings: Settings) -> str:
    model = settings.dashscope_embedding_model.strip() or "未选择模型"
    return f"所选向量服务 {provider_label(EMBEDDING_PROVIDER_OPTIONS, settings.embedding_provider)} / {model}"


def build_chat_completion_request(
    settings: Settings,
    system_prompt: str,
    user_prompt: str,
    temperature: float,
    *,
    stream: bool = False,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "model": settings.deepseek_chat_model,
        "temperature": temperature,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }
    if stream:
        payload["stream"] = True
    return payload


def collect_streamed_chat_content(response: httpx.Response) -> str:
    content_parts: list[str] = []
    for line in response.iter_lines():
        line_text = line.decode("utf-8", errors="ignore") if isinstance(line, bytes) else str(line)
        line_text = line_text.strip()
        if not line_text or not line_text.startswith("data:"):
            continue
        data = line_text.removeprefix("data:").strip()
        if data == "[DONE]":
            break
        try:
            payload = json.loads(data)
        except json.JSONDecodeError:
            continue
        choices = payload.get("choices", [])
        if not choices:
            continue
        delta = choices[0].get("delta", {})
        message = choices[0].get("message", {})
        text = delta.get("content") or message.get("content") or ""
        if text:
            content_parts.append(str(text))
    return "".join(content_parts)


class JsonReplyStreamExtractor:
    def __init__(self) -> None:
        self.state = "search_key"
        self.key_buffer = ""
        self.escaped = False
        self.unicode_buffer = ""
        self.reading_unicode = False

    def feed(self, text: str) -> str:
        output: list[str] = []
        target = '"reply"'
        for char in text:
            if self.state == "search_key":
                self.key_buffer = (self.key_buffer + char)[-len(target) :]
                if self.key_buffer == target:
                    self.state = "after_key"
                continue

            if self.state == "after_key":
                if char == ":":
                    self.state = "before_value"
                continue

            if self.state == "before_value":
                if char == '"':
                    self.state = "in_value"
                continue

            if self.state != "in_value":
                continue

            if self.reading_unicode:
                self.unicode_buffer += char
                if len(self.unicode_buffer) == 4:
                    try:
                        output.append(chr(int(self.unicode_buffer, 16)))
                    except ValueError:
                        output.append("\\u" + self.unicode_buffer)
                    self.unicode_buffer = ""
                    self.reading_unicode = False
                    self.escaped = False
                continue

            if self.escaped:
                escape_map = {
                    '"': '"',
                    "\\": "\\",
                    "/": "/",
                    "b": "\b",
                    "f": "\f",
                    "n": "\n",
                    "r": "\r",
                    "t": "\t",
                }
                if char == "u":
                    self.unicode_buffer = ""
                    self.reading_unicode = True
                else:
                    output.append(escape_map.get(char, char))
                    self.escaped = False
                continue

            if char == "\\":
                self.escaped = True
                continue

            if char == '"':
                self.state = "done"
                continue

            output.append(char)
        return "".join(output)


def iter_streamed_chat_content(response: httpx.Response) -> Iterator[str]:
    for line in response.iter_lines():
        line_text = line.decode("utf-8", errors="ignore") if isinstance(line, bytes) else str(line)
        line_text = line_text.strip()
        if not line_text or not line_text.startswith("data:"):
            continue
        data = line_text.removeprefix("data:").strip()
        if data == "[DONE]":
            break
        try:
            payload = json.loads(data)
        except json.JSONDecodeError:
            continue
        choices = payload.get("choices", [])
        if not choices:
            continue
        delta = choices[0].get("delta", {})
        message = choices[0].get("message", {})
        text = delta.get("content") or message.get("content") or ""
        if text:
            yield str(text)


def stream_chat_json(settings: Settings, system_prompt: str, user_prompt: str) -> Iterator[dict[str, Any]]:
    runtime_label = chat_runtime_label(settings)
    request_payload = build_chat_completion_request(settings, system_prompt, user_prompt, 0.45, stream=True)
    request_headers = {
        "Authorization": f"Bearer {settings.deepseek_api_key}",
        "Content-Type": "application/json",
    }
    content_parts: list[str] = []
    reply_extractor = JsonReplyStreamExtractor()

    try:
        with httpx.Client(timeout=REQUEST_TIMEOUT) as client:
            with client.stream(
                "POST",
                f"{settings.deepseek_base_url.rstrip('/')}/chat/completions",
                headers=request_headers,
                json=request_payload,
            ) as response:
                response.raise_for_status()
                for content_delta in iter_streamed_chat_content(response):
                    content_parts.append(content_delta)
                    reply_delta = reply_extractor.feed(content_delta)
                    if reply_delta:
                        yield {"type": "delta", "text": reply_delta}
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=f"{runtime_label} 调用失败：{exc.response.text}") from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"{runtime_label} 网络错误：{exc}") from exc

    content = "".join(content_parts)
    try:
        yield {"type": "payload", "payload": parse_model_json(content)}
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail=f"模型输出不是合法 JSON：{exc}") from exc


def call_chat_json(settings: Settings, system_prompt: str, user_prompt: str, *, use_stream: bool = False) -> Any:
    last_json_error: json.JSONDecodeError | None = None
    runtime_label = chat_runtime_label(settings)
    prompt_attempts = [
        user_prompt,
        f"{user_prompt}\n\n补充要求：只返回一个 JSON 对象，不要返回任何额外说明。",
    ]
    temperatures = [0.45, 0.15]

    try:
        with httpx.Client(timeout=REQUEST_TIMEOUT) as client:
            for prompt, temperature in zip(prompt_attempts, temperatures):
                request_payload = build_chat_completion_request(settings, system_prompt, prompt, temperature, stream=use_stream)
                request_headers = {
                    "Authorization": f"Bearer {settings.deepseek_api_key}",
                    "Content-Type": "application/json",
                }
                if use_stream:
                    with client.stream(
                        "POST",
                        f"{settings.deepseek_base_url.rstrip('/')}/chat/completions",
                        headers=request_headers,
                        json=request_payload,
                    ) as response:
                        response.raise_for_status()
                        content = collect_streamed_chat_content(response)
                else:
                    response = client.post(
                        f"{settings.deepseek_base_url.rstrip('/')}/chat/completions",
                        headers=request_headers,
                        json=request_payload,
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
        raise HTTPException(status_code=502, detail=f"{runtime_label} 调用失败：{exc.response.text}") from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"{runtime_label} 网络错误：{exc}") from exc

    raise HTTPException(status_code=502, detail=f"模型输出不是合法 JSON：{last_json_error}")


def embed_texts(settings: Settings, texts: list[str]) -> list[list[float]]:
    embeddings: list[list[float]] = []
    runtime_label = embedding_runtime_label(settings)
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
        raise HTTPException(status_code=502, detail=f"{runtime_label} 调用失败：{exc.response.text}") from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"{runtime_label} 网络错误：{exc}") from exc
