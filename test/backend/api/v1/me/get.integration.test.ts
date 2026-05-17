import { addSeconds, REFRESH_SESSION_REUSE_GRACE_SECONDS } from '@litomi/auth/session'
import { authSessionTokenTable } from '@litomi/db/database/supabase/auth'
import { db } from '@litomi/db/database/supabase/drizzle'
import { installBackendIntegrationHooks } from '@test/backend/setup'
import { getSetCookieNames, getSetCookieStrings, requestBackend } from '@test/backend/setup/app'
import {
  createAccessTokenCookies,
  createRefreshSessionCookies,
  expectAuthCookiesCleared,
  expectPersistentCookie,
  expectSessionCookie,
  serializeCookieHeader,
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

import { privateCacheControl } from '@/utils/cache-control'

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
      defaultCensorshipEnabled: false,
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
        defaultCensorshipEnabled: false,
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
        defaultCensorshipEnabled: true,
        autoDeletionDay: 90,
      },
    })
  })

  test('user_settings가 없으면 기본 autoDeletionDay를 사용한다', async () => {
    const user = await seedUser()
    const auth = await createAccessTokenCookies({ userId: user.id, adult: false })

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
      imageURL: null,
      adultVerification: {
        required: true,
        status: 'unverified',
      },
      settings: {
        historySyncEnabled: true,
        adultVerifiedAdVisible: false,
        defaultCensorshipEnabled: true,
        autoDeletionDay: 90,
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
        defaultCensorshipEnabled: true,
        autoDeletionDay: 90,
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
    expectSessionCookie(response, 'at')
    expectPersistentCookie(response, 'rt')
    expectPersistentCookie(response, 'ah')

    expect(await response.json()).toMatchObject({
      id: user.id,
      adultVerification: {
        required: true,
        status: 'not_adult',
      },
      settings: {
        historySyncEnabled: true,
        adultVerifiedAdVisible: false,
        autoDeletionDay: 90,
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

      setSystemTime(new Date('2026-01-02T00:00:06.000Z'))

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

  test('직전 부모 refresh token도 재사용 유예 기간이 지나면 세션 family를 폐기한다', async () => {
    setSystemTime(new Date('2026-01-02T00:00:00.000Z'))

    try {
      const user = await seedUser()
      const session = await createRefreshSessionCookies({ userId: user.id })

      const firstResponse = await requestBackend({
        path: '/api/v1/me',
        cookies: session.cookieHeader,
      })

      expect(firstResponse.status).toBe(200)

      setSystemTime(addSeconds(new Date('2026-01-02T00:00:00.000Z'), REFRESH_SESSION_REUSE_GRACE_SECONDS + 1))

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

      const tokens = await readSessionTokensForFamily(session.familyId)
      expect(tokens).toHaveLength(2)

      const sessionFamilies = await readSessionFamiliesForUser(user.id)
      expect(sessionFamilies).toHaveLength(1)
      expect(sessionFamilies[0]?.revokedAt).toBeInstanceOf(Date)
    } finally {
      setSystemTime()
    }
  })

  test('몇 시간 뒤 재접속이 성공한 뒤 6초 늦게 도착한 stale in-flight old rt 응답은 브라우저 쿠키 jar를 유지한다', async () => {
    setSystemTime(new Date('2026-01-02T00:00:00.000Z'))

    try {
      const user = await seedUser()
      const access = await createAccessTokenCookies({ userId: user.id, adult: false })
      const session = await createRefreshSessionCookies({ userId: user.id })
      const jar = createCookieJar(serializeCookieHeader([...access.cookieConfigs, ...session.cookieConfigs]))
      const staleInflightCookies = jar.header()

      setSystemTime(new Date('2026-01-02T02:00:00.000Z'))

      const reconnectResponse = await requestBackend({
        path: '/api/v1/me',
        cookies: jar.header(),
      })

      expect(reconnectResponse.status).toBe(200)
      expect(reconnectResponse.headers.get('Cache-Control')).toBe(privateCacheControl)
      expect(getSetCookieNames(reconnectResponse)).toEqual(expect.arrayContaining(['at', 'rt', 'ah']))

      jar.applyResponse(reconnectResponse)
      expect(jar.header()).not.toBe(staleInflightCookies)

      const tokensAfterReconnect = await readSessionTokensForFamily(session.familyId)
      expect(tokensAfterReconnect).toHaveLength(2)
      expect(tokensAfterReconnect.some((token) => token.rotatedAt instanceof Date)).toBe(true)

      const refreshedRefreshToken = getCookieValue(jar.header(), 'rt')

      setSystemTime(new Date('2026-01-02T02:00:06.000Z'))

      const delayedStaleResponse = await requestBackend({
        path: '/api/v1/me',
        cookies: staleInflightCookies,
      })

      expect(delayedStaleResponse.status).toBe(200)
      expect(delayedStaleResponse.headers.get('Cache-Control')).toBe(privateCacheControl)
      expect(getSetCookieNames(delayedStaleResponse)).toEqual(expect.arrayContaining(['at', 'rt', 'ah']))

      expect(await delayedStaleResponse.json()).toMatchObject({
        id: user.id,
        adultVerification: {
          required: true,
          status: 'unverified',
        },
      })

      jar.applyResponse(delayedStaleResponse)
      expect(jar.header()).not.toBe('')
      expect(getCookieValue(jar.header(), 'rt')).toBe(refreshedRefreshToken)

      const nextForegroundResponse = await requestBackend({
        path: '/api/v1/me',
        cookies: jar.header(),
      })

      expect(nextForegroundResponse.status).toBe(200)
      expect(nextForegroundResponse.headers.get('Cache-Control')).toBe(privateCacheControl)
      expect(await nextForegroundResponse.json()).toMatchObject({
        id: user.id,
      })

      const sessionFamilies = await readSessionFamiliesForUser(user.id)
      expect(sessionFamilies).toHaveLength(1)
      expect(sessionFamilies[0]?.revokedAt).toBeNull()
    } finally {
      setSystemTime()
    }
  })

  test('몇 시간 뒤 재접속이 성공한 뒤 재사용 유예 기간이 지난 stale in-flight old rt 응답은 세션 family를 폐기한다', async () => {
    setSystemTime(new Date('2026-01-02T00:00:00.000Z'))

    try {
      const user = await seedUser()
      const access = await createAccessTokenCookies({ userId: user.id, adult: false })
      const session = await createRefreshSessionCookies({ userId: user.id })
      const jar = createCookieJar(serializeCookieHeader([...access.cookieConfigs, ...session.cookieConfigs]))
      const staleInflightCookies = jar.header()

      setSystemTime(new Date('2026-01-02T02:00:00.000Z'))

      const reconnectResponse = await requestBackend({
        path: '/api/v1/me',
        cookies: jar.header(),
      })

      expect(reconnectResponse.status).toBe(200)
      expect(reconnectResponse.headers.get('Cache-Control')).toBe(privateCacheControl)
      expect(getSetCookieNames(reconnectResponse)).toEqual(expect.arrayContaining(['at', 'rt', 'ah']))

      jar.applyResponse(reconnectResponse)
      expect(jar.header()).not.toBe(staleInflightCookies)

      const tokensAfterReconnect = await readSessionTokensForFamily(session.familyId)
      expect(tokensAfterReconnect).toHaveLength(2)
      expect(tokensAfterReconnect.some((token) => token.rotatedAt instanceof Date)).toBe(true)

      setSystemTime(addSeconds(new Date('2026-01-02T02:00:00.000Z'), REFRESH_SESSION_REUSE_GRACE_SECONDS + 1))

      const delayedStaleResponse = await requestBackend({
        path: '/api/v1/me',
        cookies: staleInflightCookies,
      })

      expect(delayedStaleResponse.status).toBe(401)
      expectAuthCookiesCleared(delayedStaleResponse)

      await expectProblemResponse(delayedStaleResponse, {
        status: 401,
        code: 'unauthorized',
        detail: '로그인 정보가 없거나 만료됐어요',
        instance: '/api/v1/me',
      })

      jar.applyResponse(delayedStaleResponse)
      expect(jar.header()).toBe('')

      const nextForegroundResponse = await requestBackend({
        path: '/api/v1/me',
        cookies: jar.header(),
      })

      expect(nextForegroundResponse.status).toBe(401)

      await expectProblemResponse(nextForegroundResponse, {
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

  test('직전 부모를 넘긴 stale refresh token replay는 여전히 세션 family를 폐기한다', async () => {
    setSystemTime(new Date('2026-01-02T00:00:00.000Z'))

    try {
      const user = await seedUser()
      const access = await createAccessTokenCookies({ userId: user.id, adult: false })
      const session = await createRefreshSessionCookies({ userId: user.id })
      const jar = createCookieJar(serializeCookieHeader([...access.cookieConfigs, ...session.cookieConfigs]))
      const staleGrandparentCookies = jar.header()

      setSystemTime(new Date('2026-01-02T02:00:00.000Z'))

      const reconnectResponse = await requestBackend({
        path: '/api/v1/me',
        cookies: jar.header(),
      })

      expect(reconnectResponse.status).toBe(200)
      expect(getSetCookieNames(reconnectResponse)).toEqual(expect.arrayContaining(['at', 'rt', 'ah']))
      jar.applyResponse(reconnectResponse)

      setSystemTime(new Date('2026-01-02T02:00:01.000Z'))

      const rotateCurrentResponse = await requestBackend({
        path: '/api/v1/me',
        cookies: `at=definitely-not-a-jwt; ${jar.header()}`,
      })

      expect(rotateCurrentResponse.status).toBe(200)
      expect(getSetCookieNames(rotateCurrentResponse)).toEqual(expect.arrayContaining(['at', 'rt', 'ah']))
      jar.applyResponse(rotateCurrentResponse)

      setSystemTime(new Date('2026-01-02T02:00:12.000Z'))

      const delayedGrandparentReplay = await requestBackend({
        path: '/api/v1/me',
        cookies: staleGrandparentCookies,
      })

      expect(delayedGrandparentReplay.status).toBe(401)
      expectAuthCookiesCleared(delayedGrandparentReplay)

      await expectProblemResponse(delayedGrandparentReplay, {
        status: 401,
        code: 'unauthorized',
        detail: '로그인 정보가 없거나 만료됐어요',
        instance: '/api/v1/me',
      })

      jar.applyResponse(delayedGrandparentReplay)
      expect(jar.header()).toBe('')

      const nextForegroundResponse = await requestBackend({
        path: '/api/v1/me',
        cookies: jar.header(),
      })

      expect(nextForegroundResponse.status).toBe(401)

      await expectProblemResponse(nextForegroundResponse, {
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

function createCookieJar(cookieHeader: string) {
  const cookies = new Map<string, string>()

  for (const pair of cookieHeader.split(';')) {
    const trimmedPair = pair.trim()

    if (!trimmedPair) {
      continue
    }

    const separatorIndex = trimmedPair.indexOf('=')

    if (separatorIndex <= 0) {
      continue
    }

    const name = trimmedPair.slice(0, separatorIndex)
    const value = trimmedPair.slice(separatorIndex + 1)
    cookies.set(name, value)
  }

  return {
    applyResponse(response: Response) {
      for (const setCookie of getSetCookieStrings(response)) {
        const parts = setCookie.split(';').map((part) => part.trim())
        const pair = parts[0]

        if (!pair) {
          continue
        }

        const separatorIndex = pair.indexOf('=')

        if (separatorIndex <= 0) {
          continue
        }

        const name = pair.slice(0, separatorIndex)
        const value = pair.slice(separatorIndex + 1)
        const maxAge = parts.find((part) => part.toLowerCase().startsWith('max-age='))

        if (maxAge && Number(maxAge.slice('max-age='.length)) <= 0) {
          cookies.delete(name)
          continue
        }

        cookies.set(name, value)
      }
    },
    header() {
      return Array.from(cookies.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join('; ')
    },
  }
}

function getCookieValue(cookieHeader: string, name: string) {
  const cookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))

  return cookie ? cookie.slice(name.length + 1) : null
}
