import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'

import type { Env } from '@/backend'

import { POINT_CONSTANTS } from '@/constants/points'
import { MAX_MANGA_ID, MAX_READING_HISTORY_PER_USER } from '@/constants/policy'

import libraryHistoryRoutes from '../library/history'

type HistoryRecord = {
  lastPage: number
  updatedAt: number
}

type TestEnv = Env & {
  Bindings: {
    userId?: number
    isAdult?: boolean
  }
}

let shouldThrowDatabaseError = false
let historyExpansionAmount = 0
const readingHistoryStore = new Map<number, HistoryRecord>()

function applyImport(rows: Array<{ mangaId: number; lastPage: number; updatedAt: Date }>) {
  for (const row of rows) {
    const current = readingHistoryStore.get(row.mangaId)
    const incoming = {
      lastPage: row.lastPage,
      updatedAt: row.updatedAt.getTime(),
    }

    if (!current || shouldReplace(current, incoming)) {
      readingHistoryStore.set(row.mangaId, incoming)
    }
  }
}

function shouldReplace(current: HistoryRecord, incoming: HistoryRecord) {
  if (incoming.updatedAt !== current.updatedAt) {
    return incoming.updatedAt > current.updatedAt
  }

  return incoming.lastPage > current.lastPage
}

function trimToLimit() {
  const limit = Math.min(MAX_READING_HISTORY_PER_USER + historyExpansionAmount, POINT_CONSTANTS.HISTORY_MAX_EXPANSION)
  const sorted = Array.from(readingHistoryStore.entries()).sort((left, right) => {
    const updatedAtDiff = right[1].updatedAt - left[1].updatedAt

    if (updatedAtDiff !== 0) {
      return updatedAtDiff
    }

    return right[0] - left[0]
  })

  const keep = new Set(sorted.slice(0, limit).map(([mangaId]) => mangaId))

  for (const mangaId of readingHistoryStore.keys()) {
    if (!keep.has(mangaId)) {
      readingHistoryStore.delete(mangaId)
    }
  }
}

mock.module('@/database/supabase/drizzle', () => ({
  db: {
    transaction: async (callback: (tx: Record<string, unknown>) => Promise<unknown>) => {
      if (shouldThrowDatabaseError) {
        throw new Error('Database connection failed')
      }

      const tx = {
        select: (fields: Record<string, unknown>) => {
          const keys = Object.keys(fields)

          if (keys.includes('id')) {
            return {
              from: () => ({
                where: () => ({
                  for: async () => [{ id: 1 }],
                }),
              }),
            }
          }

          if (keys.includes('totalAmount')) {
            return {
              from: () => ({
                where: async () => [{ totalAmount: historyExpansionAmount }],
              }),
            }
          }

          return {
            from: () => ({
              where: async () => [],
            }),
          }
        },
        insert: () => ({
          values: (values: Array<{ mangaId: number; lastPage: number; updatedAt: Date }>) => ({
            onConflictDoUpdate: async () => {
              applyImport(values)
            },
          }),
        }),
        execute: async () => {
          trimToLimit()
        },
      }

      return await callback(tx)
    },
  },
}))

const app = new Hono<TestEnv>()
app.use('*', contextStorage())
app.use('*', async (c, next) => {
  if (typeof c.env.userId === 'number') {
    c.set('userId', c.env.userId)
    c.set('isAdult', c.env.isAdult ?? true)
  }

  await next()
})
app.route('/', libraryHistoryRoutes)

describe('POST /api/v1/library/history/import', () => {
  beforeEach(() => {
    shouldThrowDatabaseError = false
    historyExpansionAmount = 0
    readingHistoryStore.clear()
  })

  test('미인증 사용자는 401 응답을 받는다', async () => {
    const response = await app.request(
      '/import',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ mangaId: 1, lastPage: 1, updatedAt: 1000 }] }),
      },
      {},
    )

    expect(response.status).toBe(401)
  })

  test('성인 인증이 완료되지 않은 사용자는 403 응답을 받는다', async () => {
    const response = await app.request(
      '/import',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ mangaId: 1, lastPage: 1, updatedAt: 1000 }] }),
      },
      { userId: 1, isAdult: false },
    )

    expect(response.status).toBe(403)
  })

  test('잘못된 입력은 400 응답을 받는다', async () => {
    const cases = [
      { items: [] },
      { items: [{ mangaId: 0, lastPage: 1, updatedAt: 1000 }] },
      { items: [{ mangaId: MAX_MANGA_ID + 1, lastPage: 1, updatedAt: 1000 }] },
      { items: [{ mangaId: 1, lastPage: 0, updatedAt: 1000 }] },
      { items: [{ mangaId: 1, lastPage: 1, updatedAt: 0 }] },
      {
        items: Array.from({ length: POINT_CONSTANTS.HISTORY_MAX_EXPANSION + 1 }, (_, index) => ({
          mangaId: index + 1,
          lastPage: 1,
          updatedAt: 1000 + index,
        })),
      },
    ]

    for (const body of cases) {
      const response = await app.request(
        '/import',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
        { userId: 1, isAdult: true },
      )

      expect(response.status).toBe(400)
    }
  })

  test('같은 작품이 중복되면 최신 updatedAt 기록만 남긴다', async () => {
    const response = await app.request(
      '/import',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            { mangaId: 7, lastPage: 12, updatedAt: 1000 },
            { mangaId: 7, lastPage: 20, updatedAt: 2000 },
          ],
        }),
      },
      { userId: 1, isAdult: true },
    )

    expect(response.status).toBe(204)
    expect(readingHistoryStore.get(7)).toEqual({ lastPage: 20, updatedAt: 2000 })
  })

  test('서버 기록이 더 최신이면 import가 덮어쓰지 않는다', async () => {
    readingHistoryStore.set(3, { lastPage: 50, updatedAt: 5000 })

    const response = await app.request(
      '/import',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ mangaId: 3, lastPage: 10, updatedAt: 4000 }],
        }),
      },
      { userId: 1, isAdult: true },
    )

    expect(response.status).toBe(204)
    expect(readingHistoryStore.get(3)).toEqual({ lastPage: 50, updatedAt: 5000 })
  })

  test('import 기록이 더 최신이면 기존 서버 기록을 갱신한다', async () => {
    readingHistoryStore.set(3, { lastPage: 10, updatedAt: 1000 })

    const response = await app.request(
      '/import',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ mangaId: 3, lastPage: 20, updatedAt: 3000 }],
        }),
      },
      { userId: 1, isAdult: true },
    )

    expect(response.status).toBe(204)
    expect(readingHistoryStore.get(3)).toEqual({ lastPage: 20, updatedAt: 3000 })
  })

  test('limit 초과 시 가장 오래된 기록부터 정리한다', async () => {
    for (let mangaId = 1; mangaId <= MAX_READING_HISTORY_PER_USER; mangaId++) {
      readingHistoryStore.set(mangaId, { lastPage: mangaId, updatedAt: mangaId })
    }

    const response = await app.request(
      '/import',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ mangaId: 9999, lastPage: 1, updatedAt: 9999 }],
        }),
      },
      { userId: 1, isAdult: true },
    )

    expect(response.status).toBe(204)
    expect(readingHistoryStore.size).toBe(MAX_READING_HISTORY_PER_USER)
    expect(readingHistoryStore.has(1)).toBe(false)
    expect(readingHistoryStore.get(9999)).toEqual({ lastPage: 1, updatedAt: 9999 })
  })

  test('같은 payload를 다시 보내도 결과가 변하지 않는다', async () => {
    const request = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ mangaId: 77, lastPage: 11, updatedAt: 7000 }],
      }),
    }

    const firstResponse = await app.request('/import', request, { userId: 1, isAdult: true })
    const secondResponse = await app.request('/import', request, { userId: 1, isAdult: true })

    expect(firstResponse.status).toBe(204)
    expect(secondResponse.status).toBe(204)
    expect(readingHistoryStore).toEqual(new Map([[77, { lastPage: 11, updatedAt: 7000 }]]))
  })

  test('데이터베이스 오류 시 500 응답을 반환한다', async () => {
    shouldThrowDatabaseError = true

    const response = await app.request(
      '/import',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ mangaId: 1, lastPage: 1, updatedAt: 1000 }],
        }),
      },
      { userId: 1, isAdult: true },
    )

    expect(response.status).toBe(500)
  })
})
