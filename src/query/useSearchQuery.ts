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

export function useSearchQuery(searchParams: SearchParams) {
  return useQuery<Manga[], Error>({
    queryKey: ['search', searchParams],
    queryFn: () => searchMangasFromKHentai(searchParams),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => (error instanceof NotFoundError ? false : failureCount < 2),
  })
}
