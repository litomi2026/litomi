import { afterAll, beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test'

import type { SessionFamilyRow, SessionTokenRow } from '@/auth/session.query'

type SessionModule = typeof import('../session')

let refreshSession: SessionModule['refreshSession']

const insertSessionTokenMock = mock(async () => {})
const markSessionTokenRotatedMock = mock(async () => {})
const readAdultFlagMock = mock(async () => true)
const readSessionFamilyByIdForUpdateMock = mock(async () => sessionState.family)
const readSessionTokenByHashForUpdateMock = mock(async () => sessionState.token)
const readSessionTokenByIdForUpdateMock = mock(async () => sessionState.replacementToken)
const revokeSessionFamilyByIdMock = mock(async () => {})
const touchSessionFamilyMock = mock(async () => {})
const transactionMock = mock(async (callback: (tx: unknown) => Promise<unknown>) => await callback({}))

const accessTokenCookieMock = mock(async ({ userId, adult }: { userId: number; adult: boolean }) => ({
  key: 'at',
  value: `${userId}:${adult}`,
  options: { httpOnly: true, maxAge: 3600, sameSite: 'strict' as const, secure: true },
}))
const refreshTokenCookieMock = mock(({ token, maxAgeSeconds }: { token: string; maxAgeSeconds: number }) => ({
  key: 'rt',
  value: token,
  options: { httpOnly: true, maxAge: maxAgeSeconds, sameSite: 'strict' as const, secure: true },
}))
const authHintCookieMock = mock(({ maxAgeSeconds }: { maxAgeSeconds: number }) => ({
  key: 'ah',
  value: String(maxAgeSeconds),
  options: { httpOnly: false, maxAge: maxAgeSeconds, sameSite: 'strict' as const, secure: true },
}))

const sessionState: {
  family: SessionFamilyRow | null
  replacementToken: SessionTokenRow | null
  token: SessionTokenRow | null
} = {
  family: null,
  replacementToken: null,
  token: null,
}

mock.module('@/auth/session.query', () => ({
  insertSessionFamily: mock(async () => {}),
  insertSessionToken: insertSessionTokenMock,
  markSessionTokenRotated: markSessionTokenRotatedMock,
  readAdultFlag: readAdultFlagMock,
  readSessionFamilyByIdForUpdate: readSessionFamilyByIdForUpdateMock,
  readSessionTokenByHashForUpdate: readSessionTokenByHashForUpdateMock,
  readSessionTokenByIdForUpdate: readSessionTokenByIdForUpdateMock,
  revokeSessionFamilyById: revokeSessionFamilyByIdMock,
  touchSessionFamily: touchSessionFamilyMock,
}))

mock.module('@/database/supabase/drizzle', () => ({
  db: {
    transaction: transactionMock,
  },
}))

mock.module('@/utils/cookie', () => ({
  getAccessTokenCookieConfig: accessTokenCookieMock,
  getAuthCookieClearConfigs: () => [
    {
      key: 'rt',
      value: '',
      options: { httpOnly: true, maxAge: 0, sameSite: 'strict' as const, secure: true },
    },
  ],
  getAuthHintCookieConfig: authHintCookieMock,
  getRefreshSessionCookieConfig: refreshTokenCookieMock,
}))

beforeAll(async () => {
  ;({ refreshSession } = await import('../session'))
})

afterAll(() => {
  mock.restore()
})

beforeEach(() => {
  insertSessionTokenMock.mockClear()
  markSessionTokenRotatedMock.mockClear()
  readAdultFlagMock.mockClear()
  readSessionFamilyByIdForUpdateMock.mockClear()
  readSessionTokenByHashForUpdateMock.mockClear()
  readSessionTokenByIdForUpdateMock.mockClear()
  revokeSessionFamilyByIdMock.mockClear()
  touchSessionFamilyMock.mockClear()
  transactionMock.mockClear()
  accessTokenCookieMock.mockClear()
  refreshTokenCookieMock.mockClear()
  authHintCookieMock.mockClear()

  const now = new Date()

  sessionState.family = {
    id: 'family-1',
    userId: 7,
    createdAt: new Date(now.getTime() - 10_000),
    lastUsedAt: new Date(now.getTime() - 10_000),
    absoluteExpiresAt: new Date(now.getTime() + 86_400_000),
    idleExpiresAt: new Date(now.getTime() + 86_400_000),
    revokedAt: null,
    userAgent: 'Chrome Windows 데스크탑',
    ipAddress: '198.51.100.10',
  }
  sessionState.token = {
    id: 'token-1',
    familyId: 'family-1',
    tokenHash: 'hash-1',
    createdAt: new Date(now.getTime() - 10_000),
    rotatedAt: null,
    replacedByTokenId: null,
  }
  sessionState.replacementToken = {
    id: 'token-2',
    familyId: 'family-1',
    tokenHash: 'hash-2',
    createdAt: new Date(now.getTime() - 1_000),
    rotatedAt: null,
    replacedByTokenId: null,
  }
})

describe('refreshSession', () => {
  test('토큰이 없으면 invalid를 반환한다', async () => {
    sessionState.token = null

    const result = await refreshSession('missing-token')

    expect(result).toEqual({
      ok: false,
      reason: 'invalid',
      cookies: expect.any(Array),
    })
  })

  test('정상적인 refresh는 새 토큰을 발급하고 기존 토큰을 회전시킨다', async () => {
    const result = await refreshSession('refresh-token', {
      ipAddress: '203.0.113.12',
      userAgent: 'Chrome macOS 데스크탑',
    })

    expect(result.ok).toBe(true)

    if (!result.ok) {
      return
    }

    expect(result.rotated).toBe(true)
    expect(insertSessionTokenMock).toHaveBeenCalledTimes(1)
    expect(markSessionTokenRotatedMock).toHaveBeenCalledWith(expect.anything(), 'token-1', expect.any(String), expect.any(Date))
    expect(touchSessionFamilyMock).toHaveBeenCalledWith(expect.anything(), 'family-1', {
      idleExpiresAt: expect.any(Date),
      lastUsedAt: expect.any(Date),
      userAgent: 'Chrome macOS 데스크탑',
      ipAddress: '203.0.113.12',
    })
    expect(result.cookies).toHaveLength(3)
    expect(result.cookies.map((cookie) => cookie.key)).toEqual(['at', 'rt', 'ah'])
  })

  test('회전 직후 grace window 안에서는 replacement 토큰을 따라간다', async () => {
    sessionState.token = {
      ...sessionState.token!,
      rotatedAt: new Date(Date.now() - 2_000),
      replacedByTokenId: 'token-2',
    }

    const result = await refreshSession('refresh-token')

    expect(result.ok).toBe(true)

    if (!result.ok) {
      return
    }

    expect(result.rotated).toBe(false)
    expect(insertSessionTokenMock).not.toHaveBeenCalled()
    expect(revokeSessionFamilyByIdMock).not.toHaveBeenCalled()
    expect(result.cookies.map((cookie) => cookie.key)).toEqual(['at', 'ah'])
  })

  test('grace window 밖에서 rotated 토큰을 재사용하면 family 전체를 revoke한다', async () => {
    sessionState.token = {
      ...sessionState.token!,
      rotatedAt: new Date(Date.now() - 10_000),
      replacedByTokenId: 'token-2',
    }

    const result = await refreshSession('refresh-token')

    expect(result).toEqual({
      ok: false,
      reason: 'reused',
      cookies: expect.any(Array),
    })
    expect(revokeSessionFamilyByIdMock).toHaveBeenCalledWith(expect.anything(), 'family-1', expect.any(Date))
  })

  test('만료된 family는 expired로 처리하고 revoke한다', async () => {
    sessionState.family = {
      ...sessionState.family!,
      idleExpiresAt: new Date(Date.now() - 1_000),
    }

    const result = await refreshSession('refresh-token')

    expect(result).toEqual({
      ok: false,
      reason: 'expired',
      cookies: expect.any(Array),
    })
    expect(revokeSessionFamilyByIdMock).toHaveBeenCalledWith(expect.anything(), 'family-1', expect.any(Date))
  })
})
