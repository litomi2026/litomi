import { describe, expect, test } from 'bun:test'

import { decodeLibraryListCursor, encodeLibraryListCursor } from '../cursor'

describe('라이브러리 목록 커서', () => {
  test('정렬 기준 카운트를 인코딩하고 디코딩한다', () => {
    const cursor = encodeLibraryListCursor(1, 42, 13, 1742353200000, 7)

    expect(cursor).toBe('1-42-13-1742353200000-7')
    expect(decodeLibraryListCursor(cursor)).toEqual({
      isOwner: 1,
      sortCount: 42,
      itemCount: 13,
      timestamp: 1742353200000,
      id: 7,
    })
  })

  test('잘못된 정렬 기준 카운트는 거부한다', () => {
    expect(decodeLibraryListCursor('0-nope-13-1742353200000-7')).toBeNull()
  })
})
