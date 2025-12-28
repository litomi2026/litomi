'use client'

import { useQuery } from '@tanstack/react-query'

import { type GETTrendingKeywordsResponse } from '@/backend/api/v1/search/trending/GET'
import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import useLocaleFromCookie from '@/hook/useLocaleFromCookie'
import { handleResponseError } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

type Params = {
  locale: string
}

export async function fetchTrendingKeywords({ locale }: Params) {
  const params = new URLSearchParams()

  if (locale) {
    params.set('locale', locale)
  }

  const response = await fetch(`${NEXT_PUBLIC_BACKEND_URL}/api/v1/search/trending?${params}`)
  return handleResponseError<GETTrendingKeywordsResponse>(response)
}

export default function useTrendingKeywordsQuery() {
  const locale = useLocaleFromCookie()

  return useQuery<GETTrendingKeywordsResponse>({
    queryKey: QueryKeys.trendingKeywords(locale),
    queryFn: () => fetchTrendingKeywords({ locale }),
  })
}
