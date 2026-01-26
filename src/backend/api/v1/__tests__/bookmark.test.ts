import { beforeAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'

import type { Env } from '@/backend'

import bookmarkRoutes from '../bookmark'

let shouldThrowDatabaseError = false
const mockBookmarks: Map<number, Array<{ mangaId: number; createdAt: Date }>> = new Map()

type BookmarkItem = {
  mangaId: number
  createdAt: number
}

type BookmarkResponse = {
  bookmarks: BookmarkItem[]
  nextCursor: string | null
}

type TestEnv = Env & {
  Bindings: {
    userId?: number
    isAdult?: boolean
  }
}

const app = new Hono<TestEnv>()
app.use('*', contextStorage())
app.use('*', async (c, next) => {
  const userId = c.env.userId
  if (typeof userId === 'number') {
    c.set('userId', userId)
    c.set('isAdult', c.env.isAdult ?? true)
  }
  await next()
})
app.route('/', bookmarkRoutes)

beforeAll(() => {
  spyOn(console, 'error').mockImplementation(() => {})
})

mock.module('@/sql/selectBookmarks', () => ({
  default: async ({
    userId,
    limit,
    cursorId,
    cursorTime,
  }: {
    userId: number | string
    limit?: number
    cursorId?: string
    cursorTime?: string
  }) => {
    if (shouldThrowDatabaseError) {
      throw new Error('Database connection failed')
    }

    const userBookmarks = mockBookmarks.get(Number(userId)) || []

    let filtered = [...userBookmarks]

    if (cursorTime) {
      const cursorDate = new Date(cursorTime)
      filtered = filtered.filter((b) => {
        if (b.createdAt < cursorDate) return true
        if (b.createdAt.getTime() === cursorDate.getTime() && cursorId) {
          return b.mangaId < Number(cursorId)
        }
        return false
      })
    }

    filtered.sort((a, b) => {
      if (b.createdAt.getTime() !== a.createdAt.getTime()) {
        return b.createdAt.getTime() - a.createdAt.getTime()
      }
      return b.mangaId - a.mangaId
    })

    if (limit) {
      filtered = filtered.slice(0, limit)
    }

    return filtered
  },
}))

describe('GET /api/v1/bookmark', () => {
  beforeEach(() => {
    shouldThrowDatabaseError = false
    mockBookmarks.clear()
  })

  describe('성공', () => {
    test('인증된 사용자가 북마크 목록을 성공적으로 조회한다', async () => {
      // Given
      mockBookmarks.set(1, [
        { mangaId: 100, createdAt: new Date('2025-01-03') },
        { mangaId: 200, createdAt: new Date('2025-01-02') },
        { mangaId: 300, createdAt: new Date('2025-01-01') },
      ])

      // When
      const response = await app.request('/', {}, { userId: 1 })

      // Then
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('application/json')

      const data = (await response.json()) as BookmarkResponse
      expect(data.bookmarks).toHaveLength(3)
      expect(data.bookmarks[0].mangaId).toBe(100)
      expect(data.bookmarks[1].mangaId).toBe(200)
      expect(data.bookmarks[2].mangaId).toBe(300)
      expect(data.nextCursor).toBeNull()
    })

    test('북마크가 없는 경우 200 응답을 받는다', async () => {
      // Given
      mockBookmarks.set(1, [])

      // When
      const response = await app.request('/', {}, { userId: 1 })

      // Then
      const data = (await response.json()) as BookmarkResponse
      expect(response.status).toBe(200)
      expect(data.bookmarks).toHaveLength(0)
      expect(data.nextCursor).toBeNull()
    })

    test('limit을 지정하면 해당 개수만큼 반환하고 nextCursor를 포함한다', async () => {
      // Given
      mockBookmarks.set(1, [
        { mangaId: 100, createdAt: new Date('2025-01-05') },
        { mangaId: 200, createdAt: new Date('2025-01-04') },
        { mangaId: 300, createdAt: new Date('2025-01-03') },
        { mangaId: 400, createdAt: new Date('2025-01-02') },
        { mangaId: 500, createdAt: new Date('2025-01-01') },
      ])

      // When
      const response = await app.request('/?limit=3', {}, { userId: 1 })

      // Then
      expect(response.status).toBe(200)
      const data = (await response.json()) as BookmarkResponse
      expect(data.bookmarks).toHaveLength(3)
      expect(data.bookmarks[0].mangaId).toBe(100)
      expect(data.bookmarks[1].mangaId).toBe(200)
      expect(data.bookmarks[2].mangaId).toBe(300)
      expect(data.nextCursor).toBeDefined()
      expect(data.nextCursor).not.toBeNull()
    })

    test('cursor를 사용하여 페이지네이션이 동작한다', async () => {
      // Given
      const date1 = new Date('2025-01-03')
      mockBookmarks.set(1, [
        { mangaId: 100, createdAt: new Date('2025-01-05') },
        { mangaId: 200, createdAt: new Date('2025-01-04') },
        { mangaId: 300, createdAt: date1 },
        { mangaId: 400, createdAt: new Date('2025-01-02') },
        { mangaId: 500, createdAt: new Date('2025-01-01') },
      ])

      const cursor = `${date1.getTime()}-300`

      // When
      const response = await app.request(`/?cursor=${cursor}`, {}, { userId: 1 })

      // Then
      expect(response.status).toBe(200)
      const data = (await response.json()) as BookmarkResponse
      expect(data.bookmarks).toHaveLength(2)
      expect(data.bookmarks[0].mangaId).toBe(400)
      expect(data.bookmarks[1].mangaId).toBe(500)
    })

    test('응답에 Cache-Control 헤더가 포함되어 있다', async () => {
      // Given
      mockBookmarks.set(1, [{ mangaId: 100, createdAt: new Date() }])

      // When
      const response = await app.request('/', {}, { userId: 1 })

      // Then
      expect(response.status).toBe(200)
      expect(response.headers.get('cache-control')).toBeDefined()
      expect(response.headers.get('cache-control')).toContain('private')
      expect(response.headers.get('cache-control')).toContain('max-age=3')
    })
  })

  describe('실패', () => {
    test('인증되지 않은 사용자는 401 응답을 받는다', async () => {
      // When
      const response = await app.request('/', {}, {})

      // Then
      expect(response.status).toBe(401)
    })

    test('유효하지 않은 cursor는 400 응답을 받는다', async () => {
      // When - 잘못된 형식
      const invalidResponse = await app.request('/?cursor=invalid', {}, { userId: 1 })
      expect(invalidResponse.status).toBe(400)

      // When - 음수 값
      const negativeResponse = await app.request('/?cursor=-100-200', {}, { userId: 1 })
      expect(negativeResponse.status).toBe(400)
    })

    test('유효하지 않은 limit은 400 응답을 받는다', async () => {
      // When - 음수 limit
      const negativeResponse = await app.request('/?limit=-1', {}, { userId: 1 })
      expect(negativeResponse.status).toBe(400)

      // When - 0
      const zeroResponse = await app.request('/?limit=0', {}, { userId: 1 })
      expect(zeroResponse.status).toBe(400)

      // When - 문자열
      const stringResponse = await app.request('/?limit=abc', {}, { userId: 1 })
      expect(stringResponse.status).toBe(400)
    })

    test('데이터베이스 연결 오류 시 500 응답을 반환한다', async () => {
      // Given
      shouldThrowDatabaseError = true

      // When
      const response = await app.request('/', {}, { userId: 1 })

      // Then
      expect(response.status).toBe(500)
    })
  })

  describe('기타', () => {
    test('동시에 여러 요청을 보내는 경우 일관된 응답을 반환한다', async () => {
      // Given
      mockBookmarks.set(1, [
        { mangaId: 100, createdAt: new Date('2025-01-02') },
        { mangaId: 200, createdAt: new Date('2025-01-01') },
      ])

      // When
      const promises = Array.from({ length: 5 }, () => app.request('/', {}, { userId: 1 }))
      const responses = await Promise.all(promises)

      // Then
      expect(responses.every((r) => r.status === 200)).toBe(true)

      const data = (await Promise.all(responses.map((r) => r.json()))) as BookmarkResponse[]
      expect(data.every((d) => d.bookmarks.length === 2)).toBe(true)
      expect(data.every((d) => d.bookmarks[0].mangaId === 100)).toBe(true)
    })

    test('서로 다른 사용자의 북마크는 독립적으로 조회된다', async () => {
      // Given
      mockBookmarks.set(1, [{ mangaId: 100, createdAt: new Date() }])
      mockBookmarks.set(2, [
        { mangaId: 200, createdAt: new Date('2025-01-02') },
        { mangaId: 300, createdAt: new Date('2025-01-01') },
      ])

      // When
      const response1 = await app.request('/', {}, { userId: 1 })
      const response2 = await app.request('/', {}, { userId: 2 })

      // Then
      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)

      const data1 = (await response1.json()) as BookmarkResponse
      const data2 = (await response2.json()) as BookmarkResponse
      expect(data1.bookmarks).toHaveLength(1)
      expect(data2.bookmarks).toHaveLength(2)
      expect(data1.bookmarks[0].mangaId).toBe(100)
      expect(data2.bookmarks[0].mangaId).toBe(200)
      expect(data2.bookmarks[1].mangaId).toBe(300)
    })

    test('데이터베이스 오류 후 복구되는 경우 정상 응답을 반환한다', async () => {
      // Given - 첫 번째 요청은 실패
      shouldThrowDatabaseError = true
      const errorResponse = await app.request('/', {}, { userId: 1 })
      expect(errorResponse.status).toBe(500)

      // When - 두 번째 요청은 성공
      shouldThrowDatabaseError = false
      mockBookmarks.set(1, [{ mangaId: 100, createdAt: new Date() }])
      const successResponse = await app.request('/', {}, { userId: 1 })

      // Then
      expect(successResponse.status).toBe(200)
      const data = (await successResponse.json()) as BookmarkResponse
      expect(data.bookmarks).toHaveLength(1)
      expect(data.bookmarks[0].mangaId).toBe(100)
    })

    test('limit과 cursor를 함께 사용하여 페이지네이션이 정상 동작한다', async () => {
      // Given
      const date1 = new Date('2025-01-05')
      mockBookmarks.set(1, [
        { mangaId: 100, createdAt: new Date('2025-01-07') },
        { mangaId: 200, createdAt: new Date('2025-01-06') },
        { mangaId: 300, createdAt: date1 },
        { mangaId: 400, createdAt: new Date('2025-01-04') },
        { mangaId: 500, createdAt: new Date('2025-01-03') },
        { mangaId: 600, createdAt: new Date('2025-01-02') },
      ])

      const cursor = `${date1.getTime()}-300`

      // When
      const response = await app.request(`/?cursor=${cursor}&limit=2`, {}, { userId: 1 })

      // Then
      expect(response.status).toBe(200)
      const data = (await response.json()) as BookmarkResponse
      expect(data.bookmarks).toHaveLength(2)
      expect(data.bookmarks[0].mangaId).toBe(400)
      expect(data.bookmarks[1].mangaId).toBe(500)
      expect(data.nextCursor).toBeDefined()
      expect(data.nextCursor).not.toBeNull()
    })
  })

  describe('보안', () => {
    test('Cache-Control 헤더가 private으로 설정되어 공유 캐시에 저장되지 않는다', async () => {
      // Given
      mockBookmarks.set(1, [{ mangaId: 100, createdAt: new Date() }])

      // When
      const response = await app.request('/', {}, { userId: 1 })

      // Then
      expect(response.status).toBe(200)
      expect(response.headers.get('cache-control')).toContain('private')
      expect(response.headers.get('cache-control')).not.toContain('public')
    })

    test('북마크 목록에 createdAt이 타임스탬프로 변환되어 반환된다', async () => {
      // Given
      const testDate = new Date('2025-01-01T12:00:00Z')
      mockBookmarks.set(1, [{ mangaId: 100, createdAt: testDate }])

      // When
      const response = await app.request('/', {}, { userId: 1 })

      // Then
      expect(response.status).toBe(200)
      const data = (await response.json()) as BookmarkResponse
      expect(data.bookmarks[0].createdAt).toBe(testDate.getTime())
      expect(typeof data.bookmarks[0].createdAt).toBe('number')
    })
  })
})
