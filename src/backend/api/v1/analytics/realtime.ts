import 'server-only'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { GaxiosError } from 'gaxios'
import { Hono } from 'hono'

import { Env } from '@/backend'
import { problemResponse } from '@/backend/utils/problem'
import { SHORT_NAME } from '@/constants'
import { REALTIME_PAGE_VIEW_MIN_THRESHOLD } from '@/constants/policy'
import { env } from '@/env/server.hono'
import { createCacheControl } from '@/utils/cache-control'

const { GA_PROPERTY_ID } = env

export type GETV1AnalyticsRealtimeResponse = {
  totalActiveUsers: number
  pageRanking: PageRanking[]
  timestamp: Date
}

export type PageRanking = {
  page: string
  activeUsers: number
}

const analyticsClient = new BetaAnalyticsDataClient({ fallback: 'rest' })

registerAnalyticsClientShutdown()

const realtimeRoutes = new Hono<Env>()

realtimeRoutes.get('/', async (c) => {
  if (!GA_PROPERTY_ID) {
    return problemResponse(c, { status: 503 })
  }

  try {
    const [[totalActiveUsersResponse], [pageViewRankingResponse]] = await Promise.all([
      analyticsClient.runRealtimeReport({
        property: `properties/${GA_PROPERTY_ID}`,
        metrics: [{ name: 'activeUsers' }],
      }),
      analyticsClient.runRealtimeReport({
        property: `properties/${GA_PROPERTY_ID}`,
        metrics: [{ name: 'screenPageViews' }],
        dimensions: [{ name: 'unifiedScreenName' }],
        dimensionFilter: {
          filter: {
            fieldName: 'unifiedScreenName',
            stringFilter: { value: `- ${SHORT_NAME}`, matchType: 'ENDS_WITH' },
          },
        },
        metricFilter: {
          filter: {
            fieldName: 'screenPageViews',
            numericFilter: { operation: 'GREATER_THAN', value: { int64Value: REALTIME_PAGE_VIEW_MIN_THRESHOLD } },
          },
        },
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 20,
      }),
    ])

    const totalActiveUsers = parseInt(totalActiveUsersResponse.rows?.[0]?.metricValues?.[0]?.value ?? '0', 10)

    const pageRanking: PageRanking[] =
      pageViewRankingResponse.rows?.map((row) => ({
        page: row.dimensionValues?.[0]?.value?.replace(` - ${SHORT_NAME}`, '') ?? '(알 수 없음)',
        activeUsers: parseInt(row.metricValues?.[0]?.value ?? '0', 10),
      })) ?? []

    const response: GETV1AnalyticsRealtimeResponse = {
      totalActiveUsers,
      pageRanking,
      timestamp: new Date(),
    }

    const cacheControl = createCacheControl({
      public: true,
      maxAge: 30,
      sMaxAge: 30,
      swr: 30,
    })

    return c.json(response, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return problemResponse(c, { status: 499, detail: '요청이 취소됐어요' })
    }

    if (error instanceof GaxiosError) {
      console.error('Google Analytics realtime upstream error:', error.status, error.message)
    } else {
      console.error('Google Analytics realtime error:', error instanceof Error ? error.message : String(error))
    }

    return problemResponse(c, { status: 503 })
  }
})

function registerAnalyticsClientShutdown() {
  function shutdown() {
    analyticsClient.close().catch((error: unknown) => {
      console.error('Failed to close Google Analytics Data client', error)
    })
  }

  process.once('SIGTERM', shutdown)
  process.once('SIGINT', shutdown)
}

export default realtimeRoutes
