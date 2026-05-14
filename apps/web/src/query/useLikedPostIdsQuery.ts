import type { GETV1PostLikedResponse } from '@litomi/contracts/api/post'

import { QueryKeys } from '@litomi/domain/constants/query'
import { env } from '@litomi/env/env/client'
import { useQuery } from '@tanstack/react-query'
import ms from 'ms'

import { fetchWithErrorHandling } from '@/utils/react-query-error'

import useMeQuery from './useMeQuery'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function fetchLikedPostIds() {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/post/liked`
  const { data } = await fetchWithErrorHandling<GETV1PostLikedResponse>(url, { credentials: 'include' })
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
