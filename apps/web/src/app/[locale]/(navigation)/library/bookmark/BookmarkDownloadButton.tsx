'use client'

import type { GETV1BookmarkExportResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'
import { useMutation } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Download } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

import { fetchAPIData } from '@/utils/api-request'
import { downloadBlob } from '@/utils/download'

const { NEXT_PUBLIC_API_ORIGIN } = env

export default function BookmarkDownloadButton() {
  const t = useTranslations('Library.bookmark')

  const exportMutation = useMutation({
    mutationFn: async () => {
      const url = new URL('/api/v1/bookmark/export', NEXT_PUBLIC_API_ORIGIN)
      const { data } = await fetchAPIData<GETV1BookmarkExportResponse>(url)
      return data.bookmarks
    },

    onSuccess: (bookmarks) => {
      if (bookmarks.length === 0) {
        toast.warning(t('downloadEmpty'))
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
      toast.success(t('downloadSuccess'))
    },
  })

  function getDisabledTitle() {
    if (exportMutation.isPending) {
      return t('downloading')
    }

    return t('download')
  }

  function handleExport() {
    if (exportMutation.isPending) {
      return
    }

    exportMutation.mutate()
  }

  return (
    <button
      className={twMerge(
        'flex items-center gap-2 text-sm font-semibold border-2 border-zinc-700 rounded-xl w-fit px-2.5 py-1.5 transition bg-zinc-800/50',
        'hover:bg-zinc-700/50 hover:border-zinc-600 active:bg-zinc-800 disabled:text-zinc-500 disabled:bg-zinc-800/30 disabled:border-zinc-800',
      )}
      disabled={exportMutation.isPending}
      onClick={handleExport}
      title={getDisabledTitle()}
      type="button"
    >
      <Download className="size-5" />
      <span className="hidden md:block">{t('backup')}</span>
    </button>
  )
}
