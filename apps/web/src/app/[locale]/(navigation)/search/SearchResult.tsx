'use client'

import type { Manga } from '@litomi/domain/manga/model'
import type { NativeGridSponsor } from '@litomi/domain/sponsor/native-grid'
import { getViewFromSearchParams, View } from '@litomi/std'
import dynamic from 'next/dynamic'
import type { ReadonlyURLSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { MobileNavigationSpacer } from '@/app/[locale]/(navigation)/NavigationSpacers'
import { useSearchQuery } from '@/app/[locale]/(navigation)/search/useSearchQuery'
import AdultVerificationGate from '@/components/AdultVerificationGate'
import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import NativeGridSponsorCard from '@/components/card/NativeGridSponsorCard'
import SearchParamsSync from '@/components/router/SearchParamsSync'
import ScrollButtons from '@/components/ScrollButtons'
import { insertNativeGridSponsorItem, type NativeGridSponsorItem } from '@/components/sponsor/nativeGridSponsorItem'
import LoadMoreRetryButton from '@/components/ui/LoadMoreRetryButton'
import VirtualMangaGrid from '@/components/virtual/VirtualMangaGrid'
import type { VirtualMangaGridItem } from '@/components/virtual/VirtualMangaGrid.types'
import useIsAdultGateError from '@/hook/useIsAdultGateError'
import useMangaCensorship from '@/hook/useMangaCensorship'
import { ProblemDetailsError } from '@/utils/fetch-response'
import { MANGA_GRID_COLUMN } from '@/utils/style'

import RandomRefreshButton from '../(top-navigation)/RandomRefreshButton'
import { SearchParam, SearchSort } from './constants'
import useTrackSearchTrendingView from './useTrackSearchTrendingView'

const Error400 = dynamic(() => import('./Error400'))
const SearchResultError = dynamic(() => import('./SearchResultError'))

type ContentProps = Props & {
  view: View
}

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
  searchParams: string
}

type SearchResultItem = LoadingItem | MangaItem | NativeGridSponsorItem

export default function SearchResult({ header, nativeGridSponsor, searchParams }: Props) {
  const [view, setView] = useState(View.CARD)

  function handleSearchParamsUpdate(searchParams: ReadonlyURLSearchParams) {
    setView(getViewFromSearchParams(searchParams))
  }

  return (
    <>
      <SearchParamsSync onUpdate={handleSearchParamsUpdate} />
      <SearchResultContent
        header={header}
        nativeGridSponsor={nativeGridSponsor}
        searchParams={searchParams}
        view={view}
      />
    </>
  )
}

function SearchResultContent({ header, nativeGridSponsor, searchParams, view }: ContentProps) {
  const t = useTranslations('Search')
  const guardT = useTranslations('Common.guard')
  const params = new URLSearchParams(searchParams)
  const { isVisible } = useMangaCensorship()

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
  } = useSearchQuery(params)

  const isAdultGate = useIsAdultGateError(error)
  const mangas = data?.pages.flatMap((page) => page.mangas) ?? []
  const visibleMangas = mangas.filter(isVisible)
  const showRefreshButton = params.get(SearchParam.SORT) === SearchSort.RANDOM
  const canAutoLoadMore = !showRefreshButton && Boolean(hasNextPage) && !isFetchNextPageError
  const showRetry = mangas.length > 0 && (isFetchNextPageError || isRefetchError)
  const hasSearchResults = mangas.length > 0

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
              window.scrollTo({ top: 0 })
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
            searchParams={params}
            showSearchFromNextButton
            variant={view}
          />
        )
      case 'native-grid-sponsor':
        return <NativeGridSponsorCard sponsor={item.sponsor} variant={view} />
    }
  }

  useTrackSearchTrendingView({
    enabled: !isLoading && !error && hasSearchResults,
    query: params.get(SearchParam.QUERY),
  })

  if (isLoading) {
    return (
      <SearchSpacer>
        <SearchResultLoading view={view} />
      </SearchSpacer>
    )
  }

  if (error) {
    if (isAdultGate) {
      return (
        <SearchSpacer>
          <AdultVerificationGate description={guardT('adultDescription')} />
        </SearchSpacer>
      )
    }

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
    <>
      <VirtualMangaGrid
        fetchNextPage={fetchNextPage}
        footer={footer}
        hasNextPage={canAutoLoadMore}
        header={header}
        items={items}
        renderItem={renderItem}
        view={view}
      />
      <ScrollButtons />
    </>
  )
}

function SearchResultLoading({ view }: { view: View }) {
  return (
    <div className={`p-2 grid ${MANGA_GRID_COLUMN[view]} gap-2 grow`}>
      {Array.from({ length: view === View.IMAGE ? 12 : 6 }).map((_, i) => (
        <MangaCardSkeleton key={i} variant={view} />
      ))}
    </div>
  )
}

function SearchSpacer({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <MobileNavigationSpacer />
    </>
  )
}
