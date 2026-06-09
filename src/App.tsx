import { useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import mermaid from 'mermaid'
import {
  BookOpen,
  Check,
  Clock,
  ClipboardCheck,
  Copy,
  Compass,
  ExternalLink,
  Globe,
  History,
  MessageSquareText,
  PencilLine,
  RefreshCw,
  Route,
  SendHorizontal,
  Settings as SettingsIcon,
  Sparkles,
  Target,
  TimerReset,
  Trash2,
  UserRound,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'
import './App.css'

type AppStage = 'chatting' | 'ready_to_generate' | 'generated' | 'refining'
type ArtifactKind = 'summary' | 'qa_script'
type AppView = 'chat' | 'profile' | 'resources' | 'examples' | 'practice' | 'path'
type SuggestedActionType = 'generate_plan' | 'generate_examples' | 'generate_practice' | 'recommend_resources'

type Course = {
  id: string
  badge: string
  name: string
  summary: string
  difficulty: string
  seeds: string[]
  deliverables: string[]
  painPoint: string
}

type ChatMessage = {
  role: 'assistant' | 'user'
  content: string
  suggested_actions?: SuggestedAction[]
}

type DisplayMessage = ChatMessage & {
  status?: 'thinking'
}

type SuggestedAction = {
  type: SuggestedActionType
  label: string
}

type ProfileSummary = {
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

type Resource = {
  kind: string
  title: string
  description: string
  tag: string
  content_preview: string[]
  suitability_reason: string
}

type PathStep = {
  title: string
  detail: string
  duration: string
  expected_outcome: string
}

type PathProgressState = Record<string, boolean>

type PathAssessmentState = {
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

type PathAssessmentCollection = Record<string, PathAssessmentState>

type ArtifactSection = {
  heading: string
  lines: string[]
}

type ArtifactState = {
  kind: ArtifactKind
  title: string
  summary: string
  sections: ArtifactSection[]
  exercise_submissions?: ExerciseSubmissionCollection
}

type ArtifactCollection = Partial<Record<ArtifactKind, ArtifactState>>

type ArtifactSegment = {
  kind: 'markdown' | 'code'
  content: string
  language?: string
}

type MarkdownCodeProps = {
  inline?: boolean
  className?: string
  children?: ReactNode
}

let mermaidCounter = 0

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'strict',
  theme: 'base',
  themeVariables: {
    primaryColor: '#eef6ff',
    primaryTextColor: '#162033',
    primaryBorderColor: '#8bb8e8',
    lineColor: '#0b6bcb',
    secondaryColor: '#f8fafc',
    tertiaryColor: '#fff9db',
    fontFamily: 'Inter, "Microsoft YaHei", sans-serif',
  },
})

type ExerciseReviewState = {
  exercise_index: number
  status: string
  summary: string
  strengths: string[]
  issues: string[]
  next_steps: string[]
  can_view_reference: boolean
}

type ExerciseSubmissionState = {
  exercise_index: number
  exercise_heading: string
  prompt_lines: string[]
  user_code: string
  review: ExerciseReviewState
  updated_at: string
  can_view_reference: boolean
  reference_open: boolean
}

type ExerciseSubmissionCollection = Record<string, ExerciseSubmissionState>

type CollaborationRecord = {
  role: string
  title: string
  status: string
  input_summary: string
  output_summary: string
  used_sources: string[]
  updated_at: string
}

type OnlineResource = {
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

type GenerationState = {
  profile: ProfileSummary
  resources: Resource[]
  path: PathStep[]
  mode_hint: string
  depth_label: string
  using_materials: boolean
}

type RunRecord = {
  id: number
  label: string
  detail: string
}

type SessionSummary = {
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

type SessionDetail = {
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

type AppSettingsState = {
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

type AppSettingsDraft = {
  chat_provider: string
  embedding_provider: string
  deepseek_api_key: string
  deepseek_base_url: string
  deepseek_chat_model: string
  dashscope_api_key: string
  dashscope_base_url: string
  dashscope_embedding_model: string
}

type ProviderOption = {
  id: string
  label: string
  models: string[]
}

const LAST_SESSION_KEY = 'a3-learning-agent:last-session'

const TEXT = {
  heading: 'AI-Python\u5b66\u4e60\u52a9\u624b',
  connecting: '\u8fde\u63a5\u4e2d',
  newChat: '\u65b0\u804a\u5929',
  recentChats: '\u6700\u8fd1\u804a\u5929',
  recentChatsHint: '\u4e0b\u6b21\u6253\u5f00\u65f6\uff0c\u4f1a\u4f18\u5148\u63a5\u7740\u6700\u8fd1\u4e00\u6b21\u7ee7\u7eed\u3002',
  currentCourse: '\u5f53\u524d\u8bfe\u7a0b',
  planDepth: '\u65b9\u6848\u8be6\u7565',
  currentStatus: '\u5f53\u524d\u72b6\u6001',
  chat: '\u5bf9\u8bdd',
  profile: '\u5b66\u4e60\u60c5\u51b5',
  resources: '\u63a8\u8350\u8d44\u6599',
  path: '\u5b66\u4e60\u8def\u5f84',
  assistant: '\u5b66\u4e60\u52a9\u624b',
  you: '\u4f60',
  thinking: '\u601d\u8003\u4e2d...',
  preparing: '\u6b63\u5728\u51c6\u5907\u5bf9\u8bdd\u3002',
  send: '\u53d1\u9001',
  courseTitle: '\u5f53\u524d\u8bfe\u7a0b',
  moreInfo: '\u8fd8\u60f3\u4e86\u89e3',
  nextStep: '\u4e0b\u4e00\u6b65',
  enoughInfo: '\u4fe1\u606f\u5df2\u7ecf\u591f\u7528\uff0c\u53ef\u4ee5\u5f00\u59cb\u751f\u6210\u5b66\u4e60\u65b9\u6848\u3002',
  continueTalk:
    '\u7ee7\u7eed\u901a\u8fc7\u5bf9\u8bdd\u628a\u76ee\u6807\u3001\u96be\u70b9\u548c\u504f\u597d\u8bf4\u6e05\u695a\u3002',
  generatePlan: '\u751f\u6210\u5b66\u4e60\u65b9\u6848',
  generating: '\u751f\u6210\u4e2d...',
  noHistory: '\u8fd8\u6ca1\u6709\u804a\u5929\u8bb0\u5f55\u3002',
  continueChat: '\u7ee7\u7eed\u804a\u5929',
  planReady: '\u5df2\u6574\u7406\u65b9\u6848',
  records: '\u6761\u8bb0\u5f55',
  rename: '\u4fee\u6539\u6807\u9898',
  delete: '\u5220\u9664\u804a\u5929',
  profileHint: '\u8fd9\u91cc\u5c55\u793a\u5bf9\u8bdd\u540e\u7684\u5b66\u4e60\u60c5\u51b5\u603b\u7ed3\u3002',
  resourcesHint: '\u8fd9\u91cc\u53ea\u4fdd\u7559\u7ed9\u4f60\u505a\u8865\u5145\u5b66\u4e60\u7684\u5916\u90e8\u8d44\u6599\u3002',
  practice: '\u81ea\u6211\u7ec3\u4e60',
  practiceHint: '\u8fd9\u91cc\u4e13\u95e8\u653e\u7ec3\u4e60\u9898\u3001\u4f5c\u7b54\u9762\u677f\u548c\u53c2\u8003\u8bb2\u89e3\u3002',
  pathHint: '\u8fd9\u91cc\u5c55\u793a\u6309\u9636\u6bb5\u5b89\u6392\u7684\u5b66\u4e60\u6b65\u9aa4\u548c\u5b8c\u6210\u6807\u51c6\u3002',
  summaryFallback: '\u5df2\u7ecf\u6839\u636e\u4f60\u7684\u5bf9\u8bdd\u6574\u7406\u51fa\u4e00\u4efd\u5b66\u4e60\u60c5\u51b5\u603b\u7ed3\u3002',
  nextFocus: '\u5efa\u8bae\u8865\u5f3a',
  nextFocusFallback: '\u5148\u8865\u9f50\u5f53\u524d\u8bfe\u7a0b\u6700\u6838\u5fc3\u7684\u57fa\u7840\u77e5\u8bc6\u3002',
  emptyProfile:
    '\u5148\u5b8c\u6210\u4e00\u8f6e\u5bf9\u8bdd\u5e76\u751f\u6210\u5b66\u4e60\u65b9\u6848\uff0c\u8fd9\u91cc\u624d\u4f1a\u51fa\u73b0\u5b66\u4e60\u60c5\u51b5\u603b\u7ed3\u3002',
  emptyResources:
    '\u5148\u5b8c\u6210\u4e00\u8f6e\u5bf9\u8bdd\u5e76\u751f\u6210\u5b66\u4e60\u65b9\u6848\uff0c\u8fd9\u91cc\u624d\u4f1a\u51fa\u73b0\u63a8\u8350\u8d44\u6599\u3002',
  emptyPath:
    '\u5148\u5b8c\u6210\u4e00\u8f6e\u5bf9\u8bdd\u5e76\u751f\u6210\u5b66\u4e60\u65b9\u6848\uff0c\u8fd9\u91cc\u624d\u4f1a\u51fa\u73b0\u5b66\u4e60\u8def\u5f84\u3002',
  previewTitle: '\u5f53\u524d\u8d44\u6599\u9884\u89c8',
  supportOutput: '\u7ec3\u4e60\u4e0e\u8bb2\u89e3',
  onlineResourcesTitle: '\u8865\u5145\u5916\u90e8\u8d44\u6599',
  onlineResourcesHint: '\u6839\u636e\u4f60\u5f53\u524d\u7684\u5b66\u4e60\u60c5\u51b5\uff0c\u8fd9\u91cc\u4f1a\u8865\u5145\u9002\u5408\u4f60\u7ee7\u7eed\u770b\u7684\u89c6\u9891\u3001\u6587\u7ae0\u548c\u4ee3\u7801\u4ed3\u5e93\u3002',
  fetchOnlineResources: '\u66f4\u65b0\u5916\u90e8\u8d44\u6599',
  loadingOnlineResources: '\u67e5\u627e\u4e2d...',
  emptyOnlineResources: '\u8fd8\u6ca1\u6709\u8865\u5145\u5916\u90e8\u8d44\u6599\uff0c\u70b9\u51fb\u6309\u94ae\u540e\u6211\u4f1a\u6309\u4f60\u7684\u5f53\u524d\u96be\u70b9\u53bb\u8865\u8d44\u6599\u3002',
  resourceFocusTitle: '\u5f53\u524d\u8584\u5f31\u70b9',
  resourceFocusHint: '\u8fd9\u4e9b\u662f\u6839\u636e\u5bf9\u8bdd\u548c\u5b66\u4e60\u60c5\u51b5\u5224\u65ad\u51fa\u7684\u9700\u8981\u4f18\u5148\u8865\u5f3a\u7684\u65b9\u5411\u3002',
  openResource: '\u6253\u5f00\u8d44\u6599',
  matchedWeakness: '\u5339\u914d\u96be\u70b9',
  generateSummaryArtifact: '\u751f\u6210\u81ea\u6211\u7ec3\u4e60',
  regenerateSummaryArtifact: '\u7ee7\u7eed\u751f\u6210\u81ea\u6211\u7ec3\u4e60',
  generateScriptArtifact: '\u751f\u6210\u5178\u4f8b\u7cbe\u8bb2',
  regenerateScriptArtifact: '\u7ee7\u7eed\u751f\u6210\u5178\u4f8b\u7cbe\u8bb2',
  summaryArtifact: '\u81ea\u6211\u7ec3\u4e60',
  scriptArtifact: '\u5178\u4f8b\u7cbe\u8bb2',
  artifactReady: '\u5df2\u6dfb\u52a0\u5230\u5f53\u524d\u5217\u8868\u3002',
  emptyArtifact: '\u70b9\u51fb\u201c\u751f\u6210\u7ec3\u4e60\u9898\u201d\u540e\uff0c\u8fd9\u91cc\u4f1a\u4fdd\u7559\u672c\u6b21\u7684\u7ec3\u4e60\u548c\u8bb2\u89e3\u3002',
  emptyPractice: '\u5148\u751f\u6210\u4e00\u7ec4\u7ec3\u4e60\u9898\uff0c\u7136\u540e\u5c31\u53ef\u4ee5\u5728\u8fd9\u91cc\u505a\u9898\u3001\u63d0\u4ea4\u548c\u5bf9\u7167\u8bb2\u89e3\u3002',
  emptySummaryArtifactTitle: '\u8fd8\u6ca1\u6709\u81ea\u6211\u7ec3\u4e60',
  emptySummaryArtifactHint: '\u751f\u6210\u540e\u8fd9\u91cc\u4f1a\u51fa\u73b0\u9898\u76ee\u3001\u8d77\u6b65\u4ee3\u7801\u3001\u4f5c\u7b54\u9762\u677f\u548c\u63d0\u4ea4\u70b9\u8bc4\u3002',
  emptyScriptArtifactTitle: '\u8fd8\u6ca1\u6709\u5178\u4f8b\u7cbe\u8bb2',
  emptyScriptArtifactHint: '\u751f\u6210\u540e\u8fd9\u91cc\u4f1a\u51fa\u73b0\u5178\u578b\u4f8b\u9898\u3001\u89e3\u9898\u601d\u8def\u548c\u53c2\u8003\u4ee3\u7801\u3002',
  recentGenerations: '\u6700\u8fd1\u751f\u6210',
  noGenerations: '\u8fd8\u6ca1\u6709\u751f\u6210\u8bb0\u5f55\u3002',
  placeholder:
    '\u6bd4\u5982\uff1a\u6211\u4e0b\u5468\u8981\u4ea4 \u0050\u0079\u0074\u0068\u006f\u006e \u4f5c\u4e1a\uff0c\u4f46\u5faa\u73af\u548c\u51fd\u6570\u603b\u662f\u4e32\u4e0d\u8d77\u6765\u3002',
  restoreOk: '\u5df2\u63a5\u7740\u4e0a\u6b21\u7684\u804a\u5929\u7ee7\u7eed\u3002',
  startHint: '\u5148\u804a\u804a\u4f60\u7684\u5b66\u4e60\u76ee\u6807\u3001\u96be\u70b9\u548c\u65f6\u95f4\u5b89\u6392\u3002',
  bootstrapOk: '\u53ef\u4ee5\u5f00\u59cb\u5bf9\u8bdd\uff0c\u804a\u6e05\u9700\u6c42\u540e\u518d\u751f\u6210\u5b66\u4e60\u65b9\u6848\u3002',
  bootstrapMissing: '\u540e\u7aef\u5df2\u8fde\u63a5\uff0c\u4f46\u6a21\u578b\u914d\u7f6e\u8fd8\u4e0d\u53ef\u7528\u3002',
  backendDown: '\u5b66\u4e60\u52a9\u624b\u6682\u65f6\u4e0d\u53ef\u7528\u3002',
  openSessionFailed: '\u6ca1\u80fd\u6253\u5f00\u8fd9\u6bb5\u804a\u5929\u8bb0\u5f55\u3002',
  createSessionFailed: '\u65b0\u804a\u5929\u8fd8\u6ca1\u521b\u5efa\u6210\u529f\u3002',
  sendFailed: '\u53d1\u9001\u6d88\u606f\u5931\u8d25\u3002',
  generateFailed: '\u751f\u6210\u5b66\u4e60\u65b9\u6848\u5931\u8d25\u3002',
  artifactFailed: '\u751f\u6210\u9644\u52a0\u5185\u5bb9\u5931\u8d25\u3002',
  renameFailed: '\u6807\u9898\u4fee\u6539\u5931\u8d25\u3002',
  deleteFailed: '\u5220\u9664\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5\u3002',
  refineNotice: '\u7ee7\u7eed\u804a\u6e05\u4f60\u7684\u60c5\u51b5\uff0c\u751f\u6210\u51fa\u6765\u7684\u5185\u5bb9\u4f1a\u66f4\u51c6\u3002',
  readyNotice: '\u4fe1\u606f\u5df2\u7ecf\u6bd4\u8f83\u5b8c\u6574\uff0c\u53ef\u4ee5\u5f00\u59cb\u751f\u6210\u5b66\u4e60\u65b9\u6848\u3002',
  generatedNotice: '\u5b66\u4e60\u65b9\u6848\u5df2\u751f\u6210\uff0c\u53ef\u4ee5\u7ee7\u7eed\u8ffd\u95ee\u6216\u5207\u6362\u67e5\u770b\u7ed3\u679c\u3002',
  needsMoreInfo: '\u4f60\u5df2\u7ecf\u63d0\u4f9b\u4e86\u6bd4\u8f83\u5b8c\u6574\u7684\u4fe1\u606f\u3002',
  titlePrompt: '\u4fee\u6539\u8fd9\u6bb5\u804a\u5929\u7684\u6807\u9898',
  deleteConfirmPrefix: '\u5220\u9664\u201c',
  deleteConfirmSuffix: '\u201d\u540e\u5c06\u65e0\u6cd5\u6062\u590d\uff0c\u786e\u5b9a\u5220\u9664\u5417\uff1f',
  answerPanelTitle: '\u5199\u4ee3\u7801\u5e76\u63d0\u4ea4',
  answerPanelHint: '\u9009\u4e00\u9053\u9898\uff0c\u5199\u4e0b\u4f60\u7684 Python \u4ee3\u7801\uff0c\u63d0\u4ea4\u540e\u5148\u770b\u70b9\u8bc4\uff0c\u518d\u5bf9\u7167\u53c2\u8003\u8bb2\u89e3\u3002',
  chooseExercise: '\u9009\u62e9\u9898\u76ee',
  answerPlaceholder:
    '\u5728\u8fd9\u91cc\u5199\u4e0b\u4f60\u7684 Python \u4ee3\u7801\u3002\u53ef\u4ee5\u76f4\u63a5\u8865\u5b8c\u8d77\u6b65\u4ee3\u7801\uff0c\u4e5f\u53ef\u4ee5\u4ece\u7a7a\u767d\u5f00\u59cb\u3002',
  submitAnswer: '\u63d0\u4ea4\u7b54\u6848',
  reviewing: '\u70b9\u8bc4\u4e2d...',
  reviewTitle: '\u672c\u6b21\u70b9\u8bc4',
  strengths: '\u505a\u5f97\u4e0d\u9519',
  issues: '\u8fd8\u9700\u8c03\u6574',
  nextSteps: '\u4e0b\u4e00\u6b65',
  emptyReview: '\u63d0\u4ea4\u540e\uff0c\u8fd9\u91cc\u4f1a\u7ed9\u4f60\u8fd9\u9053\u9898\u7684\u70b9\u8bc4\u3001\u95ee\u9898\u63d0\u793a\u548c\u4fee\u6539\u5efa\u8bae\u3002',
  reviewSaved: '\u8fd9\u9053\u9898\u7684\u70b9\u8bc4\u5df2\u66f4\u65b0\u3002',
  reviewFailed: '\u63d0\u4ea4\u7b54\u6848\u5931\u8d25\u3002',
  answerUpdatedAt: '\u6700\u8fd1\u66f4\u65b0',
  noExerciseGenerated: '\u5148\u751f\u6210\u7ec3\u4e60\u5185\u5bb9\uff0c\u518d\u5728\u8fd9\u91cc\u505a\u9898\u3002',
}

const SUGGESTED_ACTION_LABELS: Record<SuggestedActionType, string> = {
  generate_plan: '\u751f\u6210\u5b66\u4e60\u65b9\u6848',
  generate_examples: '\u751f\u6210\u5178\u4f8b\u7cbe\u8bb2',
  generate_practice: '\u751f\u6210\u81ea\u6211\u7ec3\u4e60',
  recommend_resources: '\u63a8\u8350\u8865\u5145\u8d44\u6599',
}

const FALLBACK_COURSES: Course[] = [
  {
    id: 'python',
    badge: '\u4ee3\u7801\u5b9e\u8df5',
    name: 'Python \u7a0b\u5e8f\u8bbe\u8ba1',
    summary: '\u9002\u5408\u901a\u8fc7\u5bf9\u8bdd\u68b3\u7406\u5b66\u4e60\u76ee\u6807\uff0c\u518d\u751f\u6210\u8bb2\u89e3\u3001\u7ec3\u4e60\u548c\u9879\u76ee\u6848\u4f8b\u3002',
    difficulty: '\u4e2d\u7b49',
    seeds: [
      '\u53d8\u91cf\u4e0e\u6570\u636e\u7c7b\u578b',
      '\u5206\u652f\u4e0e\u5faa\u73af',
      '\u51fd\u6570\u4e0e\u6a21\u5757',
      '\u6587\u4ef6\u5904\u7406',
      '\u9762\u5411\u5bf9\u8c61',
      '\u5f02\u5e38\u4e0e\u8c03\u8bd5',
    ],
    deliverables: [
      '\u8bb2\u89e3\u63d0\u7eb2',
      '\u7ec3\u4e60\u5efa\u8bae',
      '\u4ee3\u7801\u6848\u4f8b',
      '\u62d3\u5c55\u9605\u8bfb',
      '\u5b66\u4e60\u8def\u5f84',
    ],
    painPoint: '\u5f88\u591a\u5b66\u751f\u80fd\u5199\u96f6\u6563\u4ee3\u7801\uff0c\u4f46\u4e0d\u4f1a\u628a\u77e5\u8bc6\u70b9\u7ec4\u7ec7\u6210\u5b8c\u6574\u4efb\u52a1\u3002',
  },
]

const FALLBACK_COURSE = FALLBACK_COURSES[0]

const DIMENSION_LABELS: Record<keyof ProfileSummary['dimensions'], string> = {
  knowledge: '\u77e5\u8bc6\u57fa\u7840',
  pace: '\u5b66\u4e60\u8282\u594f',
  preference: '\u504f\u597d\u65b9\u5f0f',
  weakness: '\u5f53\u524d\u96be\u70b9',
  motivation: '\u5b66\u4e60\u52a8\u529b',
  evaluation: '\u53cd\u9988\u504f\u597d',
}

const VIEW_LABELS: Record<AppView, string> = {
  chat: TEXT.chat,
  profile: TEXT.profile,
  resources: TEXT.resources,
  examples: TEXT.scriptArtifact,
  practice: TEXT.practice,
  path: TEXT.path,
}

const STAGE_LABELS: Record<AppStage, string> = {
  chatting: '\u7ee7\u7eed\u4e86\u89e3\u60c5\u51b5',
  ready_to_generate: '\u53ef\u4ee5\u5f00\u59cb\u751f\u6210',
  generated: '\u5df2\u751f\u6210\u5b66\u4e60\u65b9\u6848',
  refining: '\u6b63\u5728\u6309\u65b0\u8981\u6c42\u8c03\u6574',
}

function looksGarbled(text: string) {
  if (!text) {
    return false
  }
  if (text.includes('\ufffd')) {
    return true
  }
  const hints = ['\u9366', '\u7481', '\u7f01', '\u6d63', '\u5b2b', '\u6d60', '\u93c6', '\u6d93']
  const count = hints.reduce((total, hint) => total + (text.includes(hint) ? 1 : 0), 0)
  return count >= 2
}

function decodeUnicodeEscapes(text: string) {
  if (!text.includes('\\u')) {
    return text
  }
  return text.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) =>
    String.fromCharCode(Number.parseInt(hex, 16)),
  )
}

function normalizeText(text: string, fallback: string) {
  const value = decodeUnicodeEscapes(text.trim())
  if (!value || looksGarbled(value)) {
    return fallback
  }
  return value
}

function normalizeTagLabel(text: string, fallback = '') {
  return normalizeText(text, fallback).trim()
}

function getResourceIconUrl(resourceUrl: string) {
  try {
    const parsed = new URL(resourceUrl)
    const hostname = parsed.hostname.replace(/^www\./, '')
    const iconMap: Record<string, string> = {
      'docs.python.org': 'https://www.python.org/static/favicon.ico',
      'github.com': 'https://github.githubassets.com/favicons/favicon.svg',
      'bilibili.com': 'https://www.bilibili.com/favicon.ico',
      'csdn.net': 'https://www.csdn.net/favicon.ico',
      'liaoxuefeng.com': 'https://www.liaoxuefeng.com/favicon.ico',
      'runoob.com': 'https://www.runoob.com/favicon.ico',
      'pynative.com': 'https://pynative.com/favicon.ico',
      'realpython.com': 'https://realpython.com/favicon.ico',
      'automatetheboringstuff.com': 'https://automatetheboringstuff.com/favicon.ico',
      'py4e.com': 'https://www.py4e.com/favicon.ico',
      'kaggle.com': 'https://www.kaggle.com/static/images/favicon.ico',
      'exercism.org': 'https://exercism.org/favicon.ico',
      'w3resource.com': 'https://www.w3resource.com/favicon.ico',
      'dabeaz-course.github.io': 'https://github.githubassets.com/favicons/favicon.svg',
    }
    return iconMap[hostname] ?? new URL('/favicon.ico', parsed.origin).toString()
  } catch {
    return ''
  }
}

function getResourceKindLabel(kind: string) {
  const labels: Record<string, string> = {
    documentation: '文档',
    article: '文章',
    video: '视频',
    repository: '代码库',
  }
  return labels[kind] ?? '资料'
}

function getPathTheoryResources(resources: OnlineResource[], stepIndex: number) {
  if (resources.length <= 2) {
    return resources
  }
  const start = (stepIndex * 2) % resources.length
  return [resources[start], resources[(start + 1) % resources.length]].filter(Boolean)
}

function normalizeAssistantMessage(message: string, index: number) {
  const polished = message
    .replace(/^好的，?我现在就为你[\s\S]*学习方案。?请稍候。?$/g, '可以，点击下面的按钮即可生成学习方案。')
    .replace(/^我现在就为你[\s\S]*学习方案。?请稍候。?$/g, '可以，点击下面的按钮即可生成学习方案。')
    .replace(/^([\s\S]*学习方案[\s\S]*)(要开始吗|准备好了.*开始吗)[？?]?$/g, '要现在生成学习方案吗？点击下方按钮即可生成。')
    .replace(/现在就可以开始学习啦[~～]?/g, '点击下面按钮就可以生成了。')
    .replace(/现在就可以开始学习了[~～]?/g, '点击下面按钮就可以生成了。')

  if (!looksGarbled(message)) {
    return polished
  }
  if (index === 0) {
    return '\u5148\u548c\u6211\u8bf4\u8bf4\u4f60\u5b66 Python \u662f\u4e3a\u4e86\u4ec0\u4e48\uff0c\u5f53\u524d\u6700\u5361\u7684\u662f\u54ea\u4e00\u5757\uff1f'
  }
  return '\u6211\u7ee7\u7eed\u542c\u4f60\u8865\u5145\u3002\u4e5f\u53ef\u4ee5\u76f4\u63a5\u8bf4\u4f60\u60f3\u8ba9\u6211\u751f\u6210\u4ec0\u4e48\u5185\u5bb9\u3002'
}

const suggestedActionTypes = new Set<SuggestedActionType>([
  'generate_plan',
  'generate_examples',
  'generate_practice',
  'recommend_resources',
])

function normalizeSuggestedActions(actions: ChatMessage['suggested_actions']) {
  if (!Array.isArray(actions)) {
    return []
  }

  const seen = new Set<string>()
  return actions
    .filter((action): action is SuggestedAction => {
      if (!action || !suggestedActionTypes.has(action.type) || seen.has(action.type)) {
        return false
      }
      seen.add(action.type)
      return true
    })
    .slice(0, 3)
}

function normalizeMessages(messages: ChatMessage[]) {
  return messages.map((message, index) => {
    if (message.role === 'assistant') {
      const content = normalizeAssistantMessage(message.content, index)
      return {
        ...message,
        content,
        suggested_actions:
          content.includes('生成学习方案') && content.includes('按钮')
            ? [{ type: 'generate_plan' as const, label: SUGGESTED_ACTION_LABELS.generate_plan }]
            : normalizeSuggestedActions(message.suggested_actions),
      }
    }
    return {
      ...message,
      content: normalizeText(message.content, ''),
      suggested_actions: [],
    }
  })
}

function prepareAssistantMarkdown(content: string) {
  const lines = content.split('\n')
  let inFence = false

  return lines
    .map((line) => {
      if (!line.startsWith('```')) {
        return line
      }

      const fenceInfo = line.slice(3).trim()
      if (!inFence) {
        inFence = true
        return fenceInfo ? line : '```python'
      }

      inFence = false
      return '```'
    })
    .join('\n')
}

function parseArtifactSegments(content: string): ArtifactSegment[] {
  const segments: ArtifactSegment[] = []
  const regex = /```([\w-]*)\n([\s\S]*?)```/g
  let lastIndex = 0

  for (const match of content.matchAll(regex)) {
    const matchIndex = match.index ?? 0
    const before = content.slice(lastIndex, matchIndex).trim()
    if (before) {
      segments.push({ kind: 'markdown', content: before })
    }

    const language = match[1]?.trim() || undefined
    const code = match[2]?.replace(/\n+$/, '') ?? ''
    if (code.trim()) {
      segments.push({ kind: 'code', content: code, language })
    }

    lastIndex = matchIndex + match[0].length
  }

  const after = content.slice(lastIndex).trim()
  if (after) {
    segments.push({ kind: 'markdown', content: after })
  }

  return segments.length > 0 ? segments : [{ kind: 'markdown', content }]
}

function MermaidDiagram({ chart }: { chart: string }) {
  const [svg, setSvg] = useState('')
  const [error, setError] = useState(false)
  const diagramId = useMemo(() => `learning-mermaid-${++mermaidCounter}`, [])

  useEffect(() => {
    let cancelled = false
    setSvg('')
    setError(false)

    void mermaid
      .render(diagramId, chart)
      .then((result) => {
        if (!cancelled) {
          setSvg(result.svg)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [chart, diagramId])

  if (error) {
    return (
      <div className="mermaid-diagram mermaid-error">
        <span>思维导图语法需要调整</span>
        <pre>{chart}</pre>
      </div>
    )
  }

  return <div className="mermaid-diagram" dangerouslySetInnerHTML={{ __html: svg || '<span>正在生成图示...</span>' }} />
}

function MarkdownCodeBlock({ inline, className = '', children }: MarkdownCodeProps) {
  const [copied, setCopied] = useState(false)
  const rawCode = String(children ?? '').replace(/\n$/, '')
  const language = /language-([\w-]+)/.exec(className)?.[1] ?? 'python'

  if (inline || (!className && !rawCode.includes('\n'))) {
    return <code className={className}>{children}</code>
  }

  if (language.toLowerCase() === 'mermaid') {
    return <MermaidDiagram chart={rawCode} />
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="learning-code-block">
      <div className="learning-code-bar">
        <span>{language === 'python' || language === 'py' ? 'main.py' : language}</span>
        <button type="button" onClick={() => void handleCopy()} aria-label="澶嶅埗浠ｇ爜">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <pre>
        <code className={className}>{children}</code>
      </pre>
    </div>
  )
}

function LearningMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        pre: ({ children }) => <>{children}</>,
        code: MarkdownCodeBlock,
      }}
    >
      {prepareAssistantMarkdown(content)}
    </ReactMarkdown>
  )
}

function normalizeExerciseSubmissions(payload?: ExerciseSubmissionCollection | null): ExerciseSubmissionCollection {
  if (!payload || typeof payload !== 'object') {
    return {}
  }

  const next: ExerciseSubmissionCollection = {}
  Object.entries(payload).forEach(([key, value]) => {
    if (value && typeof value === 'object') {
      next[key] = value as ExerciseSubmissionState
    }
  })
  return next
}

function normalizePathProgress(payload?: PathProgressState | null): PathProgressState {
  if (!payload || typeof payload !== 'object') {
    return {}
  }
  return Object.fromEntries(Object.entries(payload).map(([key, value]) => [String(key), value === true]))
}

function normalizePathAssessments(payload?: PathAssessmentCollection | null): PathAssessmentCollection {
  if (!payload || typeof payload !== 'object') {
    return {}
  }
  const next: PathAssessmentCollection = {}
  Object.entries(payload).forEach(([key, value]) => {
    if (value && typeof value === 'object' && value.assessment && typeof value.assessment === 'object') {
      next[String(key)] = value as PathAssessmentState
    }
  })
  return next
}

function buildExerciseDrafts(submissions: ExerciseSubmissionCollection) {
  return Object.fromEntries(Object.entries(submissions).map(([key, value]) => [key, value.user_code ?? '']))
}

function emphasizeArtifactLeadLabel(content: string) {
  const trimmed = content.trimStart()
  const leadingSpace = content.slice(0, content.length - trimmed.length)
  const match = /^(问题|思路|讲解|题目|要求|提示|目标|参考答案|关键点)([:：])\s*(.*)$/s.exec(trimmed)
  if (!match) {
    return content
  }
  return `${leadingSpace}**${match[1]}${match[2]}** ${match[3]}`
}

function ArtifactSectionContent({
  section,
  sectionIndex,
  keyPrefix,
}: {
  section: ArtifactSection
  sectionIndex: number
  keyPrefix: string
}) {
  return (
    <div className="artifact-markdown">
      {section.lines.map((line, lineIndex) => {
        const content = normalizeText(line, '\u5f85\u751f\u6210')
        const segments = parseArtifactSegments(content)
        return (
          <div className="artifact-line" key={`${keyPrefix}-${sectionIndex}-${lineIndex}`}>
            {segments.map((segment, segmentIndex) =>
              segment.kind === 'code' ? (
                <div className="chat-markdown artifact-line artifact-line-code" key={`${keyPrefix}-${sectionIndex}-${lineIndex}-${segmentIndex}`}>
                  <LearningMarkdown content={`\`\`\`${segment.language ?? 'python'}\n${segment.content}\n\`\`\``} />
                </div>
              ) : (
                <div className="chat-markdown" key={`${keyPrefix}-${sectionIndex}-${lineIndex}-${segmentIndex}`}>
                  <LearningMarkdown content={emphasizeArtifactLeadLabel(segment.content)} />
                </div>
              ),
            )}
          </div>
        )
      })}
    </div>
  )
}

async function readErrorDetail(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { detail?: string }
    return normalizeText(payload.detail ?? '', fallback)
  } catch {
    return fallback
  }
}

function formatSessionTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getDepthCopy(depth: number) {
  if (depth <= 1) {
    return {
      label: '\u7cbe\u7b80\u7248',
      description: '\u5185\u5bb9\u66f4\u77ed\uff0c\u9002\u5408\u5148\u5feb\u901f\u770b\u4e00\u904d\u3002',
    }
  }
  if (depth === 2) {
    return {
      label: '\u6807\u51c6\u7248',
      description: '\u91cd\u70b9\u3001\u7ec3\u4e60\u548c\u5b89\u6392\u6bd4\u8f83\u5747\u8861\u3002',
    }
  }
  return {
    label: '\u8be6\u7ec6\u7248',
    description: '\u8bb2\u89e3\u548c\u8def\u7ebf\u4f1a\u66f4\u5c55\u5f00\uff0c\u9002\u5408\u6df1\u5165\u5b66\u4e60\u3002',
  }
}

function getConversationStatusCopy(
  stage: AppStage,
  readyToGenerate: boolean,
  hasGeneration: boolean,
  profileCompletion: number,
) {
  if (hasGeneration) {
    return {
      label: '\u5df2\u6709\u5b66\u4e60\u65b9\u6848',
      description: '\u53ef\u4ee5\u7ee7\u7eed\u8ffd\u95ee\uff0c\u6216\u8005\u8ba9\u6211\u6309\u65b0\u8981\u6c42\u518d\u8c03\u6574\u4e00\u904d\u3002',
      progress: 100,
    }
  }
  if (stage === 'refining') {
    return {
      label: '\u6b63\u5728\u8c03\u6574',
      description: '\u6211\u4f1a\u6839\u636e\u4f60\u65b0\u8865\u5145\u7684\u60c5\u51b5\u7ee7\u7eed\u4f18\u5316\u5185\u5bb9\u3002',
      progress: 84,
    }
  }
  if (readyToGenerate || stage === 'ready_to_generate') {
    return {
      label: '\u53ef\u4ee5\u5f00\u59cb\u751f\u6210',
      description: '\u73b0\u5728\u4fe1\u606f\u5df2\u7ecf\u591f\u7528\uff0c\u53ef\u4ee5\u76f4\u63a5\u751f\u6210\u5b66\u4e60\u65b9\u6848\u3002',
      progress: 100,
    }
  }
  if (profileCompletion <= 35) {
    return {
      label: '\u5148\u8bf4\u8bf4\u4f60\u7684\u60c5\u51b5',
      description: '\u804a\u804a\u76ee\u6807\u3001\u96be\u70b9\u6216\u8005\u6700\u8fd1\u7684\u4f5c\u4e1a\uff0c\u6211\u518d\u5e2e\u4f60\u6574\u7406\u3002',
      progress: Math.max(18, profileCompletion),
    }
  }
  return {
    label: '\u518d\u8865\u5145\u4e00\u70b9\u4fe1\u606f',
    description: '\u518d\u804a\u4e24\u53e5\u4f60\u73b0\u5728\u7684\u76ee\u6807\u548c\u5361\u70b9\uff0c\u751f\u6210\u7684\u5185\u5bb9\u4f1a\u66f4\u51c6\u3002',
    progress: Math.max(40, Math.min(92, profileCompletion)),
  }
}

function getSessionTitle(summary: SessionSummary) {
  return normalizeText(summary.title, '\u65b0\u7684\u804a\u5929')
}

function getSessionPreview(summary: SessionSummary) {
  return normalizeText(summary.preview, '\u7ee7\u7eed\u67e5\u770b\u8fd9\u6bb5\u5bf9\u8bdd\u3002')
}

function simplifySectionHeading(heading: string, fallback: string) {
  return normalizeText(heading, fallback)
    .replace(/^(练习|典例|典例精讲|缁冧範|鍏镐緥绮捐)\s*\d+\s*[：:锛?]\s*/, '')
    .replace(/^(练习|典例|典例精讲|缁冧範|鍏镐緥绮捐)\s*/, '')
    .trim()
}

function buildPathStepsFromArtifacts(exercises: ArtifactSection[], examples: ArtifactSection[], fallbackSteps: PathStep[]): PathStep[] {
  if (exercises.length === 0 && examples.length === 0) {
    return fallbackSteps
  }

  const total = Math.max(exercises.length, examples.length)
  return Array.from({ length: total }, (_item, index) => {
    const exercise = exercises[index]
    const example = examples[index]
    const exerciseTitle = exercise ? simplifySectionHeading(exercise.heading, `练习 ${index + 1}`) : ''
    const exampleTitle = example ? simplifySectionHeading(example.heading, `典例 ${index + 1}`) : ''
    const title = exerciseTitle || exampleTitle || `学习任务 ${index + 1}`
    const detail =
      exerciseTitle && exampleTitle
        ? `先阅读典例《${exampleTitle}》，再完成自我练习《${exerciseTitle}》，提交答案后根据点评修改。`
        : exerciseTitle
          ? `完成自我练习《${exerciseTitle}》，写出自己的 Python 解答并提交点评。`
          : `阅读典例《${exampleTitle}》，理解题目拆解、关键代码和容易出错的地方。`
    const expected_outcome =
      exerciseTitle && exampleTitle
        ? `能独立完成《${exerciseTitle}》，并能说清《${exampleTitle}》中的关键思路。`
        : exerciseTitle
          ? `能独立完成《${exerciseTitle}》，并根据点评修正主要问题。`
          : `能复述《${exampleTitle}》的解题思路，并能自己写出相近代码。`

    return {
      title: `第${index + 1}步：${title}`,
      detail,
      duration: fallbackSteps[index]?.duration ?? '约30-45分钟',
      expected_outcome,
    }
  })
}

function normalizeMermaidLabel(text: string, fallback: string, maxLength = 30) {
  const value = normalizeText(text, fallback)
    .replace(/^第\s*\d+\s*步\s*[：:]\s*/, '')
    .replace(/["\\`<>[\]{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
}

function buildPathMermaidChart(steps: PathStep[], progress: PathProgressState) {
  const visibleSteps = steps.slice(0, 4)
  if (visibleSteps.length === 0) {
    return ''
  }

  const lines = ['flowchart TB', '  start(["学习路线"])']
  visibleSteps.forEach((step, index) => {
    const title = normalizeMermaidLabel(step.title, `学习步骤 ${index + 1}`)
    const duration = normalizeMermaidLabel(step.duration, '建议时长', 14)
    const status = progress[String(index)] ? '掌握较好' : '待跟进'
    lines.push(`  subgraph stage${index}["${index + 1}. ${title} · ${duration}"]`)
    lines.push(`    theory${index}["先学理论"] --> example${index}["再看典例"]`)
    lines.push(`    example${index} --> practice${index}["最后练习"]`)
    lines.push(`    practice${index} --> feedback${index}["反馈跟进 · ${status}"]`)
    lines.push('  end')
    lines.push(`  class feedback${index} ${progress[String(index)] ? 'done' : 'todo'}`)
  })
  lines.push('  start --> theory0')
  visibleSteps.slice(1).forEach((_step, index) => {
    lines.push(`  feedback${index} --> theory${index + 1}`)
  })
  lines.push('  classDef done fill:#eaf7ef,stroke:#118950,color:#162033;')
  lines.push('  classDef todo fill:#eef6ff,stroke:#8bb8e8,color:#162033;')

  return lines.join('\n')
}

function normalizeArtifactCollection(payload?: ArtifactCollection | null, fallback?: ArtifactState | null) {
  const next: ArtifactCollection = {}
  if (payload) {
    if (payload.summary) {
      next.summary = payload.summary
    }
    if (payload.qa_script) {
      next.qa_script = payload.qa_script
    }
  }
  if (Object.keys(next).length === 0 && fallback?.kind) {
    next[fallback.kind] = fallback
  }
  return next
}

function getLatestHistoryVersion(records: RunRecord[]) {
  return records.reduce((latest, record) => {
    const id = Number(record.id)
    return Number.isFinite(id) ? Math.max(latest, id) : latest
  }, 1)
}

const DEFAULT_SETTINGS_DRAFT: AppSettingsDraft = {
  chat_provider: 'deepseek',
  embedding_provider: 'dashscope',
  deepseek_api_key: '',
  deepseek_base_url: 'https://api.deepseek.com',
  deepseek_chat_model: 'deepseek-v4-pro',
  dashscope_api_key: '',
  dashscope_base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  dashscope_embedding_model: 'text-embedding-v4',
}

const DEFAULT_CHAT_PROVIDER_OPTIONS: ProviderOption[] = [
  { id: 'deepseek', label: 'DeepSeek', models: ['deepseek-v4-pro', 'deepseek-v4-flash', 'deepseek-chat', 'deepseek-reasoner'] },
  { id: 'qwen', label: '通义千问', models: ['qwen3.7-max', 'qwen3.7-plus', 'qwen3.6-plus', 'qwen3.6-flash', 'qwen3-coder-plus'] },
  { id: 'openai', label: 'OpenAI', models: ['gpt-5.5', 'gpt-5.4', 'gpt-5.4-mini', 'gpt-4.1-mini', 'gpt-4.1'] },
  { id: 'moonshot', label: 'Kimi', models: ['kimi-k2.6', 'kimi-k2.5', 'moonshot-v1-128k', 'moonshot-v1-32k', 'moonshot-v1-8k'] },
  { id: 'siliconflow', label: '硅基流动', models: ['deepseek-ai/DeepSeek-V3.2-Exp', 'deepseek-ai/DeepSeek-V3.1', 'Qwen/Qwen3-235B-A22B-Instruct-2507'] },
  { id: 'custom', label: '自定义接口', models: [] },
]

const DEFAULT_EMBEDDING_PROVIDER_OPTIONS: ProviderOption[] = [
  { id: 'dashscope', label: '千问向量', models: ['text-embedding-v4', 'text-embedding-v3', 'text-embedding-v2'] },
  { id: 'openai', label: 'OpenAI', models: ['text-embedding-3-small', 'text-embedding-3-large'] },
  { id: 'siliconflow', label: '硅基流动', models: ['BAAI/bge-m3', 'netease-youdao/bce-embedding-base_v1', 'BAAI/bge-large-zh-v1.5'] },
  { id: 'custom', label: '自定义接口', models: [] },
]

function App() {
  const course = FALLBACK_COURSE
  const [depth, setDepth] = useState(2)
  const [version, setVersion] = useState(1)
  const [activeView, setActiveView] = useState<AppView>('chat')

  const [llmConfigured, setLlmConfigured] = useState(false)
  const [backendNotice, setBackendNotice] = useState(TEXT.connecting)
  const [bootstrapReady, setBootstrapReady] = useState(false)
  const [appSettings, setAppSettings] = useState<AppSettingsState | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsDraft, setSettingsDraft] = useState<AppSettingsDraft>(DEFAULT_SETTINGS_DRAFT)

  const [sessionId, setSessionId] = useState('')
  const activeSessionRef = useRef('')
  const sessionLoadTokenRef = useRef(0)
  const autoLoadedPathResourcesRef = useRef<Record<string, boolean>>({})
  const [sessionSummaries, setSessionSummaries] = useState<SessionSummary[]>([])
  const [sessionSeed, setSessionSeed] = useState(0)
  const [restoreSessionId, setRestoreSessionId] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [profileCompletion, setProfileCompletion] = useState(0)
  const [readyToGenerate, setReadyToGenerate] = useState(false)
  const [stage, setStage] = useState<AppStage>('chatting')

  const [generation, setGeneration] = useState<GenerationState | null>(null)
  const [artifacts, setArtifacts] = useState<ArtifactCollection>({})
  const [artifactVersions, setArtifactVersions] = useState<Record<ArtifactKind, number>>({ summary: 0, qa_script: 0 })
  const [exerciseSubmissions, setExerciseSubmissions] = useState<ExerciseSubmissionCollection>({})
  const [exerciseDrafts, setExerciseDrafts] = useState<Record<string, string>>({})
  const [, setPathProgress] = useState<PathProgressState>({})
  const [pathAssessments, setPathAssessments] = useState<PathAssessmentCollection>({})
  const [pathFeedbackDrafts, setPathFeedbackDrafts] = useState<Record<string, string>>({})
  const [pathMapZoom, setPathMapZoom] = useState(1)
  const [selectedPracticeIndex, setSelectedPracticeIndex] = useState(0)
  const [selectedExampleIndex, setSelectedExampleIndex] = useState(0)
  const [, setHistory] = useState<RunRecord[]>([])
  const [onlineResources, setOnlineResources] = useState<OnlineResource[]>([])
  const [collaborationTrace, setCollaborationTrace] = useState<CollaborationRecord[]>([])

  const [sessionLoading, setSessionLoading] = useState(false)
  const [messageLoading, setMessageLoading] = useState(false)
  const [pendingMessage, setPendingMessage] = useState('')
  const dialogScrollerRef = useRef<HTMLDivElement | null>(null)
  const [generationLoading, setGenerationLoading] = useState(false)
  const [artifactLoadingBySession, setArtifactLoadingBySession] = useState<Record<string, ArtifactKind>>({})
  const [exerciseReviewLoading, setExerciseReviewLoading] = useState(false)
  const [pathAssessmentLoading, setPathAssessmentLoading] = useState<number | null>(null)
  const [onlineResourcesLoading, setOnlineResourcesLoading] = useState(false)

  const isActiveSession = (targetSessionId: string) => Boolean(targetSessionId) && activeSessionRef.current === targetSessionId

  const setActiveSessionId = (nextSessionId: string) => {
    activeSessionRef.current = nextSessionId
    setSessionId(nextSessionId)
  }

  const resetSessionScopedState = () => {
    setMessages([])
    setDraft('')
    setPendingMessage('')
    setProfileCompletion(0)
    setReadyToGenerate(false)
    setStage('chatting')
    setVersion(1)
    setGeneration(null)
    setArtifacts({})
    setArtifactVersions({ summary: 0, qa_script: 0 })
    setExerciseSubmissions({})
    setExerciseDrafts({})
    setPathProgress({})
    setPathAssessments({})
    setPathFeedbackDrafts({})
    setSelectedPracticeIndex(0)
    setSelectedExampleIndex(0)
    setHistory([])
    setOnlineResources([])
    setCollaborationTrace([])
    setMessageLoading(false)
    setGenerationLoading(false)
    setExerciseReviewLoading(false)
    setPathAssessmentLoading(null)
    setOnlineResourcesLoading(false)
  }

  const artifactLoading = sessionId ? (artifactLoadingBySession[sessionId] ?? null) : null
  const depthCopy = getDepthCopy(depth)
  const conversationStatus = getConversationStatusCopy(stage, readyToGenerate, Boolean(generation), profileCompletion)
  const practiceArtifact = artifacts.summary ?? null
  const exerciseSections = practiceArtifact?.sections ?? []
  const exampleArtifact = artifacts.qa_script ?? null
  const scriptSections = exampleArtifact?.sections ?? []
  const activePracticeIndex = selectedPracticeIndex < exerciseSections.length ? selectedPracticeIndex : 0
  const activeExampleIndex = selectedExampleIndex < scriptSections.length ? selectedExampleIndex : 0
  const selectedExerciseKey = String(activePracticeIndex)
  const currentExercise = exerciseSections[activePracticeIndex] ?? null
  const currentExample = scriptSections[activeExampleIndex] ?? null
  const currentSubmission = exerciseSubmissions[selectedExerciseKey] ?? null
  const currentReview = currentSubmission?.review ?? null
  const currentDraft = exerciseDrafts[selectedExerciseKey] ?? currentSubmission?.user_code ?? ''
  const pathSteps = useMemo(
    () => buildPathStepsFromArtifacts(exerciseSections, scriptSections, generation?.path ?? []),
    [exerciseSections, scriptSections, generation?.path],
  )
  const pathUsesGeneratedContent = exerciseSections.length > 0 || scriptSections.length > 0
  const effectivePathProgress = useMemo<PathProgressState>(() => {
    const next: PathProgressState = {}
    pathSteps.forEach((_step, index) => {
      next[String(index)] = pathAssessments[String(index)]?.assessment.mastery === 'good'
    })
    return next
  }, [pathAssessments, pathSteps])
  const completedPathCount = pathSteps.reduce((count, _step, index) => count + (effectivePathProgress[String(index)] ? 1 : 0), 0)
  const assessedPathCount = pathSteps.reduce((count, _step, index) => count + (pathAssessments[String(index)] ? 1 : 0), 0)
  const pathCompletionPercent = pathSteps.length > 0 ? Math.round((completedPathCount / pathSteps.length) * 100) : 0
  const pathMermaidChart = useMemo(() => buildPathMermaidChart(pathSteps, effectivePathProgress), [pathSteps, effectivePathProgress])
  const collaborationSteps = useMemo(() => {
    const byRole = new Map(collaborationTrace.map((item) => [item.role, item]))
    const defaults: CollaborationRecord[] = [
      {
        role: 'diagnosis',
        title: '了解你的情况',
        status: '待开始',
        input_summary: '对话记录',
        output_summary: '等待生成学习情况后完成。',
        used_sources: ['对话记录'],
        updated_at: '',
      },
      {
        role: 'materials',
        title: '匹配学习依据',
        status: '待开始',
        input_summary: '薄弱点',
        output_summary: '等待识别薄弱点后匹配课程资料和外部资料。',
        used_sources: ['Python 课程资料', '外部学习资料'],
        updated_at: '',
      },
      {
        role: 'content',
        title: '设计学习内容',
        status: '待开始',
        input_summary: '学习情况',
        output_summary: '等待生成推荐资料、典例或练习。',
        used_sources: ['学习情况', '课程资料'],
        updated_at: '',
      },
      {
        role: 'path',
        title: '安排学习路径',
        status: '待开始',
        input_summary: '学习内容',
        output_summary: '等待把理论、典例、练习和反馈组织成路径。',
        used_sources: ['学习资料', '典例', '练习'],
        updated_at: '',
      },
      {
        role: 'feedback',
        title: '跟进练习反馈',
        status: '待完成',
        input_summary: '练习答案',
        output_summary: '提交练习答案后，这里会显示点评和下一步建议。',
        used_sources: ['你的练习答案'],
        updated_at: '',
      },
    ]
    return defaults.map((item) => byRole.get(item.role) ?? item)
  }, [collaborationTrace])
  const completedCollaborationCount = collaborationSteps.filter((item) => item.status !== '待开始' && item.status !== '待完成').length
  const displayMessages = useMemo<DisplayMessage[]>(
    () =>
      pendingMessage
        ? [...messages, { role: 'user', content: pendingMessage }, { role: 'assistant', content: TEXT.thinking, status: 'thinking' }]
        : messages,
    [messages, pendingMessage],
  )
  useEffect(() => {
    if (activeView !== 'chat') {
      return
    }

    window.requestAnimationFrame(() => {
      const scroller = dialogScrollerRef.current
      if (scroller) {
        scroller.scrollTop = scroller.scrollHeight
      }
    })
  }, [activeView, displayMessages.length, pendingMessage])
  const lastAssistantMessageIndex = useMemo(() => {
    for (let index = displayMessages.length - 1; index >= 0; index -= 1) {
      const message = displayMessages[index]
      if (message.role === 'assistant' && message.status !== 'thinking') {
        return index
      }
    }
    return -1
  }, [displayMessages])
  const weaknessTags = (generation?.profile.weakness_tags ?? [])
    .map((tag) => normalizeTagLabel(tag))
    .filter(Boolean)
  const preferredFormatTags = (generation?.profile.preferred_format_tags ?? [])
    .map((tag) => normalizeTagLabel(tag))
    .filter(Boolean)
  const profileOverviewCards = generation
    ? [
        {
          key: 'knowledge',
          label: DIMENSION_LABELS.knowledge,
          value: normalizeText(generation.profile.dimensions.knowledge, '\u5f85\u8865\u5145'),
          icon: BookOpen,
          tone: 'neutral',
        },
        {
          key: 'pace',
          label: DIMENSION_LABELS.pace,
          value: normalizeText(generation.profile.dimensions.pace, '\u5f85\u8865\u5145'),
          icon: TimerReset,
          tone: 'neutral',
        },
        {
          key: 'preference',
          label: DIMENSION_LABELS.preference,
          value: normalizeText(generation.profile.dimensions.preference, '\u5f85\u8865\u5145'),
          icon: PencilLine,
          tone: 'neutral',
        },
      ]
    : []
  const profileInsightCards = generation
    ? [
        {
          key: 'weakness',
          label: DIMENSION_LABELS.weakness,
          value: normalizeText(generation.profile.dimensions.weakness, '\u5f85\u8865\u5145'),
          icon: Target,
          tone: 'danger',
        },
        {
          key: 'motivation',
          label: DIMENSION_LABELS.motivation,
          value: normalizeText(generation.profile.dimensions.motivation, '\u5f85\u8865\u5145'),
          icon: Sparkles,
          tone: 'neutral',
        },
        {
          key: 'evaluation',
          label: DIMENSION_LABELS.evaluation,
          value: normalizeText(generation.profile.dimensions.evaluation, '\u5f85\u8865\u5145'),
          icon: Compass,
          tone: 'neutral',
        },
      ]
    : []
  const levelLabelMap: Record<string, string> = {
    beginner: '\u57fa\u7840\u9636\u6bb5',
    intermediate: '\u63d0\u5347\u9636\u6bb5',
  }
  const chatProviderOptions =
    appSettings?.chat_provider_options && appSettings.chat_provider_options.length > 0
      ? appSettings.chat_provider_options
      : DEFAULT_CHAT_PROVIDER_OPTIONS
  const embeddingProviderOptions =
    appSettings?.embedding_provider_options && appSettings.embedding_provider_options.length > 0
      ? appSettings.embedding_provider_options
      : DEFAULT_EMBEDDING_PROVIDER_OPTIONS
  const selectedChatProvider = chatProviderOptions.find((item) => item.id === settingsDraft.chat_provider) ?? chatProviderOptions[0]
  const selectedEmbeddingProvider =
    embeddingProviderOptions.find((item) => item.id === settingsDraft.embedding_provider) ?? embeddingProviderOptions[0]

  const applySettingsPayload = (payload: AppSettingsState) => {
    setAppSettings(payload)
    setLlmConfigured(payload.llm_configured === true)
    setSettingsDraft((current) => ({
      ...current,
      deepseek_api_key: '',
      dashscope_api_key: '',
      chat_provider: payload.chat_provider || DEFAULT_SETTINGS_DRAFT.chat_provider,
      embedding_provider: payload.embedding_provider || DEFAULT_SETTINGS_DRAFT.embedding_provider,
      deepseek_base_url: payload.deepseek_base_url || DEFAULT_SETTINGS_DRAFT.deepseek_base_url,
      deepseek_chat_model: payload.deepseek_chat_model || DEFAULT_SETTINGS_DRAFT.deepseek_chat_model,
      dashscope_base_url: payload.dashscope_base_url || DEFAULT_SETTINGS_DRAFT.dashscope_base_url,
      dashscope_embedding_model: payload.dashscope_embedding_model || DEFAULT_SETTINGS_DRAFT.dashscope_embedding_model,
    }))
  }

  const loadAppSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (!response.ok) {
        return
      }
      const payload = (await response.json()) as AppSettingsState
      applySettingsPayload(payload)
    } catch {
      // Keep the rest of the app usable even if settings cannot be loaded.
    }
  }

  const loadSessionSummaries = async (): Promise<SessionSummary[]> => {
    try {
      const response = await fetch('/api/chat/sessions')
      if (!response.ok) {
        return []
      }
      const payload = (await response.json()) as { sessions?: SessionSummary[] }
      const sessions = Array.isArray(payload.sessions) ? payload.sessions : []
      setSessionSummaries(sessions)
      return sessions
    } catch {
      return []
    }
  }

  useEffect(() => {
    const loadBootstrap = async () => {
      try {
        const [healthResponse, sessionsResponse, settingsResponse] = await Promise.all([
          fetch('/api/health'),
          fetch('/api/chat/sessions'),
          fetch('/api/settings'),
        ])

        if (healthResponse.ok) {
          const payload = (await healthResponse.json()) as { llm_configured?: boolean }
          const configured = payload.llm_configured === true
          setLlmConfigured(configured)
          setBackendNotice(configured ? TEXT.bootstrapOk : TEXT.bootstrapMissing)
        } else {
          setBackendNotice(TEXT.backendDown)
        }

        if (settingsResponse.ok) {
          const payload = (await settingsResponse.json()) as AppSettingsState
          applySettingsPayload(payload)
        }

        if (sessionsResponse.ok) {
          const payload = (await sessionsResponse.json()) as { sessions?: SessionSummary[] }
          const sessions = Array.isArray(payload.sessions) ? payload.sessions : []
          setSessionSummaries(sessions)
          if (sessions.length > 0) {
            const remembered = window.localStorage.getItem(LAST_SESSION_KEY)
            const restored = sessions.find((item) => item.session_id === remembered) ?? sessions[0]
            setRestoreSessionId(restored.session_id)
          }
        }
      } catch {
        setLlmConfigured(false)
        setBackendNotice(TEXT.backendDown)
      } finally {
        setBootstrapReady(true)
      }
    }

    void loadBootstrap()
  }, [])

  const handleOpenSettings = () => {
    setSettingsOpen(true)
    void loadAppSettings()
  }

  const handleSaveSettings = async () => {
    setSettingsSaving(true)
    try {
      const body: Partial<AppSettingsDraft> = {
        chat_provider: settingsDraft.chat_provider,
        deepseek_chat_model: settingsDraft.deepseek_chat_model,
        embedding_provider: settingsDraft.embedding_provider,
        dashscope_embedding_model: settingsDraft.dashscope_embedding_model,
      }
      if (settingsDraft.deepseek_api_key.trim()) {
        body.deepseek_api_key = settingsDraft.deepseek_api_key.trim()
      }
      if (settingsDraft.dashscope_api_key.trim()) {
        body.dashscope_api_key = settingsDraft.dashscope_api_key.trim()
      }
      if (settingsDraft.chat_provider === 'custom') {
        body.deepseek_base_url = settingsDraft.deepseek_base_url.trim()
      }
      if (settingsDraft.embedding_provider === 'custom') {
        body.dashscope_base_url = settingsDraft.dashscope_base_url.trim()
      }

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        setBackendNotice('设置保存失败。')
        return
      }
      const payload = (await response.json()) as AppSettingsState
      applySettingsPayload(payload)
      setBackendNotice(payload.llm_configured ? '设置已保存，可以开始使用。' : '设置已保存，请继续补全 Key。')
      setSettingsOpen(false)
    } catch {
      setBackendNotice('设置保存失败。')
    } finally {
      setSettingsSaving(false)
    }
  }

  useEffect(() => {
    if (!bootstrapReady) {
      return
    }

    const initializeSession = async () => {
      const loadToken = sessionLoadTokenRef.current + 1
      sessionLoadTokenRef.current = loadToken
      const targetRestoreSessionId = restoreSessionId
      setSessionLoading(true)
      try {
        if (targetRestoreSessionId) {
          activeSessionRef.current = targetRestoreSessionId
          const response = await fetch(`/api/chat/session/${targetRestoreSessionId}`)
          if (sessionLoadTokenRef.current !== loadToken || !isActiveSession(targetRestoreSessionId)) {
            return
          }
          if (!response.ok) {
            setBackendNotice(await readErrorDetail(response, TEXT.openSessionFailed))
            return
          }

          const payload = (await response.json()) as SessionDetail
          if (sessionLoadTokenRef.current !== loadToken || payload.session_id !== targetRestoreSessionId || !isActiveSession(targetRestoreSessionId)) {
            return
          }
          const restoredArtifacts = normalizeArtifactCollection(payload.latest_artifacts, payload.latest_artifact)
          const restoredSubmissions = normalizeExerciseSubmissions(payload.exercise_submissions)
          const restoredHistory = Array.isArray(payload.generation_history) ? payload.generation_history : []
          setActiveSessionId(payload.session_id)
          setMessages(normalizeMessages(Array.isArray(payload.messages) ? payload.messages : []))
          setProfileCompletion(payload.profile_completion ?? 0)
          setReadyToGenerate(payload.ready_to_generate === true)
          setGeneration(payload.latest_generation ?? null)
          setArtifacts(restoredArtifacts)
          setArtifactVersions({ summary: restoredArtifacts.summary ? 1 : 0, qa_script: restoredArtifacts.qa_script ? 1 : 0 })
          setExerciseSubmissions(restoredSubmissions)
          setExerciseDrafts(buildExerciseDrafts(restoredSubmissions))
          setPathProgress(normalizePathProgress(payload.path_progress))
          setPathAssessments(normalizePathAssessments(payload.path_assessments))
          setPathFeedbackDrafts({})
          setSelectedPracticeIndex(0)
          setSelectedExampleIndex(0)
          setHistory(restoredHistory)
          setVersion(getLatestHistoryVersion(restoredHistory))
          setOnlineResources(Array.isArray(payload.online_resources) ? payload.online_resources : [])
          setCollaborationTrace(Array.isArray(payload.collaboration_trace) ? payload.collaboration_trace : [])
          setStage(payload.latest_generation ? 'generated' : payload.ready_to_generate ? 'ready_to_generate' : 'chatting')
          setBackendNotice(TEXT.restoreOk)
          window.localStorage.setItem(LAST_SESSION_KEY, payload.session_id)
          return
        }

        const response = await fetch('/api/chat/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ course_id: FALLBACK_COURSE.id }),
        })

        if (sessionLoadTokenRef.current !== loadToken || activeSessionRef.current !== '') {
          return
        }
        if (!response.ok) {
          setBackendNotice(await readErrorDetail(response, TEXT.createSessionFailed))
          resetSessionScopedState()
          setActiveSessionId('')
          return
        }

        const payload = (await response.json()) as SessionDetail
        if (sessionLoadTokenRef.current !== loadToken || activeSessionRef.current !== '') {
          return
        }
        const restoredArtifacts = normalizeArtifactCollection(payload.latest_artifacts, payload.latest_artifact)
        const restoredSubmissions = normalizeExerciseSubmissions(payload.exercise_submissions)
        const restoredHistory = Array.isArray(payload.generation_history) ? payload.generation_history : []
        setActiveSessionId(payload.session_id)
        setMessages(normalizeMessages(Array.isArray(payload.messages) ? payload.messages : []))
        setProfileCompletion(payload.profile_completion ?? 0)
        setReadyToGenerate(payload.ready_to_generate === true)
        setGeneration(payload.latest_generation ?? null)
        setArtifacts(restoredArtifacts)
        setArtifactVersions({ summary: restoredArtifacts.summary ? 1 : 0, qa_script: restoredArtifacts.qa_script ? 1 : 0 })
        setExerciseSubmissions(restoredSubmissions)
        setExerciseDrafts(buildExerciseDrafts(restoredSubmissions))
        setPathProgress(normalizePathProgress(payload.path_progress))
        setPathAssessments(normalizePathAssessments(payload.path_assessments))
        setPathFeedbackDrafts({})
        setSelectedPracticeIndex(0)
        setSelectedExampleIndex(0)
        setHistory(restoredHistory)
        setVersion(getLatestHistoryVersion(restoredHistory))
        setOnlineResources(Array.isArray(payload.online_resources) ? payload.online_resources : [])
        setCollaborationTrace(Array.isArray(payload.collaboration_trace) ? payload.collaboration_trace : [])
        setStage(payload.latest_generation ? 'generated' : payload.ready_to_generate ? 'ready_to_generate' : 'chatting')
        setActiveView('chat')
        setBackendNotice(TEXT.startHint)
        window.localStorage.setItem(LAST_SESSION_KEY, payload.session_id)
        void loadSessionSummaries()
      } catch {
        if (sessionLoadTokenRef.current === loadToken) {
          setBackendNotice(targetRestoreSessionId ? TEXT.openSessionFailed : TEXT.createSessionFailed)
        }
      } finally {
        if (sessionLoadTokenRef.current === loadToken) {
          setSessionLoading(false)
        }
      }
    }

    void initializeSession()
  }, [bootstrapReady, restoreSessionId, sessionSeed])

  const handleCreateNewSession = () => {
    sessionLoadTokenRef.current += 1
    activeSessionRef.current = ''
    setActiveSessionId('')
    resetSessionScopedState()
    setRestoreSessionId('')
    setActiveView('chat')
    window.localStorage.removeItem(LAST_SESSION_KEY)
    setSessionSeed((value) => value + 1)
  }

  const handleRestoreSession = (summary: SessionSummary) => {
    sessionLoadTokenRef.current += 1
    setActiveSessionId(summary.session_id)
    resetSessionScopedState()
    setRestoreSessionId(summary.session_id)
    setActiveView('chat')
    window.localStorage.setItem(LAST_SESSION_KEY, summary.session_id)
  }

  const handleRenameSession = async (summary: SessionSummary, event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    const currentTitle = getSessionTitle(summary)
    const nextTitle = window.prompt(TEXT.titlePrompt, currentTitle)
    if (!nextTitle || nextTitle.trim() === '' || nextTitle.trim() === currentTitle) {
      return
    }

    try {
      const response = await fetch(`/api/chat/session/${summary.session_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: nextTitle.trim() }),
      })
      if (!response.ok) {
        setBackendNotice(await readErrorDetail(response, TEXT.renameFailed))
        return
      }
      await loadSessionSummaries()
    } catch {
      setBackendNotice(TEXT.renameFailed)
    }
  }

  const handleDeleteSession = async (summary: SessionSummary, event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    const confirmed = window.confirm(`${TEXT.deleteConfirmPrefix}${getSessionTitle(summary)}${TEXT.deleteConfirmSuffix}`)
    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(`/api/chat/session/${summary.session_id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        setBackendNotice(await readErrorDetail(response, TEXT.deleteFailed))
        return
      }

      const sessions = await loadSessionSummaries()
      if (summary.session_id === activeSessionRef.current) {
        window.localStorage.removeItem(LAST_SESSION_KEY)
        const replacement = sessions.find((item) => item.session_id !== summary.session_id)
        if (replacement) {
          handleRestoreSession(replacement)
        } else {
          handleCreateNewSession()
        }
      }
    } catch {
      setBackendNotice(TEXT.deleteFailed)
    }
  }

  const handleSendMessage = async () => {
    const message = draft.trim()
    if (!message || !sessionId || messageLoading) {
      return
    }

    const requestSessionId = sessionId
    const hadGeneration = Boolean(generation)
    setDraft('')
    setMessageLoading(true)
    setPendingMessage(message)
    if (hadGeneration) {
      setStage('refining')
    }

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: requestSessionId,
          message,
        }),
      })

      if (!isActiveSession(requestSessionId)) {
        return
      }
      if (!response.ok) {
        setBackendNotice(await readErrorDetail(response, TEXT.sendFailed))
        return
      }

      const payload = (await response.json()) as {
        session_id?: string
        messages?: ChatMessage[]
        profile_completion?: number
        missing_slots?: string[]
        ready_to_generate?: boolean
      }

      if (!isActiveSession(requestSessionId) || (payload.session_id && payload.session_id !== requestSessionId)) {
        return
      }
      setMessages(normalizeMessages(Array.isArray(payload.messages) ? payload.messages : []))
      setProfileCompletion(payload.profile_completion ?? 0)
      setReadyToGenerate(payload.ready_to_generate === true)
      setStage(hadGeneration ? 'refining' : payload.ready_to_generate ? 'ready_to_generate' : 'chatting')
      setBackendNotice(payload.ready_to_generate ? TEXT.readyNotice : TEXT.refineNotice)
      void loadSessionSummaries()
    } catch {
      if (isActiveSession(requestSessionId)) {
        setBackendNotice(TEXT.sendFailed)
      }
    } finally {
      if (isActiveSession(requestSessionId)) {
        setPendingMessage('')
        setMessageLoading(false)
      }
    }
  }

  const handleGenerate = async () => {
    if (!sessionId || !llmConfigured || generationLoading) {
      return
    }

    const requestSessionId = sessionId
    setGenerationLoading(true)
    const nextVersion = version + 1
    setVersion(nextVersion)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: requestSessionId,
          focus: '\u8bb2\u89e3',
          depth,
          version: nextVersion,
        }),
      })

      if (!isActiveSession(requestSessionId)) {
        return
      }
      if (!response.ok) {
        setBackendNotice(await readErrorDetail(response, TEXT.generateFailed))
        return
      }

      const payload = (await response.json()) as GenerationState & {
        session_id?: string
        history?: RunRecord[]
        online_resources?: OnlineResource[]
        collaboration_trace?: CollaborationRecord[]
      }
      if (!isActiveSession(requestSessionId) || (payload.session_id && payload.session_id !== requestSessionId)) {
        return
      }
      setGeneration(payload)
      setPathProgress({})
      setPathAssessments({})
      setPathFeedbackDrafts({})
      setHistory(Array.isArray(payload.history) ? payload.history : [])
      setOnlineResources(Array.isArray(payload.online_resources) ? payload.online_resources : [])
      setCollaborationTrace(Array.isArray(payload.collaboration_trace) ? payload.collaboration_trace : [])
      setStage('generated')
      setActiveView('profile')
      setBackendNotice(TEXT.generatedNotice)
      void loadSessionSummaries()
    } catch {
      if (isActiveSession(requestSessionId)) {
        setBackendNotice(TEXT.generateFailed)
      }
    } finally {
      if (isActiveSession(requestSessionId)) {
        setGenerationLoading(false)
      }
    }
  }

  const handleArtifact = async (nextKind: ArtifactKind) => {
    if (!sessionId || !llmConfigured || artifactLoading) {
      return
    }

    const requestSessionId = sessionId
    const previousSectionCount = nextKind === 'summary' ? exerciseSections.length : scriptSections.length
    setArtifactLoadingBySession((current) => ({
      ...current,
      [requestSessionId]: nextKind,
    }))
    const nextVariant = (artifactVersions[nextKind] ?? 0) + 1
    setArtifactVersions((current) => ({
      ...current,
      [nextKind]: nextVariant,
    }))
    try {
      const response = await fetch('/api/artifact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: requestSessionId,
          focus: nextKind === 'summary' ? '\u7ec3\u4e60' : '\u8bb2\u89e3',
          depth,
          artifact: nextKind,
          variant: nextVariant,
        }),
      })

      if (!isActiveSession(requestSessionId)) {
        return
      }
      if (!response.ok) {
        throw new Error(await readErrorDetail(response, TEXT.artifactFailed))
      }

      const payload = (await response.json()) as ArtifactState & { session_id?: string; collaboration_trace?: CollaborationRecord[] }
      if (!isActiveSession(requestSessionId) || (payload.session_id && payload.session_id !== requestSessionId)) {
        return
      }
      setArtifacts((current) => ({
        ...current,
        [nextKind]: payload,
      }))
      if (nextKind === 'summary') {
        const nextSubmissions = normalizeExerciseSubmissions(payload.exercise_submissions)
        setExerciseSubmissions(nextSubmissions)
        setExerciseDrafts((current) => ({
          ...buildExerciseDrafts(nextSubmissions),
          ...current,
        }))
        setSelectedPracticeIndex(previousSectionCount)
      } else {
        setSelectedExampleIndex(previousSectionCount)
      }
      setCollaborationTrace(Array.isArray(payload.collaboration_trace) ? payload.collaboration_trace : [])
      setActiveView(nextKind === 'summary' ? 'practice' : 'examples')
      setBackendNotice(TEXT.artifactReady)
      void loadSessionSummaries()
    } catch (error) {
      if (isActiveSession(requestSessionId)) {
        setBackendNotice(error instanceof Error ? error.message : TEXT.artifactFailed)
      }
    } finally {
      setArtifactLoadingBySession((current) => {
        if (current[requestSessionId] !== nextKind) {
          return current
        }
        const next = { ...current }
        delete next[requestSessionId]
        return next
      })
    }
  }

  const handleSubmitExercise = async () => {
    if (!sessionId || !currentExercise || exerciseReviewLoading) {
      return
    }

    const userCode = currentDraft
    const requestSessionId = sessionId
    const requestExerciseKey = selectedExerciseKey

    setExerciseReviewLoading(true)
    try {
      const response = await fetch('/api/exercise/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: requestSessionId,
          exercise_index: activePracticeIndex,
          exercise_heading: normalizeText(currentExercise.heading, `\u7ec3\u4e60 ${activePracticeIndex + 1}`),
          prompt_lines: currentExercise.lines,
          user_code: userCode,
        }),
      })

      if (!isActiveSession(requestSessionId)) {
        return
      }
      if (!response.ok) {
        setBackendNotice(await readErrorDetail(response, TEXT.reviewFailed))
        return
      }

      const payload = (await response.json()) as { session_id?: string; submission?: ExerciseSubmissionState; collaboration_trace?: CollaborationRecord[] }
      if (!isActiveSession(requestSessionId) || (payload.session_id && payload.session_id !== requestSessionId)) {
        return
      }
      if (payload.submission) {
        setExerciseSubmissions((current) => ({
          ...current,
          [requestExerciseKey]: payload.submission as ExerciseSubmissionState,
        }))
        setExerciseDrafts((current) => ({
          ...current,
          [requestExerciseKey]: payload.submission?.user_code ?? userCode,
        }))
      }
      setCollaborationTrace(Array.isArray(payload.collaboration_trace) ? payload.collaboration_trace : [])
      setBackendNotice(TEXT.reviewSaved)
      void loadSessionSummaries()
    } catch {
      if (isActiveSession(requestSessionId)) {
        setBackendNotice(TEXT.reviewFailed)
      }
    } finally {
      if (isActiveSession(requestSessionId)) {
        setExerciseReviewLoading(false)
      }
    }
  }

  const handleLoadOnlineResources = async () => {
    if (!sessionId || onlineResourcesLoading) {
      return
    }

    const requestSessionId = sessionId
    const requestCourseId = FALLBACK_COURSE.id
    const weaknessQuery = [
      generation?.profile.dimensions.weakness ?? '',
      generation?.profile.next_focus ?? '',
      course.painPoint,
    ]
      .filter(Boolean)
      .join('，')

    setOnlineResourcesLoading(true)
    setBackendNotice(TEXT.loadingOnlineResources)
    try {
      const response = await fetch('/api/online-resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: requestSessionId,
          course_id: requestCourseId,
          focus: '\u590d\u4e60',
          query: weaknessQuery,
        }),
      })

      if (!isActiveSession(requestSessionId)) {
        return
      }
      if (!response.ok) {
        setBackendNotice('外部资料暂时获取失败。')
        return
      }

      const payload = (await response.json()) as { session_id?: string | null; resources?: OnlineResource[] }
      if (!isActiveSession(requestSessionId) || payload.session_id !== requestSessionId) {
        return
      }
      const resources = Array.isArray(payload.resources) ? payload.resources : []
      setOnlineResources(resources)
      setBackendNotice(resources.length > 0 ? '已补充 ' + resources.length + ' 条外部学习资料。' : '暂时没有找到更合适的外部资料。')
    } catch {
      if (isActiveSession(requestSessionId)) {
        setBackendNotice('外部资料暂时获取失败。')
      }
    } finally {
      if (isActiveSession(requestSessionId)) {
        setOnlineResourcesLoading(false)
      }
    }
  }

  useEffect(() => {
    if (activeView !== 'path' || !generation || !sessionId || onlineResources.length > 0 || onlineResourcesLoading) {
      return
    }
    if (autoLoadedPathResourcesRef.current[sessionId]) {
      return
    }
    autoLoadedPathResourcesRef.current[sessionId] = true
    void handleLoadOnlineResources()
  }, [activeView, generation, onlineResources.length, onlineResourcesLoading, sessionId])

  const handleSubmitPathAssessment = async (stepIndex: number) => {
    if (!sessionId || pathAssessmentLoading !== null) {
      return
    }
    const feedback = (pathFeedbackDrafts[String(stepIndex)] ?? pathAssessments[String(stepIndex)]?.feedback ?? '').trim()
    if (!feedback) {
      setBackendNotice('先写一句学习反馈，再提交跟进。')
      return
    }

    const requestSessionId = sessionId
    setPathAssessmentLoading(stepIndex)
    try {
      const response = await fetch('/api/path/assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: requestSessionId,
          step_index: stepIndex,
          feedback,
        }),
      })

      if (!isActiveSession(requestSessionId)) {
        return
      }
      if (!response.ok) {
        setBackendNotice(await readErrorDetail(response, '跟进分析失败。'))
        return
      }

      const payload = (await response.json()) as {
        session_id?: string
        path_progress?: PathProgressState
        path_assessments?: PathAssessmentCollection
      }
      if (!isActiveSession(requestSessionId) || payload.session_id !== requestSessionId) {
        return
      }
      setPathProgress(normalizePathProgress(payload.path_progress))
      setPathAssessments(normalizePathAssessments(payload.path_assessments))
      setBackendNotice('跟进建议已更新。')
    } catch {
      if (isActiveSession(requestSessionId)) {
        setBackendNotice('跟进分析失败。')
      }
    } finally {
      if (isActiveSession(requestSessionId)) {
        setPathAssessmentLoading(null)
      }
    }
  }

  const isSuggestedActionDisabled = (actionType: SuggestedActionType) => {
    if (!sessionId || sessionLoading || messageLoading) {
      return true
    }
    if (actionType === 'recommend_resources') {
      return onlineResourcesLoading
    }
    if (actionType === 'generate_plan') {
      return !llmConfigured || generationLoading
    }
    return !llmConfigured || artifactLoading !== null
  }

  const renderSuggestedActionIcon = (actionType: SuggestedActionType) => {
    if (actionType === 'generate_plan') {
      return <Sparkles size={15} />
    }
    if (actionType === 'generate_examples') {
      return <MessageSquareText size={15} />
    }
    if (actionType === 'generate_practice') {
      return <ClipboardCheck size={15} />
    }
    return <Globe size={15} />
  }

  const handleSuggestedAction = async (action: SuggestedAction) => {
    if (isSuggestedActionDisabled(action.type)) {
      return
    }

    if (action.type === 'generate_plan') {
      await handleGenerate()
      return
    }
    if (action.type === 'generate_examples') {
      await handleArtifact('qa_script')
      return
    }
    if (action.type === 'generate_practice') {
      await handleArtifact('summary')
      return
    }

    setActiveView('resources')
    await handleLoadOnlineResources()
  }

  const renderOnlineResourcesSection = () => (
    <section className="support-section">
      <div className="section-title">
        <Globe size={16} />
        {TEXT.onlineResourcesTitle}
      </div>
      <p className="preview-reason">{TEXT.onlineResourcesHint}</p>
      <div className="secondary-actions">
        <button className="ghost-button" type="button" onClick={() => void handleLoadOnlineResources()} disabled={onlineResourcesLoading}>
          <Globe size={16} />
          {onlineResourcesLoading ? TEXT.loadingOnlineResources : TEXT.fetchOnlineResources}
        </button>
      </div>
      {onlineResources.length > 0 ? (
        <div className="resource-list">
          {onlineResources.map((item) => {
            const provider = normalizeText(item.provider, '学习资料')
            const title = normalizeText(item.title, '澶栭儴璧勬枡')
            const summary = normalizeText(item.summary, '这里会补充与你当前问题更相关的外部学习资料。')
            const matchLabels = (item.match_labels ?? []).map((label) => normalizeTagLabel(label)).filter(Boolean)
            const iconUrl = getResourceIconUrl(item.url)

            return (
            <a
              key={item.id}
              className="resource-card external-resource-card"
              href={item.url}
              target="_blank"
              rel="noreferrer"
            >
              <div className="resource-head">
                <div className="resource-icon resource-site-icon">
                  {iconUrl ? (
                    <img
                      src={iconUrl}
                      alt=""
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <Globe size={16} />
                  )}
                </div>
                <div>
                  <span>{provider}</span>
                  <strong>{title}</strong>
                </div>
              </div>
              {matchLabels.length > 0 ? (
                <div className="match-tags" aria-label={TEXT.matchedWeakness}>
                  {matchLabels.slice(0, 3).map((label) => (
                    <span className="match-tag" key={item.id + '-' + label}>
                      {label}
                    </span>
                  ))}
                </div>
              ) : null}
              <p>{summary}</p>
              <span className="resource-link">
                {TEXT.openResource}
                <ExternalLink size={14} />
              </span>
            </a>
            )
          })}
        </div>
      ) : (
        <p className="history-empty">{TEXT.emptyOnlineResources}</p>
      )}
    </section>
  )

  return (
    <div className="app-shell">
      <div className="sr-only" aria-live="polite">
        {backendNotice}
      </div>
      <header className="topbar">
        <div className="topbar-intro">
          <h1 className="topbar-title" aria-label={TEXT.heading}>
            <span className="topbar-title-badge">AI-Python</span>
            <span className="topbar-title-main">{'\u5b66\u4e60\u52a9\u624b'}</span>
          </h1>
        </div>
      </header>

      {settingsOpen ? (
        <div className="settings-backdrop" role="presentation" onMouseDown={() => setSettingsOpen(false)}>
          <section className="settings-dialog" role="dialog" aria-modal="true" aria-label="模型设置" onMouseDown={(event) => event.stopPropagation()}>
            <div className="settings-head">
              <div>
                <h2>模型设置</h2>
                <p>选择服务商和模型，只需要填写对应的 API Key。</p>
              </div>
              <button className="icon-button" type="button" onClick={() => setSettingsOpen(false)} aria-label="关闭设置">
                <X size={18} />
              </button>
            </div>

            <div className="settings-body settings-body-provider">
              <div className="settings-group">
                <h3>对话模型</h3>
                <p>用于聊天、学习情况总结、典例和练习生成。</p>
              </div>

              <label className="settings-field provider-field">
                <span>服务商</span>
                <select
                  value={settingsDraft.chat_provider}
                  onChange={(event) => {
                    const provider = chatProviderOptions.find((item) => item.id === event.target.value) ?? chatProviderOptions[0]
                    setSettingsDraft((current) => ({
                      ...current,
                      chat_provider: provider.id,
                      deepseek_chat_model: provider.models[0] ?? current.deepseek_chat_model,
                    }))
                  }}
                >
                  {chatProviderOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="settings-field provider-field">
                <span>模型</span>
                {settingsDraft.chat_provider === 'custom' ? (
                  <input
                    value={settingsDraft.deepseek_chat_model}
                    placeholder="例如：gpt-4.1-mini"
                    onChange={(event) => setSettingsDraft((current) => ({ ...current, deepseek_chat_model: event.target.value }))}
                  />
                ) : (
                  <select
                    value={settingsDraft.deepseek_chat_model}
                    onChange={(event) => setSettingsDraft((current) => ({ ...current, deepseek_chat_model: event.target.value }))}
                  >
                    {selectedChatProvider.models.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                )}
              </label>

              {settingsDraft.chat_provider === 'custom' ? (
                <label className="settings-field provider-field wide-field">
                  <span>接口地址</span>
                  <input
                    value={settingsDraft.deepseek_base_url}
                    placeholder="例如：https://api.example.com/v1"
                    onChange={(event) => setSettingsDraft((current) => ({ ...current, deepseek_base_url: event.target.value }))}
                  />
                </label>
              ) : null}

              <label className="settings-field provider-field wide-field">
                <span>API Key</span>
                <input
                  type="password"
                  value={settingsDraft.deepseek_api_key}
                  placeholder={appSettings?.deepseek_api_key_masked ? '已配置：' + appSettings.deepseek_api_key_masked : '输入所选服务商的 API Key'}
                  onChange={(event) => setSettingsDraft((current) => ({ ...current, deepseek_api_key: event.target.value }))}
                />
              </label>

              <div className="settings-group">
                <h3>资料检索</h3>
                <p>用于课程资料索引和相似内容检索。</p>
              </div>

              <label className="settings-field provider-field">
                <span>服务商</span>
                <select
                  value={settingsDraft.embedding_provider}
                  onChange={(event) => {
                    const provider = embeddingProviderOptions.find((item) => item.id === event.target.value) ?? embeddingProviderOptions[0]
                    setSettingsDraft((current) => ({
                      ...current,
                      embedding_provider: provider.id,
                      dashscope_embedding_model: provider.models[0] ?? current.dashscope_embedding_model,
                    }))
                  }}
                >
                  {embeddingProviderOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="settings-field provider-field">
                <span>模型</span>
                {settingsDraft.embedding_provider === 'custom' ? (
                  <input
                    value={settingsDraft.dashscope_embedding_model}
                    placeholder="例如：text-embedding-3-small"
                    onChange={(event) => setSettingsDraft((current) => ({ ...current, dashscope_embedding_model: event.target.value }))}
                  />
                ) : (
                  <select
                    value={settingsDraft.dashscope_embedding_model}
                    onChange={(event) => setSettingsDraft((current) => ({ ...current, dashscope_embedding_model: event.target.value }))}
                  >
                    {selectedEmbeddingProvider.models.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                )}
              </label>

              {settingsDraft.embedding_provider === 'custom' ? (
                <label className="settings-field provider-field wide-field">
                  <span>接口地址</span>
                  <input
                    value={settingsDraft.dashscope_base_url}
                    placeholder="例如：https://api.example.com/v1"
                    onChange={(event) => setSettingsDraft((current) => ({ ...current, dashscope_base_url: event.target.value }))}
                  />
                </label>
              ) : null}

              <label className="settings-field provider-field wide-field">
                <span>API Key</span>
                <input
                  type="password"
                  value={settingsDraft.dashscope_api_key}
                  placeholder={appSettings?.dashscope_api_key_masked ? '已配置：' + appSettings.dashscope_api_key_masked : '输入所选服务商的 API Key'}
                  onChange={(event) => setSettingsDraft((current) => ({ ...current, dashscope_api_key: event.target.value }))}
                />
              </label>
              <label className="settings-field">
                <span>DeepSeek 瀵硅瘽 Key</span>
                <input
                  type="password"
                  value={settingsDraft.deepseek_api_key}
                  placeholder={appSettings?.deepseek_api_key_masked ? '已配置：' + appSettings.deepseek_api_key_masked : '输入 API Key'}
                  onChange={(event) => setSettingsDraft((current) => ({ ...current, deepseek_api_key: event.target.value }))}
                />
              </label>

              <label className="settings-field">
                <span>DeepSeek 妯″瀷</span>
                <input
                  value={settingsDraft.deepseek_chat_model}
                  onChange={(event) => setSettingsDraft((current) => ({ ...current, deepseek_chat_model: event.target.value }))}
                />
              </label>

              <label className="settings-field wide-field">
                <span>DeepSeek 鍦板潃</span>
                <input
                  value={settingsDraft.deepseek_base_url}
                  onChange={(event) => setSettingsDraft((current) => ({ ...current, deepseek_base_url: event.target.value }))}
                />
              </label>

              <label className="settings-field">
                <span>鍗冮棶鍚戦噺 Key</span>
                <input
                  type="password"
                  value={settingsDraft.dashscope_api_key}
                  placeholder={appSettings?.dashscope_api_key_masked ? '已配置：' + appSettings.dashscope_api_key_masked : '输入 API Key'}
                  onChange={(event) => setSettingsDraft((current) => ({ ...current, dashscope_api_key: event.target.value }))}
                />
              </label>

              <label className="settings-field">
                <span>鍚戦噺妯″瀷</span>
                <input
                  value={settingsDraft.dashscope_embedding_model}
                  onChange={(event) => setSettingsDraft((current) => ({ ...current, dashscope_embedding_model: event.target.value }))}
                />
              </label>

              <label className="settings-field wide-field">
                <span>鍗冮棶鍦板潃</span>
                <input
                  value={settingsDraft.dashscope_base_url}
                  onChange={(event) => setSettingsDraft((current) => ({ ...current, dashscope_base_url: event.target.value }))}
                />
              </label>
            </div>

            <div className="settings-foot">
              <span>{appSettings?.llm_configured ? '当前配置完整' : '请补全对话 Key 和向量 Key'}</span>
              <div className="settings-actions">
                <button className="ghost-button" type="button" onClick={() => setSettingsOpen(false)}>
                  取消
                </button>
                <button className="primary-button" type="button" onClick={() => void handleSaveSettings()} disabled={settingsSaving}>
                  {settingsSaving ? '保存中...' : '保存设置'}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      <main className="workspace-shell">
        <aside className="history-rail panel">
          <div className="panel-head">
            <div>
              <h2>{TEXT.recentChats}</h2>
              <p>{TEXT.recentChatsHint}</p>
            </div>
            <History size={18} />
          </div>

          <div className="session-list">
            {sessionSummaries.length > 0 ? (
              sessionSummaries.map((item) => (
                <article
                  key={item.session_id}
                  className={item.session_id === sessionId ? 'session-card active' : 'session-card'}
                  onClick={() => handleRestoreSession(item)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      handleRestoreSession(item)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="session-card-top">
                    <strong>{getSessionTitle(item)}</strong>
                    <span>{formatSessionTime(item.updated_at)}</span>
                  </div>
                  <p>{getSessionPreview(item)}</p>
                  <div className="session-actions">
                    <button
                      type="button"
                      className="session-action-button"
                      onClick={(event) => void handleRenameSession(item, event)}
                      aria-label={TEXT.rename}
                    >
                      <PencilLine size={14} />
                    </button>
                    <button
                      type="button"
                      className="session-action-button danger"
                      onClick={(event) => void handleDeleteSession(item, event)}
                      aria-label={TEXT.delete}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="session-meta">
                    <em>
                      {item.message_count} {TEXT.records}
                    </em>
                    <span>{item.has_generation ? TEXT.planReady : TEXT.continueChat}</span>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">{TEXT.noHistory}</div>
            )}
          </div>
        </aside>

        <div className="main-workspace">
          <section className="overview-strip user-overview-strip">
            <div className="overview-card overview-card-primary">
              <span>{TEXT.currentCourse}</span>
              <strong>{course.name}</strong>
              <p>{course.summary}</p>
            </div>
            <div className="overview-card overview-card-depth">
              <span>{TEXT.planDepth}</span>
              <strong>{depthCopy.label}</strong>
              <p>{depthCopy.description}</p>
              <input type="range" min="1" max="3" step="1" value={depth} onChange={(event) => setDepth(Number(event.target.value))} />
            </div>
            <div className="overview-card overview-card-status">
              <span>{TEXT.currentStatus}</span>
              <strong>{conversationStatus.label}</strong>
              <p>{conversationStatus.description}</p>
              <div className="progress-bar compact">
                <span style={{ width: conversationStatus.progress + '%' }} />
              </div>
              <div className="overview-status-foot">
                <span className="stage-pill">{STAGE_LABELS[stage]}</span>
              </div>
            </div>
          </section>

          <nav className="view-tabs" aria-label="\u9875\u9762\u5207\u6362">
            {(Object.keys(VIEW_LABELS) as AppView[]).map((view) => (
              <button key={view} type="button" className={activeView === view ? 'view-tab active' : 'view-tab'} onClick={() => setActiveView(view)}>
                {VIEW_LABELS[view]}
              </button>
            ))}
          </nav>

          <div className="workspace-actions">
            <button className="ghost-button" type="button" onClick={handleOpenSettings}>
              <SettingsIcon size={16} />
              {'\u8bbe\u7f6e'}
            </button>
            <button className="ghost-button" type="button" onClick={handleCreateNewSession} disabled={sessionLoading}>
              <RefreshCw size={16} />
              {TEXT.newChat}
            </button>
          </div>

          <section className="page-shell">
            {activeView === 'chat' ? (
              <section className="page page-chat panel">
                <div className="panel-head">
                  <div>
                    <h2>{TEXT.chat}</h2>
                  </div>
                  <MessageSquareText size={18} />
                </div>

                <div className="chat-layout">
                  <div className="chat-main">
                    <div className="dialog-scroller" ref={dialogScrollerRef}>
                      {displayMessages.length > 0 ? (
                        displayMessages.map((message, index) => (
                          <article className={message.role === 'assistant' ? 'message-row assistant' : 'message-row user'} key={message.role + '-' + index + '-' + (message.status ?? 'done')}>
                            <div className="message-avatar">{message.role === 'assistant' ? <Sparkles size={16} /> : <UserRound size={16} />}</div>
                            <div className={message.status === 'thinking' ? 'message-bubble thinking' : 'message-bubble'}>
                              <span className="message-label">{message.role === 'assistant' ? TEXT.assistant : TEXT.you}</span>
                              {message.role === 'assistant' ? (
                                <div className="chat-markdown">
                                  <LearningMarkdown content={message.content} />
                                </div>
                              ) : (
                                <p>{message.content}</p>
                              )}
                              {!pendingMessage && message.role === 'assistant' && message.status !== 'thinking' && index === lastAssistantMessageIndex && message.suggested_actions?.length ? (
                                <div className="message-action-row" aria-label="\u53ef\u7ee7\u7eed\u6267\u884c\u7684\u64cd\u4f5c">
                                  {message.suggested_actions.map((action) => (
                                    <button
                                      className="message-action-button"
                                      type="button"
                                      key={action.type}
                                      onClick={() => void handleSuggestedAction(action)}
                                      disabled={isSuggestedActionDisabled(action.type)}
                                    >
                                      {renderSuggestedActionIcon(action.type)}
                                      {normalizeText(action.label, SUGGESTED_ACTION_LABELS[action.type])}
                                    </button>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </article>
                        ))
                      ) : (
                        <div className="empty-state">{TEXT.preparing}</div>
                      )}
                    </div>

                    <div className="composer">
                      <textarea
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault()
                            void handleSendMessage()
                          }
                        }}
                        placeholder={TEXT.placeholder}
                        rows={4}
                        disabled={!sessionId || sessionLoading}
                      />
                      <div className="composer-actions">
                        <div className="stage-pill">{STAGE_LABELS[stage]}</div>
                        <div className="composer-buttons">
                          <button className="ghost-button" type="button" onClick={() => void handleGenerate()} disabled={!llmConfigured || !sessionId || generationLoading}>
                            <Sparkles size={16} />
                            {generationLoading ? TEXT.generating : TEXT.generatePlan}
                          </button>
                          <button className="primary-button" type="button" onClick={() => void handleSendMessage()} disabled={!draft.trim() || messageLoading || sessionLoading}>
                            <SendHorizontal size={16} />
                            {messageLoading ? TEXT.thinking : TEXT.send}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </section>
            ) : null}

            {activeView === 'profile' ? (
              <section className="page panel">
                <div className="panel-head">
                  <div>
                    <h2>{TEXT.profile}</h2>
                  </div>
                  <UserRound size={18} />
                </div>
                {generation ? (
                  <div className="result-stack">
                    <section className="profile-hero">
                      <div className="profile-hero-copy">
                        <span className="profile-hero-eyebrow">{TEXT.profile}</span>
                        <p className="summary-text profile-hero-summary">
                          {normalizeText(generation.profile.summary, TEXT.summaryFallback)}
                        </p>
                        <div className="profile-hero-meta">
                          <span className="profile-meta-pill">
                            {levelLabelMap[generation.profile.level_tag ?? ''] ?? '\u5f53\u524d\u9636\u6bb5'}
                          </span>
                          <span className="profile-meta-pill">
                            {'信息完整度 ' + (generation.profile.confidence ?? 0) + '%'}
                          </span>
                        </div>
                      </div>
                      <div className="profile-focus-panel">
                        <span className="profile-focus-label">{TEXT.nextFocus}</span>
                        <strong>{normalizeText(generation.profile.next_focus ?? '', TEXT.nextFocusFallback)}</strong>
                        <p>后续资料和练习会优先围绕这个方向展开。</p>
                      </div>
                    </section>

                    <section className="profile-tag-strip">
                      <div className="profile-tag-block">
                        <span>当前薄弱点</span>
                        <div className="match-tags">
                          {weaknessTags.length > 0 ? (
                            weaknessTags.slice(0, 6).map((tag) => (
                              <span className="match-tag critical" key={tag}>
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="match-tag">待识别</span>
                          )}
                        </div>
                      </div>
                      <div className="profile-tag-block">
                        <span>更适合的学习方式</span>
                        <div className="match-tags">
                          {preferredFormatTags.length > 0 ? (
                            preferredFormatTags.map((tag) => (
                              <span className="match-tag subtle" key={tag}>
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="match-tag">待识别</span>
                          )}
                        </div>
                      </div>
                    </section>

                    <section className="collaboration-panel" aria-label="学习助手协作">
                      <div className="collaboration-head">
                        <div>
                          <span className="profile-hero-eyebrow">学习助手协作</span>
                          <h3>{`5 个学习环节协同推进，已完成 ${completedCollaborationCount} 个`}</h3>
                        </div>
                        <ClipboardCheck size={18} />
                      </div>
                      <div className="collaboration-track" aria-hidden="true">
                        {collaborationSteps.map((item, index) => (
                          <div className={item.status === '待开始' || item.status === '待完成' ? 'collaboration-dot pending' : 'collaboration-dot done'} key={'dot-' + item.role}>
                            <span>{index + 1}</span>
                          </div>
                        ))}
                      </div>
                      <div className="collaboration-grid">
                        {collaborationSteps.map((item) => (
                          <article className={item.status === '待开始' || item.status === '待完成' ? 'collaboration-card pending' : 'collaboration-card'} key={item.role}>
                            <div className="collaboration-card-top">
                              <strong>{normalizeText(item.title, '学习协作')}</strong>
                              <span>{normalizeText(item.status, '待开始')}</span>
                            </div>
                            <p>{normalizeText(item.output_summary, '已根据当前学习情况完成处理。')}</p>
                            <div className="collaboration-source-row">
                              {(Array.isArray(item.used_sources) ? item.used_sources : []).slice(0, 3).map((source) => (
                                <em key={item.role + '-' + source}>{source}</em>
                              ))}
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>

                    <section className="profile-card-grid">
                      {profileOverviewCards.map((item) => {
                        const Icon = item.icon
                        return (
                          <article className="profile-insight-card" key={item.key}>
                            <div className="profile-insight-head">
                              <div className="resource-icon">
                                <Icon size={16} />
                              </div>
                              <div>
                                <span>{item.label}</span>
                              </div>
                            </div>
                            <p>{item.value}</p>
                          </article>
                        )
                      })}
                    </section>

                    <section className="profile-spotlight-grid">
                      {profileInsightCards.map((item) => {
                        const Icon = item.icon
                        return (
                          <article
                            className={item.tone === 'danger' ? 'profile-spotlight-card danger' : 'profile-spotlight-card'}
                            key={item.key}
                          >
                            <div className="profile-insight-head">
                              <div className="resource-icon">
                                <Icon size={16} />
                              </div>
                              <div>
                                <span>{item.label}</span>
                              </div>
                            </div>
                            <strong>{item.value}</strong>
                          </article>
                        )
                      })}
                    </section>

                  </div>
                ) : (
                  <div className="empty-state">{TEXT.emptyProfile}</div>
                )}
              </section>
            ) : null}

            {activeView === 'resources' ? (
              <section className="page panel">
                <div className="panel-head">
                  <div>
                    <h2>{TEXT.resources}</h2>
                  </div>
                  <BookOpen size={18} />
                </div>
                {generation ? (
                  <div>
                    <section className="preview-panel">
                      <div className="section-title">
                        <Compass size={16} />
                        {TEXT.resourceFocusTitle}
                      </div>
                      <h3>
                        {weaknessTags.length > 0
                          ? '需要重点补强：' + weaknessTags.slice(0, 4).join('、')
                          : normalizeText(generation.profile.next_focus ?? '', TEXT.nextFocusFallback)}
                      </h3>
                      <p className="preview-reason">{TEXT.resourceFocusHint}</p>
                      <div className="match-tags">
                        {weaknessTags.length > 0 ? (
                          weaknessTags.slice(0, 6).map((tag) => (
                            <span className="match-tag critical" key={tag}>
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="match-tag subtle">{TEXT.nextFocusFallback}</span>
                        )}
                      </div>
                    </section>
                    {renderOnlineResourcesSection()}
                  </div>
                ) : (
                  <div>
                    <div className="empty-state">{TEXT.emptyResources}</div>
                    {renderOnlineResourcesSection()}
                  </div>
                )}
              </section>
            ) : null}

            {activeView === 'examples' ? (
              <section className="page panel">
                <div className="panel-head">
                  <div>
                    <h2>{TEXT.scriptArtifact}</h2>
                  </div>
                  <MessageSquareText size={18} />
                </div>
                <section className="support-section practice-layout">
                  <aside className="practice-sidebar">
                    <div className="practice-side-card">
                      <span className="practice-side-label">{TEXT.scriptArtifact}</span>
                      <p className="practice-side-hint">
                        {'\u8fd9\u91cc\u5355\u72ec\u5c55\u793a\u5178\u578b\u4f8b\u9898\u3001\u89e3\u9898\u601d\u8def\u548c\u53c2\u8003\u4ee3\u7801\u3002'}
                      </p>
                    </div>

                    {scriptSections.length > 0 ? (
                      <div className="practice-side-card">
                        <span className="practice-side-label">{TEXT.scriptArtifact}</span>
                        <div className="practice-queue">
                          {scriptSections.map((section, index) => (
                            <button
                              key={section.heading + '-' + index}
                              type="button"
                              className={activeExampleIndex === index ? 'practice-queue-item active' : 'practice-queue-item'}
                              onClick={() => setSelectedExampleIndex(index)}
                            >
                              <div className="practice-queue-top">
                                <strong>{'典例 ' + (index + 1)}</strong>
                                <em>{'\u7cbe\u8bb2'}</em>
                              </div>
                              <span>{simplifySectionHeading(section.heading, '典例 ' + (index + 1))}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </aside>

                  <div className="practice-stage">
                    {exampleArtifact ? (
                      <div className="artifact-card practice-artifact-card">
                        <div className="practice-stage-head">
                          <div className="practice-stage-copy">
                            <h3>{TEXT.scriptArtifact}</h3>
                            <p>
                              {normalizeText(
                                exampleArtifact.summary,
                                '\u8fd9\u91cc\u4f1a\u7ed9\u4f60\u5b8c\u6574\u793a\u4f8b\u3001\u89e3\u9898\u601d\u8def\u548c\u4ee3\u7801\u8bb2\u89e3\u3002',
                              )}
                            </p>
                            <span className="collaboration-inline-note">内容已根据学习情况和课程资料生成。</span>
                          </div>
                          <div className="secondary-actions artifact-inline-actions">
                            <button className="ghost-button" type="button" onClick={() => void handleArtifact('qa_script')} disabled={artifactLoading !== null}>
                              <MessageSquareText size={16} />
                              {artifactLoading === 'qa_script' ? TEXT.generating : TEXT.regenerateScriptArtifact}
                            </button>
                          </div>
                        </div>

                        {currentExample ? (
                          <div className="artifact-sections focused">
                            <article key={currentExample.heading + '-' + activeExampleIndex}>
                              <strong>{'典例 ' + (activeExampleIndex + 1)}</strong>
                              <ArtifactSectionContent section={currentExample} sectionIndex={activeExampleIndex} keyPrefix="qa_script" />
                            </article>
                          </div>
                        ) : (
                          <div className="empty-state compact">{TEXT.emptyScriptArtifactHint}</div>
                        )}
                      </div>
                    ) : (
                      <div className="empty-state practice-empty-state">
                        <strong>{TEXT.emptyScriptArtifactTitle}</strong>
                        <p>{TEXT.emptyScriptArtifactHint}</p>
                        <div className="secondary-actions">
                          <button className="primary-button" type="button" onClick={() => void handleArtifact('qa_script')} disabled={artifactLoading !== null}>
                            <MessageSquareText size={16} />
                            {artifactLoading === 'qa_script' ? TEXT.generating : TEXT.generateScriptArtifact}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </section>
            ) : null}

            {activeView === 'practice' ? (
              <section className="page panel">
                <div className="panel-head">
                  <div>
                    <h2>{TEXT.practice}</h2>
                  </div>
                  <ClipboardCheck size={18} />
                </div>
                <section className="support-section practice-layout">
                  <aside className="practice-sidebar">
                    <div className="practice-side-card">
                      <span className="practice-side-label">{TEXT.practice}</span>
                      <p className="practice-side-hint">先看题目，再直接写下你的 Python 代码并提交点评。</p>
                    </div>

                    {exerciseSections.length > 0 ? (
                      <div className="practice-side-card">
                        <span className="practice-side-label">{TEXT.chooseExercise}</span>
                        <div className="practice-queue">
                          {exerciseSections.map((section, index) => {
                            const itemKey = String(index)
                            const submission = exerciseSubmissions[itemKey]
                            return (
                              <button
                                key={section.heading + '-' + index}
                                type="button"
                                className={activePracticeIndex === index ? 'practice-queue-item active' : 'practice-queue-item'}
                                onClick={() => setSelectedPracticeIndex(index)}
                              >
                                <div className="practice-queue-top">
                                  <strong>{'练习 ' + (index + 1)}</strong>
                                  <em>{submission ? '已点评' : '待作答'}</em>
                                </div>
                                <span>{simplifySectionHeading(section.heading, '练习 ' + (index + 1))}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ) : null}
                  </aside>

                  <div className="practice-stage">
                    {practiceArtifact ? (
                      <div className="artifact-card practice-artifact-card">
                        <div className="practice-stage-head">
                          <div className="practice-stage-copy">
                            <h3>{TEXT.summaryArtifact}</h3>
                            <p>先读清题目和要求，再在下方直接写你的 Python 解答。</p>
                            <span className="collaboration-inline-note">练习已根据学习情况和课程资料生成。</span>
                          </div>
                          <div className="secondary-actions artifact-inline-actions">
                            <button className="ghost-button" type="button" onClick={() => void handleArtifact('summary')} disabled={artifactLoading !== null}>
                              <ClipboardCheck size={16} />
                              {artifactLoading === 'summary' ? TEXT.generating : TEXT.regenerateSummaryArtifact}
                            </button>
                          </div>
                        </div>

                        {currentExercise ? (
                          <div className="artifact-sections focused">
                            <article key={currentExercise.heading + '-' + activePracticeIndex}>
                              <strong>{normalizeText(currentExercise.heading, '琛ュ厖鍐呭')}</strong>
                              <ArtifactSectionContent section={currentExercise} sectionIndex={activePracticeIndex} keyPrefix="summary" />
                            </article>
                          </div>
                        ) : (
                          <div className="empty-state compact">{TEXT.noExerciseGenerated}</div>
                        )}
                      </div>
                    ) : (
                      <div className="empty-state practice-empty-state">
                        <strong>{TEXT.emptySummaryArtifactTitle}</strong>
                        <p>{TEXT.emptySummaryArtifactHint}</p>
                        <div className="secondary-actions">
                          <button className="primary-button" type="button" onClick={() => void handleArtifact('summary')} disabled={artifactLoading !== null}>
                            <ClipboardCheck size={16} />
                            {artifactLoading === 'summary' ? TEXT.generating : TEXT.generateSummaryArtifact}
                          </button>
                        </div>
                      </div>
                    )}

                    {practiceArtifact ? (
                      <div className="exercise-answer-panel">
                        <div className="exercise-answer-head">
                          <div>
                            <span>{TEXT.answerPanelTitle}</span>
                            <h3>{currentExercise ? simplifySectionHeading(currentExercise.heading, TEXT.noExerciseGenerated) : TEXT.noExerciseGenerated}</h3>
                          </div>
                          <p>{TEXT.answerPanelHint}</p>
                        </div>
                        <div className="exercise-answer-body">
                          {currentExercise ? (
                            <>
                              <div className="exercise-editor-card">
                                <textarea
                                  className="answer-textarea"
                                  value={currentDraft}
                                  onChange={(event) =>
                                    setExerciseDrafts((current) => ({
                                      ...current,
                                      [selectedExerciseKey]: event.target.value,
                                    }))
                                  }
                                  placeholder={TEXT.answerPlaceholder}
                                  spellCheck={false}
                                />
                                <div className="secondary-actions answer-actions">
                                  <button className="primary-button" type="button" onClick={() => void handleSubmitExercise()} disabled={exerciseReviewLoading}>
                                    <SendHorizontal size={16} />
                                    {exerciseReviewLoading ? TEXT.reviewing : TEXT.submitAnswer}
                                  </button>
                                  {currentSubmission ? (
                                    <span className="inline-meta">
                                      {TEXT.answerUpdatedAt} {formatSessionTime(currentSubmission.updated_at)}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                              {currentReview ? (
                                <div className="review-panel">
                                  <div className="review-summary">
                                    <span>{TEXT.reviewTitle}</span>
                                    <p>{normalizeText(currentReview.summary, '这道题已经给出本次点评。')}</p>
                                    <em>反馈已结合题目要求和你的代码。</em>
                                  </div>
                                  <div className="review-grid">
                                    <section className="review-column">
                                      <strong>{TEXT.strengths}</strong>
                                      <ul>
                                        {(currentReview.strengths ?? []).map((item) => (
                                          <li key={item}>{normalizeText(item, '待补充')}</li>
                                        ))}
                                      </ul>
                                    </section>
                                    <section className="review-column">
                                      <strong>{TEXT.issues}</strong>
                                      <ul>
                                        {(currentReview.issues ?? []).map((item) => (
                                          <li key={item}>{normalizeText(item, '待补充')}</li>
                                        ))}
                                      </ul>
                                    </section>
                                    <section className="review-column">
                                      <strong>{TEXT.nextSteps}</strong>
                                      <ul>
                                        {(currentReview.next_steps ?? []).map((item) => (
                                          <li key={item}>{normalizeText(item, '待补充')}</li>
                                        ))}
                                      </ul>
                                    </section>
                                  </div>
                                </div>
                              ) : (
                                <div className="empty-state compact">{TEXT.emptyReview}</div>
                              )}
                            </>
                          ) : (
                            <div className="empty-state compact">{TEXT.noExerciseGenerated}</div>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </section>
              </section>
            ) : null}

            {activeView === 'path' ? (
              <section className="page panel">
                <div className="panel-head">
                  <div>
                    <h2>{TEXT.path}</h2>
                  </div>
                  <Route size={18} />
                </div>
                {generation ? (
                  <div className="result-stack">
                    <section className="path-progress-panel">
                      <div>
                        <span>跟进进度</span>
                        <strong>{`已掌握 ${completedPathCount} / 总计 ${pathSteps.length}`}</strong>
                        <p>{pathUsesGeneratedContent ? '按“理论资料 -> 典例精讲 -> 自我练习 -> 反馈跟进”的顺序推进。' : '按当前学习方案推进，每一步都可以提交学习反馈。'}</p>
                        <em className="collaboration-inline-note">路径已整合理论资料、典例、练习和反馈。</em>
                      </div>
                      <div className="path-progress-bar" aria-label="学习路径完成进度">
                        <span style={{ width: `${pathCompletionPercent}%` }} />
                      </div>
                    </section>
                    <section className="path-phase-panel" aria-label="学习路径阶段">
                      <div>
                        <span>1</span>
                        <strong>先学理论</strong>
                        <p>{onlineResourcesLoading ? '正在匹配资料' : onlineResources.length > 0 ? `已匹配 ${onlineResources.length} 条资料` : '待匹配资料'}</p>
                      </div>
                      <div>
                        <span>2</span>
                        <strong>再看典例</strong>
                        <p>{scriptSections.length > 0 ? `${scriptSections.length} 个典例` : '待生成典例'}</p>
                      </div>
                      <div>
                        <span>3</span>
                        <strong>最后练习</strong>
                        <p>{exerciseSections.length > 0 ? `${exerciseSections.length} 道练习` : '待生成练习'}</p>
                      </div>
                      <div>
                        <span>4</span>
                        <strong>反馈跟进</strong>
                        <p>{assessedPathCount > 0 ? `已跟进 ${assessedPathCount} 步` : '待提交反馈'}</p>
                      </div>
                    </section>
                    {pathMermaidChart ? (
                      <details className="path-map-panel path-map-details">
                        <summary className="section-title">
                          <Route size={16} />
                          查看路线图
                        </summary>
                        <div className="path-map-toolbar" aria-label="路线图缩放">
                          <button
                            type="button"
                            onClick={() => setPathMapZoom((value) => Math.max(0.6, Number((value - 0.15).toFixed(2))))}
                            disabled={pathMapZoom <= 0.6}
                            aria-label="缩小路线图"
                          >
                            <ZoomOut size={15} />
                          </button>
                          <span>{`${Math.round(pathMapZoom * 100)}%`}</span>
                          <button
                            type="button"
                            onClick={() => setPathMapZoom((value) => Math.min(2.2, Number((value + 0.15).toFixed(2))))}
                            disabled={pathMapZoom >= 2.2}
                            aria-label="放大路线图"
                          >
                            <ZoomIn size={15} />
                          </button>
                          <button type="button" onClick={() => setPathMapZoom(1)} aria-label="重置路线图缩放">
                            <RefreshCw size={14} />
                            重置
                          </button>
                        </div>
                        <div className="path-map-viewport">
                          <div className="path-map-zoom-space" style={{ width: `${pathMapZoom * 100}%`, minHeight: `${pathMapZoom * 520}px` }}>
                            <div className="path-map-zoom-layer" style={{ transform: `scale(${pathMapZoom})` }}>
                              <MermaidDiagram chart={pathMermaidChart} />
                            </div>
                          </div>
                        </div>
                      </details>
                    ) : null}
                    <div className="path-list">
                      {pathSteps.map((step, index) => {
                        const completed = effectivePathProgress[String(index)] === true
                        const assessment = pathAssessments[String(index)]
                        const feedbackDraft = pathFeedbackDrafts[String(index)] ?? assessment?.feedback ?? ''
                        const masteryLabel =
                          assessment?.assessment.mastery === 'good'
                            ? '掌握较好'
                            : assessment?.assessment.mastery === 'needs_help'
                              ? '还需补强'
                              : '部分掌握'
                        const followStatus = assessment
                          ? masteryLabel
                          : feedbackDraft.trim()
                            ? '待评估'
                            : '待跟进'
                        const pathCardClass = [
                          'path-card',
                          completed ? 'completed' : '',
                          assessment ? `mastery-${assessment.assessment.mastery}` : '',
                        ]
                          .filter(Boolean)
                          .join(' ')
                        const theoryResources = getPathTheoryResources(onlineResources, index)
                        const exampleSection = scriptSections[index]
                        const exerciseSection = exerciseSections[index]
                        const exampleTitle = exampleSection ? simplifySectionHeading(exampleSection.heading, `典例 ${index + 1}`) : ''
                        const exerciseTitle = exerciseSection ? simplifySectionHeading(exerciseSection.heading, `练习 ${index + 1}`) : ''
                        return (
                        <article className={pathCardClass} key={`${step.title}-${index}`}>
                          <div className="path-head">
                            <div className="path-title-group">
                              <div className="path-index">{index + 1}</div>
                              <strong>{normalizeText(step.title, '\u5b66\u4e60\u6b65\u9aa4')}</strong>
                            </div>
                            <div className="path-head-meta">
                              <span className="path-status-pill">{followStatus}</span>
                              <div className="path-duration">
                                <Clock size={15} />
                                <span>{normalizeText(step.duration, '\u5efa\u8bae\u65f6\u957f\u5f85\u751f\u6210')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="path-learning-loop">
                            <section className="path-loop-section">
                              <div className="path-loop-head">
                                <span>先学理论</span>
                                <strong>补齐概念和知识点</strong>
                              </div>
                              {theoryResources.length > 0 ? (
                                <div className="path-resource-list">
                                  {theoryResources.slice(0, 2).map((resource) => {
                                    const provider = normalizeText(resource.provider, '学习资料')
                                    const title = normalizeText(resource.title, '外部学习资料')
                                    const summary = normalizeText(resource.summary, '先通过这份资料补齐相关概念。')
                                    const iconUrl = getResourceIconUrl(resource.url)
                                    const matchLabels = (resource.match_labels ?? []).map((label) => normalizeTagLabel(label)).filter(Boolean)
                                    return (
                                      <a className="path-resource-card" href={resource.url} target="_blank" rel="noreferrer" key={`${index}-${resource.id}`}>
                                        <div className="resource-icon resource-site-icon">
                                          {iconUrl ? (
                                            <img
                                              src={iconUrl}
                                              alt=""
                                              loading="lazy"
                                              referrerPolicy="no-referrer"
                                              onError={(event) => {
                                                event.currentTarget.style.display = 'none'
                                              }}
                                            />
                                          ) : (
                                            <Globe size={15} />
                                          )}
                                        </div>
                                        <div>
                                          <span>{`${provider} · ${getResourceKindLabel(resource.kind)}`}</span>
                                          <strong>{title}</strong>
                                          <p>{summary}</p>
                                          {matchLabels.length > 0 ? (
                                            <div className="match-tags compact-tags">
                                              {matchLabels.slice(0, 2).map((label) => (
                                                <span className="match-tag" key={`${resource.id}-${label}`}>{label}</span>
                                              ))}
                                            </div>
                                          ) : null}
                                        </div>
                                      </a>
                                    )
                                  })}
                                </div>
                              ) : (
                                <div className="path-loop-empty">
                                  <p>{onlineResourcesLoading ? '正在按当前薄弱点匹配理论资料。' : '还没有匹配到理论资料，可以先更新外部资料。'}</p>
                                  <button className="path-inline-button" type="button" onClick={() => void handleLoadOnlineResources()} disabled={onlineResourcesLoading}>
                                    <Globe size={15} />
                                    {onlineResourcesLoading ? '匹配中...' : '更新外部资料'}
                                  </button>
                                </div>
                              )}
                            </section>
                            <section className="path-loop-section">
                              <div className="path-loop-head">
                                <span>再看典例</span>
                                <strong>{exampleTitle || '暂未生成典例'}</strong>
                              </div>
                              <p>{exampleTitle ? `先看《${exampleTitle}》的题目拆解、关键代码和易错点。` : '生成典例精讲后，这里会关联对应的讲解。'}</p>
                              {exampleSection ? (
                                <button className="path-inline-button" type="button" onClick={() => {
                                  setSelectedExampleIndex(index)
                                  setActiveView('examples')
                                }}>
                                  <MessageSquareText size={15} />
                                  打开典例
                                </button>
                              ) : null}
                            </section>
                            <section className="path-loop-section">
                              <div className="path-loop-head">
                                <span>最后练习</span>
                                <strong>{exerciseTitle || '暂未生成练习'}</strong>
                              </div>
                              <p>{exerciseTitle ? `完成《${exerciseTitle}》，写代码并提交点评。` : '生成自我练习后，这里会关联对应题目。'}</p>
                              {exerciseSection ? (
                                <button className="path-inline-button" type="button" onClick={() => {
                                  setSelectedPracticeIndex(index)
                                  setActiveView('practice')
                                }}>
                                  <ClipboardCheck size={15} />
                                  去做练习
                                </button>
                              ) : null}
                            </section>
                          </div>
                          <div className="path-outcome-block">
                            <span>完成标准</span>
                            <em>{normalizeText(step.expected_outcome, '\u5b8c\u6210\u540e\u4f60\u4f1a\u66f4\u6e05\u695a\u4e0b\u4e00\u6b65\u600e\u4e48\u5b66\u3002')}</em>
                          </div>
                          <div className="path-assessment-panel">
                            <label>
                              <span>学习反馈</span>
                              <textarea
                                value={feedbackDraft}
                                onChange={(event) =>
                                  setPathFeedbackDrafts((current) => ({
                                    ...current,
                                    [String(index)]: event.target.value,
                                  }))
                                }
                                placeholder="比如：这一步能看懂，但 append 和 extend 还是容易混。也可以写你完成了哪道题、哪里卡住。"
                                rows={3}
                              />
                            </label>
                            <div className="path-card-actions">
                              <button className="path-assess-button" type="button" onClick={() => void handleSubmitPathAssessment(index)} disabled={pathAssessmentLoading !== null}>
                                <Sparkles size={15} />
                                {pathAssessmentLoading === index ? '分析中...' : assessment ? '更新跟进' : '提交跟进'}
                              </button>
                            </div>
                            {assessment ? (
                              <div className={`path-assessment-result ${assessment.assessment.mastery}`}>
                                <div className="path-assessment-head">
                                  <span>{masteryLabel}</span>
                                  <em>{formatSessionTime(assessment.updated_at)}</em>
                                </div>
                                <p>{normalizeText(assessment.assessment.summary, '已根据你的反馈更新这一阶段的学习评估。')}</p>
                                {assessment.assessment.issues.length > 0 ? (
                                  <ul>
                                    {assessment.assessment.issues.map((item) => (
                                      <li key={item}>{normalizeText(item, '待补充')}</li>
                                    ))}
                                  </ul>
                                ) : null}
                                <strong>{normalizeText(assessment.assessment.next_advice, '继续按学习路径进入下一步。')}</strong>
                              </div>
                            ) : null}
                          </div>
                        </article>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">{TEXT.emptyPath}</div>
                )}
              </section>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  )
}

export default App
