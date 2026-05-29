import { catalogMangaRecordsToMangaMap } from '@litomi/catalog/manga'
import { getV1MangaRecommendationQuerySchema, type GETV1MangaRecommendationResponse } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { mangaRecommendationSetTable, mangaRecommendationTable } from '@litomi/db/app/recommendation'
import { selectCatalogMangaRecordsByIds } from '@litomi/db/query/catalog-manga'
import { decodeMangaRecommendationReasonMask } from '@litomi/domain/manga-recommendation/reason'
import { asc, eq } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAdult } from '@/middleware/require-adult'
import { requireAuth } from '@/middleware/require-auth'
import { privateCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.get(
  '/',
  requireAuth,
  requireAdult,
  zProblemValidator('query', getV1MangaRecommendationQuerySchema),
  async (c) => {
    const userId = c.get('userId')!
    const { limit } = c.req.valid('query')

    try {
      const rows = await db
        .select({
          mangaId: mangaRecommendationTable.mangaId,
          rank: mangaRecommendationTable.rank,
          reasonMask: mangaRecommendationTable.reasonMask,
          score: mangaRecommendationTable.score,
          generatedAt: mangaRecommendationSetTable.generatedAt,
        })
        .from(mangaRecommendationTable)
        .innerJoin(mangaRecommendationSetTable, eq(mangaRecommendationSetTable.userId, mangaRecommendationTable.userId))
        .where(eq(mangaRecommendationTable.userId, userId))
        .orderBy(asc(mangaRecommendationTable.rank))
        .limit(limit)

      const mangaList = await selectCatalogMangaRecordsByIds(rows.map((row) => row.mangaId))
      const mangaMap = catalogMangaRecordsToMangaMap(mangaList)

      const result = {
        items: rows.map((row) => ({
          mangaId: row.mangaId,
          rank: row.rank,
          score: row.score,
          reasons: decodeMangaRecommendationReasonMask(row.reasonMask),
          generatedAt: row.generatedAt.getTime(),
          manga: mangaMap.get(row.mangaId),
        })),
      }

      return c.json<GETV1MangaRecommendationResponse>(result, { headers: { 'Cache-Control': privateCacheControl } })
    } catch (error) {
      console.error(error)
      return problemResponse(c, { status: 500, detail: '추천 작품을 불러오지 못했어요' })
    }
  },
)

export default route
