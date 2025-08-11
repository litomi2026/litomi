import { useInfiniteQuery } from '@tanstack/react-query'

import { GETPostsResponse } from '@/app/api/post/route'
import { PostFilter } from '@/app/api/post/schema'
import { QueryKeys } from '@/constants/query'

export default function usePostsInfiniteQuery(filter: PostFilter, mangaId?: number) {
  return useInfiniteQuery<GETPostsResponse>({
    queryKey: QueryKeys.posts(filter, mangaId),
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ filter })

      if (pageParam) {
        params.set('cursor', String(pageParam))
      }
      if (mangaId) {
        params.set('mangaId', String(mangaId))
      }

      const response = await fetch(`/api/post?${params}`)

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}: ${await response.text()}`)
      }

      return response.json()
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as number | undefined,
  })
}
