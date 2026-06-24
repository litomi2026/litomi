import { describe, expect, setSystemTime, test } from 'bun:test'
import { getSetCookieNames, requestBackend } from '@test/backend/setup/app'
import { expectPersistentCookie, expectSessionCookie } from '@test/backend/setup/auth'
import { readSessionFamiliesForUser, readUserById, seedTwoFactor, seedUser } from '@test/backend/setup/db'

import {
  AUTH_TEST_CHROME_USER_AGENT,
  AUTH_TEST_SAFARI_USER_AGENT,
  AUTH_TEST_TOTP_TIME,
  buildAuthHeaders,
  installAuthIntegrationHooks,
} from '../fixtures'
import { buildLoginTwoFactorRequest } from './2fa/fixtures'
import { buildLoginRequest, installLoginTurnstileGuard } from './fixtures'

installAuthIntegrationHooks({ redis: true })

describe('POST /api/v1/auth/login', () => {
  test('remember=true면 로그인을 유지하는 쿠키를 응답하고 로그인한다', async () => {
    const user = await seedUser({ loginAt: null, logoutAt: null })
    const fetchGuard = installLoginTurnstileGuard()

    const request = buildLoginRequest({
      loginId: user.loginId,
      remember: true,
      fingerprint: 'fp-auth-login-remember',
    })

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: buildAuthHeaders({
          ip: '203.0.113.11',
          userAgent: AUTH_TEST_SAFARI_USER_AGENT,
        }),
        json: request.payload,
      })

      expect(response.status).toBe(200)
      expect(getSetCookieNames(response)).toEqual(expect.arrayContaining(['at', 'rt', 'ah']))
      expectSessionCookie(response, 'at')
      expectPersistentCookie(response, 'rt')
      expectPersistentCookie(response, 'ah')

      expect(await response.json()).toEqual({
        nextStep: 'authenticated',
        id: user.id,
        loginId: user.loginId,
        name: user.name,
        lastLoginAt: null,
        lastLogoutAt: null,
      })

      const sessionFamilies = await readSessionFamiliesForUser(user.id)
      const persistedUser = await readUserById(user.id)
      expect(sessionFamilies).toHaveLength(1)
      expect(persistedUser?.loginAt).toBeInstanceOf(Date)
    } finally {
      fetchGuard.restore()
    }
  })

  test('remember=false면 로그인을 유지하지 않고 로그인한다', async () => {
    const user = await seedUser({ loginAt: null, logoutAt: null })
    const fetchGuard = installLoginTurnstileGuard()

    const request = buildLoginRequest({
      loginId: user.loginId,
      fingerprint: 'fp-auth-login-sessionless',
    })

    try {
      const response = await requestBackend({
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: buildAuthHeaders({
          ip: '203.0.113.12',
          userAgent: AUTH_TEST_CHROME_USER_AGENT,
        }),
        json: request.payload,
      })

      expect(response.status).toBe(200)

      const cookieNames = getSetCookieNames(response)
      expect(cookieNames).toEqual(expect.arrayContaining(['at', 'ah']))
      expect(cookieNames).not.toContain('rt')
      expectSessionCookie(response, 'at')
      expectSessionCookie(response, 'ah')

      expect(await response.json()).toEqual({
        nextStep: 'authenticated',
        id: user.id,
        loginId: user.loginId,
        name: user.name,
        lastLoginAt: null,
        lastLogoutAt: null,
      })

      const sessionFamilies = await readSessionFamiliesForUser(user.id)
      expect(sessionFamilies).toHaveLength(0)
    } finally {
      fetchGuard.restore()
    }
  })

  test('2단계 인증이 활성화되어 있으면 로그인 응답의 인증 코드로 2단계 인증을 이어간다', async () => {
    const user = await seedUser({ id: 2101, loginAt: null, logoutAt: null })
    await seedTwoFactor({ userId: user.id })
    const fetchGuard = installLoginTurnstileGuard()

    const loginRequest = buildLoginRequest({
      loginId: user.loginId,
      fingerprint: 'fp-auth-login-2fa-flow',
    })

    try {
      const loginResponse = await requestBackend({
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: buildAuthHeaders({ ip: '203.0.113.15' }),
        json: loginRequest.payload,
      })

      expect(loginResponse.status).toBe(200)
      expect(getSetCookieNames(loginResponse)).toEqual([])

      const loginBody = await loginResponse.json()
      expect(loginBody.nextStep).toBe('two_factor_required')
      expect(typeof loginBody.authorizationCode).toBe('string')

      const [persistedUserBeforeTwoFactor, sessionFamiliesBeforeTwoFactor] = await Promise.all([
        readUserById(user.id),
        readSessionFamiliesForUser(user.id),
      ])

      expect(persistedUserBeforeTwoFactor?.loginAt).toBeNull()
      expect(sessionFamiliesBeforeTwoFactor).toHaveLength(0)

      setSystemTime(new Date(AUTH_TEST_TOTP_TIME))

      let twoFactorResponse: Response

      try {
        twoFactorResponse = await requestBackend({
          path: '/api/v1/auth/login/2fa',
          method: 'POST',
          headers: buildAuthHeaders({ ip: '203.0.113.16' }),
          json: buildLoginTwoFactorRequest({
            authorizationCode: String(loginBody.authorizationCode),
            codeVerifier: loginRequest.codeVerifier,
            fingerprint: loginRequest.payload.fingerprint,
          }),
        })
      } finally {
        setSystemTime()
      }

      expect(twoFactorResponse.status).toBe(200)

      const cookieNames = getSetCookieNames(twoFactorResponse)
      expect(cookieNames).toEqual(expect.arrayContaining(['at', 'ah']))
      expect(cookieNames).not.toContain('rt')
      expectSessionCookie(twoFactorResponse, 'at')
      expectSessionCookie(twoFactorResponse, 'ah')

      const twoFactorBody = await twoFactorResponse.json()

      expect(twoFactorBody).toMatchObject({
        id: user.id,
        loginId: user.loginId,
        name: user.name,
        lastLogoutAt: null,
        isBackupCode: false,
        backupCodeCount: 0,
      })

      expect(typeof twoFactorBody.lastLoginAt).toBe('string')

      const persistedUser = await readUserById(user.id)
      expect(persistedUser?.loginAt).toBeInstanceOf(Date)
    } finally {
      fetchGuard.restore()
    }
  })
})
