import React from 'react'
import { t, setLanguage } from '../i18n'
import { Field, type EditorProps } from './Field'
import type { Settings } from '../settings'
export function SearchSettings({
  settings,
  patch,
  toggle,
  inputProps,
  errors
}: EditorProps) {
  return (
    <section className="settings-card" id="search">
      <h2>{t('搜索体验', 'Search experience')}</h2>
      <Field
        title={t('点击扩展图标时打开', 'Clicking the extension icon opens')}
      >
        <select
          aria-label={t('默认搜索界面', 'Default search view')}
          value={settings.searchDisplay}
          onChange={(e) =>
            patch('searchDisplay', e.target.value as Settings['searchDisplay'])
          }
        >
          <option value="sidepanel">
            {t('侧边栏搜索（默认）', 'Side panel (default)')}
          </option>
          <option value="popup">{t('Popup 搜索', 'Popup search')}</option>
          <option value="tab">{t('标签页搜索', 'Search tab')}</option>
        </select>
      </Field>
      <Field title={t('界面语言', 'Interface language')}>
        <select
          value={settings.language}
          onChange={(e) => {
            const value = e.target.value as Settings['language']
            setLanguage(value)
            patch('language', value)
          }}
        >
          <option value="auto">{t('跟随浏览器', 'Browser language')}</option>
          <option value="zh-CN">简体中文</option>
          <option value="en">English</option>
        </select>
      </Field>
      <Field
        title={t('每页结果数量', 'Results per page')}
        error={errors?.maxResults}
        errorId="maxResults-error"
      >
        <input
          {...inputProps?.('maxResults')}
          type="number"
          min="5"
          max="100"
          value={
            Number.isFinite(settings.maxResults) ? settings.maxResults : ''
          }
          onChange={(e) => patch('maxResults', e.target.valueAsNumber)}
        />
      </Field>
      <Field title={t('默认只显示书签', 'Show only bookmarks by default')}>
        {toggle('showOnlyBookmarkedResults')}
      </Field>
      <Field
        title={t('英文拼写容错', 'English typo tolerance')}
        note={t(
          '支持单字符错字与相邻字母颠倒；中英文均支持词语匹配，英文支持词形变化。双引号启用精确短语。',
          'Handles one-character typos and transpositions. Chinese word matching and English stemming are included. Double quotes require an exact phrase.'
        )}
      >
        {toggle('fuzzySearch')}
      </Field>
      <Field
        title={t(
          '在搜索引擎中显示本地结果',
          'Show local matches on search engines'
        )}
      >
        {toggle('searchEngineAdaption')}
      </Field>
      <Field
        title={t('地址栏搜索（kw + Tab）', 'Address bar search (kw + Tab)')}
        note={t(
          '在地址栏输入 kw 并按 Tab 搜索。使用上面的书签筛选与容错设置，最多显示 5 条建议。',
          'Type kw and press Tab in the address bar. Uses the bookmark filter and typo settings above, with up to 5 suggestions.'
        )}
      >
        {toggle('omniboxEnabled')}
      </Field>
    </section>
  )
}
