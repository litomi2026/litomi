import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod/v4'

import { Env } from '@/backend'
import { getUserId } from '@/backend/utils/auth'
import { MAX_MANGA_ID } from '@/constants/policy'
import { createCacheControl } from '@/crawler/proxy-utils'
import { db } from '@/database/supabase/drizzle'
import { readingHistoryTable } from '@/database/supabase/schema'

const GETReadingHistoryParamsSchema = z.object({
  id: z.coerce.number().int().positive().max(MAX_MANGA_ID),
})

export type GETV1MangaIdHistoryResponse = number | null

const mangaRoutes = new Hono<Env>()

mangaRoutes.get('/:id/history', async (c) => {
  const userId = getUserId()

  if (!userId) {
    throw new HTTPException(401)
  }

  const validation = GETReadingHistoryParamsSchema.safeParse({
    id: c.req.param('id'),
  })

  if (!validation.success) {
    throw new HTTPException(400)
  }

  const { id: mangaId } = validation.data

  const [history] = await db
    .select({ lastPage: readingHistoryTable.lastPage })
    .from(readingHistoryTable)
    .where(and(eq(readingHistoryTable.userId, userId), eq(readingHistoryTable.mangaId, mangaId)))

  const cacheControl = createCacheControl({
    private: true,
    maxAge: 3,
  })

  if (!history) {
    return c.body(null, 204, { 'Cache-Control': cacheControl })
  }

  return c.json<GETV1MangaIdHistoryResponse>(history.lastPage, { headers: { 'Cache-Control': cacheControl } })
})

export default mangaRoutes
