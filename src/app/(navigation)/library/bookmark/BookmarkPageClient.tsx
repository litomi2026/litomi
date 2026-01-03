'use client'

import type { GETV1BookmarkResponse } from '@/backend/api/v1/bookmark/GET'

import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import LoadMoreRetryButton from '@/components/ui/LoadMoreRetryButton'
import useInfiniteScrollObserver from '@/hook/useInfiniteScrollObserver'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'
import { View } from '@/utils/param'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

import { useLibrarySelectionStore } from '../[id]/librarySelection'
import SelectableMangaCard from '../SelectableMangaCard'
import useBookmarkIdsInfiniteQuery from './useBookmarkIdsInfiniteQuery'

type Props = {
  initialData?: GETV1BookmarkResponse
}

export default function BookmarkPageClient({ initialData }: Props) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError } =
    useBookmarkIdsInfiniteQuery(initialData)

  const bookmarkIds = data.pages.flatMap((page) => page.bookmarks.map((bookmark) => bookmark.mangaId))
  const { isSelectionMode } = useLibrarySelectionStore()
  const canAutoLoadMore = Boolean(hasNextPage) && !isFetchNextPageError

  const infiniteScrollTriggerRef = useInfiniteScrollObserver({
    hasNextPage: canAutoLoadMore,
    isFetchingNextPage,
    fetchNextPage,
  })

  const { mangaMap } = useMangaListCachedQuery({ mangaIds: bookmarkIds })

  return (
    <>
      <ul className={`grid ${MANGA_LIST_GRID_COLUMNS[View.CARD]} gap-2 p-2`}>
        {bookmarkIds.map((mangaId, index) => {
          const manga = mangaMap.get(mangaId) ?? { id: mangaId, title: '불러오는 중', images: [] }

          if (!isSelectionMode) {
            return <MangaCard index={index} key={mangaId} manga={manga} />
          }

          return <SelectableMangaCard index={index} key={mangaId} manga={manga} />
        })}
        {isFetchingNextPage && <MangaCardSkeleton />}
      </ul>
      {canAutoLoadMore && <div className="w-full p-2" ref={infiniteScrollTriggerRef} />}
      {isFetchNextPageError && <LoadMoreRetryButton onRetry={fetchNextPage} />}
    </>
  )
}
