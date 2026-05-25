'use client'

import type { GETTrendingKeywordsResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'
import { useQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'
import { getLocaleFromCookie } from '@/utils/locale-from-cookie'

const { NEXT_PUBLIC_API_ORIGIN } = env

type Params = {
  locale: string
}

export async function fetchTrendingKeywords({ locale }: Params) {
  const params = new URLSearchParams()

  if (locale) {
    params.set('locale', locale)
  }

  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/search/trending?${params}`
  const { data } = await fetchAPIData<GETTrendingKeywordsResponse>(url)
  return data
}

export default function useTrendingKeywordsQuery() {
  const locale = getLocaleFromCookie()

  return useQuery<GETTrendingKeywordsResponse>({
    queryKey: QueryKeys.trendingKeywords(locale),
    queryFn: () => fetchTrendingKeywords({ locale }),
  })
}
