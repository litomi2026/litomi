'use client'

import { useQuery } from '@tanstack/react-query'

import { GETV1MangaIdHistoryResponse } from '@/backend/api/v1/manga/[id]/history'
import { NEXT_PUBLIC_BACKEND_URL } from '@/constants/env'
import { QueryKeys } from '@/constants/query'
import { SessionStorageKeyMap } from '@/constants/storage'
import useMeQuery from '@/query/useMeQuery'
import { handleResponseError } from '@/utils/react-query-error'

export default function useReadingHistory(mangaId: number) {
  const { data: me, isLoading: isMeLoading } = useMeQuery()

  const { data: lastPage } = useQuery({
    queryKey: QueryKeys.readingHistory(mangaId),
    queryFn: async () => {
      if (me) {
        const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/manga/${mangaId}/history`
        const response = await fetch(url, { credentials: 'include' })
        return await handleResponseError<GETV1MangaIdHistoryResponse>(response)
      } else {
        const stored = sessionStorage.getItem(SessionStorageKeyMap.readingHistory(mangaId))
        return stored ? parseInt(stored, 10) : null
      }
    },
    enabled: Boolean(mangaId) && !isMeLoading,
  })

  return { lastPage }
}
