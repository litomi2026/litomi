import { useEffect, useRef, useState } from 'react'

type AutoHideCursorOptions = {
  enabled: boolean
  idleDelayMs: number
}

export default function useAutoHideCursor({ enabled, idleDelayMs }: AutoHideCursorOptions) {
  const [isCursorHidden, setIsCursorHidden] = useState(false)
  const timeoutIdRef = useRef<number | null>(null)

  function registerActivity() {
    if (!enabled) {
      return
    }

    setIsCursorHidden((prev) => (prev ? false : prev))

    if (timeoutIdRef.current !== null) {
      window.clearTimeout(timeoutIdRef.current)
    }

    timeoutIdRef.current = window.setTimeout(() => {
      setIsCursorHidden(true)
    }, idleDelayMs)
  }

  useEffect(() => {
    function clearCursorTimer() {
      if (timeoutIdRef.current === null) {
        return
      }

      window.clearTimeout(timeoutIdRef.current)
      timeoutIdRef.current = null
    }

    if (!enabled) {
      clearCursorTimer()
      setIsCursorHidden(false)
      return
    }

    timeoutIdRef.current = window.setTimeout(() => {
      setIsCursorHidden(true)
    }, idleDelayMs)

    return clearCursorTimer
  }, [enabled, idleDelayMs])

  return { isCursorHidden, registerActivity }
}
