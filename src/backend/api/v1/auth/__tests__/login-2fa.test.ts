import { afterAll, beforeAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'

import type { Env } from '@/backend'
import type { ValidationProblemDetails } from '@/utils/problem-details'

import type { POSTV1AuthLogin2FAResponse } from '../login/2fa/POST'

type LoginTwoFactorRouteModule = typeof import('../login/2fa/POST')

type MockTwoFactorUser = {
  id: number
  loginId: string
  name: string
  lastLoginAt: Date | null
  lastLogoutAt: Date | null
}

let route: LoginTwoFactorRouteModule['default']
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
const revokeCurrentSessionMock = mock(async () => {})
const signTrustedBrowserTokenMock = mock(async () => 'trusted-browser-token')
const verifyTrustedBrowserTokenMock = mock(async () => null)
const getTrustedBrowserCookieConfigMock = (token: string) => ({
  key: 'tbt',
  value: token,
  options: {
    domain: 'localhost',
    httpOnly: true,
    path: '/auth/login',
    sameSite: 'strict' as const,
    secure: true,
  },
})
const verifyPKCEChallengeMock = mock(
  async (): Promise<{ valid: boolean; userId?: number }> => ({
    valid: true,
    userId: 7,
  }),
)
const readActiveTwoFactorByUserIdMock = mock(async () => login2faState.twoFactor)
const readBackupCodeHashesByUserIdMock = mock(async () => login2faState.backupCodes)
const deleteBackupCodeByHashMock = mock(async () => {})
const touchTwoFactorLastUsedAtMock = mock(async () => {})
const readAdultFlagMock = mock(async () => login2faState.adult)
const touchUserLoginAtAndReturnProfileMock = mock(async () => login2faState.user)
const registerTrustedBrowserMock = mock(async () => {
  if (login2faState.trustedBrowserRegistrationFails) {
    throw new Error('trusted browser insert failed')
  }

  return 'browser-id'
})
const decryptTOTPSecretMock = mock(() => 'decrypted-secret')
const verifyTOTPTokenMock = mock(async () => login2faState.isTotpValid)
const verifyBackupCodeMock = mock(
  async (_token: string, codeHash: string) => codeHash === login2faState.validBackupCodeHash,
)

const login2faState: {
  adult: boolean
  backupCodes: Array<{ codeHash: string }>
  isTotpValid: boolean
  trustedBrowserRegistrationFails: boolean
  twoFactor: { secret: string } | null
  user: MockTwoFactorUser | null
  validBackupCodeHash: string | null
} = {
  adult: true,
  backupCodes: [],
  isTotpValid: true,
  trustedBrowserRegistrationFails: false,
  twoFactor: { secret: 'encrypted-secret' },
  user: {
    id: 7,
    loginId: 'tester',
    name: 'tester',
    lastLoginAt: null,
    lastLogoutAt: null,
  },
  validBackupCodeHash: null,
}

mock.module('@/database/supabase/drizzle', () => ({
  db: {
    transaction: async (callback: (tx: object) => Promise<unknown>) => await callback({}),
  },
}))

mock.module('@/backend/api/v1/auth/session.query', () => ({
  issueAuthCookies: issueAuthCookiesMock,
  revokeCurrentSession: revokeCurrentSessionMock,
}))

mock.module('@/backend/api/v1/auth/login/2fa/util', () => ({
  TRUSTED_BROWSER_EXPIRY_DAYS: 30,
  getTrustedBrowserCookieConfig: getTrustedBrowserCookieConfigMock,
  signTrustedBrowserToken: signTrustedBrowserTokenMock,
  verifyTrustedBrowserToken: verifyTrustedBrowserTokenMock,
}))

mock.module('@/backend/api/v1/auth/query', () => ({
  readAdultFlag: readAdultFlagMock,
  touchUserLoginAt: mock(async () => {}),
  touchUserLoginAtAndReturnProfile: touchUserLoginAtAndReturnProfileMock,
  touchUserLogoutAtAndReturnLoginId: mock(async () => null),
}))

mock.module('@/backend/api/v1/auth/login/2fa/query', () => ({
  deleteBackupCodeByHash: deleteBackupCodeByHashMock,
  readActiveTwoFactorByUserId: readActiveTwoFactorByUserIdMock,
  readBackupCodeHashesByUserId: readBackupCodeHashesByUserIdMock,
  registerTrustedBrowser: registerTrustedBrowserMock,
  touchTwoFactorLastUsedAt: touchTwoFactorLastUsedAtMock,
}))

mock.module('@/utils/pkce-server', () => ({
  initiatePKCEChallenge: mock(async () => ({ authorizationCode: 'unused' })),
  verifyPKCEChallenge: verifyPKCEChallengeMock,
}))

mock.module('@/utils/two-factor', () => ({
  decryptTOTPSecret: decryptTOTPSecretMock,
  verifyTOTPToken: verifyTOTPTokenMock,
}))

mock.module('@/utils/two-factor-backup-code', () => ({
  verifyBackupCode: verifyBackupCodeMock,
}))

beforeAll(async () => {
  spyOn(console, 'error').mockImplementation(() => {})
  route = (await import('../login/2fa/POST')).default
})

afterAll(() => {
  mock.restore()
})

beforeEach(() => {
  requestSequence = 0
  issueAuthCookiesMock.mockClear()
  revokeCurrentSessionMock.mockClear()
  signTrustedBrowserTokenMock.mockClear()
  verifyTrustedBrowserTokenMock.mockClear()
  verifyPKCEChallengeMock.mockClear()
  readActiveTwoFactorByUserIdMock.mockClear()
  readBackupCodeHashesByUserIdMock.mockClear()
  deleteBackupCodeByHashMock.mockClear()
  touchTwoFactorLastUsedAtMock.mockClear()
  readAdultFlagMock.mockClear()
  touchUserLoginAtAndReturnProfileMock.mockClear()
  registerTrustedBrowserMock.mockClear()
  decryptTOTPSecretMock.mockClear()
  verifyTOTPTokenMock.mockClear()
  verifyBackupCodeMock.mockClear()

  login2faState.adult = true
  login2faState.backupCodes = []
  login2faState.isTotpValid = true
  login2faState.trustedBrowserRegistrationFails = false
  login2faState.twoFactor = { secret: 'encrypted-secret' }
  login2faState.user = {
    id: 7,
    loginId: 'tester',
    name: 'tester',
    lastLoginAt: null,
    lastLogoutAt: null,
  }
  login2faState.validBackupCodeHash = null
})

function createApp() {
  const app = new Hono<Env>()
  app.use('*', contextStorage())
  app.route('/login/2fa', route)
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

function requestLogin2FA(body: Record<string, unknown>, ip = getNextIPAddress()) {
  return createApp().request('/login/2fa', {
    method: 'POST',
    headers: {
      'CF-Connecting-IP': ip,
      'Content-Type': 'application/json',
      'user-agent': 'bun-test',
      'x-real-ip': ip,
      'x-forwarded-for': ip,
    },
    body: JSON.stringify({
      authorizationCode: 'auth-code',
      codeVerifier: 'A'.repeat(43),
      fingerprint: 'fingerprint-1',
      remember: false,
      token: '123456',
      trustBrowser: false,
      ...body,
    }),
  })
}

describe('POST /api/v1/auth/login/2fa', () => {
  test('TOTP 성공 시 trusted browser 쿠키와 인증 쿠키를 발급한다', async () => {
    const response = await requestLogin2FA({
      token: '123456',
      trustBrowser: true,
    })

    expect(response.status).toBe(200)
    expect(getSetCookieHeader(response)).toContain('tbt=trusted-browser-token')
    expect(getSetCookieHeader(response)).toContain('at=')
    expect(getSetCookieHeader(response)).toContain('ah=')

    const data = (await response.json()) as POSTV1AuthLogin2FAResponse
    expect(data).toEqual({
      id: 7,
      loginId: 'tester',
      name: 'tester',
      lastLoginAt: null,
      lastLogoutAt: null,
      isBackupCode: false,
      backupCodeCount: 0,
    })

    expect(registerTrustedBrowserMock).toHaveBeenCalledWith({}, 7, 'fingerprint-1', 'bun-test')
    expect(signTrustedBrowserTokenMock).toHaveBeenCalledWith({
      browserId: 'browser-id',
      userId: 7,
      fingerprint: 'fingerprint-1',
    })
    expect(issueAuthCookiesMock).toHaveBeenCalledWith({
      userId: 7,
      adult: true,
      remember: false,
      ipAddress: '198.51.100.1',
      userAgent: 'bun-test',
      tx: {},
    })
  })

  test('백업 코드 성공 시 trusted browser 쿠키는 발급하지 않는다', async () => {
    login2faState.backupCodes = [{ codeHash: 'hash-1' }, { codeHash: 'hash-2' }]
    login2faState.validBackupCodeHash = 'hash-1'

    const response = await requestLogin2FA({
      token: 'ABCD-1234',
      trustBrowser: true,
    })

    expect(response.status).toBe(200)
    expect(getSetCookieHeader(response)).not.toContain('tbt=')
    expect(getSetCookieHeader(response)).toContain('at=')

    const data = (await response.json()) as POSTV1AuthLogin2FAResponse
    expect(data.isBackupCode).toBe(true)
    expect(data.backupCodeCount).toBe(1)
    expect(deleteBackupCodeByHashMock).toHaveBeenCalledWith({}, 7, 'hash-1')
    expect(registerTrustedBrowserMock).not.toHaveBeenCalled()
    expect(signTrustedBrowserTokenMock).not.toHaveBeenCalled()
  })

  test('trusted browser 등록 실패 시 로그인은 성공하고 trusted browser 쿠키만 생기지 않는다', async () => {
    login2faState.trustedBrowserRegistrationFails = true

    const response = await requestLogin2FA({
      token: '123456',
      trustBrowser: true,
    })

    expect(response.status).toBe(200)
    expect(getSetCookieHeader(response)).not.toContain('tbt=')
    expect(getSetCookieHeader(response)).toContain('at=')
    expect(signTrustedBrowserTokenMock).not.toHaveBeenCalled()
  })

  test('TOTP secret 복호화에 실패하면 500 Problem Details를 반환한다', async () => {
    decryptTOTPSecretMock.mockImplementationOnce(() => {
      throw new Error('decrypt failed')
    })

    const response = await requestLogin2FA({ token: '123456' })

    expect(response.status).toBe(500)
    expect(verifyTOTPTokenMock).not.toHaveBeenCalled()

    const problem = (await response.json()) as ValidationProblemDetails
    expect(problem.detail).toBe('2단계 인증 중 오류가 발생했어요')
  })

  test('PKCE 검증이 실패하면 401 Problem Details를 반환한다', async () => {
    verifyPKCEChallengeMock.mockResolvedValueOnce({ valid: false })

    const response = await requestLogin2FA({ token: '123456' })

    expect(response.status).toBe(401)
    const problem = (await response.json()) as ValidationProblemDetails
    expect(problem.detail).toBe('인증이 만료됐어요. 새로고침 후 시도해 주세요.')
  })
})
