import { getSetCookieNames, requestBackend } from '@test/backend/setup/app'
import { TEST_LOGIN_PASSWORD } from '@test/backend/setup/auth'
import { readSessionFamiliesForUser, readUserByLoginId, seedUser } from '@test/backend/setup/db'
import { expectInvalidParams, expectProblemResponse } from '@test/backend/setup/problem'
import { describe, expect, test } from 'bun:test'

import { buildAuthHeaders, installAuthIntegrationHooks } from '../fixtures'
import { buildSignupRequest, installSignupTurnstileGuard } from './fixtures'

installAuthIntegrationHooks({ redis: true })

describe('POST /api/v1/auth/signup', () => {
  test('성공하면 201과 인증 쿠키를 반환한다', async () => {
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

  test('nickname이 비어 있으면 랜덤 닉네임을 생성해 회원가입한다', async () => {
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

  test('nickname을 생략해도 랜덤 닉네임을 생성해 회원가입한다', async () => {
    const fetchGuard = installSignupTurnstileGuard()

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/signup',
        method: 'POST',
        headers: buildAuthHeaders({ ip: '203.0.113.58' }),
        json: {
          loginId: 'signup_user_missing_nickname',
          password: TEST_LOGIN_PASSWORD,
          passwordConfirm: TEST_LOGIN_PASSWORD,
          turnstileToken: 'turnstile-ok',
        },
      })

      expect(response.status).toBe(201)

      const body = await response.json()
      expect(typeof body.userId).toBe('number')
      expect(body.loginId).toBe('signup_user_missing_nickname')
      expect(body.nickname).toBeTruthy()
      expect(body.nickname).not.toBe('')

      const createdUser = await readUserByLoginId('signup_user_missing_nickname')
      expect(createdUser?.nickname).toBe(body.nickname)
    } finally {
      fetchGuard.restore()
    }
  })

  test('이미 사용 중인 로그인 ID면 409와 invalidParams를 반환한다', async () => {
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

  test('유효하지 않은 요청 본문이면 400을 반환한다', async () => {
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

  test('loginId와 password가 같으면 400 invalid-input을 반환한다', async () => {
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

  test('Turnstile 검증이 실패하면 400을 반환한다', async () => {
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

      expect(await readUserByLoginId('signup_user_failed')).toBeNull()
    } finally {
      fetchGuard.restore()
    }
  })

  test('Turnstile 검증 중 외부 오류가 나면 400을 반환하고 사용자를 만들지 않는다', async () => {
    const fetchGuard = installSignupTurnstileGuard('error')

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/signup',
        method: 'POST',
        headers: buildAuthHeaders({ ip: '203.0.113.57' }),
        json: buildSignupRequest({
          loginId: 'signup_user_turnstile_error',
          turnstileToken: 'turnstile-error',
        }),
      })

      expect(response.status).toBe(400)
      expect(getSetCookieNames(response)).toEqual([])

      await expectProblemResponse(response, {
        status: 400,
        code: 'human-verification-failed',
        instance: '/api/v1/auth/signup',
      })

      expect(await readUserByLoginId('signup_user_turnstile_error')).toBeNull()
    } finally {
      fetchGuard.restore()
    }
  })

  test('같은 IP에서 회원가입을 반복 시도하면 대표 429 응답을 반환한다', async () => {
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

      expect(await readUserByLoginId('signupratelimitblocked')).toBeNull()
    } finally {
      fetchGuard.restore()
    }
  })
})
