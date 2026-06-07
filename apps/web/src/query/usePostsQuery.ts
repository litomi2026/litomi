import type { GETV1PostResponse } from '@litomi/contracts'

import { PostFilter } from '@litomi/domain/post/filter'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData, withQuery } from '@/utils/api-request'

export type PostQuery = {
  filter: PostFilter
  mangaId?: number
  username?: string
}

export default function usePostInfiniteQuery({ filter, mangaId, username }: PostQuery) {
  const locale = useLocale()

  return useInfiniteQuery<GETV1PostResponse>({
    queryKey: QueryKeys.posts(filter, mangaId, username, locale),
    queryFn: async ({ pageParam }) => {
      const searchParams = new URLSearchParams({ filter, locale })
      const cursor = typeof pageParam === 'string' ? pageParam : ''

      if (cursor) {
        searchParams.set('cursor', cursor)
      }
      if (mangaId) {
        searchParams.set('mangaId', String(mangaId))
      }
      if (username) {
        searchParams.set('username', username)
      }

      const url = withQuery('/api/v1/post', searchParams)
      const credentials = filter === PostFilter.FOLLOWING ? 'same-origin' : 'omit'
      const { data } = await fetchAPIData<GETV1PostResponse>(url, { credentials })
      return data
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: '',
  })
}
