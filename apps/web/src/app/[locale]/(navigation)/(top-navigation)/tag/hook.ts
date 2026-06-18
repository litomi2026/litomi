'use client'

import type { GETV1TagResponse } from '@litomi/contracts'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { buildSearchParams, fetchAPIData } from '@/utils/api-request'

import type { CategoryParam } from './categories'

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
  const searchParams = buildSearchParams({ locale, category, page })
  const url = `/api/v1/tag?${searchParams}`
  const { data } = await fetchAPIData<GETV1TagResponse>(url, { credentials: 'omit' })
  return data
}
