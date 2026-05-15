import { z } from 'zod'

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
