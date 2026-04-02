'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import type { GETV1MangaIdHistoryResponse } from '@/backend/api/v1/manga/[id]/history/GET'

import { QueryKeys } from '@/constants/query'
import { SessionStorageKeyMap } from '@/constants/storage'
import { env } from '@/env/client'
import useMeQuery from '@/query/useMeQuery'
import { getAdultState, hasAdultAccess } from '@/utils/adult-verification'
import { fetchWithErrorHandling } from '@/utils/react-query-error'
import { READING_HISTORY_INDEX_UPDATED_EVENT, readReadingHistoryIndex } from '@/utils/reading-history-index'

const { NEXT_PUBLIC_API_ORIGIN } = env

export default function useReadingHistory(mangaId: number) {
  const { data: me, isLoading: isMeLoading } = useMeQuery()
  const queryClient = useQueryClient()
  const userId = me?.id
  const adultState = getAdultState(me)

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

      if (!me || !hasAdultAccess(adultState) || !me.settings.historySyncEnabled) {
        return null
      }

      const index = readReadingHistoryIndex(me.id)
      const indexedLastPage = index.get(mangaId)

      if (indexedLastPage != null) {
        return indexedLastPage
      }

      const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/manga/${mangaId}/history`
      const { data } = await fetchWithErrorHandling<GETV1MangaIdHistoryResponse>(url, { credentials: 'include' })

      return data ?? null
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
