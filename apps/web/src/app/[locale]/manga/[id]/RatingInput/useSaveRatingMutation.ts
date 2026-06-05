'use client'

import type { GETV1MangaIdRatingResponse, PUTV1MangaIdRatingResponse } from '@litomi/contracts'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

type Variables = {
  mangaId: number
  rating: number // 0 = cancel (DELETE)
}

export function useSaveRatingMutation() {
  const queryClient = useQueryClient()

  return useMutation<GETV1MangaIdRatingResponse, unknown, Variables>({
    mutationFn: async ({ mangaId, rating }) => {
      const url = `/api/v1/manga/${mangaId}/rating`

      if (rating === 0) {
        await fetchAPIData<void>(url, { method: 'DELETE' })
        return null
      }

      const { data } = await fetchAPIData<PUTV1MangaIdRatingResponse>(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
