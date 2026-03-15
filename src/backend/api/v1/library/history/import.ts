import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { syncReadingHistoriesTx } from '@/backend/api/v1/reading-history'
import { requireAdult } from '@/backend/middleware/adult'
import { requireAuth } from '@/backend/middleware/require-auth'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { POINT_CONSTANTS } from '@/constants/points'
import { MAX_MANGA_ID } from '@/constants/policy'
import { db } from '@/database/supabase/drizzle'

const importSchema = z.object({
  items: z
    .array(
      z.object({
        mangaId: z.number().int().positive().max(MAX_MANGA_ID),
        lastPage: z.number().int().positive().max(32767),
        updatedAt: z.coerce.number().int().positive(),
      }),
    )
    .min(1)
    .max(POINT_CONSTANTS.HISTORY_MAX_EXPANSION),
})

export type POSTV1LibraryHistoryImportBody = z.infer<typeof importSchema>

const route = new Hono<Env>()

route.post('/', requireAuth, requireAdult, zProblemValidator('json', importSchema), async (c) => {
  const userId = c.get('userId')!
  const { items } = c.req.valid('json')

  try {
    await db.transaction(async (tx) => {
      await syncReadingHistoriesTx(tx, userId, items)
    })

    return c.body(null, 204)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '읽기 기록 가져오기에 실패했어요' })
  }
})

export default route
