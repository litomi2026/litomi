import { afterAll, beforeAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { PgDialect } from 'drizzle-orm/pg-core'

import type { ValidationProblemDetails } from '@/utils/problem-details'

import { createRouteTestApp } from './route-test-utils'

type DeleteBookmarkByIdRouteModule = typeof import('../[id]/DELETE')

type DeleteBookmarkResponse = {
  deletedCount: number
}

type DeleteBookmarkRouteModule = typeof import('../DELETE')

type MutationScenario = {
  transactionError: Error | null
  tx: Record<string, unknown>
}

type PutBookmarkByIdRouteModule = typeof import('../[id]/PUT')

type PutBookmarkResponse = {
  createdAt: number
  mangaId: number
}

const dialect = new PgDialect()

let deleteBookmarkApp: ReturnType<typeof createRouteTestApp>
let deleteBookmarkByIdApp: ReturnType<typeof createRouteTestApp>
let deleteBookmarkByIdRoute: DeleteBookmarkByIdRouteModule['default']
let deleteBookmarkRoute: DeleteBookmarkRouteModule['default']
let putBookmarkByIdApp: ReturnType<typeof createRouteTestApp>
let putBookmarkByIdRoute: PutBookmarkByIdRouteModule['default']
let scenario: MutationScenario

const lockCalls: Array<{ tx: unknown; userId: number }> = []

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

  putBookmarkByIdRoute = (await import('../[id]/PUT')).default
  deleteBookmarkByIdRoute = (await import('../[id]/DELETE')).default
  deleteBookmarkRoute = (await import('../DELETE')).default

  putBookmarkByIdApp = createRouteTestApp(putBookmarkByIdRoute, '/:id')
  deleteBookmarkByIdApp = createRouteTestApp(deleteBookmarkByIdRoute, '/:id')
  deleteBookmarkApp = createRouteTestApp(deleteBookmarkRoute)
})

beforeEach(() => {
  scenario = {
    transactionError: null,
    tx: {},
  }

  lockCalls.length = 0
  transactionCallCount = 0
})

function createBulkDeleteTx(deletedCount: number) {
  const whereConditions: unknown[] = []

  return {
    whereConditions,
    tx: {
      delete: () => ({
        where: (condition: unknown) => {
          whereConditions.push(condition)

          return {
            returning: async () =>
              Array.from({ length: deletedCount }, () => ({
                deleted: 1,
              })),
          }
        },
      }),
    },
  }
}

function createDeleteByIdTx() {
  const whereConditions: unknown[] = []

  return {
    whereConditions,
    tx: {
      delete: () => ({
        where: async (condition: unknown) => {
          whereConditions.push(condition)
          return []
        },
      }),
    },
  }
}

function createPutTx(
  options: {
    currentCount?: number
    expansionAmount?: number
    existingCreatedAt?: Date
    insertedCreatedAt?: Date | null
  } = {},
) {
  const insertValues: Array<{ mangaId: number; userId: number }> = []
  let selectCallCount = 0

  return {
    insertValues,
    tx: {
      select: () => ({
        from: () => ({
          where: async () => {
            const currentCall = ++selectCallCount

            if (currentCall === 1) {
              return options.existingCreatedAt ? [{ createdAt: options.existingCreatedAt }] : []
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
        values: (values: { mangaId: number; userId: number }) => {
          insertValues.push(values)

          return {
            returning: async () =>
              options.insertedCreatedAt === null ? [] : [{ createdAt: options.insertedCreatedAt ?? new Date() }],
          }
        },
      }),
    },
  }
}

function extractWhereListParams(condition: unknown): Record<string, number[]> {
  const params: Record<string, number[]> = {}
  const { params: queryParams, sql } = dialect.sqlToQuery(condition as Parameters<typeof dialect.sqlToQuery>[0])

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
  const { params: queryParams, sql } = dialect.sqlToQuery(condition as Parameters<typeof dialect.sqlToQuery>[0])

  for (const match of sql.matchAll(/"bookmark"\."([^"]+)" = \$(\d+)/g)) {
    const [, columnName, paramIndex] = match
    const value = queryParams[Number(paramIndex) - 1]

    if (typeof value === 'number') {
      params[columnName] = value
    }
  }

  return params
}

describe('PUT /api/v1/bookmark/:id', () => {
  test('북마크가 없으면 생성하고 201을 반환한다', async () => {
    const insertedCreatedAt = new Date('2025-01-10T00:00:00.000Z')
    const { tx, insertValues } = createPutTx({
      currentCount: 0,
      insertedCreatedAt,
    })

    scenario.tx = tx

    const response = await putBookmarkByIdApp.request('/101', { method: 'PUT' }, { userId: 1 })

    expect(response.status).toBe(201)
    expect(transactionCallCount).toBe(1)
    expect(lockCalls).toEqual([{ tx, userId: 1 }])
    expect(insertValues).toEqual([{ userId: 1, mangaId: 101 }])

    const data = (await response.json()) as PutBookmarkResponse

    expect(data).toEqual({
      mangaId: 101,
      createdAt: insertedCreatedAt.getTime(),
    })
  })

  test('이미 있으면 200을 반환하고 다시 삽입하지 않는다', async () => {
    const existingCreatedAt = new Date('2025-01-03T00:00:00.000Z')
    const { tx, insertValues } = createPutTx({ existingCreatedAt })

    scenario.tx = tx

    const response = await putBookmarkByIdApp.request('/101', { method: 'PUT' }, { userId: 1 })

    expect(response.status).toBe(200)
    expect(lockCalls).toEqual([{ tx, userId: 1 }])
    expect(insertValues).toHaveLength(0)

    const data = (await response.json()) as PutBookmarkResponse

    expect(data).toEqual({
      mangaId: 101,
      createdAt: existingCreatedAt.getTime(),
    })
  })

  test('북마크 한도에 도달하면 403을 반환한다', async () => {
    const { tx, insertValues } = createPutTx({ currentCount: 500 })

    scenario.tx = tx

    const response = await putBookmarkByIdApp.request('/101', { method: 'PUT' }, { userId: 1 })

    expect(response.status).toBe(403)
    expect(insertValues).toHaveLength(0)

    const problem = (await response.json()) as ValidationProblemDetails
    expect(problem.type).toContain('/problems/libo-expansion-required')
  })

  test('삽입 결과가 비어 있으면 500을 반환한다', async () => {
    const { tx } = createPutTx({
      currentCount: 0,
      insertedCreatedAt: null,
    })

    scenario.tx = tx

    const response = await putBookmarkByIdApp.request('/101', { method: 'PUT' }, { userId: 1 })

    expect(response.status).toBe(500)
  })

  test('인증되지 않은 사용자는 401을 반환한다', async () => {
    const response = await putBookmarkByIdApp.request('/101', { method: 'PUT' }, {})

    expect(response.status).toBe(401)
    expect(transactionCallCount).toBe(0)
  })

  test('유효하지 않은 manga id는 400을 반환한다', async () => {
    const response = await putBookmarkByIdApp.request('/0', { method: 'PUT' }, { userId: 1 })

    expect(response.status).toBe(400)
    expect(transactionCallCount).toBe(0)
  })
})

describe('DELETE /api/v1/bookmark/:id', () => {
  test('해당 북마크 삭제 쿼리를 실행하고 204를 반환한다', async () => {
    const { tx, whereConditions } = createDeleteByIdTx()

    scenario.tx = tx

    const response = await deleteBookmarkByIdApp.request('/101', { method: 'DELETE' }, { userId: 1 })

    expect(response.status).toBe(204)
    expect(transactionCallCount).toBe(1)
    expect(lockCalls).toEqual([{ tx, userId: 1 }])
    expect(whereConditions).toHaveLength(1)
    expect(extractWhereParams(whereConditions[0])).toEqual({
      user_id: 1,
      manga_id: 101,
    })
  })

  test('내부 오류가 나면 500을 반환한다', async () => {
    scenario.transactionError = new Error('Database connection failed')

    const response = await deleteBookmarkByIdApp.request('/101', { method: 'DELETE' }, { userId: 1 })

    expect(response.status).toBe(500)
  })

  test('인증되지 않은 사용자는 401을 반환한다', async () => {
    const response = await deleteBookmarkByIdApp.request('/101', { method: 'DELETE' }, {})

    expect(response.status).toBe(401)
    expect(transactionCallCount).toBe(0)
  })

  test('유효하지 않은 manga id는 400을 반환한다', async () => {
    const response = await deleteBookmarkByIdApp.request('/0', { method: 'DELETE' }, { userId: 1 })

    expect(response.status).toBe(400)
    expect(transactionCallCount).toBe(0)
  })
})

describe('DELETE /api/v1/bookmark', () => {
  test('삭제된 행 수를 deletedCount로 반환한다', async () => {
    const { tx } = createBulkDeleteTx(2)

    scenario.tx = tx

    const response = await deleteBookmarkApp.request(
      '/',
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mangaIds: [101, 103] }),
      },
      { userId: 1 },
    )

    expect(response.status).toBe(200)

    const data = (await response.json()) as DeleteBookmarkResponse

    expect(data).toEqual({ deletedCount: 2 })
  })

  test('중복된 manga id는 dedupe해서 삭제 쿼리에 전달한다', async () => {
    const { tx, whereConditions } = createBulkDeleteTx(1)

    scenario.tx = tx

    const response = await deleteBookmarkApp.request(
      '/',
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mangaIds: [101, 101, 103] }),
      },
      { userId: 1 },
    )

    expect(response.status).toBe(200)
    expect(whereConditions).toHaveLength(1)
    expect(extractWhereParams(whereConditions[0])).toEqual({ user_id: 1 })
    expect(extractWhereListParams(whereConditions[0])).toEqual({ manga_id: [101, 103] })
  })

  test('내부 오류가 나면 500을 반환한다', async () => {
    scenario.transactionError = new Error('Database connection failed')

    const response = await deleteBookmarkApp.request(
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

  test('인증되지 않은 사용자는 401을 반환한다', async () => {
    const response = await deleteBookmarkApp.request(
      '/',
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mangaIds: [101] }),
      },
      {},
    )

    expect(response.status).toBe(401)
    expect(transactionCallCount).toBe(0)
  })

  test('유효하지 않은 body면 400을 반환한다', async () => {
    const response = await deleteBookmarkApp.request(
      '/',
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mangaIds: [] }),
      },
      { userId: 1 },
    )

    expect(response.status).toBe(400)
    expect(transactionCallCount).toBe(0)
  })
})
