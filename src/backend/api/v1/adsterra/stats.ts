import { Hono } from 'hono'
import ms from 'ms'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { env } from '@/env/server.hono'
import { createCacheControl } from '@/utils/cache-control'
import { sec } from '@/utils/format/date'

const MAX_RANGE_DAYS = 90
const { ADSTERRA_API_KEY } = env

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않아요')
  .refine((value) => Number.isFinite(Date.parse(`${value}T00:00:00Z`)), '날짜 형식이 올바르지 않아요')

const querySchema = z
  .object({
    start_date: dateSchema,
    finish_date: dateSchema,
  })
  .refine(({ start_date, finish_date }) => finish_date >= start_date, {
    message: '시작 날짜는 종료 날짜보다 늦을 수 없어요',
    path: ['finish_date'],
  })
  .refine(
    ({ start_date, finish_date }) => {
      const start = new Date(`${start_date}T00:00:00Z`)
      const finish = new Date(`${finish_date}T00:00:00Z`)
      return diffDaysInclusive(start, finish) <= MAX_RANGE_DAYS
    },
    { message: `최대 ${MAX_RANGE_DAYS}일까지만 조회할 수 있어요`, path: ['start_date'] },
  )

const adsterraStatsResponseSchema = z.object({
  items: z.array(
    z.object({
      date: z.string(),
      impression: z.coerce.number().int().nonnegative(),
      clicks: z.coerce.number().int().nonnegative(),
      ctr: z.coerce.number(),
      cpm: z.coerce.number(),
      revenue: z.coerce.number(),
    }),
  ),
  itemCount: z.coerce.number().int().nonnegative(),
  dbLastUpdateTime: z.string().optional(),
  dbDateTime: z.string().optional(),
})

export type GETV1AdsterraStatsResponse = z.infer<typeof adsterraStatsResponseSchema>

const route = new Hono<Env>()

route.get('/stats', requireAuth, zProblemValidator('query', querySchema), async (c) => {
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

    return c.json<GETV1AdsterraStatsResponse>(parsed.data, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return problemResponse(c, { status: 499, detail: '요청이 취소됐어요' })
    }

    console.error('Adsterra stats error:', error instanceof Error ? error.message : String(error))
    return problemResponse(c, { status: 500, detail: '통계를 불러오지 못했어요' })
  }
})

export default route

function diffDaysInclusive(start: Date, finish: Date): number {
  const diffMs = finish.getTime() - start.getTime()
  const dayMs = ms('1 day')
  return Math.floor(diffMs / dayMs) + 1
}
