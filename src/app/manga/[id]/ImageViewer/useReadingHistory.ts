'use client'

import { useQuery } from '@tanstack/react-query'

import { GETV1MangaIdHistoryResponse } from '@/backend/api/v1/manga/[id]/history'
import { QueryKeys } from '@/constants/query'
import { SessionStorageKeyMap } from '@/constants/storage'
import { env } from '@/env/client'
import useMeQuery from '@/query/useMeQuery'
import { fetchWithErrorHandling, ProblemDetailsError } from '@/utils/react-query-error'

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

      try {
        const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/manga/${mangaId}/history`
        const { data } = await fetchWithErrorHandling<GETV1MangaIdHistoryResponse>(url, { credentials: 'include' })
        return data
      } catch (error) {
        if (error instanceof ProblemDetailsError && error.status === 404) {
          return null
        }
        throw error
      }
    },
    enabled: Boolean(mangaId) && !isMeLoading,
  })

  return { lastPage }
}
