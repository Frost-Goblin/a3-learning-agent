import type { ReactNode } from 'react'

export type AppStage = 'chatting' | 'ready_to_generate' | 'generated' | 'refining'
export type ArtifactKind = 'summary' | 'qa_script'
export type AppView = 'chat' | 'profile' | 'resources' | 'examples' | 'practice' | 'path'
export type SuggestedActionType = 'generate_plan' | 'generate_examples' | 'generate_practice' | 'recommend_resources'

export type Course = {
  id: string
  badge: string
  name: string
  summary: string
  difficulty: string
  seeds: string[]
  deliverables: string[]
  painPoint: string
}

export type ChatMessage = {
  role: 'assistant' | 'user'
  content: string
  suggested_actions?: SuggestedAction[]
}

export type ChatMessagePayload = {
  session_id?: string
  messages?: ChatMessage[]
  profile_completion?: number
  missing_slots?: string[]
  ready_to_generate?: boolean
}

export type ChatStreamEvent =
  | { type: 'start'; session_id?: string }
  | { type: 'delta'; text?: string }
  | { type: 'done'; payload?: ChatMessagePayload }
  | { type: 'error'; detail?: string; status_code?: number }

export type DisplayMessage = ChatMessage & {
  status?: 'thinking'
}

export type SuggestedAction = {
  type: SuggestedActionType
  label: string
}

export type ProfileSummary = {
  summary: string
  dimensions: {
    knowledge: string
    pace: string
    preference: string
    weakness: string
    motivation: string
    evaluation: string
  }
  confidence?: number
  next_focus?: string
  weakness_tags?: string[]
  preferred_format_tags?: string[]
  level_tag?: string
}

export type Resource = {
  kind: string
  title: string
  description: string
  tag: string
  content_preview: string[]
  suitability_reason: string
}

export type PathStep = {
  title: string
  detail: string
  duration: string
  expected_outcome: string
}

export type PathProgressState = Record<string, boolean>

export type PathAssessmentState = {
  step_index: number
  feedback: string
  assessment: {
    step_index: number
    mastery: 'good' | 'partial' | 'needs_help'
    summary: string
    issues: string[]
    next_advice: string
  }
  updated_at: string
}

export type PathAssessmentCollection = Record<string, PathAssessmentState>

export type ArtifactSection = {
  heading: string
  lines: string[]
}

export type ArtifactState = {
  kind: ArtifactKind
  title: string
  summary: string
  sections: ArtifactSection[]
  exercise_submissions?: ExerciseSubmissionCollection
}

export type ArtifactCollection = Partial<Record<ArtifactKind, ArtifactState>>

export type ArtifactSegment = {
  kind: 'markdown' | 'code'
  content: string
  language?: string
}

export type MarkdownCodeProps = {
  inline?: boolean
  className?: string
  children?: ReactNode
}

export type ExerciseReviewState = {
  exercise_index: number
  status: string
  summary: string
  strengths: string[]
  issues: string[]
  next_steps: string[]
  can_view_reference: boolean
}

export type ExerciseSubmissionState = {
  exercise_index: number
  exercise_heading: string
  prompt_lines: string[]
  user_code: string
  review: ExerciseReviewState
  updated_at: string
  can_view_reference: boolean
  reference_open: boolean
}

export type ExerciseSubmissionCollection = Record<string, ExerciseSubmissionState>

export type CollaborationRecord = {
  role: string
  title: string
  status: string
  input_summary: string
  output_summary: string
  used_sources: string[]
  updated_at: string
}

export type OnlineResource = {
  id: string
  title: string
  url: string
  provider: string
  kind: string
  level: string
  summary: string
  recommended_reason: string
  match_labels?: string[]
  knowledge_tags?: string[]
  format_tags?: string[]
  level_tag?: string
}

export type GenerationState = {
  profile: ProfileSummary
  resources: Resource[]
  path: PathStep[]
  mode_hint: string
  depth_label: string
  using_materials: boolean
}

export type RunRecord = {
  id: number
  label: string
  detail: string
}

export type SessionSummary = {
  session_id: string
  course_id: string
  title: string
  preview: string
  updated_at: string
  message_count: number
  profile_completion: number
  ready_to_generate: boolean
  has_generation: boolean
}

export type SessionDetail = {
  session_id: string
  course_id: string
  title: string
  custom_title: string
  preview: string
  created_at: string
  updated_at: string
  messages: ChatMessage[]
  profile_completion: number
  missing_slots: string[]
  ready_to_generate: boolean
  latest_generation: GenerationState | null
  latest_artifact: ArtifactState | null
  latest_artifacts?: ArtifactCollection
  exercise_submissions?: ExerciseSubmissionCollection
  path_progress?: PathProgressState
  path_assessments?: PathAssessmentCollection
  online_resources?: OnlineResource[]
  generation_history?: RunRecord[]
  collaboration_trace?: CollaborationRecord[]
}

export type ProviderOption = {
  id: string
  label: string
  models: string[]
}

export type AppSettingsState = {
  chat_configured: boolean
  embedding_configured: boolean
  llm_configured: boolean
  chat_provider: string
  embedding_provider: string
  deepseek_api_key_masked: string
  dashscope_api_key_masked: string
  deepseek_base_url: string
  deepseek_chat_model: string
  dashscope_base_url: string
  dashscope_embedding_model: string
  chat_provider_options?: ProviderOption[]
  embedding_provider_options?: ProviderOption[]
}

export type AppSettingsDraft = {
  chat_provider: string
  embedding_provider: string
  deepseek_api_key: string
  deepseek_base_url: string
  deepseek_chat_model: string
  dashscope_api_key: string
  dashscope_base_url: string
  dashscope_embedding_model: string
}
