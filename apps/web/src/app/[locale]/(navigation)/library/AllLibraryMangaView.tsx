'use client'

import type { Manga } from '@litomi/domain/manga/model'
import type { NativeGridSponsor } from '@litomi/domain/sponsor/native-grid'
import type { ReadonlyURLSearchParams } from 'next/navigation'

import { getViewFromSearchParams, setViewToSearchParams, View } from '@litomi/std'
import { Library } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import type { VirtualMangaGridItem } from '@/components/virtual/VirtualMangaGrid.types'

import { MobileNavigationSpacer } from '@/app/[locale]/(navigation)/NavigationSpacers'
import JuicyAdsBanner from '@/components/ads/juicy-ads/JuicyAdsBanner'
import { LIBRARY_NON_ADULT_AD_LAYOUT } from '@/components/ads/juicy-ads/layouts'
import { useNavigationAutoHideScrollElement } from '@/components/auto-hide/navigationAutoHide'
import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import NativeGridSponsorCard from '@/components/card/NativeGridSponsorCard'
import SearchParamsSync from '@/components/router/SearchParamsSync'
import { insertNativeGridSponsorItem, type NativeGridSponsorItem } from '@/components/sponsor/nativeGridSponsorItem'
import StatusState from '@/components/status/StatusState'
import LoadMoreRetryButton from '@/components/ui/LoadMoreRetryButton'
import ViewToggle from '@/components/ViewToggle'
import VirtualMangaGrid from '@/components/virtual/VirtualMangaGrid'
import useMangaCensorship from '@/hook/useMangaCensorship'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'
import { Link } from '@/i18n/navigation'
import { createLoadingManga } from '@/utils/manga-placeholder'
import { MANGA_GRID_COLUMN } from '@/utils/style'

import { LibraryHeaderSpacer } from './LibraryHeaderLayout'
import useAllLibraryMangaInfiniteQuery from './useAllLibraryMangaInfiniteQuery'

type AllLibraryMangaItem = LoadingItem | MangaItem | NativeGridSponsorItem

type ContentProps = Props & {
  onViewChange: (view: View) => void
  view: View
}

type Library = {
  id: number
  name: string
  color: string | null
  icon: string | null
}

type LibraryItem = {
  mangaId: number
  createdAt: number
  manga?: Manga
  library: Library
}

type LoadingItem = VirtualMangaGridItem & {
  type: 'loading'
}

type MangaItem = VirtualMangaGridItem & {
  libraryItem: LibraryItem
  type: 'manga'
}

type Props = {
  nativeGridSponsor?: NativeGridSponsor | null
}

export default function AllLibraryMangaView({ nativeGridSponsor }: Props) {
  const [view, setView] = useState<View>(View.CARD)

  function handleSearchParamsUpdate(searchParams: ReadonlyURLSearchParams) {
    const nextView = getViewFromSearchParams(searchParams)
    setView(nextView)
    replaceURL(nextView)
  }

  function handleViewChange(nextView: View) {
    setView(nextView)
    replaceURL(nextView)
  }

  function replaceURL(nextView: View) {
    const url = new URL(window.location.href)
    setViewToSearchParams(url.searchParams, nextView)

    const href = url.toString()
    if (href !== window.location.href) {
      window.history.replaceState(null, '', href)
    }
  }

  return (
    <>
      <SearchParamsSync onUpdate={handleSearchParamsUpdate} />
      <AllLibraryMangaContent nativeGridSponsor={nativeGridSponsor} onViewChange={handleViewChange} view={view} />
    </>
  )
}

function AllLibraryMangaContent({ nativeGridSponsor, onViewChange, view }: ContentProps) {
  const setNavigationAutoHideScrollElement = useNavigationAutoHideScrollElement()
  const { heavySignature, isVisible } = useMangaCensorship()
  const t = useTranslations('Library.empty')

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

  const { mangaMap } = useMangaListCachedQuery({
    mangaIds,
    catalogMangas: libraryItems.map(({ manga }) => manga),
  })

  const canAutoLoadMore = Boolean(hasNextPage) && !isFetchNextPageError
  const isInitialLoading = libraryItems.length === 0 && isLibraryPending
  const visibleLibraryItems = libraryItems.filter(({ mangaId }) => isVisible(mangaMap.get(mangaId)))

  const mangaItems = visibleLibraryItems.map((libraryItem) => ({
    key: `manga-${libraryItem.mangaId}`,
    libraryItem,
    type: 'manga' as const,
  }))

  const items: AllLibraryMangaItem[] = insertNativeGridSponsorItem(mangaItems, nativeGridSponsor)

  if (isFetchingNextPage) {
    items.push({
      key: 'loading-skeleton',
      type: 'loading',
    })
  }

  const header = (
    <>
      <LibraryHeaderSpacer />
      <JuicyAdsBanner className="mx-2 mt-2" layout={LIBRARY_NON_ADULT_AD_LAYOUT} />
      <div className="flex flex-wrap items-center gap-2 p-2 pb-0">
        <ViewToggle onViewChange={onViewChange} view={view} />
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

    if (item.type === 'native-grid-sponsor') {
      return <NativeGridSponsorCard sponsor={item.sponsor} variant={view} />
    }

    const { library, mangaId } = item.libraryItem
    const manga = mangaMap.get(mangaId) ?? createLoadingManga(mangaId)

    return (
      <div className="relative h-full rounded-xl overflow-hidden">
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

  if (isInitialLoading) {
    return (
      <>
        <LibraryHeaderSpacer />
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
        <LibraryHeaderSpacer />
        <StatusState
          description={t('publicDescription')}
          icon={<Library className="size-8" />}
          title={t('publicTitle')}
        />
      </>
    )
  }

  return (
    <VirtualMangaGrid
      fetchNextPage={fetchNextPage}
      footer={footer}
      hasNextPage={canAutoLoadMore}
      header={header}
      isFetchingNextPage={isFetchingNextPage}
      itemGap={8}
      items={items}
      measurementKey={`${view}:${heavySignature}`}
      onScrollElementChange={setNavigationAutoHideScrollElement}
      renderItem={renderItem}
      scrollRestorationKey={`library:public:${view}`}
      view={view}
    />
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
