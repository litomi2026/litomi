import { installBackendIntegrationHooks } from '@test/backend-integration/setup'
import { getSetCookieNames, requestBackend } from '@test/backend/app'
import { readSessionFamiliesForUser, readUserByLoginId, seedUser } from '@test/backend/db'
import { installExternalFetchGuard } from '@test/backend/network'
import { describe, expect, test } from 'bun:test'

import { turnstileFailureRoute, turnstileSignupSuccessRoute } from './fixtures'

installBackendIntegrationHooks({ redis: true })

describe('POST /api/v1/auth/signup', () => {
  test('성공하면 201 과 auth cookie 를 반환한다', async () => {
    const fetchGuard = installExternalFetchGuard([turnstileSignupSuccessRoute()])

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/signup',
        method: 'POST',
        headers: { 'CF-Connecting-IP': '203.0.113.210' },
        json: {
          loginId: 'signup_user_1',
          nickname: 'SignupTester',
          password: 'Password123',
          passwordConfirm: 'Password123',
          turnstileToken: 'turnstile-ok',
        },
      })

      expect(response.status).toBe(201)
      expect(getSetCookieNames(response)).toEqual(expect.arrayContaining(['at', 'ah']))
      expect(getSetCookieNames(response)).not.toContain('rt')

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

  test('이미 사용 중인 loginId 이면 409 와 invalidParams 를 반환한다', async () => {
    await seedUser({ loginId: 'duplicate_login_id', nickname: 'ExistingTester' })
    const fetchGuard = installExternalFetchGuard([turnstileSignupSuccessRoute()])

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/signup',
        method: 'POST',
        headers: { 'CF-Connecting-IP': '203.0.113.211' },
        json: {
          loginId: 'duplicate_login_id',
          nickname: 'AnotherTester',
          password: 'Password123',
          passwordConfirm: 'Password123',
          turnstileToken: 'turnstile-ok',
        },
      })

      expect(response.status).toBe(409)
      expect(await response.json()).toMatchObject({
        type: 'https://localhost/problems/login-id-conflict',
        status: 409,
        detail: '이미 사용 중인 아이디예요',
        invalidParams: [{ name: 'loginId', reason: '이미 사용 중인 아이디예요' }],
      })
    } finally {
      fetchGuard.restore()
    }
  })

  test('유효하지 않은 payload 는 400 을 반환한다', async () => {
    const response = await requestBackend({
      path: '/api/v1/auth/signup',
      method: 'POST',
      json: {
        loginId: 'signup_user_invalid',
        nickname: 'SignupTester',
        password: 'Password123',
        passwordConfirm: 'Password999',
        turnstileToken: 'turnstile-ok',
      },
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({
      status: 400,
      invalidParams: [{ name: 'passwordConfirm', reason: '비밀번호와 비밀번호 확인 값이 일치하지 않아요' }],
    })

    expect(await readUserByLoginId('signup_user_invalid')).toBeNull()
  })

  test('Turnstile 검증이 실패하면 400 을 반환한다', async () => {
    const fetchGuard = installExternalFetchGuard([turnstileFailureRoute()])

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/signup',
        method: 'POST',
        headers: { 'CF-Connecting-IP': '203.0.113.212' },
        json: {
          loginId: 'signup_user_failed',
          nickname: 'SignupTester',
          password: 'Password123',
          passwordConfirm: 'Password123',
          turnstileToken: 'turnstile-failed',
        },
      })

      expect(response.status).toBe(400)
      expect(await response.json()).toMatchObject({
        type: 'https://localhost/problems/human-verification-failed',
        status: 400,
        detail: '보안 확인에 실패했어요',
      })
    } finally {
      fetchGuard.restore()
    }
  })
})
