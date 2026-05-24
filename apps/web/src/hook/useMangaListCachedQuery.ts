'use client'

import { Manga } from '@litomi/domain/manga/model'
import { env } from '@litomi/env/client'
import { isDegradedResponse } from '@litomi/http/degraded-response'
import { QueryKey, useQueries, useQueryClient } from '@tanstack/react-query'
import ms from 'ms'
import pLimit from 'p-limit'
import pThrottle from 'p-throttle'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { createLoadingManga } from '@/utils/manga-placeholder'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_EDGE_PROXY_ORIGIN } = env

const DEFAULT_STALE_TIME = ms('1 hour')
const DEFAULT_GC_TIME = ms('2 hours')
const ERROR_CACHE_CLEANUP_DELAY = ms('30 seconds')
const MAX_CONCURRENT_MANGA_METADATA_REQUESTS = 3
const MAX_MANGA_METADATA_REQUESTS_PER_INTERVAL = 15

const concurrencyLimit = pLimit(MAX_CONCURRENT_MANGA_METADATA_REQUESTS)

const throttle = pThrottle({
  limit: MAX_MANGA_METADATA_REQUESTS_PER_INTERVAL,
  interval: ms('10 seconds'),
  strict: true,
})

const mangaMetadataRequestExecutor = throttle(concurrencyLimit)

interface Options {
  /**
   * Catalog DB metadata to render without populating the edge-proxy manga cache.
   */
  catalogMangas?: readonly (Manga | undefined)[]
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
  catalogMangas = [],
  mangaIds,
  staleTime = DEFAULT_STALE_TIME,
  gcTime = DEFAULT_GC_TIME,
}: Options) {
  const uniqueMangaIds = Array.from(new Set(mangaIds))
  const catalogMangaMap = new Map<number, Manga>()
  const queryClient = useQueryClient()

  for (const manga of catalogMangas) {
    if (!manga) {
      continue
    }

    catalogMangaMap.set(manga.id, withThumbnailFallback(manga))
  }

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
        const previousManga = queryClient.getQueryData<Manga>(queryKey)

        if (previousManga && data.images && data.images.length > 0) {
          return { ...previousManga, images: data.images }
        }
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
      enabled: !catalogMangaMap.has(id),
    })),
  })

  const mangaMap = new Map<number, Manga>()

  for (let i = 0; i < uniqueMangaIds.length; i++) {
    const id = uniqueMangaIds[i]
    const query = queries[i]

    const manga = query.data ?? catalogMangaMap.get(id)

    if (manga) {
      mangaMap.set(id, manga)
    }
  }

  const isLoading = queries.some((query) => query.isLoading)
  const isFetching = queries.some((query) => query.isFetching)

  return {
    mangaMap,
    isLoading,
    isFetching,
  }
}

function withThumbnailFallback(manga: Manga): Manga {
  if (manga.images && manga.images.length > 0) {
    return manga
  }

  const loadingManga = createLoadingManga(manga.id)

  return {
    ...loadingManga,
    ...manga,
    images: loadingManga.images,
  }
}
