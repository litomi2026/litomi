'use client'

import type {
  DELETEV1LibraryRatingBody,
  GETV1LibrarySummaryResponse,
  GETV1MangaIdRatingResponse,
  GETV1RatingsResponse,
} from '@litomi/contracts'
import type { InfiniteData } from '@tanstack/react-query'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { QueryKeys } from '@/lib/react-query/query-keys'

import type { BulkActionDescriptor } from '../bulkActionTypes'

import { useLibrarySelection } from '../librarySelection'
import { deleteRatings } from './api'

export default function useBulkDeleteRatingAction(): BulkActionDescriptor {
  const queryClient = useQueryClient()
  const { exit, selectedCount, selectedIds } = useLibrarySelection()
  const t = useTranslations('Library.bulk')

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
        toast.warning(t('ratingDelete.alreadyDeleted'))
      } else {
        toast.success(t('ratingDelete.success', { count: deletedCount }))
      }

      exit()
    },
  })

  return {
    ariaLabel: t('ratingDelete.title'),
    confirmLabel: t('ratingDelete.label'),
    description: t('ratingDelete.description', { count: selectedCount }),
    icon: Trash2,
    id: 'delete-ratings',
    label: t('ratingDelete.label'),
    onConfirm: () => {
      mutation.mutate({
        mangaIds: Array.from(selectedIds),
      } satisfies DELETEV1LibraryRatingBody)
    },
    pending: mutation.isPending,
    title: t('ratingDelete.title'),
    tone: 'danger',
    type: 'confirm',
    warning: t('ratingDelete.warning'),
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
