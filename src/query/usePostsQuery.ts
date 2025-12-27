import { useInfiniteQuery } from '@tanstack/react-query'

import { GETV1PostResponse } from '@/backend/api/v1/post'
import { PostFilter } from '@/backend/api/v1/post/constant'
import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'

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
      const response = await fetch(url, { credentials: 'include' })

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}: ${await response.text()}`)
      }

      return response.json()
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as number | undefined,
  })
}
