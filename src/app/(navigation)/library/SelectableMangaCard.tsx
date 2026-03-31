'use client'

import { Check } from 'lucide-react'

import MangaCard from '@/components/card/MangaCard'
import { Manga } from '@/types/manga'
import { View } from '@/utils/param'

import CensoredManga from './CensoredManga'
import { useLibrarySelection } from './librarySelection'

type Props = {
  index: number
  manga: Manga
  variant: View
}

export default function SelectableMangaCard({ index, manga, variant }: Readonly<Props>) {
  const { selectedIds, toggle } = useLibrarySelection()
  const isSelected = selectedIds.has(manga.id)

  return (
    <div
      aria-selected={isSelected}
      className="relative select-none cursor-pointer aria-selected:ring-2 aria-selected:ring-brand rounded-xl overflow-hidden"
      onClick={() => toggle(manga.id)}
    >
      <CensoredManga className="pointer-events-none" mangaId={manga.id} />
      <div className="absolute top-2 left-2 z-10 size-5 flex items-center justify-center rounded border-2 border-white bg-zinc-900/80">
        {isSelected && <Check className="size-4" />}
      </div>
      <MangaCard className="h-full pointer-events-none" index={index} manga={manga} variant={variant} />
    </div>
  )
}
