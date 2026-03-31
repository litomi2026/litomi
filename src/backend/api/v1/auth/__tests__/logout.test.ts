import { afterAll, beforeAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'

import type { Env } from '@/backend'

type LogoutRoutesModule = typeof import('../logout')

let shouldThrowDatabaseError = false
let currentUserId: number | undefined
let logoutRoutes: LogoutRoutesModule['default']

type LogoutResponse = {
  loginId: string | null
}

beforeAll(async () => {
  spyOn(console, 'error').mockImplementation(() => {})
  logoutRoutes = (await import('../logout')).default
})

afterAll(() => {
  mock.restore()
})

beforeEach(() => {
  currentUserId = undefined
  shouldThrowDatabaseError = false
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
  app.route('/', logoutRoutes)

  return app
}

mock.module('@/database/supabase/drizzle', () => ({
  db: {
    update: () => ({
      set: () => ({
        where: () => ({
          returning: () => {
            if (shouldThrowDatabaseError) {
              return Promise.reject(new Error('Database connection failed'))
            }

            if (currentUserId === 1) {
              return Promise.resolve([{ loginId: 'testuser1' }])
            }
            if (currentUserId === 2) {
              return Promise.resolve([{ loginId: 'testuser2' }])
            }

            return Promise.resolve([])
          },
        }),
      }),
    }),
  },
}))

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
  })

  test('인증 정보가 없어도 로그아웃 요청은 성공하고 쿠키를 정리한다', async () => {
    const response = await createApp().request('/', { method: 'POST' }, {})

    expect(response.status).toBe(200)

    const data = (await response.json()) as LogoutResponse
    expect(data).toEqual({ loginId: null })
    expect(getSetCookieHeader(response)).toContain('at=')
    expect(getSetCookieHeader(response)).toContain('rt=')
    expect(getSetCookieHeader(response)).toContain('ah=')
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
