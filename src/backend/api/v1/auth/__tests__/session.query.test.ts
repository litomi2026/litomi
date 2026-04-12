import { afterAll, beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test'

import { hashSessionToken } from '@/query/session.util'

const insertSessionFamilyMock = mock(async () => {})
const insertSessionTokenMock = mock(async () => {})

mock.module('@/query/session.query', () => ({
  insertSessionFamily: insertSessionFamilyMock,
  insertSessionToken: insertSessionTokenMock,
  markSessionTokenRotated: mock(async () => {}),
  readAdultFlag: mock(async () => false),
  readSessionFamilyByIdForUpdate: mock(async () => null),
  readSessionTokenByHashForUpdate: mock(async () => null),
  readSessionTokenByIdForUpdate: mock(async () => null),
  revokeSessionFamilyById: mock(async () => {}),
  touchSessionFamily: mock(async () => {}),
}))

let issueAuthCookies: typeof import('../session.query').issueAuthCookies

beforeAll(async () => {
  ;({ issueAuthCookies } = await import('../session.query'))
})

afterAll(() => {
  mock.restore()
})

beforeEach(() => {
  insertSessionFamilyMock.mockClear()
  insertSessionTokenMock.mockClear()
})

describe('issueAuthCookies', () => {
  test('remember=false면 session access/auth hint 쿠키만 발급한다', async () => {
    const cookies = await issueAuthCookies({
      userId: 7,
      adult: true,
      remember: false,
    })

    expect(cookies.map((cookie) => cookie.key)).toEqual(['at', 'ah'])
    expect(cookies[0]?.options.maxAge).toBeUndefined()
    expect(cookies[0]?.options.expires).toBeUndefined()
    expect(cookies[0]?.options.path).toBe('/')
    expect(cookies[1]?.options.maxAge).toBeUndefined()
    expect(cookies[1]?.options.expires).toBeUndefined()
    expect(cookies[1]?.options.path).toBe('/')
    expect(insertSessionFamilyMock).not.toHaveBeenCalled()
    expect(insertSessionTokenMock).not.toHaveBeenCalled()
  })

  test('remember=true면 persistent access/refresh/auth hint 쿠키를 발급한다', async () => {
    const cookies = await issueAuthCookies({
      userId: 7,
      adult: false,
      remember: true,
      deviceLabel: 'Chrome macOS 데스크톱',
    })

    expect(cookies.map((cookie) => cookie.key)).toEqual(['at', 'rt', 'ah'])
    expect(cookies[0]?.options.maxAge).toBe(60 * 60)
    expect(cookies[0]?.options.path).toBe('/')
    expect(cookies[1]?.options.maxAge).toBe(60 * 60 * 24 * 30)
    expect(cookies[1]?.options.path).toBe('/')
    expect(cookies[2]?.options.maxAge).toBe(60 * 60 * 24 * 30)
    expect(cookies[2]?.options.path).toBe('/')

    expect(insertSessionFamilyMock).toHaveBeenCalledTimes(1)
    expect(insertSessionTokenMock).toHaveBeenCalledTimes(1)

    const insertedToken = ((insertSessionTokenMock.mock.calls as unknown) as Array<Array<Record<string, string>>>)?.[0]?.[0]
    expect(insertedToken?.tokenHash).toBe(hashSessionToken(cookies[1]!.value))
  })
})
