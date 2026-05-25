import { getAuthCookieClearConfigs } from '@litomi/auth/cookie'
import { patchV1MeBodySchema, type PATCHV1MeResponse } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { userTable } from '@litomi/db/app/user'
import { isPostgresError } from '@litomi/db/error'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { applyAuthCookie } from '@/utils/cookie'
import { authRequiredProblemResponse, problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.patch('/', zProblemValidator('json', patchV1MeBodySchema), async (c) => {
  const userId = c.get('userId')!
  const patch = c.req.valid('json')

  try {
    const [updatedUser] = await db
      .update(userTable)
      .set({
        ...(patch.name && { name: patch.name }),
        ...(patch.nickname && { nickname: patch.nickname }),
        ...(patch.imageURL !== undefined && { imageURL: patch.imageURL }),
      })
      .where(eq(userTable.id, userId))
      .returning({
        name: userTable.name,
        nickname: userTable.nickname,
        imageURL: userTable.imageURL,
      })

    if (!updatedUser) {
      applyAuthCookie(c, getAuthCookieClearConfigs())
      return authRequiredProblemResponse(c)
    }

    return c.json<PATCHV1MeResponse>({
      message: '프로필을 수정했어요',
      name: updatedUser.name,
      nickname: updatedUser.nickname,
      imageURL: updatedUser.imageURL,
    })
  } catch (error) {
    if (isPostgresError(error)) {
      if (error.cause.code === '23505' && error.cause.constraint_name === 'user_name_unique') {
        return problemResponse(c, {
          status: 409,
          code: 'name-conflict',
          detail: '이미 사용 중인 이름이에요',
          extensions: { invalidParams: [{ name: 'name', reason: '이미 사용 중인 이름이에요' }] },
        })
      }
    }

    console.error(error)
    return problemResponse(c, { status: 500, detail: '프로필 수정 중 오류가 발생했어요' })
  }
})

export default route
