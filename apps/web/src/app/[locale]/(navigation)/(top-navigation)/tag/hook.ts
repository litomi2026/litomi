'use client'

import type { GETV1TagResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_API_ORIGIN } = env

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
    page: String(page),
  })

  if (locale) {
    searchParams.set('locale', locale)
  }

  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/tag?${searchParams}`
  const { data } = await fetchAPIData<GETV1TagResponse>(url)
  return data
}
