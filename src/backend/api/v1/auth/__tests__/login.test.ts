import { afterAll, beforeAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'

import type { Env } from '@/backend'
import type { ValidationProblemDetails } from '@/utils/problem-details'

import { CookieKey } from '@/constants/storage'
import { trustedBrowserTable } from '@/database/supabase/two-factor'

import type {
  POSTV1AuthLoginAuthenticatedResponse,
  POSTV1AuthLoginTwoFactorResponse,
} from '../login/POST'

type LoginRoutesModule = typeof import('../login')

type MockLoginUser = {
  id: number
  name: string
  passwordHash: string
  lastLoginAt: Date | null
  lastLogoutAt: Date | null
}

let loginRoutes: LoginRoutesModule['default']
let requestSequence = 0

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
const verifyTrustedBrowserTokenMock = mock(async (token: string | undefined) =>
  token ? loginState.trustedBrowserTokenData : null,
)
const initiatePKCEChallengeMock = mock(async () => ({ authorizationCode: 'auth-code-123' }))

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

mock.module('@/utils/trusted-browser', () => ({
  getTrustedBrowserCookieConfig: (token: string) => ({
    key: 'tbt',
    value: token,
    options: {
      domain: 'localhost',
      httpOnly: true,
      path: '/auth/login',
      sameSite: 'strict' as const,
      secure: true,
    },
  }),
  insertTrustedBrowser: mock(async () => 'browser-id'),
  verifyTrustedBrowserToken: verifyTrustedBrowserTokenMock,
}))

mock.module('@/utils/pkce-server', () => ({
  initiatePKCEChallenge: initiatePKCEChallengeMock,
  verifyPKCEChallenge: mock(async () => ({ valid: false })),
}))

mock.module('@/database/supabase/drizzle', () => ({
  db: {
    select: (selection: Record<string, unknown>) => ({
      from: () => ({
        where: () => {
          if ('passwordHash' in selection) {
            return Promise.resolve(loginState.user ? [loginState.user] : [])
          }

          if ('enabled' in selection) {
            return Promise.resolve(loginState.twoFactorEnabled ? [{ enabled: loginState.user?.id ?? 0 }] : [])
          }

          return Promise.resolve(loginState.adult ? [{ adultFlag: true }] : [])
        },
      }),
    }),
    update: (table?: unknown) => ({
      set: () => ({
        where: () => {
          if (table === trustedBrowserTable) {
            return {
              returning: () => Promise.resolve(loginState.trustedBrowserRecordExists ? [{ id: 1 }] : []),
            }
          }

          return Promise.resolve(undefined)
        },
      }),
    }),
    transaction: async (
      callback: (tx: {
        select: (selection: Record<string, unknown>) => {
          from: () => {
            where: () => Promise<Array<{ adultFlag?: boolean; enabled?: number }>>
          }
        }
        update: () => {
          set: () => {
            where: () => Promise<void>
          }
        }
      }) => Promise<unknown>,
    ) =>
      await callback({
        select: (selection: Record<string, unknown>) => ({
          from: () => ({
            where: () => {
              if ('enabled' in selection) {
                return Promise.resolve(loginState.twoFactorEnabled ? [{ enabled: loginState.user?.id ?? 0 }] : [])
              }

              return Promise.resolve(loginState.adult ? [{ adultFlag: true }] : [])
            },
          }),
        }),
        update: () => ({
          set: () => ({
            where: () => Promise.resolve(),
          }),
        }),
      }),
  },
}))

mock.module('@/utils/turnstile', () => ({
  default: class MockTurnstileValidator {
    getTurnstileErrorMessage() {
      return 'Cloudflare 보안 검증을 완료해 주세요'
    }

    async validate({ token }: { token: string | null }) {
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
  loginRoutes = (await import('../login')).default
})

afterAll(() => {
  mock.restore()
})

beforeEach(() => {
  requestSequence = 0
  compareMock.mockClear()
  issueAuthCookiesMock.mockClear()
  verifyTrustedBrowserTokenMock.mockClear()
  initiatePKCEChallengeMock.mockClear()

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
  app.route('/login', loginRoutes)
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
      'user-agent': 'bun-test',
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
      ipAddress: '198.51.100.1',
      userAgent: 'bun-test',
    })
    expect(initiatePKCEChallengeMock).not.toHaveBeenCalled()
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

    const response = await requestLogin(
      buildLoginRequest({ fingerprint }),
      getNextIPAddress(),
      { cookie: `${CookieKey.TRUSTED_BROWSER_TOKEN}=trusted-token` },
    )

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
