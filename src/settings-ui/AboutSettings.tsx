import React from 'react'
import { t } from '../i18n'
export function AboutSettings() {
  return (
    <section className="settings-card" id="about">
      <h2>{t('关于与捐赠', 'About & donate')}</h2>
      <p>
        {t('开发者', 'Developed by')}:{' '}
        <a href="https://github.com/RauX333" target="_blank" rel="noreferrer">
          RauX333
        </a>{' '}
        ❤️
      </p>
      <p>
        {t('电子邮件', 'Email')}:{' '}
        <a href="mailto:xenoncancer@gmail.com">xenoncancer@gmail.com</a>
      </p>
      <p>
        {t('支持这个项目', 'Support this project')}:{' '}
        <a href="https://paypal.me/dongxiajun" target="_blank" rel="noreferrer">
          PayPal
        </a>
      </p>
      <p>
        {t(
          '在地址栏输入 kw 并按 Tab，即可搜索本地保存的网页。',
          'Type kw and press Tab in the address bar to search saved pages.'
        )}
      </p>
    </section>
  )
}
