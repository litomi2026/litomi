import { avg, count, desc, gte, sql } from 'drizzle-orm'
import ms from 'ms'

import { TOP_MANGA_PER_PAGE } from '@/constants/policy'
import { db } from '@/database/supabase/drizzle'
import { bookmarkTable, libraryItemTable, readingHistoryTable, userRatingTable } from '@/database/supabase/schema'

import { MetricParam, PeriodParam } from '../../../common'

export async function getRankingData(metric: MetricParam, period: PeriodParam) {
  const periodStart = getPeriodStart(period)
  let query

  switch (metric) {
    case MetricParam.BOOKMARK: {
      query = db
        .select({
          mangaId: bookmarkTable.mangaId,
          bookmarkCount: count(bookmarkTable.userId),
        })
        .from(bookmarkTable)
        .groupBy(bookmarkTable.mangaId)
        .orderBy(({ bookmarkCount }) => desc(bookmarkCount))
        .limit(TOP_MANGA_PER_PAGE)
        .$dynamic()

      if (periodStart) {
        query = query.where(gte(bookmarkTable.createdAt, periodStart))
      }
      break
    }

    case MetricParam.LIBRARY: {
      query = db
        .select({
          mangaId: libraryItemTable.mangaId,
          score: count(libraryItemTable.libraryId),
        })
        .from(libraryItemTable)
        .groupBy(libraryItemTable.mangaId)
        .orderBy(({ score }) => desc(score))
        .limit(TOP_MANGA_PER_PAGE)
        .$dynamic()

      if (periodStart) {
        query = query.where(gte(libraryItemTable.createdAt, periodStart))
      }
      break
    }

    // TODO: 지금은 데이터가 부족해서 추후 추가하기
    // case MetricParam.POST: {
    //   query = db
    //     .select({
    //       mangaId: sql<number>`${postTable.mangaId}`,
    //       score: count(postTable.userId),
    //     })
    //     .from(postTable)
    //     .where(isNotNull(postTable.mangaId))
    //     .groupBy(postTable.mangaId)
    //     .orderBy(({ score }) => desc(score))
    //     .limit(MANGA_TOP_PER_PAGE)
    //     .$dynamic()
    //
    //   if (periodStart) {
    //     query = query.where(and(isNotNull(postTable.mangaId), gte(postTable.createdAt, periodStart)))
    //   }
    //   break
    // }

    case MetricParam.RATING: {
      // 베이지안 평균 (Weighted Rating)
      // WR = (v / (v + m)) * R + (m / (v + m)) * C
      const m = 1 // 가중치를 위한 최소 투표 수
      const C = 3.0 // 전체 평균 평점 (보정값)
      const v = sql<number>`${count(userRatingTable.userId)}::numeric`
      const R = avg(userRatingTable.rating)
      const weightedRating = sql<number>`(${v} / (${v} + ${m})) * ${R} + (${m} / (${v} + ${m})) * ${C}`

      query = db
        .select({
          mangaId: userRatingTable.mangaId,
          averageRating: R,
          ratingCount: count(userRatingTable.userId),
        })
        .from(userRatingTable)
        .groupBy(userRatingTable.mangaId)
        .orderBy(desc(weightedRating))
        .limit(TOP_MANGA_PER_PAGE)
        .$dynamic()

      if (periodStart) {
        query = query.where(gte(userRatingTable.createdAt, periodStart))
      }
      break
    }

    case MetricParam.VIEW: {
      query = db
        .select({
          mangaId: readingHistoryTable.mangaId,
          viewCount: count(readingHistoryTable.userId),
        })
        .from(readingHistoryTable)
        .groupBy(readingHistoryTable.mangaId)
        .orderBy(({ viewCount }) => desc(viewCount))
        .limit(TOP_MANGA_PER_PAGE)
        .$dynamic()

      if (periodStart) {
        query = query.where(gte(readingHistoryTable.updatedAt, periodStart))
      }
      break
    }

    default:
      return []
  }

  const rankings = await query

  if (rankings.length === 0) {
    return null
  }

  return rankings
}

function getPeriodStart(period: PeriodParam): Date | null {
  const now = new Date()
  switch (period) {
    case PeriodParam.DAY:
      return new Date(now.getTime() - ms('1 day'))
    case PeriodParam.MONTH:
      return new Date(now.getTime() - ms('30 days'))
    case PeriodParam.QUARTER:
      return new Date(now.getTime() - ms('0.25 year'))
    case PeriodParam.WEEK:
      return new Date(now.getTime() - ms('1 week'))
    case PeriodParam.YEAR:
      return new Date(now.getTime() - ms('1 year'))
    // TODO: 지금은 데이터가 부족해서 추후 추가하기
    default:
      return null
  }
}
