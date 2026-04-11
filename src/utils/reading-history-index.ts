'use client'

import { SessionStorageKeyMap } from '@/constants/storage'

type LocalReadingHistory = Record<string, LocalReadingHistoryStorageEntry>

type LocalReadingHistoryStorageEntry = {
  lastPage: number
  updatedAt: number
}

export function getLocalReadingHistory(): LocalReadingHistory {
  try {
    const raw = sessionStorage.getItem(SessionStorageKeyMap.readingHistory())

    if (!raw) {
      return {}
    }

    const parsed = JSON.parse(raw)

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }

    const readingHistory: LocalReadingHistory = {}

    for (const [mangaId, value] of Object.entries(parsed)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        continue
      }

      const { lastPage, updatedAt } = value as Partial<LocalReadingHistoryStorageEntry>

      if (
        typeof lastPage !== 'number' ||
        !Number.isFinite(lastPage) ||
        typeof updatedAt !== 'number' ||
        !Number.isFinite(updatedAt)
      ) {
        continue
      }

      readingHistory[mangaId] = { lastPage, updatedAt }
    }

    return readingHistory
  } catch {
    return {}
  }
}

export function getLocalReadingHistoryArray() {
  return Object.entries(getLocalReadingHistory())
    .map(([mangaId, entry]) => ({
      mangaId: Number(mangaId),
      lastPage: entry.lastPage,
      updatedAt: entry.updatedAt,
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt || b.mangaId - a.mangaId)
}

export function removeLocalReadingHistory() {
  try {
    sessionStorage.removeItem(SessionStorageKeyMap.readingHistory())
  } catch {
    // ignore
  }
}

export function removeLocalReadingHistoryEntries(mangaIds: Iterable<number>) {
  const readingHistory = getLocalReadingHistory()
  let changed = false

  for (const mangaId of mangaIds) {
    if (!(String(mangaId) in readingHistory)) {
      continue
    }

    delete readingHistory[String(mangaId)]
    changed = true
  }

  if (changed) {
    setLocalReadingHistory(readingHistory)
  }
}

export function setLocalReadingHistoryEntry(mangaId: number, lastPage: number) {
  const readingHistory = getLocalReadingHistory()

  readingHistory[String(mangaId)] = {
    lastPage,
    updatedAt: Date.now(),
  }

  setLocalReadingHistory(readingHistory)
}

function setLocalReadingHistory(readingHistory: LocalReadingHistory) {
  try {
    if (Object.keys(readingHistory).length === 0) {
      sessionStorage.removeItem(SessionStorageKeyMap.readingHistory())
      return
    }

    sessionStorage.setItem(SessionStorageKeyMap.readingHistory(), JSON.stringify(readingHistory))
  } catch {
    // ignore
  }
}
