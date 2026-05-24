import '@test/setup.dom'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import { SessionStorageKeyMap } from '@/storage'

import {
  getLocalReadingHistory,
  getLocalReadingHistoryArray,
  removeLocalReadingHistory,
  removeLocalReadingHistoryEntries,
  setLocalReadingHistoryEntry,
} from '../reading-history-index'

function seedLocalReadingHistory(items: { mangaId: number; lastPage: number; updatedAt: number }[]) {
  sessionStorage.setItem(
    SessionStorageKeyMap.readingHistory(),
    JSON.stringify(
      Object.fromEntries(
        items.map((item) => [
          String(item.mangaId),
          {
            lastPage: item.lastPage,
            updatedAt: item.updatedAt,
          },
        ]),
      ),
    ),
  )
}

describe('reading-history-index 로컬 정리', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  test('선택 삭제 시 지정한 작품의 로컬 인덱스만 제거한다', () => {
    seedLocalReadingHistory([
      { mangaId: 101, lastPage: 12, updatedAt: 1000 },
      { mangaId: 202, lastPage: 24, updatedAt: 2000 },
    ])
    sessionStorage.setItem('unrelated-key', 'keep')

    removeLocalReadingHistoryEntries([101])

    expect(getLocalReadingHistoryArray()).toEqual([{ mangaId: 202, lastPage: 24, updatedAt: 2000 }])
    expect(sessionStorage.getItem('unrelated-key')).toBe('keep')
  })

  test('전체 삭제 시 현재 탭의 감상 기록 캐시만 제거한다', () => {
    seedLocalReadingHistory([
      { mangaId: 101, lastPage: 12, updatedAt: 1000 },
      { mangaId: 202, lastPage: 24, updatedAt: 2000 },
    ])
    sessionStorage.setItem('unrelated-key', 'keep')

    removeLocalReadingHistory()

    expect(sessionStorage.getItem(SessionStorageKeyMap.readingHistory())).toBeNull()
    expect(getLocalReadingHistoryArray()).toEqual([])
    expect(sessionStorage.getItem('unrelated-key')).toBe('keep')
  })

  test('로컬 인덱스는 updatedAt 내림차순으로 읽는다', () => {
    seedLocalReadingHistory([
      { mangaId: 101, lastPage: 12, updatedAt: 1000 },
      { mangaId: 202, lastPage: 24, updatedAt: 3000 },
      { mangaId: 303, lastPage: 36, updatedAt: 2000 },
    ])

    expect(getLocalReadingHistoryArray()).toEqual([
      { mangaId: 202, lastPage: 24, updatedAt: 3000 },
      { mangaId: 303, lastPage: 36, updatedAt: 2000 },
      { mangaId: 101, lastPage: 12, updatedAt: 1000 },
    ])
  })

  test('업서트 시 같은 작품은 최신 페이지와 시각으로 덮어쓴다', () => {
    seedLocalReadingHistory([{ mangaId: 101, lastPage: 12, updatedAt: 1000 }])
    const originalDateNow = Date.now
    Date.now = () => 3000

    setLocalReadingHistoryEntry(101, 24)

    Date.now = originalDateNow

    expect(getLocalReadingHistoryArray()).toEqual([{ mangaId: 101, lastPage: 24, updatedAt: 3000 }])
    expect(getLocalReadingHistory()[101]).toEqual({ lastPage: 24, updatedAt: 3000 })

    const raw = sessionStorage.getItem(SessionStorageKeyMap.readingHistory())
    expect(raw).toBe('{"101":{"lastPage":24,"updatedAt":3000}}')
  })
})
