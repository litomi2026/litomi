'use client'

import { Fragment, useMemo } from 'react'

import { useSearchQuery } from '@/app/(navigation)/search/useSearchQuery'
import { Sort } from '@/app/api/proxy/k/search/schema'
import MangaCard, { MangaCardDonation, MangaCardSkeleton } from '@/components/card/MangaCard'
import MangaCardImage from '@/components/card/MangaCardImage'
import useInfiniteScrollObserver from '@/hook/useInfiniteScrollObserver'
import { ViewCookie } from '@/utils/param'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

import RandomRefreshButton from '../(top-navigation)/RandomRefreshButton'

const DONATION_CARD_INTERVAL = 30

type Props = {
  view: ViewCookie
  sort?: Sort
}

export default function SearchResults({ view, sort }: Props) {
  const isRandomSort = sort === Sort.RANDOM
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isRefetching } = useSearchQuery()
  const mangas = useMemo(() => data?.pages.flatMap((page) => page.mangas) ?? [], [data])

  const loadMoreRef = useInfiniteScrollObserver({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  })

  if (isLoading) {
    const skeletonCount = view === ViewCookie.IMAGE ? 12 : 6
    return (
      <ul className={`grid ${MANGA_LIST_GRID_COLUMNS[view]} gap-2 grow`}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <MangaCardSkeleton key={i} />
        ))}
      </ul>
    )
  }

  if (mangas.length === 0 && !isFetchingNextPage) {
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
          view === ViewCookie.IMAGE ? (
            <li data-manga-card key={manga.id}>
              <MangaCardImage
                className="bg-zinc-900 rounded-xl border-2 [&_img]:snap-start [&_img]:flex-shrink-0 [&_img]:w-full [&_img]:object-cover [&_img]:aspect-[3/4]"
                manga={manga}
                mangaIndex={i}
              />
            </li>
          ) : (
            <Fragment key={manga.id}>
              <MangaCard index={i} manga={manga} showSearchFromNextButton />
              {i % DONATION_CARD_INTERVAL === DONATION_CARD_INTERVAL - 1 && <MangaCardDonation />}
            </Fragment>
          ),
        )}
        {isFetchingNextPage && <MangaCardSkeleton />}
      </ul>
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
