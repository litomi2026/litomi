import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo, useRef } from 'react'

import { BookmarkWithSource } from '@/app/api/bookmarks/route'
import { QueryKeys } from '@/constants/query'
import { BookmarkSource } from '@/database/schema'
import { Manga } from '@/types/manga'

import { MANGA_FETCH_BATCH_SIZE } from './constants'

export type MangaWithMeta = {
  manga?: Manga
  source: BookmarkSource
  mangaId: number
  loading?: boolean
  error?: string
}

export default function useMangaInfiniteQuery(bookmarks: BookmarkWithSource[]) {
  const fetchedItemsRef = useRef(new Set<string>())

  const infiniteQuery = useInfiniteQuery({
    queryKey: QueryKeys.infiniteManga,
    queryFn: async () => {
      const unfetchedItems = bookmarks.filter((item) => {
        const key = `${item.source}:${item.mangaId}`
        return !fetchedItemsRef.current.has(key)
      })

      // If no new items to fetch, return empty
      if (unfetchedItems.length === 0) {
        return []
      }

      // Take the next batch of unfetched items
      const batch = unfetchedItems.slice(0, MANGA_FETCH_BATCH_SIZE)

      // Mark these items as being fetched
      batch.forEach((item) => {
        fetchedItemsRef.current.add(`${item.source}:${item.mangaId}`)
      })

      return fetchMangaBatch(batch)
    },
    initialPageParam: 0,
    getNextPageParam: (_lastPage, allPages) => allPages.length,
  })

  const { data } = infiniteQuery

  const mangaData = useMemo(() => {
    const map = new Map<string, MangaWithMeta>()

    // Provide default empty pages array if data is undefined
    const pages = data?.pages ?? []

    pages.forEach((page) => {
      page.forEach((item) => {
        map.set(`${item.source}:${item.mangaId}`, item)
      })
    })

    return map
  }, [data])

  return {
    ...infiniteQuery,
    data: mangaData,
  }
}

async function fetchFromOriginalSource(mangaId: number, source: BookmarkSource): Promise<Manga | undefined> {
  try {
    let response: Response

    switch (source) {
      case BookmarkSource.HIYOBI:
        response = await fetch(`/api/proxy/hiyobi/${mangaId}`)
        break
      case BookmarkSource.K_HENTAI:
        response = await fetch(`/api/proxy/k/${mangaId}`)
        break
      default:
        return { id: mangaId, title: '알 수 없는 소스', images: [] }
    }

    if (!response) {
      return { id: mangaId, title: '응답이 없어요', images: [] }
    }

    if (!response.ok) {
      return { id: mangaId, title: `${response.status}: ${response.statusText}`, images: [] }
    }

    return response.json()
  } catch (error) {
    return { id: mangaId, title: error instanceof Error ? error.message : '오류가 발생했어요', images: [] }
  }
}

async function fetchMangaBatch(items: BookmarkWithSource[]): Promise<MangaWithMeta[]> {
  const mangaIds = items.map((item) => item.mangaId)

  if (mangaIds.length === 0) {
    return []
  }

  try {
    const searchParams = new URLSearchParams()

    for (const id of mangaIds) {
      searchParams.append('ids', id.toString())
    }

    searchParams.append('pageLimit', mangaIds.length.toString())

    const response = await fetch(`/api/proxy/harpi/search?${searchParams}`)

    if (!response.ok) {
      throw new Error('Harpi search failed')
    }

    const { mangas } = await response.json()
    const results: MangaWithMeta[] = []

    // Process all items, using harpi results or fallback
    for (const item of items) {
      const manga = mangas.find((m: Manga) => m.id === item.mangaId)

      if (manga) {
        results.push({
          mangaId: item.mangaId,
          source: item.source,
          manga,
        })
      } else {
        // Fallback to original source
        const fallbackManga = await fetchFromOriginalSource(item.mangaId, item.source)
        results.push({
          mangaId: item.mangaId,
          source: item.source,
          manga: fallbackManga,
        })
      }
    }

    return results
  } catch {
    // On harpi failure, try original sources for all items
    const results: MangaWithMeta[] = []

    for (const item of items) {
      const fallbackManga = await fetchFromOriginalSource(item.mangaId, item.source)
      results.push({
        mangaId: item.mangaId,
        source: item.source,
        manga: fallbackManga,
      })
    }

    return results
  }
}
