'use client'

import type { InfiniteData } from '@tanstack/react-query'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import type { DELETEV1BookmarkBody } from '@/backend/api/v1/bookmark/DELETE'
import type { GETV1BookmarkResponse } from '@/backend/api/v1/bookmark/GET'
import type { GETV1BookmarkIdResponse } from '@/backend/api/v1/bookmark/id'
import type { GETV1LibrarySummaryResponse } from '@/backend/api/v1/library/summary'

import { QueryKeys } from '@/constants/query'
import { ProblemDetailsError } from '@/utils/react-query-error'

import type { BulkActionDescriptor } from '../bulkActionTypes'

import { useLibrarySelection } from '../librarySelection'
import { deleteBookmarks } from './api'

export default function useBulkDeleteBookmarkAction(): BulkActionDescriptor {
  const queryClient = useQueryClient()
  const { exit, selectedCount, selectedIds } = useLibrarySelection()

  const mutation = useMutation({
    mutationFn: deleteBookmarks,
    onSuccess: ({ deletedCount }, variables) => {
      const deletedIds = new Set(variables.mangaIds)

      queryClient.setQueryData<GETV1BookmarkIdResponse>(QueryKeys.bookmarks, (previous) =>
        updateBookmarkIds(previous, deletedIds),
      )

      queryClient.setQueryData<InfiniteData<GETV1BookmarkResponse, string | null>>(
        QueryKeys.infiniteBookmarks,
        (previous) => updateInfiniteBookmarks(previous, deletedIds),
      )

      queryClient.setQueriesData<GETV1LibrarySummaryResponse>({ queryKey: QueryKeys.librarySummaryBase }, (previous) =>
        updateBookmarkCount(previous, deletedCount),
      )

      queryClient.invalidateQueries({ queryKey: QueryKeys.bookmarks })
      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteBookmarks })
      queryClient.invalidateQueries({ queryKey: QueryKeys.librarySummaryBase })

      if (deletedCount === 0) {
        toast.warning('이미 삭제된 북마크예요')
      } else {
        toast.success(`${deletedCount}개 작품의 북마크를 삭제했어요`)
      }

      exit()
    },
    onError: (error) => {
      toast.warning(error instanceof ProblemDetailsError ? error.problem.detail : '북마크를 삭제하지 못했어요')
    },
  })

  return {
    ariaLabel: '북마크 삭제',
    confirmLabel: '삭제',
    description: `선택한 ${selectedCount}개 작품을 북마크에서 삭제할까요?`,
    icon: Trash2,
    id: 'delete-bookmarks',
    label: '삭제',
    onConfirm: () => {
      mutation.mutate({
        mangaIds: Array.from(selectedIds),
      } satisfies DELETEV1BookmarkBody)
    },
    pending: mutation.isPending,
    title: '북마크 삭제',
    tone: 'danger',
    type: 'confirm',
    warning: '삭제한 북마크는 되돌릴 수 없어요.',
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
