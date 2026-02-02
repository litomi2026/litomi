'use server'

import { captureException } from '@sentry/nextjs'
import { compare } from 'bcryptjs'
import { and, eq, isNull } from 'drizzle-orm'
import { cookies, headers } from 'next/headers'
import { z } from 'zod'

import { bbatonVerificationTable } from '@/database/supabase/bbaton'
import { db } from '@/database/supabase/drizzle'
import { twoFactorTable } from '@/database/supabase/two-factor'
import { userTable } from '@/database/supabase/user'
import { loginIdSchema, passwordSchema } from '@/database/zod'
import { badRequest, internalServerError, ok, tooManyRequests, unauthorized } from '@/utils/action-response'
import { getAccessTokenCookieConfig, getAuthHintCookieConfig, getRefreshTokenCookieConfig } from '@/utils/cookie'
import { flattenZodFieldErrors } from '@/utils/form-error'
import { initiatePKCEChallenge } from '@/utils/pkce-server'
import { RateLimiter, RateLimitPresets } from '@/utils/rate-limit'
import TurnstileValidator, { getTurnstileToken } from '@/utils/turnstile'

import { checkTrustedBrowser } from './utils'

const loginSchema = z.object({
  'login-id': loginIdSchema,
  password: passwordSchema,
  remember: z.literal('on').nullable(),
  'code-challenge': z.string(),
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
    'login-id': formData.get('login-id'),
    password: formData.get('password'),
    remember: formData.get('remember'),
    'code-challenge': formData.get('code-challenge'),
    fingerprint: formData.get('fingerprint'),
  })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error), formData)
  }

  const { password, remember, fingerprint } = validation.data
  const loginId = validation.data['login-id']
  const codeChallenge = validation.data['code-challenge']
  const { allowed, retryAfter } = await loginLimiter.check(loginId)

  if (!allowed) {
    const minutes = retryAfter ? Math.ceil(retryAfter / 60) : 1
    return tooManyRequests(`너무 많은 로그인 시도가 있었어요. ${minutes}분 후에 다시 시도해 주세요.`)
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

    const [[verification]] = await Promise.all([
      db
        .select({ adultFlag: bbatonVerificationTable.adultFlag })
        .from(bbatonVerificationTable)
        .where(eq(bbatonVerificationTable.userId, id)),
      db.update(userTable).set({ loginAt: new Date() }).where(eq(userTable.id, id)),
      loginLimiter.reward(loginId),
    ])

    const tokenClaims = {
      userId: id,
      adult: verification?.adultFlag === true,
    }

    const accessTokenCookie = await getAccessTokenCookieConfig(tokenClaims)
    const authHintCookie = getAuthHintCookieConfig({ maxAgeSeconds: accessTokenCookie.options.maxAge })

    cookieStore.set(accessTokenCookie.key, accessTokenCookie.value, accessTokenCookie.options)
    cookieStore.set(authHintCookie.key, authHintCookie.value, authHintCookie.options)

    if (remember) {
      const refreshTokenCookie = await getRefreshTokenCookieConfig(tokenClaims)
      const longAuthHintCookie = getAuthHintCookieConfig({ maxAgeSeconds: refreshTokenCookie.options.maxAge })

      cookieStore.set(refreshTokenCookie.key, refreshTokenCookie.value, refreshTokenCookie.options)
      cookieStore.set(longAuthHintCookie.key, longAuthHintCookie.value, longAuthHintCookie.options)
    }

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
