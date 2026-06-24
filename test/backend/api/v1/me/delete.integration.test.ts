import { describe, expect, test } from 'bun:test'
import { installBackendIntegrationHooks } from '@test/backend/setup'
import { requestBackend } from '@test/backend/setup/app'
import { createAccessTokenCookies, expectAuthCookiesCleared } from '@test/backend/setup/auth'
import {
  readSessionFamiliesForUser,
  readUserById,
  readUserSettingsByUserId,
  seedTwoFactor,
  seedUserSettings,
  TEST_TOTP_SECRET,
} from '@test/backend/setup/db'
import { expectInvalidParams, expectProblemResponse } from '@test/backend/setup/problem'
import { generateSync } from 'otplib'

import { createMeAuthContext, createMeSessionAuthContext } from './fixtures'

installBackendIntegrationHooks({ redis: true })

describe('DELETE /api/v1/me', () => {
  test('인증 정보가 없으면 401을 반환한다', async () => {
    const response = await requestBackend({
      path: '/api/v1/me',
      method: 'DELETE',
      json: { password: 'Password123' },
    })

    await expectProblemResponse(response, {
      status: 401,
      code: 'authentication-required',
      detail: '로그인 정보가 없거나 만료됐어요',
      instance: '/api/v1/me',
    })
  })

  test('잘못된 body면 400과 invalidParams를 반환한다', async () => {
    const { auth, user } = await createMeAuthContext({ id: 3102 })

    const response = await requestBackend({
      path: '/api/v1/me',
      method: 'DELETE',
      cookies: auth.cookieHeader,
      json: { password: 'short' },
    })

    const problem = await expectProblemResponse(response, {
      status: 400,
      code: 'invalid-input',
      detail: '입력을 확인해 주세요',
      instance: '/api/v1/me',
    })

    expectInvalidParams(problem, [{ name: 'password' }])
    expect(await readUserById(user.id)).toBeTruthy()
  })

  test('비밀번호가 일치하지 않으면 400을 반환하고 계정을 유지한다', async () => {
    const { auth, user } = await createMeAuthContext({ id: 3103 })

    const response = await requestBackend({
      path: '/api/v1/me',
      method: 'DELETE',
      cookies: auth.cookieHeader,
      json: { password: 'WrongPass123' },
    })

    await expectProblemResponse(response, {
      status: 400,
      code: 'bad-request',
      title: '잘못된 요청이에요',
      instance: '/api/v1/me',
    })

    expect(await readUserById(user.id)).toBeTruthy()
  })

  test('2단계 인증이 켜져 있으면 코드 누락 시 400을 반환하고 계정을 유지한다', async () => {
    const { auth, user } = await createMeAuthContext({ id: 3104 })
    await seedTwoFactor({ userId: user.id })

    const response = await requestBackend({
      path: '/api/v1/me',
      method: 'DELETE',
      cookies: auth.cookieHeader,
      json: { password: 'Password123' },
    })

    await expectProblemResponse(response, {
      status: 400,
      code: 'bad-request',
      title: '잘못된 요청이에요',
      instance: '/api/v1/me',
    })

    expect(await readUserById(user.id)).toBeTruthy()
  })

  test('2단계 인증 코드가 잘못되면 400을 반환하고 계정을 유지한다', async () => {
    const { auth, user } = await createMeAuthContext({ id: 3105 })
    await seedTwoFactor({ userId: user.id })

    const response = await requestBackend({
      path: '/api/v1/me',
      method: 'DELETE',
      cookies: auth.cookieHeader,
      json: { password: 'Password123', token: '000000' },
    })

    await expectProblemResponse(response, {
      status: 400,
      code: 'bad-request',
      title: '잘못된 요청이에요',
      instance: '/api/v1/me',
    })

    expect(await readUserById(user.id)).toBeTruthy()
  })

  test('계정 삭제에 성공하면 사용자와 연관 데이터를 지우고 인증 쿠키를 비운다', async () => {
    const { cookieHeader, user } = await createMeSessionAuthContext({ id: 3106 })
    await seedUserSettings({ userId: user.id, historySyncEnabled: false })

    const response = await requestBackend({
      path: '/api/v1/me',
      method: 'DELETE',
      cookies: cookieHeader,
      json: { password: 'Password123' },
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      loginId: user.loginId,
      message: `${user.loginId} 계정을 삭제했어요`,
    })
    expectAuthCookiesCleared(response)
    expect(await readUserById(user.id)).toBeNull()
    expect(await readUserSettingsByUserId(user.id)).toBeNull()
    expect(await readSessionFamiliesForUser(user.id)).toHaveLength(0)
  })

  test('2단계 인증이 켜져 있어도 올바른 코드면 삭제할 수 있다', async () => {
    const { cookieHeader, user } = await createMeSessionAuthContext({ id: 3107 })
    await seedTwoFactor({ userId: user.id })

    const response = await requestBackend({
      path: '/api/v1/me',
      method: 'DELETE',
      cookies: cookieHeader,
      json: { password: 'Password123', token: generateSync({ secret: TEST_TOTP_SECRET, strategy: 'totp' }) },
    })

    expect(response.status).toBe(200)
    expectAuthCookiesCleared(response)
    expect(await readUserById(user.id)).toBeNull()
  })

  test('stale auth면 401을 반환하고 인증 쿠키를 비운다', async () => {
    const auth = await createAccessTokenCookies({ userId: 3999 })

    const response = await requestBackend({
      path: '/api/v1/me',
      method: 'DELETE',
      cookies: auth.cookieHeader,
      json: { password: 'Password123' },
    })

    await expectProblemResponse(response, {
      status: 401,
      code: 'authentication-required',
      detail: '로그인 정보가 없거나 만료됐어요',
      instance: '/api/v1/me',
    })
    expectAuthCookiesCleared(response)
  })

  test('계정 삭제 시도가 너무 많으면 429와 Retry-After를 반환한다', async () => {
    const { auth, user } = await createMeAuthContext({ id: 3108 })

    for (let attempt = 0; attempt < 10; attempt++) {
      const response = await requestBackend({
        path: '/api/v1/me',
        method: 'DELETE',
        cookies: auth.cookieHeader,
        json: { password: 'WrongPass123' },
      })

      expect(response.status).toBe(400)
    }

    const response = await requestBackend({
      path: '/api/v1/me',
      method: 'DELETE',
      cookies: auth.cookieHeader,
      json: { password: 'WrongPass123' },
    })

    await expectProblemResponse(response, {
      status: 429,
      code: 'too-many-requests',
      detail: '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.',
      instance: '/api/v1/me',
    })
    expect(response.headers.get('Retry-After')).toBeTruthy()
    expect(await readUserById(user.id)).toBeTruthy()
  })
})
