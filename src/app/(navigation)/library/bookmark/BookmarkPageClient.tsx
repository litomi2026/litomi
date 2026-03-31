'use client'

import { ReadonlyURLSearchParams } from 'next/navigation'
import { useState } from 'react'

import type { GETV1BookmarkResponse } from '@/backend/api/v1/bookmark/GET'

import { COLLECTION_ITEM_SORT_OPTIONS, CollectionItemSort } from '@/backend/api/v1/library/item-sort'
import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import SearchParamsSync from '@/components/router/SearchParamsSync'
import LoadMoreRetryButton from '@/components/ui/LoadMoreRetryButton'
import ViewToggle from '@/components/ViewToggle'
import useInfiniteScrollObserver from '@/hook/useInfiniteScrollObserver'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'
import { getViewFromSearchParams, View } from '@/utils/param'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

import { useLibrarySelection } from '../librarySelection'
import SelectableMangaCard from '../SelectableMangaCard'
import BookmarkDownloadButton from './BookmarkDownloadButton'
import BookmarkUploadButton from './BookmarkUploadButton'
import NotFound from './NotFound'
import useBookmarkInfiniteQuery from './useBookmarkInfiniteQuery'

type Props = {
  initialData: GETV1BookmarkResponse
  initialSort: CollectionItemSort
  initialView: View
}

export default function BookmarkPageClient({ initialData, initialSort, initialView }: Props) {
  const [sort, setSort] = useState<CollectionItemSort>(initialSort)
  const [view, setView] = useState<View>(initialView)
  const { exit, isSelectionMode, selectedIds, toggle } = useLibrarySelection()

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError, isLoading } =
    useBookmarkInfiniteQuery(sort === initialSort ? initialData : undefined, sort)

  const bookmarkIds = data?.pages.flatMap((page) => page.bookmarks.map((bookmark) => bookmark.mangaId)) ?? []
  const canAutoLoadMore = Boolean(hasNextPage) && !isFetchNextPageError
  const showLoadingSkeleton = (isLoading && bookmarkIds.length === 0) || isFetchingNextPage
  const { mangaMap } = useMangaListCachedQuery({ mangaIds: bookmarkIds })

  const infiniteScrollTriggerRef = useInfiniteScrollObserver({
    hasNextPage: canAutoLoadMore,
    isFetchingNextPage,
    fetchNextPage,
  })

  function handleViewUpdate(searchParams: ReadonlyURLSearchParams) {
    setView(getViewFromSearchParams(searchParams))
  }

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
      <SearchParamsSync onUpdate={handleViewUpdate} />
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 pb-0">
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="bg-zinc-900 text-sm px-3 py-2 rounded border border-zinc-800 focus:border-zinc-600 outline-none"
            onChange={(e) => handleSortChange(e.target.value as CollectionItemSort)}
            value={sort}
          >
            {COLLECTION_ITEM_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ViewToggle initialView={initialView} />
        </div>
        <div className="ml-auto flex items-center gap-x-2">
          <BookmarkDownloadButton />
          <BookmarkUploadButton />
        </div>
      </div>
      <ul className={`grid ${MANGA_LIST_GRID_COLUMNS[view]} gap-2 p-2`}>
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
