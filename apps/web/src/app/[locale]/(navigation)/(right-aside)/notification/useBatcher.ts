'use client'

import { useEffect, useRef } from 'react'

interface Options<T> {
  batchDelay: number
  onBatchStart: (ids: T[]) => void
}

export default function useBatcher<T>({ batchDelay, onBatchStart }: Options<T>) {
  const pendingRef = useRef(new Set<T>())
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  function flushBatch() {
    if (pendingRef.current.size === 0) {
      return
    }

    const ids = Array.from(pendingRef.current)
    pendingRef.current.clear()

    onBatchStart(ids)
  }

  function addToQueue(id: T) {
    pendingRef.current.add(id)

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      flushBatch()
      timerRef.current = null
    }, batchDelay)
  }

  useEffect(() => {
    const pendingSet = pendingRef.current

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }

      pendingSet.clear()
    }
  }, [])

  return { addToQueue }
}
