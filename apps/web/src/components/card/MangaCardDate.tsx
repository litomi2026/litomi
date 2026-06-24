'use client'

import type { Manga } from '@litomi/domain/manga/model'
import { formatDistanceToNow } from '@litomi/std'
import dayjs from 'dayjs'
import { useLocale } from 'next-intl'

type Props = {
  manga: Manga
}

// NOTE: 클라이언트에서 렌더링해야 로컬 기기 시간으로 표시됨
export default function MangaCardDate({ manga }: Props) {
  const locale = useLocale()

  if (!manga.date) {
    return null
  }

  return (
    <div className="text-zinc-400" title={dayjs(manga.date).format('YYYY-MM-DD HH:mm')}>
      {formatDistanceToNow(new Date(manga.date), locale)}
    </div>
  )
}
