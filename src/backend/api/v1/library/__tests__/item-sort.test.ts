import { describe, expect, test } from 'bun:test'
import { PgDialect } from 'drizzle-orm/pg-core'

import { bookmarkTable } from '@/database/supabase/activity'

import { CollectionItemSort } from '../item-sort'
import {
  getCollectionItemCursorCondition,
  getCollectionItemOrderByClauses,
  getNextCollectionItemCursor,
} from '../item-sort.server'

const dialect = new PgDialect()

describe('collection item sort helpers', () => {
  test('created 정렬은 createdAt과 mangaId를 함께 정렬한다', () => {
    const descendingOrder = getCollectionItemOrderByClauses(CollectionItemSort.CREATED_DESC, bookmarkTable)
    const ascendingOrder = getCollectionItemOrderByClauses(CollectionItemSort.CREATED_ASC, bookmarkTable)

    expect(descendingOrder).toHaveLength(2)
    expect(dialect.sqlToQuery(descendingOrder[0]).sql).toContain('"bookmark"."created_at" desc')
    expect(dialect.sqlToQuery(descendingOrder[1]).sql).toContain('"bookmark"."manga_id" desc')

    expect(ascendingOrder).toHaveLength(2)
    expect(dialect.sqlToQuery(ascendingOrder[0]).sql).toContain('"bookmark"."created_at" asc')
    expect(dialect.sqlToQuery(ascendingOrder[1]).sql).toContain('"bookmark"."manga_id" asc')
  })

  test('manga id 정렬은 mangaId 기준으로 정렬한다', () => {
    const descendingOrder = getCollectionItemOrderByClauses(CollectionItemSort.MANGA_ID_DESC, bookmarkTable)
    const ascendingOrder = getCollectionItemOrderByClauses(CollectionItemSort.MANGA_ID_ASC, bookmarkTable)

    expect(descendingOrder).toHaveLength(1)
    expect(dialect.sqlToQuery(descendingOrder[0]).sql).toContain('"bookmark"."manga_id" desc')

    expect(ascendingOrder).toHaveLength(1)
    expect(dialect.sqlToQuery(ascendingOrder[0]).sql).toContain('"bookmark"."manga_id" asc')
  })

  test('created asc 커서는 더 큰 timestamp와 mangaId를 기준으로 다음 페이지를 만든다', () => {
    const condition = getCollectionItemCursorCondition(
      CollectionItemSort.CREATED_ASC,
      {
        mangaId: 42,
        timestamp: new Date('2025-01-10T00:00:00.000Z').getTime(),
      },
      bookmarkTable,
    )

    const query = dialect.sqlToQuery(condition)

    expect(query.sql).toContain('"bookmark"."created_at" > $1')
    expect(query.sql).toContain('"bookmark"."created_at" = $2')
    expect(query.sql).toContain('"bookmark"."manga_id" > $3')
  })

  test('created desc 커서는 더 작은 timestamp와 mangaId를 기준으로 다음 페이지를 만든다', () => {
    const condition = getCollectionItemCursorCondition(
      CollectionItemSort.CREATED_DESC,
      {
        mangaId: 42,
        timestamp: new Date('2025-01-10T00:00:00.000Z').getTime(),
      },
      bookmarkTable,
    )

    const query = dialect.sqlToQuery(condition)

    expect(query.sql).toContain('"bookmark"."created_at" < $1')
    expect(query.sql).toContain('"bookmark"."created_at" = $2')
    expect(query.sql).toContain('"bookmark"."manga_id" < $3')
  })

  test('manga id 정렬 커서는 mangaId만 비교한다', () => {
    const ascendingCondition = getCollectionItemCursorCondition(
      CollectionItemSort.MANGA_ID_ASC,
      {
        mangaId: 42,
        timestamp: new Date('2025-01-10T00:00:00.000Z').getTime(),
      },
      bookmarkTable,
    )
    const descendingCondition = getCollectionItemCursorCondition(
      CollectionItemSort.MANGA_ID_DESC,
      {
        mangaId: 42,
        timestamp: new Date('2025-01-10T00:00:00.000Z').getTime(),
      },
      bookmarkTable,
    )

    expect(dialect.sqlToQuery(ascendingCondition).sql).toContain('"bookmark"."manga_id" > $1')
    expect(dialect.sqlToQuery(descendingCondition).sql).toContain('"bookmark"."manga_id" < $1')
  })

  test('다음 커서는 createdAt timestamp와 mangaId를 인코딩한다', () => {
    expect(
      getNextCollectionItemCursor({
        mangaId: 321,
        createdAt: new Date('2025-01-10T00:00:00.000Z'),
      }),
    ).toBe(`${new Date('2025-01-10T00:00:00.000Z').getTime()}-321`)
  })
})
