'use client'

import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import MangaCardDonation from '@/components/card/MangaCardDonation'
import { View } from '@/utils/param'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

import RandomMangaLink from '../RandomMangaLink'
import { useRandomMangaQuery } from './useRandomMangaQuery'

export default function RandomMangaList() {
  const { data, isLoading, error } = useRandomMangaQuery()
  const mangas = data?.mangas ?? []

  if (isLoading) {
    return (
      <ul className={`flex-1 grid ${MANGA_LIST_GRID_COLUMNS.card} gap-2`}>
        <MangaCardSkeleton />
        <MangaCardSkeleton />
        <MangaCardSkeleton />
        <MangaCardSkeleton />
        <MangaCardSkeleton />
        <MangaCardSkeleton />
      </ul>
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
      <div className="flex-1">
        <ul className={`grid ${MANGA_LIST_GRID_COLUMNS[View.CARD]} gap-2`}>
          {mangas.map((manga, i) => (
            <MangaCard index={i} key={manga.id} manga={manga} />
          ))}
          <MangaCardDonation />
        </ul>
      </div>
      <div className="flex justify-center items-center">
        <RandomMangaLink timer={20} />
      </div>
    </>
  )
}
