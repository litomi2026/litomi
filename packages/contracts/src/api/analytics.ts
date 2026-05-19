import { z } from 'zod'

export const pageRankingSchema = z.object({
  page: z.string(),
  activeUsers: z.number(),
})

export type PageRanking = z.infer<typeof pageRankingSchema>

export const getV1AnalyticsRealtimeResponseSchema = z.object({
  totalActiveUsers: z.number(),
  pageRanking: z.array(pageRankingSchema),
  timestamp: z.string().datetime(),
})

export type GETV1AnalyticsRealtimeResponse = z.infer<typeof getV1AnalyticsRealtimeResponseSchema>
