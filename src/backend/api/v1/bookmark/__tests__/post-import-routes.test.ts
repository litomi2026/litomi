import { afterAll, beforeAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'

import type { ValidationProblemDetails } from '@/utils/problem-details'

import { createRouteTestApp } from './route-test-utils'

type ImportBookmarksRouteModule = typeof import('../import')

type MutationScenario = {
  transactionError: Error | null
  tx: Record<string, unknown>
}

type PostBookmarksRouteModule = typeof import('../POST')

let importBookmarksApp: ReturnType<typeof createRouteTestApp>
let importBookmarksRoute: ImportBookmarksRouteModule['default']
let postBookmarksApp: ReturnType<typeof createRouteTestApp>
let postBookmarksRoute: PostBookmarksRouteModule['default']
let scenario: MutationScenario

const insertValues: Array<Array<{ createdAt?: Date; mangaId: number; userId: number }>> = []
const lockCalls: Array<{ tx: unknown; userId: number }> = []
const replaceDeleteConditions: unknown[] = []

let transactionCallCount = 0

mock.module('@/database/supabase/drizzle', () => ({
  db: {
    transaction: async (callback: (tx: unknown) => Promise<unknown>) => {
      transactionCallCount += 1

      if (scenario.transactionError) {
        throw scenario.transactionError
      }

      return callback(scenario.tx)
    },
  },
}))

mock.module('@/backend/utils/lock-user-row', () => ({
  lockUserRowForUpdate: async (tx: unknown, userId: number) => {
    lockCalls.push({ tx, userId })
  },
}))

afterAll(() => {
  mock.restore()
})

beforeAll(async () => {
  spyOn(console, 'error').mockImplementation(() => {})

  postBookmarksRoute = (await import('../POST')).default
  importBookmarksRoute = (await import('../import')).default

  postBookmarksApp = createRouteTestApp(postBookmarksRoute)
  importBookmarksApp = createRouteTestApp(importBookmarksRoute)
})

beforeEach(() => {
  scenario = {
    transactionError: null,
    tx: {},
  }

  insertValues.length = 0
  lockCalls.length = 0
  replaceDeleteConditions.length = 0
  transactionCallCount = 0
})

function createImportTx(
  options: {
    currentCount?: number
    existingIds?: number[]
    expansionAmount?: number
  } = {},
) {
  const saveTx = createSaveTx(options)

  return {
    ...saveTx,
    tx: {
      ...saveTx.tx,
      delete: () => ({
        where: async (condition: unknown) => {
          replaceDeleteConditions.push(condition)
          return []
        },
      }),
    },
  }
}

function createSaveTx(
  options: {
    currentCount?: number
    existingIds?: number[]
    expansionAmount?: number
  } = {},
) {
  let selectCallCount = 0

  return {
    tx: {
      select: () => ({
        from: () => ({
          where: async () => {
            const currentCall = ++selectCallCount

            if (currentCall === 1) {
              return (options.existingIds ?? []).map((mangaId) => ({ mangaId }))
            }

            if (currentCall === 2) {
              return [{ totalAmount: options.expansionAmount ?? 0 }]
            }

            if (currentCall === 3) {
              return [{ count: options.currentCount ?? 0 }]
            }

            throw new Error(`Unexpected select call: ${currentCall}`)
          },
        }),
      }),
      insert: () => ({
        values: (values: Array<{ createdAt?: Date; mangaId: number; userId: number }>) => {
          insertValues.push(values)

          return {
            returning: async () => values.map(({ mangaId }) => ({ mangaId })),
          }
        },
      }),
    },
  }
}

describe('POST /api/v1/bookmark', () => {
  test('트랜잭션 안에서 락을 잡고 북마크를 저장한다', async () => {
    const { tx } = createSaveTx({ currentCount: 0, existingIds: [] })

    scenario.tx = tx

    const response = await postBookmarksApp.request(
      '/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mangaIds: [101, 102] }),
      },
      { userId: 1 },
    )

    expect(response.status).toBe(200)
    expect(transactionCallCount).toBe(1)
    expect(lockCalls).toEqual([{ tx, userId: 1 }])
    expect(insertValues).toEqual([
      [
        { userId: 1, mangaId: 101 },
        { userId: 1, mangaId: 102 },
      ],
    ])
    expect(await response.json()).toEqual({
      createdMangaIds: [101, 102],
      duplicateCount: 0,
      overflowCount: 0,
    })
  })

  test('저장 한도에 도달하면 403 확장 필요 응답을 반환한다', async () => {
    const { tx } = createSaveTx({ currentCount: 500, existingIds: [] })

    scenario.tx = tx

    const response = await postBookmarksApp.request(
      '/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mangaIds: [101] }),
      },
      { userId: 1 },
    )

    expect(response.status).toBe(403)

    const problem = (await response.json()) as ValidationProblemDetails
    expect(problem.type).toContain('/problems/libo-expansion-required')
  })

  test('인증되지 않은 사용자는 401을 반환한다', async () => {
    const response = await postBookmarksApp.request(
      '/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mangaIds: [101] }),
      },
      {},
    )

    expect(response.status).toBe(401)
    expect(transactionCallCount).toBe(0)
  })

  test('유효하지 않은 body면 400을 반환한다', async () => {
    const response = await postBookmarksApp.request(
      '/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mangaIds: [] }),
      },
      { userId: 1 },
    )

    expect(response.status).toBe(400)
    expect(transactionCallCount).toBe(0)
  })

  test('내부 저장 오류가 나면 500을 반환한다', async () => {
    scenario.transactionError = new Error('Database connection failed')

    const response = await postBookmarksApp.request(
      '/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mangaIds: [101] }),
      },
      { userId: 1 },
    )

    expect(response.status).toBe(500)
  })
})

describe('POST /api/v1/bookmark/import', () => {
  test('replace 모드에서는 기존 북마크를 지우고 새 북마크를 저장한다', async () => {
    const providedCreatedAt = new Date('2025-01-01T00:00:00.000Z')
    const { tx } = createImportTx({ currentCount: 0, existingIds: [] })

    scenario.tx = tx

    const response = await importBookmarksApp.request(
      '/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'replace',
          bookmarks: [{ mangaId: 101 }, { mangaId: 102, createdAt: providedCreatedAt.toISOString() }, { mangaId: 103 }],
        }),
      },
      { userId: 1, isAdult: true },
    )

    expect(response.status).toBe(200)
    expect(transactionCallCount).toBe(1)
    expect(lockCalls).toEqual([{ tx, userId: 1 }])
    expect(replaceDeleteConditions).toHaveLength(1)
    expect(insertValues).toHaveLength(1)
    expect(insertValues[0]).toHaveLength(3)
    expect(insertValues[0]?.[0]?.mangaId).toBe(101)
    expect(insertValues[0]?.[1]).toEqual({ userId: 1, mangaId: 102, createdAt: providedCreatedAt })
    expect(insertValues[0]?.[2]?.mangaId).toBe(103)
    expect(insertValues[0]?.[0]?.createdAt).toBeInstanceOf(Date)
    expect(insertValues[0]?.[2]?.createdAt).toBeInstanceOf(Date)
    expect(insertValues[0]?.[0]?.createdAt?.getTime()).toBe(insertValues[0]?.[2]?.createdAt?.getTime())

    expect(await response.json()).toEqual({
      imported: 3,
      skipped: 0,
    })
  })

  test('merge 모드에서는 기존 삭제 없이 저장만 진행한다', async () => {
    const { tx } = createImportTx({ currentCount: 0, existingIds: [] })

    scenario.tx = tx

    const response = await importBookmarksApp.request(
      '/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'merge',
          bookmarks: [{ mangaId: 101 }],
        }),
      },
      { userId: 1, isAdult: true },
    )

    expect(response.status).toBe(200)
    expect(replaceDeleteConditions).toHaveLength(0)
    expect(insertValues).toHaveLength(1)
    expect(insertValues[0]?.[0]?.mangaId).toBe(101)
    expect(insertValues[0]?.[0]?.createdAt).toBeInstanceOf(Date)
  })

  test('성인 인증이 필요하면 403을 반환한다', async () => {
    const response = await importBookmarksApp.request(
      '/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'merge',
          bookmarks: [{ mangaId: 101 }],
        }),
      },
      { userId: 1, isAdult: false },
    )

    expect(response.status).toBe(403)
    expect(transactionCallCount).toBe(0)
  })

  test('저장 한도에 도달하면 403 확장 필요 응답을 반환한다', async () => {
    const { tx } = createImportTx({ currentCount: 500, existingIds: [] })

    scenario.tx = tx

    const response = await importBookmarksApp.request(
      '/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'merge',
          bookmarks: [{ mangaId: 101 }],
        }),
      },
      { userId: 1, isAdult: true },
    )

    expect(response.status).toBe(403)

    const problem = (await response.json()) as ValidationProblemDetails
    expect(problem.type).toContain('/problems/libo-expansion-required')
  })

  test('유효하지 않은 body면 400을 반환한다', async () => {
    const response = await importBookmarksApp.request(
      '/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'merge',
          bookmarks: [],
        }),
      },
      { userId: 1, isAdult: true },
    )

    expect(response.status).toBe(400)
    expect(transactionCallCount).toBe(0)
  })
})
