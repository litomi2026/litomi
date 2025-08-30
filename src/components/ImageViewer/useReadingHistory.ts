'use client'

import { useQuery } from '@tanstack/react-query'

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
        const response = await fetch(`/api/manga/${mangaId}/reading-history`)
        const lastPage = await handleResponseError<number>(response)
        return lastPage
      } else {
        const stored = sessionStorage.getItem(SessionStorageKeyMap.readingHistory(mangaId))
        return stored ? parseInt(stored, 10) : null
      }
    },
    enabled: Boolean(mangaId) && !isMeLoading,
  })

  return { lastPage }
}
