'use client'

import type { GETV1TagResponse } from '@litomi/contracts'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData, withQuery } from '@/utils/api-request'

export type CategoryParam = 'female' | 'male' | 'mixed' | 'other'

type Params = {
  category: CategoryParam
  page: number
}

export function useTagQuery({ category, page }: Params) {
  const locale = useLocale()

  return useQuery({
    queryKey: QueryKeys.tag(category, page, locale),
    queryFn: () => fetchTags(category, page, locale),
    placeholderData: keepPreviousData,
  })
}

async function fetchTags(category: CategoryParam, page: number, locale: string) {
  const searchParams = new URLSearchParams({
    category,
    locale,
    page: String(page),
  })

  const url = withQuery('/api/v1/tag', searchParams)
  const { data } = await fetchAPIData<GETV1TagResponse>(url, { credentials: 'omit' })
  return data
}
