import { useIsFetching, useQuery, useQueryClient } from '@tanstack/react-query'
import ms from 'ms'
import { useMemo } from 'react'

import { ProxyIdOnly } from '@/app/api/proxy/manga/schema'
import { QueryKeys } from '@/constants/query'
import { Manga } from '@/types/manga'
import { handleResponseError } from '@/utils/react-query-error'

interface UseMangaBatchWithCacheOptions {
  /**
   * Custom garbage collection time for individual manga cache
   * @default 2 hours
   */
  gcTime?: number
  /**
   * Array of manga IDs to fetch (max length is 20)
   */
  mangaIds: number[]
  /**
   * Custom stale time for individual manga cache
   * @default 1 hour
   */
  staleTime?: number
}

/**
 * Hook to fetch manga in batches while caching individual manga data.
 * This provides efficient batch fetching with cross-page manga data sharing.
 *
 * @example
 * ```tsx
 * const { mangaMap, isLoading } = useMangaBatchWithCache({ mangaIds: [1, 2, 3, 4, 5] })
 * ```
 */
export default function useMangaListCachedQuery({
  mangaIds,
  staleTime = ms('1 hour'),
  gcTime = ms('2 hours'),
}: UseMangaBatchWithCacheOptions) {
  const queryClient = useQueryClient()
  const uniqueMangaIds = useMemo(() => Array.from(new Set(mangaIds)), [mangaIds])
  const isAnyMangaBatchFetching = useIsFetching({ queryKey: ['manga-batch'] })

  const { uncachedIds, cachedMangas } = useMemo(() => {
    const uncached: number[] = []
    const cached: Manga[] = []

    for (const id of uniqueMangaIds) {
      const queryState = queryClient.getQueryState(QueryKeys.mangaCard(id))
      const data = queryState?.data as Manga | undefined

      if (data && queryState && !queryState.isInvalidated) {
        const dataUpdatedAt = queryState.dataUpdatedAt
        const isStale = Date.now() - dataUpdatedAt > staleTime

        if (!isStale) {
          cached.push(data)
        } else {
          uncached.push(id)
        }
      } else {
        uncached.push(id)
      }
    }

    return { uncachedIds: uncached.slice(0, 10).sort(), cachedMangas: cached }
  }, [uniqueMangaIds, queryClient, staleTime])

  const { data, isLoading, isFetching } = useQuery<Record<number, Manga>>({
    queryKey: ['manga-batch', uncachedIds],
    queryFn: async () => {
      const searchParams = new URLSearchParams({ only: ProxyIdOnly.THUMBNAIL })

      for (const id of uncachedIds) {
        searchParams.append('id', id.toString())
      }

      const response = await fetch(`/api/proxy/manga?${searchParams}`)
      const data = await handleResponseError<Record<number, Manga>>(response)
      const validatedData: Record<number, Manga> = {}

      for (const id of uncachedIds) {
        const manga = data[id]

        if (manga) {
          validatedData[id] = manga
          queryClient.setQueryDefaults(QueryKeys.mangaCard(id), { staleTime, gcTime })
          queryClient.setQueryData(QueryKeys.mangaCard(id), manga)
        }
      }

      return validatedData
    },
    enabled: isAnyMangaBatchFetching === 0 && uncachedIds.length > 0,
    staleTime: 0,
    gcTime: 0,
  })

  const mangaMap = useMemo(() => {
    const map = new Map<number, Manga>()

    for (const manga of cachedMangas) {
      map.set(manga.id, manga)
    }

    for (const [id, manga] of Object.entries(data ?? {})) {
      map.set(Number(id), manga)
    }

    return map
  }, [cachedMangas, data])

  return {
    mangaMap,
    isLoading,
    isFetching,
  }
}
