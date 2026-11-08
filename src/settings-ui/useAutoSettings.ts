import { useEffect, useRef, useState } from 'react'
import { defaults, type Settings } from '../settings'
import { settingError } from '../settings-validation'
import { send } from '../messaging'
import { t } from '../i18n'

export function useAutoSettings() {
  const [settings, setSettings] = useState<Settings>(defaults)
  const [errors, setErrors] = useState<Partial<Record<keyof Settings, string>>>(
    {}
  )
  const [notice, setNotice] = useState('')
  const [saveState, setSaveState] = useState<
    'idle' | 'pending' | 'saving' | 'saved' | 'error'
  >('idle')
  const draft = useRef(settings)
  const dirty = useRef(new Set<keyof Settings>())
  const timers = useRef(
    new Map<keyof Settings, ReturnType<typeof setTimeout>>()
  )
  const inFlight = useRef(0)
  const initialize = (value: Settings) => {
    draft.current = value
    setSettings(value)
  }
  const commit = (key: keyof Settings) => {
    clearTimeout(timers.current.get(key))
    timers.current.delete(key)
    if (!dirty.current.has(key)) return
    const error = settingError(key, draft.current)
    setErrors((previous) => ({ ...previous, [key]: error }))
    if (error) {
      setNotice(error)
      setSaveState('error')
      return
    }
    // Commit the URL before enabling the connection, including a just-typed URL.
    if (key === 'remoteStore' && draft.current.remoteStore)
      commit('remoteStoreURL')
    const value = draft.current[key]
    dirty.current.delete(key)
    inFlight.current++
    setSaveState('saving')
    void send('save-settings', { patch: { [key]: value } }).then(
      () => {
        inFlight.current--
        setSaveState(
          inFlight.current
            ? 'saving'
            : [...dirty.current].some((key) => settingError(key, draft.current))
              ? 'error'
              : dirty.current.size
                ? 'pending'
                : 'saved'
        )
      },
      (error) => {
        inFlight.current--
        if (draft.current[key] === value) dirty.current.add(key)
        setNotice(
          t('自动保存失败，请重试：', 'Automatic save failed; please retry: ') +
            String(error)
        )
        setSaveState('error')
      }
    )
  }
  const patch = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    const previous = draft.current
    const next = { ...previous, [key]: value }
    const immediate =
      typeof value === 'boolean' ||
      key === 'language' ||
      key === 'searchDisplay'
    const error = settingError(key, next)
    setNotice('')
    setErrors((current) => ({ ...current, [key]: error }))
    if (immediate && error) {
      setNotice(error)
      return
    }
    draft.current = next
    setSettings(next)
    dirty.current.add(key)
    clearTimeout(timers.current.get(key))
    setSaveState('pending')
    if (immediate) commit(key)
    else
      timers.current.set(
        key,
        setTimeout(() => commit(key), 600)
      )
  }
  const flush = () => {
    for (const key of dirty.current) commit(key)
  }
  useEffect(() => {
    const onHide = () => flush()
    window.addEventListener('pagehide', onHide)
    return () => {
      window.removeEventListener('pagehide', onHide)
      for (const timer of timers.current.values()) clearTimeout(timer)
    }
  }, [])
  const inputProps = (key: keyof Settings) => ({
    'aria-invalid': !!errors[key],
    'aria-describedby': errors[key] ? `${key}-error` : undefined,
    onBlur: () => commit(key)
  })
  return {
    settings,
    initialize,
    patch,
    inputProps,
    errors,
    notice,
    setNotice,
    saveState,
    retry: flush
  }
}
