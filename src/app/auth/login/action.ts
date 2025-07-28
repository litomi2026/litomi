'use server'

import { compare } from 'bcrypt'
import { sql } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { z } from 'zod/v4'

import { db } from '@/database/drizzle'
import { userTable } from '@/database/schema'
import { setAccessTokenCookie, setRefreshTokenCookie } from '@/utils/cookie'
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

export default async function login(_prevState: unknown, formData: FormData) {
  const validation = schema.safeParse({
    loginId: formData.get('loginId'),
    password: formData.get('password'),
    remember: formData.get('remember'),
  })

  if (!validation.success) {
    return {
      error: z.treeifyError(validation.error).properties,
      formData,
    }
  }

  const { loginId, password, remember } = validation.data
  const { allowed } = await loginLimiter.check(loginId)

  if (!allowed) {
    return {
      error: {
        loginId: { errors: ['너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.'] },
        password: { errors: ['너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.'] },
      },
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
      error: {
        loginId: { errors: ['아이디 또는 비밀번호가 일치하지 않습니다.'] },
        password: { errors: ['아이디 또는 비밀번호가 일치하지 않습니다.'] },
      },
      formData,
    }
  }

  const { id: userId, passwordHash, lastLoginAt, lastLogoutAt } = result
  const isCorrectPassword = await compare(password, passwordHash)

  if (!isCorrectPassword) {
    return {
      error: {
        loginId: { errors: ['아이디 또는 비밀번호가 일치하지 않습니다.'] },
        password: { errors: ['아이디 또는 비밀번호가 일치하지 않습니다.'] },
      },
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

  return { success: true, data: { userId, loginId, lastLoginAt, lastLogoutAt } }
}
