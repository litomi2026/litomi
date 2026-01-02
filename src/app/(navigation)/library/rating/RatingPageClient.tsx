'use client'

import { Star } from 'lucide-react'
import { useState } from 'react'

import { RatingSort } from '@/backend/api/v1/library/enum'
import { GETV1RatingsResponse } from '@/backend/api/v1/library/rating'
import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import LoadMoreRetryButton from '@/components/ui/LoadMoreRetryButton'
import useInfiniteScrollObserver from '@/hook/useInfiniteScrollObserver'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'
import { Manga } from '@/types/manga'
import { View } from '@/utils/param'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

import { useLibrarySelectionStore } from '../[id]/librarySelection'
import CensoredManga from '../CensoredManga'
import SelectableMangaCard from '../SelectableMangaCard'
import useRatingInfiniteQuery from './useRatingInfiniteQuery'

type Props = {
  initialData?: GETV1RatingsResponse
  initialSort?: RatingSort
}

const SORT_OPTIONS: { value: RatingSort; label: string }[] = [
  { value: RatingSort.UPDATED_DESC, label: '최근 수정순' },
  { value: RatingSort.CREATED_DESC, label: '최근 추가순' },
  { value: RatingSort.RATING_DESC, label: '평점 높은순' },
  { value: RatingSort.RATING_ASC, label: '평점 낮은순' },
]

type MangaListProps = {
  items: { mangaId: number; rating: number }[]
  mangaMap: Map<number, Manga>
  ratingItems: { mangaId: number; rating: number }[]
  isSelectionMode: boolean
  isFetchingNextPage?: boolean
}

export default function RatingPageClient({ initialData, initialSort = RatingSort.UPDATED_DESC }: Props) {
  const [sort, setSort] = useState<RatingSort>(initialSort)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError, refetch } =
    useRatingInfiniteQuery(initialData, sort)

  const ratingItems = data.pages.flatMap((page) => page.items)
  const isSelectionMode = useLibrarySelectionStore((state) => state.isSelectionMode)
  const exitSelectionMode = useLibrarySelectionStore((state) => state.exitSelectionMode)
  const shouldGroupByRating = sort === RatingSort.RATING_DESC || sort === RatingSort.RATING_ASC
  const canAutoLoadMore = Boolean(hasNextPage) && !isFetchNextPageError

  const infiniteScrollTriggerRef = useInfiniteScrollObserver({
    hasNextPage: canAutoLoadMore,
    isFetchingNextPage,
    fetchNextPage,
  })

  const { mangaMap } = useMangaListCachedQuery({ mangaIds: ratingItems.map((item) => item.mangaId) })

  const handleSortChange = async (newSort: RatingSort) => {
    if (newSort !== sort) {
      exitSelectionMode()
      setSort(newSort)
      const url = new URL(window.location.href)
      url.searchParams.set('sort', String(newSort))
      window.history.replaceState({}, '', url.toString())
      await refetch()
    }
  }

  const groupedRatings = new Map<number, typeof ratingItems>()

  ratingItems.forEach((item) => {
    const group = groupedRatings.get(item.rating) || []
    group.push(item)

    if (group.length === 1) {
      groupedRatings.set(item.rating, group)
    }
  })

  const sortedGroups = Array.from(groupedRatings.entries()).sort(([aRating], [bRating]) => {
    if (sort === RatingSort.RATING_ASC) {
      return aRating - bRating
    }
    return bRating - aRating
  })

  return (
    <>
      <div className="px-4 py-2">
        <select
          className="bg-zinc-900 text-sm px-3 py-1.5 rounded border border-zinc-800 focus:border-zinc-600 outline-none"
          onChange={(e) => handleSortChange(e.target.value as RatingSort)}
          value={sort}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {shouldGroupByRating ? (
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
                ratingItems={ratingItems}
              />
            </div>
          ))}
        </div>
      ) : (
        <MangaList
          isFetchingNextPage={isFetchingNextPage}
          isSelectionMode={isSelectionMode}
          items={ratingItems}
          mangaMap={mangaMap}
          ratingItems={ratingItems}
        />
      )}
      {canAutoLoadMore && <div className="w-full p-2" ref={infiniteScrollTriggerRef} />}
      {isFetchNextPageError && <LoadMoreRetryButton onRetry={fetchNextPage} />}
    </>
  )
}

function MangaList({ items, mangaMap, ratingItems, isSelectionMode, isFetchingNextPage }: MangaListProps) {
  return (
    <ul className={`grid ${MANGA_LIST_GRID_COLUMNS[View.CARD]} gap-2 p-2`}>
      {items.map(({ mangaId, rating }) => {
        const manga = mangaMap.get(mangaId) ?? { id: mangaId, title: '불러오는 중', images: [] }
        const index = ratingItems.findIndex((item) => item.mangaId === mangaId)

        if (!isSelectionMode) {
          return (
            <div className="relative group overflow-hidden" key={mangaId}>
              <div className="absolute top-0.5 left-0.5 right-0.5 z-10 flex justify-center p-2 rounded-t-xl bg-background/60 pointer-events-none">
                <StarRating rating={rating} />
              </div>
              <CensoredManga mangaId={mangaId} />
              <MangaCard className="h-full" index={index} manga={manga} />
            </div>
          )
        }

        return <SelectableMangaCard index={index} key={mangaId} manga={manga} />
      })}
      {isFetchingNextPage && <MangaCardSkeleton />}
    </ul>
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
