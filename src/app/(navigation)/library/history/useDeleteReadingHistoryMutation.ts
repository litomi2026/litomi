'use client'

import type { InfiniteData, QueryKey } from '@tanstack/react-query'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { DELETEV1ReadingHistoryBody } from '@/backend/api/v1/library/history/DELETE'
import type { GETV1LibrarySummaryResponse } from '@/backend/api/v1/library/summary'

import { GETV1ReadingHistoryResponse } from '@/backend/api/v1/library/history/GET'
import { QueryKeys } from '@/constants/query'
import { clearAllReadingHistoryLocalEntries, removeReadingHistoryLocalEntries } from '@/utils/reading-history-index'

import { deleteReadingHistory } from './api'

type Options = {
  userId: number
  onSuccess?: () => void
}

export default function useDeleteReadingHistoryMutation({ userId, onSuccess }: Options) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteReadingHistory,
    onSuccess: ({ deletedCount }, variables) => {
      const selectedIds = variables.mode === 'selected' ? [...new Set(variables.mangaIds)] : []

      if (variables.mode === 'all') {
        clearAllReadingHistoryLocalEntries(userId)

        queryClient.setQueriesData<number | null>(
          { predicate: (query) => isReadingHistoryDetailQuery(query.queryKey) },
          () => null,
        )
      } else {
        removeReadingHistoryLocalEntries(userId, selectedIds)

        for (const mangaId of selectedIds) {
          queryClient.setQueryData<number | null>(QueryKeys.readingHistory(mangaId), null)
        }
      }

      queryClient.setQueryData<InfiniteData<GETV1ReadingHistoryResponse, string | null>>(
        QueryKeys.infiniteReadingHistory,
        (previous) => updateInfiniteReadingHistory(previous, variables),
      )

      queryClient.setQueriesData<GETV1LibrarySummaryResponse>({ queryKey: QueryKeys.librarySummaryBase }, (previous) =>
        updateLibrarySummaryHistoryCount(previous, variables, deletedCount),
      )

      queryClient.invalidateQueries({ queryKey: ['me', 'readingHistory'] })
      queryClient.invalidateQueries({ queryKey: QueryKeys.librarySummaryBase })

      if (variables.mode === 'all') {
        if (deletedCount === 0) {
          toast.warning('삭제할 감상 기록이 없어요')
        } else {
          toast.success('감상 기록을 모두 삭제했어요')
        }
      } else if (deletedCount === 0) {
        toast.warning('이미 삭제된 감상 기록이에요')
      } else {
        toast.success(`${deletedCount}개 작품의 감상 기록을 삭제했어요`)
      }

      onSuccess?.()
    },
    onError: (error) => {
      toast.warning(error instanceof Error ? error.message : '감상 기록을 삭제하지 못했어요')
    },
  })
}

function isReadingHistoryDetailQuery(queryKey: QueryKey) {
  return (
    Array.isArray(queryKey) &&
    queryKey.length === 3 &&
    queryKey[0] === 'me' &&
    queryKey[1] === 'readingHistory' &&
    typeof queryKey[2] === 'number'
  )
}

function updateInfiniteReadingHistory(
  previous: InfiniteData<GETV1ReadingHistoryResponse, string | null> | undefined,
  variables: DELETEV1ReadingHistoryBody,
) {
  if (!previous) {
    return previous
  }

  if (variables.mode === 'all') {
    const pageParam = previous.pageParams[0] ?? null

    return {
      pages: [{ items: [], nextCursor: null }],
      pageParams: [pageParam],
    }
  }

  const selectedIds = new Set(variables.mangaIds)

  return {
    ...previous,
    pages: previous.pages.map((page) => ({
      ...page,
      items: page.items.filter((item) => !selectedIds.has(item.mangaId)),
    })),
  }
}

function updateLibrarySummaryHistoryCount(
  previous: GETV1LibrarySummaryResponse | undefined,
  variables: DELETEV1ReadingHistoryBody,
  deletedCount: number,
) {
  if (!previous) {
    return previous
  }

  return {
    ...previous,
    historyCount: variables.mode === 'all' ? 0 : Math.max(previous.historyCount - deletedCount, 0),
  }
}
