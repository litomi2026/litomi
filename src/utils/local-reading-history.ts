'use client'

import { SessionStorageKeyMap } from '@/constants/storage'

export const LOCAL_READING_HISTORY_UPDATED_EVENT = 'local-reading-history-updated'

const READING_HISTORY_KEY_PATTERN = /^reading-history-(\d+)$/

export type LocalReadingHistoryEntry = {
  lastPage: number
  updatedAt: number
  pending: boolean
}

export type PendingReadingHistorySnapshotItem = {
  mangaId: number
  lastPage: number
  updatedAt: number
}

type LocalReadingHistoryUpdatedDetail = {
  mangaIds?: number[]
}

export function getPendingReadingHistorySnapshot(): PendingReadingHistorySnapshotItem[] {
  return listLocalReadingHistoryEntries()
    .filter(({ entry }) => entry.pending)
    .map(({ mangaId, entry }) => ({
      mangaId,
      lastPage: entry.lastPage,
      updatedAt: entry.updatedAt,
    }))
}

export function getPendingReadingHistorySnapshotKey(items: Iterable<PendingReadingHistorySnapshotItem>): string | null {
  const normalized = Array.from(items).sort((left, right) => {
    const updatedAtDiff = right.updatedAt - left.updatedAt

    if (updatedAtDiff !== 0) {
      return updatedAtDiff
    }

    return right.mangaId - left.mangaId
  })

  if (normalized.length === 0) {
    return null
  }

  return normalized.map((item) => `${item.mangaId}:${item.lastPage}:${item.updatedAt}`).join('|')
}

export function listLocalReadingHistoryEntries(): Array<{ mangaId: number; entry: LocalReadingHistoryEntry }> {
  const items: Array<{ mangaId: number; entry: LocalReadingHistoryEntry }> = []

  try {
    for (let index = 0; index < sessionStorage.length; index++) {
      const key = sessionStorage.key(index)
      const match = key?.match(READING_HISTORY_KEY_PATTERN)

      if (!match) {
        continue
      }

      const mangaId = Number(match[1])
      const entry = readLocalReadingHistoryEntry(mangaId)

      if (!entry) {
        continue
      }

      items.push({ mangaId, entry })
    }
  } catch {
    return []
  }

  return items.sort((left, right) => {
    const updatedAtDiff = right.entry.updatedAt - left.entry.updatedAt

    if (updatedAtDiff !== 0) {
      return updatedAtDiff
    }

    return right.mangaId - left.mangaId
  })
}

export function markReadingHistorySnapshotSyncedIfUnchanged(items: Iterable<PendingReadingHistorySnapshotItem>) {
  const changedMangaIds: number[] = []

  for (const item of items) {
    const current = readLocalReadingHistoryEntry(item.mangaId)

    if (!current || !current.pending) {
      continue
    }

    if (current.lastPage !== item.lastPage || current.updatedAt !== item.updatedAt) {
      continue
    }

    const updated = setLocalReadingHistoryEntry(item.mangaId, { ...current, pending: false }, { notify: false })

    if (updated) {
      changedMangaIds.push(item.mangaId)
    }
  }

  if (changedMangaIds.length > 0) {
    dispatchLocalReadingHistoryUpdated(changedMangaIds)
    return true
  }

  return false
}

export function readLocalReadingHistoryEntry(mangaId: number): LocalReadingHistoryEntry | null {
  try {
    const raw = sessionStorage.getItem(SessionStorageKeyMap.readingHistory(mangaId))

    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as unknown

    return isLocalReadingHistoryEntry(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function writeLocalReadingHistoryEntry(
  mangaId: number,
  entry: LocalReadingHistoryEntry,
  options?: { notify?: boolean },
) {
  return setLocalReadingHistoryEntry(mangaId, entry, options)
}

function dispatchLocalReadingHistoryUpdated(mangaIds?: number[]) {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(
    new CustomEvent<LocalReadingHistoryUpdatedDetail>(LOCAL_READING_HISTORY_UPDATED_EVENT, { detail: { mangaIds } }),
  )
}

function isLocalReadingHistoryEntry(value: unknown): value is LocalReadingHistoryEntry {
  if (!value || typeof value !== 'object') {
    return false
  }

  const entry = value as Record<string, unknown>

  return (
    Number.isInteger(entry.lastPage) &&
    Number(entry.lastPage) > 0 &&
    Number.isInteger(entry.updatedAt) &&
    Number(entry.updatedAt) > 0 &&
    typeof entry.pending === 'boolean'
  )
}

function setLocalReadingHistoryEntry(mangaId: number, entry: LocalReadingHistoryEntry, options?: { notify?: boolean }) {
  try {
    sessionStorage.setItem(SessionStorageKeyMap.readingHistory(mangaId), JSON.stringify(entry))

    if (options?.notify !== false) {
      dispatchLocalReadingHistoryUpdated([mangaId])
    }

    return true
  } catch {
    return false
  }
}
