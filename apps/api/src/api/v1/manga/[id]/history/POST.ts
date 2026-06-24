import { mangaIdParamSchema, postV1MangaIdHistoryBodySchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { readingHistoryTable } from '@litomi/db/app/activity'
import { readUserSettings } from '@litomi/db/query/user-settings'
import { ne, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { enforceHistoryLimit, getUserHistoryLimitInTx } from '@/api/v1/library/history/shared'
import type { Env } from '@/app'
import { requireAdult } from '@/middleware/require-adult'
import { requireAuth } from '@/middleware/require-auth'
import { lockUserRowForUpdate } from '@/utils/lock-user-row'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.post(
  '/:id/history',
  requireAuth,
  requireAdult,
  zProblemValidator('param', mangaIdParamSchema),
  zProblemValidator('json', postV1MangaIdHistoryBodySchema),
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

        const [saved] = await tx
          .insert(readingHistoryTable)
          .values({
            userId,
            mangaId,
            lastPage,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: [readingHistoryTable.userId, readingHistoryTable.mangaId],
            set: { lastPage, updatedAt: now },
            setWhere: ne(readingHistoryTable.lastPage, lastPage),
          })
          .returning({
            mangaId: readingHistoryTable.mangaId,
            // NOTE: PostgreSQL system column으로 upsert 결과가 insert인지 구분해요.
            inserted: sql<boolean>`xmax = 0`,
          })

        if (!saved || !saved.inserted) {
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
