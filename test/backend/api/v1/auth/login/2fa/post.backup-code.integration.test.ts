import { describe, expect, test } from 'bun:test'
import { getSetCookieNames, requestBackend } from '@test/backend/setup/app'
import {
  readSessionFamiliesForUser,
  readTrustedBrowsersForUser,
  readTwoFactorBackupCodes,
  seedTwoFactor,
  seedTwoFactorBackupCodes,
  seedUser,
} from '@test/backend/setup/db'
import { expectProblemResponse } from '@test/backend/setup/problem'

import { AUTH_TEST_SAFARI_USER_AGENT, buildAuthHeaders, installAuthIntegrationHooks } from '../../fixtures'
import { buildLoginTwoFactorRequest, issueAuthorizationChallenge } from './fixtures'

installAuthIntegrationHooks({ redis: true })

describe('POST /api/v1/auth/login/2fa', () => {
  test('유효한 복구 코드는 소모되고 남은 개수를 반환한다', async () => {
    const user = await seedUser({ id: 2202, loginAt: null, logoutAt: null })
    await seedTwoFactor({ userId: user.id })
    const { codes } = await seedTwoFactorBackupCodes(user.id, 2)

    const challenge = await issueAuthorizationChallenge({
      userId: user.id,
      fingerprint: 'fp-auth-login-2fa-backup',
    })

    const response = await requestBackend({
      path: '/api/v1/auth/login/2fa',
      method: 'POST',
      headers: buildAuthHeaders({ ip: '203.0.113.32' }),
      json: buildLoginTwoFactorRequest(challenge, { token: codes[0]! }),
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
      backupCodeCount: 1,
    })

    expect(typeof body.lastLoginAt).toBe('string')

    const remainingBackupCodes = await readTwoFactorBackupCodes(user.id)
    expect(remainingBackupCodes).toHaveLength(1)
  })

  test('마지막 복구 코드를 사용하면 모두 소진되어 다시 사용할 수 없다', async () => {
    const user = await seedUser({ id: 2214, loginAt: null, logoutAt: null })
    await seedTwoFactor({ userId: user.id })
    const { codes } = await seedTwoFactorBackupCodes(user.id, 1)

    const firstChallenge = await issueAuthorizationChallenge({
      userId: user.id,
      fingerprint: 'fp-auth-login-2fa-last-backup',
    })

    const firstResponse = await requestBackend({
      path: '/api/v1/auth/login/2fa',
      method: 'POST',
      headers: buildAuthHeaders({ ip: '203.0.113.44' }),
      json: buildLoginTwoFactorRequest(firstChallenge, { token: codes[0]! }),
    })

    expect(firstResponse.status).toBe(200)

    const firstCookieNames = getSetCookieNames(firstResponse)
    expect(firstCookieNames).toEqual(expect.arrayContaining(['at', 'ah']))
    expect(firstCookieNames).not.toContain('rt')

    const firstBody = await firstResponse.json()

    expect(firstBody).toMatchObject({
      id: user.id,
      loginId: user.loginId,
      name: user.name,
      lastLogoutAt: null,
      isBackupCode: true,
      backupCodeCount: 0,
    })

    expect(await readTwoFactorBackupCodes(user.id)).toHaveLength(0)

    const reusedChallenge = await issueAuthorizationChallenge({
      userId: user.id,
      fingerprint: 'fp-auth-login-2fa-last-backup-retry',
    })

    const reusedResponse = await requestBackend({
      path: '/api/v1/auth/login/2fa',
      method: 'POST',
      headers: buildAuthHeaders({ ip: '203.0.113.45' }),
      json: buildLoginTwoFactorRequest(reusedChallenge, { token: codes[0]! }),
    })

    expect(reusedResponse.status).toBe(400)
    expect(getSetCookieNames(reusedResponse)).toEqual([])

    await expectProblemResponse(reusedResponse, {
      status: 400,
      code: 'two-factor-token-invalid',
      instance: '/api/v1/auth/login/2fa',
    })

    expect(await readTwoFactorBackupCodes(user.id)).toHaveLength(0)
  })

  test('복구 코드 인증에서는 trustBrowser=true여도 신뢰할 수 있는 브라우저를 만들지 않는다', async () => {
    const user = await seedUser({ id: 2204, loginAt: null, logoutAt: null })
    await seedTwoFactor({ userId: user.id })
    const { codes } = await seedTwoFactorBackupCodes(user.id, 2)

    const challenge = await issueAuthorizationChallenge({
      userId: user.id,
      fingerprint: 'fp-auth-login-2fa-backup-trusted',
    })

    const response = await requestBackend({
      path: '/api/v1/auth/login/2fa',
      method: 'POST',
      headers: buildAuthHeaders({
        ip: '203.0.113.34',
        userAgent: AUTH_TEST_SAFARI_USER_AGENT,
      }),
      json: buildLoginTwoFactorRequest(challenge, {
        remember: true,
        token: codes[0]!,
        trustBrowser: true,
      }),
    })

    expect(response.status).toBe(200)

    const cookieNames = getSetCookieNames(response)
    expect(cookieNames).toEqual(expect.arrayContaining(['at', 'rt', 'ah']))
    expect(cookieNames).not.toContain('tbt')

    const body = await response.json()
    expect(body.isBackupCode).toBe(true)
    expect(body.backupCodeCount).toBe(1)

    const trustedBrowsers = await readTrustedBrowsersForUser(user.id)
    expect(trustedBrowsers).toHaveLength(0)

    const sessionFamilies = await readSessionFamiliesForUser(user.id)
    expect(sessionFamilies).toHaveLength(1)
  })
})
