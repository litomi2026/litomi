'use client'

import type { GETTrendingKeywordsResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'
import { useQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_API_ORIGIN } = env

type Params = {
  locale: string
}

export async function fetchTrendingKeywords({ locale }: Params) {
  const params = new URLSearchParams({ locale })

  const url = new URL('/api/v1/search/trending', NEXT_PUBLIC_API_ORIGIN)
  url.search = params.toString()
  const { data } = await fetchAPIData<GETTrendingKeywordsResponse>(url)
  return data
}

export default function useTrendingKeywordsQuery() {
  const locale = useLocale()

  return useQuery<GETTrendingKeywordsResponse>({
    queryKey: QueryKeys.trendingKeywords(locale),
    queryFn: () => fetchTrendingKeywords({ locale }),
  })
}
