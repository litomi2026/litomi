'use client'

import type { GETV1MangaRecommendationResponse } from '@litomi/contracts'

import { MANGA_RECOMMENDATION_PER_PAGE } from '@litomi/domain/manga-recommendation/policy'
import { useQuery } from '@tanstack/react-query'
import ms from 'ms'
import { useLocale } from 'next-intl'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { buildSearchParams, fetchAPIData } from '@/utils/api-request'

type Options = {
  enabled: boolean
  limit?: number
  userId?: number
}

export default function useMangaRecommendationQuery({
  enabled,
  limit = MANGA_RECOMMENDATION_PER_PAGE,
  userId,
}: Options) {
  const locale = useLocale()

  return useQuery({
    queryKey: QueryKeys.mangaRecommendations(userId ?? 0, limit, locale),
    queryFn: () => fetchMangaRecommendations(limit, locale),
    enabled: enabled && Boolean(userId),
    staleTime: ms('1 day'),
    gcTime: ms('1 day'),
    meta: { requiresAdult: true },
  })
}

async function fetchMangaRecommendations(limit: number, locale: string) {
  const searchParams = buildSearchParams({ limit, locale })
  const url = `/api/v1/manga/recommendation?${searchParams}`
  const { data } = await fetchAPIData<GETV1MangaRecommendationResponse>(url)
  return data
}
