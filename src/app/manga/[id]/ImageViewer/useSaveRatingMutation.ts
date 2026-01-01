'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { GETV1MangaIdRatingResponse } from '@/backend/api/v1/manga/[id]/rating/GET'
import type { PUTV1MangaIdRatingResponse } from '@/backend/api/v1/manga/[id]/rating/PUT'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { fetchWithErrorHandling, ProblemDetailsError } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

type Variables = {
  mangaId: number
  rating: number // 0 = cancel (DELETE)
}

export function useSaveRatingMutation() {
  const queryClient = useQueryClient()

  return useMutation<GETV1MangaIdRatingResponse, unknown, Variables>({
    mutationFn: async ({ mangaId, rating }) => {
      const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/manga/${mangaId}/rating`

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
      queryClient.invalidateQueries({ queryKey: ['me', 'ratings'] })
      queryClient.invalidateQueries({ queryKey: ['library', 'summary'] })
    },
    onError: (error) => {
      if (error instanceof ProblemDetailsError) {
        if (error.status >= 400 && error.status < 500) {
          toast.warning(error.message)
        } else {
          toast.error(error.message)
        }
        return
      }

      if (error instanceof Error) {
        if (!navigator.onLine) {
          toast.error('네트워크 연결을 확인해 주세요')
        } else {
          toast.error('요청 처리 중 오류가 발생했어요')
        }
      }
    },
  })
}


