'use client'

import { View } from '@litomi/std'

import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import useMangaCensorship from '@/hook/useMangaCensorship'
import { MANGA_GRID_COLUMN } from '@/utils/style'

import RandomMangaLink from '../RandomMangaLink'
import { useRandomMangaQuery } from './useRandomMangaQuery'

export default function RandomMangaList() {
  const { data, isLoading, error } = useRandomMangaQuery()
  const { isVisible } = useMangaCensorship()

  const mangas = data?.mangas ?? []
  const visibleMangas = mangas.filter(isVisible)

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
        {visibleMangas.map((manga, i) => (
          <MangaCard index={i} key={manga.id} manga={manga} />
        ))}
      </div>
      <div className="flex justify-center items-center">
        <RandomMangaLink timer={20} />
      </div>
    </>
  )
}
