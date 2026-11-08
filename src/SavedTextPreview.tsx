import React, { lazy, Suspense, useId, useRef, useState } from 'react'
import { t } from './i18n'
import { downloadMarkdown, type SavedText } from './text-export'
import './saved-text-preview.css'
import './chatgpt-preview.css'
import { chatSiteNames } from './chatgpt-data'

const MarkdownText = lazy(() => import('./MarkdownText'))

export function SavedTextPreview({
  page,
  onClose
}: {
  page: SavedText & { id?: number }
  onClose: () => void
}) {
  const [exportOpen, setExportOpen] = useState(false)
  const [markdown, setMarkdown] = useState(false)
  const [error, setError] = useState('')
  const exportId = useId()
  const exportButton = useRef<HTMLButtonElement>(null)
  const partialNotice = t(
    '超长页面 · 已保存部分文字',
    'Very long page · partial capture'
  )
  const exportText = async (format: 'markdown' | 'pdf') => {
    setError('')
    setExportOpen(false)
    exportButton.current?.focus()
    try {
      if (format === 'markdown') downloadMarkdown(page, partialNotice)
      else
        await chrome.tabs.create({
          url: chrome.runtime.getURL(`tabs/export.html?id=${page.id}`)
        })
    } catch (e) {
      setError(`${t('导出失败：', 'Export failed: ')}${String(e)}`)
    }
  }
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="text-preview"
        role="dialog"
        aria-modal="true"
        aria-label={page.title || page.url}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key !== 'Escape') return
          e.stopPropagation()
          if (exportOpen) {
            setExportOpen(false)
            exportButton.current?.focus()
          } else onClose()
        }}
      >
        <header className="preview-header">
          <h2>{page.title || page.url}</h2>
          <div className="preview-actions">
            <button
              className="markdown-toggle"
              aria-pressed={markdown}
              disabled={!page.content.trim()}
              onClick={() => setMarkdown((enabled) => !enabled)}
            >
              {markdown
                ? t('原文显示', 'Show original text')
                : t('Markdown 格式显示', 'Show Markdown')}
            </button>
            <div
              className="text-export"
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget))
                  setExportOpen(false)
              }}
            >
              <button
                ref={exportButton}
                aria-expanded={exportOpen}
                aria-controls={exportId}
                disabled={!page.content.trim()}
                title={
                  !page.content.trim()
                    ? t('没有已保存的正文可导出', 'No saved text to export')
                    : undefined
                }
                onClick={() => setExportOpen((open) => !open)}
              >
                {t('导出', 'Export')} ▾
              </button>
              {exportOpen && (
                <div className="text-export-options" id={exportId}>
                  <button onClick={() => void exportText('markdown')}>
                    {t('导出 Markdown', 'Export Markdown')} (.md)
                  </button>
                  <button onClick={() => void exportText('pdf')}>
                    {t('导出 PDF', 'Export PDF')}
                  </button>
                  <small>
                    {t(
                      'PDF：在打印窗口中选择“另存为 PDF”。',
                      'PDF: choose “Save as PDF” in the print dialog.'
                    )}
                  </small>
                </div>
              )}
            </div>
            <button autoFocus onClick={onClose}>
              {t('关闭', 'Close')}
            </button>
          </div>
        </header>
        {error && <p role="alert">{error}</p>}
        {page.truncated && <p className="notice">{partialNotice}</p>}
        <Suspense
          fallback={
            <p role="status">
              {t('正在渲染 Markdown…', 'Rendering Markdown…')}
            </p>
          }
        >
          {page.conversation ? (
            <div
              className="conversation-preview"
              aria-label={t('已保存的对话', 'Saved conversation')}
            >
              {page.conversation.messages.map((message) => (
                <article
                  className={`chat-message chat-message-${message.role}`}
                  key={message.id}
                >
                  <strong>
                    {message.role === 'user'
                      ? t('你', 'You')
                      : chatSiteNames[page.conversation!.site]}
                  </strong>
                  {markdown ? (
                    <MarkdownText text={message.text} sourceUrl={page.url} />
                  ) : (
                    <div>{message.text}</div>
                  )}
                </article>
              ))}
            </div>
          ) : markdown && page.content.trim() ? (
            <div className="markdown-preview">
              <MarkdownText text={page.content} sourceUrl={page.url} />
            </div>
          ) : (
            <pre>
              {page.content ||
                t(
                  '此条目只有标题和网址；打开网页后会保存正文。',
                  'Only the title and URL are available. Visit the page to capture its text.'
                )}
            </pre>
          )}
        </Suspense>
      </section>
    </div>
  )
}
