'use client'

import { Magnet } from 'lucide-react'

import type { Manga } from '@/types/manga'

import { useMangaTorrentModal } from './MangaTorrentModal'

type Props = {
  manga: Manga
  className?: string
}

export default function MangaTorrentBadge({ manga, className = '' }: Props) {
  const { open } = useMangaTorrentModal()

  const torrentCount = manga.torrents?.length ?? manga.torrentCount ?? 0

  if (torrentCount <= 0) {
    return null
  }

  return (
    <button
      aria-label={`토렌트 ${torrentCount}개 보기`}
      className={`inline-flex items-center gap-1 rounded-lg bg-background/80 p-2 py-1 border border-zinc-700/60 
        hover:bg-background/70 active:bg-background/80 transition ${className}`}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        open(manga)
      }}
      type="button"
    >
      <Magnet className="size-3 text-zinc-400" />
      <span className="tabular-nums">{torrentCount}</span>
    </button>
  )
}
