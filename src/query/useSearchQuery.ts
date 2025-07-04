import { useQuery } from '@tanstack/react-query'

import { NotFoundError } from '@/crawler/common'
import { searchMangasFromKHentai } from '@/crawler/k-hentai'
import { Manga } from '@/types/manga'

type SearchParams = {
  query?: string
  minViews?: number
  maxViews?: number
  minPages?: number
  maxPages?: number
  startDate?: number
  endDate?: number
  sort?: 'id_asc' | 'popular' | 'random'
  nextId?: string
  skip?: number
}

export function getSearchQueryKey(searchParams: SearchParams) {
  return ['search', searchParams]
}

export function useSearchQuery(searchParams: SearchParams) {
  return useQuery<Manga[], Error>({
    queryKey: getSearchQueryKey(searchParams),
    queryFn: () => searchMangasFromKHentai({ url: '/api/proxy/k', searchParams }),
    staleTime: 300_000, // 5 minutes
    gcTime: 600_000, // 10 minutes
    retry: (failureCount, error) => (error instanceof NotFoundError ? false : failureCount < 2),
  })
}
