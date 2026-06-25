import { Locale } from '@litomi/domain/locale'
import { MAX_SEARCH_QUERY_LENGTH } from '@litomi/domain/search/policy'
import { z } from 'zod'

export enum TrendingType {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
}

export const getSearchSuggestionsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).default(10),
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
  limit: z.coerce.number().int().positive().max(15).default(15),
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

export const postV1SearchTrendingViewBodySchema = z.object({
  query: z.string().trim().min(1).max(MAX_SEARCH_QUERY_LENGTH),
})

export type POSTV1SearchTrendingViewBody = z.infer<typeof postV1SearchTrendingViewBodySchema>

export const postV1SearchTrendingViewResponseSchema = z.void()

export type POSTV1SearchTrendingViewResponse = z.infer<typeof postV1SearchTrendingViewResponseSchema>
