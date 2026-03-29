'use client'

import type { InfiniteData } from '@tanstack/react-query'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import type { DELETEV1LibraryRatingBody } from '@/backend/api/v1/library/rating/DELETE'
import type { GETV1RatingsResponse } from '@/backend/api/v1/library/rating/GET'
import type { GETV1LibrarySummaryResponse } from '@/backend/api/v1/library/summary'
import type { GETV1MangaIdRatingResponse } from '@/backend/api/v1/manga/[id]/rating/GET'

import { QueryKeys } from '@/constants/query'
import { ProblemDetailsError } from '@/utils/react-query-error'

import type { BulkActionDescriptor } from '../bulkActionTypes'

import { useLibrarySelection } from '../librarySelection'
import { deleteRatings } from './api'

export default function useBulkDeleteRatingAction(): BulkActionDescriptor {
  const queryClient = useQueryClient()
  const { exit, selectedCount, selectedIds } = useLibrarySelection()

  const mutation = useMutation({
    mutationFn: deleteRatings,
    onSuccess: ({ deletedCount }, variables) => {
      const deletedIds = new Set(variables.mangaIds)

      for (const mangaId of deletedIds) {
        queryClient.setQueryData<GETV1MangaIdRatingResponse>(QueryKeys.userRating(mangaId), null)
      }

      queryClient.setQueriesData<InfiniteData<GETV1RatingsResponse, string>>(
        { queryKey: QueryKeys.ratingsBase },
        (previous) => updateInfiniteRatings(previous, deletedIds),
      )

      queryClient.setQueriesData<GETV1LibrarySummaryResponse>({ queryKey: QueryKeys.librarySummaryBase }, (previous) =>
        updateRatingCount(previous, deletedCount),
      )

      queryClient.invalidateQueries({ queryKey: QueryKeys.ratingsBase })
      queryClient.invalidateQueries({ queryKey: QueryKeys.librarySummaryBase })

      if (deletedCount === 0) {
        toast.warning('이미 삭제된 평가예요')
      } else {
        toast.success(`${deletedCount}개 작품의 평가를 삭제했어요`)
      }

      exit()
    },
    onError: (error) => {
      toast.warning(error instanceof ProblemDetailsError ? error.problem.detail : '평가를 삭제하지 못했어요')
    },
  })

  return {
    ariaLabel: '평가 삭제',
    confirmLabel: '삭제',
    description: `선택한 ${selectedCount}개 작품의 평가를 삭제할까요?`,
    icon: Trash2,
    id: 'delete-ratings',
    label: '삭제',
    onConfirm: () => {
      mutation.mutate({
        mangaIds: Array.from(selectedIds),
      } satisfies DELETEV1LibraryRatingBody)
    },
    pending: mutation.isPending,
    title: '평가 삭제',
    tone: 'danger',
    type: 'confirm',
    warning: '삭제한 평가는 되돌릴 수 없어요.',
  }
}

function updateInfiniteRatings(
  previous: InfiniteData<GETV1RatingsResponse, string> | undefined,
  deletedIds: Set<number>,
) {
  if (!previous) {
    return previous
  }

  return {
    ...previous,
    pages: previous.pages.map((page) => ({
      ...page,
      items: page.items.filter((item) => !deletedIds.has(item.mangaId)),
    })),
  }
}

function updateRatingCount(previous: GETV1LibrarySummaryResponse | undefined, deletedCount: number) {
  if (!previous) {
    return previous
  }

  return {
    ...previous,
    ratingCount: Math.max(previous.ratingCount - deletedCount, 0),
  }
}
