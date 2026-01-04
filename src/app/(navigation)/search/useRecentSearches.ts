'use client'

import { useEffect, useState } from 'react'

import { MAX_RECENT_SEARCHES } from '@/constants/policy'
import { LocalStorageKey } from '@/constants/storage'

export type RecentSearch = {
  query: string
  timestamp: number
}

export default function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([])
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true)

  function saveRecentSearch(query: string) {
    if (!query.trim()) {
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
  }

  function removeRecentSearch(query: string) {
    setRecentSearches((prev) => {
      const updated = prev.filter((search) => search.query !== query)

      try {
        localStorage.setItem(LocalStorageKey.RECENT_SEARCHES, JSON.stringify(updated))
      } catch (error) {
        console.error('removeRecentSearch:', error)
      }

      return updated
    })
  }

  function setAutoSaveEnabled(enabled: boolean) {
    setIsAutoSaveEnabled(enabled)

    try {
      localStorage.setItem(LocalStorageKey.RECENT_SEARCHES_ENABLED, String(enabled))
    } catch (error) {
      console.error('setAutoSaveEnabled:', error)
    }
  }

  // NOTE: 로컬 스토리지에서 최근 검색어 및 설정 불러오기
  useEffect(() => {
    try {
      const enabledStored = localStorage.getItem(LocalStorageKey.RECENT_SEARCHES_ENABLED)
      const enabled = enabledStored === null ? true : enabledStored === 'true'
      setIsAutoSaveEnabled(enabled)

      const stored = localStorage.getItem(LocalStorageKey.RECENT_SEARCHES)
      if (stored) {
        const parsed: unknown = JSON.parse(stored)

        if (!Array.isArray(parsed)) {
          return
        }

        const safeParsed: RecentSearch[] = parsed
          .filter((item): item is RecentSearch => {
            if (typeof item !== 'object' || item === null) {
              return false
            }
            if (!('query' in item) || !('timestamp' in item)) {
              return false
            }
            const { query, timestamp } = item as { query: unknown; timestamp: unknown }
            return typeof query === 'string' && typeof timestamp === 'number'
          })
          .slice(0, MAX_RECENT_SEARCHES)

        setRecentSearches(safeParsed)
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error)
    }
  }, [])

  return {
    recentSearches,
    isAutoSaveEnabled,
    saveRecentSearch,
    removeRecentSearch,
    setAutoSaveEnabled,
  }
}
