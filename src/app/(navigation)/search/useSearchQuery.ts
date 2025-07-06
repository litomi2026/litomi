import { captureException } from '@sentry/nextjs'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'

import { NotFoundError } from '@/crawler/common'
import { Manga } from '@/types/manga'
import { whitelistSearchParams } from '@/utils/param'

import { SEARCH_PARAMS_WHITELIST } from './constants'

type SearchParams = {
  query?: string
  'min-view'?: number
  'max-view'?: number
  'min-page'?: number
  'max-page'?: number
  from?: number
  to?: number
  sort?: 'id_asc' | 'popular' | 'random'
  'next-id'?: string
  skip?: number
}

export function getSearchQueryKey(searchParams: SearchParams) {
  return ['search', searchParams]
}

export async function searchMangas(searchParams: URLSearchParams) {
  const path = '/api/proxy/k'
  const response = await fetch(`${path}?${searchParams}`)
  if (response.status === 404) return

  if (!response.ok) {
    const body = await response.text()
    captureException(`${path} API returned ${response.status} ${response.statusText}`, {
      tags: {
        api: path,
        status: response.status,
      },
      extra: { body, response },
    })
    throw new Error('만화 검색을 실패했어요. 잠시 후 다시 시도해주세요.')
  }

  return (await response.json()) as Manga[]
}

export function useSearchQuery() {
  const searchParams = useSearchParams()
  const whitelisted = whitelistSearchParams(searchParams, SEARCH_PARAMS_WHITELIST)

  return useSuspenseQuery<Manga[] | undefined, Error>({
    queryKey: getSearchQueryKey(Object.fromEntries(whitelisted)),
    queryFn: () => searchMangas(whitelisted),
    staleTime: 300_000, // 5 minutes
    gcTime: 600_000, // 10 minutes
    retry: (failureCount, error) => (error instanceof NotFoundError ? false : failureCount < 2),
  })
}
