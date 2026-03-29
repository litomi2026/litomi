import { describe, expect, test } from 'bun:test'
import { PgDialect } from 'drizzle-orm/pg-core'

import { decodeRatingCursor } from '@/common/cursor'

import { RatingSort } from '../enum'
import { buildRatingWhereClause, getNextRatingCursor, getRatingOrderByClauses } from '../rating-sort'

const dialect = new PgDialect()

describe('rating-sort 헬퍼', () => {
  test('작품 ID 오름차순은 manga_id 기준 오름차순 페이지네이션을 만든다', () => {
    const whereClause = buildRatingWhereClause(1, RatingSort.MANGA_ID_ASC, {
      rating: 4,
      timestamp: new Date('2025-01-10T00:00:00.000Z').getTime(),
      mangaId: 42,
    })
    const whereQuery = dialect.sqlToQuery(whereClause)

    expect(whereQuery.sql).toContain('"user_rating"."user_id" = $1')
    expect(whereQuery.sql).toContain('"user_rating"."manga_id" > $2')
    expect(whereQuery.params).toEqual([1, 42])

    const orderByClauses = getRatingOrderByClauses(RatingSort.MANGA_ID_ASC)
    expect(orderByClauses).toHaveLength(1)
    expect(dialect.sqlToQuery(orderByClauses[0]).sql).toContain('"user_rating"."manga_id" asc')
  })

  test('작품 ID 내림차순은 manga_id 기준 내림차순 페이지네이션을 만든다', () => {
    const whereClause = buildRatingWhereClause(1, RatingSort.MANGA_ID_DESC, {
      rating: 4,
      timestamp: new Date('2025-01-10T00:00:00.000Z').getTime(),
      mangaId: 42,
    })
    const whereQuery = dialect.sqlToQuery(whereClause)

    expect(whereQuery.sql).toContain('"user_rating"."user_id" = $1')
    expect(whereQuery.sql).toContain('"user_rating"."manga_id" < $2')
    expect(whereQuery.params).toEqual([1, 42])

    const orderByClauses = getRatingOrderByClauses(RatingSort.MANGA_ID_DESC)
    expect(orderByClauses).toHaveLength(1)
    expect(dialect.sqlToQuery(orderByClauses[0]).sql).toContain('"user_rating"."manga_id" desc')
  })

  test('created 정렬 커서는 createdAt 타임스탬프를 사용한다', () => {
    const createdAt = new Date('2025-01-02T00:00:00.000Z')
    const updatedAt = new Date('2025-01-03T00:00:00.000Z')

    const cursor = getNextRatingCursor(RatingSort.CREATED_DESC, {
      mangaId: 100,
      rating: 5,
      createdAt,
      updatedAt,
    })

    expect(decodeRatingCursor(cursor)).toEqual({
      mangaId: 100,
      rating: 5,
      timestamp: createdAt.getTime(),
    })
  })

  test('작품 ID 정렬 커서는 기존 스키마 호환을 위해 updatedAt 타임스탬프를 유지한다', () => {
    const createdAt = new Date('2025-01-02T00:00:00.000Z')
    const updatedAt = new Date('2025-01-03T00:00:00.000Z')

    const cursor = getNextRatingCursor(RatingSort.MANGA_ID_ASC, {
      mangaId: 100,
      rating: 5,
      createdAt,
      updatedAt,
    })

    expect(decodeRatingCursor(cursor)).toEqual({
      mangaId: 100,
      rating: 5,
      timestamp: updatedAt.getTime(),
    })
  })
})
