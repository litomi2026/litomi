import type { GETV1PostLikedResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'
import { useQuery } from '@tanstack/react-query'
import ms from 'ms'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

import useMeQuery from './useMeQuery'

const { NEXT_PUBLIC_APP_ORIGIN } = env

export async function fetchLikedPostIds() {
  const url = new URL('/api/v1/post/liked', NEXT_PUBLIC_APP_ORIGIN)
  const { data } = await fetchAPIData<GETV1PostLikedResponse>(url)
  return data
}

export default function useLikedPostIdsQuery() {
  const { data: me } = useMeQuery()

  return useQuery<GETV1PostLikedResponse, Error, Set<number>>({
    queryKey: QueryKeys.likedPosts,
    queryFn: fetchLikedPostIds,
    enabled: Boolean(me),
    staleTime: Infinity,
    gcTime: ms('24 hours'),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    select: (data) => new Set(data.postIds),
  })
}
