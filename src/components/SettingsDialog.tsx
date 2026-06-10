import type { Dispatch, SetStateAction } from 'react'
import { X } from 'lucide-react'
import type { AppSettingsDraft, AppSettingsState, ProviderOption } from '../types'

type SettingsDialogProps = {
  appSettings: AppSettingsState | null
  settingsDraft: AppSettingsDraft
  setSettingsDraft: Dispatch<SetStateAction<AppSettingsDraft>>
  chatProviderOptions: ProviderOption[]
  embeddingProviderOptions: ProviderOption[]
  settingsSaving: boolean
  onClose: () => void
  onSave: () => void
}

export function SettingsDialog({
  appSettings,
  settingsDraft,
  setSettingsDraft,
  chatProviderOptions,
  embeddingProviderOptions,
  settingsSaving,
  onClose,
  onSave,
}: SettingsDialogProps) {
  const selectedChatProvider = chatProviderOptions.find((item) => item.id === settingsDraft.chat_provider) ?? chatProviderOptions[0]
  const selectedEmbeddingProvider =
    embeddingProviderOptions.find((item) => item.id === settingsDraft.embedding_provider) ?? embeddingProviderOptions[0]

  return (
    <div className="settings-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="settings-dialog" role="dialog" aria-modal="true" aria-label="模型设置" onMouseDown={(event) => event.stopPropagation()}>
        <div className="settings-head">
          <div>
            <h2>模型设置</h2>
            <p>选择服务商和模型，只需要填写对应的 API Key。</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭设置">
            <X size={18} />
          </button>
        </div>

        <div className="settings-body settings-body-provider">
          <div className="settings-group">
            <h3>对话模型</h3>
            <p>用于聊天、学习情况总结、典例和练习生成。</p>
          </div>

          <label className="settings-field provider-field">
            <span>服务商</span>
            <select
              value={settingsDraft.chat_provider}
              onChange={(event) => {
                const provider = chatProviderOptions.find((item) => item.id === event.target.value) ?? chatProviderOptions[0]
                setSettingsDraft((current) => ({
                  ...current,
                  chat_provider: provider.id,
                  deepseek_chat_model: provider.models[0] ?? current.deepseek_chat_model,
                }))
              }}
            >
              {chatProviderOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="settings-field provider-field">
            <span>模型</span>
            {settingsDraft.chat_provider === 'custom' ? (
              <input
                value={settingsDraft.deepseek_chat_model}
                placeholder="例如：gpt-4.1-mini"
                onChange={(event) => setSettingsDraft((current) => ({ ...current, deepseek_chat_model: event.target.value }))}
              />
            ) : (
              <select
                value={settingsDraft.deepseek_chat_model}
                onChange={(event) => setSettingsDraft((current) => ({ ...current, deepseek_chat_model: event.target.value }))}
              >
                {selectedChatProvider.models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            )}
          </label>

          {settingsDraft.chat_provider === 'custom' ? (
            <label className="settings-field provider-field wide-field">
              <span>接口地址</span>
              <input
                value={settingsDraft.deepseek_base_url}
                placeholder="例如：https://api.example.com/v1"
                onChange={(event) => setSettingsDraft((current) => ({ ...current, deepseek_base_url: event.target.value }))}
              />
            </label>
          ) : null}

          <label className="settings-field provider-field wide-field">
            <span>API Key</span>
            <input
              type="password"
              value={settingsDraft.deepseek_api_key}
              placeholder={appSettings?.deepseek_api_key_masked ? '已配置：' + appSettings.deepseek_api_key_masked : '输入所选服务商的 API Key'}
              onChange={(event) => setSettingsDraft((current) => ({ ...current, deepseek_api_key: event.target.value }))}
            />
          </label>

          <div className="settings-group">
            <h3>资料检索</h3>
            <p>用于课程资料索引和相似内容检索。</p>
          </div>

          <label className="settings-field provider-field">
            <span>服务商</span>
            <select
              value={settingsDraft.embedding_provider}
              onChange={(event) => {
                const provider = embeddingProviderOptions.find((item) => item.id === event.target.value) ?? embeddingProviderOptions[0]
                setSettingsDraft((current) => ({
                  ...current,
                  embedding_provider: provider.id,
                  dashscope_embedding_model: provider.models[0] ?? current.dashscope_embedding_model,
                }))
              }}
            >
              {embeddingProviderOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="settings-field provider-field">
            <span>模型</span>
            {settingsDraft.embedding_provider === 'custom' ? (
              <input
                value={settingsDraft.dashscope_embedding_model}
                placeholder="例如：text-embedding-3-small"
                onChange={(event) => setSettingsDraft((current) => ({ ...current, dashscope_embedding_model: event.target.value }))}
              />
            ) : (
              <select
                value={settingsDraft.dashscope_embedding_model}
                onChange={(event) => setSettingsDraft((current) => ({ ...current, dashscope_embedding_model: event.target.value }))}
              >
                {selectedEmbeddingProvider.models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            )}
          </label>

          {settingsDraft.embedding_provider === 'custom' ? (
            <label className="settings-field provider-field wide-field">
              <span>接口地址</span>
              <input
                value={settingsDraft.dashscope_base_url}
                placeholder="例如：https://api.example.com/v1"
                onChange={(event) => setSettingsDraft((current) => ({ ...current, dashscope_base_url: event.target.value }))}
              />
            </label>
          ) : null}

          <label className="settings-field provider-field wide-field">
            <span>API Key</span>
            <input
              type="password"
              value={settingsDraft.dashscope_api_key}
              placeholder={appSettings?.dashscope_api_key_masked ? '已配置：' + appSettings.dashscope_api_key_masked : '输入所选服务商的 API Key'}
              onChange={(event) => setSettingsDraft((current) => ({ ...current, dashscope_api_key: event.target.value }))}
            />
          </label>
        </div>

        <div className="settings-foot">
          <span>{appSettings?.llm_configured ? '当前配置完整' : '请补全对话 Key 和向量 Key'}</span>
          <div className="settings-actions">
            <button className="ghost-button" type="button" onClick={onClose}>
              取消
            </button>
            <button className="primary-button" type="button" onClick={onSave} disabled={settingsSaving}>
              {settingsSaving ? '保存中...' : '保存设置'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
