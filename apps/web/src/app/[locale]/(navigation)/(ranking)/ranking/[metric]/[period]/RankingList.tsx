'use client'

import type { Manga } from '@litomi/domain/manga/model'
import type { NativeGridSponsor } from '@litomi/domain/sponsor/native-grid'

import { twMerge } from 'tailwind-merge'

import MangaCard from '@/components/card/MangaCard'
import NativeGridSponsorCard from '@/components/card/NativeGridSponsorCard'
import { insertNativeGridSponsorItem } from '@/components/sponsor/nativeGridSponsorItem'
import useMangaCensorship from '@/hook/useMangaCensorship'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'
import { createLoadingManga } from '@/utils/manga-placeholder'

type Props = {
  className?: string
  nativeGridSponsor?: NativeGridSponsor | null
  rankings: RankingItem[]
}

type RankingItem = {
  manga?: Manga
  mangaId: number
}

export default function RankingList({ className, nativeGridSponsor, rankings }: Props) {
  const mangaIds = rankings.map((r) => r.mangaId)

  const { mangaMap } = useMangaListCachedQuery({
    mangaIds,
    catalogMangas: rankings.map(({ manga }) => manga),
  })

  const { isVisible } = useMangaCensorship()
  const visibleRankings = rankings.filter((ranking) => isVisible(mangaMap.get(ranking.mangaId)))

  const mangaItems = visibleRankings.map((ranking, mangaIndex) => ({
    key: `manga-${ranking.mangaId}`,
    mangaId: ranking.mangaId,
    mangaIndex,
    rank: mangaIndex + 1,
    type: 'manga' as const,
  }))

  const items = insertNativeGridSponsorItem(mangaItems, nativeGridSponsor)

  return (
    <div className={twMerge(`grid gap-2 p-2`, className)}>
      {items.map((item) => {
        if (item.type === 'native-grid-sponsor') {
          return <NativeGridSponsorCard key={item.key} sponsor={item.sponsor} />
        }

        const manga = mangaMap.get(item.mangaId) ?? createLoadingManga(item.mangaId)

        return <MangaCard index={item.mangaIndex} key={item.key} manga={manga} rank={item.rank} />
      })}
    </div>
  )
}
