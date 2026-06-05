import { CookieKey } from '@litomi/http/cookie'
import { getSetCookieNames, getSetCookieStrings, requestBackend } from '@test/backend/setup/app'
import {
  readSessionFamiliesForUser,
  readTrustedBrowsersForUser,
  readTwoFactorByUserId,
  readUserById,
  seedTrustedBrowser,
  seedTwoFactor,
  seedUser,
} from '@test/backend/setup/db'
import { describe, expect, setSystemTime, test } from 'bun:test'

import { verifyTrustedBrowserToken } from '@/api/v1/auth/login/util'

import {
  AUTH_TEST_SAFARI_USER_AGENT,
  AUTH_TEST_TOTP_TIME,
  buildAuthHeaders,
  installAuthIntegrationHooks,
} from '../../fixtures'
import { buildLoginTwoFactorRequest, issueAuthorizationChallenge } from './fixtures'

installAuthIntegrationHooks({ redis: true })

describe('POST /api/v1/auth/login/2fa', () => {
  test('유효한 TOTP로 2단계 인증을 완료한다', async () => {
    const user = await seedUser({ id: 2201, loginAt: null, logoutAt: null })

    await seedTwoFactor({
      userId: user.id,
      lastUsedAt: new Date('2025-12-31T00:00:00.000Z'),
    })

    const challenge = await issueAuthorizationChallenge({
      userId: user.id,
      fingerprint: 'fp-auth-login-2fa-totp',
    })

    setSystemTime(new Date(AUTH_TEST_TOTP_TIME))

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/login/2fa',
        method: 'POST',
        headers: buildAuthHeaders({ ip: '203.0.113.31' }),
        json: buildLoginTwoFactorRequest(challenge),
      })

      expect(response.status).toBe(200)

      const cookieNames = getSetCookieNames(response)
      expect(cookieNames).toEqual(expect.arrayContaining(['at', 'ah']))
      expect(cookieNames).not.toContain('rt')

      const body = await response.json()

      expect(body).toMatchObject({
        id: user.id,
        loginId: user.loginId,
        name: user.name,
        lastLogoutAt: null,
        isBackupCode: false,
        backupCodeCount: 0,
      })

      expect(typeof body.lastLoginAt).toBe('string')

      const [persistedUser, persistedTwoFactor] = await Promise.all([
        readUserById(user.id),
        readTwoFactorByUserId(user.id),
      ])

      expect(persistedUser?.loginAt).toBeInstanceOf(Date)
      expect(persistedTwoFactor?.lastUsedAt?.toISOString()).toBe(AUTH_TEST_TOTP_TIME)
    } finally {
      setSystemTime()
    }
  })

  test('remember=false여도 trustBrowser=true면 신뢰할 수 있는 브라우저 쿠키만 별도로 발급한다', async () => {
    const user = await seedUser({ id: 2212, loginAt: null, logoutAt: null })
    await seedTwoFactor({ userId: user.id })

    const challenge = await issueAuthorizationChallenge({
      userId: user.id,
      fingerprint: 'fp-auth-login-2fa-trusted-without-remember',
    })

    setSystemTime(new Date(AUTH_TEST_TOTP_TIME))

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/login/2fa',
        method: 'POST',
        headers: buildAuthHeaders({
          ip: '203.0.113.42',
          userAgent: AUTH_TEST_SAFARI_USER_AGENT,
        }),
        json: buildLoginTwoFactorRequest(challenge, {
          trustBrowser: true,
        }),
      })

      expect(response.status).toBe(200)

      const cookieNames = getSetCookieNames(response)
      expect(cookieNames).toEqual(expect.arrayContaining(['at', 'ah', 'tbt']))
      expect(cookieNames).not.toContain('rt')

      const trustedBrowsers = await readTrustedBrowsersForUser(user.id)
      expect(trustedBrowsers).toHaveLength(1)

      const sessionFamilies = await readSessionFamiliesForUser(user.id)
      expect(sessionFamilies).toHaveLength(0)
    } finally {
      setSystemTime()
    }
  })

  test('trustBrowser=true로 TOTP 인증하면 신뢰할 수 있는 브라우저 쿠키와 세션을 함께 발급한다', async () => {
    const user = await seedUser({ id: 2203, loginAt: null, logoutAt: null })
    await seedTwoFactor({ userId: user.id })

    const challenge = await issueAuthorizationChallenge({
      userId: user.id,
      fingerprint: 'fp-auth-login-2fa-trusted',
    })

    setSystemTime(new Date(AUTH_TEST_TOTP_TIME))

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/login/2fa',
        method: 'POST',
        headers: buildAuthHeaders({
          ip: '203.0.113.33',
          userAgent: AUTH_TEST_SAFARI_USER_AGENT,
        }),
        json: buildLoginTwoFactorRequest(challenge, {
          remember: true,
          trustBrowser: true,
        }),
      })

      expect(response.status).toBe(200)
      expect(getSetCookieNames(response)).toEqual(expect.arrayContaining(['at', 'rt', 'ah', 'tbt']))

      const trustedBrowsers = await readTrustedBrowsersForUser(user.id)
      expect(trustedBrowsers).toHaveLength(1)
      expect(trustedBrowsers[0]?.browserName).toBeTruthy()

      const sessionFamilies = await readSessionFamiliesForUser(user.id)
      expect(sessionFamilies).toHaveLength(1)
    } finally {
      setSystemTime()
    }
  })

  test('신뢰할 수 있는 브라우저는 최대 5개까지만 유지하고 가장 오래된 활성 브라우저를 제거한다', async () => {
    const user = await seedUser({ id: 2215, loginAt: null, logoutAt: null })
    const newFingerprint = 'fp-auth-login-2fa-trusted-limit-new'

    await seedTwoFactor({ userId: user.id })

    await Promise.all([
      seedTrustedBrowser({
        userId: user.id,
        browserId: 'trusted-browser-limit-01',
        browserName: 'Chrome on macOS (Desktop)',
        expiresAt: new Date('2099-01-01T00:00:00.000Z'),
        lastUsedAt: new Date('2025-01-01T00:00:00.000Z'),
      }),
      seedTrustedBrowser({
        userId: user.id,
        browserId: 'trusted-browser-limit-02',
        browserName: 'Chrome on macOS (Desktop)',
        expiresAt: new Date('2099-01-01T00:00:00.000Z'),
        lastUsedAt: new Date('2025-02-01T00:00:00.000Z'),
      }),
      seedTrustedBrowser({
        userId: user.id,
        browserId: 'trusted-browser-limit-03',
        browserName: 'Chrome on macOS (Desktop)',
        expiresAt: new Date('2099-01-01T00:00:00.000Z'),
        lastUsedAt: new Date('2025-03-01T00:00:00.000Z'),
      }),
      seedTrustedBrowser({
        userId: user.id,
        browserId: 'trusted-browser-limit-04',
        browserName: 'Chrome on macOS (Desktop)',
        expiresAt: new Date('2099-01-01T00:00:00.000Z'),
        lastUsedAt: new Date('2025-04-01T00:00:00.000Z'),
      }),
      seedTrustedBrowser({
        userId: user.id,
        browserId: 'trusted-browser-limit-05',
        browserName: 'Chrome on macOS (Desktop)',
        expiresAt: new Date('2099-01-01T00:00:00.000Z'),
        lastUsedAt: new Date('2025-05-01T00:00:00.000Z'),
      }),
    ])

    const challenge = await issueAuthorizationChallenge({
      userId: user.id,
      fingerprint: newFingerprint,
    })

    setSystemTime(new Date(AUTH_TEST_TOTP_TIME))

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/login/2fa',
        method: 'POST',
        headers: buildAuthHeaders({
          ip: '203.0.113.46',
          userAgent: AUTH_TEST_SAFARI_USER_AGENT,
        }),
        json: buildLoginTwoFactorRequest(challenge, {
          trustBrowser: true,
        }),
      })

      expect(response.status).toBe(200)

      const cookieNames = getSetCookieNames(response)
      expect(cookieNames).toEqual(expect.arrayContaining(['at', 'ah', 'tbt']))
      expect(cookieNames).not.toContain('rt')

      const trustedBrowserCookie = getSetCookieStrings(response).find((value) =>
        value.startsWith(`${CookieKey.TRUSTED_BROWSER_TOKEN}=`),
      )
      const trustedBrowserToken = trustedBrowserCookie
        ?.split(';', 1)[0]
        ?.slice(`${CookieKey.TRUSTED_BROWSER_TOKEN}=`.length)

      expect(trustedBrowserToken).toBeTruthy()

      const trustedBrowserPayload = await verifyTrustedBrowserToken(String(trustedBrowserToken))

      if (!trustedBrowserPayload) {
        throw new Error('trusted browser token should be issued')
      }

      expect(trustedBrowserPayload.userId).toBe(user.id)
      expect(trustedBrowserPayload.fingerprint).toBe(newFingerprint)

      const trustedBrowsers = await readTrustedBrowsersForUser(user.id)
      expect(trustedBrowsers).toHaveLength(5)
      expect(trustedBrowsers.some((browser) => browser.browserId === 'trusted-browser-limit-01')).toBe(false)
      expect(trustedBrowsers.some((browser) => browser.browserId === trustedBrowserPayload.browserId)).toBe(true)

      const sessionFamilies = await readSessionFamiliesForUser(user.id)
      expect(sessionFamilies).toHaveLength(0)
    } finally {
      setSystemTime()
    }
  })
})
