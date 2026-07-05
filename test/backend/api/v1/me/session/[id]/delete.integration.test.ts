import { describe, expect, test } from 'bun:test'
import { installBackendIntegrationHooks } from '@test/backend/setup'
import { getSetCookieNames, requestBackend } from '@test/backend/setup/app'
import { createRefreshSessionCookies } from '@test/backend/setup/auth'
import { readSessionFamiliesForUser, seedUser } from '@test/backend/setup/db'
import { expectInvalidParams, expectProblemResponse } from '@test/backend/setup/problem'

import { createMeAuthContext, createMeSessionAuthContext } from '../../fixtures'

installBackendIntegrationHooks()

describe('DELETE /api/v1/me/session/:id', () => {
  test('유효하지 않은 id면 400 invalid-input을 반환한다', async () => {
    const { auth } = await createMeAuthContext()

    const response = await requestBackend({
      path: '/api/v1/me/session/not-a-uuid',
      method: 'DELETE',
      cookies: auth.cookieHeader,
    })

    const problem = await expectProblemResponse(response, {
      status: 400,
      code: 'invalid-input',
      title: '입력을 확인해 주세요',
      instance: '/api/v1/me/session/not-a-uuid',
    })

    expectInvalidParams(problem, [{ name: 'id' }])
  })

  test('현재 사용 중인 세션은 여기서 로그아웃할 수 없다', async () => {
    const { cookieHeader, session, user } = await createMeSessionAuthContext()
    const otherSession = await createRefreshSessionCookies({ userId: user.id, deviceLabel: 'Tablet Session' })

    const response = await requestBackend({
      path: `/api/v1/me/session/${session.familyId}`,
      method: 'DELETE',
      cookies: cookieHeader,
    })

    expect(getSetCookieNames(response)).toEqual([])

    await expectProblemResponse(response, {
      status: 400,
      code: 'current-session-not-removable',
      title: '지금 사용 중인 기기는 여기서 로그아웃할 수 없어요',
      instance: `/api/v1/me/session/${session.familyId}`,
    })

    const sessionFamilies = await readSessionFamiliesForUser(user.id)
    expect(sessionFamilies.find((family) => family.id === session.familyId)?.revokedAt).toBeNull()
    expect(sessionFamilies.find((family) => family.id === otherSession.familyId)?.revokedAt).toBeNull()
  })

  test('존재하지 않는 세션이면 404를 반환한다', async () => {
    const { cookieHeader, session, user } = await createMeSessionAuthContext()
    const missingFamilyId = '11111111-1111-4111-8111-111111111111'

    const response = await requestBackend({
      path: `/api/v1/me/session/${missingFamilyId}`,
      method: 'DELETE',
      cookies: cookieHeader,
    })

    expect(getSetCookieNames(response)).toEqual([])

    await expectProblemResponse(response, {
      status: 404,
      code: 'not-found',
      detail: '기기 정보를 찾을 수 없어요',
      instance: `/api/v1/me/session/${missingFamilyId}`,
    })

    const sessionFamilies = await readSessionFamiliesForUser(user.id)
    expect(sessionFamilies.find((family) => family.id === session.familyId)?.revokedAt).toBeNull()
  })

  test('refresh token이 없어도 선택한 기기 세션은 로그아웃할 수 있다', async () => {
    const { auth, user } = await createMeAuthContext()
    const firstSession = await createRefreshSessionCookies({ userId: user.id, deviceLabel: 'Laptop Session' })
    const secondSession = await createRefreshSessionCookies({ userId: user.id, deviceLabel: 'Tablet Session' })
    const otherUser = await seedUser()
    await createRefreshSessionCookies({ userId: otherUser.id, deviceLabel: 'Other User Session' })

    const response = await requestBackend({
      path: `/api/v1/me/session/${secondSession.familyId}`,
      method: 'DELETE',
      cookies: auth.cookieHeader,
    })

    expect(response.status).toBe(200)
    expect(getSetCookieNames(response)).toEqual([])
    expect(await response.json()).toEqual({
      clearedCurrentSession: false,
    })

    const sessionFamilies = await readSessionFamiliesForUser(user.id)
    expect(sessionFamilies.find((family) => family.id === firstSession.familyId)?.revokedAt).toBeNull()
    expect(sessionFamilies.find((family) => family.id === secondSession.familyId)?.revokedAt).toBeInstanceOf(Date)

    const otherUserFamilies = await readSessionFamiliesForUser(otherUser.id)
    expect(otherUserFamilies).toHaveLength(1)
    expect(otherUserFamilies[0]?.revokedAt).toBeNull()
  })

  test('다른 기기 세션만 무효화하고 현재 세션은 유지한다', async () => {
    const { cookieHeader, session, user } = await createMeSessionAuthContext()
    const otherSession = await createRefreshSessionCookies({ userId: user.id, deviceLabel: 'Tablet Session' })
    const otherUser = await seedUser()
    await createRefreshSessionCookies({ userId: otherUser.id, deviceLabel: 'Other User Session' })

    const response = await requestBackend({
      path: `/api/v1/me/session/${otherSession.familyId}`,
      method: 'DELETE',
      cookies: cookieHeader,
    })

    expect(response.status).toBe(200)
    expect(getSetCookieNames(response)).toEqual([])
    expect(await response.json()).toEqual({
      clearedCurrentSession: false,
    })

    const sessionFamilies = await readSessionFamiliesForUser(user.id)
    expect(sessionFamilies.find((family) => family.id === session.familyId)?.revokedAt).toBeNull()
    expect(sessionFamilies.find((family) => family.id === otherSession.familyId)?.revokedAt).toBeInstanceOf(Date)

    const otherUserFamilies = await readSessionFamiliesForUser(otherUser.id)
    expect(otherUserFamilies).toHaveLength(1)
    expect(otherUserFamilies[0]?.revokedAt).toBeNull()
  })
})
