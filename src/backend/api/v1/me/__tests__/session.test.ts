import { afterAll, beforeAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'

import type { Env } from '@/backend'

import { requireAuth } from '@/backend/middleware/require-auth'
import { hashSessionToken } from '@/utils/session'

const readCurrentSessionFamilyIdByTokenHashMock = mock(async () => sessionRouteState.currentFamilyId)
const revokeAllSessionsByUserIdMock = mock(async () => {})
const revokeOtherSessionFamiliesByUserIdMock = mock(async () => {})
const revokeSessionFamilyByIdForUserMock = mock(async () => sessionRouteState.revokedFamily)

const sessionRouteState: {
  currentFamilyId: string | null
  revokedFamily: { id: string } | null
} = {
  currentFamilyId: 'family-1',
  revokedFamily: { id: 'family-2' },
}

mock.module('@/backend/api/v1/me/session/query', () => ({
  readCurrentSessionFamilyIdByTokenHash: readCurrentSessionFamilyIdByTokenHashMock,
  revokeAllSessionsByUserId: revokeAllSessionsByUserIdMock,
  revokeOtherSessionFamiliesByUserId: revokeOtherSessionFamiliesByUserIdMock,
  revokeSessionFamilyByIdForUser: revokeSessionFamilyByIdForUserMock,
}))

let sessionRoutes: typeof import('../session').default

beforeAll(async () => {
  spyOn(console, 'error').mockImplementation(() => {})
  sessionRoutes = (await import('../session')).default
})

afterAll(() => {
  mock.restore()
})

beforeEach(() => {
  readCurrentSessionFamilyIdByTokenHashMock.mockClear()
  revokeAllSessionsByUserIdMock.mockClear()
  revokeOtherSessionFamiliesByUserIdMock.mockClear()
  revokeSessionFamilyByIdForUserMock.mockClear()

  sessionRouteState.currentFamilyId = 'family-1'
  sessionRouteState.revokedFamily = { id: 'family-2' }
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
  app.use('*', requireAuth)
  app.route('/session', sessionRoutes)

  return app
}

function getSetCookieHeader(response: Response) {
  return Array.from(response.headers.entries())
    .filter(([key]) => key.toLowerCase() === 'set-cookie')
    .map(([, value]) => value)
    .join('\n')
}

describe('DELETE /api/v1/me/session', () => {
  test('모든 로그인 유지 세션 종료 시 인증 쿠키를 비운다', async () => {
    const response = await createApp().request('/session/all', { method: 'DELETE' }, { userId: 7 })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      clearedCurrentSession: true,
      message: '모든 기기에서 로그아웃했어요',
    })
    expect(revokeAllSessionsByUserIdMock).toHaveBeenCalledWith(7, expect.any(Date))
    expect(getSetCookieHeader(response)).toContain('at=')
    expect(getSetCookieHeader(response)).toContain('rt=')
    expect(getSetCookieHeader(response)).toContain('ah=')
  })

  test('현재 세션을 개별 종료하려고 하면 막는다', async () => {
    const familyId = '11111111-1111-4111-8111-111111111111'
    sessionRouteState.currentFamilyId = familyId

    const response = await createApp().request(
      `/session/${familyId}`,
      {
        method: 'DELETE',
        headers: {
          Cookie: 'rt=refresh-token',
        },
      },
      { userId: 7 },
    )

    expect(response.status).toBe(400)
    expect(revokeSessionFamilyByIdForUserMock).not.toHaveBeenCalled()
    expect(readCurrentSessionFamilyIdByTokenHashMock).toHaveBeenCalledWith(7, hashSessionToken('refresh-token'))
  })

  test('현재 persistent 세션이 없으면 다른 세션 종료는 전체 종료 메시지를 반환한다', async () => {
    sessionRouteState.currentFamilyId = null

    const response = await createApp().request('/session/others', { method: 'DELETE' }, { userId: 7 })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      clearedCurrentSession: false,
      message: '표시된 기기에서 모두 로그아웃했어요',
    })
    expect(revokeOtherSessionFamiliesByUserIdMock).toHaveBeenCalledWith(7, null, expect.any(Date))
  })

  test('인증이 없으면 401을 반환한다', async () => {
    const response = await createApp().request('/session/all', { method: 'DELETE' }, {})

    expect(response.status).toBe(401)
  })
})
