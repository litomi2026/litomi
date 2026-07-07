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
import { useNavigationAutoHideScrollElement } from '@/components/auto-hide/navigationAutoHide'
import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import SearchParamsSync from '@/components/router/SearchParamsSync'
import ScrollButtons from '@/components/ScrollButtons'
import LoadMoreRetryButton from '@/components/ui/LoadMoreRetryButton'
import ViewToggle from '@/components/ViewToggle'
import VirtualMangaGrid from '@/components/virtual/VirtualMangaGrid'
import type { VirtualMangaGridItem } from '@/components/virtual/VirtualMangaGrid.types'
import useMangaCensorship from '@/hook/useMangaCensorship'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'
import useLibraryItemsInfiniteQuery from '@/query/useLibraryItemsInfiniteQuery'
import useMeQuery from '@/query/useMeQuery'
import { hasAdultAccess } from '@/utils/adult-verification'
import { isAdultVerificationRequiredError } from '@/utils/adult-verification-error'
import { createLoadingManga } from '@/utils/manga-placeholder'

import { LibraryHeaderSpacer } from '../LibraryHeaderLayout'
import { useLibrarySelection } from '../librarySelection'
import SelectableMangaCard from '../SelectableMangaCard'
import { getLibraryItemSortFromSearchParams, setLibraryItemSortToSearchParams } from '../searchParams'
import { LIBRARY_ITEM_SORT_OPTIONS } from '../sort-options'
import { useLibraryMetaQuery } from '../useCurrentLibraryMeta'
import NotFound from './not-found'

type ContentProps = Props & {
  onSortChange: (sort: LibraryItemSort) => void
  onViewChange: (view: View) => void
  sort: LibraryItemSort
  view: View
}

type LibraryGridItem =
  | (VirtualMangaGridItem & {
      mangaId: number
      type: 'manga'
    })
  | (VirtualMangaGridItem & {
      type: 'loading'
    })

type Props = {
  libraryId: number
}

export default function LibraryItemsClient({ libraryId }: Props) {
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
      <LibraryItemsContent
        libraryId={libraryId}
        onSortChange={handleSortChange}
        onViewChange={handleViewChange}
        sort={sort}
        view={view}
      />
    </>
  )
}

function LibraryItemsContent({ libraryId, onSortChange, onViewChange, sort, view }: ContentProps) {
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null)
  const [scrollToOptions, setScrollToOptions] = useState<ScrollToOptions>()
  const setNavigationAutoHideScrollElement = useNavigationAutoHideScrollElement()
  const { exit, isSelectionMode } = useLibrarySelection()
  const { isVisible } = useMangaCensorship()
  const { data: me } = useMeQuery()
  const t = useTranslations('Library')
  const sortT = useTranslations('Library.sort')
  const userId = me?.id

  const {
    data: library,
    error: libraryError,
    isLoading: isLibraryLoading,
  } = useLibraryMetaQuery({
    enabled: me !== undefined,
    libraryId,
    userId,
  })

  const isOwner = Boolean(library && library.userId === userId)
  const scope = isOwner ? 'me' : 'public'
  const effectiveSort = isOwner ? sort : DEFAULT_LIBRARY_ITEM_SORT
  const isPrivateOwnerLibraryBlocked = isOwner && library?.isPublic === false && !hasAdultAccess(me)
  const isLibraryAdultBlocked = isAdultVerificationRequiredError(libraryError) || isPrivateOwnerLibraryBlocked

  const {
    data: itemsData,
    error: itemsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    isLoading,
  } = useLibraryItemsInfiniteQuery({
    libraryId,
    scope,
    enabled: Boolean(library) && !isLibraryAdultBlocked,
    sort: effectiveSort,
  })

  const isAdultGateRequired = isLibraryAdultBlocked || isAdultVerificationRequiredError(itemsError)
  const loadError = libraryError ?? itemsError
  const libraryItems = itemsData?.pages.flatMap((page) => page.items) ?? []
  const canAutoLoadMore = Boolean(hasNextPage) && !isFetchNextPageError
  const showLoadingSkeleton = (!itemsData && (me === undefined || isLibraryLoading || isLoading)) || isFetchingNextPage

  const { mangaMap } = useMangaListCachedQuery({
    mangaIds: libraryItems.map((item) => item.mangaId),
    catalogMangas: libraryItems.map(({ manga }) => manga),
  })

  const visibleLibraryItems = libraryItems.filter(({ mangaId }) => isVisible(mangaMap.get(mangaId)))

  const items = visibleLibraryItems.map<LibraryGridItem>(({ mangaId }) => ({
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
      <div className="flex flex-wrap items-center gap-2 p-2 pb-0">
        {isOwner && (
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
        )}
        <ViewToggle onViewChange={onViewChange} view={view} />
      </div>
    </>
  )

  function renderItem(item: LibraryGridItem, index: number) {
    if (item.type === 'loading') {
      return <MangaCardSkeleton variant={view} />
    }

    const manga = mangaMap.get(item.mangaId) ?? createLoadingManga(item.mangaId)

    if (!isSelectionMode) {
      return <MangaCard index={index} manga={manga} variant={view} />
    }

    return <SelectableMangaCard index={index} manga={manga} variant={view} />
  }

  function handleScrollElementChange(element: HTMLElement | null) {
    setScrollElement(element)
    setNavigationAutoHideScrollElement(element)
  }

  if (isAdultGateRequired) {
    return (
      <>
        <LibraryHeaderSpacer />
        <AdultVerificationGate description={t('empty.adultDescription')} />
      </>
    )
  }

  if (loadError) {
    return (
      <>
        <LibraryHeaderSpacer />
        <div className="flex-1 flex flex-col justify-center items-center">
          <p className="text-zinc-500">{t('empty.libraryLoadError')}</p>
        </div>
      </>
    )
  }

  if (!library && !isLibraryLoading && me !== undefined) {
    return <NotFound />
  }

  if (itemsData && libraryItems.length === 0) {
    return (
      <>
        <LibraryHeaderSpacer />
        <div className="flex-1 flex flex-col justify-center items-center">
          <p className="text-zinc-500">{t('empty.libraryEmpty', { name: library?.name ?? t('common.library') })}</p>
        </div>
      </>
    )
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
        onScrollElementChange={handleScrollElementChange}
        renderItem={renderItem}
        scrollToOptions={scrollToOptions}
        view={view}
      />
      <ScrollButtons scrollElement={scrollElement} />
    </>
  )
}
