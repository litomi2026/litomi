'use client'

import { useState } from 'react'

import type { GETV1BookmarkResponse } from '@/backend/api/v1/bookmark/GET'

import {
  COLLECTION_ITEM_SORT_OPTIONS,
  CollectionItemSort,
  DEFAULT_COLLECTION_ITEM_SORT,
} from '@/backend/api/v1/library/item-sort'
import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import LoadMoreRetryButton from '@/components/ui/LoadMoreRetryButton'
import useInfiniteScrollObserver from '@/hook/useInfiniteScrollObserver'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'
import { View } from '@/utils/param'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

import { useLibrarySelection } from '../librarySelection'
import SelectableMangaCard from '../SelectableMangaCard'
import BookmarkDownloadButton from './BookmarkDownloadButton'
import BookmarkUploadButton from './BookmarkUploadButton'
import NotFound from './NotFound'
import useBookmarkInfiniteQuery from './useBookmarkInfiniteQuery'

type Props = {
  initialData?: GETV1BookmarkResponse
  initialSort?: CollectionItemSort
}

export default function BookmarkPageClient({ initialData, initialSort = DEFAULT_COLLECTION_ITEM_SORT }: Props) {
  const [sort, setSort] = useState<CollectionItemSort>(initialSort)
  const queryInitialData = sort === initialSort ? initialData : undefined

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError, isLoading } =
    useBookmarkInfiniteQuery(queryInitialData, sort)

  const bookmarkIds = data?.pages.flatMap((page) => page.bookmarks.map((bookmark) => bookmark.mangaId)) ?? []
  const { exit, isSelectionMode } = useLibrarySelection()
  const canAutoLoadMore = Boolean(hasNextPage) && !isFetchNextPageError
  const showLoadingSkeleton = (isLoading && bookmarkIds.length === 0) || isFetchingNextPage

  const infiniteScrollTriggerRef = useInfiniteScrollObserver({
    hasNextPage: canAutoLoadMore,
    isFetchingNextPage,
    fetchNextPage,
  })

  const { mangaMap } = useMangaListCachedQuery({ mangaIds: bookmarkIds })

  function handleSortChange(newSort: CollectionItemSort) {
    if (newSort !== sort) {
      exit()
      setSort(newSort)
      const url = new URL(window.location.href)
      url.searchParams.set('sort', String(newSort))
      window.history.replaceState({}, '', url.toString())
    }
  }

  if (data && bookmarkIds.length === 0 && !hasNextPage && !isFetchingNextPage && !isLoading) {
    return <NotFound />
  }

  return (
    <>
      <div className="flex justify-between items-center gap-x-2 flex-wrap p-2 pb-0">
        <select
          className="bg-zinc-900 text-sm px-3 py-1.5 rounded border border-zinc-800 focus:border-zinc-600 outline-none"
          onChange={(e) => handleSortChange(e.target.value as CollectionItemSort)}
          value={sort}
        >
          {COLLECTION_ITEM_SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-x-2">
          <BookmarkDownloadButton />
          <BookmarkUploadButton />
        </div>
      </div>
      <ul className={`grid ${MANGA_LIST_GRID_COLUMNS[View.CARD]} gap-2 p-2`}>
        {bookmarkIds.map((mangaId, index) => {
          const manga = mangaMap.get(mangaId) ?? { id: mangaId, title: '불러오는 중', images: [] }

          if (!isSelectionMode) {
            return <MangaCard index={index} key={mangaId} manga={manga} />
          }

          return <SelectableMangaCard index={index} key={mangaId} manga={manga} />
        })}
        {showLoadingSkeleton && <MangaCardSkeleton />}
      </ul>
      {canAutoLoadMore && <div className="w-full p-2" ref={infiniteScrollTriggerRef} />}
      {isFetchNextPageError && <LoadMoreRetryButton onRetry={fetchNextPage} />}
    </>
  )
}
