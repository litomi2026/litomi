import type { GETV1PostResponse } from '@litomi/contracts'

import { PostFilter } from '@litomi/domain/post/filter'
import { useInfiniteQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData, withQuery } from '@/utils/api-request'

export type PostQuery = {
  filter: PostFilter
  mangaId?: number
  username?: string
}

export default function usePostInfiniteQuery({ filter, mangaId, username }: PostQuery) {
  return useInfiniteQuery<GETV1PostResponse>({
    queryKey: QueryKeys.posts(filter, mangaId, username),
    queryFn: async ({ pageParam }) => {
      const searchParams = new URLSearchParams({ filter })
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
      const { data } = await fetchAPIData<GETV1PostResponse>(url)
      return data
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: '',
  })
}
