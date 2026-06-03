import type { GETV1LibraryMangaResponse } from '@litomi/contracts'

import { Locale } from '@litomi/domain/locale'
import { env } from '@litomi/env/client'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function fetchPublicLibraryMangas({ cursor, locale }: { cursor: string | null; locale: Locale }) {
  const url = new URL('/api/v1/library/manga', NEXT_PUBLIC_API_ORIGIN)
  url.searchParams.set('locale', locale)

  if (cursor) {
    url.searchParams.set('cursor', cursor)
  }

  const { data } = await fetchAPIData<GETV1LibraryMangaResponse>(url)
  return data
}

export default function usePublicLibraryMangaInfiniteQuery() {
  const locale = useLocale()

  return useInfiniteQuery({
    queryKey: QueryKeys.infinitePublicLibraryMangas(locale),
    queryFn: ({ pageParam }) => fetchPublicLibraryMangas({ cursor: pageParam, locale }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: '',
  })
}
