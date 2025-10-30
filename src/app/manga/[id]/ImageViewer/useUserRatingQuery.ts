'use client'

import { useQuery } from '@tanstack/react-query'

import { GETV1MangaIdRatingResponse } from '@/backend/api/v1/manga/[id]/rating'
import { NEXT_PUBLIC_BACKEND_URL } from '@/constants/env'
import { QueryKeys } from '@/constants/query'
import useMeQuery from '@/query/useMeQuery'
import { handleResponseError } from '@/utils/react-query-error'

export async function fetchUserRating(mangaId: number) {
  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/manga/${mangaId}/rating`
  const response = await fetch(url, { credentials: 'include' })
  return handleResponseError<GETV1MangaIdRatingResponse>(response)
}

export function useUserRatingQuery(mangaId: number) {
  const { data: me } = useMeQuery()

  return useQuery({
    queryKey: QueryKeys.userRating(mangaId),
    queryFn: () => fetchUserRating(mangaId),
    enabled: Boolean(me),
  })
}
