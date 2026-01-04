'use client'

import { useQuery } from '@tanstack/react-query'

import { type GETTrendingKeywordsResponse } from '@/backend/api/v1/search/trending/GET'
import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { getLocaleFromCookie } from '@/utils/locale-from-cookie'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

type Params = {
  locale: string
}

export async function fetchTrendingKeywords({ locale }: Params) {
  const params = new URLSearchParams()

  if (locale) {
    params.set('locale', locale)
  }

  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/search/trending?${params}`
  const { data } = await fetchWithErrorHandling<GETTrendingKeywordsResponse>(url)
  return data
}

export default function useTrendingKeywordsQuery() {
  const locale = getLocaleFromCookie()

  return useQuery<GETTrendingKeywordsResponse>({
    queryKey: QueryKeys.trendingKeywords(locale),
    queryFn: () => fetchTrendingKeywords({ locale }),
  })
}
