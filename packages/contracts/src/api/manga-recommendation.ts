import {
  MANGA_RECOMMENDATION_PER_PAGE,
  MAX_MANGA_RECOMMENDATION_PER_PAGE,
} from '@litomi/domain/manga-recommendation/policy'
import { MANGA_RECOMMENDATION_REASONS } from '@litomi/domain/manga-recommendation/reason'
import { z } from 'zod'

import { catalogMangaSchema } from '../catalog/manga'

export const getV1MangaRecommendationQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_MANGA_RECOMMENDATION_PER_PAGE)
    .default(MANGA_RECOMMENDATION_PER_PAGE),
})

export type GETV1MangaRecommendationQuery = z.infer<typeof getV1MangaRecommendationQuerySchema>

export const mangaRecommendationReasonSchema = z.enum(MANGA_RECOMMENDATION_REASONS)

export const mangaRecommendationSchema = z.object({
  mangaId: z.number(),
  rank: z.number(),
  score: z.number(),
  reasons: z.array(mangaRecommendationReasonSchema),
  generatedAt: z.number(),
  manga: catalogMangaSchema.optional(),
})

export type MangaRecommendation = z.infer<typeof mangaRecommendationSchema>

export const getV1MangaRecommendationResponseSchema = z.object({
  items: z.array(mangaRecommendationSchema),
})

export type GETV1MangaRecommendationResponse = z.infer<typeof getV1MangaRecommendationResponseSchema>
