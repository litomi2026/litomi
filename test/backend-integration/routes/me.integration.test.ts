import { getSetCookieNames, requestBackend } from '@test/backend/app'
import { createAccessTokenCookies, createRefreshSessionCookies } from '@test/backend/auth'
import { readSessionTokensForFamily, seedAdultVerification, seedUser, seedUserSettings } from '@test/backend/db'
import { describe, expect, test } from 'bun:test'

import { privateCacheControl } from '@/backend/utils/cache-control'
import { authSessionTokenTable } from '@/database/supabase/auth'
import { db } from '@/database/supabase/drizzle'

import { installBackendIntegrationHooks } from '../setup'

installBackendIntegrationHooks()

describe('GET /api/v1/me', () => {
  test('인증 정보가 없으면 401을 반환한다', async () => {
    const response = await requestBackend({ path: '/api/v1/me' })
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body).toMatchObject({
      status: 401,
      detail: '로그인 정보가 없거나 만료됐어요',
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

  test('refresh token만 있어도 세션을 회전하고 새 쿠키를 내려준다', async () => {
    const user = await seedUser()
    await seedAdultVerification({ userId: user.id, adultFlag: false })
    const session = await createRefreshSessionCookies({ userId: user.id })

    const response = await requestBackend({
      path: '/api/v1/me',
      cookies: session.cookieHeader,
    })

    expect(response.status).toBe(200)
    expect(getSetCookieNames(response)).toEqual(expect.arrayContaining(['at', 'rt', 'ah']))

    const tokens = await readSessionTokensForFamily(session.familyId)
    expect(tokens).toHaveLength(2)
    expect(tokens.some((token) => token.rotatedAt instanceof Date)).toBe(true)

    const persistedTokens = await db.select().from(authSessionTokenTable)
    expect(persistedTokens).toHaveLength(2)
  })

  test('토큰은 유효하지만 사용자가 없으면 쿠키를 비우고 404를 반환한다', async () => {
    const auth = await createAccessTokenCookies({ userId: 999999, adult: false })

    const response = await requestBackend({
      path: '/api/v1/me',
      cookies: auth.cookieHeader,
    })

    expect(response.status).toBe(404)
    expect(getSetCookieNames(response)).toEqual(expect.arrayContaining(['at', 'rt', 'ah']))
  })
})
