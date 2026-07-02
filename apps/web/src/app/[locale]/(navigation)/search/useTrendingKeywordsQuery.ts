'use client'

import type { GETV1SearchTrendingResponse } from '@litomi/contracts'

import { useQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { buildSearchParams, fetchAPIData } from '@/utils/api-request'

type Params = {
  locale: string
}

export async function fetchTrendingKeywords({ locale }: Params) {
  const params = buildSearchParams({ locale })
  const url = `/api/v1/search/trending?${params}`
  const { data } = await fetchAPIData<GETV1SearchTrendingResponse>(url, { credentials: 'omit' })
  return data
}

export default function useTrendingKeywordsQuery() {
  const locale = useLocale()

  return useQuery<GETV1SearchTrendingResponse>({
    queryKey: QueryKeys.trendingKeywords(locale),
    queryFn: () => fetchTrendingKeywords({ locale }),
  })
}
