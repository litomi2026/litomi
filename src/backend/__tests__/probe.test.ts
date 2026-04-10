import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import { env } from '@/env/server.common'

import probeRoutes from '../probe'
import { markProbeDraining, markProbeStartupComplete, resetProbeStateForTest } from '../probe/state'

type HealthResponse = {
  status: 'ok'
  timestamp: string
}

type ReadyResponse =
  | {
      reason: 'draining' | 'starting'
      status: 'not-ready'
      timestamp: string
    }
  | {
      status: 'ready'
      timestamp: string
    }

type StartupResponse =
  | {
      status: 'started'
      timestamp: string
    }
  | {
      status: 'starting'
      timestamp: string
    }

beforeEach(() => {
  resetProbeStateForTest()
})

afterEach(() => {
  resetProbeStateForTest()
})

describe('probeRoutes', () => {
  test('GET /startup 은 startup 완료 전 503 starting 을 반환한다', async () => {
    const response = await probeRoutes.request('/startup')
    const data = (await response.json()) as StartupResponse

    expect(response.status).toBe(503)
    expect(data.status).toBe('starting')
    expect(response.headers.get('cache-control')).toBe('no-store')
  })

  test('GET /startup 은 startup 완료 후 200 started 를 반환한다', async () => {
    markProbeStartupComplete()

    const response = await probeRoutes.request('/startup')
    const data = (await response.json()) as StartupResponse

    expect(response.status).toBe(200)
    expect(data.status).toBe('started')
  })

  test('GET /health 는 draining 상태여도 항상 200 을 반환한다', async () => {
    markProbeDraining()

    const response = await probeRoutes.request('/health')
    const data = (await response.json()) as HealthResponse

    expect(response.status).toBe(200)
    expect(data.status).toBe('ok')
    expect(data.timestamp).toBeDefined()
    expect(response.headers.get('cache-control')).toBe('no-store')
  })

  test('GET /health 는 허용된 origin 에 대해 CORS 헤더를 반환한다', async () => {
    const response = await probeRoutes.request('/health', {
      headers: {
        Origin: env.APP_ORIGIN,
      },
    })

    expect(response.headers.get('access-control-allow-origin')).toBe(env.APP_ORIGIN)
    expect(response.headers.get('access-control-allow-credentials')).toBe('true')
    expect(response.headers.get('vary')).toBe('Origin')
  })

  test('GET /ready 는 startup 완료 전 503 not-ready(starting) 을 반환한다', async () => {
    const response = await probeRoutes.request('/ready')
    const data = (await response.json()) as ReadyResponse

    expect(response.status).toBe(503)
    expect(data.status).toBe('not-ready')
    expect('reason' in data ? data.reason : undefined).toBe('starting')
  })

  test('GET /ready 는 startup 완료 후 200 ready 를 반환한다', async () => {
    markProbeStartupComplete()

    const response = await probeRoutes.request('/ready')
    const data = (await response.json()) as ReadyResponse

    expect(response.status).toBe(200)
    expect(data.status).toBe('ready')
  })

  test('GET /ready 는 draining 상태에서 503 not-ready(draining) 을 반환한다', async () => {
    markProbeStartupComplete()
    markProbeDraining()

    const response = await probeRoutes.request('/ready')
    const data = (await response.json()) as ReadyResponse

    expect(response.status).toBe(503)
    expect(data.status).toBe('not-ready')
    expect('reason' in data ? data.reason : undefined).toBe('draining')
  })
})
