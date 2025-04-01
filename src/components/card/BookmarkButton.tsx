'use client'

import { Manga } from '@/types/manga'

import IconBookmark from '../icons/IconBookmark'

type Props = {
  manga: Manga
}

export default function BookmarkButton({ manga }: Props) {
  return (
    <button
      className="flex items-center gap-1 border-2 w-fit border-zinc-800 rounded-lg p-1 px-2 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-900 transition"
      disabled
    >
      <IconBookmark className="w-5" />
      <span className="hidden md:block">북마크</span>
    </button>
  )
}
