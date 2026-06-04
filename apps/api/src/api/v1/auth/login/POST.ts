import { initiatePKCEChallenge } from '@litomi/auth/pkce-server'
import { buildSessionDeviceLabel } from '@litomi/auth/session'
import { postV1AuthLoginRequestSchema, type POSTV1AuthLoginResponse } from '@litomi/contracts'
import { CookieKey } from '@litomi/http/cookie'
import { getRequestIP, getRequestUserAgent } from '@litomi/http/request'
import TurnstileValidator from '@litomi/http/turnstile'
import { compare } from 'bcryptjs'
import { Hono } from 'hono'
import { deleteCookie, getCookie } from 'hono/cookie'

import type { Env } from '@/app'

import { readAdultFlag, touchUserLoginAt } from '@/api/v1/auth/query'
import { issueAuthCookies } from '@/api/v1/auth/session.query'
import { applyAuthCookie } from '@/utils/cookie'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { hasActiveTwoFactor, readLoginUserByLoginId, touchTrustedBrowserLastUsedAt } from './query'
import { DUMMY_PASSWORD_HASH, ensureAllowed, loginIdLimiter, loginIpLimiter } from './shared'
import { verifyTrustedBrowserToken } from './util'

const route = new Hono<Env>()

route.post('/', zProblemValidator('json', postV1AuthLoginRequestSchema), async (c) => {
  const { codeChallenge, fingerprint, loginId, password, remember, turnstileToken } = c.req.valid('json')
  const remoteIP = getRequestIP(c.req.raw.headers)
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
    const user = await readLoginUserByLoginId(loginId)
    const passwordHash = user?.passwordHash || DUMMY_PASSWORD_HASH
    const isValidPassword = await compare(password, passwordHash)

    if (!user || !isValidPassword) {
      return problemResponse(c, {
        status: 401,
        code: 'invalid-credentials',
        detail: '아이디 또는 비밀번호가 일치하지 않아요',
      })
    }

    if (await hasActiveTwoFactor(user.id)) {
      const trustedBrowserToken = getCookie(c, CookieKey.TRUSTED_BROWSER_TOKEN)
      const trustedBrowser = await verifyTrustedBrowserToken(trustedBrowserToken)
      const trustedBrowserMatches = trustedBrowser?.fingerprint === fingerprint && trustedBrowser?.userId === user.id
      const lastUsedAt = new Date()

      const browserExists =
        trustedBrowserMatches &&
        (await touchTrustedBrowserLastUsedAt(trustedBrowser.userId, trustedBrowser.browserId, lastUsedAt))

      if (!browserExists && trustedBrowserToken) {
        deleteCookie(c, CookieKey.TRUSTED_BROWSER_TOKEN, { path: '/', secure: true })
      }

      if (!browserExists) {
        const { authorizationCode } = await initiatePKCEChallenge(user.id, codeChallenge, fingerprint)

        return c.json<POSTV1AuthLoginResponse>({
          nextStep: 'two_factor_required',
          authorizationCode,
        })
      }
    }

    const [adult] = await Promise.all([readAdultFlag(user.id), touchUserLoginAt(user.id, new Date())])
    await Promise.allSettled([loginIpLimiter.reward(remoteIP), loginIdLimiter.reward(loginId)])

    const cookieConfigs = await issueAuthCookies({
      userId: user.id,
      adult,
      remember,
      deviceLabel: remember ? buildSessionDeviceLabel(getRequestUserAgent(c.req.raw.headers)) : null,
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
