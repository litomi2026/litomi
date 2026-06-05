'use client'

import type { GETV1MangaIdHistoryResponse } from '@litomi/contracts'

import { useQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import useMeQuery from '@/query/useMeQuery'
import { isAdultVerified } from '@/utils/adult-verification'
import { fetchAPIData } from '@/utils/api-request'
import { getLocalReadingHistory } from '@/utils/reading-history-index'

export default function useMangaReadingHistory(mangaId: number) {
  const { data: me } = useMeQuery()

  const { data: lastPage } = useQuery({
    queryKey: QueryKeys.readingHistory(mangaId),
    queryFn: async () => {
      const readingHistory = getLocalReadingHistory()[mangaId]

      if (readingHistory) {
        return readingHistory.lastPage
      }

      if (!isAdultVerified(me) || !me?.settings.historySyncEnabled) {
        return null
      }

      const url = `/api/v1/manga/${mangaId}/history`

      const { data } = await fetchAPIData<GETV1MangaIdHistoryResponse | undefined>(url, {})

      return data ?? null
    },
    enabled: Boolean(mangaId) && me !== undefined,
    meta: { requiresAdult: true },
  })

  return { lastPage }
}
