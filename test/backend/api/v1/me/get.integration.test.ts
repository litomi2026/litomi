import { installBackendIntegrationHooks } from '@test/backend/setup'
import { getSetCookieNames, requestBackend } from '@test/backend/setup/app'
import {
  createAccessTokenCookies,
  createRefreshSessionCookies,
  expectAuthCookiesCleared,
} from '@test/backend/setup/auth'
import {
  readSessionFamiliesForUser,
  readSessionTokensForFamily,
  seedAdultVerification,
  seedUser,
  seedUserSettings,
} from '@test/backend/setup/db'
import { expectProblemResponse } from '@test/backend/setup/problem'
import { describe, expect, setSystemTime, test } from 'bun:test'

import { privateCacheControl } from '@/backend/utils/cache-control'
import { authSessionTokenTable } from '@/database/supabase/auth'
import { db } from '@/database/supabase/drizzle'

installBackendIntegrationHooks()

describe('GET /api/v1/me', () => {
  test('인증 정보가 없으면 401을 반환한다', async () => {
    const response = await requestBackend({ path: '/api/v1/me' })

    expect(response.status).toBe(401)

    await expectProblemResponse(response, {
      status: 401,
      code: 'unauthorized',
      detail: '로그인 정보가 없거나 만료됐어요',
      instance: '/api/v1/me',
    })
  })

  test('형식이 잘못된 access token만 있으면 401을 반환하고 인증 쿠키를 비운다', async () => {
    const response = await requestBackend({
      path: '/api/v1/me',
      cookies: 'at=definitely-not-a-jwt',
    })

    expect(response.status).toBe(401)
    expectAuthCookiesCleared(response)

    await expectProblemResponse(response, {
      status: 401,
      code: 'unauthorized',
      detail: '로그인 정보가 없거나 만료됐어요',
      instance: '/api/v1/me',
    })
  })

  test('유효한 access token이면 사용자 정보를 반환한다', async () => {
    const user = await seedUser({ imageURL: 'https://example.com/avatar.png' })

    await seedUserSettings({
      userId: user.id,
      historySyncEnabled: false,
      adultVerifiedAdVisible: true,
      autoDeletionDay: 30,
    })

    await seedAdultVerification({ userId: user.id, adultFlag: true })

    const auth = await createAccessTokenCookies({ userId: user.id, adult: true })

    const response = await requestBackend({
      path: '/api/v1/me',
      cookies: auth.cookieHeader,
      headers: { 'CF-IPCountry': 'KR' },
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe(privateCacheControl)

    expect(await response.json()).toEqual({
      id: user.id,
      loginId: user.loginId,
      name: user.name,
      nickname: user.nickname,
      imageURL: 'https://example.com/avatar.png',
      adultVerification: {
        required: true,
        status: 'adult',
      },
      settings: {
        historySyncEnabled: false,
        adultVerifiedAdVisible: true,
        autoDeletionDay: 30,
      },
    })
  })

  test('유효한 access token이 있으면 잘못된 refresh token은 무시하고 사용자 정보를 반환한다', async () => {
    const user = await seedUser()
    const auth = await createAccessTokenCookies({ userId: user.id, adult: false })

    const response = await requestBackend({
      path: '/api/v1/me',
      cookies: `${auth.cookieHeader}; rt=definitely-not-a-session-token`,
      headers: { 'CF-IPCountry': 'KR' },
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe(privateCacheControl)
    expect(getSetCookieNames(response)).toEqual([])

    expect(await response.json()).toMatchObject({
      id: user.id,
      adultVerification: {
        required: true,
        status: 'unverified',
      },
      settings: {
        historySyncEnabled: true,
        adultVerifiedAdVisible: false,
        autoDeletionDay: 180,
      },
    })
  })

  test('한국 외 국가에서는 미성년 인증 상태와 관계없이 required=false를 반환한다', async () => {
    const user = await seedUser()
    const auth = await createAccessTokenCookies({ userId: user.id, adult: false })

    const response = await requestBackend({
      path: '/api/v1/me',
      cookies: auth.cookieHeader,
      headers: { 'CF-IPCountry': 'US' },
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe(privateCacheControl)

    expect(await response.json()).toEqual({
      id: user.id,
      loginId: user.loginId,
      name: user.name,
      nickname: user.nickname,
      imageURL: null,
      adultVerification: {
        required: false,
        status: 'unverified',
      },
      settings: {
        historySyncEnabled: true,
        adultVerifiedAdVisible: false,
        autoDeletionDay: 180,
      },
    })
  })

  test('refresh token만 있어도 세션을 회전하고 새 쿠키를 내려준다', async () => {
    const user = await seedUser()
    await seedAdultVerification({ userId: user.id, adultFlag: false })
    const session = await createRefreshSessionCookies({ userId: user.id })

    const response = await requestBackend({
      path: '/api/v1/me',
      cookies: session.cookieHeader,
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe(privateCacheControl)
    expect(getSetCookieNames(response)).toEqual(expect.arrayContaining(['at', 'rt', 'ah']))

    expect(await response.json()).toMatchObject({
      id: user.id,
      adultVerification: {
        required: true,
        status: 'not_adult',
      },
      settings: {
        historySyncEnabled: true,
        adultVerifiedAdVisible: false,
        autoDeletionDay: 180,
      },
    })

    const tokens = await readSessionTokensForFamily(session.familyId)
    expect(tokens).toHaveLength(2)
    expect(tokens.some((token) => token.rotatedAt instanceof Date)).toBe(true)

    const persistedTokens = await db.select().from(authSessionTokenTable)
    expect(persistedTokens).toHaveLength(2)
  })

  test('재사용 유예 기간 안에서는 같은 refresh token 재시도를 허용하고 세션을 폐기하지 않는다', async () => {
    setSystemTime(new Date('2026-01-02T00:00:00.000Z'))

    try {
      const user = await seedUser()
      const session = await createRefreshSessionCookies({ userId: user.id })

      const firstResponse = await requestBackend({
        path: '/api/v1/me',
        cookies: session.cookieHeader,
      })

      expect(firstResponse.status).toBe(200)

      setSystemTime(new Date('2026-01-02T00:00:04.000Z'))

      const retryResponse = await requestBackend({
        path: '/api/v1/me',
        cookies: session.cookieHeader,
      })

      expect(retryResponse.status).toBe(200)
      expect(retryResponse.headers.get('Cache-Control')).toBe(privateCacheControl)
      expect(getSetCookieNames(retryResponse)).toEqual(expect.arrayContaining(['at', 'rt', 'ah']))

      expect(await retryResponse.json()).toMatchObject({
        id: user.id,
        adultVerification: {
          required: true,
          status: 'unverified',
        },
      })

      const tokens = await readSessionTokensForFamily(session.familyId)
      expect(tokens).toHaveLength(2)

      const sessionFamilies = await readSessionFamiliesForUser(user.id)
      expect(sessionFamilies).toHaveLength(1)
      expect(sessionFamilies[0]?.revokedAt).toBeNull()
    } finally {
      setSystemTime()
    }
  })

  test('형식이 잘못된 access token이 함께 있어도 유효한 refresh token으로 세션을 복구한다', async () => {
    const user = await seedUser()
    await seedAdultVerification({ userId: user.id, adultFlag: true })
    const session = await createRefreshSessionCookies({ userId: user.id })

    const response = await requestBackend({
      path: '/api/v1/me',
      cookies: `at=definitely-not-a-jwt; ${session.cookieHeader}`,
      headers: { 'CF-IPCountry': 'KR' },
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe(privateCacheControl)
    expect(getSetCookieNames(response)).toEqual(expect.arrayContaining(['at', 'rt', 'ah']))

    expect(await response.json()).toMatchObject({
      id: user.id,
      adultVerification: {
        required: true,
        status: 'adult',
      },
    })

    const tokens = await readSessionTokensForFamily(session.familyId)
    expect(tokens).toHaveLength(2)
    expect(tokens.some((token) => token.rotatedAt instanceof Date)).toBe(true)
  })

  test('유효하지 않은 refresh token이면 401을 반환하고 인증 쿠키를 비운다', async () => {
    const response = await requestBackend({
      path: '/api/v1/me',
      cookies: 'rt=definitely-not-a-session-token',
    })

    expect(response.status).toBe(401)
    expectAuthCookiesCleared(response)

    await expectProblemResponse(response, {
      status: 401,
      code: 'unauthorized',
      detail: '로그인 정보가 없거나 만료됐어요',
      instance: '/api/v1/me',
    })
  })

  test('재사용 유예 기간이 지난 refresh token을 다시 쓰면 세션을 폐기하고 401을 반환한다', async () => {
    setSystemTime(new Date('2026-01-02T00:00:00.000Z'))

    try {
      const user = await seedUser()
      const session = await createRefreshSessionCookies({ userId: user.id })

      const firstResponse = await requestBackend({
        path: '/api/v1/me',
        cookies: session.cookieHeader,
      })

      expect(firstResponse.status).toBe(200)

      setSystemTime(new Date('2026-01-02T00:00:06.000Z'))

      const replayResponse = await requestBackend({
        path: '/api/v1/me',
        cookies: session.cookieHeader,
      })

      expect(replayResponse.status).toBe(401)
      expectAuthCookiesCleared(replayResponse)

      await expectProblemResponse(replayResponse, {
        status: 401,
        code: 'unauthorized',
        detail: '로그인 정보가 없거나 만료됐어요',
        instance: '/api/v1/me',
      })

      const sessionFamilies = await readSessionFamiliesForUser(user.id)
      expect(sessionFamilies).toHaveLength(1)
      expect(sessionFamilies[0]?.revokedAt).toBeInstanceOf(Date)
    } finally {
      setSystemTime()
    }
  })

  test('토큰은 유효하지만 사용자가 없으면 쿠키를 비우고 404를 반환한다', async () => {
    const auth = await createAccessTokenCookies({ userId: 999999, adult: false })

    const response = await requestBackend({
      path: '/api/v1/me',
      cookies: auth.cookieHeader,
    })

    expect(response.status).toBe(404)
    expectAuthCookiesCleared(response)

    await expectProblemResponse(response, {
      status: 404,
      detail: '사용자 정보를 찾을 수 없어요',
      instance: '/api/v1/me',
    })
  })
})
