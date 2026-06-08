'use client'
import { useEffect, useRef } from 'react'

import { SessionStorageKeyMap } from '@/storage'
import { fetchAPIData } from '@/utils/api-request'
import { ProblemDetailsError } from '@/utils/fetch-response'

import { removeLanguageConditions } from './searchLanguage'

const TRACKING_COOLDOWN_MS = 10 * 60 * 1000

type Params = {
  enabled: boolean
  query: string | null
}

export default function useTrackSearchTrendingView({ enabled, query }: Params) {
  const trackableQuery = normalizeTrackableQuery(query)
  const trackedQueryRef = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled || !trackableQuery || document.visibilityState !== 'visible') {
      return
    }

    if (trackedQueryRef.current === trackableQuery) {
      return
    }

    const storageKey = SessionStorageKeyMap.searchTrendingView(trackableQuery)
    if (isRecentlyTracked(storageKey)) {
      return
    }

    trackedQueryRef.current = trackableQuery
    markTracked(storageKey)

    void postSearchTrendingView(trackableQuery).then((ok) => {
      if (!ok) {
        trackedQueryRef.current = null
        unmarkTracked(storageKey)
      }
    })
  }, [enabled, trackableQuery])
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

function normalizeTrackableQuery(query: string | null) {
  return removeLanguageConditions(query)?.split(/\s+/).filter(Boolean).join(' ') ?? ''
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
