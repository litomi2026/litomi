import { sql } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'

import { Env } from '@/backend'
import { requireAdult } from '@/backend/middleware/adult'
import { requireAuth } from '@/backend/middleware/require-auth'
import { problemResponse } from '@/backend/utils/problem'
import { bookmarkTable, readingHistoryTable, userRatingTable } from '@/database/supabase/activity'
import { db } from '@/database/supabase/drizzle'
import { createCacheControl } from '@/utils/cache-control'
import { sec } from '@/utils/format/date'

export type GETV1LibrarySummaryResponse = {
  bookmarkCount: number
  historyCount: number
  ratingCount: number
}

const librarySummaryRoutes = new Hono<Env>()

librarySummaryRoutes.get('/', requireAuth, requireAdult, async (c) => {
  const userId = c.get('userId')!

  try {
    const [counts] = await db.execute<GETV1LibrarySummaryResponse>(sql`
      SELECT 
        (SELECT COUNT(*)::int FROM ${bookmarkTable} WHERE ${bookmarkTable.userId} = ${userId}) as "bookmarkCount",
        (SELECT COUNT(*)::int FROM ${readingHistoryTable} WHERE ${readingHistoryTable.userId} = ${userId}) as "historyCount",
        (SELECT COUNT(*)::int FROM ${userRatingTable} WHERE ${userRatingTable.userId} = ${userId}) as "ratingCount"
    `)

    const result = {
      bookmarkCount: counts?.bookmarkCount ?? 0,
      historyCount: counts?.historyCount ?? 0,
      ratingCount: counts?.ratingCount ?? 0,
    }

    const cacheControl = createCacheControl({ private: true, maxAge: sec('1 minute') })

    return c.json<GETV1LibrarySummaryResponse>(result, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '요약 정보를 불러오지 못했어요' })
  }
})

export default librarySummaryRoutes
