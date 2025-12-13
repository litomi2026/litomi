'use client'

import { Link2 } from 'lucide-react'

import { useMangaQuery } from '@/app/manga/[id]/useMangaQuery'

import MangaCardList from './MangaCardList'

type Props = {
  mangaId: number
}

export default function RelatedMangaSection({ mangaId }: Props) {
  const { data: manga } = useMangaQuery(mangaId)
  const relatedIds = manga?.related ?? []

  if (relatedIds.length === 0) {
    return null
  }

  return (
    <div className="border-b-2 p-4">
      <h3 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
        <Link2 className="size-4" />
        이런 작품 찾으세요?
      </h3>
      <MangaCardList mangaIds={relatedIds} />
    </div>
  )
}
