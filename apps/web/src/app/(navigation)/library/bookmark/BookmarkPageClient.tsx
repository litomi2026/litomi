'use client'

import { CollectionItemSort } from '@litomi/domain/library/sort'
import { getViewFromSearchParams, View } from '@litomi/std'
import { ReadonlyURLSearchParams } from 'next/navigation'
import { useState } from 'react'

import type { VirtualMangaGridItem } from '@/components/virtual/VirtualMangaGrid.types'

import JuicyAdsBanner from '@/components/ads/juicy-ads/JuicyAdsBanner'
import { LIBRARY_NON_ADULT_AD_LAYOUT } from '@/components/ads/juicy-ads/layouts'
import { useNavigationAutoHideScrollElement } from '@/components/auto-hide/navigationAutoHide'
import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import SearchParamsSync from '@/components/router/SearchParamsSync'
import { MobileNavigationSpacer } from '@/components/ScrollSpacers'
import LoadMoreRetryButton from '@/components/ui/LoadMoreRetryButton'
import ViewToggle from '@/components/ViewToggle'
import VirtualMangaGrid from '@/components/virtual/VirtualMangaGrid'
import useMangaCensorship from '@/hook/useMangaCensorship'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'
import useMeQuery from '@/query/useMeQuery'
import { createLoadingManga } from '@/utils/manga-placeholder'

import { LIBRARY_HEADER_SPACER_CLASS_NAME } from '../libraryHeaderLayout'
import { useLibrarySelection } from '../librarySelection'
import SelectableMangaCard from '../SelectableMangaCard'
import { COLLECTION_ITEM_SORT_OPTIONS } from '../sort-options'
import BookmarkDownloadButton from './BookmarkDownloadButton'
import BookmarkUploadButton from './BookmarkUploadButton'
import NotFound from './NotFound'
import Unauthorized from './Unauthorized'
import useBookmarkInfiniteQuery from './useBookmarkInfiniteQuery'

type BookmarkGridItem =
  | (VirtualMangaGridItem & {
      mangaId: number
      type: 'manga'
    })
  | (VirtualMangaGridItem & {
      type: 'loading'
    })

type Props = {
  initialSort: CollectionItemSort
  initialView: View
}

export default function BookmarkPageClient({ initialSort, initialView }: Props) {
  const [sort, setSort] = useState<CollectionItemSort>(initialSort)
  const [view, setView] = useState<View>(initialView)
  const [scrollToOptions, setScrollToOptions] = useState<ScrollToOptions>()
  const { exit, isSelectionMode } = useLibrarySelection()
  const setNavigationAutoHideScrollElement = useNavigationAutoHideScrollElement()
  const { heavySignature, isVisible } = useMangaCensorship()
  const { data: me } = useMeQuery()

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError, isLoading } =
    useBookmarkInfiniteQuery({ enabled: Boolean(me), sort })

  const bookmarks = data?.pages.flatMap((page) => page.bookmarks) ?? []
  const bookmarkIds = bookmarks.map((bookmark) => bookmark.mangaId)
  const canAutoLoadMore = Boolean(hasNextPage) && !isFetchNextPageError
  const showLoadingSkeleton = (!data && (me === undefined || isLoading)) || isFetchingNextPage

  const { mangaMap } = useMangaListCachedQuery({
    mangaIds: bookmarkIds,
    catalogMangas: bookmarks.map(({ manga }) => manga),
  })

  const visibleBookmarkIds = bookmarkIds.filter((mangaId) => isVisible(mangaMap.get(mangaId)))

  const items = visibleBookmarkIds.map<BookmarkGridItem>((mangaId) => ({
    key: `manga-${mangaId}`,
    mangaId,
    type: 'manga',
  }))

  if (showLoadingSkeleton) {
    items.push({
      key: 'loading-skeleton',
      type: 'loading',
    })
  }

  const footer = (
    <>
      {isFetchNextPageError && (
        <div className="flex justify-center py-4">
          <LoadMoreRetryButton onRetry={fetchNextPage} />
        </div>
      )}
      <MobileNavigationSpacer />
    </>
  )

  function handleSortChange(newSort: string) {
    if (newSort !== sort) {
      exit()
      setSort(newSort as CollectionItemSort)
      const url = new URL(window.location.href)
      url.searchParams.set('sort', String(newSort))
      window.history.replaceState(window.history.state, '', url)
      setScrollToOptions({ top: 0 })
    }
  }

  const header = (
    <>
      <div aria-hidden className={LIBRARY_HEADER_SPACER_CLASS_NAME} />
      <JuicyAdsBanner className="mx-2 mt-2" layout={LIBRARY_NON_ADULT_AD_LAYOUT} />
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 pb-0">
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="bg-zinc-900 text-sm px-3 py-2 rounded border border-zinc-800 focus:border-zinc-600 outline-none"
            onChange={(e) => handleSortChange(e.target.value)}
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
        {me && (
          <div className="ml-auto flex items-center gap-x-2">
            <BookmarkDownloadButton />
            <BookmarkUploadButton />
          </div>
        )}
      </div>
    </>
  )

  function handleViewUpdate(searchParams: ReadonlyURLSearchParams) {
    setView(getViewFromSearchParams(searchParams))
  }

  function renderItem(item: BookmarkGridItem, index: number) {
    if (item.type === 'loading') {
      return <MangaCardSkeleton variant={view} />
    }

    const manga = mangaMap.get(item.mangaId) ?? createLoadingManga(item.mangaId)

    if (!isSelectionMode) {
      return <MangaCard index={index} manga={manga} variant={view} />
    }

    return <SelectableMangaCard index={index} manga={manga} variant={view} />
  }

  if (me === null) {
    return <Unauthorized />
  }

  if (data && bookmarkIds.length === 0) {
    return <NotFound />
  }

  return (
    <>
      <SearchParamsSync onUpdate={handleViewUpdate} />
      <VirtualMangaGrid
        fetchNextPage={fetchNextPage}
        footer={footer}
        hasNextPage={canAutoLoadMore}
        header={header}
        isFetchingNextPage={isFetchingNextPage}
        itemGap={8}
        items={items}
        measurementKey={`${sort}:${view}:${heavySignature}`}
        onScrollElementChange={setNavigationAutoHideScrollElement}
        renderItem={renderItem}
        scrollRestorationKey={`library:bookmark:${sort}:${view}`}
        scrollToOptions={scrollToOptions}
        view={view}
      />
    </>
  )
}
