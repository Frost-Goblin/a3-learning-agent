from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from fastapi import HTTPException

from backend.core import SESSIONS_DIR, json_dumps, now_iso


def session_path(session_id: str) -> Path:
    return SESSIONS_DIR / f"{session_id}.json"


def save_session(payload: dict[str, Any]) -> None:
    payload["updated_at"] = now_iso()
    session_path(payload["session_id"]).write_text(json_dumps(payload), encoding="utf-8")


def load_session(session_id: str) -> dict[str, Any]:
    path = session_path(session_id)
    if not path.exists():
        raise HTTPException(status_code=404, detail="session not found")
    return json.loads(path.read_text(encoding="utf-8"))


def delete_session_file(session_id: str) -> None:
    path = session_path(session_id)
    if not path.exists():
        raise HTTPException(status_code=404, detail="session not found")
    path.unlink()
