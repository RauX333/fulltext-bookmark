import React, { type ReactNode } from 'react'
import type { Settings } from '../settings'
export interface EditorProps {
  settings: Settings
  patch: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  toggle: (key: keyof Settings) => ReactNode
  inputProps?: (key: keyof Settings) => {
    'aria-invalid': boolean
    'aria-describedby': string | undefined
    onBlur: () => void
  }
  errors?: Partial<Record<keyof Settings, string>>
}
export interface TaskProps {
  task: (action: () => Promise<void>) => Promise<void>
  setStatus: (message: string) => void
}
export function Field({
  title,
  note,
  error,
  errorId,
  children
}: {
  title: string
  note?: string
  error?: string
  errorId?: string
  children: ReactNode
}) {
  return (
    <label className="setting-field">
      <span>
        <strong>{title}</strong>
        {note && <small>{note}</small>}
        {error && (
          <small id={errorId} className="error">
            {error}
          </small>
        )}
      </span>
      {children}
    </label>
  )
}
