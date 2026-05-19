import { postV1SearchTrendingBodySchema, type POSTV1SearchTrendingResponse } from '@litomi/contracts'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { trendingKeywordsService } from '@/services/TrendingKeywordsService'
import { zProblemValidator } from '@/utils/validator'

const trendingPostRoutes = new Hono<Env>()

trendingPostRoutes.post('/', zProblemValidator('json', postV1SearchTrendingBodySchema), async (c) => {
  const { keywords } = c.req.valid('json')

  await Promise.all(keywords.map((keyword) => trendingKeywordsService.trackSearch(keyword)))

  return c.json<POSTV1SearchTrendingResponse>({
    success: true,
    tracked: keywords.length,
  })
})

export default trendingPostRoutes
