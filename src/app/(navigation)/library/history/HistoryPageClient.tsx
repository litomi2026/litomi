'use client'

import { GETReadingHistoryResponse } from '@/app/api/reading-history/route'
import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import useInfiniteScrollObserver from '@/hook/useInfiniteScrollObserver'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'
import { ViewCookie } from '@/utils/param'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

import useReadingHistoryInfiniteQuery from './useReadingHistoryInfiniteQuery'

type Props = {
  initialData?: GETReadingHistoryResponse
}

export default function HistoryPageClient({ initialData }: Props) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useReadingHistoryInfiniteQuery(initialData)
  const historyItems = data.pages.flatMap((page) => page.items)

  const infiniteScrollTriggerRef = useInfiniteScrollObserver({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  })

  const { mangaMap } = useMangaListCachedQuery({ mangaIds: historyItems.map((item) => item.mangaId) })

  return (
    <>
      <ul className={`grid ${MANGA_LIST_GRID_COLUMNS[ViewCookie.CARD]} gap-2 p-4`}>
        {historyItems.map(({ mangaId, lastPage }, index) => {
          const manga = mangaMap.get(mangaId)

          if (!manga) {
            return <MangaCardSkeleton key={mangaId} />
          }

          return (
            <div className="relative group" key={mangaId}>
              <MangaCard className="h-full rounded-b-xs" index={index} manga={manga} />

              {manga.images && manga.images.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 from-black/80 to-transparent pointer-events-none">
                  <div className="text-xs bg-brand-end/80 mx-auto w-fit px-2 py-0.5 mb-1 rounded text-background opacity-0 transition group-hover:opacity-100">
                    {lastPage}/{manga.count ?? 0}p
                  </div>
                  <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-end"
                      style={{ width: `${(lastPage / (manga.count ?? 1)) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {isFetchingNextPage && <MangaCardSkeleton />}
      </ul>
      {hasNextPage && <div className="w-full p-2" ref={infiniteScrollTriggerRef} />}
    </>
  )
}
