'use client'

import type { Manga } from '@litomi/domain/manga/model'
import { formatDistanceToNow } from '@litomi/std'
import dayjs from 'dayjs'
import { useLocale } from 'next-intl'
import { useEffect, useState } from 'react'

type Props = {
  manga: Manga
}

// NOTE: 클라이언트에서 렌더링해야 로컬 기기 시간으로 표시됨
export default function MangaCardDate({ manga }: Props) {
  const [relativeTime, setRelativeTime] = useState<string | null>(null)
  const locale = useLocale()

  useEffect(() => {
    if (manga.date) {
      setRelativeTime(formatDistanceToNow(new Date(manga.date), locale))
    }
  }, [manga.date, locale])

  if (!manga.date) {
    return null
  }

  return (
    <div className="text-zinc-400" title={dayjs(manga.date).format('YYYY-MM-DD HH:mm')}>
      {relativeTime}
    </div>
  )
}
