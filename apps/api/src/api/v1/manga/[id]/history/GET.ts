import { readingHistoryTable } from '@litomi/db/database/app/activity'
import { db } from '@litomi/db/database/app/drizzle'
import 'server-only'
import { readUserSettings } from '@litomi/db/query/user-settings.query'
import { MAX_MANGA_ID } from '@litomi/domain/constants/policy'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import type { Env } from '@/app'

import { requireAdult } from '@/middleware/adult'
import { requireAuth } from '@/middleware/require-auth'
import { privateCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const paramSchema = z.object({
  id: z.coerce.number().int().positive().max(MAX_MANGA_ID),
})

export type GETV1MangaIdHistoryResponse = number

const route = new Hono<Env>()

route.get('/:id/history', requireAuth, requireAdult, zProblemValidator('param', paramSchema), async (c) => {
  const userId = c.get('userId')!

  const { id: mangaId } = c.req.valid('param')

  try {
    const settings = await readUserSettings(userId)

    if (!settings.historySyncEnabled) {
      return new Response(null, { status: 204, headers: { 'Cache-Control': privateCacheControl } })
    }

    const [history] = await db
      .select({ lastPage: readingHistoryTable.lastPage })
      .from(readingHistoryTable)
      .where(and(eq(readingHistoryTable.userId, userId), eq(readingHistoryTable.mangaId, mangaId)))

    if (!history) {
      return new Response(null, { status: 204, headers: { 'Cache-Control': privateCacheControl } })
    }

    return c.json<GETV1MangaIdHistoryResponse>(history.lastPage, { headers: { 'Cache-Control': privateCacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '감상 기록을 불러오지 못했어요' })
  }
})

export default route
