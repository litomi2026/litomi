import { z } from 'zod'

const ADSTERRA_STATS_MAX_RANGE_DAYS = 90
const DAY_MS = 24 * 60 * 60 * 1000

const adsterraStatsDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않아요')
  .refine((value) => Number.isFinite(Date.parse(`${value}T00:00:00Z`)), '날짜 형식이 올바르지 않아요')

export const getV1AdsterraStatsQuerySchema = z
  .object({
    start_date: adsterraStatsDateSchema,
    finish_date: adsterraStatsDateSchema,
  })
  .refine(({ start_date, finish_date }) => finish_date >= start_date, {
    message: '시작 날짜는 종료 날짜보다 늦을 수 없어요',
    path: ['finish_date'],
  })
  .refine(
    ({ start_date, finish_date }) => {
      const start = new Date(`${start_date}T00:00:00Z`)
      const finish = new Date(`${finish_date}T00:00:00Z`)
      return diffDaysInclusive(start, finish) <= ADSTERRA_STATS_MAX_RANGE_DAYS
    },
    { message: `최대 ${ADSTERRA_STATS_MAX_RANGE_DAYS}일까지만 조회할 수 있어요`, path: ['start_date'] },
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
