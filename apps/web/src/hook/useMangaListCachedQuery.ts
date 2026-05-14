'use client'

import { QueryKey, useQueries, useQueryClient } from '@tanstack/react-query'
import ms from 'ms'
import pLimit from 'p-limit'
import pThrottle from 'p-throttle'
import { useMemo } from 'react'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { Manga } from '@/types/manga'
import { isDegradedResponse } from '@/utils/degraded-response'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_EDGE_PROXY_ORIGIN } = env

const DEFAULT_STALE_TIME = ms('1 hour')
const DEFAULT_GC_TIME = ms('2 hours')
const ERROR_CACHE_CLEANUP_DELAY = ms('30 seconds')
const MAX_CONCURRENT_MANGA_METADATA_REQUESTS = 2
const MAX_MANGA_METADATA_REQUESTS_PER_SECOND = 3

const concurrencyLimit = pLimit(MAX_CONCURRENT_MANGA_METADATA_REQUESTS)

const throttle = pThrottle({
  limit: MAX_MANGA_METADATA_REQUESTS_PER_SECOND,
  interval: ms('1 second'),
  strict: true,
})

const mangaMetadataRequestExecutor = throttle(concurrencyLimit)

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

class InactiveQueuedMangaRequestError extends Error {
  constructor() {
    super('Skipped inactive queued manga request')
  }
}

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
  staleTime = DEFAULT_STALE_TIME,
  gcTime = DEFAULT_GC_TIME,
}: Options) {
  const uniqueMangaIds = useMemo(() => Array.from(new Set(mangaIds)), [mangaIds])
  const queryClient = useQueryClient()

  function scheduleErrorCacheCleanup(queryKey: QueryKey) {
    setTimeout(() => {
      queryClient.removeQueries({ queryKey, exact: true, type: 'inactive' })
    }, ERROR_CACHE_CLEANUP_DELAY)
  }

  async function fetchManga(id: number) {
    const queryKey = QueryKeys.manga(id)

    async function runQuery() {
      const query = queryClient.getQueryCache().find({ queryKey, exact: true })

      if (query && !query.isActive()) {
        query.cancel({ revert: true })
        throw new InactiveQueuedMangaRequestError()
      }

      const url = `${NEXT_PUBLIC_EDGE_PROXY_ORIGIN}/api/proxy/manga/${id}`
      const { data, response } = await fetchWithErrorHandling<Manga>(url)

      if (isDegradedResponse(response.headers)) {
        scheduleErrorCacheCleanup(queryKey)
      }

      return data
    }

    try {
      return await mangaMetadataRequestExecutor(runQuery)
    } catch (error) {
      if (error instanceof InactiveQueuedMangaRequestError) {
        throw error
      }

      scheduleErrorCacheCleanup(queryKey)
      throw error
    }
  }

  const queries = useQueries({
    queries: uniqueMangaIds.map((id) => ({
      queryKey: QueryKeys.manga(id),
      queryFn: () => fetchManga(id),
      staleTime,
      gcTime,
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

  return {
    mangaMap,
    isLoading,
    isFetching,
  }
}
