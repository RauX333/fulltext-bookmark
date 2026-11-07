import { DataSettings } from './settings-ui/DataSettings'
import { AboutSettings } from './settings-ui/AboutSettings'
import { ConnectionSettings } from './settings-ui/ConnectionSettings'
import { SearchSettings } from './settings-ui/SearchSettings'
import { CaptureSettings } from './settings-ui/CaptureSettings'
import React, { useEffect, useState } from 'react'
import { defaults, type Settings } from './settings'
import { send } from './messaging'
import { t, setLanguage } from './i18n'
import './style.css'
import icon from 'data-base64:../assets/icon512.png'
export function SettingsView() {
  const [settings, setSettings] = useState<Settings>(defaults),
    [ready, setReady] = useState(false)
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
        setSettings(v.settings)
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
  const patch = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((s) => ({ ...s, [key]: value }))
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
  const save = () =>
    task(async () => {
      if (
        !Number.isFinite(settings.maxResults) ||
        settings.maxResults < 5 ||
        settings.maxResults > 100 ||
        !Number.isFinite(settings.tempPageExpireTime) ||
        settings.tempPageExpireTime < 0
      )
        throw new Error(t('请检查数字范围', 'Check the numeric ranges'))
      await send('save-settings', { settings })
      setStatus(t('设置已保存', 'Settings saved'))
    })
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
            />
            <SearchSettings settings={settings} patch={patch} toggle={toggle} />
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
              task={task}
              setStatus={setStatus}
            />
            <AboutSettings />
          </fieldset>
          <div className="settings-save">
            <button
              className="primary"
              disabled={!ready || busy}
              onClick={() => void save()}
            >
              {busy ? t('处理中…', 'Working…') : t('保存设置', 'Save settings')}
            </button>
            <p role="status">{status}</p>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
