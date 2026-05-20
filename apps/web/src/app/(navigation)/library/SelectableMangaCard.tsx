'use client'

import { Manga } from '@litomi/domain/types/manga'
import { View } from '@litomi/std'
import { Check } from 'lucide-react'
import { twMerge } from 'tailwind-merge'

import MangaCard from '@/components/card/MangaCard'

import { useLibrarySelection } from './librarySelection'

type Props = {
  className?: string
  index: number
  manga: Manga
  variant: View
}

export default function SelectableMangaCard({ className, index, manga, variant }: Props) {
  const { selectedIds, toggle } = useLibrarySelection()
  const isSelected = selectedIds.has(manga.id)

  return (
    <div
      aria-selected={isSelected}
      className={twMerge(
        'relative select-none cursor-pointer aria-selected:ring-2 aria-selected:ring-brand rounded-xl overflow-hidden',
        className,
      )}
      onClick={() => toggle(manga.id)}
    >
      <div className="absolute top-2 left-2 z-10 size-5 flex items-center justify-center rounded border-2 border-white bg-zinc-900/80">
        {isSelected && <Check className="size-4" />}
      </div>
      <MangaCard className="h-full pointer-events-none" index={index} manga={manga} variant={variant} />
    </div>
  )
}
