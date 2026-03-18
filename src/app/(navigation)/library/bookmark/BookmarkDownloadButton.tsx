'use client'

import { useMutation } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Download } from 'lucide-react'
import { toast } from 'sonner'

import type { GETV1BookmarkExportResponse } from '@/backend/api/v1/bookmark/export'

import { env } from '@/env/client'
import { downloadBlob } from '@/utils/download'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

export default function BookmarkDownloadButton() {
  const exportMutation = useMutation({
    mutationFn: async () => {
      const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/bookmark/export`
      const { data } = await fetchWithErrorHandling<GETV1BookmarkExportResponse>(url, { credentials: 'include' })
      return data.bookmarks
    },
    onSuccess: (bookmarks) => {
      if (bookmarks.length === 0) {
        toast.warning('다운로드할 북마크가 없어요')
        return
      }

      const exportData = {
        exportedAt: new Date().toISOString(),
        totalCount: bookmarks.length,
        bookmarks: bookmarks.map((bookmark) => ({
          mangaId: bookmark.mangaId,
          createdAt: new Date(bookmark.createdAt || Date.now()).toISOString(),
        })),
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const filename = `litomi-bookmarks-${dayjs().format('YYYY-MM-DD')}.json`
      downloadBlob(blob, filename)
      toast.success('북마크를 다운로드했어요')
    },
  })

  function getDisabledTitle() {
    if (exportMutation.isPending) {
      return '북마크 가져오는 중'
    }

    return '북마크 다운로드'
  }

  function handleExport() {
    if (exportMutation.isPending) {
      return
    }

    exportMutation.mutate()
  }

  return (
    <button
      className="flex items-center gap-2 text-sm font-semibold border-2 border-zinc-700 rounded-xl w-fit px-2.5 py-1.5 transition bg-zinc-800/50 
      hover:bg-zinc-700/50 hover:border-zinc-600 active:bg-zinc-800 disabled:text-zinc-500 disabled:bg-zinc-800/30 disabled:border-zinc-800"
      disabled={exportMutation.isPending}
      onClick={handleExport}
      title={getDisabledTitle()}
      type="button"
    >
      <Download className="size-5" />
      <span className="hidden sm:block">북마크 다운로드</span>
    </button>
  )
}
