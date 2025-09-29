import { NextResponse } from 'next/server'
import { z } from 'zod/v4'

import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'
import { TrendingKeyword, trendingKeywordsService } from '@/services/TrendingKeywordsService'
import { sec } from '@/utils/date'

enum TrendingType {
  REALTIME = 'realtime',
  DAILY = 'daily',
  WEEKLY = 'weekly',
}

const GETTrendingKeywordsSchema = z.object({
  type: z.enum(TrendingType).default(TrendingType.REALTIME),
})

export type GETTrendingKeywordsResponse = {
  keywords: TrendingKeyword[]
  type: TrendingType
  updatedAt: Date
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const params = Object.fromEntries(url.searchParams)
  const validation = GETTrendingKeywordsSchema.safeParse(params)

  if (!validation.success) {
    return new Response('Bad Request', { status: 400 })
  }

  const { type } = validation.data

  try {
    let keywords: TrendingKeyword[]
    let cacheMaxAge: number

    switch (type) {
      case 'daily':
        keywords = await trendingKeywordsService.getTrendingDaily(5)
        cacheMaxAge = sec('1 hour')
        break

      case 'realtime':
        keywords = await trendingKeywordsService.getTrendingRealtime(5)
        cacheMaxAge = sec('1 minute')
        break

      case 'weekly':
        keywords = await trendingKeywordsService.getTrendingHistorical(7, 5)
        cacheMaxAge = sec('1 day')
        break

      default:
        keywords = []
        cacheMaxAge = sec('1 minute')
    }

    const response: GETTrendingKeywordsResponse = {
      keywords,
      type,
      updatedAt: new Date(),
    }

    const cacheControl = createCacheControl({
      public: true,
      maxAge: cacheMaxAge,
      sMaxAge: cacheMaxAge,
      swr: cacheMaxAge * 2,
    })

    return NextResponse.json(response, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
