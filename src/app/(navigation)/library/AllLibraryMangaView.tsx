'use client'

import { Library } from 'lucide-react'
import Link from 'next/link'
import { ReadonlyURLSearchParams } from 'next/navigation'
import { useState } from 'react'

import type { VirtualMangaGridItem } from '@/components/virtual/VirtualMangaGrid.types'

import { LIBRARY_NON_ADULT_AD_LAYOUT } from '@/components/ads/juicy-ads/layouts'
import NonAdultJuicyAdsBanner from '@/components/ads/juicy-ads/NonAdultJuicyAdsBanner'
import { useNavigationAutoHideScrollElement } from '@/components/auto-hide/navigationAutoHide'
import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import SearchParamsSync from '@/components/router/SearchParamsSync'
import { MobileNavigationSpacer } from '@/components/ScrollSpacers'
import LoadMoreRetryButton from '@/components/ui/LoadMoreRetryButton'
import ViewToggle from '@/components/ViewToggle'
import VirtualMangaGrid from '@/components/virtual/VirtualMangaGrid'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'
import { createLoadingManga } from '@/utils/manga-placeholder'
import { getViewFromSearchParams, View } from '@/utils/param'
import { MANGA_GRID_COLUMN } from '@/utils/style'

import CensoredManga from './CensoredManga'
import { LIBRARY_HEADER_SPACER_CLASS_NAME } from './libraryHeaderLayout'
import useAllLibraryMangaInfiniteQuery from './useAllLibraryMangaInfiniteQuery'

type AllLibraryMangaItem =
  | (VirtualMangaGridItem & {
      libraryItem: LibraryItem
      type: 'manga'
    })
  | (VirtualMangaGridItem & {
      type: 'loading'
    })

type Library = {
  id: number
  name: string
  color: string | null
  icon: string | null
}

type LibraryItem = {
  mangaId: number
  createdAt: number
  library: Library
}

type Props = {
  initialView: View
}

export default function AllLibraryMangaView({ initialView }: Readonly<Props>) {
  const [view, setView] = useState<View>(initialView)
  const setNavigationAutoHideScrollElement = useNavigationAutoHideScrollElement()

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    isPending: isLibraryPending,
  } = useAllLibraryMangaInfiniteQuery()

  const libraryItems = mergeUniqueLibraryItems(data?.pages)
  const mangaIds = libraryItems.map((item) => item.mangaId)
  const { mangaMap } = useMangaListCachedQuery({ mangaIds })
  const canAutoLoadMore = Boolean(hasNextPage) && !isFetchNextPageError
  const isInitialLoading = libraryItems.length === 0 && isLibraryPending

  const items: AllLibraryMangaItem[] = libraryItems.map((libraryItem) => ({
    key: `manga-${libraryItem.mangaId}`,
    libraryItem,
    type: 'manga',
  }))

  if (isFetchingNextPage) {
    items.push({
      key: 'loading-skeleton',
      type: 'loading',
    })
  }

  const header = (
    <>
      <div aria-hidden className={LIBRARY_HEADER_SPACER_CLASS_NAME} />
      <NonAdultJuicyAdsBanner className="mx-2 mt-2" layout={LIBRARY_NON_ADULT_AD_LAYOUT} />
      <div className="flex flex-wrap items-center gap-2 p-2 pb-0">
        <ViewToggle initialView={initialView} />
      </div>
    </>
  )

  const footer = (
    <>
      {isFetchNextPageError && (
        <div className="flex justify-center py-4">
          <LoadMoreRetryButton onRetry={fetchNextPage} />
        </div>
      )}
      <MobileNavigationSpacer />
    </>
  )

  function renderItem(item: AllLibraryMangaItem, index: number) {
    if (item.type === 'loading') {
      return <MangaCardSkeleton variant={view} />
    }

    const { library, mangaId } = item.libraryItem
    const manga = mangaMap.get(mangaId) ?? createLoadingManga(mangaId)

    return (
      <div className="relative h-full rounded-xl overflow-hidden">
        <CensoredManga mangaId={mangaId} />
        <MangaCard className="h-full" index={index} manga={manga} variant={view} />
        <Link
          className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-900/90 border border-zinc-700 shadow hover:bg-zinc-800 transition"
          href={`/library/${library.id}`}
          prefetch={false}
          style={{ borderColor: library.color ?? '' }}
        >
          {library.icon && <span className="text-xs">{library.icon}</span>}
          <span className="text-xs font-medium truncate max-w-[100px]">{library.name}</span>
        </Link>
      </div>
    )
  }

  function handleViewUpdate(searchParams: ReadonlyURLSearchParams) {
    setView(getViewFromSearchParams(searchParams))
  }

  if (isInitialLoading) {
    return (
      <>
        <div aria-hidden className={LIBRARY_HEADER_SPACER_CLASS_NAME} />
        <div className={`grid ${MANGA_GRID_COLUMN[view]} gap-2 p-2`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <MangaCardSkeleton key={i} variant={view} />
          ))}
        </div>
      </>
    )
  }

  if (libraryItems.length === 0) {
    return (
      <>
        <div aria-hidden className={LIBRARY_HEADER_SPACER_CLASS_NAME} />
        <div className="h-full flex-1 flex flex-col items-center justify-center text-center px-4">
          <Library className="size-24 sm:size-32 mx-auto mb-4 sm:mb-6 text-zinc-700" />
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">공개된 서재가 없어요</h2>
          <p className="text-sm sm:text-base text-zinc-500 mb-6 sm:mb-8">다른 사용자들이 공개한 서재가 아직 없어요</p>
        </div>
      </>
    )
  }

  return (
    <>
      <SearchParamsSync onUpdate={handleViewUpdate} />
      <VirtualMangaGrid
        fetchNextPage={fetchNextPage}
        footer={footer}
        hasNextPage={canAutoLoadMore}
        header={header}
        isFetchingNextPage={isFetchingNextPage}
        itemGap={8}
        items={items}
        measurementKey={view}
        onScrollElementChange={setNavigationAutoHideScrollElement}
        renderItem={renderItem}
        scrollRestorationKey={`library:public:${view}`}
        view={view}
      />
    </>
  )
}

function mergeUniqueLibraryItems(pages?: { items: LibraryItem[] }[]) {
  const seen = new Set<number>()
  const items: LibraryItem[] = []

  for (const page of pages ?? []) {
    for (const item of page.items) {
      if (seen.has(item.mangaId)) {
        continue
      }

      seen.add(item.mangaId)
      items.push(item)
    }
  }

  return items
}
