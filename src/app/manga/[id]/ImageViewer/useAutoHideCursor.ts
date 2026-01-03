import { useCallback, useEffect, useRef, useState } from 'react'

type AutoHideCursorOptions = {
  enabled: boolean
  idleDelayMs: number
}

export default function useAutoHideCursor({ enabled, idleDelayMs }: AutoHideCursorOptions) {
  const [isCursorHidden, setIsCursorHidden] = useState(false)
  const timeoutIdRef = useRef<number | null>(null)

  const clearTimer = useCallback(() => {
    if (timeoutIdRef.current === null) {
      return
    }
    window.clearTimeout(timeoutIdRef.current)
    timeoutIdRef.current = null
  }, [])

  const scheduleHide = useCallback(() => {
    clearTimer()
    timeoutIdRef.current = window.setTimeout(() => {
      setIsCursorHidden(true)
    }, idleDelayMs)
  }, [clearTimer, idleDelayMs])

  const registerActivity = useCallback(() => {
    if (!enabled) {
      return
    }

    setIsCursorHidden((prev) => (prev ? false : prev))
    scheduleHide()
  }, [enabled, scheduleHide])

  useEffect(() => {
    if (!enabled) {
      clearTimer()
      setIsCursorHidden(false)
      return
    }

    scheduleHide()
    return clearTimer
  }, [clearTimer, enabled, scheduleHide])

  return { isCursorHidden, registerActivity }
}
