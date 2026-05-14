'use client'

import { QueryKeys } from '@litomi/domain/constants/query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { DELETEV1ReadingHistoryBody } from '@/backend/api/v1/library/history/DELETE'

import {
  getLocalReadingHistory,
  removeLocalReadingHistory,
  removeLocalReadingHistoryEntries,
} from '@/utils/reading-history-index'

import type { ReadingHistorySource } from './common'

import { deleteReadingHistory } from './api'

type Options = {
  source: ReadingHistorySource
  onSuccess?: () => void
}

export default function useDeleteReadingHistoryMutation({ source, onSuccess }: Options) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: DELETEV1ReadingHistoryBody) =>
      source === 'local' ? deleteLocalReadingHistory(body) : deleteReadingHistory(body),

    onSuccess: ({ deletedCount }, variables) => {
      if (variables.mode === 'all') {
        removeLocalReadingHistory()
      } else {
        removeLocalReadingHistoryEntries(variables.mangaIds)
      }

      queryClient.invalidateQueries({ queryKey: QueryKeys.readingHistoryBase })
      queryClient.invalidateQueries({ queryKey: QueryKeys.localReadingHistorySummary })

      if (source === 'server') {
        queryClient.invalidateQueries({ queryKey: QueryKeys.librarySummaryBase })
      }

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

async function deleteLocalReadingHistory(body: DELETEV1ReadingHistoryBody) {
  const localHistory = getLocalReadingHistory()

  if (body.mode === 'all') {
    return { deletedCount: Object.keys(localHistory).length }
  }

  const selectedIds = new Set(body.mangaIds)
  const deletedCount = Array.from(selectedIds).filter((mangaId) => localHistory[mangaId]).length

  return { deletedCount }
}
