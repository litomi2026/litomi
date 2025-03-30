'use client'

import { Manga } from '@/types/manga'

import IconBookmark from '../icons/IconBookmark'

type Props = {
  manga: Manga
}

export default function BookmarkButton({ manga }: Props) {
  return (
    <button
      className="border-2 w-fit border-zinc-800 rounded-lg p-1 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-900 transition
        disabled:bg-zinc-800 disabled:pointer-events-none disabled:text-zinc-500"
      disabled
    >
      <IconBookmark className="w-6" />
    </button>
  )
}
