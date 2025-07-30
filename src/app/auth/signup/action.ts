'use server'

import { hash } from 'bcrypt'
import { cookies } from 'next/headers'
import { z } from 'zod/v4'

import { SALT_ROUNDS } from '@/constants'
import { db } from '@/database/drizzle'
import { userTable } from '@/database/schema'
import { loginIdSchema, nicknameSchema, passwordSchema } from '@/database/zod'
import { setAccessTokenCookie, setRefreshTokenCookie } from '@/utils/cookie'
import { createFormError, FormError, FormErrors, zodToFormError } from '@/utils/form-error'
import { generateRandomNickname, generateRandomProfileImage } from '@/utils/nickname'

const schema = z
  .object({
    loginId: loginIdSchema,
    password: passwordSchema,
    'password-confirm': z.string(),
    nickname: nicknameSchema,
  })
  .refine((data) => data.password === data['password-confirm'], {
    error: '비밀번호와 비밀번호 확인 값이 일치하지 않아요',
    path: ['password-confirm'],
  })
  .refine((data) => data.loginId !== data.password, {
    error: '아이디와 비밀번호는 같을 수 없어요',
    path: ['password'],
  })

type SignupResult = {
  success?: boolean
  error?: FormError
  formData?: FormData
  data?: {
    userId: number
    loginId: string
    name: string
    nickname: string
  }
}

export default async function signup(_prevState: unknown, formData: FormData): Promise<SignupResult> {
  const validation = schema.safeParse({
    loginId: formData.get('loginId'),
    password: formData.get('password'),
    'password-confirm': formData.get('password-confirm'),
    nickname: formData.get('nickname') || generateRandomNickname(),
  })

  if (!validation.success) {
    const zodErrors = z.treeifyError(validation.error).properties
    return {
      error: zodErrors ? zodToFormError(zodErrors) : createFormError(FormErrors.INVALID_INPUT),
      formData,
    }
  }

  const { loginId, password, nickname } = validation.data
  const passwordHash = await hash(password, SALT_ROUNDS)

  const [result] = await db
    .insert(userTable)
    .values({
      loginId,
      name: loginId,
      passwordHash,
      nickname,
      imageURL: generateRandomProfileImage(),
    })
    .onConflictDoNothing()
    .returning({ id: userTable.id })

  if (!result) {
    return {
      error: { fields: { loginId: '이미 사용 중인 아이디에요' } },
      formData,
    }
  }

  const { id: userId } = result
  const cookieStore = await cookies()

  await Promise.all([setAccessTokenCookie(cookieStore, userId), setRefreshTokenCookie(cookieStore, userId)])

  return {
    success: true,
    data: {
      userId,
      loginId,
      name: loginId,
      nickname,
    },
  }
}
