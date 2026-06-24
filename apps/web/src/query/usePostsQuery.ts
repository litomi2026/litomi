import type { GETV1PostResponse } from '@litomi/contracts'

import type { PostFilter } from '@litomi/domain/post/filter'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { buildSearchParams, fetchAPIData } from '@/utils/api-request'

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
      const searchParams = buildSearchParams({
        filter,
        locale,
        cursor: pageParam as string,
        mangaId,
        username,
      })

      const url = `/api/v1/post?${searchParams}`
      const { data } = await fetchAPIData<GETV1PostResponse>(url)
      return data
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: '',
  })
}
