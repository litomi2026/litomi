'use client'

import { twMerge } from 'tailwind-merge'

import MangaCard from '@/components/card/MangaCard'
import useMangaCensorship from '@/hook/useMangaCensorship'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'
import { createLoadingManga } from '@/utils/manga-placeholder'

type Props = {
  className?: string
  rankings: RankingItem[]
}

type RankingItem = {
  mangaId: number
}

export default function RankingList({ className, rankings }: Props) {
  const mangaIds = rankings.map((r) => r.mangaId)
  const { mangaMap } = useMangaListCachedQuery({ mangaIds })
  const { isVisible } = useMangaCensorship()
  const visibleRankings = rankings.filter((ranking) => isVisible(mangaMap.get(ranking.mangaId)))

  return (
    <div className={twMerge(`grid gap-2 p-2`, className)}>
      {visibleRankings.map((ranking, i) => {
        const manga = mangaMap.get(ranking.mangaId) ?? createLoadingManga(ranking.mangaId)

        return <MangaCard index={i} key={ranking.mangaId} manga={manga} rank={i + 1} />
      })}
    </div>
  )
}
