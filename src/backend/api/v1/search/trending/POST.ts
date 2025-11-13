import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { trendingKeywordsService } from '@/services/TrendingKeywordsService'

const bodySchema = z.object({
  keywords: z.array(z.string().min(1).max(100)).min(1).max(10),
})

export type POSTV1SearchTrendingBody = z.infer<typeof bodySchema>

export type POSTV1SearchTrendingResponse = {
  success: boolean
  tracked: number
}

const trendingPostRoutes = new Hono<Env>()

trendingPostRoutes.post('/', zValidator('json', bodySchema), async (c) => {
  const { keywords } = c.req.valid('json')

  await Promise.all(keywords.map((keyword) => trendingKeywordsService.trackSearch(keyword)))

  return c.json<POSTV1SearchTrendingResponse>({
    success: true,
    tracked: keywords.length,
  })
})

export default trendingPostRoutes
