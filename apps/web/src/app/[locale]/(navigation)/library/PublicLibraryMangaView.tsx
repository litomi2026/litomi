'use client'

import type { Manga } from '@litomi/domain/manga/model'
import type { NativeGridSponsor } from '@litomi/domain/sponsor/native-grid'
import { getViewFromSearchParams, setViewToSearchParams, View } from '@litomi/std'
import { Library } from 'lucide-react'
import type { ReadonlyURLSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { MobileNavigationSpacer } from '@/app/[locale]/(navigation)/NavigationSpacers'
import AdultVerificationGate from '@/components/AdultVerificationGate'
import JuicyAdsBanner from '@/components/ads/juicy-ads/JuicyAdsBanner'
import { LIBRARY_AD_LAYOUT } from '@/components/ads/juicy-ads/layouts'
import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import NativeGridSponsorCard from '@/components/card/NativeGridSponsorCard'
import SearchParamsSync from '@/components/router/SearchParamsSync'
import ScrollButtons from '@/components/ScrollButtons'
import { insertNativeGridSponsorItem, type NativeGridSponsorItem } from '@/components/sponsor/nativeGridSponsorItem'
import StatusState from '@/components/status/StatusState'
import LoadMoreRetryButton from '@/components/ui/LoadMoreRetryButton'
import ViewToggle from '@/components/ViewToggle'
import VirtualMangaGrid from '@/components/virtual/VirtualMangaGrid'
import type { VirtualMangaGridItem } from '@/components/virtual/VirtualMangaGrid.types'
import useMangaCensorship from '@/hook/useMangaCensorship'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'
import { Link } from '@/i18n/navigation'
import { isAdultVerificationRequiredError } from '@/utils/adult-verification-error'
import { createLoadingManga } from '@/utils/manga-placeholder'
import { MANGA_GRID_COLUMN } from '@/utils/style'

import { LibraryHeaderSpacer } from './LibraryHeaderLayout'
import usePublicLibraryMangaInfiniteQuery from './usePublicLibraryMangaInfiniteQuery'

type ContentProps = Props & {
  onViewChange: (view: View) => void
  view: View
}

type LoadingItem = VirtualMangaGridItem & {
  type: 'loading'
}

type MangaItem = VirtualMangaGridItem & {
  manga: PublicLibraryManga
  type: 'manga'
}

type Props = {
  nativeGridSponsor?: NativeGridSponsor | null
}

type PublicLibrary = {
  id: number
  name: string
  color: string | null
  icon: string | null
}

type PublicLibraryManga = {
  mangaId: number
  createdAt: number
  manga?: Manga
  library: PublicLibrary
}

type PublicLibraryMangaGridItem = LoadingItem | MangaItem | NativeGridSponsorItem

export default function PublicLibraryMangaView({ nativeGridSponsor }: Props) {
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
      <PublicLibraryMangaContent nativeGridSponsor={nativeGridSponsor} onViewChange={handleViewChange} view={view} />
    </>
  )
}

function mergeUniquePublicLibraryMangaItems(pages?: { items: PublicLibraryManga[] }[]) {
  const seen = new Set<number>()
  const items: PublicLibraryManga[] = []

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

function PublicLibraryMangaContent({ nativeGridSponsor, onViewChange, view }: ContentProps) {
  const { isVisible } = useMangaCensorship()
  const t = useTranslations('Library.empty')
  const guardT = useTranslations('Common.guard')

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    isPending: isLibraryPending,
    error,
  } = usePublicLibraryMangaInfiniteQuery()

  const mangas = mergeUniquePublicLibraryMangaItems(data?.pages)
  const mangaIds = mangas.map((item) => item.mangaId)

  const { mangaMap } = useMangaListCachedQuery({
    mangaIds,
    catalogMangas: mangas.map(({ manga }) => manga),
  })

  const canAutoLoadMore = Boolean(hasNextPage) && !isFetchNextPageError
  const isInitialLoading = mangas.length === 0 && isLibraryPending
  const visibleItems = mangas.filter(({ mangaId }) => isVisible(mangaMap.get(mangaId)))

  const mangaItems = visibleItems.map((manga) => ({
    key: `manga-${manga.mangaId}`,
    manga,
    type: 'manga' as const,
  }))

  const items: PublicLibraryMangaGridItem[] = insertNativeGridSponsorItem(mangaItems, nativeGridSponsor)

  if (isFetchingNextPage) {
    items.push({
      key: 'loading-skeleton',
      type: 'loading',
    })
  }

  const header = (
    <>
      <LibraryHeaderSpacer />
      <JuicyAdsBanner className="mx-2 mt-2" layout={LIBRARY_AD_LAYOUT} />
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

  function renderItem(item: PublicLibraryMangaGridItem, index: number) {
    if (item.type === 'loading') {
      return <MangaCardSkeleton variant={view} />
    }

    if (item.type === 'native-grid-sponsor') {
      return <NativeGridSponsorCard sponsor={item.sponsor} variant={view} />
    }

    const { library, mangaId } = item.manga
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

  if (isAdultVerificationRequiredError(error)) {
    return (
      <>
        <LibraryHeaderSpacer />
        <AdultVerificationGate description={guardT('adultDescription')} />
      </>
    )
  }

  if (mangas.length === 0) {
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
    <>
      <VirtualMangaGrid
        fetchNextPage={fetchNextPage}
        footer={footer}
        hasNextPage={canAutoLoadMore}
        header={header}
        isFetchingNextPage={isFetchingNextPage}
        itemGap={8}
        items={items}
        renderItem={renderItem}
        view={view}
      />
      <ScrollButtons />
    </>
  )
}
