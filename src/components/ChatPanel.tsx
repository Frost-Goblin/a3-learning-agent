import type { RefObject, ReactNode } from 'react'
import { MessageSquareText, SendHorizontal, Sparkles, UserRound } from 'lucide-react'
import { LearningMarkdown } from './LearningMarkdown'
import type { DisplayMessage, SuggestedAction, SuggestedActionType } from '../types'

type ChatPanelLabels = {
  chat: string
  assistant: string
  you: string
  preparing: string
  placeholder: string
  generating: string
  generatePlan: string
  thinking: string
  send: string
}

type ChatPanelProps = {
  labels: ChatPanelLabels
  stageLabel: string
  messages: DisplayMessage[]
  pendingMessage: string
  lastAssistantMessageIndex: number
  draft: string
  dialogScrollerRef: RefObject<HTMLDivElement | null>
  sessionId: string
  llmConfigured: boolean
  sessionLoading: boolean
  messageLoading: boolean
  generationLoading: boolean
  setDraft: (value: string) => void
  onSendMessage: () => void
  onGenerate: () => void
  onSuggestedAction: (action: SuggestedAction) => void
  isSuggestedActionDisabled: (actionType: SuggestedActionType) => boolean
  renderSuggestedActionIcon: (actionType: SuggestedActionType) => ReactNode
  getSuggestedActionLabel: (action: SuggestedAction) => string
}

export function ChatPanel({
  labels,
  stageLabel,
  messages,
  pendingMessage,
  lastAssistantMessageIndex,
  draft,
  dialogScrollerRef,
  sessionId,
  llmConfigured,
  sessionLoading,
  messageLoading,
  generationLoading,
  setDraft,
  onSendMessage,
  onGenerate,
  onSuggestedAction,
  isSuggestedActionDisabled,
  renderSuggestedActionIcon,
  getSuggestedActionLabel,
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
                  <div className="message-avatar">{message.role === 'assistant' ? <Sparkles size={16} /> : <UserRound size={16} />}</div>
                  <div className={message.status === 'thinking' ? 'message-bubble thinking' : 'message-bubble'}>
                    <span className="message-label">{message.role === 'assistant' ? labels.assistant : labels.you}</span>
                    {message.role === 'assistant' ? (
                      <div className="chat-markdown">
                        <LearningMarkdown content={message.content} />
                      </div>
                    ) : (
                      <p>{message.content}</p>
                    )}
                    {!pendingMessage && message.role === 'assistant' && message.status !== 'thinking' && index === lastAssistantMessageIndex && message.suggested_actions?.length ? (
                      <div className="message-action-row" aria-label="可继续执行的操作">
                        {message.suggested_actions.map((action) => (
                          <button
                            className="message-action-button"
                            type="button"
                            key={action.type}
                            onClick={() => onSuggestedAction(action)}
                            disabled={isSuggestedActionDisabled(action.type)}
                          >
                            {renderSuggestedActionIcon(action.type)}
                            {getSuggestedActionLabel(action)}
                          </button>
                        ))}
                      </div>
                    ) : null}
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
                <button className="ghost-button" type="button" onClick={onGenerate} disabled={!llmConfigured || !sessionId || generationLoading}>
                  <Sparkles size={16} />
                  {generationLoading ? labels.generating : labels.generatePlan}
                </button>
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
