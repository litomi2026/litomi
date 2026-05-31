'use client'

import type {
  DELETEV1BookmarkBody,
  GETV1BookmarkIdResponse,
  GETV1BookmarkResponse,
  GETV1LibrarySummaryResponse,
} from '@litomi/contracts'
import type { InfiniteData } from '@tanstack/react-query'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { QueryKeys } from '@/lib/react-query/query-keys'

import type { BulkActionDescriptor } from '../bulkActionTypes'

import { useLibrarySelection } from '../librarySelection'
import { deleteBookmarks } from './api'

export default function useBulkDeleteBookmarkAction(): BulkActionDescriptor {
  const queryClient = useQueryClient()
  const { exit, selectedCount, selectedIds } = useLibrarySelection()
  const t = useTranslations('Library.bulk')

  const mutation = useMutation({
    mutationFn: deleteBookmarks,
    onSuccess: ({ deletedCount }, variables) => {
      const deletedIds = new Set(variables.mangaIds)

      queryClient.setQueryData<GETV1BookmarkIdResponse>(QueryKeys.bookmarks, (previous) =>
        updateBookmarkIds(previous, deletedIds),
      )

      queryClient.setQueriesData<InfiniteData<GETV1BookmarkResponse, string | null>>(
        { queryKey: QueryKeys.infiniteBookmarksBase },
        (previous) => updateInfiniteBookmarks(previous, deletedIds),
      )

      queryClient.setQueriesData<GETV1LibrarySummaryResponse>({ queryKey: QueryKeys.librarySummaryBase }, (previous) =>
        updateBookmarkCount(previous, deletedCount),
      )

      queryClient.invalidateQueries({ queryKey: QueryKeys.bookmarks })
      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteBookmarksBase })
      queryClient.invalidateQueries({ queryKey: QueryKeys.librarySummaryBase })

      if (deletedCount === 0) {
        toast.warning(t('bookmarkDelete.alreadyDeleted'))
      } else {
        toast.success(t('bookmarkDelete.success', { count: deletedCount }))
      }

      exit()
    },
  })

  return {
    ariaLabel: t('bookmarkDelete.title'),
    confirmLabel: t('bookmarkDelete.label'),
    description: t('bookmarkDelete.description', { count: selectedCount }),
    icon: Trash2,
    id: 'delete-bookmarks',
    label: t('bookmarkDelete.label'),
    onConfirm: () => {
      mutation.mutate({
        mangaIds: Array.from(selectedIds),
      } satisfies DELETEV1BookmarkBody)
    },
    pending: mutation.isPending,
    title: t('bookmarkDelete.title'),
    tone: 'danger',
    type: 'confirm',
    warning: t('bookmarkDelete.warning'),
  }
}

function updateBookmarkCount(previous: GETV1LibrarySummaryResponse | undefined, deletedCount: number) {
  if (!previous) {
    return previous
  }

  return {
    ...previous,
    bookmarkCount: Math.max(previous.bookmarkCount - deletedCount, 0),
  }
}

function updateBookmarkIds(previous: GETV1BookmarkIdResponse | undefined, deletedIds: Set<number>) {
  if (!previous) {
    return previous
  }

  return {
    mangaIds: previous.mangaIds.filter((mangaId) => !deletedIds.has(mangaId)),
  }
}

function updateInfiniteBookmarks(
  previous: InfiniteData<GETV1BookmarkResponse, string | null> | undefined,
  deletedIds: Set<number>,
) {
  if (!previous) {
    return previous
  }

  return {
    ...previous,
    pages: previous.pages.map((page) => ({
      ...page,
      bookmarks: page.bookmarks.filter((bookmark) => !deletedIds.has(bookmark.mangaId)),
    })),
  }
}
