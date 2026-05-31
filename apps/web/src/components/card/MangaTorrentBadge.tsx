'use client'

import type { Manga } from '@litomi/domain/manga/model'

import { Magnet } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { twMerge } from 'tailwind-merge'

import { useMangaTorrentModal } from './MangaTorrentModal'

type Props = {
  manga: Manga
  className?: string
}

export default function MangaTorrentBadge({ manga, className = '' }: Props) {
  const { open } = useMangaTorrentModal()
  const t = useTranslations('Common.mangaCard.torrent')
  const torrentCount = manga.torrents?.length ?? manga.torrentCount ?? 0

  if (torrentCount <= 0) {
    return null
  }

  return (
    <button
      aria-label={t('badge', { count: torrentCount })}
      className={twMerge(
        'inline-flex items-center gap-1 rounded-lg bg-background/80 p-2 py-1 border border-zinc-700/60',
        "before:content-[''] before:absolute before:-inset-2 before:rounded-lg",
        'hover:bg-background/70 active:bg-background/80 transition',
        className,
      )}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        open(manga)
      }}
      title={t('badge', { count: torrentCount })}
      type="button"
    >
      <Magnet className="size-3 text-zinc-400" />
      <span className="tabular-nums">{torrentCount}</span>
    </button>
  )
}
