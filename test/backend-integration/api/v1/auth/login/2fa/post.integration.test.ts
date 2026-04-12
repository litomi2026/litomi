import { installBackendIntegrationHooks } from '@test/backend-integration/setup'
import { getSetCookieNames, requestBackend } from '@test/backend/app'
import {
  readSessionFamiliesForUser,
  readTrustedBrowsersForUser,
  readTwoFactorBackupCodes,
  readUserById,
  seedTwoFactor,
  seedTwoFactorBackupCodes,
  seedUser,
  TEST_TOTP_SECRET,
} from '@test/backend/db'
import { describe, expect, test } from 'bun:test'

import { nextIp } from '../fixtures'
import { createValidTotpToken, issueAuthorizationChallenge } from './fixtures'

installBackendIntegrationHooks({ redis: true })

describe('POST /api/v1/auth/login/2fa', () => {
  test('유효한 TOTP로 2단계 인증을 완료한다', async () => {
    const user = await seedUser({ loginAt: null, logoutAt: null })
    await seedTwoFactor({ userId: user.id })

    const challenge = await issueAuthorizationChallenge({
      userId: user.id,
      fingerprint: 'fp-auth-login-2fa-totp',
    })

    const response = await requestBackend({
      path: '/api/v1/auth/login/2fa',
      method: 'POST',
      headers: { 'CF-Connecting-IP': nextIp() },
      json: {
        authorizationCode: challenge.authorizationCode,
        codeVerifier: challenge.codeVerifier,
        fingerprint: challenge.fingerprint,
        remember: false,
        token: createValidTotpToken(TEST_TOTP_SECRET),
        trustBrowser: false,
      },
    })

    expect(response.status).toBe(200)
    expect(getSetCookieNames(response)).toEqual(expect.arrayContaining(['at', 'ah']))
    expect(getSetCookieNames(response)).not.toContain('rt')

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

    const persistedUser = await readUserById(user.id)
    expect(persistedUser?.loginAt).toBeInstanceOf(Date)
  })

  test('유효한 backup code는 소모되고 남은 개수를 반환한다', async () => {
    const user = await seedUser({ loginAt: null, logoutAt: null })
    await seedTwoFactor({ userId: user.id })
    const { codes } = await seedTwoFactorBackupCodes(user.id, 3)

    const challenge = await issueAuthorizationChallenge({
      userId: user.id,
      fingerprint: 'fp-auth-login-2fa-backup',
    })

    const response = await requestBackend({
      path: '/api/v1/auth/login/2fa',
      method: 'POST',
      headers: { 'CF-Connecting-IP': nextIp() },
      json: {
        authorizationCode: challenge.authorizationCode,
        codeVerifier: challenge.codeVerifier,
        fingerprint: challenge.fingerprint,
        remember: false,
        token: codes[0]!,
        trustBrowser: false,
      },
    })

    expect(response.status).toBe(200)
    expect(getSetCookieNames(response)).toEqual(expect.arrayContaining(['at', 'ah']))

    const body = await response.json()

    expect(body).toMatchObject({
      id: user.id,
      loginId: user.loginId,
      name: user.name,
      lastLogoutAt: null,
      isBackupCode: true,
      backupCodeCount: 2,
    })

    expect(typeof body.lastLoginAt).toBe('string')

    const remainingBackupCodes = await readTwoFactorBackupCodes(user.id)
    expect(remainingBackupCodes).toHaveLength(2)
  })

  test('trustBrowser=true 와 TOTP 인증이면 trusted browser 쿠키와 세션을 함께 발급한다', async () => {
    const user = await seedUser({ loginAt: null, logoutAt: null })
    await seedTwoFactor({ userId: user.id })

    const challenge = await issueAuthorizationChallenge({
      userId: user.id,
      fingerprint: 'fp-auth-login-2fa-trusted',
    })

    const response = await requestBackend({
      path: '/api/v1/auth/login/2fa',
      method: 'POST',
      headers: {
        'CF-Connecting-IP': nextIp(),
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Safari/605.1.15',
      },
      json: {
        authorizationCode: challenge.authorizationCode,
        codeVerifier: challenge.codeVerifier,
        fingerprint: challenge.fingerprint,
        remember: true,
        token: createValidTotpToken(TEST_TOTP_SECRET),
        trustBrowser: true,
      },
    })

    expect(response.status).toBe(200)
    expect(getSetCookieNames(response)).toEqual(expect.arrayContaining(['at', 'rt', 'ah', 'tbt']))

    const trustedBrowsers = await readTrustedBrowsersForUser(user.id)
    expect(trustedBrowsers).toHaveLength(1)
    expect(trustedBrowsers[0]?.browserName).toBeTruthy()

    const sessionFamilies = await readSessionFamiliesForUser(user.id)
    expect(sessionFamilies).toHaveLength(1)
  })

  test('authorization code 가 유효하지 않으면 401을 반환한다', async () => {
    const user = await seedUser()
    await seedTwoFactor({ userId: user.id })

    const response = await requestBackend({
      path: '/api/v1/auth/login/2fa',
      method: 'POST',
      headers: { 'CF-Connecting-IP': nextIp() },
      json: {
        authorizationCode: 'invalid-authorization-code',
        codeVerifier: 'verifier-verifier-verifier-verifier-verifier-123456',
        fingerprint: 'fp-auth-login-2fa-invalid-code',
        remember: false,
        token: '000000',
        trustBrowser: false,
      },
    })

    expect(response.status).toBe(401)

    expect(await response.json()).toMatchObject({
      status: 401,
      detail: '인증이 만료됐어요. 새로고침 후 시도해 주세요.',
    })
  })

  test('유효하지 않은 TOTP 는 400을 반환한다', async () => {
    const user = await seedUser()
    await seedTwoFactor({ userId: user.id })
    const challenge = await issueAuthorizationChallenge({
      userId: user.id,
      fingerprint: 'fp-auth-login-2fa-invalid-token',
    })

    const response = await requestBackend({
      path: '/api/v1/auth/login/2fa',
      method: 'POST',
      headers: { 'CF-Connecting-IP': nextIp() },
      json: {
        authorizationCode: challenge.authorizationCode,
        codeVerifier: challenge.codeVerifier,
        fingerprint: challenge.fingerprint,
        remember: false,
        token: '000000',
        trustBrowser: false,
      },
    })

    expect(response.status).toBe(400)

    expect(await response.json()).toMatchObject({
      status: 400,
      detail: '인증 코드를 확인해 주세요',
    })
  })

  test('반복된 2단계 인증 실패는 representative 429를 반환한다', async () => {
    const user = await seedUser()
    await seedTwoFactor({ userId: user.id })
    const rateLimitedIp = nextIp()
    let blockedResponse: Response | null = null

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const challenge = await issueAuthorizationChallenge({
        userId: user.id,
        fingerprint: `fp-auth-login-2fa-rate-limit-${attempt}`,
      })

      const response = await requestBackend({
        path: '/api/v1/auth/login/2fa',
        method: 'POST',
        headers: { 'CF-Connecting-IP': rateLimitedIp },
        json: {
          authorizationCode: challenge.authorizationCode,
          codeVerifier: challenge.codeVerifier,
          fingerprint: challenge.fingerprint,
          remember: false,
          token: '000000',
          trustBrowser: false,
        },
      })

      if (response.status === 429) {
        blockedResponse = response
        break
      }

      expect(response.status).toBe(400)
    }

    expect(blockedResponse).not.toBeNull()
    expect(blockedResponse!.headers.get('Retry-After')).not.toBeNull()
    expect(await blockedResponse!.json()).toMatchObject({ status: 429 })
  })
})
