'use client'

import { useEffect, useMemo } from 'react'

import { GETLibraryItemsResponse } from '@/app/api/library/[id]/route'
import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import useInfiniteScrollObserver from '@/hook/useInfiniteScrollObserver'
import useLibraryItemsInfiniteQuery from '@/query/useLibraryItemsInfiniteQuery'
import { Manga } from '@/types/manga'
import { ViewCookie } from '@/utils/param'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

import useMangaInfiniteQuery from '../../(right-search)/[name]/bookmark/useMangaInfiniteQuery'
import { useLibrarySelectionStore } from './librarySelection'
import SelectableMangaCard from './SelectableMangaCard'

type Props = {
  library: {
    id: number
    name: string
  }
  initialItems: GETLibraryItemsResponse
  isOwner: boolean
}

export default function LibraryItemsClient({ library, initialItems }: Readonly<Props>) {
  const { id: libraryId, name: libraryName } = library
  const { isSelectionMode } = useLibrarySelectionStore()

  const {
    data: itemsData,
    fetchNextPage: fetchMoreItems,
    hasNextPage: hasMoreItemsToLoad,
    isFetchingNextPage: isLoadingMoreItems,
  } = useLibraryItemsInfiniteQuery({
    libraryId,
    initialItems,
  })

  const items = useMemo(() => itemsData?.pages.flatMap((page) => page.items) ?? [], [itemsData])

  const infiniteScrollTriggerRef = useInfiniteScrollObserver({
    hasNextPage: hasMoreItemsToLoad,
    isFetchingNextPage: isLoadingMoreItems,
    fetchNextPage: fetchMoreItems,
  })

  const {
    data: mangaDetails,
    fetchNextPage: fetchMoreMangaDetails,
    isFetchingNextPage: isLoadingMoreManga,
  } = useMangaInfiniteQuery(items)

  const mangaDetailsMap = useMemo(() => {
    const map = new Map<number, Manga>()

    if (!mangaDetails?.pages) {
      return map
    }

    for (const page of mangaDetails.pages) {
      for (const item of page) {
        map.set(item.id, item)
      }
    }

    return map
  }, [mangaDetails])

  const firstUnfetchedMangaIndex = useMemo(() => {
    return items.findIndex((item) => !mangaDetailsMap.has(item.mangaId))
  }, [items, mangaDetailsMap])

  useEffect(() => {
    if (firstUnfetchedMangaIndex !== -1 && !isLoadingMoreManga) {
      fetchMoreMangaDetails()
    }
  }, [firstUnfetchedMangaIndex, isLoadingMoreManga, fetchMoreMangaDetails])

  if (items.length === 0 && !isLoadingMoreItems) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center">
        <p className="text-zinc-500">{`${libraryName} 서재가 비어 있어요`}</p>
      </div>
    )
  }

  return (
    <ul className={`grid ${MANGA_LIST_GRID_COLUMNS[ViewCookie.CARD]} gap-2 grow p-4`}>
      {items.map(({ mangaId }, index) => {
        const manga = mangaDetailsMap.get(mangaId)

        if (!manga) {
          return <MangaCardSkeleton key={mangaId} />
        }

        if (!isSelectionMode) {
          return <MangaCard index={index} key={mangaId} manga={manga} />
        }

        return <SelectableMangaCard index={index} key={mangaId} manga={manga} />
      })}
      {isLoadingMoreItems && <MangaCardSkeleton />}
      <div className="w-full p-4" ref={infiniteScrollTriggerRef} />
    </ul>
  )
}
