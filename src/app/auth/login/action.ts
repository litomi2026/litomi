'use server'

import { captureException } from '@sentry/nextjs'
import { compare } from 'bcrypt'
import { and, eq, isNull } from 'drizzle-orm'
import { cookies, headers } from 'next/headers'
import { z } from 'zod/v4'

import { NEXT_PUBLIC_BACKEND_URL } from '@/constants/env'
import { twoFactorTable } from '@/database/supabase/2fa-schema'
import { db } from '@/database/supabase/drizzle'
import { userTable } from '@/database/supabase/schema'
import { loginIdSchema, passwordSchema } from '@/database/zod'
import { badRequest, internalServerError, ok, tooManyRequests, unauthorized } from '@/utils/action-response'
import { getAccessTokenCookieConfig, setRefreshTokenCookie } from '@/utils/cookie'
import { flattenZodFieldErrors } from '@/utils/form-error'
import { initiatePKCEChallenge } from '@/utils/pkce-server'
import { RateLimiter, RateLimitPresets } from '@/utils/rate-limit'
import TurnstileValidator, { getTurnstileToken } from '@/utils/turnstile'

import { checkTrustedBrowser } from './utils'

const loginSchema = z.object({
  loginId: loginIdSchema,
  password: passwordSchema,
  remember: z.literal('on').nullable(),
  codeChallenge: z.string(),
  fingerprint: z.string(),
})

const loginLimiter = new RateLimiter(RateLimitPresets.strict())

export default async function login(formData: FormData) {
  const validator = new TurnstileValidator()
  const turnstileToken = getTurnstileToken(formData)
  const headersList = await headers()

  const remoteIP =
    headersList.get('CF-Connecting-IP') ||
    headersList.get('x-real-ip') ||
    headersList.get('x-forwarded-for') ||
    'unknown'

  const turnstile = await validator.validate({
    token: turnstileToken,
    remoteIP,
    expectedAction: 'login',
  })

  if (!turnstile.success) {
    const message = validator.getTurnstileErrorMessage(turnstile['error-codes'])
    return badRequest(message, formData)
  }

  const validation = loginSchema.safeParse({
    loginId: formData.get('loginId'),
    password: formData.get('password'),
    remember: formData.get('remember'),
    codeChallenge: formData.get('codeChallenge'),
    fingerprint: formData.get('fingerprint'),
  })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error), formData)
  }

  const { loginId, password, remember, codeChallenge, fingerprint } = validation.data
  const { allowed, retryAfter } = await loginLimiter.check(loginId)

  if (!allowed) {
    const minutes = retryAfter ? Math.ceil(retryAfter / 60) : 1
    return tooManyRequests(`너무 많은 로그인 시도가 있었어요. ${minutes}분 후에 다시 시도해주세요.`)
  }

  try {
    const [user] = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        passwordHash: userTable.passwordHash,
        lastLoginAt: userTable.loginAt,
        lastLogoutAt: userTable.logoutAt,
      })
      .from(userTable)
      .where(eq(userTable.loginId, loginId))

    // NOTE: 타이밍 공격을 방어하기 위해서 임의의 문자열을 사용함
    const passwordHash = user?.passwordHash || '$2b$10$dummyhashfortimingatackprevention'
    const isValidPassword = await compare(password, passwordHash)

    if (!user || !isValidPassword) {
      return unauthorized('아이디 또는 비밀번호가 일치하지 않아요', formData)
    }

    const [twoFactor] = await db
      .select({ enabled: twoFactorTable.userId })
      .from(twoFactorTable)
      .where(and(eq(twoFactorTable.userId, user.id), isNull(twoFactorTable.expiresAt)))

    const { id, name, lastLoginAt, lastLogoutAt } = user
    const cookieStore = await cookies()

    if (twoFactor) {
      const isTrustedBrowser = await checkTrustedBrowser(cookieStore, user.id, fingerprint)

      if (!isTrustedBrowser) {
        const { authorizationCode } = await initiatePKCEChallenge(user.id, codeChallenge, fingerprint)
        return ok({ authorizationCode })
      }
    }

    await Promise.all([
      db.update(userTable).set({ loginAt: new Date() }).where(eq(userTable.id, id)),
      loginLimiter.reward(loginId),
      getAccessTokenCookieConfig(id).then(({ key, value, options }) => {
        cookieStore.set(key, value, options)
        cookieStore.set(key, value, { ...options, domain: new URL(NEXT_PUBLIC_BACKEND_URL).hostname })
      }),
      remember && setRefreshTokenCookie(cookieStore, id),
    ])

    return ok({
      id,
      loginId,
      name,
      lastLoginAt,
      lastLogoutAt,
    })
  } catch (error) {
    captureException(error, { extra: { name: 'login', loginId } })
    return internalServerError('로그인 중 오류가 발생했어요', formData)
  }
}
