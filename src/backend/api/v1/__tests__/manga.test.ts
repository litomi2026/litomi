import { afterAll, beforeAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'

import type { Env } from '@/backend'

import { MAX_MANGA_ID } from '@/constants/policy'

import libraryHistoryRoutes from '../library/history'
import mangaRoutes from '../manga/[id]/history'

let shouldThrowDatabaseError = false
let historySyncEnabled = true
let currentUserId: number | undefined
let transactionCallCount = 0
let totalHistoryExpansionAmount = 0
let lastLockedUserId: number | null = null
let lastEnforceHistoryLimitQuery: unknown = null
let importInsertedMangaIds: number[] = []
let importConflictUpdateKeys: string[] = []
let importUsedConflictUpdate = false
let importInsertedValues: Array<{
  lastPage: number
  mangaId: number
  updatedAt: Date
  userId: number
}> = []
const mockReadingHistory: Map<string, number | null> = new Map()

beforeAll(() => {
  spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(() => {
  mock.restore()
})

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
app.route('/', mangaRoutes)
app.route('/library/history', libraryHistoryRoutes)

mock.module('@/database/supabase/drizzle', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => {
          if (shouldThrowDatabaseError) {
            return Promise.reject(new Error('Database connection failed'))
          }

          const key = `${currentUserId}`
          const lastPage = mockReadingHistory.get(key)

          if (lastPage === null || lastPage === undefined) {
            return Promise.resolve([])
          }

          return Promise.resolve([{ lastPage }])
        },
      }),
    }),
    transaction: async (callback: (tx: unknown) => Promise<unknown>) => {
      transactionCallCount += 1

      if (shouldThrowDatabaseError) {
        throw new Error('Database connection failed')
      }

      const historyLimitSelectQuery = {
        orderBy: () => ({
          limit: () => ({ kind: 'history-limit-subquery' }),
        }),
        then: (resolve: (value: Array<{ totalAmount: number }>) => unknown) =>
          resolve([{ totalAmount: totalHistoryExpansionAmount }]),
      }

      const tx = {
        delete: () => ({
          where: (query: unknown) => {
            lastEnforceHistoryLimitQuery = query
            return Promise.resolve([])
          },
        }),
        insert: () => ({
          values: (values: unknown) => {
            const insertedValues = (Array.isArray(values) ? values : [values]) as typeof importInsertedValues
            importInsertedValues = insertedValues

            return {
              onConflictDoUpdate: ({ set }: { set: Record<string, unknown> }) => {
                importUsedConflictUpdate = true
                importConflictUpdateKeys = Object.keys(set)

                return {
                  returning: () => Promise.resolve(importInsertedMangaIds.map((mangaId) => ({ mangaId }))),
                }
              },
              onConflictDoNothing: () => ({
                returning: () => Promise.resolve(importInsertedMangaIds.map((mangaId) => ({ mangaId }))),
              }),
              returning: () => Promise.resolve(importInsertedMangaIds.map((mangaId) => ({ mangaId }))),
            }
          },
        }),
        select: () => ({
          from: () => ({
            where: () => historyLimitSelectQuery,
          }),
        }),
        update: () => ({
          set: () => ({
            where: () => ({
              returning: () => Promise.resolve([]),
            }),
          }),
        }),
      }

      return await callback(tx)
    },
  },
}))

mock.module('@/query/user-settings.query', () => ({
  readUserSettings: () =>
    Promise.resolve({
      historySyncEnabled,
      adultVerifiedAdVisible: false,
      autoDeletionDay: 180,
    }),
}))

mock.module('@/backend/utils/lock-user-row', () => ({
  lockUserRowForUpdate: (_tx: unknown, userId: number) => {
    lastLockedUserId = userId
    return Promise.resolve()
  },
}))

beforeEach(() => {
  currentUserId = undefined
  historySyncEnabled = true
  importConflictUpdateKeys = []
  importInsertedMangaIds = []
  importInsertedValues = []
  importUsedConflictUpdate = false
  lastEnforceHistoryLimitQuery = null
  lastLockedUserId = null
  shouldThrowDatabaseError = false
  totalHistoryExpansionAmount = 0
  transactionCallCount = 0
  mockReadingHistory.clear()
})

describe('GET /api/v1/manga/:id/history', () => {
  describe('성공', () => {
    test('인증된 사용자가 읽기 기록을 성공적으로 조회한다', async () => {
      // 준비
      currentUserId = 1
      mockReadingHistory.set('1', 5)

      // 실행
      const response = await app.request('/123/history', {}, { userId: 1 })

      // 검증
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('application/json')

      const data = await response.json()
      expect(data).toBe(5)
    })

    test('읽기 기록이 없는 경우 204 응답을 받는다', async () => {
      // 준비
      currentUserId = 1
      mockReadingHistory.set('1', null)

      // 실행
      const response = await app.request('/123/history', {}, { userId: 1 })

      // 검증
      expect(response.status).toBe(204)
    })

    test('응답에 Cache-Control 헤더가 포함되어 있다', async () => {
      // 준비
      currentUserId = 1
      mockReadingHistory.set('1', 10)

      // 실행
      const response = await app.request('/456/history', {}, { userId: 1 })

      // 검증
      expect(response.status).toBe(200)
      expect(response.headers.get('cache-control')).toBeDefined()
      expect(response.headers.get('cache-control')).toContain('private')
      expect(response.headers.get('cache-control')).toContain('max-age=3')
    })

    test('lastPage가 0인 경우에도 정상적으로 반환된다', async () => {
      // 준비
      currentUserId = 1
      mockReadingHistory.set('1', 0)

      // 실행
      const response = await app.request('/789/history', {}, { userId: 1 })

      // 검증
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toBe(0)
    })
  })

  describe('실패', () => {
    test('인증되지 않은 사용자(userId 없음)는 401 응답을 받는다', async () => {
      // 실행
      const response = await app.request('/123/history', {}, {})

      // 검증
      expect(response.status).toBe(401)
    })

    test('성인인증이 완료되지 않은 사용자(isAdult=false)는 403 응답을 받는다', async () => {
      // 준비
      currentUserId = 1
      mockReadingHistory.set('1', 5)

      // 실행
      const response = await app.request('/123/history', {}, { userId: 1, isAdult: false })

      // 검증
      expect(response.status).toBe(403)
      expect(response.headers.get('content-type')).toContain('application/problem+json')

      const problem = (await response.json()) as { type?: string }
      expect(problem?.type).toContain('/problems/adult-verification-required')
    })

    test('유효하지 않은 manga ID는 400 응답을 받는다', async () => {
      // 준비
      currentUserId = 1

      // 실행 - 음수 ID
      const negativeResponse = await app.request('/-123/history', {}, { userId: 1 })
      expect(negativeResponse.status).toBe(400)

      // 실행 - 0
      const zeroResponse = await app.request('/0/history', {}, { userId: 1 })
      expect(zeroResponse.status).toBe(400)

      // 실행 - MAX_MANGA_ID 초과
      const tooLargeResponse = await app.request('/20000000/history', {}, { userId: 1 })
      expect(tooLargeResponse.status).toBe(400)

      // 실행 - 문자열
      const stringResponse = await app.request('/abc/history', {}, { userId: 1 })
      expect(stringResponse.status).toBe(400)
    })

    test('데이터베이스 연결 오류 시 500 응답을 반환한다', async () => {
      // 준비
      currentUserId = 1
      shouldThrowDatabaseError = true

      // 실행
      const response = await app.request('/123/history', {}, { userId: 1 })

      // 검증
      expect(response.status).toBe(500)
    })
  })

  describe('기타', () => {
    test('동시에 여러 요청을 보내는 경우 일관된 응답을 반환한다', async () => {
      // 준비
      currentUserId = 1
      mockReadingHistory.set('1', 15)

      // 실행
      const promises = Array.from({ length: 5 }, () => app.request('/123/history', {}, { userId: 1 }))
      const responses = await Promise.all(promises)

      // 검증
      expect(responses.every((r) => r.status === 200)).toBe(true)

      const data = await Promise.all(responses.map((r) => r.json()))
      expect(data.every((d) => d === 15)).toBe(true)
    })

    test('서로 다른 manga ID로 요청하는 경우 올바른 응답을 받는다', async () => {
      // 준비
      currentUserId = 1
      mockReadingHistory.set('1', 5)

      // 실행
      const response1 = await app.request('/123/history', {}, { userId: 1 })
      const response2 = await app.request('/456/history', {}, { userId: 1 })

      // 검증
      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)

      const data1 = await response1.json()
      const data2 = await response2.json()
      expect(data1).toBe(5)
      expect(data2).toBe(5)
    })

    test('데이터베이스 오류 후 복구되는 경우 정상 응답을 반환한다', async () => {
      // 준비 - 첫 번째 요청은 실패
      currentUserId = 1
      shouldThrowDatabaseError = true
      const errorResponse = await app.request('/123/history', {}, { userId: 1 })
      expect(errorResponse.status).toBe(500)

      // 실행 - 두 번째 요청은 성공
      shouldThrowDatabaseError = false
      mockReadingHistory.set('1', 8)
      const successResponse = await app.request('/123/history', {}, { userId: 1 })

      // 검증
      expect(successResponse.status).toBe(200)
      const data = await successResponse.json()
      expect(data).toBe(8)
    })
  })

  describe('보안', () => {
    test('Cache-Control 헤더가 private으로 설정되어 공유 캐시에 저장되지 않는다', async () => {
      // 준비
      currentUserId = 1
      mockReadingHistory.set('1', 3)

      // 실행
      const response = await app.request('/123/history', {}, { userId: 1 })

      // 검증
      expect(response.status).toBe(200)
      expect(response.headers.get('cache-control')).toContain('private')
      expect(response.headers.get('cache-control')).not.toContain('public')
    })

    test('MAX_MANGA_ID 경계값 테스트', async () => {
      // 준비
      currentUserId = 1
      mockReadingHistory.set('1', 1)

      // 실행 - MAX_MANGA_ID는 허용
      const validResponse = await app.request(`/${MAX_MANGA_ID}/history`, {}, { userId: 1 })
      expect(validResponse.status).toBe(200)

      // 실행 - MAX_MANGA_ID + 1은 거부
      const invalidResponse = await app.request(`/${MAX_MANGA_ID + 1}/history`, {}, { userId: 1 })
      expect(invalidResponse.status).toBe(400)
    })
  })
})

describe('POST /api/v1/manga/:id/history', () => {
  test('인증되지 않은 사용자(userId 없음)는 401 응답을 받는다', async () => {
    const response = await app.request('/123/history', { method: 'POST' }, {})
    expect(response.status).toBe(401)
  })

  test('성인인증이 완료되지 않은 사용자(isAdult=false)는 403 응답을 받는다', async () => {
    const response = await app.request('/123/history', { method: 'POST' }, { userId: 1, isAdult: false })
    expect(response.status).toBe(403)
    expect(response.headers.get('content-type')).toContain('application/problem+json')
  })
})

describe('POST /api/v1/library/history/import', () => {
  test('인증되지 않은 사용자(userId 없음)는 401 응답을 받는다', async () => {
    const response = await app.request(
      '/library/history/import',
      {
        body: JSON.stringify({
          localHistories: [{ mangaId: 123, lastPage: 7, updatedAt: 1710000000000 }],
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      },
      {},
    )

    expect(response.status).toBe(401)
  })

  test('성인인증이 완료되지 않은 사용자(isAdult=false)는 403 응답을 받는다', async () => {
    const response = await app.request(
      '/library/history/import',
      {
        body: JSON.stringify({
          localHistories: [{ mangaId: 123, lastPage: 7, updatedAt: 1710000000000 }],
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      },
      { isAdult: false, userId: 1 },
    )

    expect(response.status).toBe(403)
    expect(response.headers.get('content-type')).toContain('application/problem+json')
  })

  test('historySyncEnabled=false면 서버 저장 없이 synced=false를 반환한다', async () => {
    historySyncEnabled = false

    const response = await app.request(
      '/library/history/import',
      {
        body: JSON.stringify({
          localHistories: [{ mangaId: 123, lastPage: 7, updatedAt: 1710000000000 }],
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      },
      { userId: 1 },
    )

    expect(response.status).toBe(200)
    expect(transactionCallCount).toBe(0)

    const data = await response.json()
    expect(data).toEqual({ importedCount: 0, skippedCount: 1, synced: false })
  })

  test('중복된 로컬 기록은 최신값 기준으로 정리해서 import한다', async () => {
    importInsertedMangaIds = [123, 456]
    totalHistoryExpansionAmount = 5

    const response = await app.request(
      '/library/history/import',
      {
        body: JSON.stringify({
          localHistories: [
            { mangaId: 123, lastPage: 1, updatedAt: 1710000000000 },
            { mangaId: 123, lastPage: 9, updatedAt: 1710000005000 },
            { mangaId: 456, lastPage: 3, updatedAt: 1710000001000 },
          ],
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      },
      { userId: 1 },
    )

    expect(response.status).toBe(200)
    expect(transactionCallCount).toBe(1)
    expect(lastLockedUserId).toBe(1)
    expect(lastEnforceHistoryLimitQuery).toBeDefined()
    expect(importUsedConflictUpdate).toBe(true)
    expect(importConflictUpdateKeys).toEqual(['lastPage', 'updatedAt'])
    expect(importInsertedValues).toEqual([
      { mangaId: 123, lastPage: 9, updatedAt: new Date(1710000005000), userId: 1 },
      { mangaId: 456, lastPage: 3, updatedAt: new Date(1710000001000), userId: 1 },
    ])

    const data = await response.json()
    expect(data).toEqual({ importedCount: 2, skippedCount: 1, synced: true })
  })

  test('유효하지 않은 요청 본문은 400 응답을 받는다', async () => {
    const response = await app.request(
      '/library/history/import',
      {
        body: JSON.stringify({ localHistories: [] }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      },
      { userId: 1 },
    )

    expect(response.status).toBe(400)
    expect(response.headers.get('content-type')).toContain('application/problem+json')
  })

  test('데이터베이스 오류 시 500 응답을 반환한다', async () => {
    shouldThrowDatabaseError = true

    const response = await app.request(
      '/library/history/import',
      {
        body: JSON.stringify({
          localHistories: [{ mangaId: 123, lastPage: 7, updatedAt: 1710000000000 }],
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      },
      { userId: 1 },
    )

    expect(response.status).toBe(500)
  })
})
