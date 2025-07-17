'use client'

import { toast } from 'sonner'

import useBookmarksQuery from '@/query/useBookmarksQuery'
import { downloadBlob } from '@/utils/download'

import { IconDownload } from './icons/IconDownload'

export default function BookmarkDownloadButton() {
  const { data, isLoading } = useBookmarksQuery()
  const disabled = isLoading || !data || data.bookmarks.length === 0

  function getDisabledTitle() {
    if (isLoading) {
      return '북마크를 가져오는 중이에요'
    }
    if (!data || data.bookmarks.length === 0) {
      return '북마크가 없어요'
    }

    return '북마크 다운로드'
  }

  async function handleExport() {
    if (isLoading || !data) {
      return
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      totalCount: data.bookmarks.length,
      bookmarks: data.bookmarks.map((bookmark) => ({
        mangaId: bookmark.mangaId,
        source: bookmark.source,
        createdAt: new Date(bookmark.createdAt || Date.now()).toISOString(),
      })),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const filename = `litomi-bookmarks-${new Date().toISOString().split('T')[0]}.json`
    downloadBlob(blob, filename)
    toast.success('북마크를 다운로드했어요')
  }

  return (
    <button
      className="flex items-center gap-2 text-sm font-semibold border-2 rounded-xl w-fit px-2.5 py-1.5 transition hover:bg-zinc-800 active:bg-zinc-900 disabled:text-zinc-500 disabled:bg-zinc-800"
      disabled={disabled}
      onClick={handleExport}
      title={getDisabledTitle()}
      type="button"
    >
      <IconDownload className="w-5" />
      <span className="hidden sm:block">북마크 다운로드</span>
    </button>
  )
}
