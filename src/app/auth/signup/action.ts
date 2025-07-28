'use server'

import { hash } from 'bcrypt'
import { cookies } from 'next/headers'
import { z } from 'zod/v4'

import { SALT_ROUNDS } from '@/constants'
import { db } from '@/database/drizzle'
import { userTable } from '@/database/schema'
import { setAccessTokenCookie, setRefreshTokenCookie } from '@/utils/cookie'
import { createFormError, FormError, FormErrors, zodToFormError } from '@/utils/form-error'
import { generateRandomNickname, generateRandomProfileImage } from '@/utils/nickname'

const schema = z
  .object({
    loginId: z
      .string()
      .min(2, { error: '아이디는 최소 2자 이상이어야 해요' })
      .max(32, { error: '아이디는 최대 32자까지 입력할 수 있어요' })
      .regex(/^[a-zA-Z][a-zA-Z0-9-._~]+$/, { error: '아이디는 알파벳, 숫자 - . _ ~ 로만 구성해야 해요' }),
    password: z
      .string()
      .min(8, { error: '비밀번호는 최소 8자 이상이어야 해요' })
      .max(64, { error: '비밀번호는 최대 64자까지 입력할 수 있어요' })
      .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, { error: '비밀번호는 알파벳과 숫자를 하나 이상 포함해야 해요' }),
    'password-confirm': z.string(),
    nickname: z
      .string()
      .min(2, { error: '닉네임은 최소 2자 이상이어야 해요' })
      .max(32, { error: '닉네임은 최대 32자까지 입력할 수 있어요' }),
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
