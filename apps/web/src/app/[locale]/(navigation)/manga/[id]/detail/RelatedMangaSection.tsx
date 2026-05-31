'use client'

import { Link2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'

import MangaCardList from './MangaCardList'

type Props = {
  mangaId: number
}

export default function RelatedMangaSection({ mangaId }: Props) {
  const { mangaMap } = useMangaListCachedQuery({ mangaIds: [mangaId] })
  const t = useTranslations('MangaViewer.detail')

  const manga = mangaMap.get(mangaId)
  const relatedIds = manga?.related ?? []

  if (relatedIds.length === 0) {
    return null
  }

  return (
    <div className="border-b p-4">
      <h3 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
        <Link2 className="size-4" />
        {t('relatedTitle')}
      </h3>
      <MangaCardList mangaIds={relatedIds.toReversed()} />
    </div>
  )
}
