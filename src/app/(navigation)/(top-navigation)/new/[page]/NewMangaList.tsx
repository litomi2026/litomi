'use client'

import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import MangaCardDonation from '@/components/card/MangaCardDonation'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

import { useNewMangaQuery } from './useNewMangaQuery'

type Props = {
  page: number
}

export default function NewMangaList({ page }: Props) {
  const { data: mangas, isLoading, error } = useNewMangaQuery({ page })

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

  if (error || !mangas || mangas.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-zinc-500">작품을 불러올 수 없어요</p>
      </div>
    )
  }

  return (
    <div className="flex-1">
      <ul className={`grid ${MANGA_LIST_GRID_COLUMNS.card} gap-2`}>
        {mangas.map((manga, i) => (
          <MangaCard index={i} key={manga.id} manga={manga} />
        ))}
        <MangaCardDonation />
      </ul>
    </div>
  )
}
