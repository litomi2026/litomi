'use client'

import MangaCard from '@/components/card/MangaCard'
import MangaCardDonation from '@/components/card/MangaCardDonation'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

type Props = {
  rankings: RankingItem[]
}

type RankingItem = {
  mangaId: number
}

export default function RankingList({ rankings }: Props) {
  const mangaIds = rankings.map((r) => r.mangaId)
  const { mangaMap } = useMangaListCachedQuery({ mangaIds })

  return (
    <ul className={`grid ${MANGA_LIST_GRID_COLUMNS.card} gap-2 p-2`}>
      {rankings.map((ranking, i) => {
        const manga = mangaMap.get(ranking.mangaId) ?? { id: ranking.mangaId, title: '불러오는 중', images: [] }
        return <MangaCard index={i} key={ranking.mangaId} manga={manga} />
      })}
      <MangaCardDonation />
    </ul>
  )
}
