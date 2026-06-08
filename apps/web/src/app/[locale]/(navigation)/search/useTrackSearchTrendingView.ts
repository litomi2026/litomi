'use client'
import { useEffect, useRef } from 'react'

import { SessionStorageKeyMap } from '@/storage'
import { fetchAPIData } from '@/utils/api-request'
import { ProblemDetailsError } from '@/utils/fetch-response'

const TRACKING_COOLDOWN_MS = 10 * 60 * 1000

type Params = {
  enabled: boolean
  query: string | null
}

export default function useTrackSearchTrendingView({ enabled, query }: Params) {
  const trimmedQuery = query?.trim() ?? ''
  const trackedQueryRef = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled || !trimmedQuery || document.visibilityState !== 'visible') {
      return
    }

    if (trackedQueryRef.current === trimmedQuery) {
      return
    }

    const storageKey = SessionStorageKeyMap.searchTrendingView(trimmedQuery)
    if (isRecentlyTracked(storageKey)) {
      return
    }

    trackedQueryRef.current = trimmedQuery
    markTracked(storageKey)

    void postSearchTrendingView(trimmedQuery).then((ok) => {
      if (!ok) {
        trackedQueryRef.current = null
        unmarkTracked(storageKey)
      }
    })
  }, [enabled, trimmedQuery])
}

function isRecentlyTracked(storageKey: string): boolean {
  try {
    const trackedAt = Number(sessionStorage.getItem(storageKey))
    return Number.isFinite(trackedAt) && Date.now() - trackedAt < TRACKING_COOLDOWN_MS
  } catch {
    return false
  }
}

function markTracked(storageKey: string) {
  try {
    sessionStorage.setItem(storageKey, String(Date.now()))
  } catch {
    // Ignore storage failures. The view can still be sent once for this render.
  }
}

async function postSearchTrendingView(query: string): Promise<boolean> {
  try {
    await fetchAPIData<void>('/api/v1/search/trending/view', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })

    return true
  } catch (error) {
    return error instanceof ProblemDetailsError && error.status === 429
  }
}

function unmarkTracked(storageKey: string) {
  try {
    sessionStorage.removeItem(storageKey)
  } catch {
    // Ignore storage failures.
  }
}
