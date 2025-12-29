import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { Hono } from 'hono'
import 'server-only'

import { Env } from '@/backend'
import { problemResponse } from '@/backend/utils/problem'
import { SHORT_NAME } from '@/constants'
import { REALTIME_PAGE_VIEW_MIN_THRESHOLD } from '@/constants/policy'
import { env } from '@/env/server.hono'
import { createCacheControl } from '@/utils/cache-control'

const { GA_PROPERTY_ID, GA_SERVICE_ACCOUNT_EMAIL, GA_SERVICE_ACCOUNT_KEY } = env

export type GETV1AnalyticsRealtimeResponse = {
  totalActiveUsers: number
  pageRanking: PageRanking[]
  timestamp: Date
}

export type PageRanking = {
  page: string
  activeUsers: number
}

let analyticsClient: BetaAnalyticsDataClient | null = null

const realtimeRoutes = new Hono<Env>()

realtimeRoutes.get('/', async (c) => {
  if (!GA_SERVICE_ACCOUNT_EMAIL || !GA_SERVICE_ACCOUNT_KEY || !GA_PROPERTY_ID) {
    return problemResponse(c, { status: 503 })
  }

  try {
    const client = getAnalyticsClient()

    const [[totalActiveUsersResponse], [pageViewRankingResponse]] = await Promise.all([
      client.runRealtimeReport({
        property: `properties/${GA_PROPERTY_ID}`,
        metrics: [{ name: 'activeUsers' }],
      }),
      client.runRealtimeReport({
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
    console.error(error)
    return problemResponse(c, { status: 503 })
  }
})

function getAnalyticsClient() {
  if (!analyticsClient) {
    analyticsClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: GA_SERVICE_ACCOUNT_EMAIL,
        private_key: GA_SERVICE_ACCOUNT_KEY,
      },
      fallback: 'rest',
    })
  }
  return analyticsClient
}

export default realtimeRoutes
