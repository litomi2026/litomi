import { PostFilter } from '@litomi/contracts/post/constant'
import { QueryKeys } from '@litomi/domain/constants/query'
import { env } from '@litomi/env/env/client'
import { useInfiniteQuery } from '@tanstack/react-query'

import type { GETV1PostResponse } from '@/backend/api/v1/post/GET'

import { fetchWithErrorHandling } from '@/utils/react-query-error'

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

      const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/post?${searchParams}`
      const requestInit = filter === PostFilter.FOLLOWING ? { credentials: 'include' as const } : undefined
      const { data } = await fetchWithErrorHandling<GETV1PostResponse>(url, requestInit)
      return data
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: '',
  })
}
