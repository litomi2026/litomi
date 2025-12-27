import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import type { POSTV1BookmarkImportResponse } from '@/backend/api/v1/bookmark/import'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'

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
      const response = await fetch(`${NEXT_PUBLIC_BACKEND_URL}/api/v1/bookmark/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mode, bookmarks }),
      })

      if (!response.ok) {
        const message = await response.text().catch(() => '')
        throw {
          status: response.status,
          error: message || '북마크 가져오기에 실패했어요',
        }
      }

      const successData = (await response.json()) as POSTV1BookmarkImportResponse
      return {
        imported: successData.imported,
        skipped: successData.skipped,
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.bookmarks })
      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteBookmarks })
    },
    onError: (error) => {
      const apiError = error as { status?: number; error?: string }

      if (typeof apiError.status === 'number' && typeof apiError.error === 'string') {
        if (apiError.status >= 400 && apiError.status < 500) {
          toast.warning(apiError.error)
        } else {
          toast.error(apiError.error)
        }

        if (apiError.status === 401) {
          queryClient.setQueriesData({ queryKey: QueryKeys.me }, () => null)
        }
        return
      }

      if (error instanceof Error) {
        if (!navigator.onLine) {
          toast.error('네트워크 연결을 확인해 주세요')
        } else {
          toast.error('요청 처리 중 오류가 발생했어요')
        }
      }
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
