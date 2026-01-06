import { and, count, eq, sum } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { EXPANSION_TYPE, POINT_CONSTANTS } from '@/constants/points'
import { MAX_MANGA_ID, MAX_RATINGS_PER_USER } from '@/constants/policy'
import { userRatingTable } from '@/database/supabase/activity'
import { db } from '@/database/supabase/drizzle'
import { userExpansionTable } from '@/database/supabase/points'
import { userTable } from '@/database/supabase/user'

const ErrorCode = {
  RATING_LIMIT_REACHED: 'RATING_LIMIT_REACHED',
  RATING_INSERT_FAILED: 'RATING_INSERT_FAILED',
} as const

const paramSchema = z.object({
  id: z.coerce.number().int().positive().max(MAX_MANGA_ID),
})

const putBodySchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
})

export type PUTV1MangaIdRatingRequest = z.infer<typeof putBodySchema>

export type PUTV1MangaIdRatingResponse = {
  rating: number
  updatedAt: number
}

const route = new Hono<Env>()

route.put(
  '/:id/rating',
  requireAuth,
  zProblemValidator('param', paramSchema),
  zProblemValidator('json', putBodySchema),
  async (c) => {
    const userId = c.get('userId')!

    const { id: mangaId } = c.req.valid('param')
    const { rating } = c.req.valid('json')

    try {
      const result = await db.transaction(async (tx) => {
        // 1) 유저 락으로 동시성 보장 (한도 우회 방지: 신규 생성이 직렬화됨)
        await tx.select({ id: userTable.id }).from(userTable).where(eq(userTable.id, userId)).for('update')

        const now = new Date()

        // 2) 먼저 UPDATE 시도 (있으면 수정 OK)
        const [updated] = await tx
          .update(userRatingTable)
          .set({ rating, updatedAt: now })
          .where(and(eq(userRatingTable.userId, userId), eq(userRatingTable.mangaId, mangaId)))
          .returning({
            rating: userRatingTable.rating,
            updatedAt: userRatingTable.updatedAt,
          })

        if (updated) {
          return {
            rating: updated.rating,
            updatedAt: updated.updatedAt.getTime(),
          }
        }

        // 3) 신규 생성만 한도 체크 (COUNT + 확장 합계)
        const [expansion] = await tx
          .select({ totalAmount: sum(userExpansionTable.amount) })
          .from(userExpansionTable)
          .where(and(eq(userExpansionTable.userId, userId), eq(userExpansionTable.type, EXPANSION_TYPE.RATING)))

        const extra = Number(expansion?.totalAmount ?? 0)
        const limit = Math.min(MAX_RATINGS_PER_USER + extra, POINT_CONSTANTS.RATING_MAX_EXPANSION)

        const [{ count: currentCount }] = await tx
          .select({ count: count(userRatingTable.mangaId) })
          .from(userRatingTable)
          .where(eq(userRatingTable.userId, userId))

        if (Number(currentCount) >= limit) {
          throw new Error(ErrorCode.RATING_LIMIT_REACHED)
        }

        const [inserted] = await tx
          .insert(userRatingTable)
          .values({
            userId,
            mangaId,
            rating,
            createdAt: now,
            updatedAt: now,
          })
          .returning({
            rating: userRatingTable.rating,
            updatedAt: userRatingTable.updatedAt,
          })

        if (!inserted) {
          throw new Error(ErrorCode.RATING_INSERT_FAILED)
        }

        return {
          rating: inserted.rating,
          updatedAt: inserted.updatedAt.getTime(),
        }
      })

      return c.json<PUTV1MangaIdRatingResponse>(result)
    } catch (error) {
      if (error instanceof Error && error.message === ErrorCode.RATING_LIMIT_REACHED) {
        return problemResponse(c, {
          status: 403,
          code: 'libo-expansion-required',
          detail: '평가 저장 한도에 도달했어요',
        })
      }

      if (error instanceof Error && error.message === ErrorCode.RATING_INSERT_FAILED) {
        return problemResponse(c, { status: 500, detail: '평가 저장에 실패했어요' })
      }

      console.error(error)
      return problemResponse(c, { status: 500, detail: '평가 저장에 실패했어요' })
    }
  },
)

export default route
