import { useQuery, useQueryClient } from '@tanstack/react-query'
import ms from 'ms'
import { useEffect, useMemo, useState } from 'react'

import { GETProxyMangaResponse } from '@/app/api/proxy/manga/route'
import { MAX_HARPI_MANGA_BATCH_SIZE } from '@/constants/policy'
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
   * Array of manga IDs to fetch
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
  const [batchTrigger, setBatchTrigger] = useState(0)

  const { uncachedIds, cachedMap, hasMoreBatches } = useMemo(() => {
    const uniqueMangaIds = new Set(mangaIds)
    const cachedMap = new Map<number, Manga>()
    const allUncachedIds = []
    const now = Date.now()

    for (const id of uniqueMangaIds) {
      const queryState = queryClient.getQueryState<Manga>(QueryKeys.mangaCard(id))
      const data = queryState?.data

      if (data && now - queryState.dataUpdatedAt <= staleTime) {
        cachedMap.set(id, data)
      } else {
        allUncachedIds.push(id)
      }
    }

    const uncachedIds = allUncachedIds.slice(0, MAX_HARPI_MANGA_BATCH_SIZE)
    const hasMoreBatches = allUncachedIds.length > uncachedIds.length

    return { uncachedIds, cachedMap, hasMoreBatches }
    // batchTrigger is intentionally included to force re-evaluation after each batch is cached
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mangaIds, queryClient, staleTime, batchTrigger])

  const { data, isLoading, isFetching } = useQuery<GETProxyMangaResponse>({
    queryKey: ['manga-batch', uncachedIds],
    queryFn: async () => {
      const searchParams = new URLSearchParams()

      for (const id of uncachedIds) {
        searchParams.append('id', id.toString())
      }

      const response = await fetch(`/api/proxy/manga?${searchParams}`)
      const data = await handleResponseError<GETProxyMangaResponse>(response)

      for (const id of uncachedIds) {
        const manga = data[id]

        if (manga) {
          queryClient.setQueryDefaults(QueryKeys.mangaCard(id), { staleTime, gcTime })
          queryClient.setQueryData(QueryKeys.mangaCard(id), manga)
        }
      }

      return data
    },
    enabled: uncachedIds.length > 0,
    staleTime: 0, // Always refetch batch queries
    gcTime: 0, // Don't keep batch query results
  })

  useEffect(() => {
    if (!isFetching && hasMoreBatches) {
      setBatchTrigger((prev) => prev + 1)
    }
  }, [isFetching, hasMoreBatches])

  const mangaMap = useMemo(() => {
    if (!data) {
      return cachedMap
    }

    const map = new Map(cachedMap)

    for (const id of uncachedIds) {
      const manga = data[id]
      if (manga) {
        map.set(id, manga)
      }
    }

    return map
  }, [cachedMap, data, uncachedIds])

  return {
    mangaMap,
    isLoading,
    isFetching,
  }
}
