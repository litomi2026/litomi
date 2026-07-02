import {
  adsterraStatsResponseSchema,
  type GETV1AdsterraStatsResponse,
  getV1AdsterraStatsQuerySchema,
} from '@litomi/contracts'
import { env } from '@litomi/env/server.hono'
import { createCacheControl } from '@litomi/http/cache-control'
import { sec } from '@litomi/std'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const { ADSTERRA_API_KEY } = env

const route = new Hono<Env>()

route.get('/stats', requireAuth, zProblemValidator('query', getV1AdsterraStatsQuerySchema), async (c) => {
  if (!ADSTERRA_API_KEY) {
    return problemResponse(c, { status: 502, detail: '통계를 불러오지 못했어요' })
  }

  const { start_date, finish_date } = c.req.valid('query')
  const url = new URL('https://api3.adsterratools.com/publisher/stats.json')
  url.searchParams.set('start_date', start_date)
  url.searchParams.set('finish_date', finish_date)
  url.searchParams.set('group_by', 'date')

  try {
    const res = await fetch(url, {
      headers: { 'X-API-Key': ADSTERRA_API_KEY },
      signal: c.req.raw.signal,
    })

    if (!res.ok) {
      console.error('Adsterra stats upstream error:', res.status, res.statusText)
      return problemResponse(c, { status: 502, detail: '통계를 불러오지 못했어요' })
    }

    const json: unknown = await res.json()
    const parsed = adsterraStatsResponseSchema.safeParse(json)

    if (!parsed.success) {
      console.error('Adsterra stats invalid response:', parsed.error.message)
      return problemResponse(c, { status: 502, detail: '통계를 불러오지 못했어요' })
    }

    const cacheControl = createCacheControl({
      public: true,
      maxAge: 10,
      sMaxAge: sec('1 day'),
      swr: sec('1 hour'),
    })

    return c.json(parsed.data satisfies GETV1AdsterraStatsResponse, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return problemResponse(c, { status: 499, detail: '요청이 취소됐어요' })
    }

    console.error('Adsterra stats error:', error instanceof Error ? error.message : String(error))
    return problemResponse(c, { status: 500, detail: '통계를 불러오지 못했어요' })
  }
})

export default route
