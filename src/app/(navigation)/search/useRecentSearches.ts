'use client'

import { useCallback, useEffect, useState } from 'react'

import { MAX_RECENT_SEARCHES } from '@/constants/policy'
import { LocalStorageKey } from '@/constants/storage'

export type RecentSearch = {
  query: string
  timestamp: number
}

export default function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([])
  const [isEnabled, setIsEnabled] = useState(true)

  const saveRecentSearch = useCallback(
    (query: string) => {
      if (!isEnabled || !query.trim()) {
        return
      }

      const newSearch: RecentSearch = {
        query: query.trim(),
        timestamp: Date.now(),
      }

      setRecentSearches((prev) => {
        const filtered = prev.filter((search) => search.query !== newSearch.query)
        const updated = [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES)

        try {
          localStorage.setItem(LocalStorageKey.RECENT_SEARCHES, JSON.stringify(updated))
        } catch (error) {
          console.error('saveRecentSearch:', error)
        }

        return updated
      })
    },
    [isEnabled],
  )

  const removeRecentSearch = useCallback((query: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((search) => search.query !== query)

      try {
        localStorage.setItem(LocalStorageKey.RECENT_SEARCHES, JSON.stringify(updated))
      } catch (error) {
        console.error('removeRecentSearch:', error)
      }

      return updated
    })
  }, [])

  const toggleEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled)

    try {
      localStorage.setItem(LocalStorageKey.RECENT_SEARCHES_ENABLED, String(enabled))
    } catch (error) {
      console.error('toggleEnabled:', error)
    }
  }, [])

  // NOTE: 로컬 스토리지에서 최근 검색어 및 설정 불러오기
  useEffect(() => {
    try {
      const enabledStored = localStorage.getItem(LocalStorageKey.RECENT_SEARCHES_ENABLED)
      const enabled = enabledStored === null ? true : enabledStored === 'true'
      setIsEnabled(enabled)

      if (!enabled) {
        return
      }

      const stored = localStorage.getItem(LocalStorageKey.RECENT_SEARCHES)
      if (stored) {
        const parsed = JSON.parse(stored) as RecentSearch[]
        setRecentSearches(parsed)
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error)
    }
  }, [])

  return {
    recentSearches,
    isEnabled,
    saveRecentSearch,
    removeRecentSearch,
    toggleEnabled,
  }
}
