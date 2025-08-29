'use client'

import { useQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/constants/query'
import { SessionStorageKeyMap } from '@/constants/storage'
import useMeQuery from '@/query/useMeQuery'
import { handleResponseError } from '@/utils/react-query-error'

import { type ReadingHistoryResponse } from './actions'

export default function useReadingHistory(mangaId: number) {
  const { data: user } = useMeQuery()

  const { data: lastPage } = useQuery({
    queryKey: QueryKeys.readingHistory(mangaId),
    queryFn: async () => {
      if (user) {
        const response = await fetch(`/api/manga/${mangaId}/reading-history`)
        const data = await handleResponseError<ReadingHistoryResponse>(response)
        return data.lastPage
      } else {
        const stored = sessionStorage.getItem(SessionStorageKeyMap.readingHistory(mangaId))
        return stored ? parseInt(stored, 10) : null
      }
    },
    enabled: Boolean(mangaId),
  })

  return { lastPage }
}
