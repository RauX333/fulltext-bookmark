import { DataSettings } from './settings-ui/DataSettings'
import { AboutSettings } from './settings-ui/AboutSettings'
import { ConnectionSettings } from './settings-ui/ConnectionSettings'
import { SearchSettings } from './settings-ui/SearchSettings'
import { CaptureSettings } from './settings-ui/CaptureSettings'
import React, { useEffect, useState } from 'react'
import type { Settings } from './settings'
import { useAutoSettings } from './settings-ui/useAutoSettings'
import { send } from './messaging'
import { t, setLanguage } from './i18n'
import './style.css'
import icon from 'data-base64:../assets/icon512.png'
export function SettingsView() {
  const editor = useAutoSettings()
  const { settings, patch, inputProps, errors } = editor
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false)
  const [stats, setStats] = useState({ pages: 0, pending: 0 }),
    [storage, setStorage] = useState(0)
  const refresh = () => {
    void send<typeof stats>('stats')
      .then(setStats)
      .catch((e) => setError(String(e)))
    void navigator.storage
      .estimate()
      .then((s) => setStorage(s.usage || 0))
      .catch(() => {})
  }
  useEffect(() => {
    document.body.classList.remove('popup')
    void send<{ settings: Settings }>('settings')
      .then((v) => {
        setLanguage(v.settings.language)
        document.documentElement.lang =
          v.settings.language === 'auto'
            ? chrome.i18n.getUILanguage()
            : v.settings.language
        document.title = t('全文书签 · 设置', 'Fulltext Bookmark · Settings')
        editor.initialize(v.settings)
        setReady(true)
        refresh()
      })
      .catch((e) => setError(String(e)))
  }, [])
  useEffect(() => {
    setLanguage(settings.language)
    document.documentElement.lang =
      settings.language === 'auto'
        ? chrome.i18n.getUILanguage()
        : settings.language
    document.title = t('全文书签 · 设置', 'Fulltext Bookmark · Settings')
  }, [settings.language])
  const task = async (action: () => Promise<void>) => {
    setBusy(true)
    setError('')
    setStatus('')
    try {
      await action()
      refresh()
    } catch (e) {
      setError(String(e))
    } finally {
      setBusy(false)
    }
  }
  const toggle = (key: keyof Settings) => (
    <input
      type="checkbox"
      checked={Boolean(settings[key])}
      onChange={(e) => patch(key, e.target.checked as never)}
    />
  )
  return (
    <main className="settings-shell">
      <header className="app-header">
        <div className="brand">
          <img className="brand-icon" src={icon} alt="" />
          <strong>
            {t('全文书签 · 设置', 'Fulltext Bookmark · Settings')}
          </strong>
        </div>
        <a className="button" href={chrome.runtime.getURL('tabs/search.html')}>
          {t('打开搜索', 'Open search')}
        </a>
      </header>
      <div className="settings-layout">
        <nav
          className="settings-nav"
          aria-label={t('设置导航', 'Settings navigation')}
        >
          <a href="#capture">{t('网页保存', 'Capture')}</a>
          <a href="#search">{t('搜索', 'Search')}</a>
          <a href="#data">{t('数据与备份', 'Data & backup')}</a>
          <a href="#advanced">{t('可选连接', 'Connections')}</a>
          <a href="#about">{t('关于与捐赠', 'About & donate')}</a>
        </nav>
        <div className="settings-content">
          <fieldset disabled={!ready || busy}>
            <CaptureSettings
              settings={settings}
              patch={patch}
              toggle={toggle}
              inputProps={inputProps}
              errors={errors}
            />
            <SearchSettings
              settings={settings}
              patch={patch}
              toggle={toggle}
              inputProps={inputProps}
              errors={errors}
            />
            <DataSettings
              stats={stats}
              storage={storage}
              task={task}
              setStatus={setStatus}
              setError={setError}
            />
            <ConnectionSettings
              settings={settings}
              patch={patch}
              toggle={toggle}
              inputProps={inputProps}
              errors={errors}
              task={task}
              setStatus={setStatus}
            />
            <AboutSettings />
          </fieldset>
          <div className="settings-save">
            <p aria-live="polite" data-testid="settings-save-status">
              {editor.saveState === 'saved'
                ? t('设置已自动保存', 'Settings saved automatically')
                : editor.saveState === 'saving'
                  ? t('正在保存…', 'Saving…')
                  : editor.saveState === 'pending'
                    ? t(
                        '等待输入完成；有效设置将自动保存。',
                        'Waiting for input; valid changes save automatically.'
                      )
                    : editor.saveState === 'error'
                      ? t(
                          '部分设置未保存，请检查输入或重试。',
                          'Some settings are not saved. Check the input or retry.'
                        )
                      : t(
                          '设置会自动保存，无需手动确认。',
                          'Settings save automatically; no confirmation needed.'
                        )}
            </p>
            <p role="status">{status}</p>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
          </div>
          {editor.notice && (
            <div role="alert" className="settings-notice">
              <p>{editor.notice}</p>
              <div className="button-row">
                <button onClick={() => editor.setNotice('')}>
                  {t('知道了', 'Dismiss')}
                </button>
                {editor.saveState === 'error' && (
                  <button onClick={editor.retry}>
                    {t('重新检查并保存', 'Check and retry')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
