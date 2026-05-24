'use client'

import type { GETV1RatingsResponse } from '@litomi/contracts'

import { isGroupedRatingSort, RatingSort } from '@litomi/domain/library/sort'
import { Manga } from '@litomi/domain/manga/model'
import { getViewFromSearchParams, View } from '@litomi/std'
import { Star } from 'lucide-react'
import { ReadonlyURLSearchParams } from 'next/navigation'
import { useState } from 'react'

import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import SearchParamsSync from '@/components/router/SearchParamsSync'
import LoadMoreRetryButton from '@/components/ui/LoadMoreRetryButton'
import ViewToggle from '@/components/ViewToggle'
import useInfiniteScrollObserver from '@/hook/useInfiniteScrollObserver'
import useMangaCensorship from '@/hook/useMangaCensorship'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'
import { createLoadingManga } from '@/utils/manga-placeholder'
import { MANGA_GRID_COLUMN } from '@/utils/style'

import { LIBRARY_HEADER_SPACER_CLASS_NAME } from '../libraryHeaderLayout'
import { useLibrarySelection } from '../librarySelection'
import SelectableMangaCard from '../SelectableMangaCard'
import NotFound from './NotFound'
import useRatingInfiniteQuery from './useRatingInfiniteQuery'

type Props = {
  initialData: GETV1RatingsResponse
  initialSort: RatingSort
  initialView: View
}

const SORT_OPTIONS: { value: RatingSort; label: string }[] = [
  { value: RatingSort.UPDATED_DESC, label: '최근 수정순' },
  { value: RatingSort.CREATED_DESC, label: '최근 평가순' },
  { value: RatingSort.RATING_DESC, label: '평점 높은순' },
  { value: RatingSort.RATING_ASC, label: '평점 낮은순' },
  { value: RatingSort.MANGA_ID_DESC, label: '작품 ID 높은순' },
  { value: RatingSort.MANGA_ID_ASC, label: '작품 ID 낮은순' },
]

type MangaListProps = {
  isFetchingNextPage?: boolean
  isSelectionMode: boolean
  items: { mangaId: number; rating: number }[]
  mangaMap: Map<number, Manga>
  ratingIndexMap: Map<number, number>
  view: View
}

export default function RatingPageClient({ initialData, initialSort, initialView }: Props) {
  const [sort, setSort] = useState<RatingSort>(initialSort)
  const [view, setView] = useState<View>(initialView)
  const { exit, isSelectionMode } = useLibrarySelection()
  const { isVisible } = useMangaCensorship()

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError, isLoading } =
    useRatingInfiniteQuery(sort === initialSort ? initialData : undefined, sort)

  const ratingItems = data?.pages?.flatMap((page) => page.items) ?? []
  const { mangaMap } = useMangaListCachedQuery({ mangaIds: ratingItems.map((item) => item.mangaId) })

  const shouldGroupByRating = isGroupedRatingSort(sort)
  const canAutoLoadMore = Boolean(hasNextPage) && !isFetchNextPageError
  const showLoadingSkeleton = isLoading && ratingItems.length === 0
  const visibleRatingItems = ratingItems.filter(({ mangaId }) => isVisible(mangaMap.get(mangaId)))
  const ratingIndexMap = new Map(visibleRatingItems.map((item, index) => [item.mangaId, index]))
  const groupedRatings = new Map<number, typeof ratingItems>()

  const infiniteScrollTriggerRef = useInfiniteScrollObserver({
    hasNextPage: canAutoLoadMore,
    isFetchingNextPage,
    fetchNextPage,
  })

  for (const item of visibleRatingItems) {
    const group = groupedRatings.get(item.rating) || []
    group.push(item)

    if (group.length === 1) {
      groupedRatings.set(item.rating, group)
    }
  }

  const sortedGroups = Array.from(groupedRatings.entries()).sort(([aRating], [bRating]) => {
    if (sort === RatingSort.RATING_ASC) {
      return aRating - bRating
    }
    return bRating - aRating
  })

  function handleViewUpdate(searchParams: ReadonlyURLSearchParams) {
    setView(getViewFromSearchParams(searchParams))
  }

  function handleSortChange(newSort: RatingSort) {
    if (newSort !== sort) {
      exit()
      setSort(newSort)
      const url = new URL(window.location.href)
      url.searchParams.set('sort', String(newSort))
      window.history.replaceState(window.history.state, '', url)
    }
  }

  if (data && ratingItems.length === 0 && !hasNextPage && !isFetchingNextPage && !isLoading) {
    return <NotFound />
  }

  return (
    <>
      <SearchParamsSync onUpdate={handleViewUpdate} />
      <div aria-hidden className={LIBRARY_HEADER_SPACER_CLASS_NAME} />
      <div className="flex flex-wrap items-center gap-2 p-2 pb-0">
        <select
          className="bg-zinc-900 text-sm px-3 py-2 rounded border border-zinc-800 focus:border-zinc-600 outline-none"
          onChange={(e) => handleSortChange(e.target.value as RatingSort)}
          value={sort}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ViewToggle initialView={initialView} />
      </div>
      {shouldGroupByRating && sortedGroups.length > 0 ? (
        <div className="grid gap-4">
          {sortedGroups.map(([rating, items], i) => (
            <div key={rating}>
              <h4 className="bg-background border-b px-4 py-2 flex items-center">
                <div className="flex items-center gap-x-0.5">
                  <StarRating rating={rating} />
                  <span className="ml-2 text-sm text-zinc-400">({rating}점)</span>
                </div>
                <span className="ml-auto text-sm text-zinc-500">{items.length}개 작품</span>
              </h4>
              <MangaList
                isFetchingNextPage={i === sortedGroups.length - 1 && isFetchingNextPage}
                isSelectionMode={isSelectionMode}
                items={items}
                mangaMap={mangaMap}
                ratingIndexMap={ratingIndexMap}
                view={view}
              />
            </div>
          ))}
        </div>
      ) : (
        <MangaList
          isFetchingNextPage={isFetchingNextPage || showLoadingSkeleton}
          isSelectionMode={isSelectionMode}
          items={visibleRatingItems}
          mangaMap={mangaMap}
          ratingIndexMap={ratingIndexMap}
          view={view}
        />
      )}
      {canAutoLoadMore && <div className="w-full p-2" ref={infiniteScrollTriggerRef} />}
      {isFetchNextPageError && <LoadMoreRetryButton onRetry={fetchNextPage} />}
    </>
  )
}

function MangaList({ isFetchingNextPage, isSelectionMode, items, mangaMap, ratingIndexMap, view }: MangaListProps) {
  return (
    <div className={`grid ${MANGA_GRID_COLUMN[view]} gap-2 p-2`}>
      {items.map(({ mangaId, rating }) => {
        const manga = mangaMap.get(mangaId) ?? createLoadingManga(mangaId)
        const index = ratingIndexMap.get(mangaId) ?? 0

        if (!isSelectionMode) {
          return (
            <div className="relative group overflow-hidden" key={mangaId}>
              <div className="absolute top-0.5 left-0.5 right-0.5 z-10 flex justify-center p-2 rounded-t-xl bg-background/60 pointer-events-none">
                <StarRating rating={rating} />
              </div>
              <MangaCard className="h-full" index={index} manga={manga} variant={view} />
            </div>
          )
        }

        return <SelectableMangaCard index={index} key={mangaId} manga={manga} variant={view} />
      })}
      {isFetchingNextPage && <MangaCardSkeleton variant={view} />}
    </div>
  )
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
