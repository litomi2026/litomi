'use client'

import MangaCardImage from '@/components/card/MangaCardImage'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'
import { View } from '@/utils/param'

type Props = {
  mangaIds: number[]
}

export default function MangaCardList({ mangaIds }: Props) {
  const { mangaMap } = useMangaListCachedQuery({ mangaIds })

  return (
    <ul className="flex gap-2 overflow-x-auto scrollbar-hidden snap-x snap-mandatory">
      {mangaIds.map((id, index) => {
        const manga = mangaMap.get(id)

        if (!manga) {
          return (
            <li className="shrink-0 w-32 snap-start" key={id}>
              <div className="aspect-5/7 rounded-lg bg-zinc-800 animate-pulse" />
            </li>
          )
        }

        const mangaCard = manga.images ? { ...manga, images: manga.images.slice(0, 1) } : manga

        return (
          <li className="shrink-0 w-32 snap-start" key={manga.id}>
            <MangaCardImage
              className="w-full bg-zinc-900 rounded-lg transition border-2 hover:border-zinc-600"
              manga={mangaCard}
              mangaIndex={index}
              variant={View.IMAGE}
            />
          </li>
        )
      })}
    </ul>
  )
}
