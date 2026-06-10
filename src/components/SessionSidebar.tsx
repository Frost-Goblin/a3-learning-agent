import type { MouseEvent } from 'react'
import { History, PencilLine, Trash2 } from 'lucide-react'
import type { SessionSummary } from '../types'

type SessionSidebarLabels = {
  recentChats: string
  recentChatsHint: string
  noHistory: string
  rename: string
  delete: string
  records: string
  planReady: string
  continueChat: string
}

type SessionSidebarProps = {
  sessions: SessionSummary[]
  activeSessionId: string
  labels: SessionSidebarLabels
  getTitle: (summary: SessionSummary) => string
  getPreview: (summary: SessionSummary) => string
  formatTime: (value: string) => string
  onRestore: (summary: SessionSummary) => void
  onRename: (summary: SessionSummary, event: MouseEvent<HTMLButtonElement>) => void
  onDelete: (summary: SessionSummary, event: MouseEvent<HTMLButtonElement>) => void
}

export function SessionSidebar({
  sessions,
  activeSessionId,
  labels,
  getTitle,
  getPreview,
  formatTime,
  onRestore,
  onRename,
  onDelete,
}: SessionSidebarProps) {
  return (
    <aside className="history-rail panel">
      <div className="panel-head">
        <div>
          <h2>{labels.recentChats}</h2>
          <p>{labels.recentChatsHint}</p>
        </div>
        <History size={18} />
      </div>

      <div className="session-list">
        {sessions.length > 0 ? (
          sessions.map((item) => (
            <article
              key={item.session_id}
              className={item.session_id === activeSessionId ? 'session-card active' : 'session-card'}
              onClick={() => onRestore(item)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onRestore(item)
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="session-card-top">
                <strong>{getTitle(item)}</strong>
                <span>{formatTime(item.updated_at)}</span>
              </div>
              <p>{getPreview(item)}</p>
              <div className="session-actions">
                <button
                  type="button"
                  className="session-action-button"
                  onClick={(event) => onRename(item, event)}
                  aria-label={labels.rename}
                >
                  <PencilLine size={14} />
                </button>
                <button
                  type="button"
                  className="session-action-button danger"
                  onClick={(event) => onDelete(item, event)}
                  aria-label={labels.delete}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="session-meta">
                <em>
                  {item.message_count} {labels.records}
                </em>
                <span>{item.has_generation ? labels.planReady : labels.continueChat}</span>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state">{labels.noHistory}</div>
        )}
      </div>
    </aside>
  )
}
