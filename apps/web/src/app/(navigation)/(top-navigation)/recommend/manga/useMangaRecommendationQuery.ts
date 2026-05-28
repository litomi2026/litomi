'use client'

import type { GETV1MangaRecommendationResponse } from '@litomi/contracts'

import { MANGA_RECOMMENDATION_PER_PAGE } from '@litomi/domain/manga-recommendation/policy'
import { env } from '@litomi/env/client'
import { useQuery } from '@tanstack/react-query'
import ms from 'ms'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_API_ORIGIN } = env

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
  return useQuery({
    queryKey: QueryKeys.mangaRecommendations(userId ?? 0, limit),
    queryFn: () => fetchMangaRecommendations(limit),
    enabled: enabled && Boolean(userId),
    staleTime: ms('1 day'),
    gcTime: ms('1 day'),
    meta: { requiresAdult: true },
  })
}

async function fetchMangaRecommendations(limit: number) {
  const url = new URL('/api/v1/manga/recommendation', NEXT_PUBLIC_API_ORIGIN)
  url.searchParams.set('limit', String(limit))

  const { data } = await fetchAPIData<GETV1MangaRecommendationResponse>(url, { credentials: 'include' })
  return data
}
