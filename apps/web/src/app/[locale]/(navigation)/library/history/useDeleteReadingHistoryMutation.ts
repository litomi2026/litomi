'use client'

import type { DELETEV1ReadingHistoryBody } from '@litomi/contracts'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { QueryKeys } from '@/lib/react-query/query-keys'
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
  const t = useTranslations('Library.history')

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
          toast.warning(t('emptyClearTitle'))
        } else {
          toast.success(t('allDeleted'))
        }
      } else if (deletedCount === 0) {
        toast.warning(t('alreadyDeleted'))
      } else {
        toast.success(t('selectedDeleted', { count: deletedCount }))
      }

      onSuccess?.()
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
