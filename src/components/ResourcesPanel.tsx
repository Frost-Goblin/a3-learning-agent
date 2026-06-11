import { BookOpen, Compass, ExternalLink, Globe } from 'lucide-react'
import type { GenerationState, OnlineResource } from '../types'

type ResourcesPanelLabels = {
  resources: string
  resourceFocusTitle: string
  resourceFocusHint: string
  nextFocusFallback: string
  emptyResources: string
  onlineResourcesTitle: string
  onlineResourcesHint: string
  loadingOnlineResources: string
  fetchOnlineResources: string
  emptyOnlineResources: string
  matchedWeakness: string
  openResource: string
}

type ResourcesPanelProps = {
  labels: ResourcesPanelLabels
  generation: GenerationState | null
  weaknessTags: string[]
  onlineResources: OnlineResource[]
  onlineResourcesLoading: boolean
  normalizeText: (text: string, fallback: string) => string
  normalizeTagLabel: (text: string, fallback?: string) => string
  getResourceIconUrl: (resourceUrl: string) => string
  getResourceKindLabel: (kind: string) => string
  onLoadOnlineResources: () => void
}

export function ResourcesPanel({
  labels,
  generation,
  weaknessTags,
  onlineResources,
  onlineResourcesLoading,
  normalizeText,
  normalizeTagLabel,
  getResourceIconUrl,
  getResourceKindLabel,
  onLoadOnlineResources,
}: ResourcesPanelProps) {
  const inferredWeaknessTags = Array.from(
    new Set(
      [
        ...weaknessTags,
        ...onlineResources.flatMap((item) => item.match_labels ?? []),
      ]
        .map((label) => normalizeTagLabel(label))
        .filter(Boolean),
    ),
  )

  const focusTitle =
    inferredWeaknessTags.length > 0
      ? `建议优先补强：${inferredWeaknessTags.slice(0, 4).join('、')}`
      : generation
        ? normalizeText(generation.profile.next_focus ?? '', labels.nextFocusFallback)
        : '完成一轮对话后，我会根据你的薄弱点推荐资料'

  return (
    <section className="page panel">
      <div className="panel-head">
        <div>
          <h2>{labels.resources}</h2>
        </div>
        <BookOpen size={18} />
      </div>

      <div>
        <section className="preview-panel resource-focus-panel">
          <div className="section-title">
            <Compass size={16} />
            {labels.resourceFocusTitle}
          </div>
          <h3>{focusTitle}</h3>
          <p className="preview-reason">{labels.resourceFocusHint}</p>
          <div className="match-tags">
            {inferredWeaknessTags.length > 0 ? (
              inferredWeaknessTags.slice(0, 6).map((tag) => (
                <span className="match-tag critical" key={tag}>
                  {tag}
                </span>
              ))
            ) : (
              <span className="match-tag subtle">{labels.nextFocusFallback}</span>
            )}
          </div>
        </section>

        {!generation ? <div className="empty-state">{labels.emptyResources}</div> : null}

        <section className="support-section">
          <div className="section-title">
            <Globe size={16} />
            {labels.onlineResourcesTitle}
          </div>
          <p className="preview-reason">{labels.onlineResourcesHint}</p>
          <div className="secondary-actions">
            <button className="ghost-button" type="button" onClick={onLoadOnlineResources} disabled={onlineResourcesLoading}>
              <Compass size={16} />
              {onlineResourcesLoading ? labels.loadingOnlineResources : labels.fetchOnlineResources}
            </button>
          </div>

          {onlineResources.length > 0 ? (
            <div className="resource-list">
              {onlineResources.map((item) => {
                const title = normalizeText(item.title, 'Python 学习资料')
                const provider = normalizeText(item.provider, '资料来源')
                const summary = normalizeText(item.recommended_reason || item.summary, '这份资料适合继续补充学习。')
                const matchLabels = (item.match_labels ?? []).map((label) => normalizeTagLabel(label)).filter(Boolean)
                const iconUrl = getResourceIconUrl(item.url)

                return (
                  <a className="resource-card external-resource-card" href={item.url} target="_blank" rel="noreferrer" key={item.id}>
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
                        <span>{`${provider} · ${getResourceKindLabel(item.kind)}`}</span>
                        <strong>{title}</strong>
                      </div>
                    </div>
                    {matchLabels.length > 0 ? (
                      <div className="match-tags" aria-label={labels.matchedWeakness}>
                        {matchLabels.slice(0, 3).map((label) => (
                          <span className="match-tag" key={item.id + '-' + label}>
                            {label}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <p>{summary}</p>
                    <span className="resource-link">
                      {labels.openResource}
                      <ExternalLink size={14} />
                    </span>
                  </a>
                )
              })}
            </div>
          ) : (
            <p className="history-empty">{labels.emptyOnlineResources}</p>
          )}
        </section>
      </div>
    </section>
  )
}
