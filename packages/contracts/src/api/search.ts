import { Locale } from '@litomi/domain/locale'
import { MAX_SEARCH_QUERY_LENGTH } from '@litomi/domain/search/policy'
import { z } from 'zod'

export enum TrendingType {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
}

export const getV1SearchSuggestionQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).default(10),
  locale: z.enum(Locale),
  query: z.string().trim().min(2).max(200),
})

export type GETV1SearchSuggestionResponse = { label: string; value: string }[]

export const getV1SearchTrendingQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(15).default(15),
  locale: z.enum(Locale),
  type: z.enum(TrendingType).default(TrendingType.HOURLY),
})

export interface GETV1SearchTrendingResponse {
  keywords: { value: string; label: string }[]
  updatedAt: Date
}

export const postV1SearchTrendingViewBodySchema = z.object({
  query: z.string().trim().min(1).max(MAX_SEARCH_QUERY_LENGTH),
})
