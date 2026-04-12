import { getSetCookieNames, requestBackend } from '@test/backend/setup/app'
import {
  expireTwoFactor,
  readSessionFamiliesForUser,
  readTrustedBrowsersForUser,
  readTwoFactorBackupCodes,
  readUserById,
  seedTwoFactor,
  seedTwoFactorBackupCodes,
  seedUser,
} from '@test/backend/setup/db'
import { expectInvalidParams, expectProblemResponse } from '@test/backend/setup/problem'
import { describe, expect, setSystemTime, test } from 'bun:test'

import {
  AUTH_TEST_SAFARI_USER_AGENT,
  AUTH_TEST_TOTP_TIME,
  buildAuthHeaders,
  installAuthIntegrationHooks,
} from '../../fixtures'
import { buildLoginTwoFactorRequest, issueAuthorizationChallenge } from './fixtures'

installAuthIntegrationHooks({ redis: true })

describe('POST /api/v1/auth/login/2fa', () => {
  test('유효한 TOTP로 2단계 인증을 완료한다', async () => {
    const user = await seedUser({ id: 2201, loginAt: null, logoutAt: null })
    await seedTwoFactor({ userId: user.id })

    const challenge = await issueAuthorizationChallenge({
      userId: user.id,
      fingerprint: 'fp-auth-login-2fa-totp',
    })

    setSystemTime(new Date(AUTH_TEST_TOTP_TIME))

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/login/2fa',
        method: 'POST',
        headers: buildAuthHeaders({ ip: '203.0.113.31' }),
        json: buildLoginTwoFactorRequest(challenge),
      })

      expect(response.status).toBe(200)

      const cookieNames = getSetCookieNames(response)
      expect(cookieNames).toEqual(expect.arrayContaining(['at', 'ah']))
      expect(cookieNames).not.toContain('rt')

      const body = await response.json()

      expect(body).toMatchObject({
        id: user.id,
        loginId: user.loginId,
        name: user.name,
        lastLogoutAt: null,
        isBackupCode: false,
        backupCodeCount: 0,
      })

      expect(typeof body.lastLoginAt).toBe('string')

      const persistedUser = await readUserById(user.id)
      expect(persistedUser?.loginAt).toBeInstanceOf(Date)
    } finally {
      setSystemTime()
    }
  })

  test('유효한 backup code는 소모되고 남은 개수를 반환한다', async () => {
    const user = await seedUser({ id: 2202, loginAt: null, logoutAt: null })
    await seedTwoFactor({ userId: user.id })
    const { codes } = await seedTwoFactorBackupCodes(user.id, 3)

    const challenge = await issueAuthorizationChallenge({
      userId: user.id,
      fingerprint: 'fp-auth-login-2fa-backup',
    })

    const response = await requestBackend({
      path: '/api/v1/auth/login/2fa',
      method: 'POST',
      headers: buildAuthHeaders({ ip: '203.0.113.32' }),
      json: buildLoginTwoFactorRequest(challenge, { token: codes[0]! }),
    })

    expect(response.status).toBe(200)
    expect(getSetCookieNames(response)).toEqual(expect.arrayContaining(['at', 'ah']))

    const body = await response.json()

    expect(body).toMatchObject({
      id: user.id,
      loginId: user.loginId,
      name: user.name,
      lastLogoutAt: null,
      isBackupCode: true,
      backupCodeCount: 2,
    })

    expect(typeof body.lastLoginAt).toBe('string')

    const remainingBackupCodes = await readTwoFactorBackupCodes(user.id)
    expect(remainingBackupCodes).toHaveLength(2)
  })

  test('remember=false 여도 trustBrowser=true 면 trusted browser 쿠키만 별도로 발급한다', async () => {
    const user = await seedUser({ id: 2212, loginAt: null, logoutAt: null })
    await seedTwoFactor({ userId: user.id })

    const challenge = await issueAuthorizationChallenge({
      userId: user.id,
      fingerprint: 'fp-auth-login-2fa-trusted-without-remember',
    })

    setSystemTime(new Date(AUTH_TEST_TOTP_TIME))

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/login/2fa',
        method: 'POST',
        headers: buildAuthHeaders({
          ip: '203.0.113.42',
          userAgent: AUTH_TEST_SAFARI_USER_AGENT,
        }),
        json: buildLoginTwoFactorRequest(challenge, {
          trustBrowser: true,
        }),
      })

      expect(response.status).toBe(200)

      const cookieNames = getSetCookieNames(response)
      expect(cookieNames).toEqual(expect.arrayContaining(['at', 'ah', 'tbt']))
      expect(cookieNames).not.toContain('rt')

      const trustedBrowsers = await readTrustedBrowsersForUser(user.id)
      expect(trustedBrowsers).toHaveLength(1)

      const sessionFamilies = await readSessionFamiliesForUser(user.id)
      expect(sessionFamilies).toHaveLength(0)
    } finally {
      setSystemTime()
    }
  })

  test('trustBrowser=true 와 TOTP 인증이면 trusted browser 쿠키와 세션을 함께 발급한다', async () => {
    const user = await seedUser({ id: 2203, loginAt: null, logoutAt: null })
    await seedTwoFactor({ userId: user.id })

    const challenge = await issueAuthorizationChallenge({
      userId: user.id,
      fingerprint: 'fp-auth-login-2fa-trusted',
    })

    setSystemTime(new Date(AUTH_TEST_TOTP_TIME))

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/login/2fa',
        method: 'POST',
        headers: buildAuthHeaders({
          ip: '203.0.113.33',
          userAgent: AUTH_TEST_SAFARI_USER_AGENT,
        }),
        json: buildLoginTwoFactorRequest(challenge, {
          remember: true,
          trustBrowser: true,
        }),
      })

      expect(response.status).toBe(200)
      expect(getSetCookieNames(response)).toEqual(expect.arrayContaining(['at', 'rt', 'ah', 'tbt']))

      const trustedBrowsers = await readTrustedBrowsersForUser(user.id)
      expect(trustedBrowsers).toHaveLength(1)
      expect(trustedBrowsers[0]?.browserName).toBeTruthy()

      const sessionFamilies = await readSessionFamiliesForUser(user.id)
      expect(sessionFamilies).toHaveLength(1)
    } finally {
      setSystemTime()
    }
  })

  test('backup code 인증에서는 trustBrowser=true 여도 trusted browser 를 만들지 않는다', async () => {
    const user = await seedUser({ id: 2204, loginAt: null, logoutAt: null })
    await seedTwoFactor({ userId: user.id })
    const { codes } = await seedTwoFactorBackupCodes(user.id, 3)

    const challenge = await issueAuthorizationChallenge({
      userId: user.id,
      fingerprint: 'fp-auth-login-2fa-backup-trusted',
    })

    const response = await requestBackend({
      path: '/api/v1/auth/login/2fa',
      method: 'POST',
      headers: buildAuthHeaders({
        ip: '203.0.113.34',
        userAgent: AUTH_TEST_SAFARI_USER_AGENT,
      }),
      json: buildLoginTwoFactorRequest(challenge, {
        remember: true,
        token: codes[0]!,
        trustBrowser: true,
      }),
    })

    expect(response.status).toBe(200)

    const cookieNames = getSetCookieNames(response)
    expect(cookieNames).toEqual(expect.arrayContaining(['at', 'rt', 'ah']))
    expect(cookieNames).not.toContain('tbt')

    const body = await response.json()
    expect(body.isBackupCode).toBe(true)
    expect(body.backupCodeCount).toBe(2)

    const trustedBrowsers = await readTrustedBrowsersForUser(user.id)
    expect(trustedBrowsers).toHaveLength(0)

    const sessionFamilies = await readSessionFamiliesForUser(user.id)
    expect(sessionFamilies).toHaveLength(1)
  })

  test('authorization code 가 유효하지 않으면 401을 반환한다', async () => {
    const user = await seedUser({ id: 2205 })
    await seedTwoFactor({ userId: user.id })

    const response = await requestBackend({
      path: '/api/v1/auth/login/2fa',
      method: 'POST',
      headers: buildAuthHeaders({ ip: '203.0.113.35' }),
      json: buildLoginTwoFactorRequest(
        {
          authorizationCode: 'invalid-authorization-code',
          codeVerifier: 'verifier-verifier-verifier-verifier-verifier-123456',
          fingerprint: 'fp-auth-login-2fa-invalid-code',
        },
        { token: '000000' },
      ),
    })

    expect(response.status).toBe(401)
    expect(getSetCookieNames(response)).toEqual([])

    await expectProblemResponse(response, {
      status: 401,
      code: 'unauthorized',
      instance: '/api/v1/auth/login/2fa',
    })
  })

  test('authorization code 발급 뒤 2FA가 비활성화되면 401을 반환한다', async () => {
    const user = await seedUser({ id: 2213, loginAt: null, logoutAt: null })
    await seedTwoFactor({ userId: user.id })

    const challenge = await issueAuthorizationChallenge({
      userId: user.id,
      fingerprint: 'fp-auth-login-2fa-expired-after-challenge',
    })

    await expireTwoFactor(user.id, new Date('2026-01-01T00:00:00.000Z'))

    setSystemTime(new Date(AUTH_TEST_TOTP_TIME))

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/login/2fa',
        method: 'POST',
        headers: buildAuthHeaders({ ip: '203.0.113.43' }),
        json: buildLoginTwoFactorRequest(challenge),
      })

      expect(response.status).toBe(401)
      expect(getSetCookieNames(response)).toEqual([])

      await expectProblemResponse(response, {
        status: 401,
        code: 'unauthorized',
        instance: '/api/v1/auth/login/2fa',
      })

      const [persistedUser, sessionFamilies, trustedBrowsers] = await Promise.all([
        readUserById(user.id),
        readSessionFamiliesForUser(user.id),
        readTrustedBrowsersForUser(user.id),
      ])

      expect(persistedUser?.loginAt).toBeNull()
      expect(sessionFamilies).toHaveLength(0)
      expect(trustedBrowsers).toHaveLength(0)
    } finally {
      setSystemTime()
    }
  })

  test('같은 authorization code 는 한 번만 사용할 수 있다', async () => {
    const user = await seedUser({ id: 2206 })
    await seedTwoFactor({ userId: user.id })

    const challenge = await issueAuthorizationChallenge({
      userId: user.id,
      fingerprint: 'fp-auth-login-2fa-reuse',
    })

    setSystemTime(new Date(AUTH_TEST_TOTP_TIME))

    let firstResponse: Response | null = null
    let request: ReturnType<typeof buildLoginTwoFactorRequest> | null = null

    try {
      request = buildLoginTwoFactorRequest(challenge)
      firstResponse = await requestBackend({
        path: '/api/v1/auth/login/2fa',
        method: 'POST',
        headers: buildAuthHeaders({ ip: '203.0.113.36' }),
        json: request,
      })
    } finally {
      setSystemTime()
    }

    if (!firstResponse || !request) {
      throw new Error('2FA request setup failed before assertion')
    }

    expect(firstResponse.status).toBe(200)

    const reusedResponse = await requestBackend({
      path: '/api/v1/auth/login/2fa',
      method: 'POST',
      headers: buildAuthHeaders({ ip: '203.0.113.37' }),
      json: request,
    })

    expect(reusedResponse.status).toBe(401)
    expect(getSetCookieNames(reusedResponse)).toEqual([])

    await expectProblemResponse(reusedResponse, {
      status: 401,
      code: 'unauthorized',
      instance: '/api/v1/auth/login/2fa',
    })
  })

  test('authorization code 의 fingerprint 가 다르면 401을 반환한다', async () => {
    const user = await seedUser({ id: 2210, loginAt: null, logoutAt: null })
    await seedTwoFactor({ userId: user.id })

    const challenge = await issueAuthorizationChallenge({
      userId: user.id,
      fingerprint: 'fp-auth-login-2fa-fingerprint',
    })

    const response = await requestBackend({
      path: '/api/v1/auth/login/2fa',
      method: 'POST',
      headers: buildAuthHeaders({ ip: '203.0.113.40' }),
      json: buildLoginTwoFactorRequest(
        {
          ...challenge,
          fingerprint: 'fp-auth-login-2fa-fingerprint-other',
        },
        { token: '000000' },
      ),
    })

    expect(response.status).toBe(401)
    expect(getSetCookieNames(response)).toEqual([])

    await expectProblemResponse(response, {
      status: 401,
      code: 'unauthorized',
      instance: '/api/v1/auth/login/2fa',
    })

    const [persistedUser, sessionFamilies, trustedBrowsers] = await Promise.all([
      readUserById(user.id),
      readSessionFamiliesForUser(user.id),
      readTrustedBrowsersForUser(user.id),
    ])

    expect(persistedUser?.loginAt).toBeNull()
    expect(sessionFamilies).toHaveLength(0)
    expect(trustedBrowsers).toHaveLength(0)
  })

  test('authorization code 의 codeVerifier 가 다르면 401을 반환한다', async () => {
    const user = await seedUser({ id: 2211, loginAt: null, logoutAt: null })
    await seedTwoFactor({ userId: user.id })

    const challenge = await issueAuthorizationChallenge({
      userId: user.id,
      fingerprint: 'fp-auth-login-2fa-code-verifier',
    })

    const response = await requestBackend({
      path: '/api/v1/auth/login/2fa',
      method: 'POST',
      headers: buildAuthHeaders({ ip: '203.0.113.41' }),
      json: buildLoginTwoFactorRequest(
        {
          ...challenge,
          codeVerifier: `${challenge.codeVerifier.slice(0, -1)}x`,
        },
        { token: '000000' },
      ),
    })

    expect(response.status).toBe(401)
    expect(getSetCookieNames(response)).toEqual([])

    await expectProblemResponse(response, {
      status: 401,
      code: 'unauthorized',
      instance: '/api/v1/auth/login/2fa',
    })

    const [persistedUser, sessionFamilies, trustedBrowsers] = await Promise.all([
      readUserById(user.id),
      readSessionFamiliesForUser(user.id),
      readTrustedBrowsersForUser(user.id),
    ])

    expect(persistedUser?.loginAt).toBeNull()
    expect(sessionFamilies).toHaveLength(0)
    expect(trustedBrowsers).toHaveLength(0)
  })

  test('유효하지 않은 TOTP 는 400을 반환한다', async () => {
    const user = await seedUser({ id: 2207, loginAt: null, logoutAt: null })
    await seedTwoFactor({ userId: user.id })

    const challenge = await issueAuthorizationChallenge({
      userId: user.id,
      fingerprint: 'fp-auth-login-2fa-invalid-token',
    })

    const response = await requestBackend({
      path: '/api/v1/auth/login/2fa',
      method: 'POST',
      headers: buildAuthHeaders({ ip: '203.0.113.38' }),
      json: buildLoginTwoFactorRequest(challenge, { token: '000000' }),
    })

    expect(response.status).toBe(400)
    expect(getSetCookieNames(response)).toEqual([])

    await expectProblemResponse(response, {
      status: 400,
      code: 'bad-request',
      instance: '/api/v1/auth/login/2fa',
    })

    const [persistedUser, sessionFamilies, trustedBrowsers] = await Promise.all([
      readUserById(user.id),
      readSessionFamiliesForUser(user.id),
      readTrustedBrowsersForUser(user.id),
    ])

    expect(persistedUser?.loginAt).toBeNull()
    expect(sessionFamilies).toHaveLength(0)
    expect(trustedBrowsers).toHaveLength(0)
  })

  test('유효하지 않은 token 형식은 400 invalid-input 을 반환한다', async () => {
    const user = await seedUser({ id: 2208 })
    await seedTwoFactor({ userId: user.id })

    const challenge = await issueAuthorizationChallenge({
      userId: user.id,
      fingerprint: 'fp-auth-login-2fa-invalid-shape',
    })

    const response = await requestBackend({
      path: '/api/v1/auth/login/2fa',
      method: 'POST',
      headers: buildAuthHeaders({ ip: '203.0.113.39' }),
      json: buildLoginTwoFactorRequest(challenge, { token: 'abc123' }),
    })

    expect(response.status).toBe(400)
    expect(getSetCookieNames(response)).toEqual([])

    const problem = await expectProblemResponse(response, {
      status: 400,
      code: 'invalid-input',
      instance: '/api/v1/auth/login/2fa',
    })

    expectInvalidParams(problem, [{ name: 'token' }])
  })

  test('반복된 2단계 인증 실패는 representative 429를 반환한다', async () => {
    const user = await seedUser({ id: 2209 })
    await seedTwoFactor({ userId: user.id })
    const rateLimitedIp = '203.0.113.49'

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const challenge = await issueAuthorizationChallenge({
        userId: user.id,
        fingerprint: `fp-auth-login-2fa-rate-limit-${attempt}`,
      })

      const response = await requestBackend({
        path: '/api/v1/auth/login/2fa',
        method: 'POST',
        headers: buildAuthHeaders({ ip: rateLimitedIp }),
        json: buildLoginTwoFactorRequest(challenge, { token: '000000' }),
      })

      expect(response.status).toBe(400)
    }

    const blockedChallenge = await issueAuthorizationChallenge({
      userId: user.id,
      fingerprint: 'fp-auth-login-2fa-rate-limit-blocked',
    })

    const blockedResponse = await requestBackend({
      path: '/api/v1/auth/login/2fa',
      method: 'POST',
      headers: buildAuthHeaders({ ip: rateLimitedIp }),
      json: buildLoginTwoFactorRequest(blockedChallenge, { token: '000000' }),
    })

    expect(blockedResponse.status).toBe(429)
    expect(getSetCookieNames(blockedResponse)).toEqual([])
    expect(blockedResponse.headers.get('Retry-After')).not.toBeNull()

    await expectProblemResponse(blockedResponse, {
      status: 429,
      code: 'too-many-requests',
      instance: '/api/v1/auth/login/2fa',
    })
  })
})
