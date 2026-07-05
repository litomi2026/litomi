import { initiatePKCEChallenge } from '@litomi/auth/pkce-server'
import { buildSessionDeviceLabel } from '@litomi/auth/session'
import { type POSTV1AuthLoginResponse, PROBLEM, postV1AuthLoginRequestSchema } from '@litomi/contracts'
import { CookieKey } from '@litomi/http/cookie'
import { getRequestIP, getRequestUserAgent } from '@litomi/http/request'
import TurnstileValidator from '@litomi/http/turnstile'
import { compare } from 'bcryptjs'
import { Hono } from 'hono'
import { deleteCookie, getCookie } from 'hono/cookie'
import { createFactory } from 'hono/factory'
import { readAdultFlag, touchUserLoginAt } from '@/api/v1/auth/query'
import { issueAuthCookies } from '@/api/v1/auth/session.query'
import type { Env } from '@/app'
import { applyAuthCookie } from '@/utils/cookie'
import { problemResponse, tooManyRequestsProblemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { hasActiveTwoFactor, readLoginUserByLoginId, touchTrustedBrowserLastUsedAt } from './query'
import { DUMMY_PASSWORD_HASH, ensureAllowed, loginIdLimiter, loginIpLimiter } from './shared'
import { verifyTrustedBrowserToken } from './util'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(zProblemValidator('json', postV1AuthLoginRequestSchema))

route.post('/', ...middlewares, async (c) => {
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
      problem: PROBLEM.HUMAN_VERIFICATION_FAILED,
      detail: validator.getTurnstileErrorMessage(turnstile['error-codes']),
    })
  }

  const limitResult = await ensureAllowed([
    { limiter: loginIpLimiter, identifier: remoteIP },
    { limiter: loginIdLimiter, identifier: loginId },
  ])

  if (!limitResult.allowed) {
    return tooManyRequestsProblemResponse(c, limitResult.retryAfter)
  }

  try {
    const user = await readLoginUserByLoginId(loginId)
    const passwordHash = user?.passwordHash || DUMMY_PASSWORD_HASH
    const isValidPassword = await compare(password, passwordHash)

    if (!user || !isValidPassword) {
      return problemResponse(c, { problem: PROBLEM.INVALID_CREDENTIALS })
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

        return c.json({
          nextStep: 'two_factor_required',
          authorizationCode,
        } satisfies POSTV1AuthLoginResponse)
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

    return c.json({
      nextStep: 'authenticated',
      id: user.id,
      loginId,
      name: user.name,
      lastLoginAt: user.lastLoginAt,
      lastLogoutAt: user.lastLogoutAt,
    } satisfies POSTV1AuthLoginResponse)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
