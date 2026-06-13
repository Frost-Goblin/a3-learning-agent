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
  const primaryWeaknessTags = inferredWeaknessTags.slice(0, 6)
  const focusTitle =
    primaryWeaknessTags.length > 0
      ? primaryWeaknessTags.slice(0, 4).join('、')
      : generation
        ? normalizeText(generation.profile.next_focus ?? '', labels.nextFocusFallback)
        : '完成对话后，将根据你的薄弱点推荐资料'

  return (
    <section className="page panel">
      <div className="panel-head">
        <div>
          <h2>{labels.resources}</h2>
        </div>
        <BookOpen size={18} />
      </div>

      <div className="resource-page">
        <section className="resource-dashboard">
          <div className="resource-dashboard-copy">
            <span>{labels.resourceFocusTitle}</span>
            <h3>{focusTitle}</h3>
            <p>{labels.resourceFocusHint}</p>
          </div>
          <div className="resource-dashboard-tags" aria-label={labels.matchedWeakness}>
            {primaryWeaknessTags.length > 0 ? (
              primaryWeaknessTags.map((tag) => (
                <span className="match-tag critical" key={tag}>
                  {tag}
                </span>
              ))
            ) : (
              <span className="match-tag subtle">{labels.nextFocusFallback}</span>
            )}
          </div>
        </section>

        {!generation ? <div className="empty-state resource-empty-state">{labels.emptyResources}</div> : null}

        <section className="resource-library">
          <div className="resource-library-head">
            <div>
              <div className="section-title">
                <Globe size={16} />
                {labels.onlineResourcesTitle}
              </div>
              <p>{labels.onlineResourcesHint}</p>
            </div>
            <button className="ghost-button" type="button" onClick={onLoadOnlineResources} disabled={onlineResourcesLoading}>
              <Compass size={16} />
              {onlineResourcesLoading ? labels.loadingOnlineResources : labels.fetchOnlineResources}
            </button>
          </div>

          {onlineResources.length > 0 ? (
            <div className="resource-list resource-library-list">
              {onlineResources.map((item) => {
                const title = normalizeText(item.title, 'Python 学习资料')
                const provider = normalizeText(item.provider, '资料来源')
                const summary = normalizeText(item.recommended_reason || item.summary, '适合继续补充当前知识点。')
                const matchLabels = (item.match_labels ?? []).map((label) => normalizeTagLabel(label)).filter(Boolean)
                const iconUrl = getResourceIconUrl(item.url)

                return (
                  <a className="resource-card external-resource-card redesigned-resource-card" href={item.url} target="_blank" rel="noreferrer" key={item.id}>
                    <div className="resource-card-main">
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
                      <div className="resource-card-copy">
                        <span>{`${provider} · ${getResourceKindLabel(item.kind)}`}</span>
                        <strong>{title}</strong>
                        <p>{summary}</p>
                        {matchLabels.length > 0 ? (
                          <div className="match-tags compact-tags" aria-label={labels.matchedWeakness}>
                            {matchLabels.slice(0, 3).map((label) => (
                              <span className="match-tag" key={item.id + '-' + label}>
                                {label}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
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
