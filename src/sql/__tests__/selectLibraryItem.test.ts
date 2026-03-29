import type { SQL } from 'drizzle-orm'

import { beforeEach, describe, expect, mock, test } from 'bun:test'
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

const { selectLibraryItem } = await import('../selectLibraryItem')

describe('selectLibraryItem', () => {
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

    await selectLibraryItem({
      libraryId: 7,
      limit: 3,
      sort: CollectionItemSort.CREATED_ASC,
      cursorMangaId: 42,
      cursorTime,
    })

    expect(queryState.limit).toBe(3)

    const whereQuery = dialect.sqlToQuery(queryState.whereClause!)
    expect(whereQuery.sql).toContain('"library_item"."library_id" = $1')
    expect(whereQuery.sql).toContain('"library_item"."created_at" > $2')
    expect(whereQuery.sql).toContain('"library_item"."created_at" = $3')
    expect(whereQuery.sql).toContain('"library_item"."manga_id" > $4')
    expect(whereQuery.params).toEqual([7, cursorTime.toISOString(), cursorTime.toISOString(), 42])

    expect(queryState.orderByClauses).toHaveLength(2)
    expect(dialect.sqlToQuery(queryState.orderByClauses[0]).sql).toContain('"library_item"."created_at" asc')
    expect(dialect.sqlToQuery(queryState.orderByClauses[1]).sql).toContain('"library_item"."manga_id" asc')
  })

  test('limit이 없으면 base query를 그대로 실행한다', async () => {
    const rows = await selectLibraryItem({ libraryId: 7 })

    expect(rows).toEqual(nextRows)
    expect(limitMock).not.toHaveBeenCalled()

    const whereQuery = dialect.sqlToQuery(queryState.whereClause!)
    expect(whereQuery.sql).toBe('"library_item"."library_id" = $1')
    expect(whereQuery.params).toEqual([7])
  })
})
