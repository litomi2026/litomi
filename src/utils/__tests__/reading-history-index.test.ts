import '@test/setup.dom'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import {
  clearAllReadingHistoryLocalEntries,
  readReadingHistoryIndex,
  removeReadingHistoryLocalEntries,
  writeReadingHistoryIndex,
} from '../reading-history-index'

describe('reading-history-index local cleanup', () => {
  const userId = 7

  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  test('선택 삭제 시 지정한 작품의 session storage와 인덱스만 제거한다', () => {
    sessionStorage.setItem('reading-history-101', '12')
    sessionStorage.setItem('reading-history-202', '24')
    sessionStorage.setItem('unrelated-key', 'keep')
    writeReadingHistoryIndex(
      userId,
      [
        { mangaId: 101, lastPage: 12 },
        { mangaId: 202, lastPage: 24 },
      ],
      { notify: false },
    )

    let notifiedUserId: number | undefined
    window.addEventListener(
      'reading-history-index-updated',
      ((event: CustomEvent<{ userId?: number }>) => {
        notifiedUserId = event.detail?.userId
      }) as EventListener,
      { once: true },
    )

    removeReadingHistoryLocalEntries(userId, [101])

    expect(sessionStorage.getItem('reading-history-101')).toBeNull()
    expect(sessionStorage.getItem('reading-history-202')).toBe('24')
    expect(sessionStorage.getItem('unrelated-key')).toBe('keep')
    expect(Array.from(readReadingHistoryIndex(userId).entries())).toEqual([[202, 24]])
    expect(notifiedUserId).toBe(userId)
  })

  test('전체 삭제 시 현재 브라우저의 감상 기록 캐시를 전부 제거한다', () => {
    sessionStorage.setItem('reading-history-101', '12')
    sessionStorage.setItem('reading-history-202', '24')
    sessionStorage.setItem('reading-history-index-7', JSON.stringify({ 101: 12, 202: 24 }))
    sessionStorage.setItem('reading-history-index-99', JSON.stringify({ 1: 3 }))
    sessionStorage.setItem('unrelated-key', 'keep')

    let notifiedUserId: number | undefined
    window.addEventListener(
      'reading-history-index-updated',
      ((event: CustomEvent<{ userId?: number }>) => {
        notifiedUserId = event.detail?.userId
      }) as EventListener,
      { once: true },
    )

    clearAllReadingHistoryLocalEntries(userId)

    expect(sessionStorage.getItem('reading-history-101')).toBeNull()
    expect(sessionStorage.getItem('reading-history-202')).toBeNull()
    expect(readReadingHistoryIndex(userId).size).toBe(0)
    expect(sessionStorage.getItem('reading-history-index-99')).toBe(JSON.stringify({ 1: 3 }))
    expect(sessionStorage.getItem('unrelated-key')).toBe('keep')
    expect(notifiedUserId).toBe(userId)
  })
})
