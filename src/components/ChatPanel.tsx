import type { RefObject } from 'react'
import { MessageSquareText, SendHorizontal } from 'lucide-react'
import { LearningMarkdown } from './LearningMarkdown'
import type { DisplayMessage } from '../types'

type ChatPanelLabels = {
  chat: string
  assistant: string
  you: string
  preparing: string
  placeholder: string
  thinking: string
  send: string
}

type ChatPanelProps = {
  labels: ChatPanelLabels
  stageLabel: string
  messages: DisplayMessage[]
  draft: string
  dialogScrollerRef: RefObject<HTMLDivElement | null>
  sessionId: string
  sessionLoading: boolean
  messageLoading: boolean
  setDraft: (value: string) => void
  onSendMessage: () => void
}

export function ChatPanel({
  labels,
  stageLabel,
  messages,
  draft,
  dialogScrollerRef,
  sessionId,
  sessionLoading,
  messageLoading,
  setDraft,
  onSendMessage,
}: ChatPanelProps) {
  return (
    <section className="page page-chat panel">
      <div className="panel-head">
        <div>
          <h2>{labels.chat}</h2>
        </div>
        <MessageSquareText size={18} />
      </div>

      <div className="chat-layout">
        <div className="chat-main">
          <div className="dialog-scroller" ref={dialogScrollerRef}>
            {messages.length > 0 ? (
              messages.map((message, index) => (
                <article className={message.role === 'assistant' ? 'message-row assistant' : 'message-row user'} key={message.role + '-' + index + '-' + (message.status ?? 'done')}>
                  <div className={message.status === 'thinking' ? 'message-bubble thinking' : 'message-bubble'}>
                    {message.role === 'assistant' ? (
                      <div className="chat-markdown">
                        <LearningMarkdown content={message.content} renderMermaid={!(messageLoading && index === messages.length - 1)} />
                      </div>
                    ) : (
                      <p>{message.content}</p>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">{labels.preparing}</div>
            )}
          </div>

          <div className="composer">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  onSendMessage()
                }
              }}
              placeholder={labels.placeholder}
              rows={4}
              disabled={!sessionId || sessionLoading}
            />
            <div className="composer-actions">
              <div className="stage-pill">{stageLabel}</div>
              <div className="composer-buttons">
                <button className="primary-button" type="button" onClick={onSendMessage} disabled={!draft.trim() || messageLoading || sessionLoading}>
                  <SendHorizontal size={16} />
                  {messageLoading ? labels.thinking : labels.send}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
