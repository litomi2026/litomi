'use client'

import { MessageCircle } from 'lucide-react'

import MangaImage from '@/components/MangaImage'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'

type Props = {
  mangaId: number
}

export default function PostMangaCard({ mangaId }: Props) {
  const { mangaMap } = useMangaListCachedQuery({ mangaIds: [mangaId] })
  const manga = mangaMap.get(mangaId)
  const title = manga?.title ?? '불러오는 중'
  const thumbnailUrl = manga?.images?.[0]?.thumbnail?.url ?? manga?.images?.[0]?.original?.url

  return (
    <>
      <MangaImage
        alt={title}
        className="w-20 h-28 object-cover rounded border-2 border-zinc-700 shrink-0"
        mangaId={mangaId}
        src={thumbnailUrl}
      />
      <div className="flex flex-col gap-2 min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <MessageCircle className="size-5 text-brand shrink-0 mt-0.5" />
          <h3 className="font-bold text-base leading-tight line-clamp-2 wrap-break-word break-all">{title}</h3>
        </div>
        <span className="text-sm text-zinc-400">작품 보기</span>
      </div>
    </>
  )
}
