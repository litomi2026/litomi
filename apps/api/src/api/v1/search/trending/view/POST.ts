import { postV1SearchTrendingViewBodySchema } from '@litomi/contracts'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { trendingKeywordsService } from '@/services/TrendingKeywordsService'
import { zProblemValidator } from '@/utils/validator'

const trendingViewPostRoutes = new Hono<Env>()

trendingViewPostRoutes.post('/', zProblemValidator('json', postV1SearchTrendingViewBodySchema), async (c) => {
  const { query } = c.req.valid('json')

  await trendingKeywordsService.trackSearch(query)

  return c.body(null, 204)
})

export default trendingViewPostRoutes
