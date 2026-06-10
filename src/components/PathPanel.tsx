import { ClipboardCheck, Clock, Globe, MessageSquareText, RefreshCw, Route, Sparkles, ZoomIn, ZoomOut } from 'lucide-react'
import { MermaidDiagram } from './LearningMarkdown'
import type { ArtifactSection, GenerationState, OnlineResource, PathAssessmentCollection, PathProgressState, PathStep } from '../types'

type PathPanelLabels = {
  path: string
  emptyPath: string
}

type PathPanelProps = {
  labels: PathPanelLabels
  generation: GenerationState | null
  pathSteps: PathStep[]
  pathUsesGeneratedContent: boolean
  completedPathCount: number
  assessedPathCount: number
  pathCompletionPercent: number
  pathMermaidChart: string
  pathMapZoom: number
  effectivePathProgress: PathProgressState
  pathAssessments: PathAssessmentCollection
  pathFeedbackDrafts: Record<string, string>
  pathAssessmentLoading: number | null
  onlineResources: OnlineResource[]
  onlineResourcesLoading: boolean
  scriptSections: ArtifactSection[]
  exerciseSections: ArtifactSection[]
  normalizeText: (text: string, fallback: string) => string
  normalizeTagLabel: (text: string, fallback?: string) => string
  simplifySectionHeading: (heading: string, fallback: string) => string
  getPathTheoryResources: (resources: OnlineResource[], stepIndex: number) => OnlineResource[]
  getResourceIconUrl: (resourceUrl: string) => string
  getResourceKindLabel: (kind: string) => string
  formatSessionTime: (value: string) => string
  onZoomOut: () => void
  onZoomIn: () => void
  onZoomReset: () => void
  onLoadOnlineResources: () => void
  onOpenExample: (index: number) => void
  onOpenPractice: (index: number) => void
  onFeedbackChange: (stepIndex: number, value: string) => void
  onSubmitAssessment: (stepIndex: number) => void
}

export function PathPanel({
  labels,
  generation,
  pathSteps,
  pathUsesGeneratedContent,
  completedPathCount,
  assessedPathCount,
  pathCompletionPercent,
  pathMermaidChart,
  pathMapZoom,
  effectivePathProgress,
  pathAssessments,
  pathFeedbackDrafts,
  pathAssessmentLoading,
  onlineResources,
  onlineResourcesLoading,
  scriptSections,
  exerciseSections,
  normalizeText,
  normalizeTagLabel,
  simplifySectionHeading,
  getPathTheoryResources,
  getResourceIconUrl,
  getResourceKindLabel,
  formatSessionTime,
  onZoomOut,
  onZoomIn,
  onZoomReset,
  onLoadOnlineResources,
  onOpenExample,
  onOpenPractice,
  onFeedbackChange,
  onSubmitAssessment,
}: PathPanelProps) {
  return (
    <section className="page panel">
      <div className="panel-head">
        <div>
          <h2>{labels.path}</h2>
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
                <button type="button" onClick={onZoomOut} disabled={pathMapZoom <= 0.6} aria-label="缩小路线图">
                  <ZoomOut size={15} />
                </button>
                <span>{`${Math.round(pathMapZoom * 100)}%`}</span>
                <button type="button" onClick={onZoomIn} disabled={pathMapZoom >= 2.2} aria-label="放大路线图">
                  <ZoomIn size={15} />
                </button>
                <button type="button" onClick={onZoomReset} aria-label="重置路线图缩放">
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
              const followStatus = assessment ? masteryLabel : feedbackDraft.trim() ? '待评估' : '待跟进'
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
                      <strong>{normalizeText(step.title, '学习步骤')}</strong>
                    </div>
                    <div className="path-head-meta">
                      <span className="path-status-pill">{followStatus}</span>
                      <div className="path-duration">
                        <Clock size={15} />
                        <span>{normalizeText(step.duration, '建议时长待生成')}</span>
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
                          <button className="path-inline-button" type="button" onClick={onLoadOnlineResources} disabled={onlineResourcesLoading}>
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
                        <button className="path-inline-button" type="button" onClick={() => onOpenExample(index)}>
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
                        <button className="path-inline-button" type="button" onClick={() => onOpenPractice(index)}>
                          <ClipboardCheck size={15} />
                          去做练习
                        </button>
                      ) : null}
                    </section>
                  </div>
                  <div className="path-outcome-block">
                    <span>完成标准</span>
                    <em>{normalizeText(step.expected_outcome, '完成后你会更清楚下一步怎么学。')}</em>
                  </div>
                  <div className="path-assessment-panel">
                    <label>
                      <span>学习反馈</span>
                      <textarea
                        value={feedbackDraft}
                        onChange={(event) => onFeedbackChange(index, event.target.value)}
                        placeholder="比如：这一步能看懂，但 append 和 extend 还是容易混。也可以写你完成了哪道题、哪里卡住。"
                        rows={3}
                      />
                    </label>
                    <div className="path-card-actions">
                      <button className="path-assess-button" type="button" onClick={() => onSubmitAssessment(index)} disabled={pathAssessmentLoading !== null}>
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
        <div className="empty-state">{labels.emptyPath}</div>
      )}
    </section>
  )
}
