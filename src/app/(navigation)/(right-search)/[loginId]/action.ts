'use server'

import { db } from '@/database/drizzle'
import { userTable } from '@/database/schema'
import { getUserIdFromAccessToken } from '@/utils/cookie'
import { captureException } from '@sentry/nextjs'
import { sql } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { z } from 'zod'

const schema = z.object({
  nickname: z
    .string()
    .min(2, { message: '닉네임은 최소 2자 이상이어야 합니다.' })
    .max(32, { message: '닉네임은 최대 32자까지 입력할 수 있습니다.' }),
  imageURL: z
    .string()
    .url({ message: '프로필 이미지 주소가 URL 형식이 아니에요.' })
    .max(256, { message: '프로필 이미지 URL은 최대 256자까지 입력할 수 있어요.' }),
})

export default async function editProfile(_prevState: unknown, formData: FormData) {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore)
  if (!userId) return { status: 401, error: '로그인 정보가 없거나 만료됐어요.' }

  const validatedFields = schema.safeParse({
    imageURL: formData.get('imageURL'),
    nickname: formData.get('nickname'),
  })

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors }
  }

  const { nickname, imageURL } = validatedFields.data

  try {
    await db
      .update(userTable)
      .set({
        nickname,
        imageURL,
      })
      .where(sql`${userTable.id} = ${userId}`)

    return { success: true }
  } catch (error) {
    captureException(error, { extra: { name: 'editProfile' } })
    return { error: '프로필 수정 중 오류가 발생했어요.' }
  }
}
