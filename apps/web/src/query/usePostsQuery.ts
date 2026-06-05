import type { GETV1PostResponse } from '@litomi/contracts'

import { PostFilter } from '@litomi/domain/post/filter'
import { env } from '@litomi/env/client'
import { useInfiniteQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_APP_ORIGIN } = env

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

      const url = new URL('/api/v1/post', NEXT_PUBLIC_APP_ORIGIN)
      url.search = searchParams.toString()
      const { data } = await fetchAPIData<GETV1PostResponse>(url)
      return data
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: '',
  })
}
