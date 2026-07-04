import { z } from 'zod'

import { INVALID_PARAM } from '../problem'

const ADSTERRA_STATS_MAX_RANGE_DAYS = 90
const DAY_MS = 24 * 60 * 60 * 1000

const adsterraStatsDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => Number.isFinite(Date.parse(`${value}T00:00:00Z`)), {
    params: { code: INVALID_PARAM.INVALID_DATE },
  })

export const getV1AdsterraStatsQuerySchema = z
  .object({
    start_date: adsterraStatsDateSchema,
    finish_date: adsterraStatsDateSchema,
  })
  .refine(({ start_date, finish_date }) => finish_date >= start_date, {
    params: { code: INVALID_PARAM.DATE_RANGE_INVERTED },
    path: ['finish_date'],
  })
  .refine(
    ({ start_date, finish_date }) => {
      const start = new Date(`${start_date}T00:00:00Z`)
      const finish = new Date(`${finish_date}T00:00:00Z`)
      return diffDaysInclusive(start, finish) <= ADSTERRA_STATS_MAX_RANGE_DAYS
    },
    {
      params: { code: INVALID_PARAM.DATE_RANGE_TOO_LONG },
      path: ['start_date'],
    },
  )

export const adsterraStatsResponseSchema = z.object({
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

function diffDaysInclusive(start: Date, finish: Date): number {
  return Math.floor((finish.getTime() - start.getTime()) / DAY_MS) + 1
}
