import { describe, expect, test } from 'bun:test'
import { requestBackend } from '@test/backend/setup/app'
import {
  createAccessTokenCookies,
  createRefreshSessionCookies,
  expectAuthCookiesCleared,
  serializeCookieHeader,
} from '@test/backend/setup/auth'
import { readSessionFamiliesForUser, readUserById, seedUser } from '@test/backend/setup/db'

import { installAuthIntegrationHooks } from '../fixtures'

installAuthIntegrationHooks()

describe('POST /api/v1/auth/logout', () => {
  test('비로그인 상태여도 loginId: null을 반환하고 인증 쿠키를 비운다', async () => {
    const response = await requestBackend({
      path: '/api/v1/auth/logout',
      method: 'POST',
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ loginId: null })
    expectAuthCookiesCleared(response)
  })

  test('access token이 있으면 logoutAt을 갱신하고 인증 쿠키를 비운다', async () => {
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

  test('로그인 상태 유지 세션처럼 access token과 refresh token이 함께 있으면 세션 패밀리를 무효화하고 인증 쿠키를 비운다', async () => {
    const user = await seedUser({ logoutAt: null })
    const access = await createAccessTokenCookies({ userId: user.id })
    const session = await createRefreshSessionCookies({ userId: user.id })

    const response = await requestBackend({
      path: '/api/v1/auth/logout',
      method: 'POST',
      cookies: serializeCookieHeader([...access.cookieConfigs, ...session.cookieConfigs]),
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

  test('refresh token만 있어도 세션 패밀리를 무효화하고 loginId를 반환한다', async () => {
    const user = await seedUser({ logoutAt: null })
    const session = await createRefreshSessionCookies({ userId: user.id })

    const response = await requestBackend({
      path: '/api/v1/auth/logout',
      method: 'POST',
      cookies: session.cookieHeader,
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

  test('형식이 잘못된 refresh token만 있어도 loginId: null을 반환하고 인증 쿠키를 비운다', async () => {
    const response = await requestBackend({
      path: '/api/v1/auth/logout',
      method: 'POST',
      cookies: 'rt=definitely-not-a-session-token',
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ loginId: null })
    expectAuthCookiesCleared(response)
  })

  test('형식이 잘못된 access token만 있어도 loginId: null을 반환하고 인증 쿠키를 비운다', async () => {
    const response = await requestBackend({
      path: '/api/v1/auth/logout',
      method: 'POST',
      cookies: 'at=definitely-not-a-jwt',
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ loginId: null })
    expectAuthCookiesCleared(response)
  })

  test('형식이 잘못된 access token이 함께 있어도 refresh token으로 로그아웃을 완료한다', async () => {
    const user = await seedUser({ logoutAt: null })
    const session = await createRefreshSessionCookies({ userId: user.id })

    const response = await requestBackend({
      path: '/api/v1/auth/logout',
      method: 'POST',
      cookies: `at=definitely-not-a-jwt; ${session.cookieHeader}`,
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

  test('토큰은 유효하지만 사용자가 없으면 loginId: null을 반환하고 인증 쿠키를 비운다', async () => {
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
