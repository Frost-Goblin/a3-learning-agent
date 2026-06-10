from __future__ import annotations

import json
import math
import re
import uuid
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend.online_resources import TAG_CATALOG, recommend_online_resources, resolve_profile_recommendation_tags
from backend.model_client import call_chat_json, embed_texts
from backend.core import MATERIALS_DIR, SESSIONS_DIR, json_dumps, now_iso
from backend.providers import CHAT_PROVIDER_OPTIONS, EMBEDDING_PROVIDER_OPTIONS, provider_base_url, provider_default_model
from backend.schemas import (
    AppSettingsUpdate,
    ArtifactKind,
    ArtifactRequest,
    ChatMessageRequest,
    ChatSessionRequest,
    CourseId,
    ExerciseReferenceRequest,
    ExerciseReviewRequest,
    GenerateRequest,
    OnlineResourceRequest,
    PathAssessmentRequest,
    PathProgressRequest,
    ProfileSummaryRequest,
    RenameSessionRequest,
)
from backend.settings_store import Settings, get_settings, load_app_settings, save_app_settings, settings_payload
from backend.session_store import delete_session_file, load_session, save_session, session_path

app = FastAPI(title="A3 个性化学习助手", version="0.4.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

EMBEDDING_TOP_K = 5
MAX_CHAT_HISTORY = 10
MAX_DOC_CHARS = 900
MAX_DOC_OVERLAP = 120
COLLABORATION_ROLES = {
    "diagnosis": "了解你的情况",
    "materials": "匹配学习依据",
    "content": "设计学习内容",
    "path": "安排学习路径",
    "feedback": "跟进练习反馈",
}

COURSES: dict[str, dict[str, Any]] = {
    "python": {
        "id": "python",
        "badge": "代码实战",
        "name": "Python 程序设计",
        "summary": "适合通过对话梳理学习目标，再生成讲解、练习和项目案例。",
        "difficulty": "中等",
        "seeds": ["变量与数据类型", "分支与循环", "函数与模块", "文件处理", "面向对象", "异常与调试"],
        "deliverables": ["讲解提纲", "练习建议", "代码案例", "扩展阅读", "学习路径"],
        "painPoint": "很多学生能写零散代码，但不会把知识点组织成可复用的小项目。",
        "opening_prompt": "先和我说说你学 Python 是为了什么，目前最卡的是哪一块？",
    },
}
PROFILES: dict[str, dict[str, Any]] = {
    "novice": {
        "id": "novice",
        "name": "零基础学生",
        "summary": "刚开始接触课程，需要更多示例和分步讲解。",
        "dimensions": {
            "knowledge": "基础薄弱",
            "pace": "偏慢",
            "preference": "示例驱动",
            "weakness": "概念易混",
            "motivation": "先完成课程任务",
            "evaluation": "需要即时反馈",
        },
    },
    "transfer": {
        "id": "transfer",
        "name": "转专业学生",
        "summary": "有学习意愿，但前置基础不稳定。",
        "dimensions": {
            "knowledge": "中等偏低",
            "pace": "中等",
            "preference": "案例驱动",
            "weakness": "体系不完整",
            "motivation": "补齐基础",
            "evaluation": "需要阶段检查",
        },
    },
    "competition": {
        "id": "competition",
        "name": "进阶学生",
        "summary": "基础较好，希望快速拿到高质量练习和项目任务。",
        "dimensions": {
            "knowledge": "较强",
            "pace": "偏快",
            "preference": "项目驱动",
            "weakness": "表达和复盘不足",
            "motivation": "冲刺成果",
            "evaluation": "需要更高强度挑战",
        },
    },
}

SYSTEM_PROMPTS = {
    "chat": (
        "你是一名高校课程学习助手。你要通过自然对话了解学生的学习目标、基础、困难点、"
        "时间安排和偏好。每次只推进一个最关键的问题，不要一次问很多项，不要提前生成学习资料。"
        "当信息还不够时继续追问，当信息足够时用自然语言告诉对方可以开始生成学习方案。"
        "必须输出严格 JSON，不要输出 Markdown。"
    ),
    "profile": (
        "你是一名学习顾问。请基于完整对话总结学生画像，输出清晰、克制、可用于学习支持的 JSON。"
        "不要输出推理过程，不要输出 Markdown。"
    ),
    "resources": (
        "你是一名课程学习规划助手。请基于课程信息、学生画像和检索到的课程资料，"
        "输出适合学生当前阶段的学习资源方案 JSON。内容必须面向学生表达，不要暴露系统实现细节。"
    ),
    "path": (
        "你是一名课程学习路径规划助手。请基于学生画像和已生成资源，"
        "输出按阶段安排的学习路径 JSON。语言面向学生，不要输出系统说明。"
    ),
    "artifact": (
        "你是一名 Python 课程助教。请根据学生画像、课程资料和学习重点，"
        "输出可直接拿来练习的学习产物 JSON。"
        "不要只给概述，必须给出具体题目、可运行的 Python 代码和答案讲解。"
        "输出必须是严格 JSON，对象中的字符串允许包含 Markdown 和 ```python 代码块。"
    ),
    "exercise_review": (
        "你是 Python 课程助教。"
        "你要根据练习题目和学生提交的代码，给出结构化点评。"
        "不要假装运行过代码，不要编造测试结果。"
        "只根据题目要求和代码文本本身做判断。"
        "输出必须是严格 JSON，不要输出 Markdown。"
    ),
    "mermaid": (
        "你是一名 Python 学习助手。你要根据学生的当前请求和已有会话内容生成 Mermaid 图。"
        "只能基于输入中提供的主题、学习情况、学习路径、典例或练习内容组织图，不要编造个性化薄弱点。"
        "输出必须是严格 JSON，不要输出多余说明。"
    ),
}

def resolve_course(course_id: str) -> dict[str, Any]:
    course = COURSES.get(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="course not found")
    return course

def resolve_profile(profile_id: str) -> dict[str, Any]:
    profile = PROFILES.get(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="profile not found")
    return profile

def ensure_llm_configured() -> Settings:
    settings = get_settings()
    if not settings.llm_configured:
        raise HTTPException(status_code=501, detail="尚未完成 DeepSeek 与 DashScope 的 API 配置。")
    return settings

def get_collaboration_trace(session: dict[str, Any]) -> list[dict[str, Any]]:
    trace = session.get("collaboration_trace")
    return trace if isinstance(trace, list) else []

def collaboration_record(
    role: str,
    status: str,
    input_summary: str,
    output_summary: str,
    used_sources: list[str] | None = None,
) -> dict[str, Any]:
    return {
        "role": role,
        "title": COLLABORATION_ROLES.get(role, role),
        "status": status,
        "input_summary": input_summary,
        "output_summary": output_summary,
        "used_sources": used_sources or [],
        "updated_at": now_iso(),
    }

def merge_collaboration_trace(
    session: dict[str, Any],
    records: list[dict[str, Any]],
    *,
    replace_roles: set[str] | None = None,
) -> list[dict[str, Any]]:
    replace_roles = replace_roles or set()
    merged = [
        item
        for item in get_collaboration_trace(session)
        if isinstance(item, dict) and str(item.get("role", "")) not in replace_roles
    ]
    by_role = {str(item.get("role", "")): index for index, item in enumerate(merged)}
    for record in records:
        role = str(record.get("role", ""))
        if role in by_role:
            merged[by_role[role]] = record
        else:
            by_role[role] = len(merged)
            merged.append(record)
    role_order = {role: index for index, role in enumerate(COLLABORATION_ROLES)}
    merged.sort(key=lambda item: (role_order.get(str(item.get("role", "")), 99), str(item.get("updated_at", ""))))
    session["collaboration_trace"] = merged
    return merged

def create_session_payload(course_id: str) -> dict[str, Any]:
    course = resolve_course(course_id)
    session_id = uuid.uuid4().hex
    payload = {
        "session_id": session_id,
        "course_id": course["id"],
        "title": "新的聊天",
        "custom_title": "",
        "preview": course["opening_prompt"],
        "created_at": now_iso(),
        "updated_at": now_iso(),
        "profile_completion": 15,
        "ready_to_generate": False,
        "missing_slots": ["学习目标", "当前困难", "可投入时间", "偏好方式"],
        "messages": [
            {"role": "assistant", "content": course["opening_prompt"]},
        ],
        "latest_generation": None,
        "latest_artifact": None,
        "latest_artifacts": {},
        "exercise_submissions": {},
        "path_progress": {},
        "path_assessments": {},
        "online_resources": [],
        "online_resource_state": None,
        "generation_history": [],
        "collaboration_trace": [],
    }
    save_session(payload)
    return payload

def truncate_text(text: str, limit: int = 42) -> str:
    stripped = " ".join(text.split())
    if len(stripped) <= limit:
        return stripped
    return stripped[: limit - 1] + "…"

def refresh_session_metadata(session: dict[str, Any]) -> None:
    course = resolve_course(session["course_id"])
    user_messages = [item["content"] for item in session.get("messages", []) if item.get("role") == "user" and item.get("content")]
    latest_message = session.get("messages", [])[-1]["content"] if session.get("messages") else course["opening_prompt"]
    if session.get("custom_title"):
        session["title"] = session["custom_title"]
    else:
        session["title"] = truncate_text(user_messages[0], 20) if user_messages else "新的聊天"
    session["preview"] = truncate_text(latest_message, 56)

def build_session_summary(session: dict[str, Any]) -> dict[str, Any]:
    return {
        "session_id": session["session_id"],
        "course_id": session["course_id"],
        "title": session.get("title", ""),
        "preview": session.get("preview", ""),
        "updated_at": session.get("updated_at", ""),
        "message_count": len(session.get("messages", [])),
        "profile_completion": session.get("profile_completion", 0),
        "ready_to_generate": session.get("ready_to_generate", False),
        "has_generation": session.get("latest_generation") is not None,
    }

def session_has_user_messages(session: dict[str, Any]) -> bool:
    return any(item.get("role") == "user" and item.get("content", "").strip() for item in session.get("messages", []))

def is_trivial_session(session: dict[str, Any]) -> bool:
    latest_artifacts = session.get("latest_artifacts") or {}
    exercise_submissions = session.get("exercise_submissions") or {}
    online_resources = session.get("online_resources") or []
    generation_history = session.get("generation_history") or []
    return (
        session.get("course_id") in COURSES
        and not session_has_user_messages(session)
        and len(session.get("messages", [])) <= 1
        and session.get("latest_generation") is None
        and session.get("latest_artifact") is None
        and not latest_artifacts
        and not exercise_submissions
        and not online_resources
        and not generation_history
        and not session.get("custom_title")
    )

def get_session_artifacts(session: dict[str, Any]) -> dict[str, Any]:
    artifacts: dict[str, Any] = {}

    latest_artifacts = session.get("latest_artifacts")
    if isinstance(latest_artifacts, dict) and latest_artifacts:
        artifacts.update(latest_artifacts)

    latest_artifact = session.get("latest_artifact")
    if isinstance(latest_artifact, dict) and latest_artifact.get("kind"):
        artifacts[str(latest_artifact["kind"])] = latest_artifact

    return artifacts

def get_session_exercise_submissions(session: dict[str, Any]) -> dict[str, Any]:
    submissions = session.get("exercise_submissions")
    if isinstance(submissions, dict):
        return submissions
    return {}

def append_artifact_sections(existing: Any, incoming: dict[str, Any], artifact: ArtifactKind) -> dict[str, Any]:
    if not isinstance(existing, dict):
        return incoming

    existing_sections = existing.get("sections")
    incoming_sections = incoming.get("sections")
    if not isinstance(existing_sections, list) or not existing_sections:
        return incoming
    if not isinstance(incoming_sections, list) or not incoming_sections:
        return existing

    title = "自我练习" if artifact == "summary" else "典例精讲"
    summary_prefix = str(existing.get("summary", "")).strip()
    summary_next = str(incoming.get("summary", "")).strip()
    summary = summary_prefix
    if summary_next and summary_next not in summary_prefix:
        summary = f"{summary_prefix} 已继续补充新的题目。" if summary_prefix else summary_next

    return {
        **incoming,
        "kind": artifact,
        "title": str(existing.get("title") or incoming.get("title") or title),
        "summary": summary or str(incoming.get("summary") or existing.get("summary") or ""),
        "sections": [*existing_sections, *incoming_sections],
    }

def get_session_path_progress(session: dict[str, Any]) -> dict[str, bool]:
    progress = session.get("path_progress")
    if isinstance(progress, dict):
        return {str(key): bool(value) for key, value in progress.items()}
    return {}

def get_session_path_assessments(session: dict[str, Any]) -> dict[str, Any]:
    assessments = session.get("path_assessments")
    if isinstance(assessments, dict):
        return {str(key): value for key, value in assessments.items() if isinstance(value, dict)}
    return {}

def simplify_artifact_heading(heading: str, fallback: str) -> str:
    text = str(heading or "").strip() or fallback
    text = re.sub(r"^(练习|典例|典例精讲|缁冧範|鍏镐緥绮捐)\s*\d+\s*[：:锛?]\s*", "", text)
    text = re.sub(r"^(练习|典例|典例精讲|缁冧範|鍏镐緥绮捐)\s*", "", text)
    return text.strip() or fallback

def build_current_path_steps(session: dict[str, Any]) -> list[dict[str, Any]]:
    artifacts = get_session_artifacts(session)
    practice = artifacts.get("summary") if isinstance(artifacts.get("summary"), dict) else {}
    examples = artifacts.get("qa_script") if isinstance(artifacts.get("qa_script"), dict) else {}
    practice_sections = practice.get("sections", []) if isinstance(practice, dict) else []
    example_sections = examples.get("sections", []) if isinstance(examples, dict) else []
    practice_sections = practice_sections if isinstance(practice_sections, list) else []
    example_sections = example_sections if isinstance(example_sections, list) else []

    if practice_sections or example_sections:
        total = max(len(practice_sections), len(example_sections))
        steps: list[dict[str, Any]] = []
        for index in range(total):
            exercise = practice_sections[index] if index < len(practice_sections) and isinstance(practice_sections[index], dict) else None
            example = example_sections[index] if index < len(example_sections) and isinstance(example_sections[index], dict) else None
            exercise_title = simplify_artifact_heading(exercise.get("heading", ""), f"练习 {index + 1}") if exercise else ""
            example_title = simplify_artifact_heading(example.get("heading", ""), f"典例 {index + 1}") if example else ""
            title = exercise_title or example_title or f"学习任务 {index + 1}"
            if exercise_title and example_title:
                detail = f"先阅读典例《{example_title}》，再完成自我练习《{exercise_title}》，提交答案后根据点评修改。"
                outcome = f"能独立完成《{exercise_title}》，并能说清《{example_title}》中的关键思路。"
            elif exercise_title:
                detail = f"完成自我练习《{exercise_title}》，写出自己的 Python 解答并提交点评。"
                outcome = f"能独立完成《{exercise_title}》，并根据点评修正主要问题。"
            else:
                detail = f"阅读典例《{example_title}》，理解题目拆解、关键代码和容易出错的地方。"
                outcome = f"能复述《{example_title}》的解题思路，并能自己写出相近代码。"
            steps.append(
                {
                    "title": f"第{index + 1}步：{title}",
                    "duration": "约30-45分钟",
                    "detail": detail,
                    "expected_outcome": outcome,
                }
            )
        return steps

    latest_generation = session.get("latest_generation")
    path_steps = latest_generation.get("path", []) if isinstance(latest_generation, dict) else []
    return path_steps if isinstance(path_steps, list) else []

def get_session_online_resources(session: dict[str, Any]) -> list[dict[str, Any]]:
    resources = session.get("online_resources")
    if isinstance(resources, list):
        return [item for item in resources if isinstance(item, dict)]
    return []

def get_session_generation_history(session: dict[str, Any]) -> list[dict[str, Any]]:
    records = session.get("generation_history")
    if isinstance(records, list):
        return [item for item in records if isinstance(item, dict)]
    return []

def prepend_session_generation_history(session: dict[str, Any], record: dict[str, Any]) -> list[dict[str, Any]]:
    history = [record, *get_session_generation_history(session)]
    session["generation_history"] = history[:8]
    return session["generation_history"]

def normalize_artifact_topic(text: str) -> str:
    normalized = str(text or "").strip().lower()
    if not normalized:
        return ""
    normalized = re.sub(r"^(练习|典例精讲|参考讲解|问题|题目)\s*\d*\s*[:：\-]\s*", "", normalized)
    normalized = re.sub(r"^(练习|典例精讲|参考讲解|问题|题目)\s*", "", normalized)
    normalized = re.sub(r"\s+", "", normalized)
    return normalized

def extract_artifact_topic(section: dict[str, Any] | None) -> str:
    if not isinstance(section, dict):
        return ""

    candidates = [section.get("heading", "")]
    lines = section.get("lines")
    if isinstance(lines, list):
        candidates.extend(lines[:2])

    for candidate in candidates:
        topic = normalize_artifact_topic(str(candidate))
        if topic:
            return topic
    return ""

def topics_look_related(left: str, right: str) -> bool:
    if not left or not right:
        return False
    if left in right or right in left:
        return True
    return SequenceMatcher(None, left, right).ratio() >= 0.45

def qa_script_matches_summary(summary_artifact: Any, qa_script_artifact: Any) -> bool:
    if not isinstance(summary_artifact, dict) or not isinstance(qa_script_artifact, dict):
        return True

    summary_sections = summary_artifact.get("sections")
    qa_sections = qa_script_artifact.get("sections")
    if not isinstance(summary_sections, list) or not isinstance(qa_sections, list):
        return True
    if not summary_sections or not qa_sections or len(summary_sections) != len(qa_sections):
        return False

    for summary_section, qa_section in zip(summary_sections, qa_sections):
        if not topics_look_related(extract_artifact_topic(summary_section), extract_artifact_topic(qa_section)):
            return False

    return True

def sanitize_artifact_state_for_response(
    latest_artifacts: dict[str, Any],
    exercise_submissions: dict[str, Any],
) -> tuple[dict[str, Any], dict[str, Any]]:
    sanitized_artifacts = dict(latest_artifacts)
    sanitized_submissions = {
        key: value.copy() if isinstance(value, dict) else value
        for key, value in exercise_submissions.items()
    }

    return sanitized_artifacts, sanitized_submissions

def normalize_submitted_code(raw_code: str) -> str:
    cleaned = raw_code.replace("\r\n", "\n").strip()
    if not cleaned.startswith("```"):
        return cleaned

    lines = cleaned.split("\n")
    if lines and lines[0].startswith("```"):
        lines = lines[1:]
    if lines and lines[-1].strip() == "```":
        lines = lines[:-1]
    return "\n".join(lines).strip()

def is_comment_only_code(code: str) -> bool:
    meaningful_lines = []
    for line in code.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        meaningful_lines.append(stripped)
    return len(meaningful_lines) == 0

def is_obviously_non_python_code(code: str) -> bool:
    lowered = code.lower()
    invalid_markers = [
        "<html",
        "console.log",
        "function(",
        "function ",
        "public static void",
        "#include",
        "<?php",
        "select * from",
        "document.getelementbyid",
    ]
    return any(marker in lowered for marker in invalid_markers)

def cleanup_session_files() -> None:
    parsed_sessions: list[tuple[Path, dict[str, Any]]] = []
    for path in SESSIONS_DIR.glob("*.json"):
        try:
            session = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue

        if session.get("course_id") not in COURSES:
            try:
                path.unlink()
            except OSError:
                pass
            continue

        parsed_sessions.append((path, session))

    newest_trivial_by_course: dict[str, tuple[Path, dict[str, Any]]] = {}
    for path, session in sorted(parsed_sessions, key=lambda item: item[1].get("updated_at", ""), reverse=True):
        if not is_trivial_session(session):
            continue

        course_id = session["course_id"]
        if course_id in newest_trivial_by_course:
            try:
                path.unlink()
            except OSError:
                pass
            continue

        newest_trivial_by_course[course_id] = (path, session)

def find_reusable_session(course_id: str) -> dict[str, Any] | None:
    cleanup_session_files()
    reusable: dict[str, Any] | None = None
    reusable_updated_at = ""

    for path in SESSIONS_DIR.glob("*.json"):
        try:
            session = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue

        if session.get("course_id") != course_id or not is_trivial_session(session):
            continue

        updated_at = session.get("updated_at", "")
        if updated_at >= reusable_updated_at:
            reusable = session
            reusable_updated_at = updated_at

    if reusable is not None:
        refresh_session_metadata(reusable)
    return reusable

def list_sessions() -> list[dict[str, Any]]:
    cleanup_session_files()
    sessions: list[dict[str, Any]] = []
    for path in SESSIONS_DIR.glob("*.json"):
        try:
            session = json.loads(path.read_text(encoding="utf-8"))
            if session.get("course_id") not in COURSES:
                continue
            refresh_session_metadata(session)
            sessions.append(build_session_summary(session))
        except (OSError, json.JSONDecodeError):
            continue
    sessions.sort(key=lambda item: item.get("updated_at", ""), reverse=True)
    return sessions

def dot_product(a: list[float], b: list[float]) -> float:
    return sum(x * y for x, y in zip(a, b))

def norm(vector: list[float]) -> float:
    return math.sqrt(sum(x * x for x in vector))

def cosine_similarity(a: list[float], b: list[float]) -> float:
    denominator = norm(a) * norm(b)
    if denominator == 0:
        return 0.0
    return dot_product(a, b) / denominator

def online_resource_vector_text(resource: dict[str, Any]) -> str:
    parts = [
        resource.get("title", ""),
        resource.get("provider", ""),
        resource.get("summary", ""),
        resource.get("recommended_reason", ""),
        " ".join(str(item) for item in resource.get("match_labels", []) or []),
        " ".join(str(item) for item in resource.get("knowledge_tags", []) or []),
        " ".join(str(item) for item in resource.get("format_tags", []) or []),
    ]
    return " ".join(str(part).strip() for part in parts if str(part).strip())[:1200]

def online_resource_query_text(profile: dict[str, Any], focus: str, query: str) -> str:
    dimensions = profile.get("dimensions", {}) if isinstance(profile.get("dimensions"), dict) else {}
    parts = [
        focus,
        query,
        profile.get("summary", ""),
        dimensions.get("weakness", ""),
        dimensions.get("preference", ""),
        profile.get("next_focus", ""),
        " ".join(str(item) for item in profile.get("weakness_tags", []) or []),
        " ".join(str(item) for item in profile.get("preferred_format_tags", []) or []),
    ]
    return " ".join(str(part).strip() for part in parts if str(part).strip())[:1500]

def rerank_online_resources_by_embedding(
    settings: Settings,
    resources: list[dict[str, Any]],
    profile: dict[str, Any],
    focus: str,
    query: str,
    limit: int = 10,
) -> list[dict[str, Any]]:
    if not settings.embedding_configured or len(resources) <= 1:
        return resources[:limit]

    query_text = online_resource_query_text(profile, focus, query)
    resource_texts = [online_resource_vector_text(resource) for resource in resources]
    if not query_text or not any(resource_texts):
        return resources[:limit]

    try:
        vectors = embed_texts(settings, [query_text] + resource_texts)
    except HTTPException:
        return resources[:limit]

    if len(vectors) != len(resources) + 1:
        return resources[:limit]

    query_vector = vectors[0]
    scored: list[tuple[float, int, dict[str, Any]]] = []
    for index, resource in enumerate(resources):
        similarity = cosine_similarity(query_vector, vectors[index + 1])
        scored.append((similarity, -index, {**resource, "vector_similarity": round(similarity, 6)}))

    scored.sort(key=lambda item: (item[0], item[1]), reverse=True)
    return [item for _, _, item in scored[:limit]]

def normalize_profile_payload(profile: dict[str, Any]) -> dict[str, Any]:
    dimensions = profile.get("dimensions", {})
    return {
        "summary": profile.get("summary", ""),
        "dimensions": {
            "knowledge": dimensions.get("knowledge", ""),
            "pace": dimensions.get("pace", ""),
            "preference": dimensions.get("preference", ""),
            "weakness": dimensions.get("weakness", ""),
            "motivation": dimensions.get("motivation", ""),
            "evaluation": dimensions.get("evaluation", ""),
        },
    }

def build_course_documents(course: dict[str, Any], profile: dict[str, Any]) -> list[dict[str, str]]:
    dimensions = profile["dimensions"]
    documents = [
        {
            "title": f'{course["name"]}课程概览',
            "source": "课程元数据",
            "body": f'课程简介：{course["summary"]} 难度：{course["difficulty"]}。主要痛点：{course["painPoint"]}',
        },
        {
            "title": f'{course["name"]}知识点',
            "source": "课程元数据",
            "body": "核心知识点：" + "、".join(course["seeds"]),
        },
        {
            "title": f'{course["name"]}资源类型',
            "source": "课程元数据",
            "body": "适合输出的学习资源包括：" + "、".join(course["deliverables"]),
        },
        {
            "title": "学生画像摘要",
            "source": "学生画像",
            "body": (
                f'当前基础：{dimensions["knowledge"]}；学习节奏：{dimensions["pace"]}；偏好方式：{dimensions["preference"]}；'
                f'当前薄弱点：{dimensions["weakness"]}；学习动力：{dimensions["motivation"]}；反馈偏好：{dimensions["evaluation"]}。'
                f'补充判断：{profile["summary"]}'
            ),
        },
    ]
    for seed in course["seeds"]:
        documents.append(
            {
                "title": f'{course["name"]}-{seed}',
                "source": "课程元数据",
                "body": f"知识点：{seed}。课程：{course['name']}。学生偏好：{dimensions['preference']}。重点补强：{dimensions['weakness']}。",
            }
        )
    return documents

def split_text_for_indexing(text: str) -> list[str]:
    stripped = text.replace("\r\n", "\n").strip()
    if not stripped:
        return []

    sections: list[str] = []
    current: list[str] = []
    for line in stripped.split("\n"):
        if line.startswith("#") and current:
            sections.append("\n".join(current).strip())
            current = [line]
            continue
        if not line.strip() and current:
            sections.append("\n".join(current).strip())
            current = []
            continue
        current.append(line)
    if current:
        sections.append("\n".join(current).strip())

    chunks: list[str] = []
    for section in sections:
        if len(section) <= MAX_DOC_CHARS:
            chunks.append(section)
            continue
        start = 0
        while start < len(section):
            end = min(len(section), start + MAX_DOC_CHARS)
            chunk = section[start:end].strip()
            if chunk:
                chunks.append(chunk)
            if end >= len(section):
                break
            start = max(0, end - MAX_DOC_OVERLAP)
    return chunks

def load_material_documents(course_id: str) -> list[dict[str, str]]:
    course_dir = MATERIALS_DIR / course_id
    if not course_dir.exists():
        return []

    documents: list[dict[str, str]] = []
    for path in sorted(course_dir.iterdir()):
        if not path.is_file() or path.suffix.lower() not in {".md", ".txt"}:
            continue
        text = path.read_text(encoding="utf-8")
        for index, chunk in enumerate(split_text_for_indexing(text), start=1):
            documents.append(
                {
                    "title": f"{path.stem} 第{index}段",
                    "source": path.name,
                    "body": chunk,
                }
            )
    return documents

def retrieve_context(
    settings: Settings,
    course: dict[str, Any],
    profile: dict[str, Any],
    focus: str,
) -> tuple[list[dict[str, Any]], list[str], bool]:
    documents = load_material_documents(course["id"])
    using_materials = len(documents) > 0
    if not documents:
        documents = build_course_documents(course, profile)

    query = (
        f"课程：{course['name']}。学习方式：{focus}。"
        f"学生基础：{profile['dimensions']['knowledge']}。"
        f"薄弱点：{profile['dimensions']['weakness']}。"
        f"偏好：{profile['dimensions']['preference']}。"
        f"目标：生成适合该学生的学习支持内容。"
    )
    vectors = embed_texts(settings, [query] + [item["body"] for item in documents])
    query_vector = vectors[0]
    doc_vectors = vectors[1:]

    scored: list[dict[str, Any]] = []
    for document, vector in zip(documents, doc_vectors):
        scored.append(
            {
                **document,
                "score": round(cosine_similarity(query_vector, vector), 4),
            }
        )
    scored.sort(key=lambda item: item["score"], reverse=True)
    top_docs = scored[:EMBEDDING_TOP_K]
    return top_docs, [item["title"] for item in top_docs], using_materials

def profile_from_session(session: dict[str, Any], summary_payload: dict[str, Any]) -> dict[str, Any]:
    dimensions = summary_payload.get("dimensions", {})
    profile = {
        "summary": summary_payload.get("summary", ""),
        "dimensions": {
            "knowledge": dimensions.get("knowledge", ""),
            "pace": dimensions.get("pace", ""),
            "preference": dimensions.get("preference", ""),
            "weakness": dimensions.get("weakness", ""),
            "motivation": dimensions.get("motivation", ""),
            "evaluation": dimensions.get("evaluation", ""),
        },
        "confidence": summary_payload.get("confidence", 0),
        "next_focus": summary_payload.get("next_focus", ""),
        "session_id": session["session_id"],
    }
    profile.update(resolve_profile_recommendation_tags(profile, profile.get("next_focus", ""), ""))
    return profile

def build_generation_collaboration_records(
    course: dict[str, Any],
    profile: dict[str, Any],
    payload: dict[str, Any],
    online_resources: list[dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    weakness_tags = [str(item) for item in profile.get("weakness_tags", []) if str(item).strip()]
    resource_titles = [str(item.get("title", "")) for item in payload.get("resources", []) if isinstance(item, dict)]
    path_titles = [str(item.get("title", "")) for item in payload.get("path", []) if isinstance(item, dict)]
    material_source = "Python 课程资料" if payload.get("using_materials") else "课程基础资料"
    source_labels = [material_source]
    if online_resources:
        source_labels.append(f"外部学习资料 {len(online_resources)} 条")
    next_focus = str(profile.get("next_focus", "")).strip() or str(profile.get("summary", "")).strip()
    return [
        collaboration_record(
            "diagnosis",
            "已完成",
            "对话记录",
            next_focus or "已整理当前学习目标和主要困难点。",
            ["对话记录"],
        ),
        collaboration_record(
            "materials",
            "已完成",
            "学习情况与薄弱点",
            f"已围绕{('、'.join(weakness_tags[:3]) if weakness_tags else '当前学习重点')}匹配学习依据。",
            source_labels,
        ),
        collaboration_record(
            "content",
            "已完成",
            "学习情况与学习依据",
            f"已设计 {len(resource_titles)} 类学习内容。",
            resource_titles[:3] or [course["name"]],
        ),
        collaboration_record(
            "path",
            "已完成",
            "学习内容与当前目标",
            f"已安排 {len(path_titles)} 个学习步骤。",
            path_titles[:3] or ["学习方案"],
        ),
    ]

def build_artifact_collaboration_record(artifact: ArtifactKind, payload: dict[str, Any]) -> dict[str, Any]:
    sections = payload.get("sections", []) if isinstance(payload.get("sections"), list) else []
    label = "自我练习" if artifact == "summary" else "典例精讲"
    return collaboration_record(
        "content",
        "已更新",
        "学习情况与课程资料",
        f"已追加 {len(sections)} 个{label}内容。",
        [label],
    )

def build_review_collaboration_record(request: ExerciseReviewRequest, review: dict[str, Any]) -> dict[str, Any]:
    return collaboration_record(
        "feedback",
        "已更新",
        "题目要求与提交代码",
        str(review.get("summary", "")).strip() or "已完成本次作答点评。",
        [request.exercise_heading.strip() or f"练习 {request.exercise_index + 1}", "你的练习答案"],
    )

def ensure_session_collaboration_trace(session: dict[str, Any]) -> list[dict[str, Any]]:
    trace = get_collaboration_trace(session)
    if trace or not isinstance(session.get("latest_generation"), dict):
        return trace

    course = resolve_course(session["course_id"])
    latest_generation = session["latest_generation"]
    profile = latest_generation.get("profile")
    if not isinstance(profile, dict):
        return trace

    records = build_generation_collaboration_records(
        course,
        profile,
        latest_generation,
        get_session_online_resources(session),
    )

    latest_artifacts = get_session_artifacts(session)
    if isinstance(latest_artifacts.get("summary"), dict):
        records.append(build_artifact_collaboration_record("summary", latest_artifacts["summary"]))
    if isinstance(latest_artifacts.get("qa_script"), dict):
        records.append(build_artifact_collaboration_record("qa_script", latest_artifacts["qa_script"]))

    exercise_submissions = get_session_exercise_submissions(session)
    reviewed_submissions = [
        item for item in exercise_submissions.values() if isinstance(item, dict) and isinstance(item.get("review"), dict)
    ]
    if reviewed_submissions:
        latest_submission = max(reviewed_submissions, key=lambda item: str(item.get("updated_at", "")))
        records.append(
            collaboration_record(
                "feedback",
                "已更新",
                "题目要求与提交代码",
                str(latest_submission.get("review", {}).get("summary", "")).strip() or "已完成最近一次作答点评。",
                [str(latest_submission.get("exercise_heading", "练习题")), "你的练习答案"],
            )
        )

    return merge_collaboration_trace(
        session,
        records,
        replace_roles={"diagnosis", "materials", "content", "path", "feedback"},
    )

def default_profile_payload(profile_id: str) -> dict[str, Any]:
    base = resolve_profile(profile_id)
    normalized = normalize_profile_payload(base)
    normalized["confidence"] = 68
    normalized["next_focus"] = "先补齐当前课程的核心基础知识。"
    normalized.update(resolve_profile_recommendation_tags(normalized, normalized.get("next_focus", ""), ""))
    return normalized

def is_direct_content_request(message: str) -> bool:
    lowered = message.lower()
    keywords = [
        "代码题",
        "编程题",
        "练习题",
        "题目",
        "题单",
        "例题",
        "示例代码",
        "代码示例",
        "给我代码",
        "写段代码",
        "项目任务",
        "项目练习",
        "实战题",
        "exercise",
        "coding",
        "example code",
        "python",
        "py",
        "code",
        "script",
    ]
    return any(keyword in lowered for keyword in keywords)

def wants_runnable_python(message: str) -> bool:
    lowered = message.lower()
    keywords = [
        "python代码",
        "python code",
        "纯py",
        "纯 python",
        "py代码",
        "完整代码",
        "可运行代码",
        "直接给代码",
        "给我代码",
        "写段代码",
        "实现一下",
        "写一个脚本",
        "python",
        "py",
        "code",
        "script",
    ]
    return any(keyword in lowered for keyword in keywords)

def keep_only_primary_code_reply(reply: str) -> str:
    marker = "```"
    first = reply.find(marker)
    if first == -1:
        return reply.strip()
    second = reply.find(marker, first + len(marker))
    if second == -1:
        return reply.strip()
    return reply[: second + len(marker)].strip()

def contains_python_code_block(reply: str) -> bool:
    lowered = reply.lower()
    return "```python" in lowered or "``` py" in lowered

def normalize_message_for_matching(message: str) -> str:
    return " ".join(message.lower().replace("\n", " ").split())

def contains_any_keyword(text: str, keywords: list[str]) -> bool:
    return any(keyword in text for keyword in keywords)

def has_mermaid_intent(message: str) -> bool:
    lowered = normalize_message_for_matching(message)
    compact = re.sub(r"\s+", "", lowered)
    mermaid_spellings = ("mermaid", "meimaid", "memaid", "meidmaid", "mindmap")
    if any(word in lowered for word in mermaid_spellings):
        return True
    if "\u56fe" in compact and any(word in compact for word in ("\u751f\u6210", "\u6765\u70b9", "\u6765\u4e2a", "\u753b", "\u505a")):
        return True
    return any(
        keyword in compact
        for keyword in (
            "\u601d\u7ef4\u5bfc\u56fe",
            "\u5bfc\u56fe",
            "\u8def\u7ebf\u56fe",
            "\u77e5\u8bc6\u56fe",
            "\u77e5\u8bc6\u7ed3\u6784\u56fe",
        )
    )

def extract_mermaid_topic(user_message: str) -> str:
    text = str(user_message or "").strip()
    text = re.sub(r"(?i)mermaid|meimaid|memaid|meidmaid|mindmap", " ", text)
    remove_words = (
        "生成",
        "来点",
        "来个",
        "画",
        "做",
        "给我",
        "帮我",
        "思维导图",
        "导图",
        "路线图",
        "知识图",
        "知识结构图",
        "流程图",
        "图",
        "一张",
        "一个",
        "一下",
    )
    for word in remove_words:
        text = text.replace(word, " ")
    text = re.sub(r"[，。！？、,.!?;；:：()\[\]{}<>《》\"'`]+", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    if text.lower() in {"python", "py"}:
        return ""
    return text

def strip_mermaid_code_fence(chart: str) -> str:
    cleaned = str(chart or "").strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:mermaid)?", "", cleaned, flags=re.IGNORECASE).strip()
        cleaned = re.sub(r"```$", "", cleaned).strip()
    return cleaned

def compact_artifact_sections(payload: Any) -> list[dict[str, Any]]:
    if not isinstance(payload, dict):
        return []
    sections = payload.get("sections")
    if not isinstance(sections, list):
        return []
    compact_sections: list[dict[str, Any]] = []
    for section in sections[:4]:
        if not isinstance(section, dict):
            continue
        lines = section.get("lines", [])
        visible_lines = [str(line) for line in lines if isinstance(line, str) and not line.strip().startswith("```")]
        compact_sections.append(
            {
                "heading": str(section.get("heading", "")).strip(),
                "points": visible_lines[:3],
            }
        )
    return compact_sections

def has_mermaid_basis(session: dict[str, Any], topic: str) -> bool:
    if topic:
        return True
    latest_generation = session.get("latest_generation")
    if isinstance(latest_generation, dict) and any(latest_generation.get(key) for key in ("profile", "path", "resources")):
        return True
    artifacts = get_session_artifacts(session)
    if any(compact_artifact_sections(artifacts.get(key)) for key in ("summary", "qa_script")):
        return True
    previous_user_messages = [
        str(item.get("content", "")).strip()
        for item in session.get("messages", [])[:-1]
        if item.get("role") == "user" and str(item.get("content", "")).strip()
    ]
    return len(previous_user_messages) >= 2

def mermaid_label(value: Any, fallback: str, max_length: int = 28) -> str:
    text = str(value or "").strip() or fallback
    text = re.sub(r"[\r\n\t]+", " ", text)
    text = re.sub(r'["\\`<>{}\[\]]+', "", text)
    text = re.sub(r"\s+", " ", text).strip() or fallback
    return f"{text[:max_length]}..." if len(text) > max_length else text

def build_path_mermaid_reply(session: dict[str, Any]) -> str:
    steps = build_current_path_steps(session)
    if not steps:
        return ""

    progress = get_session_path_progress(session)
    visible_steps = steps[:6]
    lines = ["flowchart LR"]
    for index, step in enumerate(visible_steps):
        title = mermaid_label(step.get("title"), f"\u5b66\u4e60\u6b65\u9aa4 {index + 1}")
        duration = mermaid_label(step.get("duration"), "\u5efa\u8bae\u65f6\u957f", 14)
        status = "\u5df2\u5b8c\u6210" if progress.get(str(index)) else "\u5f85\u5b8c\u6210"
        lines.append(f'  step{index}["{index + 1}. {title}<br/>{duration} · {status}"]')
    for index in range(len(visible_steps) - 1):
        lines.append(f"  step{index} --> step{index + 1}")
    lines.extend(
        [
            "  classDef done fill:#eaf7ef,stroke:#118950,color:#162033;",
            "  classDef todo fill:#eef6ff,stroke:#8bb8e8,color:#162033;",
        ]
    )
    for index in range(len(visible_steps)):
        lines.append(f"  class step{index} {'done' if progress.get(str(index)) else 'todo'}")

    chart = "\n".join(lines)
    return f"\u8fd9\u5f20\u56fe\u662f\u6309\u5f53\u524d\u5b66\u4e60\u8def\u5f84\u6574\u7406\u7684\uff1a\n\n```mermaid\n{chart}\n```"

def build_profile_mermaid_reply(session: dict[str, Any]) -> str:
    latest_generation = session.get("latest_generation")
    profile = latest_generation.get("profile") if isinstance(latest_generation, dict) else None
    if not isinstance(profile, dict):
        return ""

    weakness_tags = [mermaid_label(item, "\u5f85\u8865\u5f3a", 18) for item in profile.get("weakness_tags", []) if str(item).strip()]
    format_tags = [mermaid_label(item, "\u5b66\u4e60\u65b9\u5f0f", 18) for item in profile.get("preferred_format_tags", []) if str(item).strip()]
    next_focus = mermaid_label(profile.get("next_focus"), "\u4e0b\u4e00\u6b65\u91cd\u70b9", 24)
    summary = mermaid_label(profile.get("summary"), "\u5b66\u4e60\u60c5\u51b5", 28)
    if not weakness_tags and not format_tags and next_focus == "\u4e0b\u4e00\u6b65\u91cd\u70b9":
        return ""

    lines = [
        "mindmap",
        f"  root(({summary}))",
        "    \u5f53\u524d\u91cd\u70b9",
        f"      {next_focus}",
    ]
    if weakness_tags:
        lines.append("    \u8584\u5f31\u70b9")
        lines.extend(f"      {tag}" for tag in weakness_tags[:5])
    if format_tags:
        lines.append("    \u5b66\u4e60\u65b9\u5f0f")
        lines.extend(f"      {tag}" for tag in format_tags[:4])

    chart = "\n".join(lines)
    return f"\u8fd9\u5f20\u56fe\u662f\u6309\u5f53\u524d\u5b66\u4e60\u60c5\u51b5\u6574\u7406\u7684\uff1a\n\n```mermaid\n{chart}\n```"

def build_mermaid_learning_map_reply(settings: Settings, session: dict[str, Any], user_message: str) -> str:
    topic = extract_mermaid_topic(user_message)
    if not has_mermaid_basis(session, topic):
        return "可以。你先说一下想画哪个主题，比如列表方法、面向对象、文件读写，或先生成学习方案后我再按当前路径画图。"

    course = resolve_course(session["course_id"])
    latest_generation = session.get("latest_generation") if isinstance(session.get("latest_generation"), dict) else {}
    artifacts = get_session_artifacts(session)
    recent_messages = []
    for item in session.get("messages", [])[-MAX_CHAT_HISTORY:]:
        role = "学生" if item.get("role") == "user" else "助手"
        content = str(item.get("content", "")).strip()
        if content:
            recent_messages.append(f"{role}：{content}")

    prompt = f"""
请为学生生成一张 Mermaid 图。

学生请求：
{user_message}

从请求中提取到的主题：
{topic or "未明确给出"}

课程信息：
{json_dumps(course)}

当前学习情况：
{json_dumps(latest_generation.get("profile", {}))}

当前学习路径：
{json_dumps(build_current_path_steps(session))}

已有典例精讲：
{json_dumps(compact_artifact_sections(artifacts.get("qa_script")))}

已有自我练习：
{json_dumps(compact_artifact_sections(artifacts.get("summary")))}

最近对话：
{chr(10).join(recent_messages)}

严格输出 JSON：
{{
  "intro": "一句面向学生的说明",
  "chart": "Mermaid 代码，不要包含 ```",
  "clarification": ""
}}

要求：
1. 如果学生明确给了主题，就围绕该主题生成图。
2. 如果学生没有给主题，但已有学习情况、学习路径、典例或练习，就基于这些真实内容生成图。
3. 如果没有足够依据，chart 为空，clarification 写一句自然追问。
4. 不要编造学生薄弱点；没有画像时只画主题结构，不要说这是学生当前薄弱点。
5. 概念结构优先用 mindmap，学习路径或步骤优先用 flowchart。
6. Mermaid 节点文字用中文，保持简短，避免过长句子。
7. chart 字段只放 Mermaid 代码，不要放 Markdown 代码围栏。
"""
    payload = call_chat_json(settings, SYSTEM_PROMPTS["mermaid"], prompt)
    chart = strip_mermaid_code_fence(str(payload.get("chart", "")))
    clarification = str(payload.get("clarification", "")).strip()
    intro = str(payload.get("intro", "")).strip() or "可以，这是按当前内容整理的图："
    if not chart:
        return clarification or "可以。你先说一下想画哪个主题，我再帮你生成图。"
    return f"{intro}\n\n```mermaid\n{chart}\n```"

def has_explicit_code_intent(message: str) -> bool:
    lowered = normalize_message_for_matching(message)
    keywords = [
        "\u4ee3\u7801",
        "\u7b97\u6cd5",
        "\u51fd\u6570",
        "\u793a\u4f8b",
        "\u4f8b\u5b50",
        "\u7ec3\u4e60",
        "\u9898\u76ee",
        "\u9898",
        "\u811a\u672c",
        "\u5b9e\u73b0",
        "\u5199\u4e00\u4e2a",
        "\u5199\u4e2a",
        "\u7ed9\u6211",
        "algorithm",
        "function",
        "example",
        "practice",
        "exercise",
        "python",
        "py",
        "code",
        "script",
    ]
    if contains_any_keyword(lowered, keywords):
        return True
    return ("\u4ee3\u7801" in lowered or "code" in lowered) and (
        "\u7ed9" in lowered
        or "\u5199" in lowered
        or "\u6765\u4e00\u4e2a" in lowered
        or "give" in lowered
        or "write" in lowered
    )

def wants_code_only_reply(message: str) -> bool:
    lowered = normalize_message_for_matching(message)
    keywords = [
        "\u7eafpy",
        "\u7eaf python",
        "\u7eafpython",
        "\u53ea\u7ed9\u4ee3\u7801",
        "\u4e0d\u8981\u89e3\u91ca",
        "\u76f4\u63a5\u4e0a\u4ee3\u7801",
        "code only",
        "only code",
    ]
    return contains_any_keyword(lowered, keywords)

def build_runnable_python_reply(
    settings: Settings,
    course: dict[str, Any],
    history_lines: list[str],
    user_message: str,
) -> str:
    prompt = f"""
You are a Python coding assistant for a course learning product.

Course:
{json_dumps(course)}

Recent conversation:
{chr(10).join(history_lines)}

Student request:
{user_message}

Return strict JSON only:
{{
  "code": "...",
  "explanation": "..."
}}

Rules:
1. code must be runnable Python, not pseudocode.
2. code must directly satisfy the student's request.
3. Prefer a complete, minimal solution in one file.
4. explanation must be short, optional, and in the same language as the student.
5. Do not ask follow-up questions.
6. Do not refuse when the request is a normal learning or coding request.
"""
    payload = call_chat_json(
        settings,
        (
            "You are a Python coding assistant. "
            "When the user asks for runnable Python code, you must return runnable Python code in a JSON field named code. "
            "Return strict JSON only."
        ),
        prompt,
    )

    code = str(payload.get("code", "")).strip()
    if not code:
        retry_prompt = f"""
The previous answer did not provide code.

Student request:
{user_message}

Return strict JSON only:
{{
  "code": "...",
  "explanation": ""
}}

Requirements:
1. code must be runnable Python.
2. code must be non-empty.
3. Do not ask questions.
"""
        payload = call_chat_json(
            settings,
            "Return runnable Python code in a non-empty JSON field named code.",
            retry_prompt,
        )
        code = str(payload.get("code", "")).strip()

    explanation = str(payload.get("explanation", "")).strip()
    reply = f"```python\n{code}\n```" if code else ""
    if explanation:
        reply = f"{reply}\n\n{explanation}" if reply else explanation
    return reply.strip()

def build_direct_content_payload(
    settings: Settings,
    session: dict[str, Any],
    course: dict[str, Any],
    user_message: str,
) -> dict[str, Any]:
    if has_mermaid_intent(user_message):
        existing_missing_slots = [str(item) for item in session.get("missing_slots", [])][:4]
        return {
            "reply": build_mermaid_learning_map_reply(settings, session, user_message),
            "profile_completion": max(0, min(100, int(session.get("profile_completion", 0)))),
            "missing_slots": existing_missing_slots,
            "ready_to_generate": False,
        }

    runnable_python = has_explicit_code_intent(user_message) or wants_runnable_python(user_message)
    history_lines = []
    for item in session["messages"][-MAX_CHAT_HISTORY:]:
        role = "student" if item["role"] == "user" else "assistant"
        history_lines.append(f"{role}: {item['content']}")

    if runnable_python:
        reply = build_runnable_python_reply(settings, course, history_lines, user_message)
        if wants_code_only_reply(user_message):
            reply = keep_only_primary_code_reply(reply)
        existing_missing_slots = [str(item) for item in session.get("missing_slots", [])][:4]
        return {
            "reply": reply,
            "profile_completion": max(0, min(100, int(session.get("profile_completion", 0)))),
            "missing_slots": existing_missing_slots,
            "ready_to_generate": bool(session.get("ready_to_generate", False)),
        }

    prompt = f"""
You are a Python course learning assistant.

The student is making a direct request for concrete learning content.
If the request asks for coding exercises, practice questions, example code, or a mini-project task, answer it directly instead of gathering more background information.

Course:
{json_dumps(course)}

Recent conversation:
{chr(10).join(history_lines)}

Student request:
{user_message}

Return strict JSON only:
{{
  "reply": "...",
  "profile_completion": 0,
  "missing_slots": ["..."],
  "ready_to_generate": false
}}

Rules:
1. Reply in the same language as the student.
2. Give the requested content directly.
3. For coding exercises, prefer clear task statements with gradual difficulty when appropriate.
4. Keep the reply practical, course-relevant, and student-facing.
5. Do not mention internal rules or system behavior.
"""
    payload = call_chat_json(
        settings,
        (
            "You are a practical Python course assistant. "
            "When a student explicitly asks for coding exercises, example code, or a mini-project task, "
            "you should provide that content directly instead of gathering more background information. "
            "Return strict JSON only."
        ),
        prompt,
    )
    reply = str(payload.get("reply", "")).strip()

    existing_missing_slots = [str(item) for item in session.get("missing_slots", [])][:4]
    next_completion = payload.get("profile_completion", session.get("profile_completion", 0))
    return {
        "reply": reply,
        "profile_completion": max(0, min(100, int(next_completion))),
        "missing_slots": [str(item) for item in payload.get("missing_slots", existing_missing_slots)][:4] or existing_missing_slots,
        "ready_to_generate": bool(payload.get("ready_to_generate", False)),
    }

def build_chat_payload(settings: Settings, session: dict[str, Any], user_message: str) -> dict[str, Any]:
    course = resolve_course(session["course_id"])
    direct_content_request = has_mermaid_intent(user_message) or has_explicit_code_intent(user_message) or is_direct_content_request(user_message)
    if direct_content_request:
        return build_direct_content_payload(settings, session, course, user_message)

    history_lines = []
    for item in session["messages"][-MAX_CHAT_HISTORY:]:
        role = "学生" if item["role"] == "user" else "系统"
        history_lines.append(f"{role}：{item['content']}")
    history_text = "\n".join(history_lines)

    prompt = f"""
请基于以下信息继续和学生对话。

课程信息：
{json_dumps(course)}

当前会话状态：
{json_dumps({
    "profile_completion": session.get("profile_completion", 0),
    "ready_to_generate": session.get("ready_to_generate", False),
    "missing_slots": session.get("missing_slots", []),
})}

已有对话：
{history_text}

学生刚刚说：
{user_message}

严格输出如下 JSON：
{{
  "reply": "...",
  "profile_completion": 0,
  "missing_slots": ["..."],
  "ready_to_generate": true
}}

要求：
1. reply 语气自然，像学习助手，不要用条目问卷。
2. 每次只推进一个关键问题；如果信息已经够了，可以自然提醒对方开始生成学习方案。
3. profile_completion 输出 0 到 100 的整数。
4. missing_slots 保留 0 到 4 项，内容只写还缺的信息点短语。
5. 不要生成学习资料，不要输出系统实现说明。
"""
    if direct_content_request:
        prompt += """

Additional rules:
1. The student is making a direct content request.
2. If the request is for coding exercises, practice questions, example code, or a mini-project task, answer it directly.
3. Do not continue information-gathering when the request is already explicit.
4. Keep the reply practical, course-relevant, and student-facing.
"""

    payload = call_chat_json(settings, SYSTEM_PROMPTS["chat"], prompt)
    return {
        "reply": str(payload.get("reply", "")).strip(),
        "profile_completion": max(0, min(100, int(payload.get("profile_completion", 0)))),
        "missing_slots": [str(item) for item in payload.get("missing_slots", [])][:4],
        "ready_to_generate": bool(payload.get("ready_to_generate", False)),
    }

def is_learning_plan_request(user_message: str, reply: str = "") -> bool:
    if has_mermaid_intent(user_message):
        return False

    text = user_message.lower()
    compact = re.sub(r"\s+", "", text)
    explicit_plan_words = (
        "学习方案",
        "学习计划",
        "学习路径",
        "学习安排",
        "复习计划",
        "复习安排",
        "python学习方案",
        "python学习计划",
        "python学习路径",
    )
    if not any(word in compact for word in explicit_plan_words):
        return False

    action_words = (
        "生成",
        "制定",
        "规划",
        "安排",
        "做",
        "给我",
        "出一份",
        "开始",
        "整理",
    )
    return any(word in compact for word in action_words) or compact in explicit_plan_words

def build_suggested_actions(session: dict[str, Any], reply: str, user_message: str, ready_to_generate: bool) -> list[dict[str, str]]:
    if has_mermaid_intent(user_message):
        return []

    text = f"{reply}\n{user_message}".lower()
    actions: list[dict[str, str]] = []
    action_types: set[str] = set()

    def add(action_type: str, label: str) -> None:
        if action_type not in action_types:
            action_types.add(action_type)
            actions.append({"type": action_type, "label": label})

    plan_requested = is_learning_plan_request(user_message, reply)
    if ready_to_generate or plan_requested:
        add("generate_plan", "\u751f\u6210\u5b66\u4e60\u65b9\u6848")
        if plan_requested or ready_to_generate:
            return actions

    if any(word in text for word in ("典例", "例题", "精讲", "讲解")):
        add("generate_examples", "\u751f\u6210\u5178\u4f8b\u7cbe\u8bb2")

    if any(word in text for word in ("练习", "做题", "题目", "代码题", "作业题")):
        add("generate_practice", "\u751f\u6210\u81ea\u6211\u7ec3\u4e60")

    if any(word in text for word in ("资料", "推荐", "视频", "文章", "外部", "补充")):
        add("recommend_resources", "\u63a8\u8350\u8865\u5145\u8d44\u6599")

    if session.get("latest_generation") and not actions and any(word in text for word in ("生成", "开始", "安排")):
        add("generate_practice", "\u751f\u6210\u81ea\u6211\u7ec3\u4e60")
        add("generate_examples", "\u751f\u6210\u5178\u4f8b\u7cbe\u8bb2")

    return actions[:3]

def polish_chat_reply(reply: str) -> str:
    polished = reply.strip()
    replacements = {
        "\u73b0\u5728\u5c31\u53ef\u4ee5\u5f00\u59cb\u5b66\u4e60\u5566~": "\u70b9\u51fb\u4e0b\u9762\u6309\u94ae\u5c31\u53ef\u4ee5\u751f\u6210\u4e86\u3002",
        "\u73b0\u5728\u5c31\u53ef\u4ee5\u5f00\u59cb\u5b66\u4e60\u5566\uff5e": "\u70b9\u51fb\u4e0b\u9762\u6309\u94ae\u5c31\u53ef\u4ee5\u751f\u6210\u4e86\u3002",
        "\u73b0\u5728\u5c31\u53ef\u4ee5\u5f00\u59cb\u5b66\u4e60\u4e86": "\u70b9\u51fb\u4e0b\u9762\u6309\u94ae\u5c31\u53ef\u4ee5\u751f\u6210\u4e86\u3002",
    }
    for source, target in replacements.items():
        polished = polished.replace(source, target)
    return polished

def build_profile_summary_payload(settings: Settings, session: dict[str, Any]) -> dict[str, Any]:
    course = resolve_course(session["course_id"])
    history_lines = []
    for item in session["messages"]:
        role = "student" if item["role"] == "user" else "assistant"
        history_lines.append(f"{role}: {item['content']}")

    prompt = f"""
Summarize the student's learning situation from the course context and the full conversation.

Course:
{json_dumps(course)}

Conversation:
{chr(10).join(history_lines)}

Use only these predefined tags when selecting weakness_tags and preferred_format_tags:
{json_dumps(TAG_CATALOG)}

Return strict JSON only:
{{
  "summary": "...",
  "dimensions": {{
    "knowledge": "...",
    "pace": "...",
    "preference": "...",
    "weakness": "...",
    "motivation": "...",
    "evaluation": "..."
  }},
  "confidence": 0,
  "next_focus": "...",
  "weakness_tags": ["..."],
  "preferred_format_tags": ["..."],
  "level_tag": "beginner"
}}

Rules:
1. Write field values in the same language as the conversation.
2. Fill all six dimensions.
3. summary should be 1-2 sentences.
4. confidence must be an integer from 55 to 95.
5. next_focus should name only the next most important area to strengthen.
6. weakness_tags must contain 2-6 items chosen only from TAG_CATALOG["weakness_tags"].
7. preferred_format_tags must contain 1-3 items chosen only from TAG_CATALOG["format_tags"].
8. level_tag must be one of TAG_CATALOG["level_tags"].
9. Do not output chain-of-thought or copy long excerpts from the conversation.
"""
    payload = call_chat_json(settings, SYSTEM_PROMPTS["profile"], prompt)
    profile_payload = {
        "summary": str(payload.get("summary", "")).strip(),
        "dimensions": {
            "knowledge": str(payload.get("dimensions", {}).get("knowledge", "")).strip(),
            "pace": str(payload.get("dimensions", {}).get("pace", "")).strip(),
            "preference": str(payload.get("dimensions", {}).get("preference", "")).strip(),
            "weakness": str(payload.get("dimensions", {}).get("weakness", "")).strip(),
            "motivation": str(payload.get("dimensions", {}).get("motivation", "")).strip(),
            "evaluation": str(payload.get("dimensions", {}).get("evaluation", "")).strip(),
        },
        "confidence": max(0, min(100, int(payload.get("confidence", 0)))),
        "next_focus": str(payload.get("next_focus", "")).strip(),
        "weakness_tags": [str(item).strip() for item in payload.get("weakness_tags", []) if str(item).strip()],
        "preferred_format_tags": [
            str(item).strip() for item in payload.get("preferred_format_tags", []) if str(item).strip()
        ],
        "level_tag": str(payload.get("level_tag", "")).strip().lower(),
    }
    profile_payload.update(
        resolve_profile_recommendation_tags(
            profile_payload,
            profile_payload.get("next_focus", ""),
            "",
        )
    )
    return profile_payload
def build_generation_payload_from_profile(
    settings: Settings,
    course: dict[str, Any],
    profile: dict[str, Any],
    focus: str,
    depth: int,
    version: int,
) -> dict[str, Any]:
    retrieved_docs, _, using_materials = retrieve_context(settings, course, profile, focus)
    depth_label = ["轻量", "标准", "增强"][depth - 1]

    resources_prompt = f"""
请基于以下输入生成适合学生当前阶段的学习资源 JSON。

课程信息：
{json_dumps(course)}

学生画像：
{json_dumps(profile)}

学习方式：{focus}
资源密度：{depth_label}

学习依据：
{json_dumps(retrieved_docs)}

严格输出如下 JSON：
{{
  "resources": [
    {{
      "kind": "讲解",
      "title": "...",
      "description": "...",
      "tag": "...",
      "content_preview": ["...", "...", "..."],
      "suitability_reason": "..."
    }}
  ],
  "mode_hint": "..."
}}

要求：
1. resources 恰好 5 项，kind 依次为：讲解、练习、案例、复盘、拓展。
2. 每项 content_preview 恰好 3 条。
3. 文案面向学生，不要出现“命中资料”“系统生成”等说法。
4. suitability_reason 说明为什么这项资源适合当前学生。
"""
    resources_prompt += """

Additional rules:
1. The resource with kind "练习" must contain exactly 3 concrete programming exercises.
2. Each exercise in "练习" must be a real task statement, not a generic study suggestion.
3. Each exercise should clearly describe the goal, the key requirement, and the expected output or completion standard.
4. At least one exercise should be directly runnable as a small Python coding task.
5. Do not write vague items such as "多练习循环" or "巩固基础知识".
6. The resource with kind "案例" must describe a concrete mini-project or applied task, not only a topic recommendation.
7. If focus is "练习", make the "练习" resource the most concrete part of the whole output.
8. Keep every item student-facing and practical.
"""

    resources_payload = call_chat_json(settings, SYSTEM_PROMPTS["resources"], resources_prompt)

    path_prompt = f"""
请基于以下输入生成学习路径 JSON。

课程信息：
{json_dumps(course)}

学生画像：
{json_dumps(profile)}

学习方式：{focus}
资源密度：{depth_label}

已生成资源：
{json_dumps(resources_payload.get("resources", []))}

严格输出如下 JSON：
{{
  "path": [
    {{
      "title": "...",
      "detail": "...",
      "duration": "...",
      "expected_outcome": "..."
    }}
  ]
}}

要求：
1. path 恰好 4 步。
2. 每步都要包含学习内容、预计时长和完成标准。
3. 安排要体现学生基础和薄弱点。
"""
    path_payload = call_chat_json(settings, SYSTEM_PROMPTS["path"], path_prompt)

    return {
        "profile": profile,
        "resources": resources_payload.get("resources", []),
        "path": path_payload.get("path", []),
        "mode_hint": resources_payload.get("mode_hint", ""),
        "depth_label": depth_label,
        "using_materials": using_materials,
    }

def build_artifact_payload_from_profile(
    settings: Settings,
    course: dict[str, Any],
    profile: dict[str, Any],
    focus: str,
    depth: int,
    artifact: ArtifactKind,
) -> dict[str, Any]:
    retrieved_docs, _, _ = retrieve_context(settings, course, profile, focus)
    artifact_label = "练习题" if artifact == "summary" else "代码答案"

    if artifact == "summary":
        artifact_instruction = """
请生成 3 道递进式 Python 练习题。
每个 section 对应一道真实可做的题。
每个 section 的 lines 必须至少包含以下 4 项：
1. 题目：明确任务目标
2. 要求：说明输入输出或完成标准
3. ```python 参考代码```：给出完整可运行的 Python 代码
4. 答案解析：说明关键知识点和为什么这样写
"""
    else:
        artifact_instruction = """
请生成 3 组常见 Python 问题的解答示例。
每个 section 围绕一个具体问题，必须给出完整答案。
每个 section 的 lines 必须至少包含以下 4 项：
1. 问题：学生会遇到的具体提问或题目
2. 解题思路：先说明怎么拆解
3. ```python 参考代码```：给出完整可运行的 Python 代码
4. 标准答案：解释结果、常见错误和为什么这样写
"""

    prompt = f"""
请基于以下输入生成 {artifact_label} JSON。

课程信息：
{json_dumps(course)}

学生画像：
{json_dumps(profile)}

学习方式：{focus}
资源密度：{["轻量", "标准", "增强"][depth - 1]}

学习依据：
{json_dumps(retrieved_docs)}

严格输出如下 JSON：
{{
  "kind": "{artifact}",
  "title": "...",
  "summary": "...",
  "sections": [
    {{
      "heading": "...",
      "lines": ["...", "..."]
    }}
  ]
}}

要求：
1. sections 必须输出 3 个。
2. 每个 section 的 heading 要像真实题目标题，不要写“第一部分”这种空标题。
3. 每个 section 的 lines 至少输出 4 条。
4. 每个 section 必须包含 ```python 代码块。
5. 代码必须是可运行的 Python，不要写伪代码，不要省略关键函数体。
6. 内容必须面向学生，直接给题目、代码和答案，不要出现系统术语。
7. summary 必须明确说明“这里有题目、代码和答案”。

附加说明：
{artifact_instruction}
"""
    payload = call_chat_json(settings, SYSTEM_PROMPTS["artifact"], prompt)

    sections = payload.get("sections", [])
    normalized_sections: list[dict[str, Any]] = []
    for index, section in enumerate(sections[:3], start=1):
        heading = str(section.get("heading", "")).strip() or f"练习 {index}"
        lines = [str(line).strip() for line in section.get("lines", []) if str(line).strip()]
        normalized_sections.append(
            {
                "heading": heading,
                "lines": lines,
            }
        )

    has_code = any("```" in line for section in normalized_sections for line in section["lines"])
    if not normalized_sections or not has_code:
        if artifact == "summary":
            normalized_sections = [
                {
                    "heading": "练习 1：统计列表中的偶数个数",
                    "lines": [
                        "题目：编写函数 `count_even(numbers)`，统计列表中偶数的个数。",
                        "要求：输入是整数列表，返回值是偶数数量；请给出完整可运行代码。",
                        "```python\ndef count_even(numbers):\n    return sum(1 for num in numbers if num % 2 == 0)\n\nif __name__ == '__main__':\n    sample = [1, 2, 3, 4, 5, 6]\n    print(count_even(sample))\n```",
                        "答案解析：这道题主要练习函数定义、条件判断和遍历列表。用生成器表达式统计满足条件的元素，代码更紧凑。",
                    ],
                },
                {
                    "heading": "练习 2：读取 CSV 成绩并计算平均分",
                    "lines": [
                        "题目：读取 `scores.csv` 文件，统计每位同学的成绩，并输出全班平均分。",
                        "要求：使用标准库 `csv`；假设文件包含 `name,score` 两列；请给出完整代码。",
                        "```python\nimport csv\n\ndef average_score(path):\n    total = 0\n    count = 0\n    with open(path, 'r', encoding='utf-8') as file:\n        reader = csv.DictReader(file)\n        for row in reader:\n            total += int(row['score'])\n            count += 1\n    return total / count if count else 0\n\nif __name__ == '__main__':\n    print(average_score('scores.csv'))\n```",
                        "答案解析：`csv.DictReader` 适合处理带表头的数据。关键点是逐行累加分数，并在空文件时返回 0 避免除零错误。",
                    ],
                },
                {
                    "heading": "练习 3：用类封装学生信息",
                    "lines": [
                        "题目：定义 `Student` 类，保存姓名和成绩，并提供 `is_passed()` 方法判断是否及格。",
                        "要求：构造函数接收 `name` 和 `score`；成绩大于等于 60 视为及格；请给出完整代码。",
                        "```python\nclass Student:\n    def __init__(self, name, score):\n        self.name = name\n        self.score = score\n\n    def is_passed(self):\n        return self.score >= 60\n\nif __name__ == '__main__':\n    student = Student('Alice', 78)\n    print(student.name, student.is_passed())\n```",
                        "答案解析：这道题练习类、属性和实例方法。`__init__` 负责初始化对象状态，`is_passed()` 用来封装判断逻辑。",
                    ],
                },
            ]
            fallback_summary = "这里整理了 3 道可直接动手练的 Python 题，每道都附了参考代码和答案解析。"
        else:
            normalized_sections = [
                {
                    "heading": "问题 1：为什么函数里改不到外部变量",
                    "lines": [
                        "问题：在函数内部给变量重新赋值后，为什么函数外的同名变量没有变化？",
                        "解题思路：先区分“重新绑定变量”和“修改可变对象内容”这两件事，再看函数作用域。",
                        "```python\ndef change_value(x):\n    x = 100\n    return x\n\nnum = 5\nresult = change_value(num)\nprint(num)\nprint(result)\n```",
                        "标准答案：整数是不可变对象，函数里的 `x = 100` 只是让局部变量重新绑定，不会改掉外部的 `num`。运行结果是 `num` 仍然为 5，而 `result` 为 100。",
                    ],
                },
                {
                    "heading": "问题 2：怎么安全读取文件内容",
                    "lines": [
                        "问题：读取文本文件时，怎样避免文件不存在直接报错？",
                        "解题思路：用 `with open(...)` 读取文件，再用 `try/except` 捕获常见异常。",
                        "```python\ndef read_text(path):\n    try:\n        with open(path, 'r', encoding='utf-8') as file:\n            return file.read()\n    except FileNotFoundError:\n        return '文件不存在'\n\nif __name__ == '__main__':\n    print(read_text('demo.txt'))\n```",
                        "标准答案：`with` 会自动关闭文件，`FileNotFoundError` 用来处理文件不存在的情况。这样程序不会直接中断，用户也能得到明确提示。",
                    ],
                },
                {
                    "heading": "问题 3：如何把列表数据写成 CSV",
                    "lines": [
                        "问题：已经有一组学生成绩数据，怎样把它写入 CSV 文件？",
                        "解题思路：使用 `csv.writer`，先写表头，再逐行写入数据。",
                        "```python\nimport csv\n\ndef write_scores(path, rows):\n    with open(path, 'w', encoding='utf-8', newline='') as file:\n        writer = csv.writer(file)\n        writer.writerow(['name', 'score'])\n        writer.writerows(rows)\n\nif __name__ == '__main__':\n    data = [('Alice', 88), ('Bob', 92)]\n    write_scores('scores.csv', data)\n```",
                        "标准答案：写 CSV 时要加 `newline=''`，否则某些环境下会出现空行。`writerows` 可以一次写入多行元组数据。",
                    ],
                },
            ]
            fallback_summary = "这里整理了 3 组常见 Python 问题的参考代码和标准答案，可以直接对照练习。"

        return {
            "kind": artifact,
            "title": artifact_label,
            "summary": fallback_summary,
            "sections": normalized_sections,
        }

    return {
        "kind": payload.get("kind", artifact),
        "title": payload.get("title", artifact_label),
        "summary": payload.get("summary", ""),
        "sections": normalized_sections,
    }

ARTIFACT_VARIANT_BANKS: dict[str, list[dict[str, Any]]] = {
    "summary": [
        {
            "theme": "字符串清洗、字典统计、异常处理",
            "keywords": ["字符串", "字典", "异常", "词频", "输入转换"],
            "summary": "这组自我练习围绕字符串处理、字典统计和异常处理，适合练习把基础语法连成可提交的小程序。",
            "sections": [
                {
                    "heading": "练习 1：整理姓名列表",
                    "lines": [
                        "题目：编写函数 `clean_names(names)`，把姓名列表中的空格去掉，并过滤空字符串。",
                        "要求：返回新的列表；保留原有顺序；不要修改传入的原列表。",
                        "```python\ndef clean_names(names):\n    # TODO: 去掉每个姓名首尾空格，并过滤空字符串\n    pass\n\nif __name__ == '__main__':\n    data = [' Alice ', '', ' Bob', '  Chen  ']\n    print(clean_names(data))\n```",
                        "自查提示：检查是否使用了 `strip()`，空字符串是否被过滤，原列表是否没有被直接改动。",
                    ],
                },
                {
                    "heading": "练习 2：统计一段文本的词频",
                    "lines": [
                        "题目：编写函数 `word_count(text)`，统计英文句子中每个单词出现的次数。",
                        "要求：忽略大小写；按空格拆分；返回字典，例如 `{'python': 2}`。",
                        "```python\ndef word_count(text):\n    counts = {}\n    # TODO: 拆分文本并统计词频\n    return counts\n\nif __name__ == '__main__':\n    print(word_count('Python is fun and python is useful'))\n```",
                        "自查提示：检查是否统一转成小写，字典中已有单词时是否正确累加。",
                    ],
                },
                {
                    "heading": "练习 3：安全转换用户输入",
                    "lines": [
                        "题目：编写函数 `parse_score(raw)`，把输入内容转换为 0 到 100 之间的整数分数。",
                        "要求：无法转换或超出范围时返回 `None`；合法时返回整数。",
                        "```python\ndef parse_score(raw):\n    # TODO: 使用 try/except 处理无法转换的输入\n    pass\n\nif __name__ == '__main__':\n    print(parse_score('88'))\n    print(parse_score('abc'))\n```",
                        "自查提示：检查 `ValueError` 是否被处理，边界值 0 和 100 是否能通过。",
                    ],
                },
            ],
        },
        {
            "theme": "列表推导式、排序、函数拆分",
            "keywords": ["列表推导式", "排序", "函数", "及格", "拆分"],
            "summary": "这组自我练习关注列表处理和函数拆分，帮助你把零散语句整理成更清楚的程序结构。",
            "sections": [
                {
                    "heading": "练习 1：筛选及格成绩",
                    "lines": [
                        "题目：编写函数 `passed_scores(scores)`，从成绩列表中筛选出大于等于 60 的分数。",
                        "要求：返回新列表；尽量使用列表推导式；保留原分数顺序。",
                        "```python\ndef passed_scores(scores):\n    # TODO: 用列表推导式筛选及格成绩\n    pass\n\nif __name__ == '__main__':\n    print(passed_scores([45, 60, 72, 58, 91]))\n```",
                        "自查提示：检查 60 分是否被保留，返回值是否仍然是列表。",
                    ],
                },
                {
                    "heading": "练习 2：按成绩从高到低排序",
                    "lines": [
                        "题目：编写函数 `rank_students(students)`，把学生成绩按分数从高到低排序。",
                        "要求：输入是包含 `name` 和 `score` 的字典列表；返回排序后的新列表。",
                        "```python\ndef rank_students(students):\n    # TODO: 使用 sorted 和 key 完成排序\n    pass\n\nif __name__ == '__main__':\n    data = [{'name': 'Alice', 'score': 88}, {'name': 'Bob', 'score': 95}]\n    print(rank_students(data))\n```",
                        "自查提示：检查是否按 `score` 排序，是否设置了 `reverse=True`。",
                    ],
                },
                {
                    "heading": "练习 3：拆分温度转换函数",
                    "lines": [
                        "题目：把摄氏度转华氏度的逻辑封装成函数 `c_to_f(celsius)`。",
                        "要求：主程序只负责准备数据和打印结果；转换公式写在函数内部。",
                        "```python\ndef c_to_f(celsius):\n    # TODO: 返回华氏度\n    pass\n\nif __name__ == '__main__':\n    values = [0, 20, 37]\n    for value in values:\n        print(value, c_to_f(value))\n```",
                        "自查提示：检查函数是否有返回值，循环中是否复用了函数而不是重复写公式。",
                    ],
                },
            ],
        },
        {
            "theme": "文件读取、JSON 保存、日期计算",
            "keywords": ["文件", "JSON", "日期", "日志", "保存"],
            "summary": "这组自我练习把 Python 基础语法放到文件和日期场景中，适合练习更接近真实作业的小任务。",
            "sections": [
                {
                    "heading": "练习 1：筛选日志中的错误行",
                    "lines": [
                        "题目：编写函数 `find_errors(path)`，读取文本文件并返回包含 `ERROR` 的行。",
                        "要求：返回字符串列表；去掉每行末尾换行符；文件不存在时返回空列表。",
                        "```python\ndef find_errors(path):\n    errors = []\n    # TODO: 读取文件并筛选包含 ERROR 的行\n    return errors\n\nif __name__ == '__main__':\n    print(find_errors('app.log'))\n```",
                        "自查提示：检查是否使用 `with open`，是否处理了 `FileNotFoundError`。",
                    ],
                },
                {
                    "heading": "练习 2：保存任务清单",
                    "lines": [
                        "题目：编写函数 `save_tasks(path, tasks)`，把任务列表保存成 JSON 文件。",
                        "要求：使用标准库 `json`；写入 UTF-8；缩进为 2 个空格。",
                        "```python\nimport json\n\ndef save_tasks(path, tasks):\n    # TODO: 把 tasks 写入 JSON 文件\n    pass\n\nif __name__ == '__main__':\n    save_tasks('tasks.json', [{'title': '复习循环', 'done': False}])\n```",
                        "自查提示：检查是否设置 `ensure_ascii=False`，文件内容是否是合法 JSON。",
                    ],
                },
                {
                    "heading": "练习 3：计算距离考试还有几天",
                    "lines": [
                        "题目：编写函数 `days_until(date_text)`，计算今天到目标日期还有多少天。",
                        "要求：输入格式为 `YYYY-MM-DD`；返回整数天数；日期格式错误时返回 `None`。",
                        "```python\nfrom datetime import date, datetime\n\ndef days_until(date_text):\n    # TODO: 解析日期并计算天数差\n    pass\n\nif __name__ == '__main__':\n    print(days_until('2026-06-30'))\n```",
                        "自查提示：检查是否用 `datetime.strptime` 解析日期，是否取出了 `.date()` 再相减。",
                    ],
                },
            ],
        },
        {
            "theme": "循环菜单、集合去重、简单类设计",
            "keywords": ["循环", "菜单", "集合", "去重", "类"],
            "summary": "这组自我练习适合练习控制流程和小型数据结构设计，重点是把程序写得清晰、可扩展。",
            "sections": [
                {
                    "heading": "练习 1：实现命令菜单",
                    "lines": [
                        "题目：编写函数 `handle_choice(choice)`，根据用户输入返回对应操作说明。",
                        "要求：支持 `1` 查看、`2` 添加、`3` 退出；其他输入返回错误提示。",
                        "```python\ndef handle_choice(choice):\n    # TODO: 根据 choice 返回不同提示\n    pass\n\nif __name__ == '__main__':\n    for choice in ['1', '2', '3', 'x']:\n        print(handle_choice(choice))\n```",
                        "自查提示：检查分支是否覆盖了所有选项，非法输入是否有明确返回。",
                    ],
                },
                {
                    "heading": "练习 2：列表去重并保留顺序",
                    "lines": [
                        "题目：编写函数 `unique_keep_order(items)`，去掉列表中的重复元素并保留第一次出现的顺序。",
                        "要求：返回新列表；可以用集合辅助判断；不要直接用 `set(items)` 破坏顺序。",
                        "```python\ndef unique_keep_order(items):\n    result = []\n    seen = set()\n    # TODO: 补全去重逻辑\n    return result\n\nif __name__ == '__main__':\n    print(unique_keep_order(['a', 'b', 'a', 'c', 'b']))\n```",
                        "自查提示：检查重复元素是否只保留第一次，原始顺序是否没有改变。",
                    ],
                },
                {
                    "heading": "练习 3：设计待办事项类",
                    "lines": [
                        "题目：定义 `TodoItem` 类，保存标题和完成状态，并提供 `mark_done()` 方法。",
                        "要求：创建对象时默认未完成；调用方法后状态变为已完成。",
                        "```python\nclass TodoItem:\n    def __init__(self, title):\n        # TODO: 保存标题和完成状态\n        pass\n\n    def mark_done(self):\n        # TODO: 标记为完成\n        pass\n\nif __name__ == '__main__':\n    item = TodoItem('完成 Python 练习')\n    item.mark_done()\n    print(item.title, item.done)\n```",
                        "自查提示：检查属性是否挂在 `self` 上，方法是否真的改变了对象状态。",
                    ],
                },
            ],
        },
    ],
    "qa_script": [
        {
            "theme": "字典统计、字符串清洗、异常处理",
            "keywords": ["字典", "字符串", "异常", "词频", "ValueError"],
            "summary": "这组典例精讲展示如何把常见基础语法写成完整、可运行的小程序。",
            "sections": [
                {
                    "heading": "典例 1：用字典统计单词出现次数",
                    "lines": [
                        "问题：给定一段英文文本，统计每个单词出现了几次。",
                        "思路：先统一大小写，再拆分单词，最后用字典累计次数。",
                        "```python\ndef word_count(text):\n    counts = {}\n    for word in text.lower().split():\n        counts[word] = counts.get(word, 0) + 1\n    return counts\n\nprint(word_count('Python is fun and python is useful'))\n```",
                        "讲解：`dict.get(key, 0)` 可以在单词第一次出现时给出默认值，避免先写一段额外的判断。",
                    ],
                },
                {
                    "heading": "典例 2：清洗用户输入的姓名",
                    "lines": [
                        "问题：用户输入的姓名可能带空格或空项，如何整理成干净列表。",
                        "思路：遍历列表，对每个字符串做 `strip()`，再过滤空字符串。",
                        "```python\ndef clean_names(names):\n    result = []\n    for name in names:\n        cleaned = name.strip()\n        if cleaned:\n            result.append(cleaned)\n    return result\n\nprint(clean_names([' Alice ', '', ' Bob']))\n```",
                        "讲解：字符串清洗常见步骤是先标准化，再判断是否保留。这样逻辑比一边判断一边处理更清楚。",
                    ],
                },
                {
                    "heading": "典例 3：用异常处理保护数字转换",
                    "lines": [
                        "问题：把用户输入转成整数时，遇到 `abc` 这类内容不能让程序直接崩溃。",
                        "思路：把可能出错的转换放进 `try`，转换失败时返回明确结果。",
                        "```python\ndef parse_score(raw):\n    try:\n        score = int(raw)\n    except ValueError:\n        return None\n    if 0 <= score <= 100:\n        return score\n    return None\n\nprint(parse_score('88'))\nprint(parse_score('abc'))\n```",
                        "讲解：`try/except` 不是用来隐藏错误，而是把可预期的错误转换成程序能继续处理的结果。",
                    ],
                },
            ],
        },
        {
            "theme": "排序、列表推导式、函数拆分",
            "keywords": ["排序", "列表推导式", "函数", "sorted", "lambda"],
            "summary": "这组典例精讲强调列表数据处理和函数组织方式，适合提升代码结构感。",
            "sections": [
                {
                    "heading": "典例 1：按分数从高到低排序",
                    "lines": [
                        "问题：学生信息保存在字典列表中，需要按成绩排名。",
                        "思路：使用 `sorted`，通过 `key` 指定排序字段，通过 `reverse=True` 控制降序。",
                        "```python\nstudents = [\n    {'name': 'Alice', 'score': 88},\n    {'name': 'Bob', 'score': 95},\n    {'name': 'Cindy', 'score': 72},\n]\nranked = sorted(students, key=lambda item: item['score'], reverse=True)\nprint(ranked)\n```",
                        "讲解：`key` 决定按什么排序，`reverse=True` 决定从大到小，这是处理列表字典时非常常用的写法。",
                    ],
                },
                {
                    "heading": "典例 2：用列表推导式生成学习标签",
                    "lines": [
                        "问题：把成绩转换成是否需要复习的文字标签。",
                        "思路：用列表推导式把遍历、判断和生成新列表合并成一行清晰表达。",
                        "```python\nscores = [45, 60, 72, 58, 91]\nlabels = ['通过' if score >= 60 else '复习' for score in scores]\nprint(labels)\n```",
                        "讲解：列表推导式适合表达“从一个列表生成另一个列表”。如果逻辑太复杂，就应该拆成普通循环或函数。",
                    ],
                },
                {
                    "heading": "典例 3：把温度转换拆成函数",
                    "lines": [
                        "问题：多个地方都要做摄氏度转华氏度，不应该重复写公式。",
                        "思路：把公式封装成函数，主程序只负责调用。",
                        "```python\ndef c_to_f(celsius):\n    return celsius * 9 / 5 + 32\n\nvalues = [0, 20, 37]\nfor value in values:\n    print(value, c_to_f(value))\n```",
                        "讲解：函数的价值不是把代码变短，而是让同一段逻辑有一个清楚的名字，并且可以反复使用。",
                    ],
                },
            ],
        },
        {
            "theme": "文件、JSON、日期",
            "keywords": ["文件", "JSON", "日期", "datetime", "日志"],
            "summary": "这组典例精讲把基础语法放进文件和日期场景，适合连接真实作业需求。",
            "sections": [
                {
                    "heading": "典例 1：读取日志并筛选错误行",
                    "lines": [
                        "问题：从日志文件中找出包含 `ERROR` 的行。",
                        "思路：逐行读取文件，筛选命中的行，并处理文件不存在的情况。",
                        "```python\ndef find_errors(path):\n    errors = []\n    try:\n        with open(path, 'r', encoding='utf-8') as file:\n            for line in file:\n                if 'ERROR' in line:\n                    errors.append(line.strip())\n    except FileNotFoundError:\n        return []\n    return errors\n\nprint(find_errors('app.log'))\n```",
                        "讲解：文件处理要关注两个点：资源是否正确关闭，异常情况是否能给出可控结果。",
                    ],
                },
                {
                    "heading": "典例 2：把任务清单保存成 JSON",
                    "lines": [
                        "问题：程序里的任务列表需要保存到本地文件，方便下次读取。",
                        "思路：用 `json.dump` 写文件，并设置中文友好的编码参数。",
                        "```python\nimport json\n\ndef save_tasks(path, tasks):\n    with open(path, 'w', encoding='utf-8') as file:\n        json.dump(tasks, file, ensure_ascii=False, indent=2)\n\ntasks = [{'title': '复习循环', 'done': False}]\nsave_tasks('tasks.json', tasks)\n```",
                        "讲解：JSON 适合保存列表、字典这类结构化数据，比自己拼字符串更稳定。",
                    ],
                },
                {
                    "heading": "典例 3：计算两个日期相差几天",
                    "lines": [
                        "问题：根据目标日期计算距离今天还有多少天。",
                        "思路：先把字符串解析成日期对象，再相减得到天数。",
                        "```python\nfrom datetime import date, datetime\n\ndef days_until(date_text):\n    target = datetime.strptime(date_text, '%Y-%m-%d').date()\n    return (target - date.today()).days\n\nprint(days_until('2026-06-30'))\n```",
                        "讲解：字符串不能直接做日期计算，先解析成 `date` 对象，后续相减才可靠。",
                    ],
                },
            ],
        },
        {
            "theme": "循环菜单、集合去重、简单类",
            "keywords": ["循环", "菜单", "集合", "去重", "类"],
            "summary": "这组典例精讲展示小工具常见结构，重点是控制流程和数据封装。",
            "sections": [
                {
                    "heading": "典例 1：编写简单命令菜单",
                    "lines": [
                        "问题：用户输入不同选项时，程序要执行不同操作。",
                        "思路：用分支处理菜单选项，先把单次选择处理清楚。",
                        "```python\ndef handle_choice(choice):\n    if choice == '1':\n        return '查看任务'\n    if choice == '2':\n        return '添加任务'\n    if choice == '3':\n        return '退出程序'\n    return '无效选项'\n\nfor choice in ['1', '2', '3', 'x']:\n    print(handle_choice(choice))\n```",
                        "讲解：菜单程序的核心是“输入 -> 分支 -> 反馈”。单次选择逻辑稳定后，再扩展成交互循环。",
                    ],
                },
                {
                    "heading": "典例 2：去重并保留原顺序",
                    "lines": [
                        "问题：直接用 `set` 可以去重，但会丢失原顺序。",
                        "思路：用集合记录见过的元素，用列表保存最终结果。",
                        "```python\ndef unique_keep_order(items):\n    result = []\n    seen = set()\n    for item in items:\n        if item not in seen:\n            seen.add(item)\n            result.append(item)\n    return result\n\nprint(unique_keep_order(['a', 'b', 'a', 'c', 'b']))\n```",
                        "讲解：集合负责快速判断是否出现过，列表负责维持展示顺序，两个结构各做一件事。",
                    ],
                },
                {
                    "heading": "典例 3：用类封装待办事项",
                    "lines": [
                        "问题：一个待办事项既有标题，又有完成状态，适合封装成对象。",
                        "思路：用 `__init__` 保存初始状态，用方法修改对象状态。",
                        "```python\nclass TodoItem:\n    def __init__(self, title):\n        self.title = title\n        self.done = False\n\n    def mark_done(self):\n        self.done = True\n\nitem = TodoItem('完成 Python 练习')\nitem.mark_done()\nprint(item.title, item.done)\n```",
                        "讲解：类适合把相关数据和操作放在一起。`self` 指向当前对象，所以方法能修改对象自己的状态。",
                    ],
                },
            ],
        },
    ],
}

def select_artifact_variant(artifact: ArtifactKind, variant: int) -> dict[str, Any]:
    banks = ARTIFACT_VARIANT_BANKS[str(artifact)]
    index = (max(variant, 1) - 1) % len(banks)
    return banks[index]

def build_variant_artifact_payload(artifact: ArtifactKind, variant: int) -> dict[str, Any]:
    bank = select_artifact_variant(artifact, variant)
    return {
        "kind": artifact,
        "title": "自我练习" if artifact == "summary" else "典例精讲",
        "summary": bank["summary"],
        "sections": bank["sections"],
    }

def artifact_sections_match_variant(sections: list[dict[str, Any]], bank: dict[str, Any]) -> bool:
    combined_parts: list[str] = []
    for section in sections:
        combined_parts.append(str(section.get("heading", "")))
        lines = section.get("lines", [])
        if isinstance(lines, list):
            combined_parts.extend(str(line) for line in lines)
    combined = "\n".join(combined_parts)
    return any(str(keyword) in combined for keyword in bank.get("keywords", []))

LEGACY_ARTIFACT_MARKERS = (
    "count_even",
    "average_score",
    "scores.csv",
    "class Student",
    "is_passed",
    "change_value",
    "read_text(",
    "write_scores",
)

def artifact_contains_legacy_topics(sections: list[dict[str, Any]]) -> bool:
    combined_parts: list[str] = []
    for section in sections:
        combined_parts.append(str(section.get("heading", "")))
        lines = section.get("lines", [])
        if isinstance(lines, list):
            combined_parts.extend(str(line) for line in lines)
    combined = "\n".join(combined_parts)
    return any(marker in combined for marker in LEGACY_ARTIFACT_MARKERS)

def artifact_payload_is_usable(payload: Any, artifact: ArtifactKind, bank: dict[str, Any]) -> bool:
    if not isinstance(payload, dict):
        return False

    sections = payload.get("sections")
    if not isinstance(sections, list) or len(sections) < 3:
        return False

    normalized_sections: list[dict[str, Any]] = []
    for section in sections[:3]:
        if not isinstance(section, dict):
            return False
        lines = section.get("lines")
        if not isinstance(lines, list):
            return False
        normalized_lines = [str(line).strip() for line in lines if str(line).strip()]
        if len(normalized_lines) < 4:
            return False
        normalized_sections.append(
            {
                "heading": str(section.get("heading", "")).strip(),
                "lines": normalized_lines,
            }
        )

    if artifact_contains_legacy_topics(normalized_sections):
        return False

    has_code = any("```" in line for section in normalized_sections for line in section["lines"])
    if not has_code:
        return False

    if not artifact_sections_match_variant(normalized_sections, bank):
        return False

    if artifact == "summary":
        answer_words = ("答案", "参考答案", "参考代码", "完整代码", "标准答案", "答案解析", "绛旀", "鏍囧噯绛旀")
        starter_words = ("TODO", "pass", "起步代码", "自查提示", "璧锋", "鑷")
        has_answer = any(
            any(word in line for word in answer_words)
            for section in normalized_sections
            for line in section["lines"]
        )
        has_starter = any(
            any(word in line for word in starter_words)
            for section in normalized_sections
            for line in section["lines"]
        )
        if has_answer or not has_starter:
            return False

    return True

def build_rotating_artifact_payload_from_profile(
    settings: Settings,
    course: dict[str, Any],
    profile: dict[str, Any],
    focus: str,
    depth: int,
    artifact: ArtifactKind,
    variant: int,
) -> dict[str, Any]:
    bank = select_artifact_variant(artifact, variant)
    try:
        payload = build_distinct_artifact_payload_from_profile(settings, course, profile, focus, depth, artifact)
    except HTTPException:
        raise

    if artifact_payload_is_usable(payload, artifact, bank):
        return payload

    return build_variant_artifact_payload(artifact, variant)

def build_distinct_artifact_payload_from_profile(
    settings: Settings,
    course: dict[str, Any],
    profile: dict[str, Any],
    focus: str,
    depth: int,
    artifact: ArtifactKind,
) -> dict[str, Any]:
    retrieved_docs, _, _ = retrieve_context(settings, course, profile, focus)
    artifact_label = "练习" if artifact == "summary" else "讲解"

    if artifact == "summary":
        artifact_instruction = """
请生成 3 道递进式 Python 练习。每个 section 对应一道可以独立完成的题。
每个 section 的 lines 必须至少包含以下 4 项：
1. 题目：明确需要完成什么
2. 要求：说明输入输出、边界条件或完成标准
3. ```python 起步代码```：只给出函数签名、类结构、主程序框架或必要示例输入，不要给完整答案
4. 自查提示：提醒学生可以从哪些方向检查自己的程序

重点：练习部分不要出现完整解题代码，不要直接给出标准答案，不要写“答案解析”。
"""
    else:
        artifact_instruction = """
请生成 3 组 Python 例题讲解。每个 section 围绕一个典型问题，必须给出完整解法。
每个 section 的 lines 必须至少包含以下 4 项：
1. 问题：描述典型提问或业务场景
2. 思路：说明解题分析方法
3. ```python 完整代码```：给出可直接运行的完整解法
4. 讲解：解释关键知识点、易错点和为什么这样写

重点：讲解部分可以给出完整答案，但要让学生看懂解题过程。
"""

    prompt = f"""
请基于以下信息生成 {artifact_label} JSON。
课程信息：
{json_dumps(course)}

学习情况：
{json_dumps(profile)}

当前学习方式：{focus}
内容详略：{["轻量", "标准", "增强"][depth - 1]}

学习依据：
{json_dumps(retrieved_docs)}

严格输出如下 JSON：
{{
  "kind": "{artifact}",
  "title": "...",
  "summary": "...",
  "sections": [
    {{
      "heading": "...",
      "lines": ["...", "..."]
    }}
  ]
}}

通用要求：
1. sections 必须输出 3 个
2. 每个 section 的 heading 要像真实题目标题，不要写“第一部分”这种空标题
3. 每个 section 的 lines 至少输出 4 条
4. 每个 section 必须包含一个 ```python 代码块
5. 代码必须是 Python，不要写伪代码
6. 内容面向学生，不要出现系统术语
7. title 和 summary 要让学生一眼看出这是“练习”还是“讲解”

附加说明：
{artifact_instruction}
"""
    payload = call_chat_json(settings, SYSTEM_PROMPTS["artifact"], prompt)

    sections = payload.get("sections", [])
    normalized_sections: list[dict[str, Any]] = []
    for index, section in enumerate(sections[:3], start=1):
        default_heading = f"练习 {index}" if artifact == "summary" else f"讲解 {index}"
        heading = str(section.get("heading", "")).strip() or default_heading
        lines = [str(line).strip() for line in section.get("lines", []) if str(line).strip()]
        normalized_sections.append({"heading": heading, "lines": lines})

    has_code = any("```" in line for section in normalized_sections for line in section["lines"])
    summary_has_answer_words = any(
        any(keyword in line for keyword in ("答案", "解析", "标准答案"))
        for section in normalized_sections
        for line in section["lines"]
    )
    summary_has_starter_markers = any(
        any(marker in line for marker in ("TODO", "pass", "起步代码", "自查提示"))
        for section in normalized_sections
        for line in section["lines"]
    )

    if (
        not normalized_sections
        or not has_code
        or (artifact == "summary" and (summary_has_answer_words or not summary_has_starter_markers))
    ):
        if artifact == "summary":
            normalized_sections = [
                {
                    "heading": "练习 1：统计列表中的偶数个数",
                    "lines": [
                        "题目：编写函数 `count_even(numbers)`，统计列表里有多少个偶数。",
                        "要求：输入是整数列表，返回值是偶数数量，请自己完成函数体。",
                        "```python\ndef count_even(numbers):\n    # TODO: 返回 numbers 中偶数的个数\n    pass\n\nif __name__ == '__main__':\n    sample = [1, 2, 3, 4, 5, 6]\n    print(count_even(sample))  # 预期输出：3\n```",
                        "自查提示：先检查是否能正确判断偶数，再测试空列表和全是奇数的情况。",
                    ],
                },
                {
                    "heading": "练习 2：读取 CSV 成绩并计算平均分",
                    "lines": [
                        "题目：读取 `scores.csv` 文件，计算全班平均分。",
                        "要求：使用 `csv` 标准库，假设文件包含 `name,score` 两列，空文件时返回 0。",
                        "```python\nimport csv\n\ndef average_score(path):\n    total = 0\n    count = 0\n\n    # TODO: 读取 CSV 并累加成绩\n\n    return 0 if count == 0 else total / count\n\nif __name__ == '__main__':\n    print(average_score('scores.csv'))\n```",
                        "自查提示：检查是否正确跳过表头，是否把 score 转成了数字，还要处理空文件。",
                    ],
                },
                {
                    "heading": "练习 3：用类封装学生信息",
                    "lines": [
                        "题目：定义 `Student` 类，保存姓名和成绩，并提供 `is_passed()` 方法判断是否及格。",
                        "要求：构造函数接收 `name` 和 `score`，成绩大于等于 60 视为及格。",
                        "```python\nclass Student:\n    def __init__(self, name, score):\n        self.name = name\n        self.score = score\n\n    def is_passed(self):\n        # TODO: 返回该学生是否及格\n        pass\n\nif __name__ == '__main__':\n    student = Student('Alice', 78)\n    print(student.name)\n    print(student.is_passed())  # 预期输出：True\n```",
                        "自查提示：检查构造方法是否保存了属性，`is_passed()` 是否基于 `self.score` 做判断。",
                    ],
                },
            ]
            fallback_summary = "这里整理了 3 道可以直接动手的 Python 练习，给你题目、要求、起步代码和自查方向，不直接给出完整答案。"
        else:
            normalized_sections = [
                {
                    "heading": "讲解 1：为什么函数里改不到外部变量",
                    "lines": [
                        "问题：在函数内部给变量重新赋值后，为什么函数外的同名变量没变？",
                        "思路：先区分“重新绑定变量”和“修改可变对象内容”，再看作用域规则。",
                        "```python\ndef change_value(x):\n    x = 100\n    return x\n\nnum = 5\nresult = change_value(num)\nprint(num)\nprint(result)\n```",
                        "讲解：整数是不可变对象，`x = 100` 只是让函数内部的 `x` 重新指向新值，不会改掉外面的 `num`。所以最后 `num` 还是 5，`result` 是 100。",
                    ],
                },
                {
                    "heading": "讲解 2：怎么安全读取文件内容",
                    "lines": [
                        "问题：读取文本文件时，怎样避免文件不存在就直接报错？",
                        "思路：用 `with open(...)` 读取文件，再用 `try/except` 捕获常见异常。",
                        "```python\ndef read_text(path):\n    try:\n        with open(path, 'r', encoding='utf-8') as file:\n            return file.read()\n    except FileNotFoundError:\n        return '文件不存在'\n\nif __name__ == '__main__':\n    print(read_text('demo.txt'))\n```",
                        "讲解：`with` 会自动关闭文件，`FileNotFoundError` 用来处理文件不存在的情况。这样程序不会直接中断，用户也能得到明确提示。",
                    ],
                },
                {
                    "heading": "讲解 3：如何把列表数据写成 CSV",
                    "lines": [
                        "问题：已经有一组成绩数据，怎么把它写入 CSV 文件？",
                        "思路：使用 `csv.writer`，先写表头，再逐行写入数据。",
                        "```python\nimport csv\n\ndef write_scores(path, rows):\n    with open(path, 'w', encoding='utf-8', newline='') as file:\n        writer = csv.writer(file)\n        writer.writerow(['name', 'score'])\n        writer.writerows(rows)\n\nif __name__ == '__main__':\n    data = [('Alice', 88), ('Bob', 92)]\n    write_scores('scores.csv', data)\n```",
                        "讲解：写 CSV 时要加 `newline=''`，否则某些环境下会出现空行。`writerows` 适合一次写入多行元组数据。",
                    ],
                },
            ]
            fallback_summary = "这里整理了 3 组常见 Python 问题的讲解，包含解题思路、完整代码和详细解释，适合先看示范再动手。"

        return {
            "kind": artifact,
            "title": artifact_label,
            "summary": fallback_summary,
            "sections": normalized_sections,
        }

    return {
        "kind": payload.get("kind", artifact),
        "title": payload.get("title", artifact_label),
        "summary": payload.get("summary", ""),
        "sections": normalized_sections,
    }

def build_aligned_qa_script_payload_from_summary(
    settings: Settings,
    course: dict[str, Any],
    profile: dict[str, Any],
    focus: str,
    depth: int,
    summary_artifact: dict[str, Any],
) -> dict[str, Any]:
    practice_sections = summary_artifact.get("sections", [])
    normalized_practice_sections: list[dict[str, Any]] = []
    for index, section in enumerate(practice_sections[:3], start=1):
        heading = str(section.get("heading", "")).strip() or f"练习 {index}"
        lines = [str(line).strip() for line in section.get("lines", []) if str(line).strip()]
        if lines:
            normalized_practice_sections.append({"heading": heading, "lines": lines})

    if not normalized_practice_sections:
        return build_distinct_artifact_payload_from_profile(settings, course, profile, focus, depth, "qa_script")

    prompt = f"""
请基于下面这组已经确定好的 Python 自我练习题，生成一份一一对应的“典例精讲”JSON。

课程信息：{json_dumps(course)}

学习情况：{json_dumps(profile)}

当前学习方式：{focus}
内容详略：{["轻量", "标准", "增强"][depth - 1]}

自我练习题：{json_dumps(normalized_practice_sections)}

严格输出如下 JSON：
{{
  "kind": "qa_script",
  "title": "...",
  "summary": "...",
  "sections": [
    {{
      "heading": "...",
      "lines": ["...", "..."]
    }}
  ]
}}

规则：
1. sections 数量必须与自我练习题数量一致，顺序也必须一致。
2. 第 N 个讲解 section 只能讲解第 N 个练习题，不能换题，不能扩展成另一组内容。
3. 每个 section 的 heading 要和对应练习题明显对应，学生一眼能看出是在讲哪一题。
4. 每个 section 的 lines 至少包含 4 项，而且必须包含：
   - 问题：用自己的话重述这道题
   - 思路：说明怎么解
   - ```python 完整代码```：给出这道题的完整参考实现
   - 讲解：解释关键点、易错点、为什么这么写
5. 完整代码必须直接对应原练习题中的输入输出和类/函数设计，不要改题意。
6. 面向学生表达，不要输出系统说明。
7. 只输出 JSON，不要输出 Markdown 说明文字。
"""
    payload = call_chat_json(settings, SYSTEM_PROMPTS["artifact"], prompt)

    sections = payload.get("sections", [])
    normalized_sections: list[dict[str, Any]] = []
    for index, section in enumerate(sections[: len(normalized_practice_sections)], start=1):
        source_heading = normalized_practice_sections[index - 1]["heading"]
        default_heading = source_heading.replace("练习", "典例精讲", 1) if "练习" in source_heading else f"典例精讲 {index}"
        heading = str(section.get("heading", "")).strip() or default_heading
        lines = [str(line).strip() for line in section.get("lines", []) if str(line).strip()]
        normalized_sections.append({"heading": heading, "lines": lines})

    has_code = all(any("```" in line for line in section["lines"]) for section in normalized_sections)
    if len(normalized_sections) != len(normalized_practice_sections) or not has_code:
        fallback_sections: list[dict[str, Any]] = []
        for index, section in enumerate(normalized_practice_sections, start=1):
            source_heading = section["heading"]
            default_heading = source_heading.replace("练习", "典例精讲", 1) if "练习" in source_heading else f"典例精讲 {index}"
            problem_line = next((line for line in section["lines"] if "题目" in line), section["lines"][0])
            fallback_sections.append(
                {
                    "heading": default_heading,
                    "lines": [
                        f"问题：{problem_line.replace('题目：', '').strip()}",
                        "思路：先按题目要求补全类、函数或主流程，再用测试代码验证输出是否符合预期。",
                        "```python\n# 当前讲解生成未完成，请重新点击“生成典例精讲”获取这道题的完整参考代码。\n```",
                        f"讲解：这部分讲解应该与“{source_heading}”保持一致，不应切换成另一道题。",
                    ],
                }
            )

        return {
            "kind": "qa_script",
            "title": "典例精讲",
            "summary": "这里会围绕当前这组三道自我练习题，给出一一对应的解题思路和参考代码。",
            "sections": fallback_sections,
        }

    return {
        "kind": "qa_script",
        "title": payload.get("title", "典例精讲"),
        "summary": payload.get("summary", "这里会围绕当前这组三道自我练习题，给出一一对应的解题思路和参考代码。"),
        "sections": normalized_sections,
    }

def build_exercise_review_payload(
    settings: Settings,
    course: dict[str, Any],
    profile: dict[str, Any],
    request: ExerciseReviewRequest,
) -> dict[str, Any]:
    normalized_code = normalize_submitted_code(request.user_code)
    prompt_lines = [str(line).strip() for line in request.prompt_lines if str(line).strip()]

    if not normalized_code or is_comment_only_code(normalized_code):
        return {
            "exercise_index": request.exercise_index,
            "status": "needs_revision",
            "summary": "这次提交还没有形成可点评的 Python 解答。",
            "strengths": [],
            "issues": ["目前提交内容为空，或者只有注释，没法判断你是否完成了题目要求。"],
            "next_steps": ["先把核心函数或主要处理流程写出来，再重新提交。"],
            "can_view_reference": False,
        }

    if is_obviously_non_python_code(normalized_code):
        return {
            "exercise_index": request.exercise_index,
            "status": "needs_revision",
            "summary": "这次提交看起来不像 Python 代码。",
            "strengths": [],
            "issues": ["当前内容更像其他语言或无关文本，没法按这道 Python 练习来点评。"],
            "next_steps": ["请用 Python 重新提交，至少把函数、类或主要处理逻辑写出来。"],
            "can_view_reference": False,
        }

    prompt = f"""
请根据下面这道 Python 练习和学生提交的代码，输出结构化点评 JSON。

课程：
{course["name"]}

学习情况：
{profile.get("summary", "")}

题目标题：
{request.exercise_heading}

题目内容：
{json_dumps(prompt_lines)}

学生代码：
```python
{normalized_code}
```

严格输出如下 JSON：
{{
  "exercise_index": {request.exercise_index},
  "status": "reviewed",
  "summary": "...",
  "strengths": ["...", "..."],
  "issues": ["...", "..."],
  "next_steps": ["...", "..."],
  "can_view_reference": true
}}

要求：
1. 不要声称运行过代码
2. 只根据题意和代码文本本身判断
3. strengths、issues、next_steps 各输出 2 到 4 条
4. 如果代码有明显问题，也允许 can_view_reference 为 true
5. 面向学生表达，直接、具体，不要输出系统术语
"""
    payload = call_chat_json(settings, SYSTEM_PROMPTS["exercise_review"], prompt)

    return {
        "exercise_index": request.exercise_index,
        "status": str(payload.get("status", "reviewed")),
        "summary": str(payload.get("summary", "")).strip() or "这次提交已经收到，我先帮你做了代码层面的梳理。",
        "strengths": [str(item).strip() for item in payload.get("strengths", []) if str(item).strip()][:4],
        "issues": [str(item).strip() for item in payload.get("issues", []) if str(item).strip()][:4],
        "next_steps": [str(item).strip() for item in payload.get("next_steps", []) if str(item).strip()][:4],
        "can_view_reference": bool(payload.get("can_view_reference", True)),
    }

def build_path_assessment_payload(
    settings: Settings,
    course: dict[str, Any],
    profile: dict[str, Any],
    step: dict[str, Any],
    request: PathAssessmentRequest,
) -> dict[str, Any]:
    feedback = request.feedback.strip()
    prompt = f"""
Assess this Python learning path step based on the student's feedback.

Course:
{json_dumps(course)}

Student profile:
{json_dumps(profile)}

Learning step:
{json_dumps(step)}

Student feedback:
{feedback}

Return strict JSON only:
{{
  "step_index": {request.step_index},
  "mastery": "good|partial|needs_help",
  "summary": "...",
  "issues": ["...", "..."],
  "next_advice": "..."
}}

Rules:
1. Use Chinese for all student-facing text.
2. Do not claim code was executed or tested.
3. Keep summary and next_advice short and specific.
4. issues should contain 0 to 3 concrete weak points.
5. If feedback says the student is still confused, mastery should be "needs_help" or "partial".
"""
    payload = call_chat_json(
        settings,
        "Return a strict JSON assessment for one learning path step. Do not mention internal systems.",
        prompt,
    )
    mastery = str(payload.get("mastery", "partial")).strip()
    if mastery not in {"good", "partial", "needs_help"}:
        mastery = "partial"
    return {
        "step_index": request.step_index,
        "mastery": mastery,
        "summary": str(payload.get("summary", "")).strip() or "\u5df2\u6839\u636e\u4f60\u7684\u53cd\u9988\u66f4\u65b0\u4e86\u8fd9\u4e00\u6b65\u7684\u5b66\u4e60\u8bc4\u4f30\u3002",
        "issues": [str(item).strip() for item in payload.get("issues", []) if str(item).strip()][:3],
        "next_advice": str(payload.get("next_advice", "")).strip() or "\u5148\u628a\u8fd9\u4e00\u6b65\u7684\u5173\u952e\u4ee3\u7801\u518d\u72ec\u7acb\u5199\u4e00\u904d\uff0c\u518d\u8fdb\u5165\u4e0b\u4e00\u6b65\u3002",
    }

@app.get("/api/health")
def health() -> dict[str, Any]:
    settings = get_settings()
    return {
        "status": "ok",
        "service": "a3-backend",
        "llm_configured": settings.llm_configured,
        "chat_configured": settings.chat_configured,
        "embedding_configured": settings.embedding_configured,
        "chat_model": settings.deepseek_chat_model,
        "embedding_model": settings.dashscope_embedding_model,
    }

@app.get("/api/settings")
def get_app_settings() -> dict[str, Any]:
    return settings_payload(get_settings())

@app.post("/api/settings")
def update_app_settings(request: AppSettingsUpdate) -> dict[str, Any]:
    current = load_app_settings()
    updates = request.model_dump(exclude_unset=True)
    for key, value in updates.items():
        if value is None:
            continue
        current[key] = value.strip()
    if current.get("chat_provider") == "custom":
        current["deepseek_base_url"] = str(current.get("deepseek_base_url", "")).strip()
    elif "chat_provider" in current:
        current["deepseek_base_url"] = provider_base_url(CHAT_PROVIDER_OPTIONS, current["chat_provider"])
        current.setdefault("deepseek_chat_model", provider_default_model(CHAT_PROVIDER_OPTIONS, current["chat_provider"]))
    if current.get("embedding_provider") == "custom":
        current["dashscope_base_url"] = str(current.get("dashscope_base_url", "")).strip()
    elif "embedding_provider" in current:
        current["dashscope_base_url"] = provider_base_url(EMBEDDING_PROVIDER_OPTIONS, current["embedding_provider"])
        current.setdefault(
            "dashscope_embedding_model",
            provider_default_model(EMBEDDING_PROVIDER_OPTIONS, current["embedding_provider"]),
        )
    save_app_settings(current)
    return settings_payload(get_settings())

@app.get("/api/catalog")
def catalog() -> dict[str, Any]:
    return {
        "courses": list(COURSES.values()),
        "profiles": list(PROFILES.values()),
        "focus_modes": ["讲解", "练习", "复习"],
    }

@app.get("/api/history")
def history() -> dict[str, list[dict[str, Any]]]:
    return {"records": []}

@app.get("/api/quality")
def quality() -> dict[str, list[dict[str, str]]]:
    return {"checks": []}

@app.get("/api/context")
def context(course_id: CourseId = "python") -> dict[str, Any]:
    course = resolve_course(course_id)
    return {
        "dialog_turns": [
            {"role": "系统", "text": course["opening_prompt"]},
        ],
        "knowledge_items": [],
        "evaluation_bars": [],
        "insight": "先通过对话了解学生的学习目标和困难点，再生成学习方案。",
    }

@app.get("/api/chat/sessions")
def chat_sessions() -> dict[str, Any]:
    return {"sessions": list_sessions()}

@app.get("/api/chat/session/{session_id}")
def get_chat_session(session_id: str) -> dict[str, Any]:
    session = load_session(session_id)
    refresh_session_metadata(session)
    collaboration_trace = ensure_session_collaboration_trace(session)
    if collaboration_trace:
        save_session(session)
    latest_artifacts = get_session_artifacts(session)
    exercise_submissions = get_session_exercise_submissions(session)
    latest_artifacts, exercise_submissions = sanitize_artifact_state_for_response(latest_artifacts, exercise_submissions)
    return {
        "session_id": session["session_id"],
        "course_id": session["course_id"],
        "title": session.get("title", ""),
        "custom_title": session.get("custom_title", ""),
        "preview": session.get("preview", ""),
        "created_at": session.get("created_at", ""),
        "updated_at": session.get("updated_at", ""),
        "messages": session.get("messages", []),
        "profile_completion": session.get("profile_completion", 0),
        "missing_slots": session.get("missing_slots", []),
        "ready_to_generate": session.get("ready_to_generate", False),
        "latest_generation": session.get("latest_generation"),
        "latest_artifact": session.get("latest_artifact"),
        "latest_artifacts": latest_artifacts,
        "exercise_submissions": exercise_submissions,
        "path_progress": get_session_path_progress(session),
        "path_assessments": get_session_path_assessments(session),
        "online_resources": get_session_online_resources(session),
        "generation_history": get_session_generation_history(session),
        "collaboration_trace": collaboration_trace,
    }

@app.post("/api/chat/session")
def create_chat_session(request: ChatSessionRequest) -> dict[str, Any]:
    reusable_session = find_reusable_session(request.course_id)
    if reusable_session is not None:
        return reusable_session
    payload = create_session_payload(request.course_id)
    return payload

@app.patch("/api/chat/session/{session_id}")
def rename_chat_session(session_id: str, request: RenameSessionRequest) -> dict[str, Any]:
    session = load_session(session_id)
    session["custom_title"] = request.title.strip()
    refresh_session_metadata(session)
    save_session(session)
    return build_session_summary(session)

@app.delete("/api/chat/session/{session_id}")
def delete_chat_session(session_id: str) -> dict[str, Any]:
    delete_session_file(session_id)
    return {"status": "deleted", "session_id": session_id}

@app.post("/api/chat/message")
def chat_message(request: ChatMessageRequest) -> dict[str, Any]:
    settings = ensure_llm_configured()
    session = load_session(request.session_id)
    user_message = request.message.strip()
    session["messages"].append({"role": "user", "content": user_message})

    payload = build_chat_payload(settings, session, user_message)
    payload["reply"] = polish_chat_reply(payload["reply"])
    mermaid_requested = has_mermaid_intent(user_message)
    plan_requested = is_learning_plan_request(user_message, payload["reply"])
    ready_for_plan = bool(payload.get("ready_to_generate", False)) or int(payload.get("profile_completion", 0)) >= 75
    if mermaid_requested:
        payload["ready_to_generate"] = False
    elif plan_requested:
        payload["reply"] = "\u53ef\u4ee5\uff0c\u70b9\u51fb\u4e0b\u9762\u7684\u6309\u94ae\u5373\u53ef\u751f\u6210\u5b66\u4e60\u65b9\u6848\u3002"
        payload["ready_to_generate"] = True
    elif ready_for_plan:
        payload["reply"] = "\u4f60\u63d0\u4f9b\u7684\u4fe1\u606f\u5df2\u7ecf\u8db3\u591f\u6574\u7406\u5b66\u4e60\u65b9\u6848\u3002\u8981\u73b0\u5728\u751f\u6210\u5b66\u4e60\u65b9\u6848\u5417\uff1f\u70b9\u51fb\u4e0b\u65b9\u6309\u94ae\u5373\u53ef\u751f\u6210\u3002"
        payload["ready_to_generate"] = True
    suggested_actions = build_suggested_actions(session, payload["reply"], user_message, bool(payload["ready_to_generate"]))
    assistant_message = {"role": "assistant", "content": payload["reply"]}
    if suggested_actions:
        assistant_message["suggested_actions"] = suggested_actions
    session["messages"].append(assistant_message)
    session["profile_completion"] = payload["profile_completion"]
    session["ready_to_generate"] = payload["ready_to_generate"]
    session["missing_slots"] = payload["missing_slots"]
    refresh_session_metadata(session)
    save_session(session)

    return {
        "session_id": session["session_id"],
        "title": session.get("title", ""),
        "preview": session.get("preview", ""),
        "reply": payload["reply"],
        "suggested_actions": suggested_actions,
        "messages": session["messages"],
        "profile_completion": session["profile_completion"],
        "missing_slots": session["missing_slots"],
        "ready_to_generate": session["ready_to_generate"],
    }

@app.post("/api/profile/summarize")
def summarize_profile(request: ProfileSummaryRequest) -> dict[str, Any]:
    settings = ensure_llm_configured()
    session = load_session(request.session_id)
    profile = build_profile_summary_payload(settings, session)
    return {
        "session_id": session["session_id"],
        **profile,
    }

@app.patch("/api/path/progress")
def update_path_progress(request: PathProgressRequest) -> dict[str, Any]:
    session = load_session(request.session_id)
    path_steps = build_current_path_steps(session)
    if not isinstance(path_steps, list) or not path_steps:
        raise HTTPException(status_code=400, detail="learning path has not been generated")
    if request.step_index >= len(path_steps):
        raise HTTPException(status_code=400, detail="path step not found")

    progress = get_session_path_progress(session)
    progress[str(request.step_index)] = request.completed
    session["path_progress"] = progress
    refresh_session_metadata(session)
    save_session(session)
    return {
        "session_id": session["session_id"],
        "path_progress": progress,
    }

@app.post("/api/path/assessment")
def assess_path_step(request: PathAssessmentRequest) -> dict[str, Any]:
    settings = ensure_llm_configured()
    session = load_session(request.session_id)
    latest_generation = session.get("latest_generation")
    path_steps = build_current_path_steps(session)
    if not isinstance(path_steps, list) or not path_steps:
        raise HTTPException(status_code=400, detail="learning path has not been generated")
    if request.step_index >= len(path_steps):
        raise HTTPException(status_code=400, detail="path step not found")

    course = resolve_course(session["course_id"])
    profile = latest_generation.get("profile") if isinstance(latest_generation, dict) else None
    if not isinstance(profile, dict):
        profile_summary = build_profile_summary_payload(settings, session)
        profile = profile_from_session(session, profile_summary)

    assessment = build_path_assessment_payload(settings, course, profile, path_steps[request.step_index], request)
    record = {
        "step_index": request.step_index,
        "feedback": request.feedback.strip(),
        "assessment": assessment,
        "updated_at": now_iso(),
    }
    assessments = get_session_path_assessments(session)
    assessments[str(request.step_index)] = record
    session["path_assessments"] = assessments
    progress = get_session_path_progress(session)
    progress[str(request.step_index)] = assessment.get("mastery") == "good"
    session["path_progress"] = progress
    refresh_session_metadata(session)
    save_session(session)
    return {
        "session_id": session["session_id"],
        "path_progress": progress,
        "path_assessments": assessments,
        "assessment": record,
    }

@app.post("/api/generate")
def generate(request: GenerateRequest) -> dict[str, Any]:
    settings = ensure_llm_configured()
    if request.session_id:
        session = load_session(request.session_id)
        course = resolve_course(session["course_id"])
        profile_summary = build_profile_summary_payload(settings, session)
        profile = profile_from_session(session, profile_summary)
        payload = build_generation_payload_from_profile(settings, course, profile, request.focus, request.depth, request.version)
        resource_query = "，".join(
            item
            for item in [
                str(profile.get("next_focus", "")).strip(),
                str(profile.get("dimensions", {}).get("weakness", "")).strip(),
                "、".join(str(tag) for tag in profile.get("weakness_tags", []) if str(tag).strip()),
            ]
            if item
        )
        online_resource_items = recommend_online_resources(
            course_id=course["id"],
            focus=request.focus,
            profile=profile,
            query=resource_query,
            limit=20,
        )
        online_resource_items = rerank_online_resources_by_embedding(
            settings,
            online_resource_items,
            profile,
            request.focus,
            resource_query,
            limit=10,
        )
        session["latest_generation"] = payload
        session["path_progress"] = {}
        session["path_assessments"] = {}
        session["online_resources"] = online_resource_items
        session["online_resource_state"] = {
            "course_id": course["id"],
            "focus": request.focus,
            "query": resource_query,
            "selected_tags": profile.get("weakness_tags", []),
            "preferred_format_tags": profile.get("preferred_format_tags", []),
            "level_tag": profile.get("level_tag", "beginner"),
            "updated_at": now_iso(),
        }
        collaboration_trace = merge_collaboration_trace(
            session,
            build_generation_collaboration_records(course, profile, payload, online_resource_items),
            replace_roles={"diagnosis", "materials", "content", "path"},
        )
        history = prepend_session_generation_history(
            session,
            {
                "id": request.version,
                "label": f"V{request.version}",
                "detail": f'{course["name"]} / {request.focus} / {payload.get("depth_label", "")}',
            },
        )
        refresh_session_metadata(session)
        save_session(session)
        return {
            **payload,
            "session_id": session["session_id"],
            "history": history,
            "online_resources": get_session_online_resources(session),
            "collaboration_trace": collaboration_trace,
        }

    course = resolve_course(request.course_id)
    profile_id = request.profile_id or "novice"
    profile = default_profile_payload(profile_id)
    return build_generation_payload_from_profile(settings, course, profile, request.focus, request.depth, request.version)

@app.post("/api/artifact")
def artifact(request: ArtifactRequest) -> dict[str, Any]:
    settings = ensure_llm_configured()
    if request.session_id:
        session = load_session(request.session_id)
        course = resolve_course(session["course_id"])
        profile_summary = build_profile_summary_payload(settings, session)
        profile = profile_from_session(session, profile_summary)
        payload = build_rotating_artifact_payload_from_profile(
            settings,
            course,
            profile,
            request.focus,
            request.depth,
            request.artifact,
            request.variant,
        )

        latest_artifacts = get_session_artifacts(session)
        payload = append_artifact_sections(latest_artifacts.get(request.artifact), payload, request.artifact)
        latest_artifacts[request.artifact] = payload
        session["latest_artifacts"] = latest_artifacts
        session["latest_artifact"] = payload
        collaboration_trace = merge_collaboration_trace(
            session,
            [build_artifact_collaboration_record(request.artifact, payload)],
        )
        refresh_session_metadata(session)
        save_session(session)
        return {
            **payload,
            "session_id": session["session_id"],
            "exercise_submissions": get_session_exercise_submissions(session),
            "collaboration_trace": collaboration_trace,
        }

    course = resolve_course(request.course_id)
    profile_id = request.profile_id or "novice"
    profile = default_profile_payload(profile_id)
    return build_rotating_artifact_payload_from_profile(
        settings,
        course,
        profile,
        request.focus,
        request.depth,
        request.artifact,
        request.variant,
    )

@app.post("/api/exercise/review")
def review_exercise(request: ExerciseReviewRequest) -> dict[str, Any]:
    settings = ensure_llm_configured()
    session = load_session(request.session_id)
    course = resolve_course(session["course_id"])

    latest_generation = session.get("latest_generation") or {}
    if latest_generation.get("profile"):
        profile = latest_generation["profile"]
    else:
        profile_summary = build_profile_summary_payload(settings, session)
        profile = profile_from_session(session, profile_summary)

    review = build_exercise_review_payload(settings, course, profile, request)
    normalized_code = normalize_submitted_code(request.user_code)
    submission = {
        "exercise_index": request.exercise_index,
        "exercise_heading": request.exercise_heading.strip(),
        "prompt_lines": request.prompt_lines,
        "user_code": normalized_code,
        "review": review,
        "updated_at": now_iso(),
        "can_view_reference": review.get("can_view_reference", False),
        "reference_open": False,
    }

    exercise_submissions = get_session_exercise_submissions(session)
    previous = exercise_submissions.get(str(request.exercise_index))
    if isinstance(previous, dict):
        submission["reference_open"] = bool(previous.get("reference_open", False) and review.get("can_view_reference", False))

    exercise_submissions[str(request.exercise_index)] = submission
    session["exercise_submissions"] = exercise_submissions
    collaboration_trace = merge_collaboration_trace(
        session,
        [build_review_collaboration_record(request, review)],
    )
    refresh_session_metadata(session)
    save_session(session)

    return {
        "session_id": session["session_id"],
        **review,
        "submission": submission,
        "collaboration_trace": collaboration_trace,
    }

@app.patch("/api/exercise/reference")
def update_exercise_reference(request: ExerciseReferenceRequest) -> dict[str, Any]:
    session = load_session(request.session_id)
    exercise_submissions = get_session_exercise_submissions(session)
    submission = exercise_submissions.get(str(request.exercise_index))
    if not isinstance(submission, dict):
        raise HTTPException(status_code=404, detail="exercise submission not found")

    if not submission.get("can_view_reference"):
        raise HTTPException(status_code=400, detail="reference is still locked")

    submission["reference_open"] = bool(request.reference_open)
    submission["updated_at"] = now_iso()
    exercise_submissions[str(request.exercise_index)] = submission
    session["exercise_submissions"] = exercise_submissions
    refresh_session_metadata(session)
    save_session(session)

    return {
        "status": "updated",
        "session_id": session["session_id"],
        "submission": submission,
    }

@app.post("/api/online-resources")
def online_resources(request: OnlineResourceRequest) -> dict[str, Any]:
    profile: dict[str, Any]
    session: dict[str, Any] | None = None

    if request.session_id:
        session = load_session(request.session_id)
        course = resolve_course(session["course_id"])
        latest_generation = session.get("latest_generation") or {}
        if latest_generation.get("profile"):
            profile = latest_generation["profile"]
        else:
            settings = get_settings()
            if settings.llm_configured and session.get("messages"):
                profile_summary = build_profile_summary_payload(settings, session)
                profile = profile_from_session(session, profile_summary)
            else:
                profile = default_profile_payload("novice")
    else:
        course = resolve_course(request.course_id)
        profile = default_profile_payload("novice")

    profile.update(resolve_profile_recommendation_tags(profile, request.query.strip(), request.focus))
    resources = recommend_online_resources(
        course_id=course["id"],
        focus=request.focus,
        profile=profile,
        query=request.query.strip(),
        limit=20,
    )
    resources = rerank_online_resources_by_embedding(
        get_settings(),
        resources,
        profile,
        request.focus,
        request.query.strip(),
        limit=10,
    )
    if session is not None:
        session["online_resources"] = resources
        session["online_resource_state"] = {
            "course_id": course["id"],
            "focus": request.focus,
            "query": request.query.strip(),
            "selected_tags": profile.get("weakness_tags", []),
            "preferred_format_tags": profile.get("preferred_format_tags", []),
            "level_tag": profile.get("level_tag", "beginner"),
            "updated_at": now_iso(),
        }
        refresh_session_metadata(session)
        save_session(session)
    return {
        "session_id": session["session_id"] if session is not None else None,
        "course_id": course["id"],
        "focus": request.focus,
        "query": request.query.strip(),
        "selected_tags": profile.get("weakness_tags", []),
        "preferred_format_tags": profile.get("preferred_format_tags", []),
        "level_tag": profile.get("level_tag", "beginner"),
        "resources": resources,
    }
