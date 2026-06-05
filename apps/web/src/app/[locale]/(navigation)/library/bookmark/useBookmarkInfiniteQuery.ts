import type { GETV1BookmarkResponse } from '@litomi/contracts'

import { BOOKMARKS_PER_PAGE } from '@litomi/domain/library/policy'
import { DEFAULT_LIBRARY_ITEM_SORT, LibraryItemSort } from '@litomi/domain/library/sort'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { apiPath, fetchAPIData } from '@/utils/api-request'

type Options = {
  enabled?: boolean
  sort?: LibraryItemSort
}

export async function fetchPaginatedBookmark(cursor: string | null, sort: LibraryItemSort, locale: string) {
  const params = new URLSearchParams({ limit: BOOKMARKS_PER_PAGE.toString(), locale })

  if (cursor) {
    params.set('cursor', cursor)
  }

  if (sort) {
    params.set('sort', sort)
  }

  const url = apiPath('/api/v1/bookmark', params)

  const { data } = await fetchAPIData<GETV1BookmarkResponse>(url)
  return data
}

export default function useBookmarkInfiniteQuery({ enabled = true, sort = DEFAULT_LIBRARY_ITEM_SORT }: Options = {}) {
  const locale = useLocale()

  return useInfiniteQuery({
    queryKey: QueryKeys.infiniteBookmarks(sort, locale),
    queryFn: ({ pageParam }) => fetchPaginatedBookmark(pageParam, sort, locale),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: '',
    enabled,
  })
}
