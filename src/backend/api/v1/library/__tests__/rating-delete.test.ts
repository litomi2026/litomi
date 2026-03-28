import { beforeAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { PgDialect } from 'drizzle-orm/pg-core'
import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'

import type { Env } from '@/backend'

type RatingRouteModule = typeof import('../rating/route')

type TestEnv = Env & {
  Bindings: {
    userId?: number
  }
}

type UserRatingRow = {
  createdAt: Date
  mangaId: number
  rating: number
  updatedAt: Date
}

let ratingRoutes: RatingRouteModule['default']
let app: Hono<TestEnv>
let shouldThrowDatabaseError = false

const dialect = new PgDialect()
const mockRatings = new Map<number, UserRatingRow[]>()

function extractWhereListParams(condition: unknown): Record<string, number[]> {
  const params: Record<string, number[]> = {}
  const { params: queryParams, sql } = dialect.sqlToQuery(condition as Parameters<typeof dialect.sqlToQuery>[0])

  for (const match of sql.matchAll(/"user_rating"\."([^"]+)" in \(([^)]+)\)/g)) {
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
  const { params: queryParams, sql } = dialect.sqlToQuery(condition as Parameters<typeof dialect.sqlToQuery>[0])

  for (const match of sql.matchAll(/"user_rating"\."([^"]+)" = \$(\d+)/g)) {
    const [, columnName, paramIndex] = match
    const value = queryParams[Number(paramIndex) - 1]

    if (typeof value === 'number') {
      params[columnName] = value
    }
  }

  return params
}

mock.module('@/database/supabase/drizzle', () => ({
  db: {
    delete: () => ({
      where: (condition: unknown) => ({
        returning: async () => {
          if (shouldThrowDatabaseError) {
            throw new Error('Database connection failed')
          }

          const params = extractWhereParams(condition)
          const listParams = extractWhereListParams(condition)
          const userId = Number(params.user_id)
          const mangaIds = listParams.manga_id ?? []
          const userRatings = [...(mockRatings.get(userId) || [])]
          const deletedRatings = userRatings.filter((rating) => mangaIds.includes(rating.mangaId))
          const nextRatings = userRatings.filter((rating) => !mangaIds.includes(rating.mangaId))

          mockRatings.set(userId, nextRatings)

          return deletedRatings.map(() => ({ deleted: 1 }))
        },
      }),
    }),
  },
}))

beforeAll(async () => {
  spyOn(console, 'error').mockImplementation(() => {})
  ratingRoutes = (await import('../rating/route')).default

  app = new Hono<TestEnv>()
  app.use('*', contextStorage())
  app.use('*', async (c, next) => {
    const userId = c.env.userId

    if (typeof userId === 'number') {
      c.set('userId', userId)
    }

    await next()
  })
  app.route('/', ratingRoutes)
})

beforeEach(() => {
  shouldThrowDatabaseError = false
  mockRatings.clear()
})

describe('DELETE /api/v1/library/rating', () => {
  test('선택한 평가들을 일괄 삭제하고 삭제 개수를 반환한다', async () => {
    mockRatings.set(1, [
      {
        mangaId: 101,
        rating: 5,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
      },
      {
        mangaId: 102,
        rating: 4,
        createdAt: new Date('2025-01-02T00:00:00.000Z'),
        updatedAt: new Date('2025-01-02T00:00:00.000Z'),
      },
    ])

    const response = await app.request(
      '/',
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mangaIds: [101] }),
      },
      { userId: 1 },
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ deletedCount: 1 })
    expect(mockRatings.get(1)?.map((rating) => rating.mangaId)).toEqual([102])
  })

  test('이미 없는 평가가 포함되어도 존재하는 평가만 삭제한다', async () => {
    mockRatings.set(1, [
      {
        mangaId: 101,
        rating: 5,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
      },
    ])

    const response = await app.request(
      '/',
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mangaIds: [101, 999] }),
      },
      { userId: 1 },
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ deletedCount: 1 })
    expect(mockRatings.get(1)).toEqual([])
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

  test('데이터베이스 오류 시 500 응답을 반환한다', async () => {
    shouldThrowDatabaseError = true

    const response = await app.request(
      '/',
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mangaIds: [101] }),
      },
      { userId: 1 },
    )

    expect(response.status).toBe(500)
  })
})
