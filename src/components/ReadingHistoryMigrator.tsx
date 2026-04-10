'use client'

import type { POSTV1MangaHistoryImportBody } from '@/backend/api/v1/manga/history/import'

export type LocalReadingHistoryItem = POSTV1MangaHistoryImportBody['localHistories'][number]

export function clearMigratedHistory() {
  for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const key = sessionStorage.key(i)
    if (key && key.startsWith('reading-history-')) {
      sessionStorage.removeItem(key)
    }
  }
}

export function getLocalReadingHistory(): LocalReadingHistoryItem[] {
  const history: LocalReadingHistoryItem[] = []

  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (!key || !key.startsWith('reading-history-')) continue

    const mangaIdMatch = key.match(/reading-history-(\d+)/)
    if (!mangaIdMatch) continue

    const mangaId = parseInt(mangaIdMatch[1], 10)
    const lastPage = parseInt(sessionStorage.getItem(key) || '0', 10)

    if (mangaId > 0 && lastPage > 0) {
      history.push({ mangaId, lastPage, updatedAt: Date.now() })
    }
  }

  return history
}
