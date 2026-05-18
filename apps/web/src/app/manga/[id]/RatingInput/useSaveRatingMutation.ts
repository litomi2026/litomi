'use client'

import type { GETV1MangaIdRatingResponse, PUTV1MangaIdRatingResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_API_ORIGIN } = env

type Variables = {
  mangaId: number
  rating: number // 0 = cancel (DELETE)
}

export function useSaveRatingMutation() {
  const queryClient = useQueryClient()

  return useMutation<GETV1MangaIdRatingResponse, unknown, Variables>({
    mutationFn: async ({ mangaId, rating }) => {
      const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/manga/${mangaId}/rating`

      if (rating === 0) {
        await fetchWithErrorHandling<void>(url, { method: 'DELETE', credentials: 'include' })
        return null
      }

      const { data } = await fetchWithErrorHandling<PUTV1MangaIdRatingResponse>(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rating }),
      })

      return { rating: data.rating, updatedAt: data.updatedAt }
    },
    onSuccess: (data, { mangaId }) => {
      queryClient.setQueryData<GETV1MangaIdRatingResponse>(QueryKeys.userRating(mangaId), data)
      queryClient.invalidateQueries({ queryKey: QueryKeys.ratingsBase })
      queryClient.invalidateQueries({ queryKey: QueryKeys.librarySummaryBase })
    },
  })
}
