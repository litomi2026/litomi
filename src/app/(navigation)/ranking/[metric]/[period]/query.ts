import { and, count, desc, gte, isNotNull, sql } from 'drizzle-orm'
import ms from 'ms'
import { unstable_cache } from 'next/cache'

import { MANGA_TOP_PER_PAGE } from '@/constants/policy'
import { db } from '@/database/supabase/drizzle'
import { bookmarkTable, libraryItemTable, postTable, readingHistoryTable } from '@/database/supabase/schema'
import { sec } from '@/utils/date'

import { MetricParam, PeriodParam } from '../../common'

function getPeriodStart(period: PeriodParam): Date | null {
  const now = new Date()
  switch (period) {
    case PeriodParam.ALL:
      return null
    case PeriodParam.DAY:
      return new Date(now.getTime() - ms('1 day'))
    case PeriodParam.HALF:
      return new Date(now.getTime() - ms('0.5 year'))
    case PeriodParam.MONTH:
      return new Date(now.getTime() - ms('30 days'))
    case PeriodParam.QUARTER:
      return new Date(now.getTime() - ms('0.25 year'))
    case PeriodParam.WEEK:
      return new Date(now.getTime() - ms('1 week'))
    case PeriodParam.YEAR:
      return new Date(now.getTime() - ms('1 year'))
  }
}

export const getRankingData = unstable_cache(
  async (metric: MetricParam, period: PeriodParam) => {
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
          .limit(MANGA_TOP_PER_PAGE)
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
          .limit(MANGA_TOP_PER_PAGE)
          .$dynamic()

        if (periodStart) {
          query = query.where(gte(libraryItemTable.createdAt, periodStart))
        }
        break
      }

      case MetricParam.POST: {
        query = db
          .select({
            mangaId: sql<number>`${postTable.mangaId}`,
            score: count(postTable.userId),
          })
          .from(postTable)
          .where(isNotNull(postTable.mangaId))
          .groupBy(postTable.mangaId)
          .orderBy(({ score }) => desc(score))
          .limit(MANGA_TOP_PER_PAGE)
          .$dynamic()

        if (periodStart) {
          query = query.where(and(isNotNull(postTable.mangaId), gte(postTable.createdAt, periodStart)))
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
          .limit(MANGA_TOP_PER_PAGE)
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
  },
  ['ranking'],
  { revalidate: sec('6 hours') },
)
