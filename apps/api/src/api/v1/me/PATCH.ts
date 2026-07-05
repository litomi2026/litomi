import { getAuthCookieClearConfigs } from '@litomi/auth/cookie'
import { type PATCHV1MeResponse, PROBLEM, patchV1MeBodySchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { userTable } from '@litomi/db/app/user'
import { isPostgresError } from '@litomi/db/error'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { applyAuthCookie } from '@/utils/cookie'
import { authRequiredProblemResponse, problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(zProblemValidator('json', patchV1MeBodySchema))

route.patch('/', ...middlewares, async (c) => {
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

    return c.json({
      name: updatedUser.name,
      nickname: updatedUser.nickname,
      imageURL: updatedUser.imageURL,
    } satisfies PATCHV1MeResponse)
  } catch (error) {
    if (isPostgresError(error)) {
      if (error.cause.code === '23505' && error.cause.constraint_name === 'user_name_unique') {
        return problemResponse(c, {
          problem: PROBLEM.NAME_CONFLICT,
          extensions: {
            invalidParams: [
              {
                name: 'name',
                code: PROBLEM.NAME_CONFLICT.slug,
                reason: '이미 사용 중인 이름이에요',
              },
            ],
          },
        })
      }
    }

    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
