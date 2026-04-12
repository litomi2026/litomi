import { getSetCookieNames, requestBackend } from '@test/backend/setup/app'
import {
  expireTwoFactor,
  readSessionFamiliesForUser,
  readTrustedBrowsersForUser,
  readUserById,
  seedTwoFactor,
  seedUser,
} from '@test/backend/setup/db'
import { expectInvalidParams, expectProblemResponse } from '@test/backend/setup/problem'
import { describe, expect, setSystemTime, test } from 'bun:test'

import { AUTH_TEST_TOTP_TIME, buildAuthHeaders, installAuthIntegrationHooks } from '../../fixtures'
import { buildLoginTwoFactorRequest, issueAuthorizationChallenge } from './fixtures'

installAuthIntegrationHooks({ redis: true })

describe('POST /api/v1/auth/login/2fa', () => {
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
