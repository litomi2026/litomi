'use client'

import type { GETLibraryItemsResponse } from '@litomi/contracts/api/library'

import {
  COLLECTION_ITEM_SORT_OPTIONS,
  CollectionItemSort,
  DEFAULT_COLLECTION_ITEM_SORT,
} from '@litomi/contracts/library/item-sort'
import { getViewFromSearchParams, View } from '@litomi/std/param'
import { ReadonlyURLSearchParams } from 'next/navigation'
import { useState } from 'react'

import type { VirtualMangaGridItem } from '@/components/virtual/VirtualMangaGrid.types'

import AdultVerificationGate from '@/components/AdultVerificationGate'
import { useNavigationAutoHideScrollElement } from '@/components/auto-hide/navigationAutoHide'
import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import SearchParamsSync from '@/components/router/SearchParamsSync'
import { MobileNavigationSpacer } from '@/components/ScrollSpacers'
import LoadMoreRetryButton from '@/components/ui/LoadMoreRetryButton'
import ViewToggle from '@/components/ViewToggle'
import VirtualMangaGrid from '@/components/virtual/VirtualMangaGrid'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'
import useLibraryItemsInfiniteQuery from '@/query/useLibraryItemsInfiniteQuery'
import useMeQuery from '@/query/useMeQuery'
import { getAdultState, hasAdultAccess } from '@/utils/adult-verification'
import { createLoadingManga } from '@/utils/manga-placeholder'

import { LIBRARY_HEADER_SPACER_CLASS_NAME } from '../libraryHeaderLayout'
import { useLibrarySelection } from '../librarySelection'
import SelectableMangaCard from '../SelectableMangaCard'

type LibraryGridItem =
  | (VirtualMangaGridItem & {
      mangaId: number
      type: 'manga'
    })
  | (VirtualMangaGridItem & {
      type: 'loading'
    })

type Props = {
  library: {
    id: number
    name: string
    isPublic: boolean
  }
  initialItems: GETLibraryItemsResponse
  initialSort?: CollectionItemSort
  initialView: View
  isOwner: boolean
}

export default function LibraryItemsClient({
  library,
  initialItems,
  initialSort = DEFAULT_COLLECTION_ITEM_SORT,
  initialView,
  isOwner,
}: Props) {
  const [sort, setSort] = useState<CollectionItemSort>(initialSort)
  const [view, setView] = useState<View>(initialView)
  const [scrollToOptions, setScrollToOptions] = useState<ScrollToOptions>()
  const { data: me } = useMeQuery()
  const { exit, isSelectionMode } = useLibrarySelection()
  const setNavigationAutoHideScrollElement = useNavigationAutoHideScrollElement()

  const adultState = getAdultState(me)
  const canAccess = hasAdultAccess(adultState)
  const { id: libraryId, name: libraryName, isPublic } = library
  const scope = isOwner ? 'me' : 'public'
  const enabled = scope === 'public' || isPublic || canAccess
  const shouldBlockPrivate = scope === 'me' && !isPublic && !canAccess
  const effectiveSort = isOwner ? sort : DEFAULT_COLLECTION_ITEM_SORT
  const queryInitialItems = effectiveSort === initialSort ? initialItems : undefined

  const {
    data: itemsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    isLoading,
  } = useLibraryItemsInfiniteQuery({
    libraryId,
    initialItems: queryInitialItems,
    scope,
    enabled,
    sort: effectiveSort,
  })

  const libraryItems = itemsData?.pages.flatMap((page) => page.items) ?? []
  const canAutoLoadMore = !shouldBlockPrivate && Boolean(hasNextPage) && !isFetchNextPageError
  const showLoadingSkeleton = (isLoading && libraryItems.length === 0) || isFetchingNextPage
  const { mangaMap } = useMangaListCachedQuery({ mangaIds: libraryItems.map((item) => item.mangaId) })

  const items = libraryItems.map<LibraryGridItem>(({ mangaId }) => ({
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

  function handleViewUpdate(searchParams: ReadonlyURLSearchParams) {
    setView(getViewFromSearchParams(searchParams))
  }

  function handleSortChange(newSort: CollectionItemSort) {
    if (newSort !== sort) {
      exit()
      setSort(newSort)
      const url = new URL(window.location.href)
      url.searchParams.set('sort', String(newSort))
      window.history.replaceState(window.history.state, '', url)
      setScrollToOptions({ top: 0 })
    }
  }

  const header = (
    <>
      <div aria-hidden className={LIBRARY_HEADER_SPACER_CLASS_NAME} />
      <div className="flex flex-wrap items-center gap-2 p-2 pb-0">
        {isOwner && (
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
        )}
        <ViewToggle initialView={initialView} />
      </div>
    </>
  )

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

  if (shouldBlockPrivate) {
    return (
      <>
        <div aria-hidden className={LIBRARY_HEADER_SPACER_CLASS_NAME} />
        <AdultVerificationGate
          description={`비공개 서재를 보려면 익명 성인인증이 필요해요.\n또는 서재를 공개로 전환해 주세요.`}
          title="성인인증이 필요해요"
          username={me?.name}
        />
      </>
    )
  }

  if (libraryItems.length === 0 && !isFetchingNextPage && !isLoading) {
    return (
      <>
        <div aria-hidden className={LIBRARY_HEADER_SPACER_CLASS_NAME} />
        <div className="flex-1 flex flex-col justify-center items-center">
          <p className="text-zinc-500">{`${libraryName} 서재가 비어 있어요`}</p>
        </div>
      </>
    )
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
        measurementKey={`${libraryId}:${effectiveSort}:${view}`}
        onScrollElementChange={setNavigationAutoHideScrollElement}
        renderItem={renderItem}
        scrollRestorationKey={`library:${libraryId}:${scope}:${effectiveSort}:${view}`}
        scrollToOptions={scrollToOptions}
        view={view}
      />
    </>
  )
}
