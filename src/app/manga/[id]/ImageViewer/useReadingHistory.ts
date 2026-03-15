'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { QueryKeys } from '@/constants/query'
import useMeQuery from '@/query/useMeQuery'
import { canAccessAdultRestrictedAPIs } from '@/utils/adult-verification'
import { LOCAL_READING_HISTORY_UPDATED_EVENT, readLocalReadingHistoryEntry } from '@/utils/local-reading-history'
import { READING_HISTORY_INDEX_UPDATED_EVENT, readReadingHistoryIndex } from '@/utils/reading-history-index'

export default function useReadingHistory(mangaId: number) {
  const { data: me, isLoading: isMeLoading } = useMeQuery()
  const queryClient = useQueryClient()
  const userId = me?.id

  const { data: lastPage } = useQuery({
    queryKey: QueryKeys.readingHistory(mangaId),
    queryFn: async () => {
      const localEntry = readLocalReadingHistoryEntry(mangaId)

      if (localEntry) {
        return localEntry.lastPage
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
    function handleLocalHistoryUpdated(event: Event) {
      const detail = (event as CustomEvent<{ mangaIds?: number[] }>).detail

      if (detail?.mangaIds && !detail.mangaIds.includes(mangaId)) {
        return
      }

      queryClient.invalidateQueries({ queryKey: QueryKeys.readingHistory(mangaId) })
    }

    function handleIndexUpdated(event: Event) {
      const detail = (event as CustomEvent<{ userId?: number }>).detail
      if (!detail || detail.userId !== userId) {
        return
      }
      queryClient.invalidateQueries({ queryKey: QueryKeys.readingHistory(mangaId) })
    }

    window.addEventListener(LOCAL_READING_HISTORY_UPDATED_EVENT, handleLocalHistoryUpdated)
    window.addEventListener(READING_HISTORY_INDEX_UPDATED_EVENT, handleIndexUpdated)

    return () => {
      window.removeEventListener(LOCAL_READING_HISTORY_UPDATED_EVENT, handleLocalHistoryUpdated)
      window.removeEventListener(READING_HISTORY_INDEX_UPDATED_EVENT, handleIndexUpdated)
    }
  }, [mangaId, queryClient, userId])

  return { lastPage }
}
