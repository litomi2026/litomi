import { getInvalidParams } from '@litomi/http/problem-details'
import { installBackendIntegrationHooks } from '@test/backend/setup'
import { getSetCookieStrings, requestBackend } from '@test/backend/setup/app'
import {
  createAccessTokenCookies,
  createRefreshSessionCookies,
  expectAuthCookiesCleared,
  TEST_LOGIN_PASSWORD,
} from '@test/backend/setup/auth'
import {
  readSessionFamiliesForUser,
  readUserById,
  seedTwoFactor,
  seedUser,
  TEST_TOTP_SECRET,
} from '@test/backend/setup/db'
import { expectInvalidParams, expectProblemResponse } from '@test/backend/setup/problem'
import { compare } from 'bcryptjs'
import { describe, expect, test } from 'bun:test'
import { generateSync } from 'otplib'

import { createMeSessionAuthContext } from '../fixtures'

installBackendIntegrationHooks()

const PASSWORD_PATH = '/api/v1/me/password'
const NEXT_PASSWORD = 'NewPassword123'
const VERIFICATION_FAILED_DETAIL = '현재 인증 정보를 확인해 주세요'

function expectAuthCookiesNotCleared(response: Response) {
  const clearedCookies = getSetCookieStrings(response).filter((cookie) => cookie.includes('Max-Age=0'))

  for (const name of ['at', 'rt', 'ah']) {
    expect(clearedCookies.some((cookie) => cookie.startsWith(`${name}=`))).toBe(false)
  }
}

async function expectCredentialStatePreserved(input: {
  expectedLoginAt: Date
  expectedPasswordHash: string
  sessionFamilyId: string
  userId: number
}) {
  const user = await readUserById(input.userId)

  expect(user?.passwordHash).toBe(input.expectedPasswordHash)
  expect(user?.loginAt?.toISOString()).toBe(input.expectedLoginAt.toISOString())

  const sessionFamilies = await readSessionFamiliesForUser(input.userId)
  expect(sessionFamilies.find((family) => family.id === input.sessionFamilyId)?.revokedAt).toBeNull()
}

function patchMyPassword(input: { cookies?: string; json: unknown }) {
  return requestBackend({
    path: PASSWORD_PATH,
    method: 'PATCH',
    cookies: input.cookies,
    json: input.json,
  })
}

describe('PATCH /api/v1/me/password', () => {
  test('인증 정보가 없으면 401을 반환한다', async () => {
    const response = await patchMyPassword({
      json: {
        currentPassword: TEST_LOGIN_PASSWORD,
        newPassword: NEXT_PASSWORD,
      },
    })

    await expectProblemResponse(response, {
      status: 401,
      code: 'unauthorized',
      detail: '로그인 정보가 없거나 만료됐어요',
      instance: PASSWORD_PATH,
    })
  })

  test('잘못된 body면 400 invalid-input을 반환하고 상태를 유지한다', async () => {
    const previousLoginAt = new Date('2024-01-01T00:00:00.000Z')
    const { cookieHeader, session, user } = await createMeSessionAuthContext({
      id: 3120,
      loginAt: previousLoginAt,
    })

    const response = await patchMyPassword({
      cookies: cookieHeader,
      json: { currentPassword: '', newPassword: 'short' },
    })

    const problem = await expectProblemResponse(response, {
      status: 400,
      code: 'invalid-input',
      detail: '입력을 확인해 주세요',
      instance: PASSWORD_PATH,
    })

    expectInvalidParams(problem, [{ name: 'currentPassword' }, { name: 'newPassword' }])
    expectAuthCookiesNotCleared(response)
    await expectCredentialStatePreserved({
      userId: user.id,
      expectedPasswordHash: user.passwordHash,
      expectedLoginAt: previousLoginAt,
      sessionFamilyId: session.familyId,
    })
  })

  test('현재 비밀번호와 새 비밀번호가 같으면 400 invalidParams를 반환하고 상태를 유지한다', async () => {
    const previousLoginAt = new Date('2024-01-02T00:00:00.000Z')
    const { cookieHeader, session, user } = await createMeSessionAuthContext({
      id: 3121,
      loginAt: previousLoginAt,
    })

    const response = await patchMyPassword({
      cookies: cookieHeader,
      json: { currentPassword: TEST_LOGIN_PASSWORD, newPassword: TEST_LOGIN_PASSWORD },
    })

    const problem = await expectProblemResponse(response, {
      status: 400,
      code: 'bad-request',
      instance: PASSWORD_PATH,
    })

    expectInvalidParams(problem, [{ name: 'newPassword', reason: '현재 비밀번호와 새 비밀번호가 같아요' }])
    expectAuthCookiesNotCleared(response)
    await expectCredentialStatePreserved({
      userId: user.id,
      expectedPasswordHash: user.passwordHash,
      expectedLoginAt: previousLoginAt,
      sessionFamilyId: session.familyId,
    })
  })

  for (const [index, failureCase] of [
    {
      name: '현재 비밀번호가 일치하지 않으면 400 일반 오류를 반환하고 상태를 유지한다',
      json: { currentPassword: 'WrongPass123', newPassword: NEXT_PASSWORD },
    },
    {
      name: '2단계 인증이 켜져 있으면 코드 누락 시 400 일반 오류를 반환하고 상태를 유지한다',
      setup: seedTwoFactor,
      json: { currentPassword: TEST_LOGIN_PASSWORD, newPassword: NEXT_PASSWORD },
    },
    {
      name: '2단계 인증 코드가 잘못되면 400 일반 오류를 반환하고 상태를 유지한다',
      setup: seedTwoFactor,
      json: { currentPassword: TEST_LOGIN_PASSWORD, newPassword: NEXT_PASSWORD, token: '000000' },
    },
  ].entries()) {
    test(failureCase.name, async () => {
      const previousLoginAt = new Date(`2024-01-0${index + 3}T00:00:00.000Z`)
      const { cookieHeader, session, user } = await createMeSessionAuthContext({
        id: 3122 + index,
        loginAt: previousLoginAt,
      })

      await failureCase.setup?.({ userId: user.id })

      const response = await patchMyPassword({
        cookies: cookieHeader,
        json: failureCase.json,
      })

      const problem = await expectProblemResponse(response, {
        status: 400,
        code: 'bad-request',
        detail: VERIFICATION_FAILED_DETAIL,
        instance: PASSWORD_PATH,
      })

      expect(getInvalidParams(problem)).toEqual([])
      expectAuthCookiesNotCleared(response)
      await expectCredentialStatePreserved({
        userId: user.id,
        expectedPasswordHash: user.passwordHash,
        expectedLoginAt: previousLoginAt,
        sessionFamilyId: session.familyId,
      })
    })
  }

  test('비밀번호 변경에 성공하면 해시를 갱신하고 loginAt을 갱신하며 모든 세션을 무효화한다', async () => {
    const previousLoginAt = new Date('2024-01-10T00:00:00.000Z')
    const { cookieHeader, session, user } = await createMeSessionAuthContext({
      id: 3125,
      loginAt: previousLoginAt,
    })

    const otherSession = await createRefreshSessionCookies({ userId: user.id, deviceLabel: 'Tablet Session' })
    const otherUser = await seedUser()
    await createRefreshSessionCookies({ userId: otherUser.id, deviceLabel: 'Other User Session' })

    const response = await patchMyPassword({
      cookies: cookieHeader,
      json: { currentPassword: TEST_LOGIN_PASSWORD, newPassword: NEXT_PASSWORD },
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      clearedCurrentSession: true,
      message: '비밀번호가 변경됐어요',
    })
    expectAuthCookiesCleared(response)

    const updatedUser = await readUserById(user.id)
    const updatedLoginAt = updatedUser?.loginAt

    expect(updatedLoginAt).toBeInstanceOf(Date)
    expect((updatedLoginAt ?? new Date(0)).getTime()).toBeGreaterThan(previousLoginAt.getTime())
    expect(await compare(NEXT_PASSWORD, updatedUser?.passwordHash ?? '')).toBe(true)
    expect(await compare(TEST_LOGIN_PASSWORD, updatedUser?.passwordHash ?? '')).toBe(false)

    const sessionFamilies = await readSessionFamiliesForUser(user.id)
    expect(sessionFamilies).toHaveLength(2)
    expect(sessionFamilies.find((family) => family.id === session.familyId)?.revokedAt).toBeInstanceOf(Date)
    expect(sessionFamilies.find((family) => family.id === otherSession.familyId)?.revokedAt).toBeInstanceOf(Date)

    const otherUserFamilies = await readSessionFamiliesForUser(otherUser.id)
    expect(otherUserFamilies).toHaveLength(1)
    expect(otherUserFamilies[0]?.revokedAt).toBeNull()
  })

  test('2단계 인증이 켜져 있어도 올바른 코드면 비밀번호를 바꾸고 현재 세션을 무효화한다', async () => {
    const { cookieHeader, session, user } = await createMeSessionAuthContext({ id: 3126 })
    await seedTwoFactor({ userId: user.id })

    const response = await patchMyPassword({
      cookies: cookieHeader,
      json: {
        currentPassword: TEST_LOGIN_PASSWORD,
        newPassword: NEXT_PASSWORD,
        token: generateSync({ secret: TEST_TOTP_SECRET, strategy: 'totp' }),
      },
    })

    expect(response.status).toBe(200)
    expectAuthCookiesCleared(response)
    expect(await compare(NEXT_PASSWORD, (await readUserById(user.id))?.passwordHash ?? '')).toBe(true)

    const sessionFamilies = await readSessionFamiliesForUser(user.id)
    expect(sessionFamilies.find((family) => family.id === session.familyId)?.revokedAt).toBeInstanceOf(Date)
  })

  test('stale auth면 401을 반환하고 인증 쿠키를 비운다', async () => {
    const auth = await createAccessTokenCookies({ userId: 3999 })

    const response = await patchMyPassword({
      cookies: auth.cookieHeader,
      json: { currentPassword: TEST_LOGIN_PASSWORD, newPassword: NEXT_PASSWORD },
    })

    await expectProblemResponse(response, {
      status: 401,
      code: 'unauthorized',
      detail: '로그인 정보가 없거나 만료됐어요',
      instance: PASSWORD_PATH,
    })
    expectAuthCookiesCleared(response)
  })

  test('반복 실패 후에는 429와 Retry-After를 반환하고 상태를 유지한다', async () => {
    const previousLoginAt = new Date('2024-01-11T00:00:00.000Z')
    const { cookieHeader, session, user } = await createMeSessionAuthContext({
      id: 3127,
      loginAt: previousLoginAt,
    })

    for (let attempt = 0; attempt < 10; attempt++) {
      const response = await patchMyPassword({
        cookies: cookieHeader,
        json: { currentPassword: 'WrongPass123', newPassword: NEXT_PASSWORD },
      })

      await expectProblemResponse(response, {
        status: 400,
        code: 'bad-request',
        detail: VERIFICATION_FAILED_DETAIL,
        instance: PASSWORD_PATH,
      })
    }

    const response = await patchMyPassword({
      cookies: cookieHeader,
      json: { currentPassword: 'WrongPass123', newPassword: NEXT_PASSWORD },
    })

    const problem = await expectProblemResponse(response, {
      status: 429,
      code: 'too-many-requests',
      instance: PASSWORD_PATH,
    })

    expect(problem.detail).toContain('너무 많은 비밀번호 변경 시도가 있었어요.')
    expect(Number.parseInt(response.headers.get('Retry-After') ?? '0', 10)).toBeGreaterThan(0)
    expectAuthCookiesNotCleared(response)
    await expectCredentialStatePreserved({
      userId: user.id,
      expectedPasswordHash: user.passwordHash,
      expectedLoginAt: previousLoginAt,
      sessionFamilyId: session.familyId,
    })
  })
})
