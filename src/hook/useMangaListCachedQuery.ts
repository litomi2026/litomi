'use client'

import { useQueries, useQueryClient } from '@tanstack/react-query'
import ms from 'ms'
import pLimit from 'p-limit'
import { useEffect, useEffectEvent, useMemo, useRef } from 'react'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { Manga } from '@/types/manga'
import { isDegradedResponse } from '@/utils/degraded-response'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_EDGE_PROXY_ORIGIN } = env

interface Options {
  /**
   * Custom garbage collection time for individual manga cache
   * @default 2 hours
   */
  gcTime?: number
  /**
   * Array of manga IDs to fetch
   */
  mangaIds: number[]
  /**
   * Custom stale time for individual manga cache
   * @default 1 hour
   */
  staleTime?: number
}

const MAX_CONCURRENT_REQUESTS = 2
const limit = pLimit(MAX_CONCURRENT_REQUESTS)

/**
 * Hook to fetch manga data with individual caching and rate-limited parallel requests.
 * Each manga is cached independently for maximum CDN cache hit rate.
 *
 * @example
 * ```tsx
 * const { mangaMap, isLoading } = useMangaListCachedQuery({ mangaIds: [1, 2, 3, 4, 5] })
 * ```
 */
export default function useMangaListCachedQuery({
  mangaIds,
  staleTime = ms('1 hour'),
  gcTime = ms('2 hours'),
}: Options) {
  const uniqueMangaIds = useMemo(() => Array.from(new Set(mangaIds)), [mangaIds])
  const queryClient = useQueryClient()
  const cleanupTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([])

  const cleanupPendingMangaQueriesEvent = useEffectEvent(() => {
    // NOTE: 페이지 이탈 시, 아직 완료되지 않은(pending) 작품 쿼리는 전부 제거
    for (const id of uniqueMangaIds) {
      const queryKey = QueryKeys.manga(id)
      const state = queryClient.getQueryState(queryKey)
      const cachedData = queryClient.getQueryData<Manga>(queryKey)

      if (cachedData) {
        continue
      }

      if (state?.status === 'pending') {
        queryClient.removeQueries({ queryKey, exact: true })
      }
    }
  })

  const queries = useQueries({
    queries: uniqueMangaIds.map((id) => ({
      queryKey: QueryKeys.manga(id),
      queryFn: () =>
        limit(async () => {
          const url = `${NEXT_PUBLIC_EDGE_PROXY_ORIGIN}/api/proxy/manga/${id}`
          const { data, response } = await fetchWithErrorHandling<Manga>(url)

          if (isDegradedResponse(response.headers)) {
            scheduleErrorCacheCleanup(QueryKeys.manga(id))
          }

          return data
        }),
      staleTime,
      gcTime,
      onError: () => {
        scheduleErrorCacheCleanup(QueryKeys.manga(id))
      },
    })),
  })

  const mangaMap = useMemo(() => {
    const map = new Map<number, Manga>()

    for (let i = 0; i < uniqueMangaIds.length; i++) {
      const id = uniqueMangaIds[i]
      const query = queries[i]

      if (query.data) {
        map.set(id, query.data)
      }
    }

    return map
  }, [uniqueMangaIds, queries])

  const isLoading = queries.some((query) => query.isLoading)
  const isFetching = queries.some((query) => query.isFetching)

  function scheduleErrorCacheCleanup(queryKey: ReturnType<typeof QueryKeys.manga>) {
    const timer = setTimeout(() => {
      queryClient.removeQueries({ queryKey, exact: true })
    }, ms('1 minute'))
    cleanupTimersRef.current.push(timer)
  }

  // NOTE: 타이머 정리
  useEffect(() => {
    return () => {
      for (const timer of cleanupTimersRef.current) {
        clearTimeout(timer)
      }
      cleanupTimersRef.current = []
    }
  }, [])

  // NOTE: 페이지 이탈 시, pending 작품 쿼리를 제거
  useEffect(() => {
    return () => {
      cleanupPendingMangaQueriesEvent()
    }
  }, [])

  return {
    mangaMap,
    isLoading,
    isFetching,
  }
}
