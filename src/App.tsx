import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import {
  Moon,
  RefreshCw,
  Settings as SettingsIcon,
  Sparkles,
  Sun,
} from 'lucide-react'
import './App.css'
import { ChatPanel } from './components/ChatPanel'
import { ExamplesPanel } from './components/ExamplesPanel'
import { LearningMarkdown, parseArtifactSegments } from './components/LearningMarkdown'
import { PathPanel } from './components/PathPanel'
import { PracticePanel } from './components/PracticePanel'
import { ProfilePanel } from './components/ProfilePanel'
import { ResourcesPanel } from './components/ResourcesPanel'
import { SessionSidebar } from './components/SessionSidebar'
import { SettingsDialog } from './components/SettingsDialog'
import type {
  AppSettingsDraft,
  AppSettingsState,
  AppStage,
  AppView,
  ArtifactCollection,
  ArtifactKind,
  ArtifactSection,
  ArtifactState,
  ChatMessage,
  ChatMessagePayload,
  ChatStreamEvent,
  CollaborationRecord,
  Course,
  DisplayMessage,
  ExerciseSubmissionCollection,
  ExerciseSubmissionState,
  GenerationState,
  OnlineResource,
  PathAssessmentCollection,
  PathAssessmentState,
  PathProgressState,
  PathStep,
  ProviderOption,
  RunRecord,
  SessionDetail,
  SessionSummary,
} from './types'

const LAST_SESSION_KEY = 'a3-learning-agent:last-session'
const THEME_MODE_KEY = 'a3-learning-agent:theme-mode'

const TEXT = {
  heading: 'AI·Python\u5b66\u4e60\u52a9\u624b',
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
  regeneratePlan: '\u91cd\u65b0\u751f\u6210\u5b66\u4e60\u65b9\u6848',
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

const VIEW_LABELS: Record<AppView, string> = {
  chat: TEXT.chat,
  profile: TEXT.profile,
  resources: TEXT.resources,
  examples: TEXT.scriptArtifact,
  practice: TEXT.practice,
  path: TEXT.path,
}
const VIEW_ORDER = Object.keys(VIEW_LABELS) as AppView[]

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

function removePlanActionText(message: string) {
  const blockedKeywords = ['生成学习方案', '学习方案', '学习计划', '点击按钮', '点击下方', '点击下面', '开始生成']
  const sentences = message.trim().split(/(?<=[。！？!?])/)
  const cleaned = sentences.filter((sentence) => sentence.trim() && !blockedKeywords.some((keyword) => sentence.includes(keyword))).join('').trim()
  return cleaned || (blockedKeywords.some((keyword) => message.includes(keyword)) ? '我先按你说的困难点讲一下，再继续问你哪里卡住。' : message)
}

function normalizeAssistantMessage(message: string, index: number) {
  const cleaned = removePlanActionText(message)
  if (!looksGarbled(cleaned)) {
    return cleaned
  }
  if (index === 0) {
    return '\u5148\u548c\u6211\u8bf4\u8bf4\u4f60\u5b66 Python \u662f\u4e3a\u4e86\u4ec0\u4e48\uff0c\u5f53\u524d\u6700\u5361\u7684\u662f\u54ea\u4e00\u5757\uff1f'
  }
  return '\u6211\u7ee7\u7eed\u542c\u4f60\u8865\u5145\u3002\u4e5f\u53ef\u4ee5\u76f4\u63a5\u8bf4\u4f60\u60f3\u8ba9\u6211\u751f\u6210\u4ec0\u4e48\u5185\u5bb9\u3002'
}

function normalizeMessages(messages: ChatMessage[]) {
  return messages.map((message, index) => {
    if (message.role === 'assistant') {
      const content = normalizeAssistantMessage(message.content, index)
      return {
        ...message,
        content,
        suggested_actions: [],
      }
    }
    return {
      ...message,
      content: normalizeText(message.content, ''),
      suggested_actions: [],
    }
  })
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

async function readChatStream(response: Response, onDelta: (text: string) => void): Promise<ChatMessagePayload> {
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('stream unsupported')
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let donePayload: ChatMessagePayload | null = null

  const handleLine = (line: string) => {
    const trimmed = line.trim()
    if (!trimmed) {
      return
    }
    const event = JSON.parse(trimmed) as ChatStreamEvent
    if (event.type === 'delta' && event.text) {
      onDelta(event.text)
    }
    if (event.type === 'done' && event.payload) {
      donePayload = event.payload
    }
    if (event.type === 'error') {
      throw new Error(normalizeText(event.detail ?? '', TEXT.sendFailed))
    }
  }

  while (true) {
    const { value, done } = await reader.read()
    if (done) {
      break
    }
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    lines.forEach(handleLine)
  }

  buffer += decoder.decode()
  handleLine(buffer)
  if (!donePayload) {
    throw new Error(TEXT.sendFailed)
  }
  return donePayload
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
  userTurnCount: number,
) {
  if (hasGeneration) {
    return {
      label: '\u5df2\u751f\u6210\u5b66\u4e60\u65b9\u6848',
      description: '\u53ef\u4ee5\u67e5\u770b\u5b66\u4e60\u60c5\u51b5\u3001\u63a8\u8350\u8d44\u6599\u548c\u5b66\u4e60\u8def\u5f84\uff0c\u4e5f\u53ef\u4ee5\u91cd\u65b0\u751f\u6210\u3002',
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
      label: '\u53ef\u4ee5\u751f\u6210\u5b66\u4e60\u65b9\u6848',
      description: '\u5df2\u7ecf\u6709\u8db3\u591f\u7684\u5bf9\u8bdd\u4fe1\u606f\uff0c\u53ef\u4ee5\u6574\u7406\u6210\u4e00\u7248\u4e2a\u4eba\u5b66\u4e60\u65b9\u6848\u3002',
      progress: 100,
    }
  }
  if (userTurnCount >= 3 || profileCompletion >= 55) {
    return {
      label: '\u6b63\u5728\u6574\u7406\u4f60\u7684\u60c5\u51b5',
      description: '\u5df2\u7ecf\u4e86\u89e3\u5230\u4e00\u90e8\u5206\u76ee\u6807\u548c\u5361\u70b9\uff0c\u518d\u8865\u5145\u65f6\u95f4\u5b89\u6392\u6216\u60f3\u8fbe\u5230\u7684\u7a0b\u5ea6\u4f1a\u66f4\u51c6\u3002',
      progress: Math.max(58, Math.min(88, profileCompletion || userTurnCount * 18)),
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
    .replace(/^(练习|典例|典例精讲)\s*\d+\s*[：:]\s*/, '')
    .replace(/^(练习|典例|典例精讲)\s*/, '')
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
  const [darkMode, setDarkMode] = useState(() => window.localStorage.getItem(THEME_MODE_KEY) === 'dark')

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

  useEffect(() => {
    const nextTheme = darkMode ? 'dark' : 'light'
    document.documentElement.dataset.theme = nextTheme
    window.localStorage.setItem(THEME_MODE_KEY, nextTheme)
  }, [darkMode])

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
  const userTurnCount = messages.filter((message) => message.role === 'user').length
  const conversationStatus = getConversationStatusCopy(stage, readyToGenerate, Boolean(generation), profileCompletion, userTurnCount)
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
  const lastDisplayMessageContent = displayMessages.at(-1)?.content ?? ''
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
  }, [activeView, displayMessages.length, lastDisplayMessageContent, pendingMessage])
  const weaknessTags = (generation?.profile.weakness_tags ?? [])
    .map((tag) => normalizeTagLabel(tag))
    .filter(Boolean)
  const preferredFormatTags = (generation?.profile.preferred_format_tags ?? [])
    .map((tag) => normalizeTagLabel(tag))
    .filter(Boolean)
  const chatProviderOptions =
    appSettings?.chat_provider_options && appSettings.chat_provider_options.length > 0
      ? appSettings.chat_provider_options
      : DEFAULT_CHAT_PROVIDER_OPTIONS
  const embeddingProviderOptions =
    appSettings?.embedding_provider_options && appSettings.embedding_provider_options.length > 0
      ? appSettings.embedding_provider_options
      : DEFAULT_EMBEDDING_PROVIDER_OPTIONS

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
    const previousMessages = messages
    let receivedStreamDelta = false
    const requestBody = JSON.stringify({
      session_id: requestSessionId,
      message,
    })

    const applyChatPayload = (payload: ChatMessagePayload) => {
      if (!isActiveSession(requestSessionId) || (payload.session_id && payload.session_id !== requestSessionId)) {
        return
      }
      setMessages(normalizeMessages(Array.isArray(payload.messages) ? payload.messages : []))
      setProfileCompletion(payload.profile_completion ?? 0)
      setReadyToGenerate(payload.ready_to_generate === true)
      setStage(hadGeneration ? 'refining' : payload.ready_to_generate ? 'ready_to_generate' : 'chatting')
      setBackendNotice(payload.ready_to_generate ? TEXT.readyNotice : TEXT.refineNotice)
      void loadSessionSummaries()
    }

    const showSendError = (messageText: string) => {
      const errorText = normalizeText(messageText, TEXT.sendFailed)
      setMessages((current) => {
        const next = [...current]
        for (let index = next.length - 1; index >= 0; index -= 1) {
          if (next[index].role === 'assistant') {
            next[index] = { ...next[index], content: errorText }
            return next
          }
        }
        return [...next, { role: 'assistant', content: errorText }]
      })
      setBackendNotice(errorText)
    }

    const sendFallbackMessage = async () => {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      })

      if (!isActiveSession(requestSessionId)) {
        return
      }
      if (!response.ok) {
        throw new Error(await readErrorDetail(response, TEXT.sendFailed))
      }

      const payload = (await response.json()) as ChatMessagePayload
      applyChatPayload(payload)
    }

    setDraft('')
    setMessageLoading(true)
    setPendingMessage('')
    setMessages([...previousMessages, { role: 'user', content: message }, { role: 'assistant', content: TEXT.thinking }])
    if (hadGeneration) {
      setStage('refining')
    }

    try {
      const response = await fetch('/api/chat/message/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      })

      if (!isActiveSession(requestSessionId)) {
        return
      }
      if (!response.ok || !response.body) {
        await sendFallbackMessage()
        return
      }

      const payload = await readChatStream(response, (text) => {
        receivedStreamDelta = true
        if (!isActiveSession(requestSessionId)) {
          return
        }
        setMessages((current) => {
          const next = [...current]
          for (let index = next.length - 1; index >= 0; index -= 1) {
            if (next[index].role === 'assistant') {
              const nextContent = next[index].content === TEXT.thinking ? text : next[index].content + text
              next[index] = {
                ...next[index],
                content: removePlanActionText(nextContent),
              }
              break
            }
          }
          return next
        })
      })
      applyChatPayload(payload)
    } catch (error) {
      if (isActiveSession(requestSessionId)) {
        if (!receivedStreamDelta) {
          try {
            await sendFallbackMessage()
          } catch (fallbackError) {
            showSendError(fallbackError instanceof Error ? fallbackError.message : error instanceof Error ? error.message : TEXT.sendFailed)
          }
        } else {
          setBackendNotice(error instanceof Error ? error.message : TEXT.sendFailed)
        }
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

  return (
    <div className="app-shell">
      <div className="sr-only" aria-live="polite">
        {backendNotice}
      </div>
      <header className="topbar">
        <div className="topbar-intro">
          <h1 className="topbar-title" aria-label={TEXT.heading}>
            <span className="topbar-title-badge">AI·Python</span>
            <span className="topbar-title-main">{'\u5b66\u4e60\u52a9\u624b'}</span>
          </h1>
        </div>
      </header>

      {settingsOpen ? (
        <SettingsDialog
          appSettings={appSettings}
          settingsDraft={settingsDraft}
          setSettingsDraft={setSettingsDraft}
          chatProviderOptions={chatProviderOptions}
          embeddingProviderOptions={embeddingProviderOptions}
          settingsSaving={settingsSaving}
          onClose={() => setSettingsOpen(false)}
          onSave={() => void handleSaveSettings()}
        />
      ) : null}

      <main className="workspace-shell">
        <SessionSidebar
          sessions={sessionSummaries}
          activeSessionId={sessionId}
          labels={{
            recentChats: TEXT.recentChats,
            recentChatsHint: TEXT.recentChatsHint,
            noHistory: TEXT.noHistory,
            rename: TEXT.rename,
            delete: TEXT.delete,
            records: TEXT.records,
            planReady: TEXT.planReady,
            continueChat: TEXT.continueChat,
          }}
          getTitle={getSessionTitle}
          getPreview={getSessionPreview}
          formatTime={formatSessionTime}
          onRestore={handleRestoreSession}
          onRename={(summary, event) => void handleRenameSession(summary, event)}
          onDelete={(summary, event) => void handleDeleteSession(summary, event)}
        />

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
              <div className="plan-reminder-card">
                <span>{generation ? '学习方案已生成' : readyToGenerate ? '学习方案已就绪' : '生成学习方案'}</span>
                <p>
                  {generation
                    ? '可根据新的学习目标、薄弱点或时间安排重新制定方案。'
                    : readyToGenerate
                      ? '当前信息已可用于制定个人学习方案。'
                      : '将根据当前对话内容整理学习情况、推荐资料与学习路径。'}
                </p>
                <button className="primary-button" type="button" onClick={() => void handleGenerate()} disabled={!llmConfigured || !sessionId || generationLoading}>
                  <Sparkles size={15} />
                  {generationLoading ? TEXT.generating : generation ? TEXT.regeneratePlan : TEXT.generatePlan}
                </button>
              </div>
            </div>
          </section>

          <nav className="view-tabs" aria-label="\u9875\u9762\u5207\u6362" style={{ '--active-tab-index': VIEW_ORDER.indexOf(activeView) } as CSSProperties}>
            {VIEW_ORDER.map((view) => (
              <button key={view} type="button" className={activeView === view ? 'view-tab active' : 'view-tab'} onClick={() => setActiveView(view)}>
                {VIEW_LABELS[view]}
              </button>
            ))}
          </nav>

          <div className="workspace-actions">
            <button className="ghost-button theme-toggle-button" type="button" onClick={() => setDarkMode((value) => !value)} aria-label={darkMode ? '切换为亮色模式' : '切换为暗色模式'} title={darkMode ? '亮色模式' : '暗色模式'}>
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
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
              <ChatPanel
                labels={{
                  chat: TEXT.chat,
                  assistant: TEXT.assistant,
                  you: TEXT.you,
                  preparing: TEXT.preparing,
                  placeholder: TEXT.placeholder,
                  thinking: TEXT.thinking,
                  send: TEXT.send,
                }}
                stageLabel={STAGE_LABELS[stage]}
                messages={displayMessages}
                draft={draft}
                dialogScrollerRef={dialogScrollerRef}
                sessionId={sessionId}
                sessionLoading={sessionLoading}
                messageLoading={messageLoading}
                setDraft={setDraft}
                onSendMessage={() => void handleSendMessage()}
              />
            ) : null}

            {activeView === 'profile' ? (
              <ProfilePanel
                labels={{
                  profile: TEXT.profile,
                  summaryFallback: TEXT.summaryFallback,
                  nextFocus: TEXT.nextFocus,
                  nextFocusFallback: TEXT.nextFocusFallback,
                  emptyProfile: TEXT.emptyProfile,
                }}
                generation={generation}
                weaknessTags={weaknessTags}
                preferredFormatTags={preferredFormatTags}
                collaborationSteps={collaborationSteps}
                completedCollaborationCount={completedCollaborationCount}
                normalizeText={normalizeText}
              />
            ) : null}

            {activeView === 'resources' ? (
              <ResourcesPanel
                labels={{
                  resources: TEXT.resources,
                  resourceFocusTitle: TEXT.resourceFocusTitle,
                  resourceFocusHint: TEXT.resourceFocusHint,
                  nextFocusFallback: TEXT.nextFocusFallback,
                  emptyResources: TEXT.emptyResources,
                  onlineResourcesTitle: TEXT.onlineResourcesTitle,
                  onlineResourcesHint: TEXT.onlineResourcesHint,
                  loadingOnlineResources: TEXT.loadingOnlineResources,
                  fetchOnlineResources: TEXT.fetchOnlineResources,
                  emptyOnlineResources: TEXT.emptyOnlineResources,
                  matchedWeakness: TEXT.matchedWeakness,
                  openResource: TEXT.openResource,
                }}
                generation={generation}
                weaknessTags={weaknessTags}
                onlineResources={onlineResources}
                onlineResourcesLoading={onlineResourcesLoading}
                normalizeText={normalizeText}
                normalizeTagLabel={normalizeTagLabel}
                getResourceIconUrl={getResourceIconUrl}
                getResourceKindLabel={getResourceKindLabel}
                onLoadOnlineResources={() => void handleLoadOnlineResources()}
              />
            ) : null}

            {activeView === 'examples' ? (
              <ExamplesPanel
                labels={{
                  scriptArtifact: TEXT.scriptArtifact,
                  generating: TEXT.generating,
                  regenerateScriptArtifact: TEXT.regenerateScriptArtifact,
                  generateScriptArtifact: TEXT.generateScriptArtifact,
                  emptyScriptArtifactTitle: TEXT.emptyScriptArtifactTitle,
                  emptyScriptArtifactHint: TEXT.emptyScriptArtifactHint,
                }}
                exampleArtifact={exampleArtifact}
                scriptSections={scriptSections}
                currentExample={currentExample}
                activeExampleIndex={activeExampleIndex}
                artifactLoading={artifactLoading}
                normalizeText={normalizeText}
                simplifySectionHeading={simplifySectionHeading}
                renderArtifactSection={(section, sectionIndex, keyPrefix) => (
                  <ArtifactSectionContent section={section} sectionIndex={sectionIndex} keyPrefix={keyPrefix} />
                )}
                onSelectExample={setSelectedExampleIndex}
                onGenerateExample={() => void handleArtifact('qa_script')}
              />
            ) : null}

            {activeView === 'practice' ? (
              <PracticePanel
                labels={{
                  practice: TEXT.practice,
                  chooseExercise: TEXT.chooseExercise,
                  summaryArtifact: TEXT.summaryArtifact,
                  generating: TEXT.generating,
                  regenerateSummaryArtifact: TEXT.regenerateSummaryArtifact,
                  generateSummaryArtifact: TEXT.generateSummaryArtifact,
                  emptySummaryArtifactTitle: TEXT.emptySummaryArtifactTitle,
                  emptySummaryArtifactHint: TEXT.emptySummaryArtifactHint,
                  noExerciseGenerated: TEXT.noExerciseGenerated,
                  answerPanelTitle: TEXT.answerPanelTitle,
                  answerPanelHint: TEXT.answerPanelHint,
                  answerPlaceholder: TEXT.answerPlaceholder,
                  reviewing: TEXT.reviewing,
                  submitAnswer: TEXT.submitAnswer,
                  answerUpdatedAt: TEXT.answerUpdatedAt,
                  reviewTitle: TEXT.reviewTitle,
                  strengths: TEXT.strengths,
                  issues: TEXT.issues,
                  nextSteps: TEXT.nextSteps,
                  emptyReview: TEXT.emptyReview,
                }}
                practiceArtifact={practiceArtifact}
                exerciseSections={exerciseSections}
                currentExercise={currentExercise}
                activePracticeIndex={activePracticeIndex}
                selectedExerciseKey={selectedExerciseKey}
                currentDraft={currentDraft}
                currentSubmission={currentSubmission}
                exerciseSubmissions={exerciseSubmissions}
                artifactLoading={artifactLoading}
                exerciseReviewLoading={exerciseReviewLoading}
                normalizeText={normalizeText}
                simplifySectionHeading={simplifySectionHeading}
                formatSessionTime={formatSessionTime}
                renderArtifactSection={(section, sectionIndex, keyPrefix) => (
                  <ArtifactSectionContent section={section} sectionIndex={sectionIndex} keyPrefix={keyPrefix} />
                )}
                onSelectPractice={setSelectedPracticeIndex}
                onGeneratePractice={() => void handleArtifact('summary')}
                onDraftChange={(exerciseKey, value) =>
                  setExerciseDrafts((current) => ({
                    ...current,
                    [exerciseKey]: value,
                  }))
                }
                onSubmitExercise={() => void handleSubmitExercise()}
              />
            ) : null}

            {activeView === 'path' ? (
              <PathPanel
                labels={{ path: TEXT.path, emptyPath: TEXT.emptyPath }}
                generation={generation}
                pathSteps={pathSteps}
                pathUsesGeneratedContent={pathUsesGeneratedContent}
                completedPathCount={completedPathCount}
                assessedPathCount={assessedPathCount}
                pathCompletionPercent={pathCompletionPercent}
                pathMermaidChart={pathMermaidChart}
                pathMapZoom={pathMapZoom}
                effectivePathProgress={effectivePathProgress}
                pathAssessments={pathAssessments}
                pathFeedbackDrafts={pathFeedbackDrafts}
                pathAssessmentLoading={pathAssessmentLoading}
                onlineResources={onlineResources}
                onlineResourcesLoading={onlineResourcesLoading}
                scriptSections={scriptSections}
                exerciseSections={exerciseSections}
                normalizeText={normalizeText}
                normalizeTagLabel={normalizeTagLabel}
                simplifySectionHeading={simplifySectionHeading}
                getPathTheoryResources={getPathTheoryResources}
                getResourceIconUrl={getResourceIconUrl}
                getResourceKindLabel={getResourceKindLabel}
                formatSessionTime={formatSessionTime}
                onZoomOut={() => setPathMapZoom((value) => Math.max(0.6, Number((value - 0.15).toFixed(2))))}
                onZoomIn={() => setPathMapZoom((value) => Math.min(2.2, Number((value + 0.15).toFixed(2))))}
                onZoomReset={() => setPathMapZoom(1)}
                onLoadOnlineResources={() => void handleLoadOnlineResources()}
                onOpenExample={(index) => {
                  setSelectedExampleIndex(index)
                  setActiveView('examples')
                }}
                onOpenPractice={(index) => {
                  setSelectedPracticeIndex(index)
                  setActiveView('practice')
                }}
                onFeedbackChange={(stepIndex, value) => {
                  setPathFeedbackDrafts((current) => ({
                    ...current,
                    [String(stepIndex)]: value,
                  }))
                }}
                onSubmitAssessment={(index) => void handleSubmitPathAssessment(index)}
              />
            ) : null}
          </section>
        </div>
      </main>
    </div>
  )
}

export default App
