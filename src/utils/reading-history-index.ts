'use client'

import { SessionStorageKeyMap } from '@/constants/storage'

export const READING_HISTORY_INDEX_UPDATED_EVENT = 'reading-history-index-updated'

type ReadingHistoryIndexStorageShape = Record<string, number>

export function readReadingHistoryIndex(userId: number): Map<number, number> {
  const key = SessionStorageKeyMap.readingHistoryIndex(userId)
  const raw = sessionStorage.getItem(key)

  if (!raw) {
    return new Map()
  }

  try {
    const parsed = JSON.parse(raw) as ReadingHistoryIndexStorageShape
    const result = new Map<number, number>()
    for (const [mangaIdStr, lastPage] of Object.entries(parsed)) {
      result.set(Number(mangaIdStr), lastPage)
    }
    return result
  } catch {
    return new Map()
  }
}

export function upsertReadingHistoryIndexEntry(userId: number, mangaId: number, lastPage: number) {
  const current = readReadingHistoryIndex(userId)
  current.set(mangaId, lastPage)
  const readingHistories = Array.from(current.entries()).map(([id, page]) => ({ mangaId: id, lastPage: page }))
  writeReadingHistoryIndex(userId, readingHistories)
}

export function writeReadingHistoryIndex(
  userId: number,
  items: Iterable<{ mangaId: number; lastPage: number }>,
  options?: { notify?: boolean },
) {
  const map: ReadingHistoryIndexStorageShape = {}

  for (const item of items) {
    map[String(item.mangaId)] = item.lastPage
  }

  const key = SessionStorageKeyMap.readingHistoryIndex(userId)

  try {
    sessionStorage.setItem(key, JSON.stringify(map))
  } catch {
    // ignore
  }

  if (options?.notify) {
    window.dispatchEvent(new CustomEvent(READING_HISTORY_INDEX_UPDATED_EVENT, { detail: { userId } }))
  }
}
