import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { syncReadingHistoriesTx } from '@/backend/api/v1/reading-history'
import { requireAdult } from '@/backend/middleware/adult'
import { requireAuth } from '@/backend/middleware/require-auth'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { MAX_MANGA_ID } from '@/constants/policy'
import { db } from '@/database/supabase/drizzle'

const paramSchema = z.object({
  id: z.coerce.number().int().positive().max(MAX_MANGA_ID),
})

const postBodySchema = z.object({
  lastPage: z.coerce.number().int().positive().max(32767),
})

export type POSTV1MangaIdHistoryBody = z.infer<typeof postBodySchema>

const route = new Hono<Env>()

route.post(
  '/:id/history',
  requireAuth,
  requireAdult,
  zProblemValidator('param', paramSchema),
  zProblemValidator('json', postBodySchema),
  async (c) => {
    const userId = c.get('userId')!
    const { id: mangaId } = c.req.valid('param')
    const { lastPage } = c.req.valid('json')

    try {
      await db.transaction(async (tx) => {
        await syncReadingHistoriesTx(tx, userId, [{ mangaId, lastPage, updatedAt: new Date() }])
      })

      return c.body(null, 204)
    } catch (error) {
      console.error(error)
      return problemResponse(c, { status: 500, detail: '읽기 기록 저장에 실패했어요' })
    }
  },
)

export default route
