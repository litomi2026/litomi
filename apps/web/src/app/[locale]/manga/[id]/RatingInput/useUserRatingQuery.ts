'use client'

import type { GETV1MangaIdRatingResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'
import { useQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import useMeQuery from '@/query/useMeQuery'
import { fetchAPIData, ProblemDetailsError } from '@/utils/api-request'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function fetchUserRating(mangaId: number) {
  try {
    const url = new URL(`/api/v1/manga/${mangaId}/rating`, NEXT_PUBLIC_API_ORIGIN)
    const { data } = await fetchAPIData<GETV1MangaIdRatingResponse>(url, { credentials: 'include' })
    return data
  } catch (error) {
    if (error instanceof ProblemDetailsError && error.status === 404) {
      return null
    }
    throw error
  }
}

export function useUserRatingQuery(mangaId: number) {
  const { data: me } = useMeQuery()

  return useQuery({
    queryKey: QueryKeys.userRating(mangaId),
    queryFn: () => fetchUserRating(mangaId),
    enabled: Boolean(me),
  })
}
