import { afterAll, afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

type RealtimeModule = typeof import('../realtime')

const runRealtimeReportMock = mock(async (request?: { dimensions?: unknown[] }) => {
  if (request?.dimensions) {
    return [
      {
        rows: [
          {
            dimensionValues: [{ value: '홈 - litomi' }],
            metricValues: [{ value: '7' }],
          },
        ],
      },
    ]
  }

  return [
    {
      rows: [
        {
          metricValues: [{ value: '12' }],
        },
      ],
    },
  ]
})

const analyticsClientConstructorMock = mock((options?: unknown) => options)
const analyticsClientCloseMock = mock(async () => {})

class BetaAnalyticsDataClientMock {
  constructor(options?: unknown) {
    analyticsClientConstructorMock(options)
    return {
      close: analyticsClientCloseMock,
      runRealtimeReport: runRealtimeReportMock,
    }
  }
}

const envMock: {
  GA_PROPERTY_ID: string | undefined
} = {
  GA_PROPERTY_ID: '123456789',
}

let importVersion = 0

mock.module('@google-analytics/data', () => ({
  BetaAnalyticsDataClient: BetaAnalyticsDataClientMock,
}))

mock.module('@/env/server.hono', () => ({
  env: envMock,
}))

async function importFreshRealtime(): Promise<RealtimeModule> {
  return import(`../realtime?test=${importVersion++}`) as Promise<RealtimeModule>
}

describe('GET /api/v1/analytics/realtime', () => {
  beforeEach(() => {
    envMock.GA_PROPERTY_ID = '123456789'
    analyticsClientConstructorMock.mockClear()
    analyticsClientCloseMock.mockClear()
    runRealtimeReportMock.mockClear()
  })

  afterEach(() => {
    analyticsClientConstructorMock.mockClear()
    analyticsClientCloseMock.mockClear()
    runRealtimeReportMock.mockClear()
  })

  afterAll(() => {
    mock.restore()
  })

  test('GA_PROPERTY_ID가 없으면 503을 반환한다', async () => {
    envMock.GA_PROPERTY_ID = undefined

    const { default: realtimeRoutes } = await importFreshRealtime()
    const response = await realtimeRoutes.fetch(new Request('http://localhost/'))

    expect(response.status).toBe(503)
    expect(analyticsClientConstructorMock).toHaveBeenCalled()
  })

  test('서비스 계정 키가 없으면 ADC로 클라이언트를 생성한다', async () => {
    const { default: realtimeRoutes } = await importFreshRealtime()
    const response = await realtimeRoutes.fetch(new Request('http://localhost/'))

    expect(response.status).toBe(200)
    expect(analyticsClientConstructorMock).toHaveBeenCalled()
  })
})
