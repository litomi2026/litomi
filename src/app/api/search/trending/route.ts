import { NextResponse } from 'next/server'
import { z } from 'zod'

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
    const limit = 10
    let keywords: TrendingKeyword[] = []
    let cacheMaxAge: number = sec('1 minute')

    switch (type) {
      case 'daily':
        keywords = await trendingKeywordsService.getTrendingDaily(limit)
        cacheMaxAge = sec('1 hour')
        break

      case 'realtime':
        keywords = await trendingKeywordsService.getTrendingRealtime(limit)
        cacheMaxAge = sec('10 minutes')
        break

      case 'weekly':
        keywords = await trendingKeywordsService.getTrendingHistorical(7, limit)
        cacheMaxAge = sec('1 day')
        break
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
      swr: cacheMaxAge,
    })

    return NextResponse.json(response, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
