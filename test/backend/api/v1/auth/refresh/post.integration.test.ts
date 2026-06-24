import { describe, expect, setSystemTime, test } from 'bun:test'
import { addSeconds, REFRESH_SESSION_REUSE_GRACE_SECONDS } from '@litomi/auth/session'
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
} from '@test/backend/setup/db'
import { expectProblemResponse } from '@test/backend/setup/problem'

import { noStoreCacheControl } from '@/utils/cache-control'

const REFRESH_PATH = '/api/v1/auth/refresh'

installBackendIntegrationHooks()

describe('POST /api/v1/auth/refresh', () => {
  test('refresh token이 없으면 401을 반환하고 인증 쿠키를 비운다', async () => {
    const response = await requestBackend({ method: 'POST', path: REFRESH_PATH })

    expect(response.status).toBe(401)
    expect(response.headers.get('Cache-Control')).toBe(noStoreCacheControl)
    expect(response.headers.get('ETag')).toBeNull()
    expectAuthCookiesCleared(response)

    await expectProblemResponse(response, {
      status: 401,
      code: 'authentication-required',
      detail: '로그인 정보가 없거나 만료됐어요',
      instance: REFRESH_PATH,
    })
  })

  test('유효한 refresh token이면 세션을 회전하고 새 인증 쿠키를 내려준다', async () => {
    const user = await seedUser()
    await seedAdultVerification({ userId: user.id, adultFlag: false })
    const session = await createRefreshSessionCookies({ userId: user.id })

    const response = await requestBackend({
      method: 'POST',
      path: REFRESH_PATH,
      cookies: session.cookieHeader,
    })

    expect(response.status).toBe(204)
    expect(response.headers.get('Cache-Control')).toBe(noStoreCacheControl)
    expect(response.headers.get('ETag')).toBeNull()
    expect(getSetCookieNames(response)).toEqual(expect.arrayContaining(['at', 'rt', 'ah']))
    expectSessionCookie(response, 'at')
    expectPersistentCookie(response, 'rt')
    expectPersistentCookie(response, 'ah')

    const tokens = await readSessionTokensForFamily(session.familyId)
    expect(tokens).toHaveLength(2)
    expect(tokens.some((token) => token.rotatedAt instanceof Date)).toBe(true)
  })

  test('재사용 유예 기간 안에서는 같은 refresh token 재시도를 허용하고 세션을 폐기하지 않는다', async () => {
    setSystemTime(new Date('2026-01-02T00:00:00.000Z'))

    try {
      const user = await seedUser()
      const session = await createRefreshSessionCookies({ userId: user.id })

      const firstResponse = await requestBackend({
        method: 'POST',
        path: REFRESH_PATH,
        cookies: session.cookieHeader,
      })

      expect(firstResponse.status).toBe(204)

      setSystemTime(new Date('2026-01-02T00:00:06.000Z'))

      const retryResponse = await requestBackend({
        method: 'POST',
        path: REFRESH_PATH,
        cookies: session.cookieHeader,
      })

      expect(retryResponse.status).toBe(204)
      expect(retryResponse.headers.get('Cache-Control')).toBe(noStoreCacheControl)
      expect(getSetCookieNames(retryResponse)).toEqual(expect.arrayContaining(['at', 'rt', 'ah']))

      const tokens = await readSessionTokensForFamily(session.familyId)
      expect(tokens).toHaveLength(2)

      const sessionFamilies = await readSessionFamiliesForUser(user.id)
      expect(sessionFamilies).toHaveLength(1)
      expect(sessionFamilies[0]?.revokedAt).toBeNull()
    } finally {
      setSystemTime()
    }
  })

  test('유효하지 않은 refresh token이면 401을 반환하고 인증 쿠키를 비운다', async () => {
    const response = await requestBackend({
      method: 'POST',
      path: REFRESH_PATH,
      cookies: 'rt=definitely-not-a-session-token',
    })

    expect(response.status).toBe(401)
    expect(response.headers.get('Cache-Control')).toBe(noStoreCacheControl)
    expect(response.headers.get('ETag')).toBeNull()
    expectAuthCookiesCleared(response)

    await expectProblemResponse(response, {
      status: 401,
      code: 'authentication-required',
      detail: '로그인 정보가 없거나 만료됐어요',
      instance: REFRESH_PATH,
    })
  })

  test('직전 부모 refresh token도 재사용 유예 기간이 지나면 세션 family를 폐기한다', async () => {
    setSystemTime(new Date('2026-01-02T00:00:00.000Z'))

    try {
      const user = await seedUser()
      const session = await createRefreshSessionCookies({ userId: user.id })

      const firstResponse = await requestBackend({
        method: 'POST',
        path: REFRESH_PATH,
        cookies: session.cookieHeader,
      })

      expect(firstResponse.status).toBe(204)

      setSystemTime(addSeconds(new Date('2026-01-02T00:00:00.000Z'), REFRESH_SESSION_REUSE_GRACE_SECONDS + 1))

      const replayResponse = await requestBackend({
        method: 'POST',
        path: REFRESH_PATH,
        cookies: session.cookieHeader,
      })

      expect(replayResponse.status).toBe(401)
      expectAuthCookiesCleared(replayResponse)

      await expectProblemResponse(replayResponse, {
        status: 401,
        code: 'authentication-required',
        detail: '로그인 정보가 없거나 만료됐어요',
        instance: REFRESH_PATH,
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

  test('몇 시간 뒤 refresh가 성공한 뒤 6초 늦게 도착한 stale old rt 응답은 브라우저 쿠키 jar를 유지한다', async () => {
    setSystemTime(new Date('2026-01-02T00:00:00.000Z'))

    try {
      const user = await seedUser()
      const access = await createAccessTokenCookies({ userId: user.id, adult: false })
      const session = await createRefreshSessionCookies({ userId: user.id })
      const jar = createCookieJar(serializeCookieHeader([...access.cookieConfigs, ...session.cookieConfigs]))
      const staleInflightCookies = jar.header()

      setSystemTime(new Date('2026-01-02T02:00:00.000Z'))

      const reconnectResponse = await requestBackend({
        method: 'POST',
        path: REFRESH_PATH,
        cookies: jar.header(),
      })

      expect(reconnectResponse.status).toBe(204)
      expect(reconnectResponse.headers.get('Cache-Control')).toBe(noStoreCacheControl)
      expect(getSetCookieNames(reconnectResponse)).toEqual(expect.arrayContaining(['at', 'rt', 'ah']))

      jar.applyResponse(reconnectResponse)
      expect(jar.header()).not.toBe(staleInflightCookies)

      const tokensAfterReconnect = await readSessionTokensForFamily(session.familyId)
      expect(tokensAfterReconnect).toHaveLength(2)
      expect(tokensAfterReconnect.some((token) => token.rotatedAt instanceof Date)).toBe(true)

      const refreshedRefreshToken = getCookieValue(jar.header(), 'rt')

      setSystemTime(new Date('2026-01-02T02:00:06.000Z'))

      const delayedStaleResponse = await requestBackend({
        method: 'POST',
        path: REFRESH_PATH,
        cookies: staleInflightCookies,
      })

      expect(delayedStaleResponse.status).toBe(204)
      expect(delayedStaleResponse.headers.get('Cache-Control')).toBe(noStoreCacheControl)
      expect(getSetCookieNames(delayedStaleResponse)).toEqual(expect.arrayContaining(['at', 'rt', 'ah']))

      jar.applyResponse(delayedStaleResponse)
      expect(jar.header()).not.toBe('')
      expect(getCookieValue(jar.header(), 'rt')).toBe(refreshedRefreshToken)

      const nextForegroundResponse = await requestBackend({
        path: '/api/v1/me',
        cookies: jar.header(),
      })

      expect(nextForegroundResponse.status).toBe(200)
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

  test('몇 시간 뒤 refresh가 성공한 뒤 재사용 유예 기간이 지난 stale old rt 응답은 세션 family를 폐기한다', async () => {
    setSystemTime(new Date('2026-01-02T00:00:00.000Z'))

    try {
      const user = await seedUser()
      const access = await createAccessTokenCookies({ userId: user.id, adult: false })
      const session = await createRefreshSessionCookies({ userId: user.id })
      const jar = createCookieJar(serializeCookieHeader([...access.cookieConfigs, ...session.cookieConfigs]))
      const staleInflightCookies = jar.header()

      setSystemTime(new Date('2026-01-02T02:00:00.000Z'))

      const reconnectResponse = await requestBackend({
        method: 'POST',
        path: REFRESH_PATH,
        cookies: jar.header(),
      })

      expect(reconnectResponse.status).toBe(204)
      jar.applyResponse(reconnectResponse)
      expect(jar.header()).not.toBe(staleInflightCookies)

      const tokensAfterReconnect = await readSessionTokensForFamily(session.familyId)
      expect(tokensAfterReconnect).toHaveLength(2)
      expect(tokensAfterReconnect.some((token) => token.rotatedAt instanceof Date)).toBe(true)

      setSystemTime(addSeconds(new Date('2026-01-02T02:00:00.000Z'), REFRESH_SESSION_REUSE_GRACE_SECONDS + 1))

      const delayedStaleResponse = await requestBackend({
        method: 'POST',
        path: REFRESH_PATH,
        cookies: staleInflightCookies,
      })

      expect(delayedStaleResponse.status).toBe(401)
      expectAuthCookiesCleared(delayedStaleResponse)

      await expectProblemResponse(delayedStaleResponse, {
        status: 401,
        code: 'authentication-required',
        detail: '로그인 정보가 없거나 만료됐어요',
        instance: REFRESH_PATH,
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
        code: 'authentication-required',
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

  test('직전 부모를 넘긴 stale refresh token replay는 세션 family를 폐기한다', async () => {
    setSystemTime(new Date('2026-01-02T00:00:00.000Z'))

    try {
      const user = await seedUser()
      const access = await createAccessTokenCookies({ userId: user.id, adult: false })
      const session = await createRefreshSessionCookies({ userId: user.id })
      const jar = createCookieJar(serializeCookieHeader([...access.cookieConfigs, ...session.cookieConfigs]))
      const staleGrandparentCookies = jar.header()

      setSystemTime(new Date('2026-01-02T02:00:00.000Z'))

      const reconnectResponse = await requestBackend({
        method: 'POST',
        path: REFRESH_PATH,
        cookies: jar.header(),
      })

      expect(reconnectResponse.status).toBe(204)
      expect(getSetCookieNames(reconnectResponse)).toEqual(expect.arrayContaining(['at', 'rt', 'ah']))
      jar.applyResponse(reconnectResponse)

      setSystemTime(new Date('2026-01-02T02:00:01.000Z'))

      const rotateCurrentResponse = await requestBackend({
        method: 'POST',
        path: REFRESH_PATH,
        cookies: jar.header(),
      })

      expect(rotateCurrentResponse.status).toBe(204)
      expect(getSetCookieNames(rotateCurrentResponse)).toEqual(expect.arrayContaining(['at', 'rt', 'ah']))
      jar.applyResponse(rotateCurrentResponse)

      setSystemTime(new Date('2026-01-02T02:00:12.000Z'))

      const delayedGrandparentReplay = await requestBackend({
        method: 'POST',
        path: REFRESH_PATH,
        cookies: staleGrandparentCookies,
      })

      expect(delayedGrandparentReplay.status).toBe(401)
      expectAuthCookiesCleared(delayedGrandparentReplay)

      await expectProblemResponse(delayedGrandparentReplay, {
        status: 401,
        code: 'authentication-required',
        detail: '로그인 정보가 없거나 만료됐어요',
        instance: REFRESH_PATH,
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
        code: 'authentication-required',
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
