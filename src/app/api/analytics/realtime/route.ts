import { BetaAnalyticsDataClient } from '@google-analytics/data'

import { SHORT_NAME } from '@/constants'
import { GA_PROPERTY_ID, GA_SERVICE_ACCOUNT_EMAIL, GA_SERVICE_ACCOUNT_KEY } from '@/constants/env'
import { REALTIME_PAGE_VIEW_MIN_THRESHOLD } from '@/constants/policy'
import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'

let analyticsClient: BetaAnalyticsDataClient | null = null

export async function GET(request: Request) {
  if (!GA_SERVICE_ACCOUNT_EMAIL || !GA_SERVICE_ACCOUNT_KEY || !GA_PROPERTY_ID) {
    return new Response('Service Unavailable', { status: 503 })
  }

  const client = getAnalyticsClient()

  try {
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

    const totalActiveUsers = totalActiveUsersResponse.rows?.[0].metricValues?.[0].value ?? '0'

    const pageRanking = pageViewRankingResponse.rows?.map((row) => ({
      page: row.dimensionValues?.[0]?.value?.replace(` - ${SHORT_NAME}`, '') ?? '(알 수 없음)',
      activeUsers: parseInt(row.metricValues?.[0]?.value ?? '0', 10),
    }))

    const response = {
      totalActiveUsers: parseInt(totalActiveUsers, 10),
      pageRanking,
      timestamp: new Date(),
    }

    const cacheControl = createCacheControl({
      public: true,
      maxAge: 30,
      sMaxAge: 30,
      swr: 30,
    })

    return Response.json(response, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    return handleRouteError(error, request)
  }
}

function getAnalyticsClient() {
  if (!analyticsClient) {
    analyticsClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: GA_SERVICE_ACCOUNT_EMAIL,
        private_key: GA_SERVICE_ACCOUNT_KEY,
      },
    })
  }
  return analyticsClient
}
