import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import type { POSTV1BookmarkImportResponse } from '@/backend/api/v1/bookmark/import'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

import type { BookmarkExportData, ImportMode, ImportResult, ImportState } from './types'

const { NEXT_PUBLIC_BACKEND_URL } = env

export function useBookmarkImport() {
  const [importMode, setImportMode] = useState<ImportMode>('merge')
  const [previewData, setPreviewData] = useState<BookmarkExportData | null>(null)
  const queryClient = useQueryClient()

  const importMutation = useMutation<
    { imported: number; skipped: number },
    unknown,
    { mode: ImportMode; bookmarks: BookmarkExportData['bookmarks'] }
  >({
    mutationFn: async ({ mode, bookmarks }) => {
      const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/bookmark/import`

      const { data } = await fetchWithErrorHandling<POSTV1BookmarkImportResponse>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mode, bookmarks }),
      })

      return {
        imported: data.imported,
        skipped: data.skipped,
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.bookmarks })
      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteBookmarks })
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

  const reset = () => {
    setPreviewData(null)
    importMutation.reset()
  }

  const handleFileLoad = (data: BookmarkExportData) => {
    setPreviewData(data)
    importMutation.reset()
  }

  const performImport = () => {
    if (!previewData || importMutation.isPending) {
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
