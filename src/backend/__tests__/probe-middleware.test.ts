import { afterAll, beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test'

import { CookieKey } from '@/constants/storage'

const refreshSessionMock = mock(async () => ({
  ok: false as const,
  reason: 'missing' as const,
  cookies: [],
}))

mock.module('@/backend/otel', () => ({
  initBackendOtel: () => {},
}))

mock.module('hono/ip-restriction', () => ({
  ipRestriction: () => async (_c: unknown, next: () => Promise<void>) => {
    await next()
  },
}))

mock.module('@/query/session', () => ({
  refreshSession: refreshSessionMock,
}))

let app: typeof import('../index').default
let markProbeStartupComplete: typeof import('../probe/state').markProbeStartupComplete
let resetProbeStateForTest: typeof import('../probe/state').resetProbeStateForTest

beforeAll(async () => {
  ;({ markProbeStartupComplete, resetProbeStateForTest } = await import('../probe/state'))
  app = (await import('../index')).default
})

beforeEach(() => {
  refreshSessionMock.mockClear()
  resetProbeStateForTest()
  markProbeStartupComplete()
})

afterAll(() => {
  mock.restore()
})

describe('probe middleware isolation', () => {
  test('probe 경로는 refresh token 이 있어도 auth refresh 를 호출하지 않는다', async () => {
    const response = await app.request('/ready', {
      headers: {
        Cookie: `${CookieKey.REFRESH_TOKEN}=refresh-token`,
      },
    })

    expect(response.status).toBe(200)
    expect(refreshSessionMock).not.toHaveBeenCalled()
  })

  test('SIGTERM 이후 /ready 만 unready 가 되고 /health 는 계속 200 을 반환한다', async () => {
    process.emit('SIGTERM', 'SIGTERM')

    const readyResponse = await app.request('/ready')
    const healthResponse = await app.request('/health')
    const readyData = (await readyResponse.json()) as {
      reason: string
      status: string
      timestamp: string
    }

    expect(readyResponse.status).toBe(503)
    expect(readyData.status).toBe('not-ready')
    expect(readyData.reason).toBe('draining')
    expect(healthResponse.status).toBe(200)
    expect(refreshSessionMock).not.toHaveBeenCalled()
  })
})
