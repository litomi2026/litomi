'use client'

import type { NativeGridSponsor } from '@litomi/domain/sponsor/native-grid'

import { useTranslations } from 'next-intl'

import AdultVerificationGate from '@/components/AdultVerificationGate'
import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import MangaCardDonation from '@/components/card/MangaCardDonation'
import NativeGridSponsorCard from '@/components/card/NativeGridSponsorCard'
import { insertNativeGridSponsorItem } from '@/components/sponsor/nativeGridSponsorItem'
import useMangaCensorship from '@/hook/useMangaCensorship'
import { isAdultVerificationRequiredError } from '@/utils/adult-verification-error'
import { MANGA_GRID_COLUMN } from '@/utils/style'

import { useNewMangaQuery } from './useNewMangaQuery'

type Props = {
  nativeGridSponsor?: NativeGridSponsor | null
  page: number
}

export default function NewMangaList({ nativeGridSponsor, page }: Props) {
  const { data: mangas, isLoading, error } = useNewMangaQuery({ page })
  const { isVisible } = useMangaCensorship()
  const t = useTranslations('Common.manga')
  const guardT = useTranslations('Common.guard')
  const visibleMangas = mangas?.filter(isVisible) ?? []

  const mangaItems = visibleMangas.map((manga, mangaIndex) => ({
    key: `manga-${manga.id}`,
    manga,
    mangaIndex,
    type: 'manga' as const,
  }))

  const items = insertNativeGridSponsorItem(mangaItems, nativeGridSponsor)

  if (isLoading) {
    return (
      <div className={`flex-1 grid ${MANGA_GRID_COLUMN.card} gap-2`}>
        <MangaCardSkeleton />
        <MangaCardSkeleton />
        <MangaCardSkeleton />
        <MangaCardSkeleton />
        <MangaCardSkeleton />
        <MangaCardSkeleton />
      </div>
    )
  }

  if (isAdultVerificationRequiredError(error)) {
    return <AdultVerificationGate description={guardT('adultVerificationDescription')} />
  }

  if (error || !mangas || mangas.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-zinc-500">{t('loadError')}</p>
      </div>
    )
  }

  return (
    <div className={`flex-1 grid ${MANGA_GRID_COLUMN.card} gap-2`}>
      {items.map((item) => {
        if (item.type === 'native-grid-sponsor') {
          return <NativeGridSponsorCard key={item.key} sponsor={item.sponsor} />
        }

        return <MangaCard index={item.mangaIndex} key={item.key} manga={item.manga} />
      })}
      <MangaCardDonation />
    </div>
  )
}
