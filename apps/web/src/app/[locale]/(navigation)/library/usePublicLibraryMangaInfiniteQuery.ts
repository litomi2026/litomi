import type { GETV1LibraryMangaResponse } from '@litomi/contracts'

import { Locale } from '@litomi/domain/locale'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { buildSearchParams, fetchAPIData } from '@/utils/api-request'

export async function fetchPublicLibraryMangas({ cursor, locale }: { cursor: string | null; locale: Locale }) {
  const searchParams = buildSearchParams({ locale, cursor })
  const url = `/api/v1/library/manga?${searchParams}`
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
