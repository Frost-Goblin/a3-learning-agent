from __future__ import annotations

import json
import os
from typing import Any

from pydantic import BaseModel

from backend.core import APP_SETTINGS_PATH
from backend.providers import (
    CHAT_PROVIDER_OPTIONS,
    EMBEDDING_PROVIDER_OPTIONS,
    provider_base_url,
    provider_default_model,
    public_provider_options,
)
from backend.schemas import ChatProvider, EmbeddingProvider


class Settings(BaseModel):
    chat_provider: ChatProvider = "deepseek"
    embedding_provider: EmbeddingProvider = "dashscope"
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_chat_model: str = "deepseek-v4-pro"
    dashscope_api_key: str = ""
    dashscope_base_url: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    dashscope_embedding_model: str = "text-embedding-v4"

    @property
    def chat_configured(self) -> bool:
        return bool(self.deepseek_api_key and self.deepseek_chat_model and self.deepseek_base_url)

    @property
    def embedding_configured(self) -> bool:
        return bool(self.dashscope_api_key and self.dashscope_embedding_model and self.dashscope_base_url)

    @property
    def llm_configured(self) -> bool:
        return self.chat_configured and self.embedding_configured


def load_app_settings() -> dict[str, Any]:
    if not APP_SETTINGS_PATH.exists():
        return {}
    try:
        payload = json.loads(APP_SETTINGS_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    return payload if isinstance(payload, dict) else {}


def save_app_settings(payload: dict[str, Any]) -> None:
    APP_SETTINGS_PATH.parent.mkdir(parents=True, exist_ok=True)
    APP_SETTINGS_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def get_settings() -> Settings:
    file_settings = load_app_settings()
    settings = Settings(
        chat_provider=os.getenv("CHAT_PROVIDER", "deepseek").strip() or "deepseek",
        embedding_provider=os.getenv("EMBEDDING_PROVIDER", "dashscope").strip() or "dashscope",
        deepseek_api_key=os.getenv("DEEPSEEK_API_KEY", "").strip(),
        deepseek_base_url=os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com").strip(),
        deepseek_chat_model=os.getenv("DEEPSEEK_CHAT_MODEL", "deepseek-v4-pro").strip(),
        dashscope_api_key=os.getenv("DASHSCOPE_API_KEY", "").strip(),
        dashscope_base_url=os.getenv("DASHSCOPE_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1").strip(),
        dashscope_embedding_model=os.getenv("DASHSCOPE_EMBEDDING_MODEL", "text-embedding-v4").strip(),
    )
    for key in Settings.model_fields:
        value = file_settings.get(key)
        if isinstance(value, str):
            setattr(settings, key, value.strip())
    if settings.chat_provider != "custom":
        settings.deepseek_base_url = provider_base_url(CHAT_PROVIDER_OPTIONS, settings.chat_provider)
    if settings.embedding_provider != "custom":
        settings.dashscope_base_url = provider_base_url(EMBEDDING_PROVIDER_OPTIONS, settings.embedding_provider)
    if not settings.deepseek_chat_model and settings.chat_provider != "custom":
        settings.deepseek_chat_model = provider_default_model(CHAT_PROVIDER_OPTIONS, settings.chat_provider)
    if not settings.dashscope_embedding_model and settings.embedding_provider != "custom":
        settings.dashscope_embedding_model = provider_default_model(EMBEDDING_PROVIDER_OPTIONS, settings.embedding_provider)
    return settings


def mask_secret(value: str) -> str:
    if not value:
        return ""
    if len(value) <= 10:
        return "*" * len(value)
    return f"{value[:4]}...{value[-4:]}"


def settings_payload(settings: Settings) -> dict[str, Any]:
    return {
        "chat_configured": settings.chat_configured,
        "embedding_configured": settings.embedding_configured,
        "llm_configured": settings.llm_configured,
        "chat_provider": settings.chat_provider,
        "embedding_provider": settings.embedding_provider,
        "deepseek_api_key_masked": mask_secret(settings.deepseek_api_key),
        "dashscope_api_key_masked": mask_secret(settings.dashscope_api_key),
        "deepseek_base_url": settings.deepseek_base_url,
        "deepseek_chat_model": settings.deepseek_chat_model,
        "dashscope_base_url": settings.dashscope_base_url,
        "dashscope_embedding_model": settings.dashscope_embedding_model,
        "chat_provider_options": public_provider_options(CHAT_PROVIDER_OPTIONS),
        "embedding_provider_options": public_provider_options(EMBEDDING_PROVIDER_OPTIONS),
    }
