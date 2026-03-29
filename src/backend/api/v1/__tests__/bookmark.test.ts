import { beforeAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { PgDialect } from 'drizzle-orm/pg-core'
import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'

import type { Env } from '@/backend'
import type { ValidationProblemDetails } from '@/utils/problem-details'

let shouldThrowDatabaseError = false
let mockBookmarkLimit = 500
let nextCreatedAtMs = new Date('2025-01-10T00:00:00.000Z').getTime()
const mockBookmarks: Map<number, Array<{ mangaId: number; createdAt: Date }>> = new Map()
type BookmarkRoutesModule = typeof import('../bookmark')
const dialect = new PgDialect()

let bookmarkRoutes: BookmarkRoutesModule['default']
let app: Hono<TestEnv>

type BookmarkDeleteResponse = {
  deletedCount: number
}

type BookmarkExportResponse = {
  bookmarks: BookmarkItem[]
}

type BookmarkIdResponse = {
  mangaIds: number[]
}

type BookmarkItem = {
  mangaId: number
  createdAt: number
}

type BookmarkPutResponse = {
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

function createBookmarkTx() {
  return {
    select: (fields: Record<string, unknown>) => ({
      from: () => ({
        where: (condition: unknown) => {
          const params = extractWhereParams(condition)
          const userId = Number(params.user_id ?? params.id)
          const mangaId = params.manga_id

          if ('count' in fields) {
            return createSelectableResult([{ count: getSortedBookmarks(userId).length }])
          }

          if ('createdAt' in fields) {
            const existing = (mockBookmarks.get(userId) || []).find((bookmark) => bookmark.mangaId === mangaId)
            return createSelectableResult(existing ? [{ createdAt: existing.createdAt }] : [])
          }

          return createSelectableResult([{ id: userId }])
        },
      }),
    }),
    insert: () => ({
      values: ({ userId, mangaId }: { userId: number; mangaId: number }) => ({
        returning: () => {
          const createdAt = new Date(nextCreatedAtMs)
          nextCreatedAtMs += 1000

          const userBookmarks = [...(mockBookmarks.get(userId) || [])]
          userBookmarks.push({ mangaId, createdAt })
          mockBookmarks.set(userId, userBookmarks)

          return Promise.resolve([{ createdAt }])
        },
      }),
    }),
    delete: () => ({
      where: (condition: unknown) => {
        const params = extractWhereParams(condition)
        const listParams = extractWhereListParams(condition)
        const userId = Number(params.user_id)
        const mangaIds = listParams.manga_id ?? (Number.isFinite(params.manga_id) ? [Number(params.manga_id)] : [])
        const userBookmarks = [...(mockBookmarks.get(userId) || [])]
        const deletedBookmarks = userBookmarks.filter((bookmark) => mangaIds.includes(bookmark.mangaId))
        const nextBookmarks = userBookmarks.filter((bookmark) => !mangaIds.includes(bookmark.mangaId))

        mockBookmarks.set(userId, nextBookmarks)

        const deletedRows = deletedBookmarks.map(({ mangaId }) => ({ mangaId }))
        const query = Promise.resolve(deletedRows)

        return Object.assign(query, {
          returning: () =>
            Promise.resolve(
              deletedBookmarks.map(({ mangaId }) => ({
                deleted: 1,
                mangaId,
              })),
            ),
        })
      },
    }),
  }
}

function createSelectableResult<T>(value: T) {
  const promise = Promise.resolve(value)
  return Object.assign(promise, {
    for: async () => value,
  })
}

function extractWhereListParams(condition: unknown): Record<string, number[]> {
  const params: Record<string, number[]> = {}
  const { params: queryParams, sql } = toQuery(condition)

  for (const match of sql.matchAll(/"bookmark"\."([^"]+)" in \(([^)]+)\)/g)) {
    const [, columnName, placeholders] = match
    const values = placeholders
      .split(', ')
      .map((placeholder) => queryParams[Number(placeholder.replace('$', '')) - 1])
      .filter((value): value is number => typeof value === 'number')

    params[columnName] = values
  }

  return params
}

function extractWhereParams(condition: unknown): Record<string, number> {
  const params: Record<string, number> = {}

  const { params: queryParams, sql } = toQuery(condition)

  for (const match of sql.matchAll(/"bookmark"\."([^"]+)" = \$(\d+)/g)) {
    const [, columnName, paramIndex] = match
    const value = queryParams[Number(paramIndex) - 1]

    if (typeof value === 'number') {
      params[columnName] = value
    }
  }

  return params
}

function getSortedBookmarks(userId: number | string) {
  const userBookmarks = [...(mockBookmarks.get(Number(userId)) || [])]

  return userBookmarks.sort((a, b) => {
    if (b.createdAt.getTime() !== a.createdAt.getTime()) {
      return b.createdAt.getTime() - a.createdAt.getTime()
    }

    return b.mangaId - a.mangaId
  })
}

function toQuery(condition: unknown) {
  return dialect.sqlToQuery(condition as Parameters<typeof dialect.sqlToQuery>[0])
}

mock.module('@/database/supabase/drizzle', () => ({
  db: {
    transaction: async (callback: (tx: ReturnType<typeof createBookmarkTx>) => Promise<unknown>) => {
      if (shouldThrowDatabaseError) {
        throw new Error('Database connection failed')
      }

      return callback(createBookmarkTx())
    },
  },
}))

mock.module('@/backend/api/v1/bookmark/limit', () => ({
  getBookmarkLimit: async () => mockBookmarkLimit,
}))

mock.module('@/sql/selectBookmark', () => ({
  selectBookmark: async ({
    userId,
    limit,
    cursorMangaId,
    cursorTime,
  }: {
    userId: number | string
    limit?: number
    cursorMangaId?: string
    cursorTime?: string
  }) => {
    if (shouldThrowDatabaseError) {
      throw new Error('Database connection failed')
    }

    let filtered = getSortedBookmarks(userId)

    if (cursorTime) {
      const cursorDate = new Date(cursorTime)
      filtered = filtered.filter((b) => {
        if (b.createdAt < cursorDate) return true
        if (b.createdAt.getTime() === cursorDate.getTime() && cursorMangaId) {
          return b.mangaId < Number(cursorMangaId)
        }
        return false
      })
    }

    if (limit !== undefined) {
      filtered = filtered.slice(0, limit)
    }

    return filtered
  },
  selectBookmarkId: async ({ userId }: { userId: number | string }) => {
    if (shouldThrowDatabaseError) {
      throw new Error('Database connection failed')
    }

    return getSortedBookmarks(userId).map(({ mangaId }) => ({ mangaId }))
  },
}))

beforeAll(async () => {
  spyOn(console, 'error').mockImplementation(() => {})
  bookmarkRoutes = (await import('../bookmark')).default

  app = new Hono<TestEnv>()
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
})

beforeEach(() => {
  shouldThrowDatabaseError = false
  mockBookmarkLimit = 500
  nextCreatedAtMs = new Date('2025-01-10T00:00:00.000Z').getTime()
  mockBookmarks.clear()
})

describe('GET /api/v1/bookmark', () => {
  beforeEach(() => {
    shouldThrowDatabaseError = false
    mockBookmarks.clear()
  })

  describe('성공', () => {
    test('인증된 사용자가 북마크 목록을 성공적으로 조회한다', async () => {
      // 준비
      mockBookmarks.set(1, [
        { mangaId: 100, createdAt: new Date('2025-01-03') },
        { mangaId: 200, createdAt: new Date('2025-01-02') },
        { mangaId: 300, createdAt: new Date('2025-01-01') },
      ])

      // 실행
      const response = await app.request('/', {}, { userId: 1 })

      // 검증
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
      // 준비
      mockBookmarks.set(1, [])

      // 실행
      const response = await app.request('/', {}, { userId: 1 })

      // 검증
      const data = (await response.json()) as BookmarkResponse
      expect(response.status).toBe(200)
      expect(data.bookmarks).toHaveLength(0)
      expect(data.nextCursor).toBeNull()
    })

    test('limit을 지정하면 해당 개수만큼 반환하고 nextCursor를 포함한다', async () => {
      // 준비
      mockBookmarks.set(1, [
        { mangaId: 100, createdAt: new Date('2025-01-05') },
        { mangaId: 200, createdAt: new Date('2025-01-04') },
        { mangaId: 300, createdAt: new Date('2025-01-03') },
        { mangaId: 400, createdAt: new Date('2025-01-02') },
        { mangaId: 500, createdAt: new Date('2025-01-01') },
      ])

      // 실행
      const response = await app.request('/?limit=3', {}, { userId: 1 })

      // 검증
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
      // 준비
      const date1 = new Date('2025-01-03')
      mockBookmarks.set(1, [
        { mangaId: 100, createdAt: new Date('2025-01-05') },
        { mangaId: 200, createdAt: new Date('2025-01-04') },
        { mangaId: 300, createdAt: date1 },
        { mangaId: 400, createdAt: new Date('2025-01-02') },
        { mangaId: 500, createdAt: new Date('2025-01-01') },
      ])

      const cursor = `${date1.getTime()}-300`

      // 실행
      const response = await app.request(`/?cursor=${cursor}`, {}, { userId: 1 })

      // 검증
      expect(response.status).toBe(200)
      const data = (await response.json()) as BookmarkResponse
      expect(data.bookmarks).toHaveLength(2)
      expect(data.bookmarks[0].mangaId).toBe(400)
      expect(data.bookmarks[1].mangaId).toBe(500)
    })

    test('응답에 Cache-Control 헤더가 포함되어 있다', async () => {
      // 준비
      mockBookmarks.set(1, [{ mangaId: 100, createdAt: new Date() }])

      // 실행
      const response = await app.request('/', {}, { userId: 1 })

      // 검증
      expect(response.status).toBe(200)
      expect(response.headers.get('cache-control')).toBeDefined()
      expect(response.headers.get('cache-control')).toContain('private')
      expect(response.headers.get('cache-control')).toContain('max-age=3')
    })
  })

  describe('실패', () => {
    test('인증되지 않은 사용자는 401 응답을 받는다', async () => {
      // 실행
      const response = await app.request('/', {}, {})

      // 검증
      expect(response.status).toBe(401)
    })

    test('유효하지 않은 cursor는 400 응답을 받는다', async () => {
      // 실행 - 잘못된 형식
      const invalidResponse = await app.request('/?cursor=invalid', {}, { userId: 1 })
      expect(invalidResponse.status).toBe(400)

      // 실행 - 음수 값
      const negativeResponse = await app.request('/?cursor=-100-200', {}, { userId: 1 })
      expect(negativeResponse.status).toBe(400)
    })

    test('유효하지 않은 limit은 400 응답을 받는다', async () => {
      // 실행 - 음수 limit
      const negativeResponse = await app.request('/?limit=-1', {}, { userId: 1 })
      expect(negativeResponse.status).toBe(400)

      // 실행 - 0
      const zeroResponse = await app.request('/?limit=0', {}, { userId: 1 })
      expect(zeroResponse.status).toBe(400)

      // 실행 - 문자열
      const stringResponse = await app.request('/?limit=abc', {}, { userId: 1 })
      expect(stringResponse.status).toBe(400)
    })

    test('데이터베이스 연결 오류 시 500 응답을 반환한다', async () => {
      // 준비
      shouldThrowDatabaseError = true

      // 실행
      const response = await app.request('/', {}, { userId: 1 })

      // 검증
      expect(response.status).toBe(500)
    })
  })

  describe('기타', () => {
    test('동시에 여러 요청을 보내는 경우 일관된 응답을 반환한다', async () => {
      // 준비
      mockBookmarks.set(1, [
        { mangaId: 100, createdAt: new Date('2025-01-02') },
        { mangaId: 200, createdAt: new Date('2025-01-01') },
      ])

      // 실행
      const promises = Array.from({ length: 5 }, () => app.request('/', {}, { userId: 1 }))
      const responses = await Promise.all(promises)

      // 검증
      expect(responses.every((r) => r.status === 200)).toBe(true)

      const data = (await Promise.all(responses.map((r) => r.json()))) as BookmarkResponse[]
      expect(data.every((d) => d.bookmarks.length === 2)).toBe(true)
      expect(data.every((d) => d.bookmarks[0].mangaId === 100)).toBe(true)
    })

    test('서로 다른 사용자의 북마크는 독립적으로 조회된다', async () => {
      // 준비
      mockBookmarks.set(1, [{ mangaId: 100, createdAt: new Date() }])
      mockBookmarks.set(2, [
        { mangaId: 200, createdAt: new Date('2025-01-02') },
        { mangaId: 300, createdAt: new Date('2025-01-01') },
      ])

      // 실행
      const response1 = await app.request('/', {}, { userId: 1 })
      const response2 = await app.request('/', {}, { userId: 2 })

      // 검증
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
      // 준비 - 첫 번째 요청은 실패
      shouldThrowDatabaseError = true
      const errorResponse = await app.request('/', {}, { userId: 1 })
      expect(errorResponse.status).toBe(500)

      // 실행 - 두 번째 요청은 성공
      shouldThrowDatabaseError = false
      mockBookmarks.set(1, [{ mangaId: 100, createdAt: new Date() }])
      const successResponse = await app.request('/', {}, { userId: 1 })

      // 검증
      expect(successResponse.status).toBe(200)
      const data = (await successResponse.json()) as BookmarkResponse
      expect(data.bookmarks).toHaveLength(1)
      expect(data.bookmarks[0].mangaId).toBe(100)
    })

    test('limit과 cursor를 함께 사용하여 페이지네이션이 정상 동작한다', async () => {
      // 준비
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

      // 실행
      const response = await app.request(`/?cursor=${cursor}&limit=2`, {}, { userId: 1 })

      // 검증
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
      // 준비
      mockBookmarks.set(1, [{ mangaId: 100, createdAt: new Date() }])

      // 실행
      const response = await app.request('/', {}, { userId: 1 })

      // 검증
      expect(response.status).toBe(200)
      expect(response.headers.get('cache-control')).toContain('private')
      expect(response.headers.get('cache-control')).not.toContain('public')
    })

    test('북마크 목록에 createdAt이 타임스탬프로 변환되어 반환된다', async () => {
      // 준비
      const testDate = new Date('2025-01-01T12:00:00Z')
      mockBookmarks.set(1, [{ mangaId: 100, createdAt: testDate }])

      // 실행
      const response = await app.request('/', {}, { userId: 1 })

      // 검증
      expect(response.status).toBe(200)
      const data = (await response.json()) as BookmarkResponse
      expect(data.bookmarks[0].createdAt).toBe(testDate.getTime())
      expect(typeof data.bookmarks[0].createdAt).toBe('number')
    })
  })
})

describe('GET /api/v1/bookmark/id', () => {
  beforeEach(() => {
    shouldThrowDatabaseError = false
    mockBookmarks.clear()
  })

  test('사용자 북마크 전체 ID 목록을 반환한다', async () => {
    mockBookmarks.set(1, [
      { mangaId: 100, createdAt: new Date('2025-01-03') },
      { mangaId: 200, createdAt: new Date('2025-01-02') },
      { mangaId: 300, createdAt: new Date('2025-01-01') },
    ])

    const response = await app.request('/id', {}, { userId: 1 })

    expect(response.status).toBe(200)
    const data = (await response.json()) as BookmarkIdResponse
    expect(data.mangaIds).toEqual([100, 200, 300])
    expect(response.headers.get('cache-control')).toContain('private')
  })

  test('인증되지 않은 사용자는 401 응답을 받는다', async () => {
    const response = await app.request('/id', {}, {})

    expect(response.status).toBe(401)
  })

  test('데이터베이스 오류 시 500 응답을 반환한다', async () => {
    shouldThrowDatabaseError = true

    const response = await app.request('/id', {}, { userId: 1 })

    expect(response.status).toBe(500)
  })
})

describe('GET /api/v1/bookmark/export', () => {
  beforeEach(() => {
    shouldThrowDatabaseError = false
    mockBookmarks.clear()
  })

  test('사용자 북마크 전체 export 목록을 반환한다', async () => {
    const testDate = new Date('2025-01-03T12:00:00Z')
    mockBookmarks.set(1, [
      { mangaId: 100, createdAt: testDate },
      { mangaId: 200, createdAt: new Date('2025-01-02T12:00:00Z') },
    ])

    const response = await app.request('/export', {}, { userId: 1 })

    expect(response.status).toBe(200)
    const data = (await response.json()) as BookmarkExportResponse
    expect(data.bookmarks).toHaveLength(2)
    expect(data.bookmarks[0]).toEqual({ mangaId: 100, createdAt: testDate.getTime() })
    expect(response.headers.get('cache-control')).toContain('private')
  })

  test('인증되지 않은 사용자는 401 응답을 받는다', async () => {
    const response = await app.request('/export', {}, {})

    expect(response.status).toBe(401)
  })

  test('데이터베이스 오류 시 500 응답을 반환한다', async () => {
    shouldThrowDatabaseError = true

    const response = await app.request('/export', {}, { userId: 1 })

    expect(response.status).toBe(500)
  })
})

describe('PUT /api/v1/bookmark/:id', () => {
  test('북마크가 없으면 생성하고 201을 반환한다', async () => {
    const response = await app.request('/101', { method: 'PUT' }, { userId: 1 })

    expect(response.status).toBe(201)
    expect(response.headers.get('content-type')).toContain('application/json')

    const data = (await response.json()) as BookmarkPutResponse
    expect(data.mangaId).toBe(101)
    expect(typeof data.createdAt).toBe('number')
    expect(mockBookmarks.get(1)?.map((bookmark) => bookmark.mangaId)).toEqual([101])
  })

  test('이미 있는 북마크에 다시 요청하면 200을 반환하고 createdAt을 유지한다', async () => {
    const existingDate = new Date('2025-01-03T00:00:00.000Z')
    mockBookmarks.set(1, [{ mangaId: 101, createdAt: existingDate }])

    const response = await app.request('/101', { method: 'PUT' }, { userId: 1 })

    expect(response.status).toBe(200)
    const data = (await response.json()) as BookmarkPutResponse
    expect(data).toEqual({ mangaId: 101, createdAt: existingDate.getTime() })
    expect(mockBookmarks.get(1)).toEqual([{ mangaId: 101, createdAt: existingDate }])
  })

  test('북마크 한도에 도달하면 403과 확장 필요 코드를 반환한다', async () => {
    mockBookmarkLimit = 1
    mockBookmarks.set(1, [{ mangaId: 100, createdAt: new Date('2025-01-01T00:00:00.000Z') }])

    const response = await app.request('/101', { method: 'PUT' }, { userId: 1 })

    expect(response.status).toBe(403)
    const data = (await response.json()) as ValidationProblemDetails
    expect(data.type).toContain('/problems/libo-expansion-required')
    expect(mockBookmarks.get(1)?.map((bookmark) => bookmark.mangaId)).toEqual([100])
  })

  test('인증되지 않은 사용자는 401 응답을 받는다', async () => {
    const response = await app.request('/101', { method: 'PUT' }, {})

    expect(response.status).toBe(401)
  })

  test('유효하지 않은 manga id는 400 응답을 받는다', async () => {
    const response = await app.request('/0', { method: 'PUT' }, { userId: 1 })

    expect(response.status).toBe(400)
  })

  test('데이터베이스 오류 시 500 응답을 반환한다', async () => {
    shouldThrowDatabaseError = true

    const response = await app.request('/101', { method: 'PUT' }, { userId: 1 })

    expect(response.status).toBe(500)
  })
})

describe('DELETE /api/v1/bookmark/:id', () => {
  test('기존 북마크를 삭제하고 204를 반환한다', async () => {
    mockBookmarks.set(1, [{ mangaId: 101, createdAt: new Date('2025-01-03T00:00:00.000Z') }])

    const response = await app.request('/101', { method: 'DELETE' }, { userId: 1 })

    expect(response.status).toBe(204)
    expect(mockBookmarks.get(1)).toEqual([])
  })

  test('이미 없는 북마크를 삭제해도 204를 반환한다', async () => {
    const response = await app.request('/101', { method: 'DELETE' }, { userId: 1 })

    expect(response.status).toBe(204)
    expect(mockBookmarks.get(1)).toEqual([])
  })

  test('인증되지 않은 사용자는 401 응답을 받는다', async () => {
    const response = await app.request('/101', { method: 'DELETE' }, {})

    expect(response.status).toBe(401)
  })

  test('유효하지 않은 manga id는 400 응답을 받는다', async () => {
    const response = await app.request('/0', { method: 'DELETE' }, { userId: 1 })

    expect(response.status).toBe(400)
  })

  test('데이터베이스 오류 시 500 응답을 반환한다', async () => {
    shouldThrowDatabaseError = true

    const response = await app.request('/101', { method: 'DELETE' }, { userId: 1 })

    expect(response.status).toBe(500)
  })
})

describe('DELETE /api/v1/bookmark', () => {
  test('선택한 북마크들을 일괄 삭제하고 삭제 개수를 반환한다', async () => {
    mockBookmarks.set(1, [
      { mangaId: 101, createdAt: new Date('2025-01-03T00:00:00.000Z') },
      { mangaId: 102, createdAt: new Date('2025-01-02T00:00:00.000Z') },
      { mangaId: 103, createdAt: new Date('2025-01-01T00:00:00.000Z') },
    ])

    const response = await app.request(
      '/',
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mangaIds: [101, 103] }),
      },
      { userId: 1 },
    )

    const data = (await response.json()) as BookmarkDeleteResponse

    expect(response.status).toBe(200)
    expect(data.deletedCount).toBe(2)
    expect(mockBookmarks.get(1)?.map((bookmark) => bookmark.mangaId)).toEqual([102])
  })

  test('중복된 manga id가 들어와도 한 번만 삭제한다', async () => {
    mockBookmarks.set(1, [{ mangaId: 101, createdAt: new Date('2025-01-03T00:00:00.000Z') }])

    const response = await app.request(
      '/',
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mangaIds: [101, 101, 101] }),
      },
      { userId: 1 },
    )

    const data = (await response.json()) as BookmarkDeleteResponse

    expect(response.status).toBe(200)
    expect(data.deletedCount).toBe(1)
    expect(mockBookmarks.get(1)).toEqual([])
  })

  test('일부만 존재해도 존재하는 북마크만 삭제한다', async () => {
    mockBookmarks.set(1, [{ mangaId: 101, createdAt: new Date('2025-01-03T00:00:00.000Z') }])

    const response = await app.request(
      '/',
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mangaIds: [101, 999] }),
      },
      { userId: 1 },
    )

    const data = (await response.json()) as BookmarkDeleteResponse

    expect(response.status).toBe(200)
    expect(data.deletedCount).toBe(1)
    expect(mockBookmarks.get(1)).toEqual([])
  })

  test('인증되지 않은 사용자는 401 응답을 받는다', async () => {
    const response = await app.request(
      '/',
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mangaIds: [101] }),
      },
      {},
    )

    expect(response.status).toBe(401)
  })

  test('유효하지 않은 body는 400 응답을 반환한다', async () => {
    const response = await app.request(
      '/',
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mangaIds: [] }),
      },
      { userId: 1 },
    )

    expect(response.status).toBe(400)
  })
})
