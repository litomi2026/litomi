'use client'

import { QueryKeys } from '@litomi/domain/constants/query'
import { env } from '@litomi/env/env/client'
import { useQuery } from '@tanstack/react-query'
import ms from 'ms'

import type { GETV1MeFollowingResponse } from '@/backend/api/v1/me/following/GET'

import { fetchWithErrorHandling } from '@/utils/react-query-error'

import useMeQuery from './useMeQuery'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function fetchFollowingUserIds() {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/following`
  const { data } = await fetchWithErrorHandling<GETV1MeFollowingResponse>(url, { credentials: 'include' })
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
