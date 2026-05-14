import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import {
  enforceHistoryLimit,
  getUserHistoryLimitInTx,
  MAX_READING_HISTORY_LAST_PAGE,
} from '@/backend/api/v1/library/history/shared'
import { requireAdult } from '@/backend/middleware/adult'
import { requireAuth } from '@/backend/middleware/require-auth'
import { lockUserRowForUpdate } from '@/backend/utils/lock-user-row'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { MAX_MANGA_ID } from '@/constants/policy'
import { readingHistoryTable } from '@/database/supabase/activity'
import { db } from '@/database/supabase/drizzle'
import { readUserSettings } from '@/query/user-settings.query'

const paramSchema = z.object({
  id: z.coerce.number().int().positive().max(MAX_MANGA_ID),
})

const postBodySchema = z.object({
  lastPage: z.coerce.number().int().positive().max(MAX_READING_HISTORY_LAST_PAGE),
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
      const settings = await readUserSettings(userId)

      if (!settings.historySyncEnabled) {
        return c.body(null, 204)
      }

      await db.transaction(async (tx) => {
        // NOTE: 유저 락으로 동시성 보장 (감상 기록 한도 초과 방지)
        await lockUserRowForUpdate(tx, userId)

        const now = new Date()

        // NOTE: 업데이트가 가능하면(=이미 기록이 있으면) 여기서 끝
        const [updated] = await tx
          .update(readingHistoryTable)
          .set({ lastPage, updatedAt: now })
          .where(and(eq(readingHistoryTable.userId, userId), eq(readingHistoryTable.mangaId, mangaId)))
          .returning({ mangaId: readingHistoryTable.mangaId })

        if (updated) {
          return
        }

        const [inserted] = await tx
          .insert(readingHistoryTable)
          .values({
            userId,
            mangaId,
            lastPage,
            updatedAt: now,
          })
          .returning({ mangaId: readingHistoryTable.mangaId })

        if (!inserted) {
          return
        }

        const userHistoryLimit = await getUserHistoryLimitInTx(tx, userId)
        await enforceHistoryLimit(tx, userId, userHistoryLimit)
      })

      return c.body(null, 204)
    } catch (error) {
      console.error(error)
      return problemResponse(c, { status: 500, detail: '읽기 기록 저장에 실패했어요' })
    }
  },
)

export default route
