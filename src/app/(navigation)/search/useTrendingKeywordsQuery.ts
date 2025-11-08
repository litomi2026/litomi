'use client'

import { useQuery } from '@tanstack/react-query'

import { type GETTrendingKeywordsResponse } from '@/backend/api/v1/search/trending'
import { NEXT_PUBLIC_BACKEND_URL } from '@/constants/env'
import { QueryKeys } from '@/constants/query'
import { handleResponseError } from '@/utils/react-query-error'

export async function fetchTrendingKeywords() {
  const response = await fetch(`${NEXT_PUBLIC_BACKEND_URL}/api/v1/search/trending`)
  return handleResponseError<GETTrendingKeywordsResponse>(response)
}

export default function useTrendingKeywordsQuery() {
  return useQuery<GETTrendingKeywordsResponse>({
    queryKey: QueryKeys.trendingKeywords,
    queryFn: fetchTrendingKeywords,
  })
}
