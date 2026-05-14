import type { SQL } from 'drizzle-orm'

import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test'
import { PgDialect } from 'drizzle-orm/pg-core'

import { CollectionItemSort } from '@/backend/api/v1/library/item-sort'

const dialect = new PgDialect()

const queryState: {
  whereClause: SQL | undefined
  orderByClauses: SQL[]
  limit: number | undefined
} = {
  whereClause: undefined,
  orderByClauses: [],
  limit: undefined,
}

let nextRows: Array<{ mangaId: number; createdAt: Date }> = []

afterAll(() => {
  mock.restore()
})

const limitMock = mock((limit: number) => {
  queryState.limit = limit
  return Promise.resolve(nextRows)
})

const query = {
  limit: limitMock,
  then: (resolve: (value: typeof nextRows) => unknown, reject?: (reason: unknown) => unknown) =>
    Promise.resolve(nextRows).then(resolve, reject),
}

const orderByMock = mock((...clauses: SQL[]) => {
  queryState.orderByClauses = clauses
  return query
})

const whereMock = mock((whereClause: SQL) => {
  queryState.whereClause = whereClause
  return { orderBy: orderByMock }
})

const fromMock = mock(() => ({ where: whereMock }))
const selectMock = mock(() => ({ from: fromMock }))

mock.module('@/database/supabase/drizzle', () => ({
  db: {
    select: selectMock,
  },
}))

const { selectBookmark } = await import('../selectBookmark')

describe('selectBookmark', () => {
  beforeEach(() => {
    nextRows = [{ mangaId: 100, createdAt: new Date('2025-01-01T00:00:00.000Z') }]
    queryState.whereClause = undefined
    queryState.orderByClauses = []
    queryState.limit = undefined

    limitMock.mockClear()
    orderByMock.mockClear()
    whereMock.mockClear()
    fromMock.mockClear()
    selectMock.mockClear()
  })

  test('커서와 limit을 함께 받아 안정적인 페이지네이션 쿼리를 만든다', async () => {
    const cursorTime = new Date('2025-01-10T00:00:00.000Z')
    nextRows = [{ mangaId: 90, createdAt: new Date('2025-01-09T00:00:00.000Z') }]

    const rows = await selectBookmark({
      userId: 1,
      limit: 3,
      cursorMangaId: 42,
      cursorTime,
    })

    expect(rows).toEqual(nextRows)
    expect(queryState.limit).toBe(3)

    const whereQuery = dialect.sqlToQuery(queryState.whereClause!)
    expect(whereQuery.sql).toContain('"bookmark"."user_id" = $1')
    expect(whereQuery.sql).toContain('"bookmark"."created_at" < $2')
    expect(whereQuery.sql).toContain('"bookmark"."created_at" = $3')
    expect(whereQuery.sql).toContain('"bookmark"."manga_id" < $4')
    expect(whereQuery.params).toEqual([1, cursorTime.toISOString(), cursorTime.toISOString(), 42])

    expect(queryState.orderByClauses).toHaveLength(2)
    expect(dialect.sqlToQuery(queryState.orderByClauses[0]).sql).toContain('"bookmark"."created_at" desc')
    expect(dialect.sqlToQuery(queryState.orderByClauses[1]).sql).toContain('"bookmark"."manga_id" desc')
  })

  test('limit이 없으면 base query를 그대로 실행한다', async () => {
    const rows = await selectBookmark({ userId: 1 })

    expect(rows).toEqual(nextRows)
    expect(limitMock).not.toHaveBeenCalled()

    const whereQuery = dialect.sqlToQuery(queryState.whereClause!)
    expect(whereQuery.sql).toBe('"bookmark"."user_id" = $1')
    expect(whereQuery.params).toEqual([1])
  })

  test('오래된순 정렬을 요청하면 ascending order를 사용한다', async () => {
    await selectBookmark({ userId: 1, sort: CollectionItemSort.CREATED_ASC })

    expect(queryState.orderByClauses).toHaveLength(2)
    expect(dialect.sqlToQuery(queryState.orderByClauses[0]).sql).toContain('"bookmark"."created_at" asc')
    expect(dialect.sqlToQuery(queryState.orderByClauses[1]).sql).toContain('"bookmark"."manga_id" asc')
  })

  test('0 이하의 limit은 즉시 거부한다', () => {
    expect(selectBookmark({ userId: 1, limit: 0 })).rejects.toThrow()
    expect(selectMock).not.toHaveBeenCalled()
  })

  test('부분적인 커서 입력은 허용하지 않는다', () => {
    expect(selectBookmark({ userId: 1, cursorTime: new Date() })).rejects.toThrow()
    expect(selectMock).not.toHaveBeenCalled()
  })

  test('잘못된 cursorTime은 즉시 거부한다', () => {
    expect(
      selectBookmark({
        userId: 1,
        cursorMangaId: 42,
        cursorTime: new Date('invalid'),
      }),
    ).rejects.toThrow()

    expect(selectMock).not.toHaveBeenCalled()
  })
})
