'use server'

import { compare } from 'bcrypt'
import { sql } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { z } from 'zod/v4'

import { db } from '@/database/drizzle'
import { userTable } from '@/database/schema'
import { setAccessTokenCookie, setRefreshTokenCookie } from '@/utils/cookie'
import { createFormError, FormError, FormErrors, zodToFormError } from '@/utils/form-error'
import { RateLimiter, RateLimitPresets } from '@/utils/rate-limit'

const schema = z.object({
  loginId: z
    .string()
    .min(2, { error: '아이디는 최소 2자 이상이어야 합니다.' })
    .max(32, { error: '아이디는 최대 32자까지 입력할 수 있습니다.' })
    .regex(/^[a-zA-Z][a-zA-Z0-9-._~]+$/, { error: '아이디는 알파벳, 숫자 - . _ ~ 로만 구성해야 합니다.' }),
  password: z
    .string()
    .min(8, { error: '비밀번호는 최소 8자 이상이어야 합니다.' })
    .max(64, { error: '비밀번호는 최대 64자까지 입력할 수 있습니다.' })
    .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, { error: '비밀번호는 알파벳과 숫자를 하나 이상 포함해야 합니다.' }),
  remember: z.literal('on').nullable(),
})

const loginLimiter = new RateLimiter(RateLimitPresets.strict())

const INVALID_CREDENTIALS = '아이디 또는 비밀번호가 일치하지 않아요'

type LoginResult = {
  success?: boolean
  error?: FormError
  formData?: FormData
  data?: {
    userId: string
    loginId: string
    lastLoginAt: Date | null
    lastLogoutAt: Date | null
  }
}

export default async function login(_prevState: unknown, formData: FormData): Promise<LoginResult> {
  const validation = schema.safeParse({
    loginId: formData.get('loginId'),
    password: formData.get('password'),
    remember: formData.get('remember'),
  })

  if (!validation.success) {
    const zodErrors = z.treeifyError(validation.error).properties
    return {
      error: zodErrors ? zodToFormError(zodErrors) : createFormError(FormErrors.INVALID_INPUT),
      formData,
    }
  }

  const { loginId, password, remember } = validation.data
  const { allowed } = await loginLimiter.check(loginId)

  if (!allowed) {
    return {
      error: createFormError(FormErrors.RATE_LIMITED),
      formData,
    }
  }

  const [result] = await db
    .select({
      id: userTable.id,
      passwordHash: userTable.passwordHash,
      lastLoginAt: userTable.loginAt,
      lastLogoutAt: userTable.logoutAt,
    })
    .from(userTable)
    .where(sql`${userTable.loginId} = ${loginId}`)

  if (!result) {
    return {
      error: createAuthError(INVALID_CREDENTIALS),
      formData,
    }
  }

  const { id: userId, passwordHash, lastLoginAt, lastLogoutAt } = result
  const isCorrectPassword = await compare(password, passwordHash)

  if (!isCorrectPassword) {
    return {
      error: createAuthError(INVALID_CREDENTIALS),
      formData,
    }
  }

  const cookieStore = await cookies()

  await Promise.all([
    setAccessTokenCookie(cookieStore, userId),
    remember && setRefreshTokenCookie(cookieStore, userId),
    db
      .update(userTable)
      .set({ loginAt: new Date() })
      .where(sql`${userTable.id} = ${userId}`),
  ])

  return {
    success: true,
    data: {
      userId: String(userId),
      loginId,
      lastLoginAt,
      lastLogoutAt,
    },
  }
}

function createAuthError(message: string) {
  return createFormError(undefined, { loginId: message, password: message })
}
