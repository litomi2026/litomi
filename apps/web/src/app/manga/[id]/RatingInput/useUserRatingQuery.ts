'use client'

import type { GETV1MangaIdRatingResponse } from '@litomi/contracts/api/manga'

import { QueryKeys } from '@litomi/domain/constants/query'
import { env } from '@litomi/env/env/client'
import { useQuery } from '@tanstack/react-query'

import useMeQuery from '@/query/useMeQuery'
import { fetchWithErrorHandling, ProblemDetailsError } from '@/utils/react-query-error'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function fetchUserRating(mangaId: number) {
  try {
    const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/manga/${mangaId}/rating`
    const { data } = await fetchWithErrorHandling<GETV1MangaIdRatingResponse>(url, { credentials: 'include' })
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
