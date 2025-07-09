'use client'

import { useSearchQuery } from '@/app/(navigation)/search/useSearchQuery'
import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import MangaCardImage from '@/components/card/MangaCardImage'
import useInfiniteScrollObserver from '@/hook/useInfiniteScrollObserver'
import { getViewerLink } from '@/utils/manga'
import { SourceParam, ViewCookie } from '@/utils/param'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

type Props = {
  view: ViewCookie
}

export default function SearchResults({ view }: Props) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useSearchQuery()
  const mangas = data.pages.flatMap((page) => page.mangas)

  const loadMoreRef = useInfiniteScrollObserver({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  })

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
              href={getViewerLink(manga.id, SourceParam.K_HENTAI)}
              index={i}
              key={manga.id}
              manga={manga}
            />
          ) : (
            <MangaCard index={i} key={manga.id} manga={manga} source={SourceParam.K_HENTAI} />
          ),
        )}
        {isFetchingNextPage && <MangaCardSkeleton />}
      </ul>
      <div className="w-full py-4 flex justify-center" ref={loadMoreRef} />
    </>
  )
}
