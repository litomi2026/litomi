'use client'

import type { GETV1MeFollowingResponse } from '@litomi/contracts'

import { useQuery } from '@tanstack/react-query'
import ms from 'ms'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

import useMeQuery from './useMeQuery'

export async function fetchFollowingUserIds() {
  const url = '/api/v1/me/following'
  const { data } = await fetchAPIData<GETV1MeFollowingResponse>(url)
  return data
}

export default function useFollowingUserSetQuery() {
  const { data: me } = useMeQuery()

  return useQuery<GETV1MeFollowingResponse, Error, Set<number>>({
    queryKey: QueryKeys.followingUsers,
    queryFn: fetchFollowingUserIds,
    enabled: Boolean(me),
    staleTime: Infinity,
    gcTime: ms('24 hours'),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    select: (data) => new Set(data.userIds),
  })
}
