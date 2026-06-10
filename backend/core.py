from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def load_local_env() -> None:
    root = Path(__file__).resolve().parent.parent
    for candidate in (root / ".env.local", root / ".env"):
        if not candidate.exists():
            continue
        for raw_line in candidate.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip())


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def json_dumps(data: Any) -> str:
    return json.dumps(data, ensure_ascii=False, indent=2)


load_local_env()

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.getenv("A3_DATA_DIR", str(ROOT_DIR / "data"))).resolve()
SESSIONS_DIR = DATA_DIR / "sessions"
MATERIALS_DIR = DATA_DIR / "materials"
APP_SETTINGS_PATH = DATA_DIR / "app_settings.json"

SESSIONS_DIR.mkdir(parents=True, exist_ok=True)
MATERIALS_DIR.mkdir(parents=True, exist_ok=True)
