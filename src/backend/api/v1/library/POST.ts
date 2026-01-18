import { and, count, eq, sum } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { adultVerificationRequiredResponse, shouldBlockAdultGate } from '@/backend/utils/adult-gate'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { EXPANSION_TYPE, POINT_CONSTANTS } from '@/constants/points'
import { MAX_LIBRARIES_PER_USER, MAX_LIBRARY_DESCRIPTION_LENGTH, MAX_LIBRARY_NAME_LENGTH } from '@/constants/policy'
import { db } from '@/database/supabase/drizzle'
import { libraryTable } from '@/database/supabase/library'
import { userExpansionTable } from '@/database/supabase/points'
import { userTable } from '@/database/supabase/user'
import { hexColorToInt } from '@/utils/color'

export type POSTV1LibraryResponse = {
  id: number
  createdAt: number
}

const ErrorCode = {
  LIBRARY_LIMIT_REACHED: 'LIBRARY_LIMIT_REACHED',
} as const

const postBodySchema = z.object({
  name: z
    .string()
    .min(1, '서재 이름을 입력해 주세요')
    .max(MAX_LIBRARY_NAME_LENGTH, `이름은 ${MAX_LIBRARY_NAME_LENGTH}자 이하여야 해요`),
  description: z
    .string()
    .max(MAX_LIBRARY_DESCRIPTION_LENGTH, `설명은 ${MAX_LIBRARY_DESCRIPTION_LENGTH}자 이하여야 해요`)
    .nullable()
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, '올바른 색상 코드를 입력해 주세요')
    .nullable()
    .optional(),
  icon: z.string().max(4, '이모지는 하나만 입력할 수 있어요').nullable().optional(),
  isPublic: z.boolean().optional().default(false),
})

const route = new Hono<Env>()

route.post('/', requireAuth, zProblemValidator('json', postBodySchema), async (c) => {
  const userId = c.get('userId')!
  const { name, description, color, icon, isPublic } = c.req.valid('json')

  if (isPublic === false && shouldBlockAdultGate(c)) {
    return adultVerificationRequiredResponse(c)
  }

  try {
    const created = await db.transaction(async (tx) => {
      // 1) 유저 락으로 동시성 보장
      await tx.select({ id: userTable.id }).from(userTable).where(eq(userTable.id, userId)).for('update')

      // 2) 현재 서재 개수
      const [{ count: currentCount }] = await tx
        .select({ count: count(libraryTable.id) })
        .from(libraryTable)
        .where(eq(libraryTable.userId, userId))

      // 3) 확장량 조회
      const [expansion] = await tx
        .select({ totalAmount: sum(userExpansionTable.amount) })
        .from(userExpansionTable)
        .where(and(eq(userExpansionTable.userId, userId), eq(userExpansionTable.type, EXPANSION_TYPE.LIBRARY)))

      // 4) 제한 계산 및 체크
      const extra = Number(expansion?.totalAmount ?? 0)
      const limit = Math.min(MAX_LIBRARIES_PER_USER + extra, POINT_CONSTANTS.LIBRARY_MAX_EXPANSION)

      if (Number(currentCount) >= limit) {
        throw new Error(ErrorCode.LIBRARY_LIMIT_REACHED)
      }

      // 5) INSERT
      const [inserted] = await tx
        .insert(libraryTable)
        .values({
          userId,
          name,
          description: description?.trim() || null,
          color: color ? hexColorToInt(color) : null,
          icon: icon || null,
          isPublic,
        })
        .returning({ id: libraryTable.id, createdAt: libraryTable.createdAt })

      return inserted
    })

    if (!created) {
      return problemResponse(c, { status: 500, detail: '서재를 생성하지 못했어요' })
    }

    return c.json<POSTV1LibraryResponse>({ id: created.id, createdAt: created.createdAt.getTime() }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'

    if (message === ErrorCode.LIBRARY_LIMIT_REACHED) {
      return problemResponse(c, {
        status: 403,
        code: 'libo-expansion-required',
        detail: '서재 개수 제한에 도달했어요',
      })
    }

    console.error(error)
    return problemResponse(c, { status: 500, detail: '서재를 생성하지 못했어요' })
  }
})

export default route
