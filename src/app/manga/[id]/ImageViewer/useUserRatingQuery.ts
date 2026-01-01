'use client'

import { useQuery } from '@tanstack/react-query'

import { GETV1MangaIdRatingResponse } from '@/backend/api/v1/manga/[id]/rating/GET'
import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import useMeQuery from '@/query/useMeQuery'
import { fetchWithErrorHandling, ProblemDetailsError } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

export async function fetchUserRating(mangaId: number) {
  try {
    const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/manga/${mangaId}/rating`
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
