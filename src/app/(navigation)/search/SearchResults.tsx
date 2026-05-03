'use client'

import type { ReactNode } from 'react'

import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'

import type { VirtualMangaGridItem } from '@/components/virtual/VirtualMangaGrid.types'
import type { KeywordPromotion } from '@/sponsor'
import type { Manga } from '@/types/manga'

import { useSearchQuery } from '@/app/(navigation)/search/useSearchQuery'
import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import MangaCardPromotion from '@/components/card/MangaCardPromotion'
import LoadMoreRetryButton from '@/components/ui/LoadMoreRetryButton'
import VirtualMangaGrid from '@/components/virtual/VirtualMangaGrid'
import { getViewFromSearchParams, View } from '@/utils/param'
import { ProblemDetailsError } from '@/utils/react-query-error'
import { MANGA_GRID_COLUMN } from '@/utils/style'

import RandomRefreshButton from '../(top-navigation)/RandomRefreshButton'
import { useNavigationAutoHideScrollElement } from '../navigationAutoHide'
import { SearchHeaderSpacer, SearchMobileNavigationSpacer } from './SearchScrollSpacers'

const Error400 = dynamic(() => import('./Error400'))
const SearchResultError = dynamic(() => import('./SearchResultError'))

type Props = {
  header?: ReactNode
}

type SearchResultItem =
  | (VirtualMangaGridItem & {
      manga: Manga
      mangaIndex: number
      type: 'manga'
    })
  | (VirtualMangaGridItem & {
      promotion: KeywordPromotion
      type: 'promotion'
    })
  | (VirtualMangaGridItem & {
      type: 'loading'
    })

export default function SearchResult({ header }: Props) {
  const searchParams = useSearchParams()
  const view = getViewFromSearchParams(searchParams)
  const [scrollToTopSignal, setScrollToTopSignal] = useState(0)
  const setNavigationAutoHideScrollElement = useNavigationAutoHideScrollElement()

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

  const mangas = useMemo(() => data?.pages.flatMap((page) => page.mangas) ?? [], [data])
  const promotion = useMemo(() => data?.pages[0]?.promotion, [data])

  const measurementKey = searchParams.toString() || 'default'
  const showRefreshButton = searchParams.get('sort') === 'random'
  const canAutoLoadMore = !showRefreshButton && Boolean(hasNextPage) && !isFetchNextPageError

  const items = useMemo<SearchResultItem[]>(() => {
    const nextItems: SearchResultItem[] = []
    const shouldShowPromotion = view === View.CARD && promotion

    for (const [mangaIndex, manga] of mangas.entries()) {
      if (shouldShowPromotion && mangaIndex === (promotion.position ?? 0)) {
        nextItems.push({
          key: `promotion-${promotion.id}`,
          promotion,
          type: 'promotion',
        })
      }

      nextItems.push({
        key: `manga-${manga.id}`,
        manga,
        mangaIndex,
        type: 'manga',
      })
    }

    if (isFetchingNextPage) {
      nextItems.push({
        key: 'loading-skeleton',
        type: 'loading',
      })
    }

    return nextItems
  }, [isFetchingNextPage, mangas, promotion, view])

  const renderItem = useCallback(
    (item: SearchResultItem) => {
      switch (item.type) {
        case 'loading':
          return <MangaCardSkeleton variant={view} />
        case 'manga':
          return (
            <MangaCard
              index={item.mangaIndex}
              manga={item.manga}
              showSearchFromNextButton={view === View.CARD}
              variant={view}
            />
          )
        case 'promotion':
          return <MangaCardPromotion promotion={item.promotion} />
      }
    },
    [view],
  )

  const headerWithSpacer = useMemo(
    () => (
      <>
        <SearchHeaderSpacer />
        {header}
      </>
    ),
    [header],
  )

  const footer = useMemo(() => {
    const showRetry = mangas.length > 0 && (isFetchNextPageError || isRefetchError)
    const showAnyFooterAction = showRetry || showRefreshButton

    if (!showAnyFooterAction) {
      return <div aria-hidden className="hidden h-4 sm:block" />
    }

    return (
      <div className="flex flex-col items-center gap-2 py-4">
        {showRetry && <LoadMoreRetryButton onRetry={isFetchNextPageError ? fetchNextPage : refetch} />}
        {showRefreshButton && (
          <RandomRefreshButton
            className="flex gap-1 items-center border-2 px-3 p-2 rounded-xl transition"
            isLoading={isRefetching}
            onClick={async () => {
              await refetch()
              setScrollToTopSignal((value) => value + 1)
            }}
            timer={1}
          />
        )}
      </div>
    )
  }, [fetchNextPage, isFetchNextPageError, isRefetchError, isRefetching, mangas.length, refetch, showRefreshButton])

  const footerWithSpacer = useMemo(
    () => (
      <>
        {footer}
        <SearchMobileNavigationSpacer />
      </>
    ),
    [footer],
  )

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
          <p className="text-zinc-500">검색 결과가 없습니다.</p>
        </div>
      </SearchSpacer>
    )
  }

  return (
    <VirtualMangaGrid
      fetchNextPage={fetchNextPage}
      footer={footerWithSpacer}
      hasNextPage={canAutoLoadMore}
      header={headerWithSpacer}
      isFetchingNextPage={isFetchingNextPage}
      items={items}
      measurementKey={measurementKey}
      onScrollElementChange={setNavigationAutoHideScrollElement}
      renderItem={renderItem}
      scrollToTopSignal={scrollToTopSignal}
      view={view}
    />
  )
}

export function SearchResultLoading({ view }: { view: View }) {
  return (
    <SearchSpacer>
      <div className={`py-2 grid ${MANGA_GRID_COLUMN[view]} gap-2 grow`}>
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
      <SearchMobileNavigationSpacer />
    </>
  )
}
