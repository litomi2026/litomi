import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { BookmarkExportData } from '@/app/(navigation)/(right-search)/[name]/bookmark/constants'
import { ImportMode, ImportResult } from '@/app/api/bookmark/import/route'
import { QueryKeys } from '@/constants/query'

import type { ImportState } from './types'

export function useBookmarkImport() {
  const [importState, setImportState] = useState<ImportState>('idle')
  const [importMode, setImportMode] = useState<ImportMode>('merge')
  const [previewData, setPreviewData] = useState<BookmarkExportData | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const queryClient = useQueryClient()

  const reset = () => {
    setImportState('idle')
    setPreviewData(null)
    setImportResult(null)
  }

  const handleFileLoad = (data: BookmarkExportData) => {
    setPreviewData(data)
    setImportState('preview')
  }

  const performImport = async () => {
    if (!previewData) {
      return
    }

    setImportState('importing')

    try {
      const response = await fetch(`/api/bookmark/import?mode=${importMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(previewData),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || '업로드 중 오류가 발생했어요')
        setImportState('preview')
        return
      }

      setImportResult(result as ImportResult)
      setImportState('complete')

      await queryClient.invalidateQueries({ queryKey: QueryKeys.bookmarks })
    } catch (error) {
      console.error('Import error:', error)
      toast.error('업로드 중 오류가 발생했어요')
      setImportState('preview')
    }
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
