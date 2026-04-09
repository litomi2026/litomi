import { afterAll, beforeAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'

import type { Env } from '@/backend'

type LogoutRouteModule = typeof import('../logout')

let shouldThrowDatabaseError = false
let currentUserId: number | undefined
let logoutRoute: LogoutRouteModule['default']
const touchUserLogoutAtAndReturnLoginIdMock = mock(async (userId: number) => {
  if (shouldThrowDatabaseError) {
    throw new Error('Database connection failed')
  }

  if (userId === 1) {
    return { loginId: 'testuser1' }
  }

  if (userId === 2) {
    return { loginId: 'testuser2' }
  }

  return null
})

type LogoutResponse = {
  loginId: string | null
}

mock.module('@/backend/api/v1/auth/query', () => ({
  readAdultFlag: mock(async () => false),
  touchUserLoginAt: mock(async () => {}),
  touchUserLoginAtAndReturnProfile: mock(async () => null),
  touchUserLogoutAtAndReturnLoginId: touchUserLogoutAtAndReturnLoginIdMock,
}))

beforeAll(async () => {
  spyOn(console, 'error').mockImplementation(() => {})
  logoutRoute = (await import('../logout')).default
})

afterAll(() => {
  mock.restore()
})

beforeEach(() => {
  currentUserId = undefined
  shouldThrowDatabaseError = false
  touchUserLogoutAtAndReturnLoginIdMock.mockClear()
})

type TestEnv = Env & {
  Bindings: {
    userId?: number
  }
}

function createApp() {
  const app = new Hono<TestEnv>()

  app.use('*', contextStorage())
  app.use('*', async (c, next) => {
    if (c.env.userId) {
      c.set('userId', c.env.userId)
    }
    await next()
  })
  app.route('/', logoutRoute)

  return app
}

function getSetCookieHeader(response: Response) {
  return Array.from(response.headers.entries())
    .filter(([key]) => key.toLowerCase() === 'set-cookie')
    .map(([, value]) => value)
    .join('\n')
}

describe('POST /api/v1/auth/logout', () => {
  test('인증된 사용자가 로그아웃하면 loginId를 반환하고 쿠키를 삭제한다', async () => {
    currentUserId = 1

    const response = await createApp().request('/', { method: 'POST' }, { userId: 1 })

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('application/json')

    const data = (await response.json()) as LogoutResponse
    expect(data).toEqual({ loginId: 'testuser1' })
    expect(getSetCookieHeader(response)).toContain('at=')
    expect(getSetCookieHeader(response)).toContain('rt=')
    expect(getSetCookieHeader(response)).toContain('ah=')
    expect(touchUserLogoutAtAndReturnLoginIdMock).toHaveBeenCalledWith(1, expect.any(Date))
  })

  test('인증 정보가 없어도 로그아웃 요청은 성공하고 쿠키를 정리한다', async () => {
    const response = await createApp().request('/', { method: 'POST' }, {})

    expect(response.status).toBe(200)

    const data = (await response.json()) as LogoutResponse
    expect(data).toEqual({ loginId: null })
    expect(getSetCookieHeader(response)).toContain('at=')
    expect(getSetCookieHeader(response)).toContain('rt=')
    expect(getSetCookieHeader(response)).toContain('ah=')
    expect(touchUserLogoutAtAndReturnLoginIdMock).not.toHaveBeenCalled()
  })

  test('DB에 사용자가 없어도 로그아웃 요청은 성공하고 쿠키를 정리한다', async () => {
    currentUserId = 999

    const response = await createApp().request('/', { method: 'POST' }, { userId: 999 })

    expect(response.status).toBe(200)

    const data = (await response.json()) as LogoutResponse
    expect(data).toEqual({ loginId: null })
    expect(getSetCookieHeader(response)).toContain('at=')
    expect(getSetCookieHeader(response)).toContain('rt=')
    expect(getSetCookieHeader(response)).toContain('ah=')
  })

  test('로그아웃 중 데이터베이스 오류가 발생하면 500 응답을 반환하고 쿠키는 유지한다', async () => {
    currentUserId = 1
    shouldThrowDatabaseError = true

    const response = await createApp().request('/', { method: 'POST' }, { userId: 1 })

    expect(response.status).toBe(500)
    expect(getSetCookieHeader(response)).toBe('')
  })
})
