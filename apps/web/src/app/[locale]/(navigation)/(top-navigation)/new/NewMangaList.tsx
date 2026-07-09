'use client'

import type { Manga } from '@litomi/domain/manga/model'
import type { NativeGridSponsor } from '@litomi/domain/sponsor/native-grid'

import { View } from '@litomi/std'
import { useTranslations } from 'next-intl'

import { MobileNavigationSpacer } from '@/app/[locale]/(navigation)/NavigationSpacers'
import AdultVerificationGate from '@/components/AdultVerificationGate'
import JuicyAdsBanner from '@/components/ads/juicy-ads/JuicyAdsBanner'
import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import NativeGridSponsorCard from '@/components/card/NativeGridSponsorCard'
import { insertNativeGridSponsorItem, type NativeGridSponsorItem } from '@/components/sponsor/nativeGridSponsorItem'
import LoadMoreRetryButton from '@/components/ui/LoadMoreRetryButton'
import VirtualMangaGrid from '@/components/virtual/VirtualMangaGrid'
import type { VirtualMangaGridItem } from '@/components/virtual/VirtualMangaGrid.types'
import useIsAdultGateError from '@/hook/useIsAdultGateError'
import useMangaCensorship from '@/hook/useMangaCensorship'
import { MANGA_GRID_COLUMN } from '@/utils/style'

import { useNewMangaQuery } from './useNewMangaQuery'

type LoadingItem = VirtualMangaGridItem & {
  type: 'loading'
}

type MangaItem = VirtualMangaGridItem & {
  manga: Manga
  mangaIndex: number
  type: 'manga'
}

type NewMangaItem = LoadingItem | MangaItem | NativeGridSponsorItem

type Props = {
  nativeGridSponsor?: NativeGridSponsor | null
}

export default function NewMangaList({ nativeGridSponsor }: Props) {
  const t = useTranslations('Common.manga')
  const guardT = useTranslations('Common.guard')
  const { isVisible } = useMangaCensorship()
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError } =
    useNewMangaQuery()
  const isAdultGate = useIsAdultGateError(error)

  const mangas = data?.pages.flatMap((page) => page.mangas) ?? []
  const visibleMangas = mangas.filter(isVisible)
  const canAutoLoadMore = Boolean(hasNextPage) && !isFetchNextPageError
  const showRetry = mangas.length > 0 && isFetchNextPageError

  const mangaItems = visibleMangas.map((manga, mangaIndex) => ({
    key: `manga-${manga.id}`,
    manga,
    mangaIndex,
    type: 'manga' as const,
  }))

  const items: NewMangaItem[] = insertNativeGridSponsorItem(mangaItems, nativeGridSponsor)

  if (isFetchingNextPage) {
    items.push({ key: 'loading-skeleton', type: 'loading' })
  }

  const footer = (
    <>
      {showRetry && (
        <div className="flex justify-center py-4">
          <LoadMoreRetryButton onRetry={fetchNextPage} />
        </div>
      )}
      <MobileNavigationSpacer />
    </>
  )

  function renderItem(item: NewMangaItem) {
    switch (item.type) {
      case 'loading':
        return <MangaCardSkeleton />
      case 'manga':
        return <MangaCard index={item.mangaIndex} manga={item.manga} />
      case 'native-grid-sponsor':
        return <NativeGridSponsorCard sponsor={item.sponsor} />
    }
  }

  if (isLoading) {
    return (
      <div className={`flex-1 grid ${MANGA_GRID_COLUMN.card} gap-2`}>
        {Array.from({ length: 6 }).map((_, index) => (
          <MangaCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (isAdultGate) {
    return <AdultVerificationGate description={guardT('adultDescription')} />
  }

  if (error || mangas.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-zinc-500">{t('loadError')}</p>
      </div>
    )
  }

  return (
    <VirtualMangaGrid
      fetchNextPage={fetchNextPage}
      footer={footer}
      hasNextPage={canAutoLoadMore}
      header={<JuicyAdsBanner />}
      items={items}
      renderItem={renderItem}
      view={View.CARD}
    />
  )
}
