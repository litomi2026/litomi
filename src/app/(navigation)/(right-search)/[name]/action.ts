'use server'

import { captureException } from '@sentry/nextjs'
import { sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { z } from 'zod/v4'

import { db } from '@/database/drizzle'
import { isPostgresError } from '@/database/error'
import { userTable } from '@/database/schema'
import { nameSchema, nicknameSchema } from '@/database/zod'
import { ActionResponse, badRequest, conflict, ok, serverError, unauthorized } from '@/utils/action-response'
import { getUserIdFromAccessToken } from '@/utils/cookie'

const profileSchema = z.object({
  name: nameSchema,
  nickname: nicknameSchema,
  imageURL: z
    .url('프로필 이미지 주소가 URL 형식이 아니에요.')
    .max(256, '프로필 이미지 URL은 최대 256자까지 입력할 수 있어요.')
    .optional()
    .transform((val) => val || null),
})

type ProfileUpdateResult = {
  id: number
  name: string
  nickname: string | null
  imageURL: string | null
}

export default async function editProfile(
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResponse<ProfileUpdateResult>> {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore)

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = profileSchema.safeParse({
    name: formData.get('name'),
    nickname: formData.get('nickname'),
    imageURL: formData.get('imageURL'),
  })

  if (!validation.success) {
    const fieldErrors: Record<string, string> = {}
    validation.error.issues.forEach((issue) => {
      const field = issue.path.join('.')
      fieldErrors[field] = issue.message
    })
    return badRequest(fieldErrors)
  }

  const { name, nickname, imageURL } = validation.data

  try {
    const [updatedUser] = await db
      .update(userTable)
      .set({
        name,
        nickname,
        imageURL,
      })
      .where(sql`${userTable.id} = ${userId}`)
      .returning({
        id: userTable.id,
        name: userTable.name,
        nickname: userTable.nickname,
        imageURL: userTable.imageURL,
      })

    if (!updatedUser) {
      return serverError('프로필 업데이트에 실패했어요')
    }

    revalidatePath(`/@${updatedUser.name}`)

    return ok(updatedUser)
  } catch (error) {
    if (isPostgresError(error)) {
      if (error.cause.code === '23505' && error.cause.constraint_name === 'user_name_unique') {
        return conflict('이미 사용 중인 이름이에요')
      }
    }

    if (error instanceof Error) {
      captureException(error, { extra: { name: 'editProfile', userId } })
    }

    return serverError('프로필 수정 중 오류가 발생했어요')
  }
}
