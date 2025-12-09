'use server'

import { captureException } from '@sentry/nextjs'
import { sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { isPostgresError } from '@/database/error'
import { db } from '@/database/supabase/drizzle'
import { userTable } from '@/database/supabase/schema'
import { imageURLSchema, nameSchema, nicknameSchema } from '@/database/zod'
import { badRequest, conflict, internalServerError, ok, seeOther, unauthorized } from '@/utils/action-response'
import { validateUserIdFromCookie } from '@/utils/cookie'
import { flattenZodFieldErrors } from '@/utils/form-error'

const profileSchema = z.object({
  name: nameSchema.nullable().transform((val) => val ?? undefined),
  nickname: nicknameSchema.nullable().transform((val) => val ?? undefined),
  imageURL: imageURLSchema.nullable().transform((val) => val ?? undefined),
})

export default async function editProfile(formData: FormData) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요', formData)
  }

  const validation = profileSchema.safeParse({
    name: formData.get('name'),
    nickname: formData.get('nickname'),
    imageURL: formData.get('imageURL'),
  })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error), formData)
  }

  const { name, nickname, imageURL } = validation.data

  if (!name && !nickname && !imageURL) {
    return badRequest('수정할 정보를 입력해 주세요', formData)
  }

  try {
    const [{ name: updatedName }] = await db
      .update(userTable)
      .set({ name, nickname, imageURL })
      .where(sql`${userTable.id} = ${userId}`)
      .returning({ name: userTable.name })

    revalidatePath(`/@${updatedName}`)

    if (name) {
      return seeOther(`/@${updatedName}`, '프로필을 수정했어요')
    }

    return ok('프로필을 수정했어요')
  } catch (error) {
    if (isPostgresError(error)) {
      if (error.cause.code === '23505' && error.cause.constraint_name === 'user_name_unique') {
        return conflict('이미 사용 중인 이름이에요', formData)
      }
    }

    captureException(error, { extra: { name: 'editProfile', userId } })
    return internalServerError('프로필 수정 중 오류가 발생했어요', formData)
  }
}
