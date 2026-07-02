import { Locale } from '@litomi/domain/locale'
import {
  MANGA_RECOMMENDATION_PER_PAGE,
  MAX_MANGA_RECOMMENDATION_PER_PAGE,
} from '@litomi/domain/manga-recommendation/policy'
import type { MangaRecommendationReason } from '@litomi/domain/manga-recommendation/reason'
import { z } from 'zod'

import type { CatalogManga } from '../catalog/manga'

export const getV1MangaRecommendationQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_MANGA_RECOMMENDATION_PER_PAGE)
    .default(MANGA_RECOMMENDATION_PER_PAGE),
  locale: z.enum(Locale),
})

export interface MangaRecommendation {
  mangaId: number
  rank: number
  score: number
  reasons: MangaRecommendationReason[]
  generatedAt: number
  manga?: CatalogManga
}

export interface GETV1MangaRecommendationResponse {
  items: MangaRecommendation[]
}
