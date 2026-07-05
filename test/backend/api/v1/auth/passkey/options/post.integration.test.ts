import { afterEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { CookieKey } from '@litomi/http/cookie'
import * as SimpleWebAuthnServer from '@simplewebauthn/server'
import { getSetCookieNames, requestBackend } from '@test/backend/setup/app'
import { expectProblemResponse } from '@test/backend/setup/problem'

import { buildAuthHeaders, installAuthIntegrationHooks } from '../../fixtures'
import { getResponseCookieValue } from '../fixtures'

installAuthIntegrationHooks({ redis: true })

afterEach(() => {
  mock.restore()
})

describe('POST /api/v1/auth/passkey/options', () => {
  test('인증 옵션과 시도 쿠키를 발급한다', async () => {
    const response = await requestBackend({
      path: '/api/v1/auth/passkey/options',
      method: 'POST',
      headers: buildAuthHeaders({ ip: '203.0.113.151' }),
    })

    expect(response.status).toBe(200)
    expect(getSetCookieNames(response)).toEqual(expect.arrayContaining([CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT]))

    const attemptCookie = getResponseCookieValue(response, CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT)
    const body = await response.json()

    expect(attemptCookie).toBeTruthy()
    expect(body.turnstileRequired).toBe(false)
    expect(body.options.userVerification).toBe('required')
    expect(typeof body.options.challenge).toBe('string')
    expect(body.options.challenge.length).toBeGreaterThan(0)
  })

  test('같은 IP에서 반복 요청하면 임계치에서 turnstileRequired=true로 전환된다', async () => {
    const turnstileFlags: boolean[] = []

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await requestBackend({
        path: '/api/v1/auth/passkey/options',
        method: 'POST',
        headers: buildAuthHeaders({ ip: '203.0.113.152' }),
      })

      expect(response.status).toBe(200)
      expect(getResponseCookieValue(response, CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT)).toBeTruthy()

      const body = await response.json()
      turnstileFlags.push(body.turnstileRequired)
    }

    expect(turnstileFlags).toEqual([false, false, false, true])
  })

  test('허용량을 초과하면 429를 반환하고 새 시도 쿠키를 발급하지 않는다', async () => {
    const rateLimitedIp = '203.0.113.153'

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await requestBackend({
        path: '/api/v1/auth/passkey/options',
        method: 'POST',
        headers: buildAuthHeaders({ ip: rateLimitedIp }),
      })

      expect(response.status).toBe(200)
    }

    const blockedResponse = await requestBackend({
      path: '/api/v1/auth/passkey/options',
      method: 'POST',
      headers: buildAuthHeaders({ ip: rateLimitedIp }),
    })

    expect(blockedResponse.status).toBe(429)
    expect(blockedResponse.headers.get('Retry-After')).not.toBeNull()
    expect(getSetCookieNames(blockedResponse)).toEqual([])
    expect(getResponseCookieValue(blockedResponse, CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT)).toBeNull()

    await expectProblemResponse(blockedResponse, {
      status: 429,
      code: 'too-many-requests',
      instance: '/api/v1/auth/passkey/options',
    })
  })

  test('옵션 생성 중 예외가 나면 500을 반환하고 시도 쿠키를 남기지 않는다', async () => {
    spyOn(console, 'error').mockImplementation(() => {})
    spyOn(SimpleWebAuthnServer, 'generateAuthenticationOptions').mockRejectedValue(new Error('options failed'))

    const response = await requestBackend({
      path: '/api/v1/auth/passkey/options',
      method: 'POST',
      headers: buildAuthHeaders({ ip: '203.0.113.154' }),
    })

    expect(response.status).toBe(500)
    expect(getSetCookieNames(response)).toEqual([])
    expect(getResponseCookieValue(response, CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT)).toBeNull()

    await expectProblemResponse(response, {
      status: 500,
      code: 'internal-server-error',
      title: '서버 오류가 발생했어요',
      instance: '/api/v1/auth/passkey/options',
    })
  })
})
