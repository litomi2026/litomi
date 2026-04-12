import { afterAll, beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test'
import { userAgent as parseUserAgent } from 'next/server'

type SessionFamilyFixture = {
  absoluteExpiresAt: Date
  createdAt: Date
  deviceLabel: string | null
  id: string
  idleExpiresAt: Date
  lastUsedAt: Date
  revokedAt: Date | null
  userId: number
}

type SessionTokenFixture = {
  createdAt: Date
  familyId: string
  id: string
  replacedByTokenId: string | null
  rotatedAt: Date | null
  tokenHash: string
}

const txMock = {} as never

const insertSessionFamilyMock = mock(async () => {})
const insertSessionTokenMock = mock(async () => {})
const markSessionTokenRotatedMock = mock(async () => {})
const readAdultFlagMock = mock(async () => sessionState.adult)
const readSessionFamilyByIdForUpdateMock = mock(async () => sessionState.family)
const readSessionTokenByHashForUpdateMock = mock(async () => sessionState.token)
const readSessionTokenByIdForUpdateMock = mock(async () => sessionState.replacement)
const revokeSessionFamilyByIdMock = mock(async () => {})
const touchSessionFamilyMock = mock(async () => {})
const transactionMock = mock(async (callback: (tx: typeof txMock) => Promise<unknown>) => await callback(txMock))

const getAccessTokenCookieConfigMock = mock(async ({ adult, userId }: { adult: boolean; userId: number }) => ({
  key: 'at',
  value: `at:${userId}:${adult}`,
  options: { path: '/' },
}))

const getAuthHintCookieConfigMock = mock(({ maxAgeSeconds }: { maxAgeSeconds?: number | null } = {}) => ({
  key: 'ah',
  value: '1',
  options: { maxAge: maxAgeSeconds ?? undefined, path: '/' },
}))

const getRefreshSessionCookieConfigMock = mock(({ maxAgeSeconds, token }: { maxAgeSeconds: number; token: string }) => ({
  key: 'rt',
  value: token,
  options: { maxAge: maxAgeSeconds, path: '/' },
}))

const getAuthCookieClearConfigsMock = mock(() => [
  { key: 'at', value: '', options: { path: '/' } },
  { key: 'rt', value: '', options: { path: '/' } },
  { key: 'ah', value: '', options: { path: '/' } },
])

const sessionState: {
  adult: boolean
  family: SessionFamilyFixture | null
  replacement: SessionTokenFixture | null
  token: SessionTokenFixture | null
} = {
  adult: false,
  family: null,
  replacement: null,
  token: null,
}

function buildSessionDeviceLabelForTest(rawUserAgent: string | null | undefined) {
  if (!rawUserAgent || rawUserAgent === 'unknown') {
    return null
  }

  const agent = parseUserAgent({ headers: new Headers({ 'user-agent': rawUserAgent }) })
  const browser = agent.browser.name || '일반 브라우저'
  const os = normalizeSessionOSNameForTest(agent.os.name)
  const device = normalizeSessionDeviceTypeForTest(agent.device.type)

  return [browser, os, device].filter(Boolean).join(' ').trim().slice(0, 128)
}

function normalizeSessionDeviceTypeForTest(type: string | undefined) {
  if (type === 'mobile') {
    return '모바일'
  }

  if (type === 'tablet') {
    return '태블릿'
  }

  return '데스크톱'
}

function normalizeSessionOSNameForTest(name: string | undefined) {
  if (!name) {
    return ''
  }

  if (name === 'Mac OS') {
    return 'macOS'
  }

  return name
}

mock.module('@/database/supabase/drizzle', () => ({
  db: {
    transaction: transactionMock,
  },
}))

mock.module('@/query/session.query', () => ({
  insertSessionFamily: insertSessionFamilyMock,
  insertSessionToken: insertSessionTokenMock,
  markSessionTokenRotated: markSessionTokenRotatedMock,
  readAdultFlag: readAdultFlagMock,
  readSessionFamilyByIdForUpdate: readSessionFamilyByIdForUpdateMock,
  readSessionTokenByHashForUpdate: readSessionTokenByHashForUpdateMock,
  readSessionTokenByIdForUpdate: readSessionTokenByIdForUpdateMock,
  revokeSessionFamilyById: revokeSessionFamilyByIdMock,
  touchSessionFamily: touchSessionFamilyMock,
}))

mock.module('@/utils/cookie', () => ({
  getAccessTokenCookieConfig: getAccessTokenCookieConfigMock,
  getAuthCookieClearConfigs: getAuthCookieClearConfigsMock,
  getAuthHintCookieConfig: getAuthHintCookieConfigMock,
  getRefreshSessionCookieConfig: getRefreshSessionCookieConfigMock,
}))

mock.module('@/utils/session', () => ({
  addSeconds: (date: Date, seconds: number) => new Date(date.getTime() + seconds * 1000),
  buildSessionDeviceLabel: buildSessionDeviceLabelForTest,
  generateSessionToken: ({ familyId, tokenId }: { familyId: string; tokenId: string }) => `rt:${familyId}:${tokenId}`,
  getRemainingSeconds: (expiresAt: Date, now: Date) => Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / 1000)),
  hashSessionToken: (token: string) => `hash:${token}`,
  minDate: (a: Date, b: Date) => (a.getTime() <= b.getTime() ? a : b),
  REFRESH_SESSION_ABSOLUTE_TTL_SECONDS: 60 * 60 * 24 * 30,
  REFRESH_SESSION_IDLE_TTL_SECONDS: 60 * 60 * 24 * 30,
  REFRESH_SESSION_REUSE_GRACE_SECONDS: 5,
  SESSION_DEVICE_LABEL_MAX_LENGTH: 128,
  truncateSessionMetadata: (value: string | null | undefined, maxLength: number) => (value ? value.slice(0, maxLength) : null),
}))

let refreshSession: typeof import('../session').refreshSession

beforeAll(async () => {
  ;({ refreshSession } = await import('../session'))
})

afterAll(() => {
  mock.restore()
})

beforeEach(() => {
  sessionState.adult = false
  sessionState.family = null
  sessionState.replacement = null
  sessionState.token = null

  insertSessionFamilyMock.mockClear()
  insertSessionTokenMock.mockClear()
  markSessionTokenRotatedMock.mockClear()
  readAdultFlagMock.mockClear()
  readSessionFamilyByIdForUpdateMock.mockClear()
  readSessionTokenByHashForUpdateMock.mockClear()
  readSessionTokenByIdForUpdateMock.mockClear()
  revokeSessionFamilyByIdMock.mockClear()
  touchSessionFamilyMock.mockClear()
  transactionMock.mockClear()
  getAccessTokenCookieConfigMock.mockClear()
  getAuthHintCookieConfigMock.mockClear()
  getRefreshSessionCookieConfigMock.mockClear()
  getAuthCookieClearConfigsMock.mockClear()
})

describe('refreshSession', () => {
  test('active refresh token은 새 토큰으로 회전하고 family 메타데이터를 갱신한다', async () => {
    sessionState.adult = true
    sessionState.family = createFamily({
      absoluteExpiresAt: new Date(Date.now() + 60 * 60 * 24 * 40 * 1000),
      idleExpiresAt: new Date(Date.now() + 60 * 1000),
    })
    sessionState.token = createToken()

    const result = expectRefreshSuccess(await refreshSession('rt:family-1:token-1', 'Updated Device'))

    expect(result.ok).toBe(true)
    expect(result.rotated).toBe(true)
    expect(result.userId).toBe(7)
    expect(result.adult).toBe(true)
    expect(result.cookies.map((cookie) => cookie.key)).toEqual(['at', 'rt', 'ah'])
    expect(result.cookies[1]?.value).toContain('rt:family-1:')

    expect(insertSessionTokenMock).toHaveBeenCalledTimes(1)
    expect(markSessionTokenRotatedMock).toHaveBeenCalledTimes(1)
    expect(touchSessionFamilyMock).toHaveBeenCalledTimes(1)
    expect(revokeSessionFamilyByIdMock).not.toHaveBeenCalled()

    const insertedTokenCall = insertSessionTokenMock.mock.calls[0] as unknown[] | undefined

    if (!insertedTokenCall) {
      throw new Error('expected insertSessionToken to be called')
    }

    const insertedToken = insertedTokenCall[0] as SessionTokenFixture
    expect(insertedToken.familyId).toBe('family-1')
    expect(insertedToken.tokenHash).toContain('hash:rt:family-1:')

    const touchedFamilyCall = touchSessionFamilyMock.mock.calls[0] as unknown[] | undefined

    if (!touchedFamilyCall) {
      throw new Error('expected touchSessionFamily to be called')
    }

    const touchedFamilyValues = touchedFamilyCall[2] as Record<string, unknown>
    expect(touchedFamilyValues.deviceLabel).toBe('Updated Device')
    expect(touchedFamilyValues.lastUsedAt).toBeInstanceOf(Date)
    expect(touchedFamilyValues.idleExpiresAt).toBeInstanceOf(Date)
  })

  test('grace window 안의 rotated token은 이미 발급된 교체 토큰으로 복구한다', async () => {
    sessionState.family = createFamily({
      idleExpiresAt: new Date(Date.now() + 30 * 1000),
    })
    sessionState.token = createToken({
      id: 'token-old',
      replacedByTokenId: 'token-new',
      rotatedAt: new Date(Date.now() - 1000),
      tokenHash: 'hash:rt:family-1:token-old',
    })
    sessionState.replacement = createToken({
      id: 'token-new',
      tokenHash: 'hash:rt:family-1:token-new',
    })

    const result = expectRefreshSuccess(await refreshSession('rt:family-1:token-old'))

    expect(result.ok).toBe(true)
    expect(result.rotated).toBe(false)
    expect(result.cookies.map((cookie) => cookie.key)).toEqual(['at', 'rt', 'ah'])
    expect(result.cookies[1]?.value).toBe('rt:family-1:token-new')

    expect(insertSessionTokenMock).not.toHaveBeenCalled()
    expect(markSessionTokenRotatedMock).not.toHaveBeenCalled()
    expect(touchSessionFamilyMock).not.toHaveBeenCalled()
    expect(revokeSessionFamilyByIdMock).not.toHaveBeenCalled()
    expect(readSessionTokenByIdForUpdateMock).toHaveBeenCalledTimes(1)
  })

  test('rotated token의 교체 토큰을 안전하게 복구하지 못하면 family를 revoke 한다', async () => {
    sessionState.family = createFamily()
    sessionState.token = createToken({
      id: 'token-old',
      replacedByTokenId: 'token-new',
      rotatedAt: new Date(Date.now() - 1000),
      tokenHash: 'hash:rt:family-1:token-old',
    })
    sessionState.replacement = createToken({
      id: 'token-new',
      tokenHash: 'hash:corrupted-token',
    })

    const result = expectRefreshFailure(await refreshSession('rt:family-1:token-old'))

    expect(result.ok).toBe(false)
    expect(result.reason).toBe('reused')
    expect(result.cookies.map((cookie) => cookie.key)).toEqual(['at', 'rt', 'ah'])

    expect(revokeSessionFamilyByIdMock).toHaveBeenCalledTimes(1)
    expect(insertSessionTokenMock).not.toHaveBeenCalled()
    expect(markSessionTokenRotatedMock).not.toHaveBeenCalled()
    expect(touchSessionFamilyMock).not.toHaveBeenCalled()
  })
})

function createFamily(overrides: Partial<SessionFamilyFixture> = {}): SessionFamilyFixture {
  const now = Date.now()

  return {
    absoluteExpiresAt: new Date(now + 60 * 60 * 1000),
    createdAt: new Date(now - 10 * 60 * 1000),
    deviceLabel: 'Saved Device',
    id: 'family-1',
    idleExpiresAt: new Date(now + 10 * 60 * 1000),
    lastUsedAt: new Date(now - 1000),
    revokedAt: null,
    userId: 7,
    ...overrides,
  }
}

function createToken(overrides: Partial<SessionTokenFixture> = {}): SessionTokenFixture {
  const now = Date.now()

  return {
    createdAt: new Date(now - 10 * 1000),
    familyId: 'family-1',
    id: 'token-1',
    replacedByTokenId: null,
    rotatedAt: null,
    tokenHash: 'hash:rt:family-1:token-1',
    ...overrides,
  }
}

function expectRefreshFailure(result: Awaited<ReturnType<typeof refreshSession>>) {
  if (result.ok) {
    throw new Error('expected refresh failure')
  }

  return result
}

function expectRefreshSuccess(result: Awaited<ReturnType<typeof refreshSession>>) {
  if (!result.ok) {
    throw new Error('expected refresh success')
  }

  return result
}
