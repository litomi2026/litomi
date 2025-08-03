'use server'

import { compare } from 'bcrypt'
import { sql } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { z } from 'zod/v4'

import { db } from '@/database/drizzle'
import { userTable } from '@/database/schema'
import { loginIdSchema, passwordSchema } from '@/database/zod'
import { badRequest, ok, tooManyRequests, unauthorized } from '@/utils/action-response'
import { setAccessTokenCookie, setRefreshTokenCookie } from '@/utils/cookie'
import { flattenZodFieldErrors } from '@/utils/form-error'
import { RateLimiter, RateLimitPresets } from '@/utils/rate-limit'

const loginSchema = z.object({
  loginId: loginIdSchema,
  password: passwordSchema,
  remember: z.literal('on').nullable(),
})

const loginLimiter = new RateLimiter(RateLimitPresets.strict())

export default async function login(formData: FormData) {
  const validation = loginSchema.safeParse({
    loginId: formData.get('loginId'),
    password: formData.get('password'),
    remember: formData.get('remember'),
  })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error), formData)
  }

  const { loginId, password, remember } = validation.data
  const { allowed, retryAfter } = await loginLimiter.check(loginId)

  if (!allowed) {
    const minutes = retryAfter ? Math.ceil(retryAfter / 60) : 1
    return tooManyRequests(`너무 많은 로그인 시도가 있었어요. ${minutes}분 후에 다시 시도해주세요.`)
  }

  const [user] = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      passwordHash: userTable.passwordHash,
      lastLoginAt: userTable.loginAt,
      lastLogoutAt: userTable.logoutAt,
    })
    .from(userTable)
    .where(sql`${userTable.loginId} = ${loginId}`)

  if (!user) {
    return unauthorized('아이디 또는 비밀번호가 일치하지 않아요', formData)
  }

  const { id, name, lastLoginAt, lastLogoutAt, passwordHash } = user
  const isValidPassword = await compare(password, passwordHash)

  if (!isValidPassword) {
    return unauthorized('아이디 또는 비밀번호가 일치하지 않아요', formData)
  }

  const cookieStore = await cookies()

  await Promise.all([
    setAccessTokenCookie(cookieStore, id),
    remember && setRefreshTokenCookie(cookieStore, id),
    db
      .update(userTable)
      .set({ loginAt: new Date() })
      .where(sql`${userTable.id} = ${id}`),
  ])

  loginLimiter.reward(loginId)

  return ok({
    id,
    loginId,
    name,
    lastLoginAt,
    lastLogoutAt,
  })
}
