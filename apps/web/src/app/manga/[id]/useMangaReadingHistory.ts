'use client'

import { QueryKeys } from '@litomi/domain/constants/query'
import { env } from '@litomi/env/env/client'
import { useQuery } from '@tanstack/react-query'

import type { GETV1MangaIdHistoryResponse } from '@/backend/api/v1/manga/[id]/history/GET'

import useMeQuery from '@/query/useMeQuery'
import { getAdultState, hasAdultAccess } from '@/utils/adult-verification'
import { fetchWithErrorHandling } from '@/utils/react-query-error'
import { getLocalReadingHistory } from '@/utils/reading-history-index'

const { NEXT_PUBLIC_API_ORIGIN } = env

export default function useMangaReadingHistory(mangaId: number) {
  const { data: me, isLoading: isMeLoading } = useMeQuery()
  const adultState = getAdultState(me)

  const { data: lastPage } = useQuery({
    queryKey: QueryKeys.readingHistory(mangaId),
    queryFn: async () => {
      const readingHistory = getLocalReadingHistory()[mangaId]

      if (readingHistory) {
        return readingHistory.lastPage
      }

      if (!me || !hasAdultAccess(adultState) || !me.settings.historySyncEnabled) {
        return
      }

      const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/manga/${mangaId}/history`
      const { data } = await fetchWithErrorHandling<GETV1MangaIdHistoryResponse>(url, { credentials: 'include' })

      return data
    },
    enabled: Boolean(mangaId) && !isMeLoading,
    meta: { requiresAdult: true },
  })

  return { lastPage }
}
