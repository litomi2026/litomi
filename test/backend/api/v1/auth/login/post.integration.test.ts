import { installBackendIntegrationHooks } from '@test/backend/setup'
import { getSetCookieNames, requestBackend } from '@test/backend/setup/app'
import { createTrustedBrowserCookies, TEST_LOGIN_PASSWORD } from '@test/backend/setup/auth'
import { readTrustedBrowsersForUser, seedTrustedBrowser, seedTwoFactor, seedUser } from '@test/backend/setup/db'
import { installExternalFetchGuard } from '@test/backend/setup/network'
import { expectProblemResponse } from '@test/backend/setup/problem'
import { describe, expect, test } from 'bun:test'
import { eq } from 'drizzle-orm'

import { authSessionFamilyTable } from '@/database/supabase/auth'
import { db } from '@/database/supabase/drizzle'
import { userTable } from '@/database/supabase/user'
import { verifyPKCEChallenge } from '@/utils/pkce-server'

import { createPkcePair, nextIp } from '../fixtures'
import { turnstileFailureRoute, turnstileSuccessRoute } from './fixtures'

installBackendIntegrationHooks({ redis: true })

describe('POST /api/v1/auth/login', () => {
  test('remember=true 이면 인증 응답과 세션 쿠키를 반환한다', async () => {
    const user = await seedUser({ loginAt: null, logoutAt: null })
    const fetchGuard = installExternalFetchGuard([turnstileSuccessRoute()])
    const { codeChallenge } = createPkcePair()

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: {
          'CF-Connecting-IP': nextIp(),
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Safari/605.1.15',
        },
        json: {
          loginId: user.loginId,
          password: TEST_LOGIN_PASSWORD,
          remember: true,
          turnstileToken: 'turnstile-ok',
          codeChallenge,
          fingerprint: 'fp-success',
        },
      })

      expect(response.status).toBe(200)
      expect(getSetCookieNames(response)).toEqual(expect.arrayContaining(['at', 'rt', 'ah']))

      expect(await response.json()).toEqual({
        nextStep: 'authenticated',
        id: user.id,
        loginId: user.loginId,
        name: user.name,
        lastLoginAt: null,
        lastLogoutAt: null,
      })

      const sessionFamilies = await db
        .select()
        .from(authSessionFamilyTable)
        .where(eq(authSessionFamilyTable.userId, user.id))

      const [persistedUser] = await db
        .select({ loginAt: userTable.loginAt })
        .from(userTable)
        .where(eq(userTable.id, user.id))

      expect(sessionFamilies).toHaveLength(1)
      expect(persistedUser?.loginAt).toBeInstanceOf(Date)
    } finally {
      fetchGuard.restore()
    }
  })

  test('remember=false 이면 refresh session 없이 로그인한다', async () => {
    const user = await seedUser({ loginAt: null, logoutAt: null })
    const fetchGuard = installExternalFetchGuard([turnstileSuccessRoute()])
    const { codeChallenge } = createPkcePair()

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: {
          'CF-Connecting-IP': nextIp(),
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/135.0.0.0 Safari/537.36',
        },
        json: {
          loginId: user.loginId,
          password: TEST_LOGIN_PASSWORD,
          remember: false,
          turnstileToken: 'turnstile-ok',
          codeChallenge,
          fingerprint: 'fp-sessionless',
        },
      })

      expect(response.status).toBe(200)
      expect(getSetCookieNames(response)).toEqual(expect.arrayContaining(['at', 'ah']))
      expect(getSetCookieNames(response)).not.toContain('rt')

      expect(await response.json()).toEqual({
        nextStep: 'authenticated',
        id: user.id,
        loginId: user.loginId,
        name: user.name,
        lastLoginAt: null,
        lastLogoutAt: null,
      })

      const sessionFamilies = await db
        .select()
        .from(authSessionFamilyTable)
        .where(eq(authSessionFamilyTable.userId, user.id))

      expect(sessionFamilies).toHaveLength(0)
    } finally {
      fetchGuard.restore()
    }
  })

  test('비밀번호가 틀리면 401을 반환한다', async () => {
    const user = await seedUser()
    const fetchGuard = installExternalFetchGuard([turnstileSuccessRoute()])
    const { codeChallenge } = createPkcePair()

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'CF-Connecting-IP': nextIp() },
        json: {
          loginId: user.loginId,
          password: 'WrongPassword123',
          remember: false,
          turnstileToken: 'turnstile-ok',
          codeChallenge,
          fingerprint: 'fp-invalid-password',
        },
      })

      expect(response.status).toBe(401)
      expect(getSetCookieNames(response)).toEqual([])

      await expectProblemResponse(response, {
        status: 401,
        code: 'unauthorized',
        detail: '아이디 또는 비밀번호가 일치하지 않아요',
        instance: '/api/v1/auth/login',
      })
    } finally {
      fetchGuard.restore()
    }
  })

  test('활성화된 2FA가 있으면 authorization code를 발급하고 PKCE challenge를 저장한다', async () => {
    const user = await seedUser()
    await seedTwoFactor({ userId: user.id })
    const fetchGuard = installExternalFetchGuard([turnstileSuccessRoute()])
    const { codeChallenge, codeVerifier } = createPkcePair()
    const fingerprint = 'fp-two-factor'

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'CF-Connecting-IP': nextIp() },
        json: {
          loginId: user.loginId,
          password: TEST_LOGIN_PASSWORD,
          remember: true,
          turnstileToken: 'turnstile-ok',
          codeChallenge,
          fingerprint,
        },
      })

      expect(response.status).toBe(200)
      expect(getSetCookieNames(response)).toEqual([])

      const body = await response.json()
      expect(body.nextStep).toBe('two_factor_required')
      expect(typeof body.authorizationCode).toBe('string')

      expect(await verifyPKCEChallenge(body.authorizationCode, codeVerifier, fingerprint)).toEqual({
        valid: true,
        userId: user.id,
      })
    } finally {
      fetchGuard.restore()
    }
  })

  test('활성화된 2FA라도 유효한 trusted browser가 있으면 바로 로그인한다', async () => {
    const user = await seedUser({ loginAt: null, logoutAt: null })
    const browserId = 'trusted-browser-auth-login'
    const trustedFingerprint = 'fp-trusted-browser'
    const previousLastUsedAt = new Date('2025-01-01T00:00:00.000Z')

    await seedTwoFactor({ userId: user.id })
    await seedTrustedBrowser({
      userId: user.id,
      browserId,
      browserName: 'Chrome on macOS (Desktop)',
      expiresAt: new Date('2099-01-01T00:00:00.000Z'),
      lastUsedAt: previousLastUsedAt,
    })

    const trustedBrowser = await createTrustedBrowserCookies({
      browserId,
      fingerprint: trustedFingerprint,
      userId: user.id,
    })

    const fetchGuard = installExternalFetchGuard([turnstileSuccessRoute()])
    const { codeChallenge } = createPkcePair()

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/login',
        method: 'POST',
        cookies: trustedBrowser.cookieHeader,
        headers: { 'CF-Connecting-IP': nextIp() },
        json: {
          loginId: user.loginId,
          password: TEST_LOGIN_PASSWORD,
          remember: true,
          turnstileToken: 'turnstile-ok',
          codeChallenge,
          fingerprint: trustedFingerprint,
        },
      })

      expect(response.status).toBe(200)
      expect(getSetCookieNames(response)).toEqual(expect.arrayContaining(['at', 'rt', 'ah']))
      expect(await response.json()).toEqual({
        nextStep: 'authenticated',
        id: user.id,
        loginId: user.loginId,
        name: user.name,
        lastLoginAt: null,
        lastLogoutAt: null,
      })

      const [trustedBrowserRow] = await readTrustedBrowsersForUser(user.id)
      expect(trustedBrowserRow).toBeDefined()
      expect(trustedBrowserRow?.lastUsedAt).toBeInstanceOf(Date)
      expect(trustedBrowserRow!.lastUsedAt!.getTime()).toBeGreaterThan(previousLastUsedAt.getTime())
    } finally {
      fetchGuard.restore()
    }
  })

  test('Turnstile 검증이 실패하면 400을 반환한다', async () => {
    const fetchGuard = installExternalFetchGuard([turnstileFailureRoute()])
    const { codeChallenge } = createPkcePair()

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'CF-Connecting-IP': nextIp() },
        json: {
          loginId: 'nobody',
          password: TEST_LOGIN_PASSWORD,
          remember: false,
          turnstileToken: 'turnstile-expired',
          codeChallenge,
          fingerprint: 'fp-human-failed',
        },
      })

      expect(response.status).toBe(400)
      expect(getSetCookieNames(response)).toEqual([])

      await expectProblemResponse(response, {
        status: 400,
        code: 'human-verification-failed',
        instance: '/api/v1/auth/login',
      })
    } finally {
      fetchGuard.restore()
    }
  })

  test('반복된 로그인 실패는 representative 429를 반환한다', async () => {
    const user = await seedUser()
    const fetchGuard = installExternalFetchGuard([turnstileSuccessRoute()])
    const { codeChallenge } = createPkcePair()
    const rateLimitedIp = nextIp()

    try {
      for (let attempt = 0; attempt < 9; attempt += 1) {
        const response = await requestBackend({
          path: '/api/v1/auth/login',
          method: 'POST',
          headers: { 'CF-Connecting-IP': rateLimitedIp },
          json: {
            loginId: user.loginId,
            password: 'WrongPassword123',
            remember: false,
            turnstileToken: 'turnstile-ok',
            codeChallenge,
            fingerprint: `fp-rate-limit-${attempt}`,
          },
        })

        expect(response.status).toBe(401)
      }

      const allowedResponse = await requestBackend({
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'CF-Connecting-IP': rateLimitedIp },
        json: {
          loginId: user.loginId,
          password: 'WrongPassword123',
          remember: false,
          turnstileToken: 'turnstile-ok',
          codeChallenge,
          fingerprint: 'fp-rate-limit-allowed',
        },
      })

      expect(allowedResponse.status).toBe(401)

      const blockedResponse = await requestBackend({
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'CF-Connecting-IP': rateLimitedIp },
        json: {
          loginId: user.loginId,
          password: 'WrongPassword123',
          remember: false,
          turnstileToken: 'turnstile-ok',
          codeChallenge,
          fingerprint: 'fp-rate-limit-blocked',
        },
      })

      expect(blockedResponse.status).toBe(429)
      expect(getSetCookieNames(blockedResponse)).toEqual([])
      expect(blockedResponse.headers.get('Retry-After')).not.toBeNull()

      await expectProblemResponse(blockedResponse, {
        status: 429,
        code: 'too-many-requests',
        instance: '/api/v1/auth/login',
      })
    } finally {
      fetchGuard.restore()
    }
  })
})
