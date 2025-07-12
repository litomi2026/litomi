import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo, useRef } from 'react'

import { BookmarkWithSource } from '@/app/api/bookmarks/route'
import { QueryKeys } from '@/constants/query'
import { BookmarkSource } from '@/database/schema'
import { Manga } from '@/types/manga'

import { MANGA_DETAILS_BATCH_SIZE } from './constants'

export type MangaDetails = {
  manga?: Manga
  source: BookmarkSource
  mangaId: number
  loading?: boolean
  error?: string
}

const API_ENDPOINTS: Partial<Record<BookmarkSource, (id: number) => string>> = {
  [BookmarkSource.HIYOBI]: (id: number) => `/api/proxy/hiyobi/${id}`,
  [BookmarkSource.K_HENTAI]: (id: number) => `/api/proxy/k/${id}`,
}

const ERROR_MESSAGES = {
  UNKNOWN_SOURCE: '알 수 없는 소스',
  NO_RESPONSE: '응답이 없어요',
  REQUEST_FAILED: '오류가 발생했어요',
  HARPI_SEARCH_FAILED: 'Harpi search failed',
} as const

export default function useMangaInfiniteQuery(bookmarks: BookmarkWithSource[]) {
  const fetchedItemsRef = useRef(new Set<string>())

  const infiniteQuery = useInfiniteQuery({
    queryKey: QueryKeys.infiniteManga,
    queryFn: async () => {
      const unfetchedItems = bookmarks.filter((item) => {
        const key = generateBookmarkKey(item.source, item.mangaId)
        return !fetchedItemsRef.current.has(key)
      })

      if (unfetchedItems.length === 0) {
        return []
      }

      const batch = unfetchedItems.slice(0, MANGA_DETAILS_BATCH_SIZE)

      batch.forEach((item) => {
        fetchedItemsRef.current.add(generateBookmarkKey(item.source, item.mangaId))
      })

      return fetchMangaBatch(batch)
    },
    initialPageParam: 0,
    getNextPageParam: (_lastPage, allPages) => allPages.length,
  })

  const { data } = infiniteQuery

  const mangaDetailsMap = useMemo(() => {
    const map = new Map<string, MangaDetails>()

    if (!data?.pages) return map

    data.pages.forEach((page) => {
      page.forEach((item) => {
        map.set(generateBookmarkKey(item.source, item.mangaId), item)
      })
    })

    return map
  }, [data])

  return {
    ...infiniteQuery,
    data: mangaDetailsMap,
  }
}

function createMangaWithError(id: number, message: string): Manga {
  return {
    id,
    title: message,
    images: [],
  }
}

async function fetchMangaBatch(items: BookmarkWithSource[]): Promise<MangaDetails[]> {
  if (items.length === 0) {
    return []
  }

  const mangaIds = items.map((item) => item.mangaId)

  try {
    const { mangas } = await fetchMangasFromHarpi(mangaIds)

    return Promise.all(items.map((item) => processMangaItem(item, mangas)))
  } catch {
    return Promise.all(
      items.map(async (item) => ({
        ...item,
        manga: await fetchMangaFromOriginalSource(item.mangaId, item.source),
      })),
    )
  }
}

async function fetchMangaFromOriginalSource(mangaId: number, source: BookmarkSource): Promise<Manga> {
  try {
    const endpoint = API_ENDPOINTS[source]

    if (!endpoint) {
      return createMangaWithError(mangaId, ERROR_MESSAGES.UNKNOWN_SOURCE)
    }

    const response = await fetch(endpoint(mangaId))

    if (!response.ok) {
      return createMangaWithError(mangaId, `${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.REQUEST_FAILED
    return createMangaWithError(mangaId, errorMessage)
  }
}

async function fetchMangasFromHarpi(mangaIds: number[]): Promise<{ mangas: Manga[] }> {
  const searchParams = new URLSearchParams()
  mangaIds.forEach((id) => searchParams.append('ids', id.toString()))
  searchParams.append('pageLimit', mangaIds.length.toString())

  const response = await fetch(`/api/proxy/harpi/search?${searchParams}`)

  if (!response.ok) {
    throw new Error(ERROR_MESSAGES.HARPI_SEARCH_FAILED)
  }

  return response.json()
}

function generateBookmarkKey(source: BookmarkSource, mangaId: number): string {
  return `${source}:${mangaId}`
}

async function processMangaItem(item: BookmarkWithSource, harpiMangas: Manga[]): Promise<MangaDetails> {
  const manga =
    harpiMangas.find((m) => m.id === item.mangaId) || (await fetchMangaFromOriginalSource(item.mangaId, item.source))

  return { ...item, manga }
}
