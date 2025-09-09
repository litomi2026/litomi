'use client'

import MangaCard from '@/components/card/MangaCard'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'

import { useMangaQuery } from '../useMangaQuery'

type Props = {
  mangaId: number
}

export default function RelatedMangaSection({ mangaId }: Props) {
  const { data: manga } = useMangaQuery(mangaId)
  const { mangaMap } = useMangaListCachedQuery({ mangaIds: manga?.related ?? [] })

  return (
    <div>
      <h3>히토미 연관 작품</h3>
      <ul className="flex gap-2 overflow-x-auto pb-4">
        {manga?.related?.map((mangaId, index) => {
          const manga = mangaMap.get(mangaId) ?? { id: mangaId, title: '불러오는 중', images: [] }
          return <MangaCard className="min-w-48" index={index} key={mangaId} manga={manga} />
        })}
      </ul>
    </div>
  )
}
