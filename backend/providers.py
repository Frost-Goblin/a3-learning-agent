from __future__ import annotations

from typing import Any


CHAT_PROVIDER_OPTIONS = [
    {
        "id": "deepseek",
        "label": "DeepSeek",
        "base_url": "https://api.deepseek.com",
        "models": ["deepseek-v4-pro", "deepseek-v4-flash", "deepseek-chat", "deepseek-reasoner"],
    },
    {
        "id": "qwen",
        "label": "通义千问",
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "models": ["qwen3.7-max", "qwen3.7-plus", "qwen3.6-plus", "qwen3.6-flash", "qwen3-coder-plus"],
    },
    {
        "id": "openai",
        "label": "OpenAI",
        "base_url": "https://api.openai.com/v1",
        "models": ["gpt-5.5", "gpt-5.4", "gpt-5.4-mini", "gpt-4.1-mini", "gpt-4.1"],
    },
    {
        "id": "moonshot",
        "label": "Kimi",
        "base_url": "https://api.moonshot.cn/v1",
        "models": ["kimi-k2.6", "kimi-k2.5", "moonshot-v1-128k", "moonshot-v1-32k", "moonshot-v1-8k"],
    },
    {
        "id": "siliconflow",
        "label": "硅基流动",
        "base_url": "https://api.siliconflow.cn/v1",
        "models": ["deepseek-ai/DeepSeek-V3.2-Exp", "deepseek-ai/DeepSeek-V3.1", "Qwen/Qwen3-235B-A22B-Instruct-2507"],
    },
]

EMBEDDING_PROVIDER_OPTIONS = [
    {
        "id": "dashscope",
        "label": "千问向量",
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "models": ["text-embedding-v4", "text-embedding-v3", "text-embedding-v2"],
    },
    {
        "id": "openai",
        "label": "OpenAI",
        "base_url": "https://api.openai.com/v1",
        "models": ["text-embedding-3-small", "text-embedding-3-large"],
    },
    {
        "id": "siliconflow",
        "label": "硅基流动",
        "base_url": "https://api.siliconflow.cn/v1",
        "models": ["BAAI/bge-m3", "netease-youdao/bce-embedding-base_v1", "BAAI/bge-large-zh-v1.5"],
    },
]

PROVIDER_LABELS = {
    "deepseek": "DeepSeek",
    "qwen": "通义千问",
    "openai": "OpenAI",
    "moonshot": "Kimi",
    "siliconflow": "硅基流动",
    "dashscope": "千问向量",
    "custom": "自定义接口",
}


def provider_option(options: list[dict[str, Any]], provider_id: str) -> dict[str, Any]:
    return next((item for item in options if item["id"] == provider_id), options[0])


def provider_base_url(options: list[dict[str, Any]], provider_id: str) -> str:
    return str(provider_option(options, provider_id)["base_url"])


def provider_default_model(options: list[dict[str, Any]], provider_id: str) -> str:
    models = provider_option(options, provider_id).get("models", [])
    return str(models[0]) if models else ""


def public_provider_options(options: list[dict[str, Any]]) -> list[dict[str, Any]]:
    public_options = [{**item, "label": PROVIDER_LABELS.get(str(item.get("id", "")), str(item.get("label", "")))} for item in options]
    if not any(item.get("id") == "custom" for item in public_options):
        public_options.append({"id": "custom", "label": PROVIDER_LABELS["custom"], "base_url": "", "models": []})
    return public_options


def provider_label(options: list[dict[str, Any]], provider_id: str) -> str:
    if provider_id == "custom":
        return PROVIDER_LABELS.get("custom", "自定义接口")
    option = provider_option(options, provider_id)
    return PROVIDER_LABELS.get(provider_id, str(option.get("label") or provider_id))
