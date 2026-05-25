import { mangaIdParamSchema, putV1MangaIdRatingRequestSchema, type PUTV1MangaIdRatingResponse } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { userRatingTable } from '@litomi/db/app/activity'
import { userExpansionTable } from '@litomi/db/app/points'
import { MAX_RATINGS_PER_USER } from '@litomi/domain/library/policy'
import { EXPANSION_TYPE, POINT_CONSTANTS } from '@litomi/domain/points/model'
import { problemCode } from '@litomi/http/problem-details'
import { and, count, eq, sum } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { lockUserRowForUpdate } from '@/utils/lock-user-row'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const ErrorCode = {
  RATING_LIMIT_REACHED: 'RATING_LIMIT_REACHED',
  RATING_INSERT_FAILED: 'RATING_INSERT_FAILED',
} as const

const route = new Hono<Env>()

route.put(
  '/:id/rating',
  requireAuth,
  zProblemValidator('param', mangaIdParamSchema),
  zProblemValidator('json', putV1MangaIdRatingRequestSchema),
  async (c) => {
    const userId = c.get('userId')!

    const { id: mangaId } = c.req.valid('param')
    const { rating } = c.req.valid('json')

    try {
      const result = await db.transaction(async (tx) => {
        // 1) 유저 락으로 동시성 보장 (한도 우회 방지: 신규 생성이 직렬화됨)
        await lockUserRowForUpdate(tx, userId)

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
          code: problemCode.LIBO_EXPANSION_REQUIRED,
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
