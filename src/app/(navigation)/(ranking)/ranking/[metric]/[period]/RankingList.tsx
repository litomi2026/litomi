'use client'

import { twMerge } from 'tailwind-merge'

import MangaCard from '@/components/card/MangaCard'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'

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

  return (
    <div className={twMerge(`grid gap-2 p-2`, className)}>
      {rankings.map((ranking, i) => {
        const manga = mangaMap.get(ranking.mangaId) ?? { id: ranking.mangaId, title: '불러오는 중', images: [] }
        return <MangaCard index={i} key={ranking.mangaId} manga={manga} rank={i + 1} />
      })}
    </div>
  )
}
