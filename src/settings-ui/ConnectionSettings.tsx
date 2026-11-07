import React from 'react'
import { t } from '../i18n'
import { Field, type EditorProps, type TaskProps } from './Field'
import { send } from '../messaging'
export function ConnectionSettings({
  settings,
  patch,
  toggle,
  task,
  setStatus
}: EditorProps & TaskProps) {
  return (
    <section className="settings-card" id="advanced">
      <h2>{t('可选连接', 'Optional connections')}</h2>
      <p>
        {t(
          '默认不向外部发送内容。启用以下服务后，数据将发送到你配置的地址。',
          'No content is sent to external services by default. Enabling these options sends data to your configured endpoints.'
        )}
      </p>
      <Field
        title={t(
          '发送网页信息到自定义 API',
          'Send page metadata to a custom API'
        )}
      >
        {toggle('remoteStore')}
      </Field>
      <Field title={t('API 地址', 'API URL')}>
        <input
          type="url"
          value={settings.remoteStoreURL}
          onChange={(e) => patch('remoteStoreURL', e.target.value)}
        />
      </Field>
      <Field title={t('API 密钥（可选）', 'API key (optional)')}>
        <input
          type="password"
          value={settings.remoteStoreKey}
          onChange={(e) => patch('remoteStoreKey', e.target.value)}
        />
      </Field>
      <Field
        title={t(
          '发送所有页面（关闭时只发送书签）',
          'Send all pages (otherwise bookmarks only)'
        )}
      >
        {toggle('remoteStoreEveryPage')}
      </Field>
      <p>
        {t(
          '测试连接只发送一条标记为测试的示例记录，不发送浏览记录或正文。',
          'The connection test sends one clearly labeled sample record, without browsing history or page text.'
        )}
      </p>
      <button
        onClick={() =>
          void task(async () => {
            const result = await send<{ message: string }>('test-remote', {
              settings
            })
            setStatus(result.message)
          })
        }
      >
        {t('测试连接', 'Test connection')}
      </button>
    </section>
  )
}
