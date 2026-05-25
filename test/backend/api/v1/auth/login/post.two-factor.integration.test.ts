import { getSetCookieNames, requestBackend } from '@test/backend/setup/app'
import { createTrustedBrowserCookies, expectCookieCleared } from '@test/backend/setup/auth'
import {
  readSessionFamiliesForUser,
  readTrustedBrowsersForUser,
  readUserById,
  seedTrustedBrowser,
  seedTwoFactor,
  seedUser,
} from '@test/backend/setup/db'
import { describe, expect, test } from 'bun:test'

import { buildAuthHeaders, installAuthIntegrationHooks } from '../fixtures'
import { buildLoginRequest, installLoginTurnstileGuard } from './fixtures'

installAuthIntegrationHooks({ redis: true })

describe('POST /api/v1/auth/login', () => {
  test('2단계 인증이 활성화되어 있어도 유효한 신뢰할 수 있는 브라우저가 있으면 바로 로그인한다', async () => {
    const user = await seedUser({ loginAt: null, logoutAt: null })
    const browserId = 'trusted-browser-auth-login'
    const trustedFingerprint = 'fp-trusted-browser'
    const previousLastUsedAt = new Date('2025-01-01T00:00:00.000Z')

    await seedTwoFactor({ userId: user.id })

    await seedTrustedBrowser({
      userId: user.id,
      browserId,
      browserName: 'Chrome on macOS (Desktop)',
      expiresAt: new Date('2099-01-01T00:00:00.000Z'),
      lastUsedAt: previousLastUsedAt,
    })

    const trustedBrowser = await createTrustedBrowserCookies({
      browserId,
      fingerprint: trustedFingerprint,
      userId: user.id,
    })

    const fetchGuard = installLoginTurnstileGuard()

    const request = buildLoginRequest({
      loginId: user.loginId,
      remember: true,
      fingerprint: trustedFingerprint,
    })

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/login',
        method: 'POST',
        cookies: trustedBrowser.cookieHeader,
        headers: buildAuthHeaders({ ip: '203.0.113.17' }),
        json: request.payload,
      })

      expect(response.status).toBe(200)
      expect(getSetCookieNames(response)).toEqual(expect.arrayContaining(['at', 'rt', 'ah']))

      expect(await response.json()).toEqual({
        nextStep: 'authenticated',
        id: user.id,
        loginId: user.loginId,
        name: user.name,
        lastLoginAt: null,
        lastLogoutAt: null,
      })

      const [trustedBrowserRow] = await readTrustedBrowsersForUser(user.id)
      expect(trustedBrowserRow).toBeDefined()
      expect(trustedBrowserRow?.lastUsedAt).toBeInstanceOf(Date)
      expect(trustedBrowserRow!.lastUsedAt!.getTime()).toBeGreaterThan(previousLastUsedAt.getTime())
    } finally {
      fetchGuard.restore()
    }
  })

  test('다른 사용자의 신뢰할 수 있는 브라우저 쿠키는 지우고 2단계 인증으로 되돌린다', async () => {
    const user = await seedUser({ loginAt: null, logoutAt: null })
    const otherUser = await seedUser({ loginAt: null, logoutAt: null })
    const browserId = 'trusted-browser-other-user'
    const fingerprint = 'fp-trusted-browser-other-user'

    await seedTwoFactor({ userId: user.id })
    await seedTwoFactor({ userId: otherUser.id })

    await seedTrustedBrowser({
      userId: otherUser.id,
      browserId,
      browserName: 'Chrome on macOS (Desktop)',
      expiresAt: new Date('2099-01-01T00:00:00.000Z'),
      lastUsedAt: new Date('2025-01-01T00:00:00.000Z'),
    })

    const trustedBrowser = await createTrustedBrowserCookies({
      browserId,
      fingerprint,
      userId: otherUser.id,
    })

    const fetchGuard = installLoginTurnstileGuard()

    const request = buildLoginRequest({
      loginId: user.loginId,
      remember: true,
      fingerprint,
    })

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/login',
        method: 'POST',
        cookies: trustedBrowser.cookieHeader,
        headers: buildAuthHeaders({ ip: '203.0.113.18' }),
        json: request.payload,
      })

      expect(response.status).toBe(200)
      expectCookieCleared(response, 'tbt')

      const cookieNames = getSetCookieNames(response)
      expect(cookieNames).toContain('tbt')
      expect(cookieNames).not.toContain('at')
      expect(cookieNames).not.toContain('rt')
      expect(cookieNames).not.toContain('ah')

      const body = await response.json()
      expect(body.nextStep).toBe('two_factor_required')
      expect(typeof body.authorizationCode).toBe('string')

      const [persistedUser, sessionFamilies] = await Promise.all([
        readUserById(user.id),
        readSessionFamiliesForUser(user.id),
      ])

      expect(persistedUser?.loginAt).toBeNull()
      expect(sessionFamilies).toHaveLength(0)
    } finally {
      fetchGuard.restore()
    }
  })

  test('신뢰할 수 있는 브라우저 지문이 다르면 쿠키를 지우고 2단계 인증으로 되돌린다', async () => {
    const user = await seedUser({ loginAt: null, logoutAt: null })
    const browserId = 'trusted-browser-fingerprint-mismatch'
    const cookieFingerprint = 'fp-trusted-browser-cookie'

    await seedTwoFactor({ userId: user.id })

    await seedTrustedBrowser({
      userId: user.id,
      browserId,
      browserName: 'Chrome on macOS (Desktop)',
      expiresAt: new Date('2099-01-01T00:00:00.000Z'),
      lastUsedAt: new Date('2025-01-01T00:00:00.000Z'),
    })

    const trustedBrowser = await createTrustedBrowserCookies({
      browserId,
      fingerprint: cookieFingerprint,
      userId: user.id,
    })

    const fetchGuard = installLoginTurnstileGuard()

    const request = buildLoginRequest({
      loginId: user.loginId,
      remember: true,
      fingerprint: 'fp-trusted-browser-request',
    })

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/login',
        method: 'POST',
        cookies: trustedBrowser.cookieHeader,
        headers: buildAuthHeaders({ ip: '203.0.113.18' }),
        json: request.payload,
      })

      expect(response.status).toBe(200)
      expectCookieCleared(response, 'tbt')

      const cookieNames = getSetCookieNames(response)
      expect(cookieNames).toContain('tbt')
      expect(cookieNames).not.toContain('at')
      expect(cookieNames).not.toContain('rt')
      expect(cookieNames).not.toContain('ah')

      const body = await response.json()
      expect(body.nextStep).toBe('two_factor_required')
      expect(typeof body.authorizationCode).toBe('string')

      const [persistedUser, sessionFamilies] = await Promise.all([
        readUserById(user.id),
        readSessionFamiliesForUser(user.id),
      ])

      expect(persistedUser?.loginAt).toBeNull()
      expect(sessionFamilies).toHaveLength(0)
    } finally {
      fetchGuard.restore()
    }
  })

  test('만료된 신뢰할 수 있는 브라우저 쿠키는 지우고 2단계 인증으로 되돌린다', async () => {
    const user = await seedUser()
    const browserId = 'trusted-browser-expired'
    const fingerprint = 'fp-trusted-browser-expired'

    await seedTwoFactor({ userId: user.id })

    await seedTrustedBrowser({
      userId: user.id,
      browserId,
      browserName: 'Chrome on macOS (Desktop)',
      expiresAt: new Date('2020-01-01T00:00:00.000Z'),
      lastUsedAt: new Date('2020-01-01T00:00:00.000Z'),
    })

    const trustedBrowser = await createTrustedBrowserCookies({
      browserId,
      fingerprint,
      userId: user.id,
    })

    const fetchGuard = installLoginTurnstileGuard()

    const request = buildLoginRequest({
      loginId: user.loginId,
      remember: true,
      fingerprint,
    })

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/login',
        method: 'POST',
        cookies: trustedBrowser.cookieHeader,
        headers: buildAuthHeaders({ ip: '203.0.113.18' }),
        json: request.payload,
      })

      expect(response.status).toBe(200)
      expectCookieCleared(response, 'tbt')

      const cookieNames = getSetCookieNames(response)
      expect(cookieNames).toContain('tbt')
      expect(cookieNames).not.toContain('at')
      expect(cookieNames).not.toContain('rt')
      expect(cookieNames).not.toContain('ah')

      const body = await response.json()
      expect(body.nextStep).toBe('two_factor_required')
      expect(typeof body.authorizationCode).toBe('string')
    } finally {
      fetchGuard.restore()
    }
  })

  test('위조된 신뢰할 수 있는 브라우저 쿠키는 지우고 2단계 인증으로 되돌린다', async () => {
    const user = await seedUser({ loginAt: null, logoutAt: null })
    await seedTwoFactor({ userId: user.id })
    const fetchGuard = installLoginTurnstileGuard()

    const request = buildLoginRequest({
      loginId: user.loginId,
      remember: true,
      fingerprint: 'fp-auth-login-invalid-trusted-browser',
    })

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/login',
        method: 'POST',
        cookies: 'tbt=definitely-not-a-jwt',
        headers: buildAuthHeaders({ ip: '203.0.113.22' }),
        json: request.payload,
      })

      expect(response.status).toBe(200)
      expectCookieCleared(response, 'tbt')

      const cookieNames = getSetCookieNames(response)
      expect(cookieNames).toContain('tbt')
      expect(cookieNames).not.toContain('at')
      expect(cookieNames).not.toContain('rt')
      expect(cookieNames).not.toContain('ah')

      const body = await response.json()
      expect(body.nextStep).toBe('two_factor_required')
      expect(typeof body.authorizationCode).toBe('string')

      const [persistedUser, sessionFamilies, trustedBrowsers] = await Promise.all([
        readUserById(user.id),
        readSessionFamiliesForUser(user.id),
        readTrustedBrowsersForUser(user.id),
      ])

      expect(persistedUser?.loginAt).toBeNull()
      expect(sessionFamilies).toHaveLength(0)
      expect(trustedBrowsers).toHaveLength(0)
    } finally {
      fetchGuard.restore()
    }
  })
})
