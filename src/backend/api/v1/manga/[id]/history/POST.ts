import { and, eq, sql, sum } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { EXPANSION_TYPE, POINT_CONSTANTS } from '@/constants/points'
import { MAX_MANGA_ID, MAX_READING_HISTORY_PER_USER } from '@/constants/policy'
import { readingHistoryTable } from '@/database/supabase/activity'
import { db } from '@/database/supabase/drizzle'
import { userExpansionTable } from '@/database/supabase/points'
import { userTable } from '@/database/supabase/user'

type SessionDBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

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
  zProblemValidator('param', paramSchema),
  zProblemValidator('json', postBodySchema),
  async (c) => {
    const userId = c.get('userId')!

    const { id: mangaId } = c.req.valid('param')
    const { lastPage } = c.req.valid('json')

    try {
      await db.transaction(async (tx) => {
        // NOTE: 유저 락으로 동시성 보장 (감상 기록 한도 초과 방지)
        await tx.select({ id: userTable.id }).from(userTable).where(eq(userTable.id, userId)).for('update')

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

async function enforceHistoryLimit(tx: SessionDBTransaction, userId: number, limit: number) {
  await tx.execute(sql`
    DELETE FROM ${readingHistoryTable}
    WHERE ${readingHistoryTable.userId} = ${userId}
      AND (manga_id, updated_at) NOT IN (
        SELECT ${readingHistoryTable.mangaId}, ${readingHistoryTable.updatedAt}
        FROM ${readingHistoryTable}
        WHERE ${readingHistoryTable.userId} = ${userId}
        ORDER BY ${readingHistoryTable.updatedAt} DESC, ${readingHistoryTable.mangaId} DESC
        LIMIT ${limit}
      )
  `)
}

async function getUserHistoryLimitInTx(tx: SessionDBTransaction, userId: number): Promise<number> {
  const [expansion] = await tx
    .select({ totalAmount: sum(userExpansionTable.amount) })
    .from(userExpansionTable)
    .where(and(eq(userExpansionTable.userId, userId), eq(userExpansionTable.type, EXPANSION_TYPE.READING_HISTORY)))

  const extra = Number(expansion?.totalAmount ?? 0)
  return Math.min(MAX_READING_HISTORY_PER_USER + extra, POINT_CONSTANTS.HISTORY_MAX_EXPANSION)
}

export default route
