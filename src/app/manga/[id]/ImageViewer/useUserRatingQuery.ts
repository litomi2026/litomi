'use client'

import { useQuery } from '@tanstack/react-query'

import { GETMangaIdRatingResponse } from '@/app/api/manga/[id]/rating/route'
import { QueryKeys } from '@/constants/query'
import useMeQuery from '@/query/useMeQuery'
import { handleResponseError } from '@/utils/react-query-error'

export async function fetchUserRating(mangaId: number) {
  const response = await fetch(`/api/manga/${mangaId}/rating`)
  return handleResponseError<GETMangaIdRatingResponse>(response)
}

export function useUserRatingQuery(mangaId: number) {
  const { data: me } = useMeQuery()

  return useQuery({
    queryKey: QueryKeys.userRating(mangaId),
    queryFn: () => fetchUserRating(mangaId),
    enabled: Boolean(me),
  })
}
