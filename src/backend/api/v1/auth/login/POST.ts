import { compare } from 'bcryptjs'
import { and, eq, gt, isNull } from 'drizzle-orm'
import { Hono } from 'hono'
import { deleteCookie, getCookie } from 'hono/cookie'
import { z } from 'zod'

import { issueAuthCookies } from '@/auth/session'
import { Env } from '@/backend'
import { applyAuthCookie } from '@/backend/utils/cookie'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { COOKIE_DOMAIN } from '@/constants'
import { CookieKey } from '@/constants/storage'
import { bbatonVerificationTable } from '@/database/supabase/bbaton'
import { db } from '@/database/supabase/drizzle'
import { trustedBrowserTable, twoFactorTable } from '@/database/supabase/two-factor'
import { userTable } from '@/database/supabase/user'
import { loginIdSchema, passwordSchema } from '@/database/zod'
import { initiatePKCEChallenge } from '@/utils/pkce-server'
import { getRequestIP, getRequestUserAgent } from '@/utils/request'
import { verifyTrustedBrowserToken } from '@/utils/trusted-browser'
import TurnstileValidator from '@/utils/turnstile'

import { DUMMY_PASSWORD_HASH, ensureAllowed, loginIdLimiter, loginIpLimiter } from './shared'

export type POSTV1AuthLoginAuthenticatedResponse = {
  nextStep: 'authenticated'
  id: number
  loginId: string
  name: string
  lastLoginAt: Date | null
  lastLogoutAt: Date | null
}

export type POSTV1AuthLoginRequest = {
  loginId: string
  password: string
  remember: boolean
  turnstileToken: string
  codeChallenge: string
  fingerprint: string
}

export type POSTV1AuthLoginResponse = POSTV1AuthLoginAuthenticatedResponse | POSTV1AuthLoginTwoFactorResponse

export type POSTV1AuthLoginTwoFactorResponse = {
  nextStep: 'two_factor_required'
  authorizationCode: string
}

const loginRequestSchema = z.object({
  loginId: loginIdSchema,
  password: passwordSchema,
  remember: z.boolean().default(false),
  turnstileToken: z.string().min(1).max(2048),
  codeChallenge: z.string().min(43).max(255),
  fingerprint: z.string().min(1).max(255),
})

const route = new Hono<Env>()

route.post('/', zProblemValidator('json', loginRequestSchema), async (c) => {
  const { codeChallenge, fingerprint, loginId, password, remember, turnstileToken } = c.req.valid('json')
  const remoteIP = getRequestIP(c.req.raw.headers)
  const userAgent = getRequestUserAgent(c.req.raw.headers)
  const validator = new TurnstileValidator()

  const turnstile = await validator.validate({
    token: turnstileToken,
    remoteIP,
    expectedAction: 'login',
  })

  if (!turnstile.success) {
    return problemResponse(c, {
      status: 400,
      code: 'human-verification-failed',
      detail: validator.getTurnstileErrorMessage(turnstile['error-codes']),
    })
  }

  const limitResult = await ensureAllowed([loginIpLimiter.check(remoteIP), loginIdLimiter.check(loginId)])

  if (!limitResult.allowed) {
    return problemResponse(c, {
      status: 429,
      detail: `너무 많은 로그인 시도가 있었어요. ${limitResult.minutes}분 후에 다시 시도해 주세요.`,
      headers: { 'Retry-After': String(limitResult.retryAfter) },
    })
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

    const passwordHash = user?.passwordHash || DUMMY_PASSWORD_HASH
    const isValidPassword = await compare(password, passwordHash)

    if (!user || !isValidPassword) {
      return problemResponse(c, {
        status: 401,
        detail: '아이디 또는 비밀번호가 일치하지 않아요',
      })
    }

    const [twoFactor] = await db
      .select({ enabled: twoFactorTable.userId })
      .from(twoFactorTable)
      .where(and(eq(twoFactorTable.userId, user.id), isNull(twoFactorTable.expiresAt)))

    if (twoFactor) {
      const trustedBrowserToken = getCookie(c, CookieKey.TRUSTED_BROWSER_TOKEN)
      const trustedBrowser = await verifyTrustedBrowserToken(trustedBrowserToken)
      const trustedBrowserMatches = trustedBrowser?.fingerprint === fingerprint && trustedBrowser?.userId === user.id
      const lastUsedAt = new Date()

      const [browser] = trustedBrowserMatches
        ? await db
            .update(trustedBrowserTable)
            .set({ lastUsedAt })
            .where(
              and(
                eq(trustedBrowserTable.userId, trustedBrowser.userId),
                eq(trustedBrowserTable.browserId, trustedBrowser.browserId),
                gt(trustedBrowserTable.expiresAt, lastUsedAt),
              ),
            )
            .returning({ id: trustedBrowserTable.id })
        : []

      if (!browser && trustedBrowserToken) {
        deleteCookie(c, CookieKey.TRUSTED_BROWSER_TOKEN, {
          domain: COOKIE_DOMAIN,
          path: '/auth/login',
        })
      }

      if (!browser) {
        const { authorizationCode } = await initiatePKCEChallenge(user.id, codeChallenge, fingerprint)

        return c.json<POSTV1AuthLoginResponse>({
          nextStep: 'two_factor_required',
          authorizationCode,
        })
      }
    }

    const now = new Date()

    const [[verification]] = await Promise.all([
      db
        .select({ adultFlag: bbatonVerificationTable.adultFlag })
        .from(bbatonVerificationTable)
        .where(eq(bbatonVerificationTable.userId, user.id)),
      db.update(userTable).set({ loginAt: now }).where(eq(userTable.id, user.id)),
    ])

    await Promise.allSettled([loginIpLimiter.reward(remoteIP), loginIdLimiter.reward(loginId)])

    const cookieConfigs = await issueAuthCookies({
      userId: user.id,
      adult: verification?.adultFlag === true,
      remember,
      ipAddress: remoteIP,
      userAgent,
    })

    applyAuthCookie(c, cookieConfigs)

    return c.json<POSTV1AuthLoginResponse>({
      nextStep: 'authenticated',
      id: user.id,
      loginId,
      name: user.name,
      lastLoginAt: user.lastLoginAt,
      lastLogoutAt: user.lastLogoutAt,
    })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '로그인 중 오류가 발생했어요' })
  }
})

export default route
