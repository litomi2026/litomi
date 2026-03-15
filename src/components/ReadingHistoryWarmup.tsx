'use client'

import { useQuery } from '@tanstack/react-query'
import ms from 'ms'
import { useEffect } from 'react'

import type { GETV1ReadingHistoryResponse } from '@/backend/api/v1/library/history'

import { POINT_CONSTANTS } from '@/constants/points'
import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import useMeQuery from '@/query/useMeQuery'
import { canAccessAdultRestrictedAPIs } from '@/utils/adult-verification'
import { fetchWithErrorHandling } from '@/utils/react-query-error'
import { writeReadingHistoryIndex } from '@/utils/reading-history-index'

const { NEXT_PUBLIC_BACKEND_URL } = env

export default function ReadingHistoryWarmup() {
  const { data: me } = useMeQuery()
  const userId = me?.id
  const canWarmup = userId != null && canAccessAdultRestrictedAPIs(me)

  const { data } = useQuery({
    queryKey: QueryKeys.readingHistoryWarmup(userId),
    enabled: canWarmup,
    staleTime: ms('30 minutes'),
    gcTime: ms('1 hour'),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    queryFn: async () => {
      const url = new URL('/api/v1/library/history', NEXT_PUBLIC_BACKEND_URL)
      url.searchParams.set('limit', String(POINT_CONSTANTS.HISTORY_MAX_EXPANSION))
      const { data } = await fetchWithErrorHandling<GETV1ReadingHistoryResponse>(url, { credentials: 'include' })
      return data.items.map((it) => ({ mangaId: it.mangaId, lastPage: it.lastPage }))
    },
    meta: { requiresAdult: true },
  })

  useEffect(() => {
    if (!data || !canWarmup) {
      return
    }

    writeReadingHistoryIndex(userId, data, { notify: true })
  }, [canWarmup, data, userId])

  return null
}
