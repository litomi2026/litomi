import { Locale } from '@litomi/domain/locale'
import { z } from 'zod'

export enum TrendingType {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
}

export const getSearchSuggestionsQuerySchema = z.object({
  locale: z.enum(Locale),
  query: z.string().trim().min(2).max(200),
})

export type GETSearchSuggestionsQuery = z.infer<typeof getSearchSuggestionsQuerySchema>

export const getSearchSuggestionsResponseSchema = z.array(
  z.object({
    label: z.string(),
    value: z.string(),
  }),
)

export type GETSearchSuggestionsResponse = z.infer<typeof getSearchSuggestionsResponseSchema>

export const getTrendingKeywordsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(10).default(10),
  locale: z.enum(Locale),
  type: z.enum(TrendingType).default(TrendingType.HOURLY),
})

export type GETTrendingKeywordsQuery = z.infer<typeof getTrendingKeywordsQuerySchema>

export const getTrendingKeywordsResponseSchema = z.object({
  keywords: z.array(
    z.object({
      value: z.string(),
      label: z.string(),
    }),
  ),
  updatedAt: z.date(),
})

export type GETTrendingKeywordsResponse = z.infer<typeof getTrendingKeywordsResponseSchema>

export const postV1SearchTrendingBodySchema = z.object({
  keywords: z.array(z.string().min(1).max(100)).min(1).max(10),
})

export type POSTV1SearchTrendingBody = z.infer<typeof postV1SearchTrendingBodySchema>

export const postV1SearchTrendingResponseSchema = z.object({
  success: z.boolean(),
  tracked: z.number(),
})

export type POSTV1SearchTrendingResponse = z.infer<typeof postV1SearchTrendingResponseSchema>
