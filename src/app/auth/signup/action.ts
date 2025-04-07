'use server'

import { SALT_ROUNDS } from '@/constants'
import { db } from '@/database/drizzle'
import { userTable } from '@/database/schema'
import { setAccessTokenCookie, setRefreshTokenCookie } from '@/utils/cookie'
import { generateRandomNickname, generateRandomProfileImage } from '@/utils/nickname'
import { hash } from 'bcrypt'
import { cookies } from 'next/headers'
import { z } from 'zod'

const schema = z
  .object({
    loginId: z
      .string()
      .min(2, { message: '아이디는 최소 2자 이상이어야 합니다.' })
      .max(32, { message: '아이디는 최대 32자까지 입력할 수 있습니다.' })
      .regex(/^[a-zA-Z][a-zA-Z0-9-._~]+$/, { message: '아이디는 알파벳, 숫자 - . _ ~ 로만 구성해야 합니다.' }),
    password: z
      .string()
      .min(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
      .max(64, { message: '비밀번호는 최대 64자까지 입력할 수 있습니다.' })
      .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, { message: '비밀번호는 알파벳과 숫자를 하나 이상 포함해야 합니다.' }),
    'password-confirm': z.string(),
    nickname: z
      .string()
      .min(2, { message: '닉네임은 최소 2자 이상이어야 합니다.' })
      .max(32, { message: '닉네임은 최대 32자까지 입력할 수 있습니다.' }),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data['password-confirm']) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '비밀번호와 비밀번호 확인 값이 일치하지 않습니다.',
        path: ['password-confirm'],
      })
    } else if (data.loginId === data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '아이디와 비밀번호는 같을 수 없습니다.',
        path: ['password'],
      })
    }
  })

export default async function signup(_prevState: unknown, formData: FormData) {
  const validatedFields = schema.safeParse({
    loginId: formData.get('loginId'),
    password: formData.get('password'),
    'password-confirm': formData.get('password-confirm'),
    nickname: formData.get('nickname') || generateRandomNickname(),
  })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
      formData,
    }
  }

  const { loginId, password, nickname } = validatedFields.data
  const passwordHash = await hash(password, SALT_ROUNDS)

  const [result] = await db
    .insert(userTable)
    .values({
      loginId,
      passwordHash,
      nickname,
      imageURL: generateRandomProfileImage(),
    })
    .onConflictDoNothing()
    .returning({ id: userTable.id })

  if (!result) {
    return {
      error: { loginId: ['이미 사용 중인 아이디입니다.'] },
      formData,
    }
  }

  const { id: userId } = result
  const cookieStore = await cookies()
  await Promise.all([setAccessTokenCookie(cookieStore, userId), setRefreshTokenCookie(cookieStore, userId)])

  return { success: true }
}
