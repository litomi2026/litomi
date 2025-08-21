'use client'

import { useMemo } from 'react'

import { useSearchQuery } from '@/app/(navigation)/search/useSearchQuery'
import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import MangaCardImage from '@/components/card/MangaCardImage'
import useInfiniteScrollObserver from '@/hook/useInfiniteScrollObserver'
import { getViewerLink } from '@/utils/manga'
import { ViewCookie } from '@/utils/param'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

type Props = {
  view: ViewCookie
}

export default function SearchResults({ view }: Readonly<Props>) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useSearchQuery()
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
      <ul className={`grid ${MANGA_LIST_GRID_COLUMNS[view]} gap-2 grow`}>
        {mangas.map((manga, i) =>
          view === ViewCookie.IMAGE ? (
            <MangaCardImage
              className="bg-zinc-900 rounded-xl border-2 relative [&_img]:snap-start [&_img]:flex-shrink-0 [&_img]:w-full [&_img]:object-cover [&_img]:aspect-[3/4]"
              href={getViewerLink(manga.id)}
              key={manga.id}
              manga={manga}
              mangaIndex={i}
            />
          ) : (
            <MangaCard index={i} key={manga.id} manga={manga} showSearchFromNextButton />
          ),
        )}
        {isFetchingNextPage && <MangaCardSkeleton />}
      </ul>
      <div className="w-full py-4 flex justify-center" ref={loadMoreRef} />
    </>
  )
}
