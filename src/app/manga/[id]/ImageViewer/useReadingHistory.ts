'use client'

import { useQuery } from '@tanstack/react-query'

import type { GETV1MangaIdHistoryResponse } from '@/backend/api/v1/manga/[id]/history/GET'

import { QueryKeys } from '@/constants/query'
import { SessionStorageKeyMap } from '@/constants/storage'
import { env } from '@/env/client'
import useMeQuery from '@/query/useMeQuery'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

export default function useReadingHistory(mangaId: number) {
  const { data: me, isLoading: isMeLoading } = useMeQuery()

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

      if (!me) {
        return null
      }

      const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/manga/${mangaId}/history`
      const { data, response } = await fetchWithErrorHandling<GETV1MangaIdHistoryResponse>(url, {
        credentials: 'include',
      })

      if (response.status === 204) {
        return null
      }

      return data
    },
    enabled: Boolean(mangaId) && !isMeLoading,
  })

  return { lastPage }
}
