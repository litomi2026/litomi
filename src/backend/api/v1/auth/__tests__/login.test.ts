import { afterAll, beforeAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'

import type { Env } from '@/backend'
import type { ValidationProblemDetails } from '@/utils/problem-details'

import { CookieKey } from '@/constants/storage'

import type { POSTV1AuthLoginAuthenticatedResponse, POSTV1AuthLoginTwoFactorResponse } from '../login/POST'

type LoginRouteModule = typeof import('../login/POST')

type LoginTurnstileValidationInput = {
  token: string | null
}

type MockLoginUser = {
  id: number
  name: string
  passwordHash: string
  lastLoginAt: Date | null
  lastLogoutAt: Date | null
}

let loginRoute: LoginRouteModule['default']
let requestSequence = 0
const TEST_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36'

const compareMock = mock(async () => loginState.isPasswordValid)
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
const revokeCurrentSessionMock = mock(async () => {})
const verifyTrustedBrowserTokenMock = mock(async (token: string | undefined) =>
  token ? loginState.trustedBrowserTokenData : null,
)
const getTrustedBrowserCookieConfigMock = (token: string) => ({
  key: 'tbt',
  value: token,
  options: {
    domain: 'localhost',
    httpOnly: true,
    path: '/',
    sameSite: 'strict' as const,
    secure: true,
  },
})
const signTrustedBrowserTokenMock = mock(async () => 'trusted-browser-token')
const initiatePKCEChallengeMock = mock(async () => ({ authorizationCode: 'auth-code-123' }))
const readLoginUserByLoginIdMock = mock(async () => loginState.user)
const hasActiveTwoFactorMock = mock(async () => loginState.twoFactorEnabled)
const touchTrustedBrowserLastUsedAtMock = mock(async () => loginState.trustedBrowserRecordExists)
const readAdultFlagMock = mock(async () => loginState.adult)
const touchUserLoginAtMock = mock(async () => {})

const loginState: {
  adult: boolean
  isPasswordValid: boolean
  trustedBrowserRecordExists: boolean
  trustedBrowserTokenData: { browserId: string; fingerprint: string; userId: number } | null
  twoFactorEnabled: boolean
  user: MockLoginUser | null
} = {
  user: {
    id: 7,
    name: 'tester',
    passwordHash: 'stored-hash',
    lastLoginAt: null,
    lastLogoutAt: null,
  },
  twoFactorEnabled: false,
  trustedBrowserRecordExists: false,
  trustedBrowserTokenData: null,
  adult: true,
  isPasswordValid: true,
}

mock.module('bcryptjs', () => ({
  compare: compareMock,
  hash: mock(async () => 'hashed'),
}))

mock.module('@/backend/api/v1/auth/session.query', () => ({
  issueAuthCookies: issueAuthCookiesMock,
  revokeCurrentSession: revokeCurrentSessionMock,
}))

mock.module('@/backend/api/v1/auth/login/util', () => ({
  TRUSTED_BROWSER_EXPIRY_DAYS: 30,
  getTrustedBrowserCookieConfig: getTrustedBrowserCookieConfigMock,
  signTrustedBrowserToken: signTrustedBrowserTokenMock,
  verifyTrustedBrowserToken: verifyTrustedBrowserTokenMock,
}))

mock.module('@/backend/api/v1/auth/query', () => ({
  readAdultFlag: readAdultFlagMock,
  touchUserLoginAt: touchUserLoginAtMock,
  touchUserLoginAtAndReturnProfile: mock(async () => loginState.user),
  touchUserLogoutAtAndReturnLoginId: mock(async () => null),
}))

mock.module('@/backend/api/v1/auth/login/query', () => ({
  hasActiveTwoFactor: hasActiveTwoFactorMock,
  readLoginUserByLoginId: readLoginUserByLoginIdMock,
  touchTrustedBrowserLastUsedAt: touchTrustedBrowserLastUsedAtMock,
}))

mock.module('@/utils/pkce-server', () => ({
  initiatePKCEChallenge: initiatePKCEChallengeMock,
  verifyPKCEChallenge: mock(async () => ({ valid: false })),
}))

mock.module('@/utils/turnstile', () => ({
  default: class MockTurnstileValidator {
    getTurnstileErrorMessage() {
      return 'Cloudflare 보안 검증을 완료해 주세요'
    }

    async validate({ token }: LoginTurnstileValidationInput) {
      if (token === 'invalid-turnstile' || token === 'invalid') {
        return {
          success: false,
          'error-codes': ['invalid-input-response'],
        }
      }

      return {
        success: true,
        action: 'login',
      }
    }
  },
}))

beforeAll(async () => {
  spyOn(console, 'error').mockImplementation(() => {})
  loginRoute = (await import('../login/POST')).default
})

afterAll(() => {
  mock.restore()
})

beforeEach(() => {
  requestSequence = 0
  compareMock.mockClear()
  issueAuthCookiesMock.mockClear()
  revokeCurrentSessionMock.mockClear()
  verifyTrustedBrowserTokenMock.mockClear()
  signTrustedBrowserTokenMock.mockClear()
  initiatePKCEChallengeMock.mockClear()
  readLoginUserByLoginIdMock.mockClear()
  hasActiveTwoFactorMock.mockClear()
  touchTrustedBrowserLastUsedAtMock.mockClear()
  readAdultFlagMock.mockClear()
  touchUserLoginAtMock.mockClear()

  loginState.user = {
    id: 7,
    name: 'tester',
    passwordHash: 'stored-hash',
    lastLoginAt: null,
    lastLogoutAt: null,
  }
  loginState.twoFactorEnabled = false
  loginState.trustedBrowserRecordExists = false
  loginState.trustedBrowserTokenData = null
  loginState.adult = true
  loginState.isPasswordValid = true
})

function buildLoginRequest(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    loginId: `tester${Math.floor(Math.random() * 1_000_000)}`,
    password: 'Password123',
    remember: false,
    turnstileToken: 'valid-turnstile',
    codeChallenge: 'A'.repeat(43),
    fingerprint: `fingerprint-${Math.floor(Math.random() * 1_000_000)}`,
    ...overrides,
  }
}

function createApp() {
  const app = new Hono<Env>()
  app.use('*', contextStorage())
  app.route('/login', loginRoute)
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

function requestLogin(body: Record<string, unknown>, ip = getNextIPAddress(), headers: Record<string, string> = {}) {
  return createApp().request('/login', {
    method: 'POST',
    headers: {
      'CF-Connecting-IP': ip,
      'Content-Type': 'application/json',
      'user-agent': TEST_USER_AGENT,
      'x-real-ip': ip,
      'x-forwarded-for': ip,
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/v1/auth/login', () => {
  test('2FA가 필요 없으면 authenticated 응답과 인증 쿠키를 반환한다', async () => {
    const response = await requestLogin(buildLoginRequest())

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(getSetCookieHeader(response)).toContain('at=')
    expect(getSetCookieHeader(response)).toContain('ah=')

    const data = (await response.json()) as POSTV1AuthLoginAuthenticatedResponse
    expect(data).toEqual({
      nextStep: 'authenticated',
      id: 7,
      loginId: expect.any(String),
      name: 'tester',
      lastLoginAt: null,
      lastLogoutAt: null,
    })

    expect(issueAuthCookiesMock).toHaveBeenCalledWith({
      userId: 7,
      adult: true,
      remember: false,
      deviceLabel: null,
    })
    expect(initiatePKCEChallengeMock).not.toHaveBeenCalled()
    expect(readLoginUserByLoginIdMock).toHaveBeenCalled()
    expect(touchUserLoginAtMock).toHaveBeenCalled()
  })

  test('2FA가 활성화되어 있고 신뢰 브라우저면 바로 authenticated 응답을 반환한다', async () => {
    const fingerprint = `fingerprint-${Math.floor(Math.random() * 1_000_000)}`

    loginState.twoFactorEnabled = true
    loginState.trustedBrowserTokenData = {
      browserId: 'browser-id',
      fingerprint,
      userId: 7,
    }
    loginState.trustedBrowserRecordExists = true

    const response = await requestLogin(buildLoginRequest({ fingerprint }), getNextIPAddress(), {
      cookie: `${CookieKey.TRUSTED_BROWSER_TOKEN}=trusted-token`,
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(getSetCookieHeader(response)).toContain('at=')
    expect(getSetCookieHeader(response)).toContain('ah=')

    const data = (await response.json()) as POSTV1AuthLoginAuthenticatedResponse
    expect(data).toEqual({
      nextStep: 'authenticated',
      id: 7,
      loginId: expect.any(String),
      name: 'tester',
      lastLoginAt: null,
      lastLogoutAt: null,
    })

    expect(verifyTrustedBrowserTokenMock).toHaveBeenCalledWith('trusted-token')
    expect(touchTrustedBrowserLastUsedAtMock).toHaveBeenCalledWith(7, 'browser-id', expect.any(Date))
    expect(initiatePKCEChallengeMock).not.toHaveBeenCalled()
  })

  test('2FA가 활성화되어 있고 신뢰 브라우저가 아니면 authorizationCode를 반환한다', async () => {
    loginState.twoFactorEnabled = true

    const response = await requestLogin(buildLoginRequest({ remember: true }))

    expect(response.status).toBe(200)
    expect(getSetCookieHeader(response)).toBe('')

    const data = (await response.json()) as POSTV1AuthLoginTwoFactorResponse
    expect(data).toEqual({
      nextStep: 'two_factor_required',
      authorizationCode: 'auth-code-123',
    })

    expect(initiatePKCEChallengeMock).toHaveBeenCalledWith(7, 'A'.repeat(43), expect.any(String))
    expect(issueAuthCookiesMock).not.toHaveBeenCalled()
  })

  test('유효하지 않은 trusted browser 토큰이 있으면 루트 경로 쿠키를 지우고 2FA를 요구한다', async () => {
    const fingerprint = `fingerprint-${Math.floor(Math.random() * 1_000_000)}`

    loginState.twoFactorEnabled = true
    loginState.trustedBrowserTokenData = {
      browserId: 'browser-id',
      fingerprint,
      userId: 7,
    }
    loginState.trustedBrowserRecordExists = false

    const response = await requestLogin(buildLoginRequest({ fingerprint }), getNextIPAddress(), {
      cookie: `${CookieKey.TRUSTED_BROWSER_TOKEN}=trusted-token`,
    })

    expect(response.status).toBe(200)
    expect(getSetCookieHeader(response)).toContain('tbt=;')
    expect(getSetCookieHeader(response)).toContain('Path=/')

    const data = (await response.json()) as POSTV1AuthLoginTwoFactorResponse
    expect(data).toEqual({
      nextStep: 'two_factor_required',
      authorizationCode: 'auth-code-123',
    })

    expect(verifyTrustedBrowserTokenMock).toHaveBeenCalledWith('trusted-token')
    expect(touchTrustedBrowserLastUsedAtMock).toHaveBeenCalledWith(7, 'browser-id', expect.any(Date))
    expect(initiatePKCEChallengeMock).toHaveBeenCalledWith(7, 'A'.repeat(43), fingerprint)
    expect(issueAuthCookiesMock).not.toHaveBeenCalled()
  })

  test('비밀번호가 틀리면 401 Problem Details를 반환한다', async () => {
    loginState.isPasswordValid = false

    const response = await requestLogin(buildLoginRequest())

    expect(response.status).toBe(401)
    expect(response.headers.get('content-type')).toContain('application/problem+json')
    expect(getSetCookieHeader(response)).toBe('')

    const problem = (await response.json()) as ValidationProblemDetails
    expect(problem.detail).toBe('아이디 또는 비밀번호가 일치하지 않아요')
    expect(problem.invalidParams).toBeUndefined()
    expect(issueAuthCookiesMock).not.toHaveBeenCalled()
  })
})
