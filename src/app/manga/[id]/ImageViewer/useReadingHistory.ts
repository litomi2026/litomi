'use client'

import { useQuery } from '@tanstack/react-query'

import { GETV1MangaIdHistoryResponse } from '@/backend/api/v1/manga/[id]/history'
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
      if (me) {
        const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/manga/${mangaId}/history`
        const { data } = await fetchWithErrorHandling<GETV1MangaIdHistoryResponse>(url, { credentials: 'include' })
        return data
      } else {
        const stored = sessionStorage.getItem(SessionStorageKeyMap.readingHistory(mangaId))
        return stored ? parseInt(stored, 10) : null
      }
    },
    enabled: Boolean(mangaId) && !isMeLoading,
  })

  return { lastPage }
}
