import { afterAll, beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test'

type AccessTokenCookieConfigInput = {
  userId: number
}

type AuthHintCookieConfigInput = {
  maxAgeSeconds: number
}

type RefreshSessionCookieConfigInput = {
  token: string
  maxAgeSeconds: number
}

type SessionModule = typeof import('./session')

type SessionRecord = {
  absoluteExpiresAt: Date
  createdAt: Date
  familyId: string
  id: string
  idleExpiresAt: Date
  ipAddress: string | null
  lastUsedAt: Date | null
  replacedBySessionId: string | null
  revokedAt: Date | null
  rotatedAt: Date | null
  tokenHash: string
  userAgent: string | null
  userId: number
}

let sessionModule: SessionModule

const sessionQueryState: {
  adult: boolean
  lockedSession: SessionRecord | null
  replacementSession: SessionRecord | null
} = {
  adult: true,
  lockedSession: null,
  replacementSession: null,
}

const insertSessionMock = mock(async () => {})
const markSessionRotatedMock = mock(async () => {})
const readAdultFlagMock = mock(async () => sessionQueryState.adult)
const readSessionByIdForUpdateMock = mock(async () => sessionQueryState.replacementSession)
const readSessionByTokenHashForUpdateMock = mock(async () => sessionQueryState.lockedSession)
const revokeSessionByIdMock = mock(async () => {})
const revokeSessionFamilyMock = mock(async () => {})

mock.module('@/auth/session.query', () => ({
  insertSession: insertSessionMock,
  markSessionRotated: markSessionRotatedMock,
  readAdultFlag: readAdultFlagMock,
  readSessionByIdForUpdate: readSessionByIdForUpdateMock,
  readSessionByTokenHashForUpdate: readSessionByTokenHashForUpdateMock,
  revokeSessionById: revokeSessionByIdMock,
  revokeSessionFamily: revokeSessionFamilyMock,
}))

mock.module('@/database/supabase/drizzle', () => ({
  db: {
    transaction: async (callback: (tx: object) => Promise<unknown>) => await callback({}),
  },
}))

mock.module('@/utils/cookie', () => ({
  getAccessTokenCookieConfig: mock(async ({ userId }: AccessTokenCookieConfigInput) => ({
    key: 'at',
    value: `at-${userId}`,
    options: { httpOnly: true, maxAge: 3600, sameSite: 'strict' as const, secure: true },
  })),
  getAuthCookieClearConfigs: () => [
    { key: 'at', value: '', options: { httpOnly: true, sameSite: 'strict' as const, secure: true } },
    { key: 'rt', value: '', options: { httpOnly: true, sameSite: 'strict' as const, secure: true } },
    { key: 'ah', value: '', options: { httpOnly: false, sameSite: 'strict' as const, secure: true } },
  ],
  getAuthHintCookieConfig: ({ maxAgeSeconds }: AuthHintCookieConfigInput) => ({
    key: 'ah',
    value: `hint-${maxAgeSeconds}`,
    options: { httpOnly: false, maxAge: maxAgeSeconds, sameSite: 'strict' as const, secure: true },
  }),
  getRefreshSessionCookieConfig: ({ token, maxAgeSeconds }: RefreshSessionCookieConfigInput) => ({
    key: 'rt',
    value: token,
    options: { httpOnly: true, maxAge: maxAgeSeconds, sameSite: 'strict' as const, secure: true },
  }),
}))

beforeAll(async () => {
  sessionModule = await import('./session')
})

afterAll(() => {
  mock.restore()
})

beforeEach(() => {
  insertSessionMock.mockClear()
  markSessionRotatedMock.mockClear()
  readAdultFlagMock.mockClear()
  readSessionByIdForUpdateMock.mockClear()
  readSessionByTokenHashForUpdateMock.mockClear()
  revokeSessionByIdMock.mockClear()
  revokeSessionFamilyMock.mockClear()

  sessionQueryState.adult = true
  sessionQueryState.lockedSession = null
  sessionQueryState.replacementSession = null
})

function createSessionRecord(overrides: Partial<SessionRecord> = {}): SessionRecord {
  const now = Date.now()

  return {
    id: 'session-1',
    userId: 7,
    familyId: 'family-1',
    tokenHash: 'token-hash',
    createdAt: new Date(now - 60_000),
    lastUsedAt: new Date(now - 1_000),
    absoluteExpiresAt: new Date(now + 60 * 60 * 1000),
    idleExpiresAt: new Date(now + 30 * 60 * 1000),
    rotatedAt: null,
    revokedAt: null,
    replacedBySessionId: null,
    userAgent: 'stored-user-agent',
    ipAddress: '203.0.113.10',
    ...overrides,
  }
}

describe('src/auth/session.ts', () => {
  test('active refresh session 은 rotation 한다', async () => {
    sessionQueryState.lockedSession = createSessionRecord()

    const result = await sessionModule.refreshSession('refresh-token', {
      ipAddress: '198.51.100.25',
      userAgent: 'bun-test',
    })

    expect(result).toMatchObject({
      ok: true,
      rotated: true,
      userId: 7,
      adult: true,
    })
    expect(insertSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 7,
        familyId: 'family-1',
        ipAddress: '198.51.100.25',
        userAgent: 'bun-test',
      }),
      {},
    )
    expect(markSessionRotatedMock).toHaveBeenCalledWith({}, 'session-1', expect.any(String), expect.any(Date))
  })

  test('reuse grace 안에서는 replacement session 으로 재발급한다', async () => {
    sessionQueryState.lockedSession = createSessionRecord({
      rotatedAt: new Date(Date.now() - 1_000),
      replacedBySessionId: 'replacement-1',
    })
    sessionQueryState.replacementSession = createSessionRecord({
      id: 'replacement-1',
      rotatedAt: null,
      revokedAt: null,
    })

    const result = await sessionModule.refreshSession('refresh-token')

    expect(result).toMatchObject({
      ok: true,
      rotated: false,
      userId: 7,
      adult: true,
    })
    expect(insertSessionMock).not.toHaveBeenCalled()
    expect(revokeSessionFamilyMock).not.toHaveBeenCalled()
  })

  test('reused token 은 family revoke 처리한다', async () => {
    sessionQueryState.lockedSession = createSessionRecord({
      rotatedAt: new Date(Date.now() - 10_000),
      replacedBySessionId: 'replacement-1',
    })
    sessionQueryState.replacementSession = createSessionRecord({
      id: 'replacement-1',
      revokedAt: new Date(),
    })

    const result = await sessionModule.refreshSession('refresh-token')

    expect(result).toEqual({
      ok: false,
      reason: 'reused',
      cookies: [
        { key: 'at', value: '', options: { httpOnly: true, sameSite: 'strict', secure: true } },
        { key: 'rt', value: '', options: { httpOnly: true, sameSite: 'strict', secure: true } },
        { key: 'ah', value: '', options: { httpOnly: false, sameSite: 'strict', secure: true } },
      ],
    })
    expect(revokeSessionFamilyMock).toHaveBeenCalledWith({}, 'family-1', expect.any(Date))
  })
})
