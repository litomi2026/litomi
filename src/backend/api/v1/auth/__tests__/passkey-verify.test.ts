import { afterAll, beforeAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'

import type { Env } from '@/backend'
import type { ValidationProblemDetails } from '@/utils/problem-details'

import { CookieKey } from '@/constants/storage'

import type { POSTV1AuthPasskeyVerifyResponse } from '../passkey/verify/POST'

type MockCredential = {
  credentialId: string
  counter: number
  publicKey: string
  userId: number
}

type MockUser = {
  id: number
  loginId: string
  name: string
  lastLoginAt: Date | null
  lastLogoutAt: Date | null
}

type PasskeyVerifyRouteModule = typeof import('../passkey/verify/POST')

let route: PasskeyVerifyRouteModule['default']
let requestSequence = 0

const issueAuthCookiesMock = mock(async () => [
  {
    key: 'at',
    value: 'access-token',
    options: {
      httpOnly: true,
      sameSite: 'strict' as const,
      secure: true,
    },
  },
  {
    key: 'ah',
    value: '1',
    options: {
      httpOnly: false,
      sameSite: 'strict' as const,
      secure: true,
    },
  },
])
const getAndDeleteChallengeMock = mock(async () => passkeyState.challenge)
const readCredentialByCredentialIdMock = mock(async () => passkeyState.credential)
const touchCredentialUseMock = mock(async () => {})
const readAdultFlagMock = mock(async () => passkeyState.adult)
const touchUserLoginAtAndReturnProfileMock = mock(async () => passkeyState.user)
const verifyAuthenticationResponseMock = mock(async () => ({
  verified: passkeyState.verified,
  authenticationInfo: passkeyState.authenticationInfo,
}))

const passkeyState: {
  adult: boolean
  authenticationInfo: {
    credentialDeviceType: 'multiDevice' | 'singleDevice'
    newCounter: number
  } | null
  challenge: { challenge: string; turnstileRequired: boolean } | null
  credential: MockCredential | null
  user: MockUser | null
  verified: boolean
} = {
  adult: true,
  authenticationInfo: {
    credentialDeviceType: 'singleDevice',
    newCounter: 42,
  },
  challenge: {
    challenge: 'challenge-value',
    turnstileRequired: false,
  },
  credential: {
    credentialId: 'credential-id',
    counter: 1,
    publicKey: Buffer.from('public-key').toString('base64'),
    userId: 7,
  },
  user: {
    id: 7,
    loginId: 'tester',
    name: 'tester',
    lastLoginAt: null,
    lastLogoutAt: null,
  },
  verified: true,
}

mock.module('@simplewebauthn/server', () => ({
  verifyAuthenticationResponse: verifyAuthenticationResponseMock,
}))

mock.module('@/database/supabase/drizzle', () => ({
  db: {
    transaction: async (callback: (tx: object) => Promise<unknown>) => await callback({}),
  },
}))

mock.module('@/auth/session', () => ({
  getActiveRefreshSession: mock(async () => null),
  issueAuthCookies: issueAuthCookiesMock,
  refreshSession: mock(async () => ({
    ok: false,
    reason: 'invalid' as const,
    cookies: [],
  })),
  revokeAllUserSessions: mock(async () => {}),
  revokeCurrentSession: mock(async () => {}),
}))

mock.module('@/backend/api/v1/auth/query', () => ({
  readAdultFlag: readAdultFlagMock,
  touchUserLoginAt: mock(async () => {}),
  touchUserLoginAtAndReturnProfile: touchUserLoginAtAndReturnProfileMock,
  touchUserLogoutAtAndReturnLoginId: mock(async () => null),
}))

mock.module('@/backend/api/v1/auth/passkey/verify/query', () => ({
  readCredentialByCredentialId: readCredentialByCredentialIdMock,
  touchCredentialUse: touchCredentialUseMock,
}))

mock.module('@/utils/redis-challenge', () => ({
  getAndDeleteChallenge: getAndDeleteChallengeMock,
  storeChallenge: mock(async () => {}),
}))

mock.module('@/utils/turnstile', () => ({
  default: class MockTurnstileValidator {
    getTurnstileErrorMessage() {
      return 'Cloudflare 보안 검증을 완료해 주세요'
    }

    async validate() {
      return {
        success: true,
        action: 'login',
      }
    }
  },
}))

beforeAll(async () => {
  spyOn(console, 'error').mockImplementation(() => {})
  route = (await import('../passkey/verify/POST')).default
})

afterAll(() => {
  mock.restore()
})

beforeEach(() => {
  requestSequence = 0
  issueAuthCookiesMock.mockClear()
  getAndDeleteChallengeMock.mockClear()
  readCredentialByCredentialIdMock.mockClear()
  touchCredentialUseMock.mockClear()
  readAdultFlagMock.mockClear()
  touchUserLoginAtAndReturnProfileMock.mockClear()
  verifyAuthenticationResponseMock.mockClear()

  passkeyState.adult = true
  passkeyState.authenticationInfo = {
    credentialDeviceType: 'singleDevice',
    newCounter: 42,
  }
  passkeyState.challenge = {
    challenge: 'challenge-value',
    turnstileRequired: false,
  }
  passkeyState.credential = {
    credentialId: 'credential-id',
    counter: 1,
    publicKey: Buffer.from('public-key').toString('base64'),
    userId: 7,
  }
  passkeyState.user = {
    id: 7,
    loginId: 'tester',
    name: 'tester',
    lastLoginAt: null,
    lastLogoutAt: null,
  }
  passkeyState.verified = true
})

function buildAuthentication(id = `credential-${Math.random()}`) {
  return {
    id,
    rawId: id,
    response: {
      authenticatorData: 'auth-data',
      clientDataJSON: 'client-data',
      signature: 'signature',
    },
    type: 'public-key' as const,
  }
}

function createApp() {
  const app = new Hono<Env>()
  app.use('*', contextStorage())
  app.route('/passkey/verify', route)
  return app
}

function getNextIPAddress() {
  requestSequence += 1
  return `198.51.100.${requestSequence}`
}

function getSetCookieHeader(response: Response) {
  return Array.from(response.headers.entries())
    .filter(([key]) => key.toLowerCase() === 'set-cookie')
    .map(([, value]) => value)
    .join('\n')
}

function requestPasskeyVerify(
  body: Record<string, unknown>,
  ip = getNextIPAddress(),
  cookie = `${CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT}=attempt-1`,
) {
  return createApp().request('/passkey/verify', {
    method: 'POST',
    headers: {
      'CF-Connecting-IP': ip,
      'Content-Type': 'application/json',
      cookie,
      'user-agent': 'bun-test',
      'x-real-ip': ip,
      'x-forwarded-for': ip,
    },
    body: JSON.stringify({
      authentication: buildAuthentication(),
      remember: false,
      ...body,
    }),
  })
}

describe('POST /api/v1/auth/passkey/verify', () => {
  test('성공하면 counter 를 갱신하고 인증 쿠키를 발급한다', async () => {
    const authentication = buildAuthentication('credential-success')

    const response = await requestPasskeyVerify({ authentication })

    expect(response.status).toBe(200)
    expect(getSetCookieHeader(response)).toContain('at=')
    expect(getSetCookieHeader(response)).toContain('ah=')

    const data = (await response.json()) as POSTV1AuthPasskeyVerifyResponse
    expect(data).toEqual({
      id: 7,
      loginId: 'tester',
      name: 'tester',
      lastLoginAt: null,
      lastLogoutAt: null,
    })
    expect(touchCredentialUseMock).toHaveBeenCalledWith({}, 'credential-success', 42, expect.any(Date))
  })

  test('credential 이 없으면 404 를 반환한다', async () => {
    passkeyState.credential = null

    const response = await requestPasskeyVerify({
      authentication: buildAuthentication('credential-missing'),
    })

    expect(response.status).toBe(404)
    const problem = (await response.json()) as ValidationProblemDetails
    expect(problem.detail).toBe('패스키를 검증할 수 없어요')
    expect(issueAuthCookiesMock).not.toHaveBeenCalled()
  })

  test('패스키 검증에 실패하면 400 을 반환한다', async () => {
    passkeyState.verified = false
    passkeyState.authenticationInfo = null

    const response = await requestPasskeyVerify({
      authentication: buildAuthentication('credential-invalid'),
    })

    expect(response.status).toBe(400)
    const problem = (await response.json()) as ValidationProblemDetails
    expect(problem.detail).toBe('패스키를 검증할 수 없어요')
    expect(issueAuthCookiesMock).not.toHaveBeenCalled()
  })

  test('챌린지가 없으면 400 을 반환한다', async () => {
    passkeyState.challenge = null

    const response = await requestPasskeyVerify({
      authentication: buildAuthentication('credential-no-challenge'),
    })

    expect(response.status).toBe(400)
    const problem = (await response.json()) as ValidationProblemDetails
    expect(problem.detail).toBe('패스키를 검증할 수 없어요')
    expect(issueAuthCookiesMock).not.toHaveBeenCalled()
  })
})
