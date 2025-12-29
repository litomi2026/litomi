import { useInfiniteQuery } from '@tanstack/react-query'

import { GETV1PostResponse } from '@/backend/api/v1/post'
import { PostFilter } from '@/backend/api/v1/post/constant'
import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

export default function usePostsInfiniteQuery(filter: PostFilter, mangaId?: number, username?: string) {
  return useInfiniteQuery<GETV1PostResponse>({
    queryKey: QueryKeys.posts(filter, mangaId, username),
    queryFn: async ({ pageParam }) => {
      const searchParams = new URLSearchParams({ filter })

      if (pageParam) {
        searchParams.set('cursor', String(pageParam))
      }
      if (mangaId) {
        searchParams.set('mangaId', String(mangaId))
      }
      if (username) {
        searchParams.set('username', username)
      }

      const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/post?${searchParams}`
      const { data } = await fetchWithErrorHandling<GETV1PostResponse>(url, { credentials: 'include' })
      return data
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as number | undefined,
  })
}
