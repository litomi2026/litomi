'use client'

import dayjs from 'dayjs'

import { Manga } from '@/types/manga'

type Props = {
  manga: Manga
}

// NOTE: 클라이언트에서 렌더링해야 로컬 기기 시간으로 표시됨
export default function MangaCardDate({ manga }: Readonly<Props>) {
  return <div className="text-zinc-400">{dayjs(manga.date).format('YYYY-MM-DD HH:mm')}</div>
}
