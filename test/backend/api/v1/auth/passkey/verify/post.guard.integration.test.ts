import { getAndDeleteChallenge } from '@litomi/auth/redis-challenge'
import { ChallengeType } from '@litomi/domain/auth/model'
import { CookieKey } from '@litomi/http/cookie'
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
import { expectProblemResponse } from '@test/backend/setup/problem'
import { afterEach, describe, expect, mock, spyOn, test } from 'bun:test'

import { buildAuthHeaders, installAuthIntegrationHooks } from '../../fixtures'
import { buildPasskeyAuthentication, installPasskeyTurnstileGuard, issuePasskeyAttempt } from '../fixtures'

type VerifyAuthenticationResult = Awaited<ReturnType<typeof SimpleWebAuthnServer.verifyAuthenticationResponse>>

installAuthIntegrationHooks({ redis: true })

afterEach(() => {
  mock.restore()
})

describe('POST /api/v1/auth/passkey/verify', () => {
  test('유효하지 않은 요청 본문이면 400 invalid-input을 반환한다', async () => {
    const response = await requestBackend({
      path: '/api/v1/auth/passkey/verify',
      method: 'POST',
      headers: buildAuthHeaders({ ip: '203.0.113.171' }),
      json: {
        authentication: {
          id: 'test-passkey-invalid-payload',
        },
      },
    })

    expect(response.status).toBe(400)
    expect(getSetCookieNames(response)).toEqual([])

    await expectProblemResponse(response, {
      status: 400,
      code: 'invalid-input',
      instance: '/api/v1/auth/passkey/verify',
    })
  })

  test('pkai 쿠키가 없으면 400을 반환하고 쿠키를 정리한다', async () => {
    const response = await requestBackend({
      path: '/api/v1/auth/passkey/verify',
      method: 'POST',
      headers: buildAuthHeaders({ ip: '203.0.113.172' }),
      json: {
        authentication: buildPasskeyAuthentication({ id: 'test-passkey-missing-pkai' }),
        remember: false,
      },
    })

    expect(response.status).toBe(400)
    expectCookieCleared(response, CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT)
    expectNoAuthCookies(getSetCookieNames(response))

    await expectProblemResponse(response, {
      status: 400,
      code: 'bad-request',
      detail: '패스키를 검증할 수 없어요',
      instance: '/api/v1/auth/passkey/verify',
    })
  })

  test('Redis challenge가 없으면 400을 반환하고 쿠키를 정리한다', async () => {
    const { pkai } = await issuePasskeyAttempt({ ip: '203.0.113.173' })

    await getAndDeleteChallenge(pkai, ChallengeType.AUTHENTICATION)

    const response = await requestBackend({
      path: '/api/v1/auth/passkey/verify',
      method: 'POST',
      headers: buildAuthHeaders({ ip: '203.0.113.173' }),
      cookies: `${CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT}=${pkai}`,
      json: {
        authentication: buildPasskeyAuthentication({ id: 'test-passkey-missing-challenge' }),
        remember: false,
      },
    })

    expect(response.status).toBe(400)
    expectCookieCleared(response, CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT)
    expectNoAuthCookies(getSetCookieNames(response))

    await expectProblemResponse(response, {
      status: 400,
      code: 'bad-request',
      detail: '패스키를 검증할 수 없어요',
      instance: '/api/v1/auth/passkey/verify',
    })
  })

  test('turnstileRequired=true인데 토큰이 없으면 400을 반환한다', async () => {
    const { pkai, turnstileRequired } = await issuePasskeyAttempt({
      ip: '203.0.113.174',
      attempts: 4,
    })

    expect(turnstileRequired).toBe(true)

    const response = await requestBackend({
      path: '/api/v1/auth/passkey/verify',
      method: 'POST',
      headers: buildAuthHeaders({ ip: '203.0.113.174' }),
      cookies: `${CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT}=${pkai}`,
      json: {
        authentication: buildPasskeyAuthentication({ id: 'test-passkey-turnstile-required' }),
        remember: false,
      },
    })

    expect(response.status).toBe(400)
    expectCookieCleared(response, CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT)
    expectNoAuthCookies(getSetCookieNames(response))

    await expectProblemResponse(response, {
      status: 400,
      code: 'bad-request',
      detail: 'Cloudflare 보안 검증을 완료해 주세요',
      instance: '/api/v1/auth/passkey/verify',
    })
  })

  test('Turnstile 검증이 실패하면 400 human-verification-failed를 반환한다', async () => {
    const fetchGuard = installPasskeyTurnstileGuard('failure')

    try {
      const { pkai, turnstileRequired } = await issuePasskeyAttempt({
        ip: '203.0.113.175',
        attempts: 4,
      })

      expect(turnstileRequired).toBe(true)

      const response = await requestBackend({
        path: '/api/v1/auth/passkey/verify',
        method: 'POST',
        headers: buildAuthHeaders({ ip: '203.0.113.175' }),
        cookies: `${CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT}=${pkai}`,
        json: {
          authentication: buildPasskeyAuthentication({ id: 'test-passkey-turnstile-failure' }),
          remember: false,
          turnstileToken: 'turnstile-failed',
        },
      })

      expect(response.status).toBe(400)
      expectCookieCleared(response, CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT)
      expectNoAuthCookies(getSetCookieNames(response))

      await expectProblemResponse(response, {
        status: 400,
        code: 'human-verification-failed',
        instance: '/api/v1/auth/passkey/verify',
      })
    } finally {
      fetchGuard.restore()
    }
  })

  test('Turnstile 검증 중 외부 오류가 나면 400 human-verification-failed를 반환한다', async () => {
    const fetchGuard = installPasskeyTurnstileGuard('error')

    try {
      const { pkai, turnstileRequired } = await issuePasskeyAttempt({
        ip: '203.0.113.181',
        attempts: 4,
      })

      expect(turnstileRequired).toBe(true)

      const response = await requestBackend({
        path: '/api/v1/auth/passkey/verify',
        method: 'POST',
        headers: buildAuthHeaders({ ip: '203.0.113.181' }),
        cookies: `${CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT}=${pkai}`,
        json: {
          authentication: buildPasskeyAuthentication({ id: 'test-passkey-turnstile-error' }),
          remember: false,
          turnstileToken: 'turnstile-error',
        },
      })

      expect(response.status).toBe(400)
      expectCookieCleared(response, CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT)
      expectNoAuthCookies(getSetCookieNames(response))

      await expectProblemResponse(response, {
        status: 400,
        code: 'human-verification-failed',
        detail: '일시적인 오류가 발생했어요',
        instance: '/api/v1/auth/passkey/verify',
      })
    } finally {
      fetchGuard.restore()
    }
  })

  test('알 수 없는 자격 증명이면 404를 반환한다', async () => {
    const { pkai } = await issuePasskeyAttempt({ ip: '203.0.113.176' })

    const response = await requestBackend({
      path: '/api/v1/auth/passkey/verify',
      method: 'POST',
      headers: buildAuthHeaders({ ip: '203.0.113.176' }),
      cookies: `${CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT}=${pkai}`,
      json: {
        authentication: buildPasskeyAuthentication({ id: 'test-passkey-unknown-credential' }),
        remember: false,
      },
    })

    expect(response.status).toBe(404)
    expectCookieCleared(response, CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT)
    expectNoAuthCookies(getSetCookieNames(response))

    await expectProblemResponse(response, {
      status: 404,
      code: 'not-found',
      detail: '패스키를 검증할 수 없어요',
      instance: '/api/v1/auth/passkey/verify',
    })
  })

  test('검증기가 verified=false를 반환하면 400을 반환하고 부작용이 없다', async () => {
    const user = await seedUser({ loginAt: null, logoutAt: null })

    const credential = await seedPasskeyCredential({
      userId: user.id,
      credentialId: 'test-passkey-verify-false',
      counter: 5,
      lastUsedAt: null,
    })

    const { pkai } = await issuePasskeyAttempt({ ip: '203.0.113.177' })

    spyOn(SimpleWebAuthnServer, 'verifyAuthenticationResponse').mockResolvedValue(buildInvalidVerificationResult(false))

    const response = await requestBackend({
      path: '/api/v1/auth/passkey/verify',
      method: 'POST',
      headers: buildAuthHeaders({ ip: '203.0.113.177' }),
      cookies: `${CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT}=${pkai}`,
      json: {
        authentication: buildPasskeyAuthentication({ id: credential.credentialId }),
        remember: false,
      },
    })

    expect(response.status).toBe(400)
    expectCookieCleared(response, CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT)
    expectNoAuthCookies(getSetCookieNames(response))

    await expectProblemResponse(response, {
      status: 400,
      code: 'bad-request',
      detail: '패스키를 검증할 수 없어요',
      instance: '/api/v1/auth/passkey/verify',
    })

    const [persistedUser, persistedCredential, sessionFamilies] = await Promise.all([
      readUserById(user.id),
      readPasskeyCredentialByCredentialId(credential.credentialId),
      readSessionFamiliesForUser(user.id),
    ])

    expect(persistedUser?.loginAt).toBeNull()
    expect(persistedCredential?.counter).toBe(5)
    expect(persistedCredential?.lastUsedAt).toBeNull()
    expect(sessionFamilies).toHaveLength(0)
  })

  test('검증 결과에 authenticationInfo가 없으면 400을 반환하고 부작용이 없다', async () => {
    const user = await seedUser({ loginAt: null, logoutAt: null })

    const credential = await seedPasskeyCredential({
      userId: user.id,
      credentialId: 'test-passkey-no-auth-info',
      counter: 6,
      lastUsedAt: null,
    })

    const { pkai } = await issuePasskeyAttempt({ ip: '203.0.113.178' })

    spyOn(SimpleWebAuthnServer, 'verifyAuthenticationResponse').mockResolvedValue(buildInvalidVerificationResult(true))

    const response = await requestBackend({
      path: '/api/v1/auth/passkey/verify',
      method: 'POST',
      headers: buildAuthHeaders({ ip: '203.0.113.178' }),
      cookies: `${CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT}=${pkai}`,
      json: {
        authentication: buildPasskeyAuthentication({ id: credential.credentialId }),
        remember: false,
      },
    })

    expect(response.status).toBe(400)
    expectCookieCleared(response, CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT)
    expectNoAuthCookies(getSetCookieNames(response))

    await expectProblemResponse(response, {
      status: 400,
      code: 'bad-request',
      detail: '패스키를 검증할 수 없어요',
      instance: '/api/v1/auth/passkey/verify',
    })

    const [persistedUser, persistedCredential, sessionFamilies] = await Promise.all([
      readUserById(user.id),
      readPasskeyCredentialByCredentialId(credential.credentialId),
      readSessionFamiliesForUser(user.id),
    ])

    expect(persistedUser?.loginAt).toBeNull()
    expect(persistedCredential?.counter).toBe(6)
    expect(persistedCredential?.lastUsedAt).toBeNull()
    expect(sessionFamilies).toHaveLength(0)
  })

  test('같은 authentication.id로 반복 실패하면 429를 반환한다', async () => {
    const authenticationId = 'test-passkey-verify-rate-limit'

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await requestBackend({
        path: '/api/v1/auth/passkey/verify',
        method: 'POST',
        headers: buildAuthHeaders({ ip: '203.0.113.179' }),
        json: {
          authentication: buildPasskeyAuthentication({ id: authenticationId }),
          remember: false,
        },
      })

      expect(response.status).toBe(400)
    }

    const blockedResponse = await requestBackend({
      path: '/api/v1/auth/passkey/verify',
      method: 'POST',
      headers: buildAuthHeaders({ ip: '203.0.113.179' }),
      json: {
        authentication: buildPasskeyAuthentication({ id: authenticationId }),
        remember: false,
      },
    })

    expect(blockedResponse.status).toBe(429)
    expect(blockedResponse.headers.get('Retry-After')).not.toBeNull()
    expect(getSetCookieNames(blockedResponse)).toEqual([])

    await expectProblemResponse(blockedResponse, {
      status: 429,
      code: 'too-many-requests',
      instance: '/api/v1/auth/passkey/verify',
    })
  })

  test('검증기가 예외를 던지면 400을 반환하고 부작용이 없다', async () => {
    const user = await seedUser({ loginAt: null, logoutAt: null })

    const credential = await seedPasskeyCredential({
      userId: user.id,
      credentialId: 'test-passkey-verify-throws',
      counter: 9,
      lastUsedAt: null,
    })

    const { pkai } = await issuePasskeyAttempt({ ip: '203.0.113.180' })

    spyOn(SimpleWebAuthnServer, 'verifyAuthenticationResponse').mockRejectedValue(new Error('passkey verifier failed'))

    const response = await requestBackend({
      path: '/api/v1/auth/passkey/verify',
      method: 'POST',
      headers: buildAuthHeaders({ ip: '203.0.113.180' }),
      cookies: `${CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT}=${pkai}`,
      json: {
        authentication: buildPasskeyAuthentication({ id: credential.credentialId }),
        remember: false,
      },
    })

    expect(response.status).toBe(400)
    expectCookieCleared(response, CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT)
    expectNoAuthCookies(getSetCookieNames(response))

    await expectProblemResponse(response, {
      status: 400,
      code: 'bad-request',
      detail: '패스키를 검증할 수 없어요',
      instance: '/api/v1/auth/passkey/verify',
    })

    const [persistedUser, persistedCredential, sessionFamilies] = await Promise.all([
      readUserById(user.id),
      readPasskeyCredentialByCredentialId(credential.credentialId),
      readSessionFamiliesForUser(user.id),
    ])

    expect(persistedUser?.loginAt).toBeNull()
    expect(persistedCredential?.counter).toBe(9)
    expect(persistedCredential?.lastUsedAt).toBeNull()
    expect(sessionFamilies).toHaveLength(0)
  })
})

function buildInvalidVerificationResult(verified: boolean) {
  return {
    verified,
    authenticationInfo: undefined as never,
  } as VerifyAuthenticationResult
}

function expectNoAuthCookies(cookieNames: string[]) {
  expect(cookieNames).not.toContain('at')
  expect(cookieNames).not.toContain('rt')
  expect(cookieNames).not.toContain('ah')
}
