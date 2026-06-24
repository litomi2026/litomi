import { describe, expect, test } from 'bun:test'
import { installBackendIntegrationHooks } from '@test/backend/setup'
import { requestBackend } from '@test/backend/setup/app'
import { createRefreshSessionCookies, expectAuthCookiesCleared } from '@test/backend/setup/auth'
import { readSessionFamiliesForUser, seedUser } from '@test/backend/setup/db'

import { createMeAuthContext, createMeSessionAuthContext } from '../../fixtures'

installBackendIntegrationHooks()

describe('DELETE /api/v1/me/session/all', () => {
  test('현재 세션을 포함한 모든 활성 세션을 무효화하고 인증 쿠키를 비운다', async () => {
    const { cookieHeader, session, user } = await createMeSessionAuthContext()
    const otherSession = await createRefreshSessionCookies({ userId: user.id, deviceLabel: 'Tablet Session' })
    const otherUser = await seedUser()
    await createRefreshSessionCookies({ userId: otherUser.id, deviceLabel: 'Other User Session' })

    const response = await requestBackend({
      path: '/api/v1/me/session/all',
      method: 'DELETE',
      cookies: cookieHeader,
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      clearedCurrentSession: true,
      message: '모든 기기에서 로그아웃했어요',
    })
    expectAuthCookiesCleared(response)

    const sessionFamilies = await readSessionFamiliesForUser(user.id)
    expect(sessionFamilies).toHaveLength(2)
    expect(sessionFamilies.find((family) => family.id === session.familyId)?.revokedAt).toBeInstanceOf(Date)
    expect(sessionFamilies.find((family) => family.id === otherSession.familyId)?.revokedAt).toBeInstanceOf(Date)

    const otherUserFamilies = await readSessionFamiliesForUser(otherUser.id)
    expect(otherUserFamilies).toHaveLength(1)
    expect(otherUserFamilies[0]?.revokedAt).toBeNull()
  })

  test('refresh token이 없어도 현재 사용자의 모든 활성 세션을 무효화하고 인증 쿠키를 비운다', async () => {
    const { auth, user } = await createMeAuthContext()
    const firstSession = await createRefreshSessionCookies({ userId: user.id, deviceLabel: 'Laptop Session' })
    const secondSession = await createRefreshSessionCookies({ userId: user.id, deviceLabel: 'Tablet Session' })
    const otherUser = await seedUser()
    await createRefreshSessionCookies({ userId: otherUser.id, deviceLabel: 'Other User Session' })

    const response = await requestBackend({
      path: '/api/v1/me/session/all',
      method: 'DELETE',
      cookies: auth.cookieHeader,
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      clearedCurrentSession: true,
      message: '모든 기기에서 로그아웃했어요',
    })
    expectAuthCookiesCleared(response)

    const sessionFamilies = await readSessionFamiliesForUser(user.id)
    expect(sessionFamilies).toHaveLength(2)
    expect(sessionFamilies.find((family) => family.id === firstSession.familyId)?.revokedAt).toBeInstanceOf(Date)
    expect(sessionFamilies.find((family) => family.id === secondSession.familyId)?.revokedAt).toBeInstanceOf(Date)

    const otherUserFamilies = await readSessionFamiliesForUser(otherUser.id)
    expect(otherUserFamilies).toHaveLength(1)
    expect(otherUserFamilies[0]?.revokedAt).toBeNull()
  })
})
