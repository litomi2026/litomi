import { BetaAnalyticsDataClient } from '@google-analytics/data'
import type { GETV1AnalyticsRealtimeResponse, PageRanking } from '@litomi/contracts'
import { APP_METADATA } from '@litomi/domain/app/metadata'
import {
  REALTIME_EXCLUDED_PAGE_TITLES,
  REALTIME_PAGE_RANKING_LIMIT,
  REALTIME_PAGE_VIEW_MIN_THRESHOLD,
} from '@litomi/domain/ranking/policy'
import { createCacheControlHeaders } from '@litomi/http/cache-control'
import { GaxiosError } from 'gaxios'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { env } from '@/env'
import { problemResponse } from '@/utils/problem'

const { GA_PROPERTY_ID } = env
const PAGE_TITLE_SUFFIXES = Object.values(APP_METADATA).map(({ shortName }) => ` - ${shortName}`)

const realtimeRoutes = new Hono<Env>()
const analyticsClient = new BetaAnalyticsDataClient({ fallback: 'rest' })

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
          orGroup: {
            expressions: PAGE_TITLE_SUFFIXES.map((suffix) => ({
              filter: {
                fieldName: 'unifiedScreenName',
                stringFilter: {
                  value: suffix,
                  matchType: 'ENDS_WITH',
                },
              },
            })),
          },
        },
        metricFilter: {
          filter: {
            fieldName: 'screenPageViews',
            numericFilter: { operation: 'GREATER_THAN', value: { int64Value: REALTIME_PAGE_VIEW_MIN_THRESHOLD } },
          },
        },
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 100,
      }),
    ])

    const totalActiveUsers = parseInt(totalActiveUsersResponse.rows?.[0]?.metricValues?.[0]?.value ?? '0', 10)
    const viewsByPage = new Map<string, number>()

    for (const row of pageViewRankingResponse.rows ?? []) {
      const screenName = row.dimensionValues?.[0]?.value ?? ''
      const suffix = PAGE_TITLE_SUFFIXES.find((s) => screenName.endsWith(s))

      if (!suffix) {
        continue
      }

      const page = screenName.slice(0, -suffix.length)
      if (REALTIME_EXCLUDED_PAGE_TITLES.has(page)) {
        continue
      }

      const pageViews = parseInt(row.metricValues?.[0]?.value ?? '0', 10)
      viewsByPage.set(page, (viewsByPage.get(page) ?? 0) + pageViews)
    }

    const pageRanking: PageRanking[] = [...viewsByPage]
      .map(([page, pageViews]) => ({ page, pageViews }))
      .sort((a, b) => b.pageViews - a.pageViews)
      .slice(0, REALTIME_PAGE_RANKING_LIMIT)

    const response = {
      totalActiveUsers,
      pageRanking,
      timestamp: new Date().toISOString(),
    } satisfies GETV1AnalyticsRealtimeResponse

    const cacheControlHeaders = createCacheControlHeaders({
      browser: {
        public: true,
        maxAge: 30,
      },
      cloudflare: {
        public: true,
        maxAge: 30,
        swr: 30,
      },
    })

    return c.json(response, { headers: cacheControlHeaders })
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

export async function shutdownAnalyticsClient(): Promise<void> {
  try {
    await analyticsClient.close()
  } catch (error) {
    console.error('Failed to close Google Analytics Data client', error)
  }
}

export default realtimeRoutes
