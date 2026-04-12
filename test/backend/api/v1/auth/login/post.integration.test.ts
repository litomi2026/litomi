import { getSetCookieNames, requestBackend } from '@test/backend/setup/app'
import { createTrustedBrowserCookies, expectCookieCleared } from '@test/backend/setup/auth'
import {
  readSessionFamiliesForUser,
  readTrustedBrowsersForUser,
  readUserById,
  seedTrustedBrowser,
  seedTwoFactor,
  seedUser,
} from '@test/backend/setup/db'
import { expectInvalidParams, expectProblemResponse } from '@test/backend/setup/problem'
import { describe, expect, setSystemTime, test } from 'bun:test'

import {
  AUTH_TEST_CHROME_USER_AGENT,
  AUTH_TEST_SAFARI_USER_AGENT,
  AUTH_TEST_TOTP_TIME,
  buildAuthHeaders,
  installAuthIntegrationHooks,
} from '../fixtures'
import { buildLoginTwoFactorRequest } from './2fa/fixtures'
import { buildLoginRequest, installLoginTurnstileGuard } from './fixtures'

installAuthIntegrationHooks({ redis: true })

describe('POST /api/v1/auth/login', () => {
  test('remember=true 이면 인증 응답과 세션 쿠키를 반환한다', async () => {
    const user = await seedUser({ loginAt: null, logoutAt: null })
    const fetchGuard = installLoginTurnstileGuard()

    const request = buildLoginRequest({
      loginId: user.loginId,
      remember: true,
      fingerprint: 'fp-auth-login-remember',
    })

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: buildAuthHeaders({
          ip: '203.0.113.11',
          userAgent: AUTH_TEST_SAFARI_USER_AGENT,
        }),
        json: request.payload,
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

      const sessionFamilies = await readSessionFamiliesForUser(user.id)
      const persistedUser = await readUserById(user.id)
      expect(sessionFamilies).toHaveLength(1)
      expect(persistedUser?.loginAt).toBeInstanceOf(Date)
    } finally {
      fetchGuard.restore()
    }
  })

  test('remember=false 이면 refresh session 없이 로그인한다', async () => {
    const user = await seedUser({ loginAt: null, logoutAt: null })
    const fetchGuard = installLoginTurnstileGuard()

    const request = buildLoginRequest({
      loginId: user.loginId,
      fingerprint: 'fp-auth-login-sessionless',
    })

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: buildAuthHeaders({
          ip: '203.0.113.12',
          userAgent: AUTH_TEST_CHROME_USER_AGENT,
        }),
        json: request.payload,
      })

      expect(response.status).toBe(200)

      const cookieNames = getSetCookieNames(response)
      expect(cookieNames).toEqual(expect.arrayContaining(['at', 'ah']))
      expect(cookieNames).not.toContain('rt')

      expect(await response.json()).toEqual({
        nextStep: 'authenticated',
        id: user.id,
        loginId: user.loginId,
        name: user.name,
        lastLoginAt: null,
        lastLogoutAt: null,
      })

      const sessionFamilies = await readSessionFamiliesForUser(user.id)
      expect(sessionFamilies).toHaveLength(0)
    } finally {
      fetchGuard.restore()
    }
  })

  test('비밀번호가 틀리면 401을 반환한다', async () => {
    const user = await seedUser({ loginAt: null, logoutAt: null })
    const fetchGuard = installLoginTurnstileGuard()

    const request = buildLoginRequest({
      loginId: user.loginId,
      password: 'WrongPassword123',
      fingerprint: 'fp-auth-login-invalid-password',
    })

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: buildAuthHeaders({ ip: '203.0.113.13' }),
        json: request.payload,
      })

      expect(response.status).toBe(401)
      expect(getSetCookieNames(response)).toEqual([])

      await expectProblemResponse(response, {
        status: 401,
        code: 'unauthorized',
        detail: '아이디 또는 비밀번호가 일치하지 않아요',
        instance: '/api/v1/auth/login',
      })

      const [persistedUser, sessionFamilies] = await Promise.all([
        readUserById(user.id),
        readSessionFamiliesForUser(user.id),
      ])

      expect(persistedUser?.loginAt).toBeNull()
      expect(sessionFamilies).toHaveLength(0)
    } finally {
      fetchGuard.restore()
    }
  })

  test('존재하지 않는 loginId 도 동일한 401 응답을 반환한다', async () => {
    const fetchGuard = installLoginTurnstileGuard()
    const request = buildLoginRequest({
      loginId: 'missing_login_user',
      fingerprint: 'fp-auth-login-missing-user',
    })

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: buildAuthHeaders({ ip: '203.0.113.14' }),
        json: request.payload,
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

  test('활성화된 2FA가 있으면 로그인 응답의 authorization code로 2단계 인증을 이어간다', async () => {
    const user = await seedUser({ id: 2101, loginAt: null, logoutAt: null })
    await seedTwoFactor({ userId: user.id })
    const fetchGuard = installLoginTurnstileGuard()

    const loginRequest = buildLoginRequest({
      loginId: user.loginId,
      fingerprint: 'fp-auth-login-2fa-flow',
    })

    try {
      const loginResponse = await requestBackend({
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: buildAuthHeaders({ ip: '203.0.113.15' }),
        json: loginRequest.payload,
      })

      expect(loginResponse.status).toBe(200)
      expect(getSetCookieNames(loginResponse)).toEqual([])

      const loginBody = await loginResponse.json()
      expect(loginBody.nextStep).toBe('two_factor_required')
      expect(typeof loginBody.authorizationCode).toBe('string')

      const [persistedUserBeforeTwoFactor, sessionFamiliesBeforeTwoFactor] = await Promise.all([
        readUserById(user.id),
        readSessionFamiliesForUser(user.id),
      ])

      expect(persistedUserBeforeTwoFactor?.loginAt).toBeNull()
      expect(sessionFamiliesBeforeTwoFactor).toHaveLength(0)

      setSystemTime(new Date(AUTH_TEST_TOTP_TIME))

      let twoFactorResponse: Response

      try {
        twoFactorResponse = await requestBackend({
          path: '/api/v1/auth/login/2fa',
          method: 'POST',
          headers: buildAuthHeaders({ ip: '203.0.113.16' }),
          json: buildLoginTwoFactorRequest({
            authorizationCode: String(loginBody.authorizationCode),
            codeVerifier: loginRequest.codeVerifier,
            fingerprint: loginRequest.payload.fingerprint,
          }),
        })
      } finally {
        setSystemTime()
      }

      expect(twoFactorResponse.status).toBe(200)

      const cookieNames = getSetCookieNames(twoFactorResponse)
      expect(cookieNames).toEqual(expect.arrayContaining(['at', 'ah']))
      expect(cookieNames).not.toContain('rt')

      const twoFactorBody = await twoFactorResponse.json()

      expect(twoFactorBody).toMatchObject({
        id: user.id,
        loginId: user.loginId,
        name: user.name,
        lastLogoutAt: null,
        isBackupCode: false,
        backupCodeCount: 0,
      })

      expect(typeof twoFactorBody.lastLoginAt).toBe('string')

      const persistedUser = await readUserById(user.id)
      expect(persistedUser?.loginAt).toBeInstanceOf(Date)
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

    const fetchGuard = installLoginTurnstileGuard()

    const request = buildLoginRequest({
      loginId: user.loginId,
      remember: true,
      fingerprint: trustedFingerprint,
    })

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/login',
        method: 'POST',
        cookies: trustedBrowser.cookieHeader,
        headers: buildAuthHeaders({ ip: '203.0.113.17' }),
        json: request.payload,
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

  test('다른 사용자 소유의 trusted browser 쿠키는 지우고 2단계 인증으로 되돌린다', async () => {
    const user = await seedUser({ loginAt: null, logoutAt: null })
    const otherUser = await seedUser({ loginAt: null, logoutAt: null })
    const browserId = 'trusted-browser-other-user'
    const fingerprint = 'fp-trusted-browser-other-user'

    await seedTwoFactor({ userId: user.id })

    await seedTrustedBrowser({
      userId: otherUser.id,
      browserId,
      browserName: 'Chrome on macOS (Desktop)',
      expiresAt: new Date('2099-01-01T00:00:00.000Z'),
      lastUsedAt: new Date('2025-01-01T00:00:00.000Z'),
    })

    const trustedBrowser = await createTrustedBrowserCookies({
      browserId,
      fingerprint,
      userId: otherUser.id,
    })

    const fetchGuard = installLoginTurnstileGuard()

    const request = buildLoginRequest({
      loginId: user.loginId,
      remember: true,
      fingerprint,
    })

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/login',
        method: 'POST',
        cookies: trustedBrowser.cookieHeader,
        headers: buildAuthHeaders({ ip: '203.0.113.18' }),
        json: request.payload,
      })

      expect(response.status).toBe(200)
      expectCookieCleared(response, 'tbt')

      const cookieNames = getSetCookieNames(response)
      expect(cookieNames).toContain('tbt')
      expect(cookieNames).not.toContain('at')
      expect(cookieNames).not.toContain('rt')
      expect(cookieNames).not.toContain('ah')

      const body = await response.json()
      expect(body.nextStep).toBe('two_factor_required')
      expect(typeof body.authorizationCode).toBe('string')

      const [persistedUser, sessionFamilies] = await Promise.all([
        readUserById(user.id),
        readSessionFamiliesForUser(user.id),
      ])

      expect(persistedUser?.loginAt).toBeNull()
      expect(sessionFamilies).toHaveLength(0)
    } finally {
      fetchGuard.restore()
    }
  })

  test('trusted browser fingerprint 가 다르면 쿠키를 지우고 2단계 인증으로 되돌린다', async () => {
    const user = await seedUser({ loginAt: null, logoutAt: null })
    const browserId = 'trusted-browser-fingerprint-mismatch'
    const cookieFingerprint = 'fp-trusted-browser-cookie'

    await seedTwoFactor({ userId: user.id })

    await seedTrustedBrowser({
      userId: user.id,
      browserId,
      browserName: 'Chrome on macOS (Desktop)',
      expiresAt: new Date('2099-01-01T00:00:00.000Z'),
      lastUsedAt: new Date('2025-01-01T00:00:00.000Z'),
    })

    const trustedBrowser = await createTrustedBrowserCookies({
      browserId,
      fingerprint: cookieFingerprint,
      userId: user.id,
    })

    const fetchGuard = installLoginTurnstileGuard()

    const request = buildLoginRequest({
      loginId: user.loginId,
      remember: true,
      fingerprint: 'fp-trusted-browser-request',
    })

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/login',
        method: 'POST',
        cookies: trustedBrowser.cookieHeader,
        headers: buildAuthHeaders({ ip: '203.0.113.18' }),
        json: request.payload,
      })

      expect(response.status).toBe(200)
      expectCookieCleared(response, 'tbt')

      const cookieNames = getSetCookieNames(response)
      expect(cookieNames).toContain('tbt')
      expect(cookieNames).not.toContain('at')
      expect(cookieNames).not.toContain('rt')
      expect(cookieNames).not.toContain('ah')

      const body = await response.json()
      expect(body.nextStep).toBe('two_factor_required')
      expect(typeof body.authorizationCode).toBe('string')

      const [persistedUser, sessionFamilies] = await Promise.all([
        readUserById(user.id),
        readSessionFamiliesForUser(user.id),
      ])

      expect(persistedUser?.loginAt).toBeNull()
      expect(sessionFamilies).toHaveLength(0)
    } finally {
      fetchGuard.restore()
    }
  })

  test('만료된 trusted browser 쿠키는 지우고 2단계 인증으로 되돌린다', async () => {
    const user = await seedUser()
    const browserId = 'trusted-browser-expired'
    const fingerprint = 'fp-trusted-browser-expired'

    await seedTwoFactor({ userId: user.id })

    await seedTrustedBrowser({
      userId: user.id,
      browserId,
      browserName: 'Chrome on macOS (Desktop)',
      expiresAt: new Date('2020-01-01T00:00:00.000Z'),
      lastUsedAt: new Date('2020-01-01T00:00:00.000Z'),
    })

    const trustedBrowser = await createTrustedBrowserCookies({
      browserId,
      fingerprint,
      userId: user.id,
    })

    const fetchGuard = installLoginTurnstileGuard()

    const request = buildLoginRequest({
      loginId: user.loginId,
      remember: true,
      fingerprint,
    })

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/login',
        method: 'POST',
        cookies: trustedBrowser.cookieHeader,
        headers: buildAuthHeaders({ ip: '203.0.113.18' }),
        json: request.payload,
      })

      expect(response.status).toBe(200)
      expectCookieCleared(response, 'tbt')

      const cookieNames = getSetCookieNames(response)
      expect(cookieNames).toContain('tbt')
      expect(cookieNames).not.toContain('at')
      expect(cookieNames).not.toContain('rt')
      expect(cookieNames).not.toContain('ah')

      const body = await response.json()
      expect(body.nextStep).toBe('two_factor_required')
      expect(typeof body.authorizationCode).toBe('string')
    } finally {
      fetchGuard.restore()
    }
  })

  test('위조된 trusted browser 쿠키는 지우고 2단계 인증으로 되돌린다', async () => {
    const user = await seedUser({ loginAt: null, logoutAt: null })
    await seedTwoFactor({ userId: user.id })
    const fetchGuard = installLoginTurnstileGuard()

    const request = buildLoginRequest({
      loginId: user.loginId,
      remember: true,
      fingerprint: 'fp-auth-login-invalid-trusted-browser',
    })

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/login',
        method: 'POST',
        cookies: 'tbt=definitely-not-a-jwt',
        headers: buildAuthHeaders({ ip: '203.0.113.22' }),
        json: request.payload,
      })

      expect(response.status).toBe(200)
      expectCookieCleared(response, 'tbt')

      const cookieNames = getSetCookieNames(response)
      expect(cookieNames).toContain('tbt')
      expect(cookieNames).not.toContain('at')
      expect(cookieNames).not.toContain('rt')
      expect(cookieNames).not.toContain('ah')

      const body = await response.json()
      expect(body.nextStep).toBe('two_factor_required')
      expect(typeof body.authorizationCode).toBe('string')

      const [persistedUser, sessionFamilies, trustedBrowsers] = await Promise.all([
        readUserById(user.id),
        readSessionFamiliesForUser(user.id),
        readTrustedBrowsersForUser(user.id),
      ])

      expect(persistedUser?.loginAt).toBeNull()
      expect(sessionFamilies).toHaveLength(0)
      expect(trustedBrowsers).toHaveLength(0)
    } finally {
      fetchGuard.restore()
    }
  })

  test('Turnstile 검증이 실패하면 400을 반환한다', async () => {
    const user = await seedUser({ loginAt: null, logoutAt: null })
    const fetchGuard = installLoginTurnstileGuard('failure')

    const request = buildLoginRequest({
      loginId: user.loginId,
      turnstileToken: 'turnstile-expired',
      fingerprint: 'fp-auth-login-turnstile-failure',
    })

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: buildAuthHeaders({ ip: '203.0.113.19' }),
        json: request.payload,
      })

      expect(response.status).toBe(400)
      expect(getSetCookieNames(response)).toEqual([])

      await expectProblemResponse(response, {
        status: 400,
        code: 'human-verification-failed',
        instance: '/api/v1/auth/login',
      })

      const [persistedUser, sessionFamilies] = await Promise.all([
        readUserById(user.id),
        readSessionFamiliesForUser(user.id),
      ])

      expect(persistedUser?.loginAt).toBeNull()
      expect(sessionFamilies).toHaveLength(0)
    } finally {
      fetchGuard.restore()
    }
  })

  test('Turnstile 검증 중 외부 오류가 나면 400을 반환하고 로그인 부작용이 없다', async () => {
    const user = await seedUser({ loginAt: null, logoutAt: null })
    const fetchGuard = installLoginTurnstileGuard('error')

    const request = buildLoginRequest({
      loginId: user.loginId,
      turnstileToken: 'turnstile-error',
      fingerprint: 'fp-auth-login-turnstile-error',
    })

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: buildAuthHeaders({ ip: '203.0.113.21' }),
        json: request.payload,
      })

      expect(response.status).toBe(400)
      expect(getSetCookieNames(response)).toEqual([])

      await expectProblemResponse(response, {
        status: 400,
        code: 'human-verification-failed',
        instance: '/api/v1/auth/login',
      })

      const [persistedUser, sessionFamilies] = await Promise.all([
        readUserById(user.id),
        readSessionFamiliesForUser(user.id),
      ])

      expect(persistedUser?.loginAt).toBeNull()
      expect(sessionFamilies).toHaveLength(0)
    } finally {
      fetchGuard.restore()
    }
  })

  test('유효하지 않은 payload 는 400 invalid-input 을 반환한다', async () => {
    const response = await requestBackend({
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: buildAuthHeaders({ ip: '203.0.113.20' }),
      json: buildLoginRequest({
        loginId: 'invalid_payload_user',
        codeChallenge: 'short',
        fingerprint: 'fp-auth-login-invalid-payload',
      }).payload,
    })

    expect(response.status).toBe(400)
    expect(getSetCookieNames(response)).toEqual([])

    const problem = await expectProblemResponse(response, {
      status: 400,
      code: 'invalid-input',
      instance: '/api/v1/auth/login',
    })

    expectInvalidParams(problem, [{ name: 'codeChallenge' }])
  })

  test('반복된 로그인 실패는 representative 429를 반환한다', async () => {
    const user = await seedUser()
    const fetchGuard = installLoginTurnstileGuard()
    const rateLimitedIp = '203.0.113.29'

    try {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const response = await requestBackend({
          path: '/api/v1/auth/login',
          method: 'POST',
          headers: buildAuthHeaders({ ip: rateLimitedIp }),
          json: buildLoginRequest({
            loginId: user.loginId,
            password: 'WrongPassword123',
            fingerprint: `fp-auth-login-rate-limit-${attempt}`,
          }).payload,
        })

        expect(response.status).toBe(401)
      }

      const blockedResponse = await requestBackend({
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: buildAuthHeaders({ ip: rateLimitedIp }),
        json: buildLoginRequest({
          loginId: user.loginId,
          password: 'WrongPassword123',
          fingerprint: 'fp-auth-login-rate-limit-blocked',
        }).payload,
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
