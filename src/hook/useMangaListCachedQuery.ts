'use client'

import { useQueries, useQueryClient } from '@tanstack/react-query'
import ms from 'ms'
import pLimit from 'p-limit'
import { useEffect, useMemo, useRef } from 'react'

import { QueryKeys } from '@/constants/query'
import { Manga } from '@/types/manga'
import { handleResponseError } from '@/utils/react-query-error'

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

  // NOTE: 타이머 정리
  useEffect(() => {
    return () => {
      for (const timer of cleanupTimersRef.current) {
        clearTimeout(timer)
      }
      cleanupTimersRef.current = []
    }
  }, [])

  function scheduleErrorCacheCleanup(queryKey: ReturnType<typeof QueryKeys.mangaCard>) {
    const timer = setTimeout(() => {
      queryClient.removeQueries({ queryKey, exact: true })
    }, ms('1 minute'))
    cleanupTimersRef.current.push(timer)
  }

  const queries = useQueries({
    queries: uniqueMangaIds.map((id) => ({
      queryKey: QueryKeys.mangaCard(id),
      queryFn: () =>
        limit(async () => {
          const response = await fetch(`/api/proxy/manga/${id}`)
          return handleResponseError<Manga>(response)
        }),
      staleTime,
      gcTime,
      onSuccess: (data: Manga) => {
        if (isErrorManga(data)) {
          scheduleErrorCacheCleanup(QueryKeys.mangaCard(id))
        }
      },
      onError: () => {
        scheduleErrorCacheCleanup(QueryKeys.mangaCard(id))
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

  return {
    mangaMap,
    isLoading,
    isFetching,
  }
}

function isErrorManga(manga: Manga): manga is Manga & { isError: true } {
  return 'isError' in manga && Boolean((manga as { isError?: boolean }).isError)
}
