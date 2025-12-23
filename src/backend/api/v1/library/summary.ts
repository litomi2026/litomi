import { sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import 'server-only'

import { Env } from '@/backend'
import { getUserId } from '@/backend/utils/auth'
import { createCacheControl } from '@/crawler/proxy-utils'
import { db } from '@/database/supabase/drizzle'
import { bookmarkTable, readingHistoryTable, userRatingTable } from '@/database/supabase/schema'
import { sec } from '@/utils/date'

export type GETV1LibrarySummaryResponse = {
  bookmarkCount: number
  historyCount: number
  ratingCount: number
}

const librarySummaryRoutes = new Hono<Env>()

librarySummaryRoutes.get('/', async (c) => {
  const userId = getUserId()

  if (!userId) {
    throw new HTTPException(401)
  }

  const [counts] = await db.execute<GETV1LibrarySummaryResponse>(sql`
    SELECT 
      (SELECT COUNT(*)::int FROM ${bookmarkTable} WHERE ${bookmarkTable.userId} = ${userId}) as "bookmarkCount",
      (SELECT COUNT(*)::int FROM ${readingHistoryTable} WHERE ${readingHistoryTable.userId} = ${userId}) as "historyCount",
      (SELECT COUNT(*)::int FROM ${userRatingTable} WHERE ${userRatingTable.userId} = ${userId}) as "ratingCount"
  `)

  const result: GETV1LibrarySummaryResponse = {
    bookmarkCount: counts?.bookmarkCount ?? 0,
    historyCount: counts?.historyCount ?? 0,
    ratingCount: counts?.ratingCount ?? 0,
  }

  const cacheControl = createCacheControl({ private: true, maxAge: sec('1 minute') })
  return c.json(result, { headers: { 'Cache-Control': cacheControl } })
})

export default librarySummaryRoutes
