import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { QueryKeys } from '@/constants/query'
import useServerAction from '@/hook/useServerAction'

import type { BookmarkExportData, ImportState } from './types'

import { importBookmarks, ImportMode } from './action'

export function useBookmarkImport() {
  const [importState, setImportState] = useState<ImportState>('idle')
  const [importMode, setImportMode] = useState<ImportMode>('merge')
  const [previewData, setPreviewData] = useState<BookmarkExportData | null>(null)
  const queryClient = useQueryClient()

  const [importResult, dispatchAction] = useServerAction({
    action: importBookmarks,
    onError: () => {
      setImportState('preview')
    },
    onSuccess: () => {
      setImportState('complete')
      queryClient.invalidateQueries({ queryKey: QueryKeys.bookmarks })
    },
  })

  const reset = () => {
    setImportState('idle')
    setPreviewData(null)
  }

  const handleFileLoad = (data: BookmarkExportData) => {
    setPreviewData(data)
    setImportState('preview')
  }

  const performImport = () => {
    if (!previewData) {
      return
    }

    setImportState('importing')
    dispatchAction(previewData.bookmarks, importMode)
  }

  return {
    importMode,
    importResult: importResult && 'data' in importResult ? importResult.data : null,
    importState,
    handleFileLoad,
    performImport,
    previewData,
    reset,
    setImportMode,
  }
}
