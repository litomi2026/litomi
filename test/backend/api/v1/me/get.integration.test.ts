import { describe, expect, test } from 'bun:test'
import { DEFAULT_SEARCH_LANGUAGE } from '@litomi/domain/search/language'
import { installBackendIntegrationHooks } from '@test/backend/setup'
import { getSetCookieNames, requestBackend } from '@test/backend/setup/app'
import {
  createAccessTokenCookies,
  createRefreshSessionCookies,
  expectAuthCookiesCleared,
} from '@test/backend/setup/auth'
import { seedAdultVerification, seedUser, seedUserSettings } from '@test/backend/setup/db'
import { expectProblemResponse } from '@test/backend/setup/problem'

import { privateCacheControl } from '@/utils/cache-control'

installBackendIntegrationHooks()

describe('GET /api/v1/me', () => {
  test('인증 정보가 없으면 401을 반환한다', async () => {
    const response = await requestBackend({ path: '/api/v1/me' })

    expect(response.status).toBe(401)
    expect(getSetCookieNames(response)).toEqual([])

    await expectProblemResponse(response, {
      status: 401,
      code: 'authentication-required',
      title: '로그인 정보가 없거나 만료됐어요',
      instance: '/api/v1/me',
    })
  })

  test('형식이 잘못된 access token만 있으면 401을 반환한다', async () => {
    const response = await requestBackend({
      path: '/api/v1/me',
      cookies: 'at=definitely-not-a-jwt',
    })

    expect(response.status).toBe(401)
    expect(getSetCookieNames(response)).toEqual([])

    await expectProblemResponse(response, {
      status: 401,
      code: 'authentication-required',
      title: '로그인 정보가 없거나 만료됐어요',
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
        searchLanguage: DEFAULT_SEARCH_LANGUAGE,
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
        searchLanguage: DEFAULT_SEARCH_LANGUAGE,
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
        searchLanguage: DEFAULT_SEARCH_LANGUAGE,
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
        searchLanguage: DEFAULT_SEARCH_LANGUAGE,
        autoDeletionDay: 90,
      },
    })
  })

  test('refresh token만으로는 사용자 정보를 반환하지 않는다', async () => {
    const user = await seedUser()
    const session = await createRefreshSessionCookies({ userId: user.id })

    const response = await requestBackend({
      path: '/api/v1/me',
      cookies: session.cookieHeader,
    })

    expect(response.status).toBe(401)
    expect(getSetCookieNames(response)).toEqual([])

    await expectProblemResponse(response, {
      status: 401,
      code: 'authentication-required',
      title: '로그인 정보가 없거나 만료됐어요',
      instance: '/api/v1/me',
    })
  })

  test('형식이 잘못된 access token이 함께 있어도 refresh token으로 직접 복구하지 않는다', async () => {
    const user = await seedUser()
    const session = await createRefreshSessionCookies({ userId: user.id })

    const response = await requestBackend({
      path: '/api/v1/me',
      cookies: `at=definitely-not-a-jwt; ${session.cookieHeader}`,
    })

    expect(response.status).toBe(401)
    expect(getSetCookieNames(response)).toEqual([])

    await expectProblemResponse(response, {
      status: 401,
      code: 'authentication-required',
      title: '로그인 정보가 없거나 만료됐어요',
      instance: '/api/v1/me',
    })
  })

  test('조건부 요청이 캐시와 일치하면 304를 반환한다', async () => {
    const user = await seedUser()
    const auth = await createAccessTokenCookies({ userId: user.id, adult: false })

    const cachedResponse = await requestBackend({
      path: '/api/v1/me',
      cookies: auth.cookieHeader,
    })

    expect(cachedResponse.status).toBe(200)

    const etag = cachedResponse.headers.get('ETag')
    expect(etag).toBeTruthy()

    const response = await requestBackend({
      path: '/api/v1/me',
      cookies: auth.cookieHeader,
      headers: { 'If-None-Match': etag! },
    })

    expect(response.status).toBe(304)
    expect(response.headers.get('Cache-Control')).toBe(privateCacheControl)
    expect(getSetCookieNames(response)).toEqual([])
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
