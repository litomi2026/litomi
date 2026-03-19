'use client'

import ms from 'ms'
import { useEffect, useState } from 'react'

const DEFAULT_DELAY_MS = ms('0.3s')

export default function useDelayedPendingIndicator(isPending: boolean, delayMs = DEFAULT_DELAY_MS) {
  const [isIndicatorVisible, setIsIndicatorVisible] = useState(false)

  useEffect(() => {
    if (!isPending) {
      setIsIndicatorVisible(false)
      return
    }

    const timeoutId = window.setTimeout(() => setIsIndicatorVisible(true), delayMs)
    return () => window.clearTimeout(timeoutId)
  }, [delayMs, isPending])

  return isIndicatorVisible
}
