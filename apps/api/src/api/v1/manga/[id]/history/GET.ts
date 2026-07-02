import { type GETV1MangaIdHistoryResponse, mangaIdParamSchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { readingHistoryTable } from '@litomi/db/app/activity'
import { readUserSettings } from '@litomi/db/app/query/user-settings'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAdult } from '@/middleware/require-adult'
import { requireAuth } from '@/middleware/require-auth'
import { privateCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.get('/:id/history', requireAuth, requireAdult, zProblemValidator('param', mangaIdParamSchema), async (c) => {
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

    const response = history.lastPage satisfies GETV1MangaIdHistoryResponse

    return c.json(response, { headers: { 'Cache-Control': privateCacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '감상 기록을 불러오지 못했어요' })
  }
})

export default route
