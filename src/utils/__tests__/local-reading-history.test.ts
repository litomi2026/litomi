import { beforeEach, describe, expect, test } from 'bun:test'

import {
  getPendingReadingHistorySnapshot,
  getPendingReadingHistorySnapshotKey,
  markReadingHistorySnapshotSyncedIfUnchanged,
  readLocalReadingHistoryEntry,
  writeLocalReadingHistoryEntry,
} from '@/utils/local-reading-history'

describe('local reading history', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  test('JSON 포맷의 로컬 읽기 기록을 읽고 쓴다', () => {
    const didWrite = writeLocalReadingHistoryEntry(123, {
      lastPage: 17,
      updatedAt: 1_745_000_000_000,
      pending: true,
    })

    expect(didWrite).toBe(true)
    expect(readLocalReadingHistoryEntry(123)).toEqual({
      lastPage: 17,
      updatedAt: 1_745_000_000_000,
      pending: true,
    })
  })

  test('pending 스냅샷만 모으고 안정적인 snapshot key를 만든다', () => {
    writeLocalReadingHistoryEntry(3, { lastPage: 10, updatedAt: 3000, pending: false })
    writeLocalReadingHistoryEntry(2, { lastPage: 20, updatedAt: 2000, pending: true })
    writeLocalReadingHistoryEntry(1, { lastPage: 30, updatedAt: 4000, pending: true })

    const snapshot = getPendingReadingHistorySnapshot()

    expect(snapshot).toEqual([
      { mangaId: 1, lastPage: 30, updatedAt: 4000 },
      { mangaId: 2, lastPage: 20, updatedAt: 2000 },
    ])
    expect(getPendingReadingHistorySnapshotKey(snapshot)).toBe('1:30:4000|2:20:2000')
  })

  test('같은 스냅샷일 때만 synced 처리하고 더 최신 로컬 기록은 유지한다', () => {
    writeLocalReadingHistoryEntry(1, { lastPage: 9, updatedAt: 1000, pending: true })
    writeLocalReadingHistoryEntry(2, { lastPage: 12, updatedAt: 2000, pending: true })

    writeLocalReadingHistoryEntry(2, { lastPage: 15, updatedAt: 3000, pending: true })

    const changed = markReadingHistorySnapshotSyncedIfUnchanged([
      { mangaId: 1, lastPage: 9, updatedAt: 1000 },
      { mangaId: 2, lastPage: 12, updatedAt: 2000 },
    ])

    expect(changed).toBe(true)
    expect(readLocalReadingHistoryEntry(1)).toEqual({
      lastPage: 9,
      updatedAt: 1000,
      pending: false,
    })
    expect(readLocalReadingHistoryEntry(2)).toEqual({
      lastPage: 15,
      updatedAt: 3000,
      pending: true,
    })
  })
})
