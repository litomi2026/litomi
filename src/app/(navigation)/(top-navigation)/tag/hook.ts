'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type { GETV1TagResponse } from '@/backend/api/v1/tag'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { handleResponseError } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

export type CategoryParam = 'female' | 'male' | 'mixed' | 'other'

type Params = {
  category: CategoryParam
  page: number
  locale: string
}

export function useTagQuery({ category, page, locale }: Params) {
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

  const response = await fetch(`${NEXT_PUBLIC_BACKEND_URL}/api/v1/tag?${searchParams}`)
  return handleResponseError<GETV1TagResponse>(response)
}
