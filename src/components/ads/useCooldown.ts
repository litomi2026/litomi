'use client'

import ms from 'ms'
import { useCallback, useEffect, useMemo, useState } from 'react'

const SECOND_MS = ms('1 second')
const COOLDOWN_GRACE_SECONDS = 1
const CLEAR_FUDGE_MS = ms('50ms')

type Cooldown = {
  until: number | null
  remainingSeconds: number | null
  start: (seconds: number) => void
  startFromRemainingSeconds: (remainingSeconds: number) => void
  clear: () => void
}

export function useCooldown(): Cooldown {
  const [until, setUntil] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const clear = useCallback(() => {
    setUntil(null)
  }, [])

  const start = useCallback((seconds: number) => {
    const safeSeconds = Math.max(0, Math.ceil(seconds))
    if (safeSeconds === 0) {
      setUntil(null)
      return
    }
    setUntil(Date.now() + safeSeconds * SECOND_MS)
  }, [])

  const startFromRemainingSeconds = useCallback(
    (remainingSeconds: number) => {
      start(remainingSeconds + COOLDOWN_GRACE_SECONDS)
    },
    [start],
  )

  const remainingSeconds = useMemo(() => {
    if (until === null) {
      return null
    }
    return Math.max(0, Math.ceil((until - now) / SECOND_MS))
  }, [until, now])

  // NOTE: 카운트다운 렌더링 (1초 간격)
  useEffect(() => {
    if (until === null) {
      return
    }

    const intervalId = setInterval(() => setNow(Date.now()), SECOND_MS)
    return () => clearInterval(intervalId)
  }, [until])

  // NOTE: 만료 시 자동 해제
  useEffect(() => {
    if (until === null) {
      return
    }

    const delayMs = until - Date.now() + CLEAR_FUDGE_MS
    if (delayMs <= 0) {
      setUntil(null)
      return
    }

    const timeoutId = setTimeout(() => setUntil(null), delayMs)
    return () => clearTimeout(timeoutId)
  }, [until])

  return {
    until,
    remainingSeconds,
    start,
    startFromRemainingSeconds,
    clear,
  }
}
