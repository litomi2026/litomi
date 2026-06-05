import { postV1SearchTrendingViewBodySchema } from '@litomi/contracts'
import { getRequestIP } from '@litomi/http/request'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { trendingKeywordsService } from '@/services/TrendingKeywordsService'
import { tooManyRequestsProblemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { checkSearchTrendingViewRateLimit } from './rate-limit'

const trendingViewPostRoutes = new Hono<Env>()

trendingViewPostRoutes.post('/', zProblemValidator('json', postV1SearchTrendingViewBodySchema), async (c) => {
  const { query } = c.req.valid('json')
  const remoteIP = getRequestIP(c.req.raw.headers)

  const rateLimit = await checkSearchTrendingViewRateLimit({
    query,
    remoteIP,
    userId: c.get('userId'),
  })

  if (!rateLimit.allowed) {
    return tooManyRequestsProblemResponse(c, rateLimit.retryAfterSeconds)
  }

  await trendingKeywordsService.trackSearch(query)

  return c.body(null, 204)
})

export default trendingViewPostRoutes
