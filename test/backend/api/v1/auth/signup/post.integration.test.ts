import { getSetCookieNames, requestBackend } from '@test/backend/setup/app'
import { readSessionFamiliesForUser, readUserByLoginId, seedUser } from '@test/backend/setup/db'
import { expectInvalidParams, expectProblemResponse } from '@test/backend/setup/problem'
import { describe, expect, test } from 'bun:test'

import { buildAuthHeaders, installAuthIntegrationHooks } from '../fixtures'
import { buildSignupRequest, installSignupTurnstileGuard } from './fixtures'

installAuthIntegrationHooks()

describe('POST /api/v1/auth/signup', () => {
  test('성공하면 201 과 auth cookie 를 반환한다', async () => {
    const fetchGuard = installSignupTurnstileGuard()

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/signup',
        method: 'POST',
        headers: buildAuthHeaders({ ip: '203.0.113.51' }),
        json: buildSignupRequest({ loginId: 'signup_user_1' }),
      })

      expect(response.status).toBe(201)

      const cookieNames = getSetCookieNames(response)
      expect(cookieNames).toEqual(expect.arrayContaining(['at', 'ah']))
      expect(cookieNames).not.toContain('rt')

      const body = await response.json()

      expect(body).toMatchObject({
        loginId: 'signup_user_1',
        name: 'signup_user_1',
        nickname: 'SignupTester',
      })

      expect(typeof body.userId).toBe('number')

      const createdUser = await readUserByLoginId('signup_user_1')
      expect(createdUser?.id).toBe(body.userId)
      expect(createdUser?.nickname).toBe('SignupTester')
      expect(createdUser?.imageURL).toBeTruthy()

      const sessionFamilies = await readSessionFamiliesForUser(createdUser!.id)
      expect(sessionFamilies).toHaveLength(0)
    } finally {
      fetchGuard.restore()
    }
  })

  test('빈 nickname 이면 랜덤 닉네임을 생성해 회원가입한다', async () => {
    const fetchGuard = installSignupTurnstileGuard()

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/signup',
        method: 'POST',
        headers: buildAuthHeaders({ ip: '203.0.113.52' }),
        json: buildSignupRequest({
          loginId: 'signup_user_blank_nickname',
          nickname: '',
        }),
      })

      expect(response.status).toBe(201)

      const body = await response.json()
      expect(typeof body.userId).toBe('number')
      expect(body.loginId).toBe('signup_user_blank_nickname')
      expect(body.nickname).toBeTruthy()
      expect(body.nickname).not.toBe('')

      const createdUser = await readUserByLoginId('signup_user_blank_nickname')
      expect(createdUser?.nickname).toBe(body.nickname)
    } finally {
      fetchGuard.restore()
    }
  })

  test('이미 사용 중인 loginId 이면 409 와 invalidParams 를 반환한다', async () => {
    await seedUser({ loginId: 'duplicate_login_id', nickname: 'ExistingTester' })
    const fetchGuard = installSignupTurnstileGuard()

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/signup',
        method: 'POST',
        headers: buildAuthHeaders({ ip: '203.0.113.53' }),
        json: buildSignupRequest({
          loginId: 'duplicate_login_id',
          nickname: 'AnotherTester',
        }),
      })

      expect(response.status).toBe(409)
      expect(getSetCookieNames(response)).toEqual([])

      const problem = await expectProblemResponse(response, {
        status: 409,
        code: 'login-id-conflict',
        instance: '/api/v1/auth/signup',
      })
      expectInvalidParams(problem, [{ name: 'loginId' }])
    } finally {
      fetchGuard.restore()
    }
  })

  test('유효하지 않은 payload 는 400 을 반환한다', async () => {
    const response = await requestBackend({
      path: '/api/v1/auth/signup',
      method: 'POST',
      headers: buildAuthHeaders({ ip: '203.0.113.54' }),
      json: buildSignupRequest({
        loginId: 'signup_user_invalid',
        passwordConfirm: 'Password999',
      }),
    })

    expect(response.status).toBe(400)
    expect(getSetCookieNames(response)).toEqual([])

    const problem = await expectProblemResponse(response, {
      status: 400,
      code: 'invalid-input',
      instance: '/api/v1/auth/signup',
    })

    expectInvalidParams(problem, [{ name: 'passwordConfirm' }])
    expect(await readUserByLoginId('signup_user_invalid')).toBeNull()
  })

  test('loginId 와 password 가 같으면 400 invalid-input 을 반환한다', async () => {
    const response = await requestBackend({
      path: '/api/v1/auth/signup',
      method: 'POST',
      headers: buildAuthHeaders({ ip: '203.0.113.55' }),
      json: buildSignupRequest({
        loginId: 'SamePassword1',
        password: 'SamePassword1',
      }),
    })

    expect(response.status).toBe(400)
    expect(getSetCookieNames(response)).toEqual([])

    const problem = await expectProblemResponse(response, {
      status: 400,
      code: 'invalid-input',
      instance: '/api/v1/auth/signup',
    })

    expectInvalidParams(problem, [{ name: 'password' }])
    expect(await readUserByLoginId('SamePassword1')).toBeNull()
  })

  test('Turnstile 검증이 실패하면 400 을 반환한다', async () => {
    const fetchGuard = installSignupTurnstileGuard('failure')

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/signup',
        method: 'POST',
        headers: buildAuthHeaders({ ip: '203.0.113.56' }),
        json: buildSignupRequest({
          loginId: 'signup_user_failed',
          turnstileToken: 'turnstile-failed',
        }),
      })

      expect(response.status).toBe(400)
      expect(getSetCookieNames(response)).toEqual([])

      await expectProblemResponse(response, {
        status: 400,
        code: 'human-verification-failed',
        instance: '/api/v1/auth/signup',
      })
    } finally {
      fetchGuard.restore()
    }
  })

  test('동일 IP 의 반복된 회원가입 시도는 representative 429를 반환한다', async () => {
    const fetchGuard = installSignupTurnstileGuard()
    const rateLimitedIp = '203.0.113.59'

    try {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const response = await requestBackend({
          path: '/api/v1/auth/signup',
          method: 'POST',
          headers: buildAuthHeaders({ ip: rateLimitedIp }),
          json: buildSignupRequest({
            loginId: `signupratelimit${attempt}`,
            nickname: `SignupTester${attempt}`,
          }),
        })

        expect(response.status).toBe(201)
      }

      const blockedResponse = await requestBackend({
        path: '/api/v1/auth/signup',
        method: 'POST',
        headers: buildAuthHeaders({ ip: rateLimitedIp }),
        json: buildSignupRequest({
          loginId: 'signupratelimitblocked',
          nickname: 'SignupTesterBlocked',
        }),
      })

      expect(blockedResponse.status).toBe(429)
      expect(getSetCookieNames(blockedResponse)).toEqual([])
      expect(blockedResponse.headers.get('Retry-After')).not.toBeNull()

      await expectProblemResponse(blockedResponse, {
        status: 429,
        code: 'too-many-requests',
        instance: '/api/v1/auth/signup',
      })
    } finally {
      fetchGuard.restore()
    }
  })
})
