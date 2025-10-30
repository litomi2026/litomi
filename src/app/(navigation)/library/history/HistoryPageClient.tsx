'use client'

import { GETReadingHistoryResponse } from '@/app/api/reading-history/route'
import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import useInfiniteScrollObserver from '@/hook/useInfiniteScrollObserver'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'
import { View } from '@/utils/param'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

import { useLibrarySelectionStore } from '../[id]/librarySelection'
import CensoredManga from '../CensoredManga'
import SelectableMangaCard from '../SelectableMangaCard'
import useReadingHistoryInfiniteQuery from './useReadingHistoryInfiniteQuery'
import { DATE_GROUP_LABELS, groupHistoryByDate } from './utils'

type Props = {
  initialData?: GETReadingHistoryResponse
}

export default function HistoryPageClient({ initialData }: Props) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useReadingHistoryInfiniteQuery(initialData)
  const historyItems = data.pages.flatMap((page) => page.items)
  const { isSelectionMode } = useLibrarySelectionStore()

  const infiniteScrollTriggerRef = useInfiniteScrollObserver({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  })

  const { mangaMap } = useMangaListCachedQuery({ mangaIds: historyItems.map((item) => item.mangaId) })
  const groupedHistory = groupHistoryByDate(historyItems)

  return (
    <>
      <div className="grid gap-4">
        {groupedHistory?.map(([dateGroup, items]) => (
          <div key={dateGroup}>
            <h4 className="bg-background border-b border-white/5 px-4 py-2 text-sm font-medium text-zinc-400">
              {DATE_GROUP_LABELS[dateGroup]}
            </h4>
            <ul className={`grid ${MANGA_LIST_GRID_COLUMNS[View.CARD]} gap-2 p-2`}>
              {items.map(({ mangaId, lastPage }) => {
                const manga = mangaMap.get(mangaId) ?? { id: mangaId, title: '불러오는 중', images: [] }
                const index = historyItems.findIndex((item) => item.mangaId === mangaId)

                if (!isSelectionMode) {
                  return (
                    <div className="relative group overflow-hidden" key={mangaId}>
                      <CensoredManga mangaId={mangaId} />
                      <MangaCard className="h-full rounded-b-xs" index={index} manga={manga} />
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
                    </div>
                  )
                }

                return <SelectableMangaCard index={index} key={mangaId} manga={manga} />
              })}
            </ul>
          </div>
        ))}
        {isFetchingNextPage && (
          <ul className={`grid ${MANGA_LIST_GRID_COLUMNS[View.CARD]} gap-2 p-2`}>
            <MangaCardSkeleton />
          </ul>
        )}
      </div>
      {hasNextPage && <div className="w-full p-2" ref={infiniteScrollTriggerRef} />}
    </>
  )
}
