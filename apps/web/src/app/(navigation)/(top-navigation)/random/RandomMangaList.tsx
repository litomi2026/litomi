'use client'

import type { NativeGridSponsor } from '@litomi/contracts'

import { View } from '@litomi/std'

import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import NativeGridSponsorCard from '@/components/card/NativeGridSponsorCard'
import { insertNativeGridSponsorItem } from '@/components/sponsor/nativeGridSponsorItem'
import useMangaCensorship from '@/hook/useMangaCensorship'
import { MANGA_GRID_COLUMN } from '@/utils/style'

import RandomMangaLink from '../RandomMangaLink'
import { useRandomMangaQuery } from './useRandomMangaQuery'

type Props = {
  nativeGridSponsor?: NativeGridSponsor | null
}

export default function RandomMangaList({ nativeGridSponsor }: Props) {
  const { data, isLoading, error } = useRandomMangaQuery()
  const { isVisible } = useMangaCensorship()

  const mangas = data?.mangas ?? []
  const visibleMangas = mangas.filter(isVisible)

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

  if (error || mangas.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-zinc-500">작품을 불러올 수 없어요</p>
      </div>
    )
  }

  return (
    <>
      <div className={`flex-1 grid ${MANGA_GRID_COLUMN[View.CARD]} gap-2`}>
        {items.map((item) => {
          if (item.type === 'native-grid-sponsor') {
            return <NativeGridSponsorCard key={item.key} sponsor={item.sponsor} />
          }

          return <MangaCard index={item.mangaIndex} key={item.key} manga={item.manga} />
        })}
      </div>
      <div className="flex justify-center items-center">
        <RandomMangaLink timer={20} />
      </div>
    </>
  )
}
