import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'

import { Env } from '@/backend'
import { createCacheControl } from '@/crawler/proxy-utils'
import { TrendingKeyword, trendingKeywordsService } from '@/services/TrendingKeywordsService'
import { sec } from '@/utils/date'

enum TrendingType {
  REALTIME = 'realtime',
  DAILY = 'daily',
  WEEKLY = 'weekly',
}

const querySchema = z.object({
  limit: z.coerce.number().int().positive().max(10).default(10),
  type: z.enum(TrendingType).default(TrendingType.REALTIME),
})

export type GETTrendingKeywordsResponse = {
  keywords: TrendingKeyword[]
  updatedAt: Date
}

const trendingRoutes = new Hono<Env>()

trendingRoutes.get('/', zValidator('query', querySchema), async (c) => {
  const { limit, type } = c.req.valid('query')

  const { keywords = [], cacheMaxAge } = {
    [TrendingType.DAILY]: {
      // keywords: await trendingKeywordsService.getTrendingDaily(limit),
      cacheMaxAge: sec('1 hour'),
    },
    [TrendingType.REALTIME]: {
      keywords: await trendingKeywordsService.getTrendingRealtime(limit),
      cacheMaxAge: sec('10 minutes'),
    },
    [TrendingType.WEEKLY]: {
      // keywords: await trendingKeywordsService.getTrendingHistorical(7, limit),
      cacheMaxAge: sec('1 day'),
    },
  }[type]

  const response: GETTrendingKeywordsResponse = {
    keywords,
    updatedAt: new Date(),
  }

  const cacheControl = createCacheControl({
    public: true,
    maxAge: cacheMaxAge,
    sMaxAge: cacheMaxAge,
    swr: cacheMaxAge,
  })

  return c.json(response, { headers: { 'Cache-Control': cacheControl } })
})

export default trendingRoutes
