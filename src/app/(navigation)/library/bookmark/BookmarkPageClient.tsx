'use client'

import { GETV1BookmarkResponse } from '@/backend/api/v1/bookmark'
import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import useInfiniteScrollObserver from '@/hook/useInfiniteScrollObserver'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'
import { ViewCookie } from '@/utils/param'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

import { useLibrarySelectionStore } from '../[id]/librarySelection'
import SelectableMangaCard from '../SelectableMangaCard'
import useBookmarkIdsInfiniteQuery from './useBookmarkIdsInfiniteQuery'

type Props = {
  initialData?: GETV1BookmarkResponse
}

export default function BookmarkPageClient({ initialData }: Props) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useBookmarkIdsInfiniteQuery(initialData)
  const bookmarkIds = data.pages.flatMap((page) => page.bookmarks.map((bookmark) => bookmark.mangaId))
  const { isSelectionMode } = useLibrarySelectionStore()

  const infiniteScrollTriggerRef = useInfiniteScrollObserver({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  })

  const { mangaMap } = useMangaListCachedQuery({ mangaIds: bookmarkIds })

  return (
    <>
      <ul className={`grid ${MANGA_LIST_GRID_COLUMNS[ViewCookie.CARD]} gap-2 p-2`}>
        {bookmarkIds.map((mangaId, index) => {
          const manga = mangaMap.get(mangaId) ?? { id: mangaId, title: '불러오는 중', images: [] }

          if (!isSelectionMode) {
            return <MangaCard index={index} key={mangaId} manga={manga} />
          }

          return <SelectableMangaCard index={index} key={mangaId} manga={manga} />
        })}
        {isFetchingNextPage && <MangaCardSkeleton />}
      </ul>
      {hasNextPage && <div className="w-full p-2" ref={infiniteScrollTriggerRef} />}
    </>
  )
}
