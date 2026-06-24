import { describe, expect, test } from 'bun:test'
import { getSetCookieNames, requestBackend } from '@test/backend/setup/app'
import { readSessionFamiliesForUser, readUserById, seedUser } from '@test/backend/setup/db'
import { expectInvalidParams, expectProblemResponse } from '@test/backend/setup/problem'

import { buildAuthHeaders, installAuthIntegrationHooks } from '../fixtures'
import { buildLoginRequest, installLoginTurnstileGuard } from './fixtures'

installAuthIntegrationHooks({ redis: true })

describe('POST /api/v1/auth/login', () => {
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
        code: 'invalid-credentials',
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

  test('존재하지 않는 로그인 ID도 동일한 401 응답을 반환한다', async () => {
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
        code: 'invalid-credentials',
        detail: '아이디 또는 비밀번호가 일치하지 않아요',
        instance: '/api/v1/auth/login',
      })
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

  test('유효하지 않은 요청 본문이면 400 invalid-input을 반환한다', async () => {
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

  test('로그인에 반복해서 실패하면 대표 429 응답을 반환한다', async () => {
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

  test('같은 로그인 ID로 IP를 바꿔가며 반복 실패해도 로그인 ID 기준으로 429를 반환한다', async () => {
    const user = await seedUser()
    const fetchGuard = installLoginTurnstileGuard()

    try {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const response = await requestBackend({
          path: '/api/v1/auth/login',
          method: 'POST',
          headers: buildAuthHeaders({ ip: `203.0.114.${attempt + 1}` }),
          json: buildLoginRequest({
            loginId: user.loginId,
            password: 'WrongPassword123',
            fingerprint: `fp-auth-login-login-id-rate-limit-${attempt}`,
          }).payload,
        })

        expect(response.status).toBe(401)
      }

      const blockedResponse = await requestBackend({
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: buildAuthHeaders({ ip: '203.0.114.250' }),
        json: buildLoginRequest({
          loginId: user.loginId,
          password: 'WrongPassword123',
          fingerprint: 'fp-auth-login-login-id-rate-limit-blocked',
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
