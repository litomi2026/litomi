import type { POSTV1BookmarkImportResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import useAdultAccessGuard from '@/hook/useAdultAccessGuard'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

import type { BookmarkExportData, ImportMode, ImportResult, ImportState } from './types'

const { NEXT_PUBLIC_APP_ORIGIN } = env

export function useBookmarkImport() {
  const [importMode, setImportMode] = useState<ImportMode>('merge')
  const [previewData, setPreviewData] = useState<BookmarkExportData | null>(null)
  const queryClient = useQueryClient()
  const { guardAdultAccess } = useAdultAccessGuard()

  const importMutation = useMutation<
    { imported: number; skipped: number },
    unknown,
    { mode: ImportMode; bookmarks: BookmarkExportData['bookmarks'] }
  >({
    mutationFn: async ({ mode, bookmarks }) => {
      const url = new URL('/api/v1/bookmark/import', NEXT_PUBLIC_APP_ORIGIN)

      const { data } = await fetchAPIData<POSTV1BookmarkImportResponse>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, bookmarks }),
      })

      return {
        imported: data.imported,
        skipped: data.skipped,
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.bookmarks })
      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteBookmarksBase })
    },
  })

  const importState: ImportState = !previewData
    ? 'idle'
    : importMutation.isPending
      ? 'importing'
      : importMutation.isSuccess
        ? 'complete'
        : 'preview'

  const importResult: ImportResult | null = importMutation.isSuccess ? importMutation.data : null

  function reset() {
    setPreviewData(null)
    importMutation.reset()
  }

  function handleFileLoad(data: BookmarkExportData) {
    setPreviewData(data)
    importMutation.reset()
  }

  function performImport() {
    if (!previewData || importMutation.isPending || !guardAdultAccess()) {
      return
    }

    importMutation.mutate({ mode: importMode, bookmarks: previewData.bookmarks })
  }

  return {
    importMode,
    importResult,
    importState,
    handleFileLoad,
    performImport,
    previewData,
    reset,
    setImportMode,
  }
}
