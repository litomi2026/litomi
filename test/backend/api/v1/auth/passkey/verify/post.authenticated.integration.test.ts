import type { VerifiedAuthenticationResponse } from '@simplewebauthn/server'

import { WEBAUTHN_ORIGIN, WEBAUTHN_RP_ID } from '@litomi/auth/passkey'
import { CookieKey } from '@litomi/domain/constants/storage'
import * as SimpleWebAuthnServer from '@simplewebauthn/server'
import { getSetCookieNames, requestBackend } from '@test/backend/setup/app'
import { expectCookieCleared, expectPersistentCookie, expectSessionCookie } from '@test/backend/setup/auth'
import {
  readPasskeyCredentialByCredentialId,
  readSessionFamiliesForUser,
  readUserById,
  seedPasskeyCredential,
  seedUser,
} from '@test/backend/setup/db'
import { afterEach, describe, expect, mock, spyOn, test } from 'bun:test'

import { AUTH_TEST_SAFARI_USER_AGENT, buildAuthHeaders, installAuthIntegrationHooks } from '../../fixtures'
import { buildPasskeyAuthentication, installPasskeyTurnstileGuard, issuePasskeyAttempt } from '../fixtures'

installAuthIntegrationHooks({ redis: true })

afterEach(() => {
  mock.restore()
})

describe('POST /api/v1/auth/passkey/verify', () => {
  test('remember=false면 로그인 상태를 유지하지 않고 패스키 로그인을 완료한다', async () => {
    const user = await seedUser({ loginAt: null, logoutAt: null })

    const credential = await seedPasskeyCredential({
      userId: user.id,
      credentialId: 'test-passkey-verify-sessionless',
      counter: 7,
      lastUsedAt: null,
    })

    const { pkai } = await issuePasskeyAttempt({ ip: '203.0.113.161' })

    spyOn(SimpleWebAuthnServer, 'verifyAuthenticationResponse').mockResolvedValue(
      buildVerifiedAuthenticationResponse({
        credentialId: credential.credentialId,
        newCounter: Number(credential.counter) + 1,
      }),
    )

    const response = await requestBackend({
      path: '/api/v1/auth/passkey/verify',
      method: 'POST',
      headers: buildAuthHeaders({ ip: '203.0.113.161' }),
      cookies: `${CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT}=${pkai}`,
      json: {
        authentication: buildPasskeyAuthentication({ id: credential.credentialId }),
        remember: false,
      },
    })

    expect(response.status).toBe(200)

    const cookieNames = getSetCookieNames(response)
    expect(cookieNames).toEqual(expect.arrayContaining(['at', 'ah', CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT]))
    expect(cookieNames).not.toContain('rt')
    expectSessionCookie(response, 'at')
    expectSessionCookie(response, 'ah')
    expectCookieCleared(response, CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT)

    const body = await response.json()

    expect(body).toMatchObject({
      id: user.id,
      loginId: user.loginId,
      name: user.name,
      lastLogoutAt: null,
    })

    expect(typeof body.lastLoginAt).toBe('string')

    const [persistedUser, persistedCredential, sessionFamilies] = await Promise.all([
      readUserById(user.id),
      readPasskeyCredentialByCredentialId(credential.credentialId),
      readSessionFamiliesForUser(user.id),
    ])

    expect(persistedUser?.loginAt).toBeInstanceOf(Date)
    expect(persistedCredential?.counter).toBe(8)
    expect(persistedCredential?.lastUsedAt).toBeInstanceOf(Date)
    expect(sessionFamilies).toHaveLength(0)
  })

  test('remember=true면 로그인 상태를 유지하는 쿠키를 응답하고 패스키 로그인을 완료한다', async () => {
    const user = await seedUser({ loginAt: null, logoutAt: null })

    const credential = await seedPasskeyCredential({
      userId: user.id,
      credentialId: 'test-passkey-verify-remember',
      counter: 3,
      lastUsedAt: null,
    })

    const { pkai } = await issuePasskeyAttempt({ ip: '203.0.113.162' })

    spyOn(SimpleWebAuthnServer, 'verifyAuthenticationResponse').mockResolvedValue(
      buildVerifiedAuthenticationResponse({
        credentialId: credential.credentialId,
        newCounter: Number(credential.counter) + 1,
      }),
    )

    const response = await requestBackend({
      path: '/api/v1/auth/passkey/verify',
      method: 'POST',
      headers: buildAuthHeaders({
        ip: '203.0.113.162',
        userAgent: AUTH_TEST_SAFARI_USER_AGENT,
      }),
      cookies: `${CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT}=${pkai}`,
      json: {
        authentication: buildPasskeyAuthentication({ id: credential.credentialId }),
        remember: true,
      },
    })

    expect(response.status).toBe(200)

    const cookieNames = getSetCookieNames(response)
    expect(cookieNames).toEqual(expect.arrayContaining(['at', 'rt', 'ah', CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT]))
    expectSessionCookie(response, 'at')
    expectPersistentCookie(response, 'rt')
    expectPersistentCookie(response, 'ah')
    expectCookieCleared(response, CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT)

    const body = await response.json()

    expect(body).toMatchObject({
      id: user.id,
      loginId: user.loginId,
      name: user.name,
      lastLogoutAt: null,
    })

    expect(typeof body.lastLoginAt).toBe('string')

    const [persistedUser, persistedCredential, sessionFamilies] = await Promise.all([
      readUserById(user.id),
      readPasskeyCredentialByCredentialId(credential.credentialId),
      readSessionFamiliesForUser(user.id),
    ])

    expect(persistedUser?.loginAt).toBeInstanceOf(Date)
    expect(persistedCredential?.counter).toBe(4)
    expect(persistedCredential?.lastUsedAt).toBeInstanceOf(Date)
    expect(sessionFamilies).toHaveLength(1)
  })

  test('turnstileRequired=true여도 검증을 통과하면 로그인에 성공한다', async () => {
    const user = await seedUser({ loginAt: null, logoutAt: null })

    const credential = await seedPasskeyCredential({
      userId: user.id,
      credentialId: 'test-passkey-verify-turnstile-success',
      counter: 10,
      lastUsedAt: null,
    })

    const fetchGuard = installPasskeyTurnstileGuard('success')

    try {
      const { pkai, turnstileRequired } = await issuePasskeyAttempt({
        ip: '203.0.113.163',
        attempts: 4,
      })

      expect(turnstileRequired).toBe(true)

      spyOn(SimpleWebAuthnServer, 'verifyAuthenticationResponse').mockResolvedValue(
        buildVerifiedAuthenticationResponse({
          credentialId: credential.credentialId,
          newCounter: Number(credential.counter) + 1,
        }),
      )

      const response = await requestBackend({
        path: '/api/v1/auth/passkey/verify',
        method: 'POST',
        headers: buildAuthHeaders({ ip: '203.0.113.163' }),
        cookies: `${CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT}=${pkai}`,
        json: {
          authentication: buildPasskeyAuthentication({ id: credential.credentialId }),
          remember: false,
          turnstileToken: 'turnstile-ok',
        },
      })

      expect(response.status).toBe(200)

      const cookieNames = getSetCookieNames(response)
      expect(cookieNames).toEqual(expect.arrayContaining(['at', 'ah', CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT]))
      expect(cookieNames).not.toContain('rt')
      expectSessionCookie(response, 'at')
      expectSessionCookie(response, 'ah')
      expectCookieCleared(response, CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT)

      const [persistedUser, persistedCredential, sessionFamilies] = await Promise.all([
        readUserById(user.id),
        readPasskeyCredentialByCredentialId(credential.credentialId),
        readSessionFamiliesForUser(user.id),
      ])

      expect(persistedUser?.loginAt).toBeInstanceOf(Date)
      expect(persistedCredential?.counter).toBe(11)
      expect(persistedCredential?.lastUsedAt).toBeInstanceOf(Date)
      expect(sessionFamilies).toHaveLength(0)
    } finally {
      fetchGuard.restore()
    }
  })

  test('성공 후 같은 pkai를 다시 사용하면 리플레이 없이 400으로 차단한다', async () => {
    const user = await seedUser({ loginAt: null, logoutAt: null })

    const credential = await seedPasskeyCredential({
      userId: user.id,
      credentialId: 'test-passkey-verify-replay',
      counter: 2,
      lastUsedAt: null,
    })

    const { pkai } = await issuePasskeyAttempt({ ip: '203.0.113.164' })

    spyOn(SimpleWebAuthnServer, 'verifyAuthenticationResponse').mockResolvedValue(
      buildVerifiedAuthenticationResponse({
        credentialId: credential.credentialId,
        newCounter: Number(credential.counter) + 1,
      }),
    )

    const requestPayload = {
      authentication: buildPasskeyAuthentication({ id: credential.credentialId }),
      remember: false,
    }

    const firstResponse = await requestBackend({
      path: '/api/v1/auth/passkey/verify',
      method: 'POST',
      headers: buildAuthHeaders({ ip: '203.0.113.164' }),
      cookies: `${CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT}=${pkai}`,
      json: requestPayload,
    })

    expect(firstResponse.status).toBe(200)

    const replayResponse = await requestBackend({
      path: '/api/v1/auth/passkey/verify',
      method: 'POST',
      headers: buildAuthHeaders({ ip: '203.0.113.164' }),
      cookies: `${CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT}=${pkai}`,
      json: requestPayload,
    })

    expect(replayResponse.status).toBe(400)
    expectCookieCleared(replayResponse, CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT)

    const replayCookieNames = getSetCookieNames(replayResponse)
    expect(replayCookieNames).not.toContain('at')
    expect(replayCookieNames).not.toContain('rt')
    expect(replayCookieNames).not.toContain('ah')

    const [persistedCredential, sessionFamilies] = await Promise.all([
      readPasskeyCredentialByCredentialId(credential.credentialId),
      readSessionFamiliesForUser(user.id),
    ])

    expect(persistedCredential?.counter).toBe(3)
    expect(persistedCredential?.lastUsedAt).toBeInstanceOf(Date)
    expect(sessionFamilies).toHaveLength(0)
  })

  test('다중 기기 자격 증명은 새 counter 값을 보내도 기존 counter를 유지한다', async () => {
    const user = await seedUser({ loginAt: null, logoutAt: null })

    const credential = await seedPasskeyCredential({
      userId: user.id,
      credentialId: 'test-passkey-verify-multi-device',
      counter: 12,
      lastUsedAt: null,
    })

    const { pkai } = await issuePasskeyAttempt({ ip: '203.0.113.165' })

    spyOn(SimpleWebAuthnServer, 'verifyAuthenticationResponse').mockResolvedValue(
      buildVerifiedAuthenticationResponse({
        credentialId: credential.credentialId,
        newCounter: 999,
        credentialDeviceType: 'multiDevice',
      }),
    )

    const response = await requestBackend({
      path: '/api/v1/auth/passkey/verify',
      method: 'POST',
      headers: buildAuthHeaders({ ip: '203.0.113.165' }),
      cookies: `${CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT}=${pkai}`,
      json: {
        authentication: buildPasskeyAuthentication({ id: credential.credentialId }),
        remember: false,
      },
    })

    expect(response.status).toBe(200)
    expectCookieCleared(response, CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT)

    const [persistedUser, persistedCredential, sessionFamilies] = await Promise.all([
      readUserById(user.id),
      readPasskeyCredentialByCredentialId(credential.credentialId),
      readSessionFamiliesForUser(user.id),
    ])

    expect(persistedUser?.loginAt).toBeInstanceOf(Date)
    expect(persistedCredential?.counter).toBe(12)
    expect(persistedCredential?.lastUsedAt).toBeInstanceOf(Date)
    expect(sessionFamilies).toHaveLength(0)
  })
})

function buildVerifiedAuthenticationResponse({
  credentialId,
  credentialDeviceType = 'singleDevice',
  newCounter,
}: {
  credentialId: string
  credentialDeviceType?: VerifiedAuthenticationResponse['authenticationInfo']['credentialDeviceType']
  newCounter: number
}): VerifiedAuthenticationResponse {
  return {
    verified: true,
    authenticationInfo: {
      credentialID: credentialId,
      newCounter,
      userVerified: true,
      credentialDeviceType,
      credentialBackedUp: false,
      origin: WEBAUTHN_ORIGIN,
      rpID: WEBAUTHN_RP_ID,
    },
  }
}
