import { describe, expect, test } from 'bun:test'
import { installBackendIntegrationHooks } from '@test/backend/setup'
import { getSetCookieNames, requestBackend } from '@test/backend/setup/app'
import { createRefreshSessionCookies } from '@test/backend/setup/auth'
import { readSessionFamiliesForUser, seedUser } from '@test/backend/setup/db'

import { createMeAuthContext, createMeSessionAuthContext } from '../../fixtures'

installBackendIntegrationHooks()

describe('DELETE /api/v1/me/session/others', () => {
  test('현재 refresh session이 있으면 다른 기기만 로그아웃한다', async () => {
    const { cookieHeader, session, user } = await createMeSessionAuthContext()
    const otherSession = await createRefreshSessionCookies({ userId: user.id, deviceLabel: 'Tablet Session' })
    const thirdSession = await createRefreshSessionCookies({ userId: user.id, deviceLabel: 'Phone Session' })
    const otherUser = await seedUser()
    await createRefreshSessionCookies({ userId: otherUser.id, deviceLabel: 'Other User Session' })

    const response = await requestBackend({
      path: '/api/v1/me/session/others',
      method: 'DELETE',
      cookies: cookieHeader,
    })

    expect(response.status).toBe(200)
    expect(getSetCookieNames(response)).toEqual([])
    expect(await response.json()).toEqual({
      clearedCurrentSession: false,
      message: '다른 기기에서 모두 로그아웃했어요',
    })

    const sessionFamilies = await readSessionFamiliesForUser(user.id)
    expect(sessionFamilies).toHaveLength(3)
    expect(sessionFamilies.find((family) => family.id === session.familyId)?.revokedAt).toBeNull()
    expect(sessionFamilies.find((family) => family.id === otherSession.familyId)?.revokedAt).toBeInstanceOf(Date)
    expect(sessionFamilies.find((family) => family.id === thirdSession.familyId)?.revokedAt).toBeInstanceOf(Date)

    const otherUserFamilies = await readSessionFamiliesForUser(otherUser.id)
    expect(otherUserFamilies).toHaveLength(1)
    expect(otherUserFamilies[0]?.revokedAt).toBeNull()
  })

  test('refresh token이 없으면 현재 기기를 제외하지 않고 모두 로그아웃한다', async () => {
    const { auth, user } = await createMeAuthContext()
    const firstSession = await createRefreshSessionCookies({ userId: user.id, deviceLabel: 'Laptop Session' })
    const secondSession = await createRefreshSessionCookies({ userId: user.id, deviceLabel: 'Phone Session' })

    const response = await requestBackend({
      path: '/api/v1/me/session/others',
      method: 'DELETE',
      cookies: auth.cookieHeader,
    })

    expect(response.status).toBe(200)
    expect(getSetCookieNames(response)).toEqual([])
    expect(await response.json()).toEqual({
      clearedCurrentSession: false,
      message: '표시된 기기에서 모두 로그아웃했어요',
    })

    const sessionFamilies = await readSessionFamiliesForUser(user.id)
    expect(sessionFamilies).toHaveLength(2)
    expect(sessionFamilies.find((family) => family.id === firstSession.familyId)?.revokedAt).toBeInstanceOf(Date)
    expect(sessionFamilies.find((family) => family.id === secondSession.familyId)?.revokedAt).toBeInstanceOf(Date)
  })
})
