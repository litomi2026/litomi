'use client'

import { useQuery } from '@tanstack/react-query'

import { type GETTrendingKeywordsResponse } from '@/app/api/search/trending/route'
import { QueryKeys } from '@/constants/query'
import { handleResponseError } from '@/utils/react-query-error'

export async function fetchTrendingKeywords() {
  const response = await fetch('/api/search/trending')
  return handleResponseError<GETTrendingKeywordsResponse>(response)
}

export default function useTrendingKeywordsQuery() {
  return useQuery<GETTrendingKeywordsResponse>({
    queryKey: QueryKeys.trendingKeywords,
    queryFn: fetchTrendingKeywords,
  })
}
