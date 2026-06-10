import { BookOpen, ClipboardCheck, Compass, PencilLine, Sparkles, Target, TimerReset, UserRound } from 'lucide-react'
import type { CollaborationRecord, GenerationState, ProfileSummary } from '../types'

type ProfilePanelLabels = {
  profile: string
  summaryFallback: string
  nextFocus: string
  nextFocusFallback: string
  emptyProfile: string
}

type ProfilePanelProps = {
  labels: ProfilePanelLabels
  generation: GenerationState | null
  weaknessTags: string[]
  preferredFormatTags: string[]
  collaborationSteps: CollaborationRecord[]
  completedCollaborationCount: number
  normalizeText: (text: string, fallback: string) => string
}

const DIMENSION_LABELS: Record<keyof ProfileSummary['dimensions'], string> = {
  knowledge: '知识基础',
  pace: '学习节奏',
  preference: '偏好方式',
  weakness: '当前难点',
  motivation: '学习动力',
  evaluation: '反馈偏好',
}

const LEVEL_LABELS: Record<string, string> = {
  beginner: '基础阶段',
  intermediate: '提升阶段',
}

export function ProfilePanel({
  labels,
  generation,
  weaknessTags,
  preferredFormatTags,
  collaborationSteps,
  completedCollaborationCount,
  normalizeText,
}: ProfilePanelProps) {
  const overviewCards = generation
    ? [
        {
          key: 'knowledge',
          label: DIMENSION_LABELS.knowledge,
          value: normalizeText(generation.profile.dimensions.knowledge, '待补充'),
          icon: BookOpen,
        },
        {
          key: 'pace',
          label: DIMENSION_LABELS.pace,
          value: normalizeText(generation.profile.dimensions.pace, '待补充'),
          icon: TimerReset,
        },
        {
          key: 'preference',
          label: DIMENSION_LABELS.preference,
          value: normalizeText(generation.profile.dimensions.preference, '待补充'),
          icon: PencilLine,
        },
      ]
    : []

  const insightCards = generation
    ? [
        {
          key: 'weakness',
          label: DIMENSION_LABELS.weakness,
          value: normalizeText(generation.profile.dimensions.weakness, '待补充'),
          icon: Target,
          tone: 'danger',
        },
        {
          key: 'motivation',
          label: DIMENSION_LABELS.motivation,
          value: normalizeText(generation.profile.dimensions.motivation, '待补充'),
          icon: Sparkles,
          tone: 'neutral',
        },
        {
          key: 'evaluation',
          label: DIMENSION_LABELS.evaluation,
          value: normalizeText(generation.profile.dimensions.evaluation, '待补充'),
          icon: Compass,
          tone: 'neutral',
        },
      ]
    : []

  return (
    <section className="page panel">
      <div className="panel-head">
        <div>
          <h2>{labels.profile}</h2>
        </div>
        <UserRound size={18} />
      </div>
      {generation ? (
        <div className="result-stack">
          <section className="profile-hero">
            <div className="profile-hero-copy">
              <span className="profile-hero-eyebrow">{labels.profile}</span>
              <p className="summary-text profile-hero-summary">
                {normalizeText(generation.profile.summary, labels.summaryFallback)}
              </p>
              <div className="profile-hero-meta">
                <span className="profile-meta-pill">
                  {LEVEL_LABELS[generation.profile.level_tag ?? ''] ?? '当前阶段'}
                </span>
                <span className="profile-meta-pill">
                  {'信息完整度 ' + (generation.profile.confidence ?? 0) + '%'}
                </span>
              </div>
            </div>
            <div className="profile-focus-panel">
              <span className="profile-focus-label">{labels.nextFocus}</span>
              <strong>{normalizeText(generation.profile.next_focus ?? '', labels.nextFocusFallback)}</strong>
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
            {overviewCards.map((item) => {
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
            {insightCards.map((item) => {
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
        <div className="empty-state">{labels.emptyProfile}</div>
      )}
    </section>
  )
}
