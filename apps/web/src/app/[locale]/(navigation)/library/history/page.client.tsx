'use client'

import { View } from '@litomi/std'
import { useTranslations } from 'next-intl'

import { MobileNavigationSpacer } from '@/app/[locale]/(navigation)/NavigationSpacers'
import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import LoadMoreRetryButton from '@/components/ui/LoadMoreRetryButton'
import VirtualMangaGrid from '@/components/virtual/VirtualMangaGrid'
import type { VirtualMangaGridItem } from '@/components/virtual/VirtualMangaGrid.types'
import useMangaCensorship from '@/hook/useMangaCensorship'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'
import useMeQuery from '@/query/useMeQuery'
import { isAdultVerified } from '@/utils/adult-verification'
import { createLoadingManga } from '@/utils/manga-placeholder'

import { LibraryHeaderSpacer } from '../LibraryHeaderLayout'
import { useLibrarySelection } from '../librarySelection'
import SelectableMangaCard from '../SelectableMangaCard'
import NotFound from './NotFound'
import useReadingHistoryInfiniteQuery from './useReadingHistoryInfiniteQuery'
import { groupHistoryByDate } from './utils'

type HistoryGridItem = VirtualMangaGridItem &
  (
    | {
        type: 'header'
        label: string
      }
    | {
        type: 'manga'
        mangaId: number
        lastPage: number
      }
    | { type: 'loading' }
  )

export default function HistoryPageClient() {
  const { data: me } = useMeQuery()
  const { isVisible } = useMangaCensorship()
  const { isSelectionMode } = useLibrarySelection()
  const t = useTranslations('Library.history.group')
  const source = isAdultVerified(me) ? 'server' : 'local'

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError, isLoading } =
    useReadingHistoryInfiniteQuery({ enabled: me !== undefined, source })

  const historyItems = data?.pages.flatMap((page) => page.items) ?? []

  const { mangaMap } = useMangaListCachedQuery({
    mangaIds: historyItems.map((item) => item.mangaId),
    catalogMangas: historyItems.map(({ manga }) => manga),
  })

  const canAutoLoadMore = Boolean(hasNextPage) && !isFetchNextPageError
  const showLoadingSkeleton = (!data && (me === undefined || isLoading)) || isFetchingNextPage
  const visibleHistoryItems = historyItems.filter(({ mangaId }) => isVisible(mangaMap.get(mangaId)))
  const historyIndexMap = new Map(visibleHistoryItems.map((item, index) => [item.mangaId, index]))
  const items: HistoryGridItem[] = []

  for (const [dateGroup, groupItems] of groupHistoryByDate(visibleHistoryItems) ?? []) {
    items.push({ key: `header:${dateGroup}`, type: 'header', label: t(dateGroup) })

    for (const { mangaId, lastPage } of groupItems) {
      items.push({ key: `manga:${mangaId}`, type: 'manga', mangaId, lastPage })
    }
  }

  if (showLoadingSkeleton) {
    items.push({ key: 'loading', type: 'loading' })
  }

  function renderItem(item: HistoryGridItem) {
    if (item.type === 'header') {
      return (
        <h4 className="bg-background border-b border-white/5 px-4 py-2 text-sm font-medium text-zinc-400">
          {item.label}
        </h4>
      )
    }

    if (item.type === 'loading') {
      return <MangaCardSkeleton variant={View.CARD} />
    }

    const manga = mangaMap.get(item.mangaId) ?? createLoadingManga(item.mangaId)
    const index = historyIndexMap.get(item.mangaId) ?? 0

    if (isSelectionMode) {
      return <SelectableMangaCard index={index} manga={manga} variant={View.CARD} />
    }

    return (
      <div className="relative group overflow-hidden">
        <MangaCard className="h-full rounded-b-xs" index={index} manga={manga} />
        <div className="absolute bottom-0 left-0 right-0 from-black/80 to-transparent pointer-events-none">
          <div className="text-xs bg-brand/80 mx-auto w-fit px-2 py-0.5 mb-1 rounded text-background opacity-0 transition group-hover:opacity-100">
            {item.lastPage}/{manga.count ?? 0}p
          </div>
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-brand" style={{ width: `${(item.lastPage / (manga.count ?? 1)) * 100}%` }} />
          </div>
        </div>
      </div>
    )
  }

  if (data && historyItems.length === 0) {
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
      header={<LibraryHeaderSpacer />}
      isFullWidth={(item) => item.type === 'header'}
      items={items}
      renderItem={renderItem}
      view={View.CARD}
    />
  )
}
