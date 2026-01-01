import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { privateCacheControl } from '@/backend/utils/cache-control'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { MAX_MANGA_ID } from '@/constants/policy'
import { readingHistoryTable } from '@/database/supabase/activity'
import { db } from '@/database/supabase/drizzle'

const paramSchema = z.object({
  id: z.coerce.number().int().positive().max(MAX_MANGA_ID),
})

export type GETV1MangaIdHistoryResponse = number | null

const mangaRoutes = new Hono<Env>()

mangaRoutes.get('/:id/history', zProblemValidator('param', paramSchema), async (c) => {
  const userId = c.get('userId')

  if (!userId) {
    return problemResponse(c, { status: 401 })
  }

  try {
    const { id: mangaId } = c.req.valid('param')

    const [history] = await db
      .select({ lastPage: readingHistoryTable.lastPage })
      .from(readingHistoryTable)
      .where(and(eq(readingHistoryTable.userId, userId), eq(readingHistoryTable.mangaId, mangaId)))

    if (!history) {
      return problemResponse(c, { status: 404, detail: '감상 기록이 없어요' })
    }

    return c.json<GETV1MangaIdHistoryResponse>(history.lastPage, { headers: { 'Cache-Control': privateCacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '감상 기록을 불러오지 못했어요' })
  }
})

export default mangaRoutes
