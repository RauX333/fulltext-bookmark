import React, { useEffect, useState } from 'react'
import { db } from '../database'
import { getSettings } from '../settings'
import { setLanguage, t } from '../i18n'
import {
  savedTextMetadata,
  textExportFilename,
  type SavedText
} from '../text-export'
import '../text-export.css'

export default function TextExportPage() {
  const [page, setPage] = useState<SavedText>()
  const [error, setError] = useState('')
  const [exportedAt] = useState(() => new Date())
  const metadata = page ? savedTextMetadata(page, exportedAt) : undefined
  const metadataLabels = {
    title: t('标题', 'Title'),
    url: t('原网址', 'Source URL'),
    saved_at: t('保存 / 记录时间（UTC）', 'Saved / record time (UTC)'),
    exported_at: t('导出时间（UTC）', 'Exported at (UTC)'),
    source: t('记录来源', 'Record source'),
    is_bookmarked: t('已加书签', 'Bookmarked'),
    truncated: t('正文已截断', 'Partial capture')
  }
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const settings = await getSettings()
      setLanguage(settings.language)
      document.documentElement.lang =
        settings.language === 'auto'
          ? chrome.i18n.getUILanguage()
          : settings.language
      const id = Number(new URLSearchParams(location.search).get('id'))
      const saved =
        Number.isSafeInteger(id) && id > 0
          ? await db.transaction('r', [db.pages, db.contents], async () => {
              const record = await db.pages.get(id)
              const content = await db.contents.get(id)
              return record && content?.content.trim()
                ? { ...record, content: content.content }
                : undefined
            })
          : undefined
      if (!saved)
        throw new Error(
          t(
            '没有找到已保存的正文，请返回搜索结果重新打开。',
            'Saved text was not found. Return to search and open it again.'
          )
        )
      if (cancelled) return
      document.title = textExportFilename(saved.title)
      setPage(saved)
    })().catch((e) => {
      if (!cancelled) setError(String(e))
    })
    return () => {
      cancelled = true
    }
  }, [])
  useEffect(() => {
    if (!page) return
    // Print from a full tab so closing the toolbar popup cannot interrupt it.
    // Wait for layout/fonts before Chrome takes the printable snapshot.
    let cancelled = false
    const timeout = setTimeout(() => {
      void document.fonts.ready.then(() => {
        if (!cancelled) window.print()
      })
    }, 100)
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [page])
  return (
    <main>
      <aside className="export-toolbar">
        <p>
          {t(
            '在打印窗口的目标打印机中选择“另存为 PDF”。取消后也可以再次点击下方按钮。',
            'Choose “Save as PDF” as the print destination. You can reopen the print dialog if you cancel.'
          )}
        </p>
        <button disabled={!page} onClick={() => window.print()}>
          {t('另存为 PDF', 'Save as PDF')}
        </button>
      </aside>
      {error ? (
        <p role="alert">{error}</p>
      ) : page ? (
        <article className="export-document">
          <h1>{page.title || page.url}</h1>
          <table className="export-metadata">
            <caption>{t('元数据', 'Metadata')}</caption>
            <tbody>
              {Object.entries(metadata!).map(([key, value]) => (
                <tr key={key} data-field={key}>
                  <th scope="row">
                    {metadataLabels[key as keyof typeof metadataLabels]}
                    <code>{key}</code>
                  </th>
                  <td className={key === 'url' ? 'export-source' : undefined}>
                    {value === null ? t('未知', 'Unknown') : String(value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {page.truncated && (
            <p className="export-notice">
              {t(
                '超长页面 · 已保存部分文字',
                'Very long page · partial capture'
              )}
            </p>
          )}
          <pre>{page.content}</pre>
        </article>
      ) : (
        <p role="status">{t('正在加载…', 'Loading…')}</p>
      )}
    </main>
  )
}
