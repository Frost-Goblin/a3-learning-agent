import type { ReactNode } from 'react'
import { MessageSquareText } from 'lucide-react'
import type { ArtifactKind, ArtifactSection, ArtifactState } from '../types'

type ExamplesPanelLabels = {
  scriptArtifact: string
  generating: string
  regenerateScriptArtifact: string
  generateScriptArtifact: string
  emptyScriptArtifactTitle: string
  emptyScriptArtifactHint: string
}

type ExamplesPanelProps = {
  labels: ExamplesPanelLabels
  exampleArtifact: ArtifactState | null
  scriptSections: ArtifactSection[]
  currentExample: ArtifactSection | null
  activeExampleIndex: number
  artifactLoading: ArtifactKind | null
  normalizeText: (text: string, fallback: string) => string
  simplifySectionHeading: (heading: string, fallback: string) => string
  renderArtifactSection: (section: ArtifactSection, sectionIndex: number, keyPrefix: string) => ReactNode
  onSelectExample: (index: number) => void
  onGenerateExample: () => void
}

export function ExamplesPanel({
  labels,
  exampleArtifact,
  scriptSections,
  currentExample,
  activeExampleIndex,
  artifactLoading,
  normalizeText,
  simplifySectionHeading,
  renderArtifactSection,
  onSelectExample,
  onGenerateExample,
}: ExamplesPanelProps) {
  return (
    <section className="page panel">
      <div className="panel-head">
        <div>
          <h2>{labels.scriptArtifact}</h2>
        </div>
        <MessageSquareText size={18} />
      </div>
      <section className="support-section practice-layout">
        <aside className="practice-sidebar">
          {scriptSections.length > 0 ? (
            <div className="practice-side-card">
              <span className="practice-side-label">{labels.scriptArtifact}</span>
              <div className="practice-queue">
                {scriptSections.map((section, index) => (
                  <button
                    key={section.heading + '-' + index}
                    type="button"
                    className={activeExampleIndex === index ? 'practice-queue-item active' : 'practice-queue-item'}
                    onClick={() => onSelectExample(index)}
                  >
                    <div className="practice-queue-top">
                      <strong>{'典例 ' + (index + 1)}</strong>
                      <em>精讲</em>
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
            <div className="artifact-card practice-artifact-card learning-work-card">
              <div className="practice-stage-head learning-work-head">
                <div className="practice-stage-copy">
                  <h3>{labels.scriptArtifact}</h3>
                  <p>{normalizeText(exampleArtifact.summary, '这里会展示完整示例、解题思路和代码讲解。')}</p>
                  <span className="collaboration-inline-note">内容已根据学习情况和课程资料生成。</span>
                </div>
                <div className="secondary-actions artifact-inline-actions">
                  <button className="ghost-button" type="button" onClick={onGenerateExample} disabled={artifactLoading !== null}>
                    <MessageSquareText size={16} />
                    {artifactLoading === 'qa_script' ? labels.generating : labels.regenerateScriptArtifact}
                  </button>
                </div>
              </div>

              {currentExample ? (
                <div className="artifact-sections focused">
                  <article key={currentExample.heading + '-' + activeExampleIndex}>
                    <strong>{'典例 ' + (activeExampleIndex + 1)}</strong>
                    {renderArtifactSection(currentExample, activeExampleIndex, 'qa_script')}
                  </article>
                </div>
              ) : (
                <div className="empty-state compact">{labels.emptyScriptArtifactHint}</div>
              )}
            </div>
          ) : (
            <div className="empty-state practice-empty-state learning-work-card">
              <strong>{labels.emptyScriptArtifactTitle}</strong>
              <p>{labels.emptyScriptArtifactHint}</p>
              <div className="secondary-actions">
                <button className="primary-button" type="button" onClick={onGenerateExample} disabled={artifactLoading !== null}>
                  <MessageSquareText size={16} />
                  {artifactLoading === 'qa_script' ? labels.generating : labels.generateScriptArtifact}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </section>
  )
}
