import { captureException } from '@sentry/nextjs'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'

import { NotFoundError } from '@/crawler/common'
import { convertKHentaiMangaToManga, KHentaiManga } from '@/crawler/k-hentai'
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
  const myDomain = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : 'http://localhost:3000'

  const response = await fetch(`${myDomain}/api/proxy/k?${searchParams}`)
  if (response.status === 404) return

  if (!response.ok) {
    const body = await response.text()
    captureException('/api/proxy/k API 오류: 클라이언트 -> Next.js 서버', { extra: { response, body } })
    throw new Error('만화 검색을 실패했어요. 잠시 후 다시 시도해주세요.')
  }

  if (Math.random() < 0.5) {
    throw new Error('만화 검색을 실패했어요. 잠시 후 다시 시도해주세요.')
  }

  const data = (await response.json()) as KHentaiManga[]
  const mangas = data.filter((manga) => manga.archived === 1)
  return mangas.map((manga) => convertKHentaiMangaToManga(manga))
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
