import { useInfiniteQuery } from '@tanstack/react-query'
import { useRef } from 'react'

import { Bookmark } from '@/app/api/bookmark/route'
import { ProxyIdOnly } from '@/app/api/proxy/manga/schema'
import { createErrorManga } from '@/constants/json'
import { QueryKeys } from '@/constants/query'
import { Manga } from '@/types/manga'

import { MANGA_DETAILS_BATCH_SIZE } from './constants'

const ERROR_MESSAGES = {
  UNKNOWN_SOURCE: '알 수 없는 소스',
  NO_RESPONSE: '응답이 없어요',
  REQUEST_FAILED: '오류가 발생했어요',
} as const

export default function useMangaInfiniteQuery(bookmarks: Bookmark[]) {
  const fetchedItemsRef = useRef(new Set<number>())

  return useInfiniteQuery({
    queryKey: QueryKeys.infiniteManga,
    queryFn: async () => {
      const unfetchedItems = bookmarks.filter((item) => {
        return !fetchedItemsRef.current.has(item.mangaId)
      })

      if (unfetchedItems.length === 0) {
        return []
      }

      const batch = unfetchedItems.slice(0, MANGA_DETAILS_BATCH_SIZE)

      for (const item of batch) {
        fetchedItemsRef.current.add(item.mangaId)
      }

      return fetchMangaBatch(batch)
    },
    initialPageParam: 0,
    getNextPageParam: (_lastPage, allPages) => allPages.length,
  })
}

async function fetchMangaBatch(items: Bookmark[]): Promise<Manga[]> {
  if (items.length === 0) {
    return []
  }

  const uniqueMangaIds = Array.from(new Set(items.map((item) => item.mangaId)))
  const searchParams = new URLSearchParams({ only: ProxyIdOnly.THUMBNAIL })

  for (const id of uniqueMangaIds) {
    searchParams.append('id', id.toString())
  }

  try {
    const response = await fetch(`/api/proxy/manga?${searchParams}`)

    if (!response.ok) {
      throw new Error(`${response.status}: ${response.statusText}`)
    }

    const mangaMap = (await response.json()) as Record<number, Manga>

    return items.map(
      (item) => mangaMap[item.mangaId] || createErrorManga({ error: new Error(ERROR_MESSAGES.NO_RESPONSE) }),
    )
  } catch (error) {
    return [createErrorManga({ error })]
  }
}
