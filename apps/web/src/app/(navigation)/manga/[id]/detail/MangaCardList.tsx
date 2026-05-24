'use client'

import type { Manga } from '@litomi/domain/manga/model'

import { View } from '@litomi/std'

import MangaCardImage from '@/components/card/MangaCardImage'
import useMangaCensorship from '@/hook/useMangaCensorship'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'

type Props = {
  catalogMangas?: readonly (Manga | undefined)[]
  mangaIds: number[]
}

export default function MangaCardList({ catalogMangas, mangaIds }: Props) {
  const { mangaMap } = useMangaListCachedQuery({ catalogMangas, mangaIds })
  const { isVisible } = useMangaCensorship()
  const visibleMangaIds = mangaIds.filter((id) => isVisible(mangaMap.get(id)))

  return (
    <ul className="flex gap-2 overflow-x-auto scrollbar-hidden snap-x snap-mandatory">
      {visibleMangaIds.map((id, index) => {
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
