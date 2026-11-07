import React from 'react'
import { t } from '../i18n'
import { Field, type EditorProps } from './Field'
export function CaptureSettings({ settings, patch, toggle }: EditorProps) {
  return (
    <section className="settings-card" id="capture">
      <h1>{t('网页保存', 'Page capture')}</h1>
      <p>
        {t(
          '保存浏览器中已加载的可见文字，包括后续加载的评论、展开正文和滚动列表。不会自动点击网页、读取输入框或保存无痕标签页。',
          'Save loaded, visible text, including comments, expanded articles and scrolling lists. Pages are not clicked automatically; form inputs and incognito tabs are excluded.'
        )}
      </p>
      <Field
        title={t('自动保存浏览过的网页', 'Automatically save visited pages')}
      >
        {toggle('storeEveryPage')}
      </Field>
      <Field
        title={t('同步浏览器书签', 'Sync browser bookmarks')}
        note={t(
          '书签不会按保留天数自动清理；访问后补充正文。',
          'Bookmarks do not expire. Visiting them adds their text.'
        )}
      >
        {toggle('bookmarkAdaption')}
      </Field>
      <Field
        title={t('微博卡片显示“保存全文”', 'Show a save button on Weibo posts')}
        note={t(
          '保存当前已加载的正文；长微博请先展开，再点击保存。',
          'Saves the currently loaded post. Expand long posts before saving.'
        )}
      >
        {toggle('weiboSupport')}
      </Field>
      <Field
        title={t('普通网页保留天数', 'Retention in days')}
        note={t(
          '0 表示永久保存；书签始终保留。',
          '0 keeps pages forever. Bookmarks are always retained.'
        )}
      >
        <input
          type="number"
          min="0"
          max="36500"
          aria-label={t('保留天数', 'Retention days')}
          value={
            Number.isFinite(settings.tempPageExpireTime)
              ? settings.tempPageExpireTime / 86400000
              : ''
          }
          onChange={(e) =>
            patch('tempPageExpireTime', e.target.valueAsNumber * 86400000)
          }
        />
      </Field>
      <Field
        title={t('不保存的网址', 'Excluded URLs')}
        note={t(
          '每行一条，可用 * 通配符；正则表达式写成 /表达式/。修改后生效，已保存内容保留。',
          'One per line. Use * wildcards or /regular expressions/. Changes do not delete existing data.'
        )}
      >
        <textarea
          rows={6}
          value={settings.forbiddenURLs.join('\n')}
          onChange={(e) => patch('forbiddenURLs', e.target.value.split('\n'))}
        />
      </Field>
    </section>
  )
}
