import type { ReactNode } from 'react'
import { ClipboardCheck, SendHorizontal } from 'lucide-react'
import type { ArtifactKind, ArtifactSection, ArtifactState, ExerciseSubmissionCollection, ExerciseSubmissionState } from '../types'

type PracticePanelLabels = {
  practice: string
  chooseExercise: string
  summaryArtifact: string
  generating: string
  regenerateSummaryArtifact: string
  generateSummaryArtifact: string
  emptySummaryArtifactTitle: string
  emptySummaryArtifactHint: string
  noExerciseGenerated: string
  answerPanelTitle: string
  answerPanelHint: string
  answerPlaceholder: string
  reviewing: string
  submitAnswer: string
  answerUpdatedAt: string
  reviewTitle: string
  strengths: string
  issues: string
  nextSteps: string
  emptyReview: string
}

type PracticePanelProps = {
  labels: PracticePanelLabels
  practiceArtifact: ArtifactState | null
  exerciseSections: ArtifactSection[]
  currentExercise: ArtifactSection | null
  activePracticeIndex: number
  selectedExerciseKey: string
  currentDraft: string
  currentSubmission: ExerciseSubmissionState | null
  exerciseSubmissions: ExerciseSubmissionCollection
  artifactLoading: ArtifactKind | null
  exerciseReviewLoading: boolean
  normalizeText: (text: string, fallback: string) => string
  simplifySectionHeading: (heading: string, fallback: string) => string
  formatSessionTime: (value: string) => string
  renderArtifactSection: (section: ArtifactSection, sectionIndex: number, keyPrefix: string) => ReactNode
  onSelectPractice: (index: number) => void
  onGeneratePractice: () => void
  onDraftChange: (exerciseKey: string, value: string) => void
  onSubmitExercise: () => void
}

export function PracticePanel({
  labels,
  practiceArtifact,
  exerciseSections,
  currentExercise,
  activePracticeIndex,
  selectedExerciseKey,
  currentDraft,
  currentSubmission,
  exerciseSubmissions,
  artifactLoading,
  exerciseReviewLoading,
  normalizeText,
  simplifySectionHeading,
  formatSessionTime,
  renderArtifactSection,
  onSelectPractice,
  onGeneratePractice,
  onDraftChange,
  onSubmitExercise,
}: PracticePanelProps) {
  const currentReview = currentSubmission?.review ?? null

  return (
    <section className="page panel">
      <div className="panel-head">
        <div>
          <h2>{labels.practice}</h2>
        </div>
        <ClipboardCheck size={18} />
      </div>
      <section className="support-section practice-layout">
        <aside className="practice-sidebar">
          {exerciseSections.length > 0 ? (
            <div className="practice-side-card">
              <span className="practice-side-label">{labels.chooseExercise}</span>
              <div className="practice-queue">
                {exerciseSections.map((section, index) => {
                  const itemKey = String(index)
                  const submission = exerciseSubmissions[itemKey]
                  return (
                    <button
                      key={section.heading + '-' + index}
                      type="button"
                      className={activePracticeIndex === index ? 'practice-queue-item active' : 'practice-queue-item'}
                      onClick={() => onSelectPractice(index)}
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
            <div className="artifact-card practice-artifact-card learning-work-card">
              <div className="practice-stage-head learning-work-head">
                <div className="practice-stage-copy">
                  <h3>{labels.summaryArtifact}</h3>
                  <p>先读清题目和要求，再在下方直接写你的 Python 解答。</p>
                  <span className="collaboration-inline-note">练习已根据学习情况和课程资料生成。</span>
                </div>
                <div className="secondary-actions artifact-inline-actions">
                  <button className="ghost-button" type="button" onClick={onGeneratePractice} disabled={artifactLoading !== null}>
                    <ClipboardCheck size={16} />
                    {artifactLoading === 'summary' ? labels.generating : labels.regenerateSummaryArtifact}
                  </button>
                </div>
              </div>

              {currentExercise ? (
                <div className="artifact-sections focused">
                  <article key={currentExercise.heading + '-' + activePracticeIndex}>
                    <strong>{normalizeText(currentExercise.heading, '练习内容')}</strong>
                    {renderArtifactSection(currentExercise, activePracticeIndex, 'summary')}
                  </article>
                </div>
              ) : (
                <div className="empty-state compact">{labels.noExerciseGenerated}</div>
              )}
            </div>
          ) : (
            <div className="empty-state practice-empty-state learning-work-card">
              <strong>{labels.emptySummaryArtifactTitle}</strong>
              <p>{labels.emptySummaryArtifactHint}</p>
              <div className="secondary-actions">
                <button className="primary-button" type="button" onClick={onGeneratePractice} disabled={artifactLoading !== null}>
                  <ClipboardCheck size={16} />
                  {artifactLoading === 'summary' ? labels.generating : labels.generateSummaryArtifact}
                </button>
              </div>
            </div>
          )}

          {practiceArtifact ? (
            <div className="exercise-answer-panel">
              <div className="exercise-answer-head">
                <div>
                  <span>{labels.answerPanelTitle}</span>
                  <h3>{currentExercise ? simplifySectionHeading(currentExercise.heading, labels.noExerciseGenerated) : labels.noExerciseGenerated}</h3>
                </div>
                <p>{labels.answerPanelHint}</p>
              </div>
              <div className="exercise-answer-body">
                {currentExercise ? (
                  <>
                    <div className="exercise-editor-card">
                      <textarea
                        className="answer-textarea"
                        value={currentDraft}
                        onChange={(event) => onDraftChange(selectedExerciseKey, event.target.value)}
                        placeholder={labels.answerPlaceholder}
                        spellCheck={false}
                      />
                      <div className="secondary-actions answer-actions">
                        <button className="primary-button" type="button" onClick={onSubmitExercise} disabled={exerciseReviewLoading}>
                          <SendHorizontal size={16} />
                          {exerciseReviewLoading ? labels.reviewing : labels.submitAnswer}
                        </button>
                        {currentSubmission ? (
                          <span className="inline-meta">
                            {labels.answerUpdatedAt} {formatSessionTime(currentSubmission.updated_at)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {currentReview ? (
                      <div className="review-panel">
                        <div className="review-summary">
                          <span>{labels.reviewTitle}</span>
                          <p>{normalizeText(currentReview.summary, '这道题已经给出本次点评。')}</p>
                          <em>反馈已结合题目要求和你的代码。</em>
                        </div>
                        <div className="review-grid">
                          <section className="review-column">
                            <strong>{labels.strengths}</strong>
                            <ul>
                              {(currentReview.strengths ?? []).map((item) => (
                                <li key={item}>{normalizeText(item, '待补充')}</li>
                              ))}
                            </ul>
                          </section>
                          <section className="review-column">
                            <strong>{labels.issues}</strong>
                            <ul>
                              {(currentReview.issues ?? []).map((item) => (
                                <li key={item}>{normalizeText(item, '待补充')}</li>
                              ))}
                            </ul>
                          </section>
                          <section className="review-column">
                            <strong>{labels.nextSteps}</strong>
                            <ul>
                              {(currentReview.next_steps ?? []).map((item) => (
                                <li key={item}>{normalizeText(item, '待补充')}</li>
                              ))}
                            </ul>
                          </section>
                        </div>
                      </div>
                    ) : (
                      <div className="empty-state compact">{labels.emptyReview}</div>
                    )}
                  </>
                ) : (
                  <div className="empty-state compact">{labels.noExerciseGenerated}</div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </section>
  )
}
