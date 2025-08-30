'use client'

import { ReadingHistoryItem } from '@/app/manga/[id]/actions'

export function clearMigratedHistory() {
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (key && key.startsWith('reading-history-')) {
      sessionStorage.removeItem(key)
    }
  }
}

export function getLocalReadingHistory(): ReadingHistoryItem[] {
  const history: ReadingHistoryItem[] = []

  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (!key || !key.startsWith('reading-history-')) continue

    const mangaIdMatch = key.match(/reading-history-(\d+)/)
    if (!mangaIdMatch) continue

    const mangaId = parseInt(mangaIdMatch[1], 10)
    const lastPage = parseInt(sessionStorage.getItem(key) || '0', 10)

    if (mangaId > 0 && lastPage > 0) {
      history.push({ mangaId, lastPage, updatedAt: new Date() })
    }
  }

  return history
}
