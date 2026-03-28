'use client'

import { SessionStorageKeyMap } from '@/constants/storage'

export const READING_HISTORY_INDEX_UPDATED_EVENT = 'reading-history-index-updated'
const READING_HISTORY_STORAGE_PREFIX = 'reading-history-'
const READING_HISTORY_INDEX_STORAGE_PREFIX = 'reading-history-index-'

type ReadingHistoryIndexStorageShape = Record<string, number>

export function clearAllReadingHistoryLocalEntries(userId: number) {
  clearAllReadingHistorySessionEntries()
  clearReadingHistoryIndex(userId, { notify: true })
}

export function clearAllReadingHistorySessionEntries() {
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i)

      if (
        key &&
        key.startsWith(READING_HISTORY_STORAGE_PREFIX) &&
        !key.startsWith(READING_HISTORY_INDEX_STORAGE_PREFIX)
      ) {
        sessionStorage.removeItem(key)
      }
    }
  } catch {
    // ignore
  }
}

export function clearReadingHistoryIndex(userId: number, options?: { notify?: boolean }) {
  writeReadingHistoryIndex(userId, [], options)
}

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

export function removeReadingHistoryIndexEntries(
  userId: number,
  mangaIds: Iterable<number>,
  options?: { notify?: boolean },
) {
  const current = readReadingHistoryIndex(userId)

  for (const mangaId of mangaIds) {
    current.delete(mangaId)
  }

  const readingHistories = Array.from(current.entries()).map(([id, page]) => ({ mangaId: id, lastPage: page }))
  writeReadingHistoryIndex(userId, readingHistories, options)
}

export function removeReadingHistoryLocalEntries(userId: number, mangaIds: Iterable<number>) {
  const ids = Array.from(mangaIds)
  removeReadingHistorySessionEntries(ids)
  removeReadingHistoryIndexEntries(userId, ids, { notify: true })
}

export function removeReadingHistorySessionEntries(mangaIds: Iterable<number>) {
  for (const mangaId of mangaIds) {
    try {
      sessionStorage.removeItem(SessionStorageKeyMap.readingHistory(mangaId))
    } catch {
      // ignore
    }
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
    window.dispatchEvent(new window.CustomEvent(READING_HISTORY_INDEX_UPDATED_EVENT, { detail: { userId } }))
  }
}
