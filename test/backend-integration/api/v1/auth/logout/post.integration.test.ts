import { installBackendIntegrationHooks } from '@test/backend-integration/setup'
import { requestBackend } from '@test/backend/app'
import { createAccessTokenCookies, createRefreshSessionCookies, expectAuthCookiesCleared } from '@test/backend/auth'
import { readSessionFamiliesForUser, readUserById, seedUser } from '@test/backend/db'
import { describe, expect, test } from 'bun:test'

installBackendIntegrationHooks({ redis: true })

describe('POST /api/v1/auth/logout', () => {
  test('비로그인 상태에서도 loginId: null 과 auth cookie clear 를 반환한다', async () => {
    const response = await requestBackend({
      path: '/api/v1/auth/logout',
      method: 'POST',
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ loginId: null })
    expectAuthCookiesCleared(response)
  })

  test('access token 이 있으면 logoutAt 을 갱신하고 auth cookie 를 비운다', async () => {
    const user = await seedUser({ logoutAt: null })
    const auth = await createAccessTokenCookies({ userId: user.id })

    const response = await requestBackend({
      path: '/api/v1/auth/logout',
      method: 'POST',
      cookies: auth.cookieHeader,
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ loginId: user.loginId })
    expectAuthCookiesCleared(response)

    const persistedUser = await readUserById(user.id)
    expect(persistedUser?.logoutAt).toBeInstanceOf(Date)
  })

  test('refresh token 이 있으면 세션 family 를 revoke 하고 auth cookie 를 비운다', async () => {
    const user = await seedUser({ logoutAt: null })
    const session = await createRefreshSessionCookies({ userId: user.id })

    const response = await requestBackend({
      path: '/api/v1/auth/logout',
      method: 'POST',
      cookies: session.cookieHeader,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Safari/605.1.15',
      },
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ loginId: user.loginId })
    expectAuthCookiesCleared(response)

    const sessionFamilies = await readSessionFamiliesForUser(user.id)
    expect(sessionFamilies).toHaveLength(1)
    expect(sessionFamilies[0]?.revokedAt).toBeInstanceOf(Date)

    const persistedUser = await readUserById(user.id)
    expect(persistedUser?.logoutAt).toBeInstanceOf(Date)
  })

  test('토큰은 유효하지만 사용자가 없으면 loginId: null 과 auth cookie clear 를 반환한다', async () => {
    const auth = await createAccessTokenCookies({ userId: 999999 })

    const response = await requestBackend({
      path: '/api/v1/auth/logout',
      method: 'POST',
      cookies: auth.cookieHeader,
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ loginId: null })
    expectAuthCookiesCleared(response)
  })
})
