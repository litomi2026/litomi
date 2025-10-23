'use client'

import { Link2 } from 'lucide-react'

import MangaCardImage from '@/components/card/MangaCardImage'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'
import { checkDefined } from '@/utils/type'

import { useMangaQuery } from '../useMangaQuery'

type Props = {
  mangaId: number
  initialRelatedIds?: number[]
}

export default function RelatedMangaSection({ mangaId, initialRelatedIds }: Props) {
  const { data: manga } = useMangaQuery(mangaId)
  const relatedIds = manga?.related ?? initialRelatedIds ?? []
  const { mangaMap } = useMangaListCachedQuery({ mangaIds: relatedIds })

  if (initialRelatedIds && relatedIds.length === 0) {
    return null
  }

  const relatedMangas = relatedIds.map((id) => mangaMap.get(id)).filter(checkDefined)

  for (const manga of relatedMangas) {
    manga.images = manga.images?.slice(0, 1)
  }

  return (
    <div className="border-b-2 p-4">
      <h3 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
        <Link2 className="size-4" />
        연관 작품
      </h3>
      <ul className="flex gap-2 overflow-x-auto scrollbar-hidden snap-x snap-mandatory">
        {relatedMangas.length > 0
          ? relatedMangas.map((manga, index) => (
              <li className="flex-shrink-0 w-32 h-48 snap-start" key={manga.id}>
                <MangaCardImage
                  className="flex items-center justify-center h-full bg-zinc-900 rounded-lg transition border-2 hover:border-zinc-600"
                  manga={manga}
                  mangaIndex={index}
                />
              </li>
            ))
          : Array.from({ length: 5 }).map((_, i) => (
              <div className="flex-shrink-0 w-32 h-48 rounded-lg bg-zinc-800 animate-pulse" key={i} />
            ))}
      </ul>
    </div>
  )
}
