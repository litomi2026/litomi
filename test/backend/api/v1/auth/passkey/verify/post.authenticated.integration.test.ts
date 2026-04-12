import type { VerifiedAuthenticationResponse } from '@simplewebauthn/server'

import * as SimpleWebAuthnServer from '@simplewebauthn/server'
import { getSetCookieNames, requestBackend } from '@test/backend/setup/app'
import { expectCookieCleared } from '@test/backend/setup/auth'
import {
  readPasskeyCredentialByCredentialId,
  readSessionFamiliesForUser,
  readUserById,
  seedPasskeyCredential,
  seedUser,
} from '@test/backend/setup/db'
import { afterEach, describe, expect, mock, spyOn, test } from 'bun:test'

import { WEBAUTHN_ORIGIN, WEBAUTHN_RP_ID } from '@/app/(navigation)/(right-search)/[name]/settings/passkey/common'
import { CookieKey } from '@/constants/storage'

import { AUTH_TEST_SAFARI_USER_AGENT, buildAuthHeaders, installAuthIntegrationHooks } from '../../fixtures'
import { buildPasskeyAuthentication, getResponseCookieValue } from '../fixtures'

installAuthIntegrationHooks({ redis: true })

afterEach(() => {
  mock.restore()
})

describe('POST /api/v1/auth/passkey/verify', () => {
  test('remember=false 이면 refresh session 없이 패스키 로그인을 완료한다', async () => {
    const user = await seedUser({ loginAt: null, logoutAt: null })

    const credential = await seedPasskeyCredential({
      userId: user.id,
      credentialId: 'test-passkey-verify-sessionless',
      counter: 7,
      lastUsedAt: null,
    })

    const pkaiCookie = await issuePasskeyAttemptCookie('203.0.113.161')

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
      cookies: `${CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT}=${pkaiCookie}`,
      json: {
        authentication: buildPasskeyAuthentication({ id: credential.credentialId }),
        remember: false,
      },
    })

    expect(response.status).toBe(200)

    const cookieNames = getSetCookieNames(response)
    expect(cookieNames).toEqual(expect.arrayContaining(['at', 'ah', CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT]))
    expect(cookieNames).not.toContain('rt')
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

  test('remember=true 이면 refresh session과 함께 패스키 로그인을 완료한다', async () => {
    const user = await seedUser({ loginAt: null, logoutAt: null })

    const credential = await seedPasskeyCredential({
      userId: user.id,
      credentialId: 'test-passkey-verify-remember',
      counter: 3,
      lastUsedAt: null,
    })

    const pkaiCookie = await issuePasskeyAttemptCookie('203.0.113.162')

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
      cookies: `${CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT}=${pkaiCookie}`,
      json: {
        authentication: buildPasskeyAuthentication({ id: credential.credentialId }),
        remember: true,
      },
    })

    expect(response.status).toBe(200)

    const cookieNames = getSetCookieNames(response)
    expect(cookieNames).toEqual(expect.arrayContaining(['at', 'rt', 'ah', CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT]))
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
})

function buildVerifiedAuthenticationResponse({
  credentialId,
  newCounter,
}: {
  credentialId: string
  newCounter: number
}): VerifiedAuthenticationResponse {
  return {
    verified: true,
    authenticationInfo: {
      credentialID: credentialId,
      newCounter,
      userVerified: true,
      credentialDeviceType: 'singleDevice',
      credentialBackedUp: false,
      origin: WEBAUTHN_ORIGIN,
      rpID: WEBAUTHN_RP_ID,
    },
  }
}

async function issuePasskeyAttemptCookie(ip: string) {
  const response = await requestBackend({
    path: '/api/v1/auth/passkey/options',
    method: 'POST',
    headers: buildAuthHeaders({ ip }),
  })

  expect(response.status).toBe(200)

  const attemptCookie = getResponseCookieValue(response, CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT)

  if (!attemptCookie) {
    throw new Error('passkey authentication attempt cookie should be issued')
  }

  return attemptCookie
}
