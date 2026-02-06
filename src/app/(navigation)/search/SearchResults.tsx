'use client'

import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { Fragment, useMemo } from 'react'

import { useSearchQuery } from '@/app/(navigation)/search/useSearchQuery'
import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import MangaCardImage from '@/components/card/MangaCardImage'
import MangaCardPromotion from '@/components/card/MangaCardPromotion'
import LoadMoreRetryButton from '@/components/ui/LoadMoreRetryButton'
import useInfiniteScrollObserver from '@/hook/useInfiniteScrollObserver'
import { View } from '@/utils/param'
import { ProblemDetailsError } from '@/utils/react-query-error'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

import RandomRefreshButton from '../(top-navigation)/RandomRefreshButton'

const Error400 = dynamic(() => import('./Error400'))
const SearchResultError = dynamic(() => import('./SearchResultError'))

export default function SearchResult() {
  const searchParams = useSearchParams()
  const viewFromQuery = searchParams.get('view')
  const view = viewFromQuery === View.IMAGE ? View.IMAGE : View.CARD
  const isRandomSort = searchParams.get('sort') === 'random'

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    isRefetchError,
    refetch,
    isRefetching,
    error,
  } = useSearchQuery()

  const mangas = useMemo(() => data?.pages.flatMap((page) => page.mangas) ?? [], [data])
  const promotion = useMemo(() => data?.pages[0]?.promotion, [data])

  const loadMoreRef = useInfiniteScrollObserver({
    hasNextPage: Boolean(hasNextPage) && !isFetchNextPageError,
    isFetchingNextPage,
    fetchNextPage,
  })

  if (isLoading) {
    return <SearchResultLoading view={view} />
  }

  if (error) {
    if (error instanceof ProblemDetailsError && error.status === 400) {
      return <Error400 message={error.message} />
    }

    if (mangas.length === 0 && !isFetchingNextPage) {
      return <SearchResultError error={error} isRetrying={isRefetching} onRetry={refetch} />
    }
  }

  if (!error && mangas.length === 0 && !isFetchingNextPage) {
    return (
      <div className="flex flex-col grow justify-center items-center">
        <p className="text-zinc-500">검색 결과가 없습니다.</p>
      </div>
    )
  }

  return (
    <>
      <ul className={`grid ${MANGA_LIST_GRID_COLUMNS[view]} gap-2`}>
        {mangas.map((manga, i) =>
          view === View.IMAGE ? (
            <li data-manga-card key={manga.id}>
              <MangaCardImage
                className="bg-zinc-900 rounded-xl border-2 [&_img]:snap-start [&_img]:shrink-0 [&_img]:w-full [&_img]:object-cover [&_img]:aspect-5/7"
                manga={manga}
                mangaIndex={i}
              />
            </li>
          ) : (
            <Fragment key={manga.id}>
              {promotion && i === (promotion.position ?? 0) && <MangaCardPromotion promotion={promotion} />}
              <MangaCard index={i} manga={manga} showSearchFromNextButton />
            </Fragment>
          ),
        )}
        {isFetchingNextPage && <MangaCardSkeleton />}
      </ul>
      {mangas.length > 0 && (isFetchNextPageError || isRefetchError) && (
        <LoadMoreRetryButton onRetry={isFetchNextPageError ? fetchNextPage : refetch} />
      )}
      {isRandomSort ? (
        <RandomRefreshButton
          className="flex gap-1 items-center border-2 px-3 p-2 rounded-xl transition mx-auto"
          isLoading={isRefetching}
          onClick={async () => {
            await refetch()
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          timer={60}
        />
      ) : (
        <div className="w-full py-4 flex justify-center" ref={loadMoreRef} />
      )}
    </>
  )
}

export function SearchResultLoading({ view }: { view: View }) {
  const skeletonCount = view === View.IMAGE ? 12 : 6
  return (
    <ul className={`grid ${MANGA_LIST_GRID_COLUMNS[view]} gap-2 grow`}>
      {Array.from({ length: skeletonCount }).map((_, i) => (
        <MangaCardSkeleton key={i} />
      ))}
    </ul>
  )
}
