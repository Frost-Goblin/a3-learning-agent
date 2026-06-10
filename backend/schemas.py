from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


CourseId = Literal["python"]
ProfileId = Literal["novice", "transfer", "competition"]
FocusMode = Literal["讲解", "练习", "复习"]
ArtifactKind = Literal["summary", "qa_script"]
ChatProvider = Literal["deepseek", "qwen", "openai", "moonshot", "siliconflow", "custom"]
EmbeddingProvider = Literal["dashscope", "openai", "siliconflow", "custom"]


class ChatSessionRequest(BaseModel):
    course_id: CourseId = "python"


class RenameSessionRequest(BaseModel):
    title: str = Field(min_length=1, max_length=40)


class ChatMessageRequest(BaseModel):
    session_id: str
    message: str = Field(min_length=1, max_length=1500)


class ProfileSummaryRequest(BaseModel):
    session_id: str


class GenerateRequest(BaseModel):
    session_id: str | None = None
    course_id: CourseId = "python"
    profile_id: ProfileId | None = None
    focus: FocusMode = "讲解"
    depth: int = Field(default=2, ge=1, le=3)
    version: int = Field(default=1, ge=1)


class ArtifactRequest(BaseModel):
    session_id: str | None = None
    course_id: CourseId = "python"
    profile_id: ProfileId | None = None
    focus: FocusMode = "讲解"
    depth: int = Field(default=2, ge=1, le=3)
    artifact: ArtifactKind = "summary"
    variant: int = Field(default=1, ge=1)


class OnlineResourceRequest(BaseModel):
    session_id: str | None = None
    course_id: CourseId = "python"
    focus: FocusMode = "讲解"
    query: str = Field(default="", max_length=120)


class PathProgressRequest(BaseModel):
    session_id: str
    step_index: int = Field(ge=0)
    completed: bool


class PathAssessmentRequest(BaseModel):
    session_id: str
    step_index: int = Field(ge=0)
    feedback: str = Field(min_length=1, max_length=1200)


class ExerciseReviewRequest(BaseModel):
    session_id: str
    exercise_index: int = Field(ge=0)
    exercise_heading: str = Field(min_length=1, max_length=120)
    prompt_lines: list[str] = Field(min_length=1, max_length=12)
    user_code: str = Field(min_length=1, max_length=12000)


class ExerciseReferenceRequest(BaseModel):
    session_id: str
    exercise_index: int = Field(ge=0)
    reference_open: bool


class AppSettingsUpdate(BaseModel):
    chat_provider: ChatProvider | None = None
    embedding_provider: EmbeddingProvider | None = None
    deepseek_api_key: str | None = Field(default=None, max_length=300)
    deepseek_base_url: str | None = Field(default=None, max_length=200)
    deepseek_chat_model: str | None = Field(default=None, max_length=80)
    dashscope_api_key: str | None = Field(default=None, max_length=300)
    dashscope_base_url: str | None = Field(default=None, max_length=200)
    dashscope_embedding_model: str | None = Field(default=None, max_length=80)
