import { getAuthCookieClearConfigs } from '@litomi/auth/cookie'
import { isPostgresError } from '@litomi/db/database/error'
import 'server-only'
import { db } from '@litomi/db/database/supabase/drizzle'
import { userTable } from '@litomi/db/database/supabase/user'
import { imageURLSchema, nameSchema, nicknameSchema } from '@litomi/domain/database/zod'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import type { Env } from '@/backend/app'

import { applyAuthCookie } from '@/backend/utils/cookie'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'

const patchMyProfileSchema = z
  .object({
    name: nameSchema.optional(),
    nickname: nicknameSchema.optional(),
    imageURL: imageURLSchema.nullable().optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: '변경할 정보를 입력해 주세요',
  })

export type PATCHV1MeBody = z.infer<typeof patchMyProfileSchema>

export type PATCHV1MeResponse = {
  message: string
  name: string
  nickname: string
  imageURL: string | null
}

const route = new Hono<Env>()

route.patch('/', zProblemValidator('json', patchMyProfileSchema), async (c) => {
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
      return problemResponse(c, { status: 401, detail: '로그인 정보가 없거나 만료됐어요' })
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
