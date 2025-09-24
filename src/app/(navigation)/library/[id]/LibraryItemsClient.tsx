'use client'

import { useMemo } from 'react'

import { GETLibraryItemsResponse } from '@/app/api/library/[id]/route'
import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import useInfiniteScrollObserver from '@/hook/useInfiniteScrollObserver'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'
import useLibraryItemsInfiniteQuery from '@/query/useLibraryItemsInfiniteQuery'
import { ViewCookie } from '@/utils/param'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

import SelectableMangaCard from '../SelectableMangaCard'
import { useLibrarySelectionStore } from './librarySelection'

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

  const { mangaMap } = useMangaListCachedQuery({ mangaIds: items.map((item) => item.mangaId) })

  if (items.length === 0 && !isLoadingMoreItems) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center">
        <p className="text-zinc-500">{`${libraryName} 서재가 비어 있어요`}</p>
      </div>
    )
  }

  return (
    <ul className={`grid ${MANGA_LIST_GRID_COLUMNS[ViewCookie.CARD]} gap-2 p-2`}>
      {items.map(({ mangaId }, index) => {
        const manga = mangaMap.get(mangaId) ?? { id: mangaId, title: '불러오는 중', images: [] }

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
