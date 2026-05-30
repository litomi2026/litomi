import type { GETV1PostResponse } from '@litomi/contracts'

import { PostFilter } from '@litomi/domain/post/filter'
import { env } from '@litomi/env/client'
import { useInfiniteQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_API_ORIGIN } = env

export default function usePostInfiniteQuery(filter: PostFilter, mangaId?: number, username?: string) {
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

      const url = new URL('/api/v1/post', NEXT_PUBLIC_API_ORIGIN)
      url.search = searchParams.toString()
      const requestInit = filter === PostFilter.FOLLOWING ? { credentials: 'include' as const } : undefined
      const { data } = await fetchAPIData<GETV1PostResponse>(url, requestInit)
      return data
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: '',
  })
}
