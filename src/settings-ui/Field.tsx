import React, { type ReactNode } from 'react'
import type { Settings } from '../settings'
export interface EditorProps {
  settings: Settings
  patch: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  toggle: (key: keyof Settings) => ReactNode
}
export interface TaskProps {
  task: (action: () => Promise<void>) => Promise<void>
  setStatus: (message: string) => void
}
export function Field({
  title,
  note,
  children
}: {
  title: string
  note?: string
  children: ReactNode
}) {
  return (
    <label className="setting-field">
      <span>
        <strong>{title}</strong>
        {note && <small>{note}</small>}
      </span>
      {children}
    </label>
  )
}
