import { type POSTV1LibraryResponse, postV1LibraryBodySchema, problemCode } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { libraryTable } from '@litomi/db/app/library'
import { userExpansionTable } from '@litomi/db/app/points'
import { MAX_LIBRARIES_PER_USER } from '@litomi/domain/library/policy'
import { EXPANSION_TYPE, POINT_CONSTANTS } from '@litomi/domain/points/model'
import { hexColorToInt } from '@litomi/domain/utils/color'
import { normalizeString } from '@litomi/std'
import { and, count, eq, sum } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { adultVerificationRequiredResponse, shouldBlockAdultGate } from '@/utils/adult-gate'
import { lockUserRowForUpdate } from '@/utils/lock-user-row'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const ErrorCode = {
  LIBRARY_LIMIT_REACHED: 'LIBRARY_LIMIT_REACHED',
} as const

const route = new Hono<Env>()

route.post('/', requireAuth, zProblemValidator('json', postV1LibraryBodySchema), async (c) => {
  const userId = c.get('userId')!
  const { name, description, color, icon, isPublic } = c.req.valid('json')

  if (isPublic === false && shouldBlockAdultGate(c)) {
    return adultVerificationRequiredResponse(c)
  }

  try {
    const created = await db.transaction(async (tx) => {
      // 1) 유저 락으로 동시성 보장
      await lockUserRowForUpdate(tx, userId)

      // 2) 확장량 조회
      const [expansion] = await tx
        .select({ totalAmount: sum(userExpansionTable.amount) })
        .from(userExpansionTable)
        .where(and(eq(userExpansionTable.userId, userId), eq(userExpansionTable.type, EXPANSION_TYPE.LIBRARY)))

      // 3) 제한 계산 및 체크
      const extra = Number(expansion?.totalAmount ?? 0)
      const limit = Math.min(MAX_LIBRARIES_PER_USER + extra, POINT_CONSTANTS.LIBRARY_MAX_EXPANSION)

      const [{ count: currentCount }] = await tx
        .select({ count: count(libraryTable.id) })
        .from(libraryTable)
        .where(eq(libraryTable.userId, userId))

      if (currentCount >= limit) {
        throw new Error(ErrorCode.LIBRARY_LIMIT_REACHED)
      }

      // 4) INSERT
      const [inserted] = await tx
        .insert(libraryTable)
        .values({
          userId,
          name,
          description: normalizeString(description),
          color: color ? hexColorToInt(color) : null,
          icon: icon || null,
          isPublic,
        })
        .returning({ id: libraryTable.id, createdAt: libraryTable.createdAt })

      return inserted
    })

    if (!created) {
      return problemResponse(c, { status: 500 })
    }

    const response = {
      id: created.id,
      createdAt: created.createdAt.getTime(),
    } satisfies POSTV1LibraryResponse

    return c.json(response, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'

    if (message === ErrorCode.LIBRARY_LIMIT_REACHED) {
      return problemResponse(c, {
        status: 403,
        code: problemCode.LIBO_EXPANSION_REQUIRED,
        title: '서재 개수 제한에 도달했어요',
      })
    }

    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
