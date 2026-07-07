'use client'

import { DEFAULT_LIBRARY_ITEM_SORT, type LibraryItemSort } from '@litomi/domain/library/sort'
import { getViewFromSearchParams, setViewToSearchParams, View } from '@litomi/std'
import type { ReadonlyURLSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { MobileNavigationSpacer } from '@/app/[locale]/(navigation)/NavigationSpacers'
import AdultVerificationGate from '@/components/AdultVerificationGate'
import JuicyAdsBanner from '@/components/ads/juicy-ads/JuicyAdsBanner'
import { LIBRARY_AD_LAYOUT } from '@/components/ads/juicy-ads/layouts'
import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import LoginGate from '@/components/LoginGate'
import SearchParamsSync from '@/components/router/SearchParamsSync'
import ScrollButtons from '@/components/ScrollButtons'
import LoadMoreRetryButton from '@/components/ui/LoadMoreRetryButton'
import ViewToggle from '@/components/ViewToggle'
import VirtualMangaGrid from '@/components/virtual/VirtualMangaGrid'
import type { VirtualMangaGridItem } from '@/components/virtual/VirtualMangaGrid.types'
import useMangaCensorship from '@/hook/useMangaCensorship'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'
import useMeQuery from '@/query/useMeQuery'
import { hasAdultAccess } from '@/utils/adult-verification'
import { createLoadingManga } from '@/utils/manga-placeholder'

import { LibraryHeaderSpacer } from '../LibraryHeaderLayout'
import { useLibrarySelection } from '../librarySelection'
import SelectableMangaCard from '../SelectableMangaCard'
import { getLibraryItemSortFromSearchParams, setLibraryItemSortToSearchParams } from '../searchParams'
import { LIBRARY_ITEM_SORT_OPTIONS } from '../sort-options'
import BookmarkDownloadButton from './BookmarkDownloadButton'
import BookmarkUploadButton from './BookmarkUploadButton'
import NotFound from './NotFound'
import useBookmarkInfiniteQuery from './useBookmarkInfiniteQuery'

type BookmarkGridItem =
  | (VirtualMangaGridItem & {
      mangaId: number
      type: 'manga'
    })
  | (VirtualMangaGridItem & {
      type: 'loading'
    })

type ContentProps = {
  onSortChange: (sort: LibraryItemSort) => void
  onViewChange: (view: View) => void
  sort: LibraryItemSort
  view: View
}

export default function BookmarkPageClient() {
  const [sort, setSort] = useState<LibraryItemSort>(DEFAULT_LIBRARY_ITEM_SORT)
  const [view, setView] = useState<View>(View.CARD)

  function handleSearchParamsUpdate(searchParams: ReadonlyURLSearchParams) {
    const nextSort = getLibraryItemSortFromSearchParams(searchParams)
    const nextView = getViewFromSearchParams(searchParams)

    setSort(nextSort)
    setView(nextView)
    replaceURL(nextSort, nextView)
  }

  function handleSortChange(nextSort: LibraryItemSort) {
    setSort(nextSort)
    replaceURL(nextSort, view)
  }

  function handleViewChange(nextView: View) {
    setView(nextView)
    replaceURL(sort, nextView)
  }

  function replaceURL(nextSort: LibraryItemSort, nextView: View) {
    const url = new URL(window.location.href)
    setViewToSearchParams(url.searchParams, nextView)
    setLibraryItemSortToSearchParams(url.searchParams, nextSort)

    const href = url.toString()
    if (href !== window.location.href) {
      window.history.replaceState(null, '', href)
    }
  }

  return (
    <>
      <SearchParamsSync onUpdate={handleSearchParamsUpdate} />
      <BookmarkContent onSortChange={handleSortChange} onViewChange={handleViewChange} sort={sort} view={view} />
    </>
  )
}

function BookmarkContent({ onSortChange, onViewChange, sort, view }: ContentProps) {
  const [scrollToOptions, setScrollToOptions] = useState<ScrollToOptions>()
  const { exit, isSelectionMode } = useLibrarySelection()
  const { isVisible } = useMangaCensorship()
  const { data: me } = useMeQuery()
  const sortT = useTranslations('Library.sort')
  const emptyT = useTranslations('Library.empty')
  const guardT = useTranslations('Common.guard')
  const canAccess = hasAdultAccess(me)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError, isLoading } =
    useBookmarkInfiniteQuery({ enabled: canAccess, sort })

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
      onSortChange(newSort as LibraryItemSort)
      setScrollToOptions({ top: 0 })
    }
  }

  const header = (
    <>
      <LibraryHeaderSpacer />
      <JuicyAdsBanner className="mx-2 mt-2" layout={LIBRARY_AD_LAYOUT} />
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 pb-0">
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="bg-zinc-900 text-base px-3 py-2 rounded border border-zinc-800 focus:border-zinc-600 outline-none"
            onChange={(e) => handleSortChange(e.target.value)}
            value={sort}
          >
            {LIBRARY_ITEM_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {sortT(option.labelKey)}
              </option>
            ))}
          </select>
          <ViewToggle onViewChange={onViewChange} view={view} />
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
    return (
      <>
        <LibraryHeaderSpacer />
        <LoginGate description={emptyT('bookmarkUnauthorizedDescription')} />
      </>
    )
  }

  if (me && !canAccess) {
    return (
      <>
        <LibraryHeaderSpacer />
        <AdultVerificationGate description={guardT('adultDescription')} />
      </>
    )
  }

  if (data && bookmarkIds.length === 0) {
    return <NotFound />
  }

  return (
    <>
      <VirtualMangaGrid
        fetchNextPage={fetchNextPage}
        footer={footer}
        hasNextPage={canAutoLoadMore}
        header={header}
        isFetchingNextPage={isFetchingNextPage}
        itemGap={8}
        items={items}
        renderItem={renderItem}
        scrollToOptions={scrollToOptions}
        view={view}
      />
      <ScrollButtons />
    </>
  )
}
