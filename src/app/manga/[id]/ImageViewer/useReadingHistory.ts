'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { QueryKeys } from '@/constants/query'
import { SessionStorageKeyMap } from '@/constants/storage'
import useMeQuery from '@/query/useMeQuery'
import { canAccessAdultRestrictedAPIs } from '@/utils/adult-verification'
import { READING_HISTORY_INDEX_UPDATED_EVENT, readReadingHistoryIndex } from '@/utils/reading-history-index'

export default function useReadingHistory(mangaId: number) {
  const { data: me, isLoading: isMeLoading } = useMeQuery()
  const queryClient = useQueryClient()
  const userId = me?.id

  const { data: lastPage } = useQuery({
    queryKey: QueryKeys.readingHistory(mangaId),
    queryFn: async () => {
      const stored = sessionStorage.getItem(SessionStorageKeyMap.readingHistory(mangaId))

      if (stored) {
        const value = parseInt(stored, 10)
        if (Number.isFinite(value) && value > 0) {
          return value
        }
      }

      if (!me || !canAccessAdultRestrictedAPIs(me)) {
        return null
      }

      const index = readReadingHistoryIndex(me.id)
      return index.get(mangaId) ?? null
    },
    enabled: Boolean(mangaId) && !isMeLoading,
    meta: { requiresAdult: true },
  })

  // NOTE: 전체 감상 기록을 얻으면 lastPage를 즉시 최신으로 맞춰요
  useEffect(() => {
    function handleIndexUpdated(event: Event) {
      const detail = (event as CustomEvent<{ userId?: number }>).detail
      if (!detail || detail.userId !== userId) {
        return
      }
      queryClient.invalidateQueries({ queryKey: QueryKeys.readingHistory(mangaId) })
    }

    window.addEventListener(READING_HISTORY_INDEX_UPDATED_EVENT, handleIndexUpdated)
    return () => window.removeEventListener(READING_HISTORY_INDEX_UPDATED_EVENT, handleIndexUpdated)
  }, [mangaId, queryClient, userId])

  return { lastPage }
}
