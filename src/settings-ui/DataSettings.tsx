import React, { useState } from 'react'
import { t } from '../i18n'
import { Field, type TaskProps } from './Field'
import { send } from '../messaging'
import {
  exportBackup,
  toCSV,
  encryptBackup,
  decryptBackup,
  parseBackup,
  importPages
} from '../backup'
function download(text: string, extension: string) {
  const url = URL.createObjectURL(
    new Blob([text], {
      type: extension === 'csv' ? 'text/csv;charset=utf-8' : 'application/json'
    })
  )
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `fulltext-bookmark-${new Date().toISOString().slice(0, 10)}.${extension}`
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}
export function DataSettings({
  stats,
  storage,
  task,
  setStatus,
  setError
}: TaskProps & {
  stats: { pages: number; pending: number }
  storage: number
  setError: (message: string) => void
}) {
  const [password, setPassword] = useState('')
  return (
    <section className="settings-card" id="data">
      <h2>{t('数据与备份', 'Data & backup')}</h2>
      <p className="storage-stat">
        {stats.pages} {t('条记录', 'pages')} · {(storage / 1048576).toFixed(1)}{' '}
        MB
        {stats.pending > 0 &&
          ` · ${stats.pending} ${t('条待升级索引', 'awaiting reindex')}`}
      </p>
      <p>
        {t(
          '可以导入旧版本 JSON / CSV 备份。已有浏览历史只能导入标题和网址，重新访问页面后才有正文。',
          'Legacy JSON / CSV backups are supported. Existing browser history contains only titles and URLs; revisit pages to capture their text.'
        )}
      </p>
      <div className="button-row">
        <button
          onClick={() =>
            void task(async () => {
              download(JSON.stringify(await exportBackup()), 'json')
              setStatus(t('JSON 备份已导出', 'JSON backup exported'))
            })
          }
        >
          {t('导出 JSON', 'Export JSON')}
        </button>
        <button
          onClick={() =>
            void task(async () => {
              download(toCSV(await exportBackup()), 'csv')
              setStatus(t('CSV 备份已导出', 'CSV backup exported'))
            })
          }
        >
          {t('导出 CSV', 'Export CSV')}
        </button>
        <button
          onClick={() => {
            void chrome.permissions
              .request({ permissions: ['history'] })
              .then((granted) => {
                if (granted)
                  return task(async () => {
                    const result = await send<{ count: number }>(
                      'import-history'
                    )
                    setStatus(
                      `${result.count} ${t('条历史记录已导入', 'history entries imported')}`
                    )
                  })
              })
              .catch((e) => setError(String(e)))
          }}
        >
          {t('导入浏览历史', 'Import browser history')}
        </button>
        <button
          onClick={() =>
            void task(async () => {
              const result = await send<{ count: number }>('sync-bookmarks')
              setStatus(
                `${result.count} ${t('条书签已同步', 'bookmarks synced')}`
              )
            })
          }
        >
          {t('同步书签', 'Sync bookmarks')}
        </button>
      </div>
      <Field
        title={t('备份密码（可选）', 'Backup password (optional)')}
        note={t(
          '加密导出使用此密码；导入加密文件时也请填写。至少 8 位，仅加密备份文件，扩展内数据不加密。密码不会保存。',
          'Used for encrypted export and import. At least 8 characters. Encrypts backup files only; data inside the extension is not encrypted. The password is not stored.'
        )}
      >
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <div className="button-row">
        <button
          onClick={() =>
            void task(async () => {
              download(
                await encryptBackup(
                  JSON.stringify(await exportBackup()),
                  password
                ),
                'encrypted.json'
              )
              setStatus(t('加密备份已导出', 'Encrypted backup exported'))
            })
          }
        >
          {t('导出加密备份', 'Export encrypted backup')}
        </button>
        <label className="button file-button">
          {t('导入备份', 'Import backup')}
          <input
            type="file"
            accept=".csv,.json"
            aria-label={t('选择备份文件', 'Choose backup file')}
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file)
                void task(async () => {
                  let text = await file.text()
                  if (/^\s*\{/.test(text) && JSON.parse(text).encrypted)
                    text = await decryptBackup(text, password)
                  const pages = parseBackup(text)
                  if (
                    !confirm(
                      t(
                        `合并导入 ${pages.length} 条记录？已有更新的正文会保留。`,
                        `Merge ${pages.length} pages? Newer saved text is preserved.`
                      )
                    )
                  )
                    return
                  await importPages(pages, (count) =>
                    setStatus(`${count} / ${pages.length}`)
                  )
                  setStatus(
                    t(
                      `已导入 ${pages.length} 条记录`,
                      `Imported ${pages.length} pages`
                    )
                  )
                })
            }}
          />
        </label>
      </div>
      <details className="danger-zone">
        <summary>{t('清除本地记录', 'Delete local records')}</summary>
        <p>
          {t(
            '此操作不删除浏览器书签或浏览历史。请先导出备份。',
            'Browser bookmarks and history are unaffected. Export a backup first.'
          )}
        </p>
        <button
          className="danger"
          onClick={() => {
            if (
              confirm(
                t(
                  '清除全部已保存网页和相关数据？此操作无法撤销。',
                  'Delete all saved pages and related data? This cannot be undone.'
                )
              )
            )
              void task(async () => {
                await send('clear')
                setStatus(t('本地记录已清除', 'Local records deleted'))
              })
          }}
        >
          {t('清除全部本地记录', 'Delete all local records')}
        </button>
      </details>
    </section>
  )
}
