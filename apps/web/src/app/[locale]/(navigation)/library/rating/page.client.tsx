'use client'

import { isGroupedRatingSort, RatingSort } from '@litomi/domain/library/sort'
import { getViewFromSearchParams, setViewToSearchParams, View } from '@litomi/std'
import { Star } from 'lucide-react'
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
import { getRatingSortFromSearchParams, setRatingSortToSearchParams } from '../searchParams'
import NotFound from './NotFound'
import useRatingInfiniteQuery from './useRatingInfiniteQuery'

const SORT_OPTIONS = [
  { value: RatingSort.UPDATED_DESC, labelKey: 'ratingUpdatedDesc' },
  { value: RatingSort.CREATED_DESC, labelKey: 'ratingCreatedDesc' },
  { value: RatingSort.RATING_DESC, labelKey: 'ratingDesc' },
  { value: RatingSort.RATING_ASC, labelKey: 'ratingAsc' },
  { value: RatingSort.MANGA_ID_DESC, labelKey: 'mangaIdDesc' },
  { value: RatingSort.MANGA_ID_ASC, labelKey: 'mangaIdAsc' },
] as const

type ContentProps = {
  onSortChange: (sort: RatingSort) => void
  onViewChange: (view: View) => void
  sort: RatingSort
  view: View
}

type RatingGridItem = VirtualMangaGridItem &
  (
    | {
        type: 'header'
        rating: number
        count: number
      }
    | {
        type: 'manga'
        mangaId: number
        rating: number
      }
    | { type: 'loading' }
  )

export default function RatingPageClient() {
  const [sort, setSort] = useState<RatingSort>(RatingSort.UPDATED_DESC)
  const [view, setView] = useState<View>(View.CARD)

  function handleSearchParamsUpdate(searchParams: ReadonlyURLSearchParams) {
    const nextSort = getRatingSortFromSearchParams(searchParams)
    const nextView = getViewFromSearchParams(searchParams)

    setSort(nextSort)
    setView(nextView)
    replaceURL(nextSort, nextView)
  }

  function handleSortChange(nextSort: RatingSort) {
    setSort(nextSort)
    replaceURL(nextSort, view)
  }

  function handleViewChange(nextView: View) {
    setView(nextView)
    replaceURL(sort, nextView)
  }

  function replaceURL(nextSort: RatingSort, nextView: View) {
    const url = new URL(window.location.href)
    setViewToSearchParams(url.searchParams, nextView)
    setRatingSortToSearchParams(url.searchParams, nextSort)

    const href = url.toString()
    if (href !== window.location.href) {
      window.history.replaceState(null, '', href)
    }
  }

  return (
    <>
      <SearchParamsSync onUpdate={handleSearchParamsUpdate} />
      <RatingContent onSortChange={handleSortChange} onViewChange={handleViewChange} sort={sort} view={view} />
    </>
  )
}

function RatingContent({ onSortChange, onViewChange, sort, view }: ContentProps) {
  const { exit, isSelectionMode } = useLibrarySelection()
  const { isVisible } = useMangaCensorship()
  const { data: me } = useMeQuery()
  const t = useTranslations('Library')
  const sortT = useTranslations('Library.sort')
  const guardT = useTranslations('Common.guard')
  const canAccess = hasAdultAccess(me)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError, isLoading } =
    useRatingInfiniteQuery({ enabled: canAccess, sort })

  const ratingItems = data?.pages?.flatMap((page) => page.items) ?? []

  const { mangaMap } = useMangaListCachedQuery({
    mangaIds: ratingItems.map((item) => item.mangaId),
    catalogMangas: ratingItems.map(({ manga }) => manga),
  })

  const canAutoLoadMore = Boolean(hasNextPage) && !isFetchNextPageError
  const showLoadingSkeleton = (!data && (me === undefined || isLoading)) || isFetchingNextPage
  const visibleRatingItems = ratingItems.filter(({ mangaId }) => isVisible(mangaMap.get(mangaId)))
  const ratingIndexMap = new Map(visibleRatingItems.map((item, index) => [item.mangaId, index]))

  const items = buildRatingGridItems({
    isGrouped: isGroupedRatingSort(sort),
    showLoadingSkeleton,
    sort,
    visibleRatingItems,
  })

  function handleSortChange(newSort: RatingSort) {
    if (newSort !== sort) {
      exit()
      onSortChange(newSort)
    }
  }

  function renderItem(item: RatingGridItem) {
    if (item.type === 'header') {
      return (
        <h4 className="bg-background border-b px-4 py-2 flex items-center">
          <div className="flex items-center gap-x-0.5">
            <StarRating rating={item.rating} />
            <span className="ml-2 text-sm text-zinc-400">({t('rating.groupLabel', { rating: item.rating })})</span>
          </div>
          <span className="ml-auto text-sm text-zinc-500">{t('rating.groupCount', { count: item.count })}</span>
        </h4>
      )
    }

    if (item.type === 'loading') {
      return <MangaCardSkeleton variant={view} />
    }

    const manga = mangaMap.get(item.mangaId) ?? createLoadingManga(item.mangaId)
    const index = ratingIndexMap.get(item.mangaId) ?? 0

    if (isSelectionMode) {
      return <SelectableMangaCard index={index} manga={manga} variant={view} />
    }

    return (
      <div className="relative group overflow-hidden">
        <div className="absolute top-0.5 left-0.5 right-0.5 z-10 flex justify-center p-2 rounded-t-xl bg-background/60 pointer-events-none">
          <StarRating rating={item.rating} />
        </div>
        <MangaCard className="h-full" index={index} manga={manga} variant={view} />
      </div>
    )
  }

  if (me === null) {
    return (
      <>
        <LibraryHeaderSpacer />
        <LoginGate description={t('empty.ratingUnauthorizedDescription')} />
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

  if (data && ratingItems.length === 0) {
    return <NotFound />
  }

  return (
    <VirtualMangaGrid
      fetchNextPage={fetchNextPage}
      footer={
        <>
          {isFetchNextPageError && (
            <div className="flex justify-center p-2">
              <LoadMoreRetryButton onRetry={fetchNextPage} />
            </div>
          )}
          <MobileNavigationSpacer />
        </>
      }
      hasNextPage={canAutoLoadMore}
      header={
        <>
          <LibraryHeaderSpacer />
          <JuicyAdsBanner className="mx-2 mt-2" layout={LIBRARY_AD_LAYOUT} />
          <div className="flex flex-wrap items-center gap-2 p-2 pb-0">
            <select
              className="bg-zinc-900 text-base px-3 py-2 rounded border border-zinc-800 focus:border-zinc-600 outline-none"
              onChange={(e) => handleSortChange(e.target.value as RatingSort)}
              value={sort}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {sortT(option.labelKey)}
                </option>
              ))}
            </select>
            <ViewToggle onViewChange={onViewChange} view={view} />
          </div>
        </>
      }
      isFullWidth={(item) => item.type === 'header'}
      items={items}
      renderItem={renderItem}
      view={view}
    />
  )
}

function buildRatingGridItems({
  isGrouped,
  showLoadingSkeleton,
  sort,
  visibleRatingItems,
}: {
  isGrouped: boolean
  showLoadingSkeleton: boolean
  sort: RatingSort
  visibleRatingItems: { mangaId: number; rating: number }[]
}): RatingGridItem[] {
  const items: RatingGridItem[] = []
  const groups = new Map<number, { mangaId: number; rating: number }[]>()

  for (const item of visibleRatingItems) {
    const group = groups.get(item.rating)

    if (group) {
      group.push(item)
    } else {
      groups.set(item.rating, [item])
    }
  }

  const sortedGroups = Array.from(groups.entries()).sort(([aRating], [bRating]) =>
    sort === RatingSort.RATING_ASC ? aRating - bRating : bRating - aRating,
  )

  if (isGrouped && sortedGroups.length > 0) {
    for (const [rating, groupItems] of sortedGroups) {
      items.push({ key: `header:${rating}`, type: 'header', rating, count: groupItems.length })

      for (const { mangaId } of groupItems) {
        items.push({ key: `manga:${mangaId}`, type: 'manga', mangaId, rating })
      }
    }
  } else {
    for (const { mangaId, rating } of visibleRatingItems) {
      items.push({ key: `manga:${mangaId}`, type: 'manga', mangaId, rating })
    }
  }

  if (showLoadingSkeleton) {
    items.push({ key: 'loading', type: 'loading' })
  }

  return items
}

function StarRating({ rating }: { rating: number }) {
  return Array.from({ length: 5 }).map((_, i) => (
    <Star
      aria-current={i < rating}
      className="size-3 aria-current:fill-brand aria-current:text-brand fill-background text-background"
      key={i}
    />
  ))
}
