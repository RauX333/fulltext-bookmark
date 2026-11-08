import React from 'react'
import { chatSiteNames, type ChatSite } from '../chatgpt-data'
import { t } from '../i18n'
import { Field, type EditorProps } from './Field'
export function CaptureSettings({
  settings,
  patch,
  toggle,
  inputProps,
  errors
}: EditorProps) {
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
        note={t(
          '微博、X、ChatGPT、Gemini 和 DeepSeek 使用下方各自的保存设置。',
          'Weibo, X, ChatGPT, Gemini and DeepSeek use their separate capture settings below.'
        )}
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
        title={t('启用微博帖子保存', 'Enable Weibo post saving')}
        note={t(
          '显示“保存帖子”按钮；长微博请先展开。关闭后隐藏按钮并停止微博文字采集，已保存内容保留。',
          'Show the Save post button; expand long posts first. Turning this off hides buttons and stops Weibo text capture. Saved data is kept.'
        )}
      >
        {toggle('weiboSupport')}
      </Field>
      <Field
        title={t(
          '自动保存微博页面文字',
          'Automatically capture Weibo page text'
        )}
        note={t(
          '默认关闭，仅点击“保存帖子”才保存。开启后遵循上方自动保存和书签同步设置。',
          'Off by default: only Save post clicks save text. When enabled, follows automatic capture and bookmark sync settings above.'
        )}
      >
        <input
          type="checkbox"
          checked={settings.weiboAutoCapture}
          disabled={!settings.weiboSupport}
          onChange={(e) => patch('weiboAutoCapture', e.target.checked)}
        />
      </Field>
      <Field
        title={t('启用 X（Twitter）帖子保存', 'Enable X (Twitter) post saving')}
        note={t(
          '在 x.com 和 twitter.com 显示“保存帖子”；长帖请先展开。关闭后隐藏按钮并停止 X 文字采集，已保存内容保留。',
          'Show Save post on x.com and twitter.com; expand long posts first. Turning this off hides buttons and stops X text capture. Saved data is kept.'
        )}
      >
        {toggle('twitterSupport')}
      </Field>
      <Field
        title={t('自动保存 X 页面文字', 'Automatically capture X page text')}
        note={t(
          '默认关闭，仅点击“保存帖子”才保存。开启后遵循上方自动保存和书签同步设置。',
          'Off by default: only Save post clicks save text. When enabled, follows automatic capture and bookmark sync settings above.'
        )}
      >
        <input
          type="checkbox"
          checked={settings.twitterAutoCapture}
          disabled={!settings.twitterSupport}
          onChange={(e) => patch('twitterAutoCapture', e.target.checked)}
        />
      </Field>
      {(Object.keys(chatSiteNames) as ChatSite[]).map((site) => {
        const name = chatSiteNames[site]
        return (
          <React.Fragment key={site}>
            <Field
              title={t(
                `启用 ${name} 对话保存`,
                `Enable ${name} conversation saving`
              )}
              note={t(
                '默认开启。单条保存按钮位于消息下方原生操作栏末尾，随原生按钮显示；整个对话按钮在输入框外侧右方。已保存显示绿色勾选标记。关闭后保留已存内容。',
                'On by default. Message save icons follow the native action row visibility. The conversation icon sits outside the composer on the right. A green check marks saved text. Turning this off keeps saved data.'
              )}
            >
              {toggle(`${site}Support`)}
            </Field>
            <Field
              title={t(
                `自动保存 ${name} 对话`,
                `Automatically save ${name} conversations`
              )}
              note={t(
                '默认开启，独立于普通网页自动保存。回复生成结束后保存已显示的消息，同一对话汇总展示。长对话请滚动加载历史消息，草稿不会保存。',
                'On by default, independent of general page capture. Save displayed messages after responses finish, grouped by conversation. Scroll to load older messages. Drafts are excluded.'
              )}
            >
              <input
                type="checkbox"
                checked={settings[`${site}AutoCapture`]}
                disabled={!settings[`${site}Support`]}
                onChange={(e) => patch(`${site}AutoCapture`, e.target.checked)}
              />
            </Field>
          </React.Fragment>
        )
      })}
      <Field
        title={t('普通网页保留天数', 'Retention in days')}
        error={errors?.tempPageExpireTime}
        errorId="tempPageExpireTime-error"
        note={t(
          '0 表示永久保存；书签始终保留。',
          '0 keeps pages forever. Bookmarks are always retained.'
        )}
      >
        <input
          {...inputProps?.('tempPageExpireTime')}
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
        error={errors?.forbiddenURLs}
        errorId="forbiddenURLs-error"
        note={t(
          '每行一条，可用 * 通配符；正则表达式写成 /表达式/。初始列表已排除常见网页邮箱，避免自动保存邮件内容；可自行增删。修改后生效，已保存内容保留。',
          'One per line. Use * wildcards or /regular expressions/. The initial list excludes common webmail sites to avoid automatically saving email; rules are editable. Changes do not delete existing data.'
        )}
      >
        <textarea
          {...inputProps?.('forbiddenURLs')}
          rows={6}
          value={settings.forbiddenURLs.join('\n')}
          onChange={(e) => patch('forbiddenURLs', e.target.value.split('\n'))}
        />
      </Field>
    </section>
  )
}
