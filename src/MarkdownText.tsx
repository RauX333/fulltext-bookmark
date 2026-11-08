import React, { memo, useMemo } from 'react'
import DOMPurify from 'dompurify'
import { renderMarkdown } from './markdown'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github.css'
import './markdown.css'

export default memo(function MarkdownText({
  text,
  sourceUrl
}: {
  text: string
  sourceUrl: string
}) {
  const html = useMemo(
    () =>
      DOMPurify.sanitize(renderMarkdown(text, sourceUrl), {
        ADD_ATTR: ['target'],
        FORBID_TAGS: ['style'],
        FORBID_ATTR: ['id', 'name']
      }),
    [text, sourceUrl]
  )
  return (
    <div className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />
  )
})
