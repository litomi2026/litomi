'use client'

import type { Manga } from '@litomi/domain/manga/model'
import type { NativeGridSponsor } from '@litomi/domain/sponsor/native-grid'
import type { ReactNode } from 'react'

import { getViewFromSearchParams, View } from '@litomi/std'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

import type { VirtualMangaGridItem } from '@/components/virtual/VirtualMangaGrid.types'

import { useSearchQuery } from '@/app/[locale]/(navigation)/search/useSearchQuery'
import { useNavigationAutoHideScrollElement } from '@/components/auto-hide/navigationAutoHide'
import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import NativeGridSponsorCard from '@/components/card/NativeGridSponsorCard'
import { MobileNavigationSpacer, SearchHeaderSpacer } from '@/components/ScrollSpacers'
import { insertNativeGridSponsorItem, type NativeGridSponsorItem } from '@/components/sponsor/nativeGridSponsorItem'
import LoadMoreRetryButton from '@/components/ui/LoadMoreRetryButton'
import VirtualMangaGrid from '@/components/virtual/VirtualMangaGrid'
import useMangaCensorship from '@/hook/useMangaCensorship'
import { ProblemDetailsError } from '@/utils/api-request'
import { MANGA_GRID_COLUMN } from '@/utils/style'

import RandomRefreshButton from '../(top-navigation)/RandomRefreshButton'

const Error400 = dynamic(() => import('./Error400'))
const SearchResultError = dynamic(() => import('./SearchResultError'))

type LoadingItem = VirtualMangaGridItem & {
  type: 'loading'
}

type MangaItem = VirtualMangaGridItem & {
  manga: Manga
  mangaIndex: number
  type: 'manga'
}

type Props = {
  header?: ReactNode
  nativeGridSponsor?: NativeGridSponsor | null
}

type SearchResultItem = LoadingItem | MangaItem | NativeGridSponsorItem

export default function SearchResult({ header, nativeGridSponsor }: Props) {
  const t = useTranslations('Search')
  const searchParams = useSearchParams()
  const searchParamsString = searchParams.toString()
  const view = getViewFromSearchParams(searchParams)
  const [scrollToOptions, setScrollToOptions] = useState<ScrollToOptions>()
  const setNavigationAutoHideScrollElement = useNavigationAutoHideScrollElement()
  const { heavySignature, isVisible } = useMangaCensorship()

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

  const mangas = data?.pages.flatMap((page) => page.mangas) ?? []
  const visibleMangas = mangas.filter(isVisible)
  const measurementKey = `${searchParamsString}:${heavySignature}`
  const scrollRestorationKey = `search-results:${measurementKey}`
  const showRefreshButton = searchParams.get('sort') === 'random'
  const canAutoLoadMore = !showRefreshButton && Boolean(hasNextPage) && !isFetchNextPageError
  const showRetry = mangas.length > 0 && (isFetchNextPageError || isRefetchError)

  const mangaItems = visibleMangas.map((manga, mangaIndex) => ({
    key: `manga-${manga.id}`,
    manga,
    mangaIndex,
    type: 'manga' as const,
  }))

  const items: SearchResultItem[] = insertNativeGridSponsorItem(mangaItems, nativeGridSponsor)

  if (isFetchingNextPage) {
    items.push({
      key: 'loading-skeleton',
      type: 'loading',
    })
  }

  const headerWithSpacer = (
    <>
      <SearchHeaderSpacer />
      {header}
    </>
  )

  const footer = (
    <>
      <div className="flex flex-col items-center gap-2 py-4">
        {showRetry && <LoadMoreRetryButton onRetry={isFetchNextPageError ? fetchNextPage : refetch} />}
        {showRefreshButton && (
          <RandomRefreshButton
            className="flex gap-1 items-center border-2 px-3 p-2 rounded-xl transition"
            isLoading={isRefetching}
            onClick={async () => {
              await refetch()
              setScrollToOptions({ top: 0 })
            }}
            timer={1}
          />
        )}
      </div>
      <MobileNavigationSpacer />
    </>
  )

  function renderItem(item: SearchResultItem) {
    switch (item.type) {
      case 'loading':
        return <MangaCardSkeleton variant={view} />
      case 'manga':
        return (
          <MangaCard
            index={item.mangaIndex}
            manga={item.manga}
            searchParams={searchParamsString}
            showSearchFromNextButton
            variant={view}
          />
        )
      case 'native-grid-sponsor':
        return <NativeGridSponsorCard sponsor={item.sponsor} variant={view} />
    }
  }

  if (isLoading) {
    return <SearchResultLoading view={view} />
  }

  if (error) {
    if (error instanceof ProblemDetailsError && error.status === 400) {
      return (
        <SearchSpacer>
          <Error400 message={error.message} />
        </SearchSpacer>
      )
    }

    if (mangas.length === 0 && !isFetchingNextPage) {
      return (
        <SearchSpacer>
          <SearchResultError error={error} isRetrying={isRefetching} onRetry={refetch} />
        </SearchSpacer>
      )
    }
  }

  if (!error && mangas.length === 0 && !isFetchingNextPage) {
    return (
      <SearchSpacer>
        <div className="flex flex-col grow justify-center items-center">
          <p className="text-zinc-500">{t('noResults')}</p>
        </div>
      </SearchSpacer>
    )
  }

  return (
    <VirtualMangaGrid
      fetchNextPage={fetchNextPage}
      footer={footer}
      hasNextPage={canAutoLoadMore}
      header={headerWithSpacer}
      isFetchingNextPage={isFetchingNextPage}
      itemGap={8}
      items={items}
      measurementKey={measurementKey}
      onScrollElementChange={setNavigationAutoHideScrollElement}
      renderItem={renderItem}
      scrollRestorationKey={scrollRestorationKey}
      scrollToOptions={scrollToOptions}
      view={view}
    />
  )
}

export function SearchResultLoading({ view }: { view: View }) {
  return (
    <SearchSpacer>
      <div className={`p-2 grid ${MANGA_GRID_COLUMN[view]} gap-2 grow`}>
        {Array.from({ length: view === View.IMAGE ? 12 : 6 }).map((_, i) => (
          <MangaCardSkeleton key={i} variant={view} />
        ))}
      </div>
    </SearchSpacer>
  )
}

function SearchSpacer({ children }: { children: ReactNode }) {
  return (
    <>
      <SearchHeaderSpacer />
      {children}
      <MobileNavigationSpacer />
    </>
  )
}
